// api/sports.js — EdgeX v2.0 Sports Proxy
// Proxies ESPN API calls to avoid CORS issues on client
// Free, no API key needed — ESPN public endpoints

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sport, league, date, event_id } = req.query;

  // Base ESPN API
  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';

  const ROUTES = {
    // Football / Soccer
    'soccer/eng.1':           `${ESPN}/soccer/eng.1/scoreboard`,
    'soccer/uefa.champions':  `${ESPN}/soccer/uefa.champions/scoreboard`,
    'soccer/esp.1':           `${ESPN}/soccer/esp.1/scoreboard`,
    'soccer/ger.1':           `${ESPN}/soccer/ger.1/scoreboard`,
    'soccer/ita.1':           `${ESPN}/soccer/ita.1/scoreboard`,
    'soccer/fra.1':           `${ESPN}/soccer/fra.1/scoreboard`,
    // Basketball
    'basketball/nba':         `${ESPN}/basketball/nba/scoreboard`,
    'basketball/wnba':        `${ESPN}/basketball/wnba/scoreboard`,
    'basketball/ncaa':        `${ESPN}/basketball/mens-college-basketball/scoreboard`,
  };

  const key = `${sport}/${league}`;
  const baseUrl = ROUTES[key];

  if (!baseUrl) {
    return res.status(400).json({ error: 'Unknown sport/league combination', available: Object.keys(ROUTES) });
  }

  try {
    const params = new URLSearchParams();
    if (date) params.set('dates', date);
    if (event_id) params.set('event', event_id);

    const url = `${baseUrl}${params.toString() ? '?' + params : ''}`;
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'EdgeX/2.0' },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `ESPN returned ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Upstream fetch failed', message: err.message });
  }
}
