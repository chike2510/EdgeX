// api/bayse.js — EdgeX v2.0 Bayse Markets Proxy
// Proxies Bayse Markets public API with caching
// No auth required for public read endpoints

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BAYSE_BASE = 'https://relay.bayse.markets';

  // path: events | events/:id | series | ticker
  const { path, ...queryParams } = req.query;

  const ALLOWED_PATHS = [
    'v1/pm/events',
    'v1/pm/series',
    'health',
    'version',
  ];

  // Build path
  let apiPath = path ? (Array.isArray(path) ? path.join('/') : path) : 'v1/pm/events';

  // Security: only allow whitelisted base paths
  const isAllowed = ALLOWED_PATHS.some(p => apiPath.startsWith(p));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  try {
    const params = new URLSearchParams(queryParams);
    const url = `${BAYSE_BASE}/${apiPath}${params.toString() ? '?' + params : ''}`;

    const upstream = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EdgeX/2.0',
      },
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Upstream fetch failed', message: err.message });
  }
}
