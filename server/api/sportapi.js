import { sportApiProvider } from '../historical/sportapi.ts';

const MAX_ARCHIVE_PAGE = 8;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const action = String(req.query?.action || '').toLowerCase();
  const eventId = String(req.query?.eventId || '');
  const teamId = String(req.query?.teamId || '');

  try {
    let result;
    if (action === 'team-history' && teamId) {
      const requestedPage = Number(req.query?.page || 0);
      const page = Number.isFinite(requestedPage) ? Math.max(0, Math.min(MAX_ARCHIVE_PAGE, requestedPage)) : 0;
      result = await sportApiProvider.getTeamHistory(teamId, { page });
    } else if (action === 'h2h' && eventId) {
      result = await sportApiProvider.getH2H(eventId);
    } else if (action === 'event' && eventId) {
      result = await sportApiProvider.getEvent(eventId);
    } else if (action === 'statistics' && eventId) {
      result = await sportApiProvider.getStatistics(eventId);
    } else if (action === 'lineups' && eventId) {
      result = await sportApiProvider.getLineups(eventId);
    } else if (action === 'shotmap' && eventId && teamId) {
      result = await sportApiProvider.getShotmap(eventId, teamId);
    } else {
      return res.status(400).json({
        error: 'Invalid SportAPI action',
        allowed: ['team-history', 'h2h', 'event', 'statistics', 'lineups', 'shotmap'],
        requirements: {
          teamHistory: 'teamId',
          h2h: 'eventId',
          event: 'eventId',
          statistics: 'eventId',
          lineups: 'eventId',
          shotmap: 'eventId and teamId',
        },
      });
    }

    const status = result.error?.httpStatus && result.error.httpStatus >= 400 ? result.error.httpStatus : 200;
    return res.status(status).json(result);
  } catch (error) {
    console.error('[EdgeX sportapi] route error:', error?.message || error);
    return res.status(500).json({
      provider: 'sportapi',
      status: 'unavailable',
      data: [],
      error: { code: 'UNKNOWN', message: 'SportAPI adapter failed', retryable: true },
    });
  }
}
