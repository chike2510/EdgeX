import { creativesDevProvider } from '../historical/creativesdev-runtime.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const action = String(req.query?.action || '').toLowerCase();
  let result;
  if (action === 'leagues') {
    result = await creativesDevProvider.getLeagues();
  } else if (action === 'matches-by-date' && req.query?.date) {
    result = await creativesDevProvider.getMatchesByDate(String(req.query.date), req.query?.leagueId ? String(req.query.leagueId) : undefined);
  } else if (action === 'statistics' && req.query?.eventId) {
    result = await creativesDevProvider.getMatchStatistics(String(req.query.eventId));
  } else {
    return res.status(400).json({
      error: 'Invalid Creativesdev action',
      allowed: ['leagues', 'matches-by-date', 'statistics'],
      requirements: {
        leagues: 'none',
        matchesByDate: 'date and optional leagueId',
        statistics: 'eventId',
      },
    });
  }

  const status = result.error?.httpStatus && result.error.httpStatus >= 400 ? result.error.httpStatus : 200;
  return res.status(status).json(result);
}
