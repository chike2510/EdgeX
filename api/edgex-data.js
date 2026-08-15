// EdgeX V2 data-layer helpers for serverless handlers.
// These helpers keep provider-specific payloads out of the UI and avoid inventing values.

const cache = new Map();

export function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value);
  return Promise.resolve(loader()).then(value => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  });
}

export function safeNumber(value) {
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

export function buildAIContext(input = {}) {
  return {
    domain: input.domain || 'unknown',
    subject: input.subject || null,
    data: input.data || {},
    uncertainty: input.uncertainty || ['Provider coverage may be incomplete.'],
    dataQuality: input.dataQuality || 'unknown',
    instruction: 'Return NO EDGE or INSUFFICIENT DATA when evidence is incomplete. Never invent statistics, lines, probabilities, or confidence.'
  };
}
