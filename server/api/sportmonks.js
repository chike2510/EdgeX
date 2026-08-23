const API = 'https://api.sportmonks.com/v3/football';
const CACHE_TTL_MS = 300_000;
const cache = new Map();

function text(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function id(value) { return value === null || value === undefined || value === '' ? null : String(value); }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function token() { return process.env.SPORTMONKS_API_TOKEN || ''; }
async function request(path) {
  const apiToken = token();
  if (!apiToken) return { status: 'unauthorized', data: null, error: { code: 'AUTH_REQUIRED', message: 'Sportmonks token is not configured' } };
  const key = path;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { status: 'available', data: hit.data, cached: true };
  const response = await fetch(`${API}${path}${path.includes('?') ? '&' : '?'}api_token=${encodeURIComponent(apiToken)}`, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' } });
  const raw = await response.text();
  let body = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { return { status: 'unavailable', data: null, error: { code: 'INVALID_JSON', message: 'Sportmonks returned invalid JSON' } }; }
  if (!response.ok) return { status: response.status === 429 ? 'rate-limited' : response.status === 401 || response.status === 403 ? 'unauthorized' : 'unavailable', data: null, error: { code: `HTTP_${response.status}`, message: String(body?.message || body?.error?.message || `Sportmonks returned ${response.status}`), httpStatus: response.status } };
  cache.set(key, { at: Date.now(), data: body });
  return { status: 'available', data: body, cached: false };
}
function statisticRows(raw) {
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.statistics) ? raw.statistics : [];
  return rows.flatMap(season => Array.isArray(season?.details) ? season.details : [season]).map(row => ({
    typeId: number(row?.type_id ?? row?.typeId), name: text(row?.type?.name ?? row?.name), value: number(row?.value ?? row?.data?.value), seasonId: number(row?.season_id ?? row?.seasonId),
  })).filter(row => row.name || row.typeId != null);
}
export function normalizePlayer(raw) {
  const data = raw?.data ?? raw ?? {};
  const stats = statisticRows(data?.statistics);
  return { id: id(data?.id), name: text(data?.name), image: text(data?.image_path), nationality: text(data?.nationality?.name), stats, source: 'sportmonks', fetchedAt: new Date().toISOString() };
}
export function normalizeFixturePlayerStats(raw) {
  const data = raw?.data ?? raw ?? {};
  const lineups = Array.isArray(data?.lineups) ? data.lineups : [];
  return lineups.map(line => ({
    playerId: id(line?.player_id ?? line?.player?.id), playerName: text(line?.player?.display_name ?? line?.player?.name ?? line?.name), teamId: id(line?.team_id ?? line?.team?.id), minutes: number(line?.minutes_played ?? line?.minutes), starter: line?.formation_position != null || line?.type_id === 11, statistics: statisticRows(line?.statistics),
  })).filter(player => player.playerId || player.playerName);
}
export async function getPlayer(playerId) { return request(`/players/${encodeURIComponent(playerId)}?include=statistics.details.type`); }
export async function getFixture(fixtureId) { return request(`/fixtures/${encodeURIComponent(fixtureId)}?include=lineups.player.statistics`); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = req.query || {};
  const playerId = text(query.playerId);
  const fixtureId = text(query.fixtureId);
  if (!playerId && !fixtureId) return res.status(400).json({ error: 'playerId or fixtureId is required' });
  try {
    const result = playerId ? await getPlayer(playerId) : await getFixture(fixtureId);
    if (result.status !== 'available') return res.status(result.status === 'unauthorized' ? 503 : result.status === 'rate-limited' ? 429 : 502).json({ error: 'Sportmonks data unavailable', data: null, dataQuality: result.status, detail: result.error?.message });
    const data = playerId ? normalizePlayer(result.data) : { players: normalizeFixturePlayerStats(result.data), source: 'sportmonks', fetchedAt: new Date().toISOString() };
    return res.status(200).json({ data, dataQuality: playerId ? (data.stats.length ? 'supported' : 'partial') : (data.players.length ? 'supported' : 'empty'), cached: result.cached === true, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[EdgeX Sportmonks] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Sportmonks data unavailable', data: null, dataQuality: 'unavailable' });
  }
}
