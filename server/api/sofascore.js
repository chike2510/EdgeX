// api/sofascore.js — EdgeX Sofascore RapidAPI Proxy
// ALL calls go through here — never call RapidAPI from the browser (CORS)
// Supports: fixtures, team form, H2H, referee stats

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const RAPID_KEY = process.env.SOFASCORE_API_KEY || '6dc7583663mshc015f73e7df2dc3p1993d6jsn00f888eddd34';
  const BASE = 'https://sofascore.p.rapidapi.com/api/v1';

  // Allowed endpoint patterns (security whitelist)
  const ALLOWED = [
    /^\/sport\/football\/scheduled-events\//,
    /^\/sport\/football\/live-events$/,
    /^\/team\/\d+\/events\//,
    /^\/team\/\d+\/near-events$/,
    /^\/event\/\d+$/,
    /^\/event\/\d+\/h2h$/,
    /^\/event\/\d+\/lineups$/,
    /^\/event\/\d+\/statistics$/,
    /^\/event\/\d+\/highlights$/,
    /^\/referee\/\d+\/events$/,
    /^\/search\/\d+$/,
    /^\/search\/[a-zA-Z0-9%+\-_. ]+$/,
  ];

  let { endpoint, ...params } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'endpoint param required' });

  // Ensure leading slash
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

  const allowed = ALLOWED.some(re => re.test(endpoint));
  if (!allowed) {
    return res.status(403).json({ error: 'Endpoint not whitelisted', endpoint });
  }

  try {
    const qs = new URLSearchParams(params);
    const url = `${BASE}${endpoint}${qs.toString() ? '?' + qs : ''}`;

    const r = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPID_KEY,
        'X-RapidAPI-Host': 'sofascore.p.rapidapi.com',
        'User-Agent': 'EdgeX/2.0',
      },
    });

    const ct = r.headers.get('content-type') || '';
    if (!r.ok) {
      const txt = await r.text();
      console.error('[EdgeX sofascore] upstream error:', r.status, txt.slice(0, 200));
      return res.status(r.status).json({ error: 'Sofascore API error', status: r.status, detail: txt.slice(0, 200) });
    }

    const data = ct.includes('json') ? await r.json() : { raw: await r.text() };
    return res.status(200).json(data);

  } catch (e) {
    console.error('[EdgeX sofascore] fetch error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
