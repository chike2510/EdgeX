// CoinGecko public markets proxy used by the EdgeX crypto intelligence page.
// The endpoint returns provider-backed values only; it never fabricates prices.
const COINGECKO = 'https://api.coingecko.com/api/v3/coins/markets';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const requestedIds = typeof query.ids === 'string' ? query.ids : '';
  const isMemecoin = query.category === 'memecoins' || query.category === 'meme-token';
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(Math.min(Math.max(Number(query.per_page) || 30, 1), 100)),
    page: String(Math.max(Number(query.page) || 1, 1)),
    sparkline: 'false',
    price_change_percentage: '24h'
  });
  if (requestedIds) params.set('ids', requestedIds.split(',').map(value => value.trim()).filter(Boolean).slice(0, 100).join(','));
  if (isMemecoin) params.set('category', 'meme-token');

  try {
    const upstream = await fetch(`${COINGECKO}?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' }
    });
    const raw = await upstream.text();
    let body;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Crypto provider unavailable',
        detail: body?.status?.error_message || body?.error || `CoinGecko returned ${upstream.status}`,
        dataQuality: 'unavailable'
      });
    }
    return res.status(200).json({ data: Array.isArray(body) ? body : [], provider: 'coingecko', fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[EdgeX crypto proxy] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Crypto provider unavailable', data: [], dataQuality: 'unavailable' });
  }
}
