// Shared server-side data utilities for Vercel API handlers.
// These helpers keep provider payloads out of the UI and never invent missing values.

const cache = new Map();
const providerHealth = new Map();
const cacheCounters = { hits: 0, misses: 0, coalesced: 0, loads: 0, failures: 0, evictions: 0 };
const MAX_CACHE_ENTRIES = 256;

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (!entry.pending && entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
    cacheCounters.evictions += 1;
  }
}

export function cached(key, ttlMs, loader) {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing?.expiresAt > now) {
    cacheCounters.hits += 1;
    return Promise.resolve(existing.value);
  }
  if (existing?.pending) {
    cacheCounters.coalesced += 1;
    return existing.pending;
  }

  cacheCounters.misses += 1;
  const entry = existing || { value: undefined, expiresAt: 0, pending: null };
  entry.expiresAt = 0;
  entry.pending = Promise.resolve().then(loader).then(value => {
    cacheCounters.loads += 1;
    entry.value = value;
    entry.expiresAt = Date.now() + Math.max(0, Number(ttlMs) || 0);
    entry.pending = null;
    cache.set(key, entry);
    pruneCache();
    return value;
  }).catch(error => {
    cacheCounters.failures += 1;
    cache.delete(key);
    throw error;
  });
  cache.set(key, entry);
  pruneCache();
  return entry.pending;
}

export function getCacheStats() {
  const now = Date.now();
  let freshEntries = 0;
  let pendingEntries = 0;
  for (const entry of cache.values()) {
    if (entry.pending) pendingEntries += 1;
    if (entry.expiresAt > now) freshEntries += 1;
  }
  return { ...cacheCounters, entries: cache.size, freshEntries, pendingEntries, maxEntries: MAX_CACHE_ENTRIES };
}

export function recordProviderHealth(name, update = {}) {
  if (!name || typeof name !== 'string') return;
  const previous = providerHealth.get(name) || { status: 'not-checked', lastSuccessAt: null, lastFailureAt: null, latencyMs: null };
  const status = update.status || previous.status;
  const next = { ...previous, status, checkedAt: new Date().toISOString() };
  if (Number.isFinite(update.latencyMs)) next.latencyMs = update.latencyMs;
  if (status === 'available' || status === 'partial') next.lastSuccessAt = next.checkedAt;
  if (status === 'unavailable') next.lastFailureAt = next.checkedAt;
  providerHealth.set(name, next);
}

export function getProviderHealth() {
  return Object.fromEntries([...providerHealth.entries()].map(([name, state]) => [name, { ...state }]));
}

export function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeFixture(event = {}, context = {}) {
  const competitions = event.competitions || [];
  const competition = competitions[0]?.competition || {};
  const competitors = competitions[0]?.competitors || [];
  const home = competitors.find(item => item.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find(item => item.homeAway === 'away') || competitors[1] || {};
  return {
    id: event.id || null,
    provider: 'espn',
    competition: competition.name || context.competition || null,
    status: event.status?.type?.name || null,
    startTime: event.date || null,
    home: { id: home.team?.id || null, name: home.team?.displayName || null, score: safeNumber(home.score) },
    away: { id: away.team?.id || null, name: away.team?.displayName || null, score: safeNumber(away.score) },
    venue: competitions[0]?.venue?.fullName || null,
    sourceTimestamp: new Date().toISOString()
  };
}
