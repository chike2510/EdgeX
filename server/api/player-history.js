import { sportApiProvider } from '../../.generated/server/historical/sportapi.js';
import { cached } from './edgex-data.js';
import { allowRateLimit, isSameOriginRequest } from './proxy-guards.js';

const MAX_ARCHIVE = 12;
const MAX_PAGES = 2;
const CACHE_SECONDS = 300;
const ALLOWED_METRICS = new Set(['saves', 'shots', 'shotsOnTarget', 'goals', 'assists', 'tackles', 'fouls', 'passes']);

function text(value, maxLength = 120) {
  return typeof value === 'string' && value.trim() && value.length <= maxLength ? value.trim() : null;
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalized(value) {
  return String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function metricValue(player, names) {
  const stats = player?.statistics || {};
  const entries = Object.entries(stats);
  for (const name of names) {
    const direct = numeric(stats[name]);
    if (direct !== null) return direct;
    const match = entries.find(([key]) => normalized(key).replace(/[^a-z0-9]/g, '') === normalized(name).replace(/[^a-z0-9]/g, ''));
    if (match) return numeric(match[1]);
  }
  return null;
}

function playerMatches(candidate, { playerId, playerName }) {
  if (playerId && String(candidate?.id || '') === String(playerId)) return true;
  return Boolean(playerName && normalized(candidate?.name) === normalized(playerName));
}

function evidenceFor({ currentLineup, appearances, minutesKnown, metricCount }) {
  if (currentLineup === 'pending') return 'LINEUP_PENDING';
  if (appearances >= 8 && minutesKnown >= 5 && metricCount >= 5) return 'SUPPORTED';
  return 'INSUFFICIENT_DATA';
}

async function collectHistory({ teamId, playerId, playerName, eventId, metric }) {
  const fixtures = [];
  for (let page = 0; page < MAX_PAGES && fixtures.length < MAX_ARCHIVE; page += 1) {
    const result = await sportApiProvider.getTeamHistory(teamId, { page });
    if (!result.data.length) break;
    fixtures.push(...result.data.filter((fixture) => fixture.completed && fixture.score?.verified));
  }

  const unique = [...new Map(fixtures.map((fixture) => [fixture.providerEventId, fixture])).values()].slice(0, MAX_ARCHIVE);
  const appearances = [];
  let currentLineup = eventId ? 'pending' : 'unknown';

  for (const fixture of unique) {
    const lineupResult = await sportApiProvider.getLineups(fixture.providerEventId);
    const allPlayers = [...lineupResult.data.home, ...lineupResult.data.away];
    const player = allPlayers.find((candidate) => playerMatches(candidate, { playerId, playerName }));
    if (!player) continue;

    const isHome = fixture.homeTeam.id === teamId;
    const teamPlayers = isHome ? lineupResult.data.home : lineupResult.data.away;
    const teamPlayer = teamPlayers.find((candidate) => playerMatches(candidate, { playerId, playerName })) || player;
    const minutes = numeric(teamPlayer.minutes);
    const metricNames = {
      saves: ['saves', 'goalkeeperSaves', 'keeperSaves'],
      shots: ['shots', 'totalShots'],
      shotsOnTarget: ['shotsOnTarget', 'shotsOnGoal'],
      goals: ['goals', 'goalsScored'],
      assists: ['assists'],
      tackles: ['tackles', 'totalTackles'],
      fouls: ['fouls', 'foulsCommitted'],
      passes: ['passes', 'totalPasses'],
    }[metric] || [metric];
    let value = metricValue(teamPlayer, metricNames);

    if (value === null && metric === 'shots') {
      const shotmap = await sportApiProvider.getShotmap(fixture.providerEventId, teamId);
      value = shotmap.data.shots.filter((shot) => (playerId && String(shot.playerId) === String(playerId)) || (playerName && normalized(shot.playerName) === normalized(playerName))).length;
    }

    appearances.push({
      eventId: fixture.providerEventId,
      date: fixture.kickoff,
      opponent: isHome ? fixture.awayTeam.name : fixture.homeTeam.name,
      homeAway: isHome ? 'home' : 'away',
      score: isHome ? `${fixture.score.home ?? '—'}-${fixture.score.away ?? '—'}` : `${fixture.score.away ?? '—'}-${fixture.score.home ?? '—'}`,
      started: teamPlayer.starter === true,
      substitute: teamPlayer.substitute === true,
      minutes,
      value,
      position: teamPlayer.position || null,
      status: teamPlayer.status || null,
    });

    if (eventId && fixture.providerEventId === String(eventId)) currentLineup = teamPlayer ? 'confirmed' : lineupResult.data.published ? 'not-listed' : 'pending';
  }

  const values = appearances.map((item) => item.value).filter((value) => value !== null);
  const minutes = appearances.map((item) => item.minutes).filter((value) => value !== null);
  const metricCount = values.length;
  const evidenceState = evidenceFor({ currentLineup, appearances: appearances.length, minutesKnown: minutes.length, metricCount });
  return {
    player: { id: playerId || null, name: playerName || appearances[0]?.playerName || null, teamId },
    metric,
    archiveSize: unique.length,
    appearances: appearances.slice(0, 15),
    distribution: {
      count: values.length,
      values,
      total: values.reduce((sum, value) => sum + value, 0),
      average: values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null,
      maximum: values.length ? Math.max(...values) : null,
      minimum: values.length ? Math.min(...values) : null,
      minutesKnown: minutes.length,
      averageMinutes: minutes.length ? Number((minutes.reduce((sum, value) => sum + value, 0) / minutes.length).toFixed(1)) : null,
    },
    evidenceState,
    evidence: {
      sampleSize: appearances.length,
      metricSample: metricCount,
      minutesSample: minutes.length,
      currentLineup,
      windowLimit: 15,
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers?.origin && !isSameOriginRequest(req)) return res.status(403).json({ error: 'Same-origin requests only' });
  if (!allowRateLimit(req, 'player-history', 10, 60_000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Request limit reached. Please try again shortly.' });
  }

  const query = req.query || {};
  const teamId = text(query.teamId, 80);
  const playerId = text(query.playerId, 80);
  const playerName = text(query.playerName, 120);
  const eventId = text(query.eventId, 80);
  const metric = text(query.metric, 40) || 'saves';
  if (!teamId || (!playerId && !playerName)) return res.status(400).json({ error: 'teamId and playerId or playerName are required' });
  if (!ALLOWED_METRICS.has(metric)) return res.status(400).json({ error: 'Unsupported player metric.' });

  try {
    const cacheKey = `player-history:${teamId}:${playerId || normalized(playerName)}:${eventId || 'no-event'}:${metric}`;
    const data = await cached(cacheKey, CACHE_SECONDS * 1000, () => collectHistory({ teamId, playerId, playerName, eventId, metric }));
    const dataQuality = data.evidenceState === 'SUPPORTED' ? 'supported' : data.evidence.sampleSize === 0 ? 'unavailable' : 'partial';
    return res.status(200).json({ data, dataQuality, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[EdgeX player-history] provider failure', error?.name || 'Error');
    return res.status(503).json({ error: 'Player history unavailable', dataQuality: 'unavailable', data: null });
  }
}
