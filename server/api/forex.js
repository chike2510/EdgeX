// Public foreign-exchange proxy backed by Frankfurter/ECB reference rates.
// Rates are provider values; change is left unavailable when no comparison snapshot exists.
const FRANKFURTER = 'https://api.frankfurter.app/latest';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const symbols = typeof query.symbols === 'string' && query.symbols.trim()
    ? query.symbols.split(',').map(value => value.trim().toUpperCase()).filter(Boolean).slice(0, 20)
    : ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NGN', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'ZAR', 'HKD', 'SGD', 'KRW', 'MXN', 'BRL', 'INR'];
  const params = new URLSearchParams({ from: String(query.base || 'USD').toUpperCase(), to: symbols.join(',') });

  try {
    const upstream = await fetch(`${FRANKFURTER}?${params}`, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' } });
    const body = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Forex provider unavailable', detail: body?.message || `Frankfurter returned ${upstream.status}` });
    const rates = { ...(body?.rates || {}) };
    let provider = 'frankfurter-ecb';
    if (symbols.includes('NGN') && rates.NGN == null) {
      try {
        const fallback = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' } });
        const fallbackBody = await fallback.json();
        if (fallback.ok && Number.isFinite(Number(fallbackBody?.rates?.NGN))) {
          rates.NGN = Number(fallbackBody.rates.NGN);
          provider = 'frankfurter-ecb+exchange-rate-fallback';
        }
      } catch (fallbackError) {
        console.warn('[EdgeX forex] NGN fallback unavailable', fallbackError?.message || fallbackError);
      }
    }
    const pairs = symbols.filter(currency => rates[currency] != null).map(currency => ({
      symbol: `${body.base || 'USD'}/${currency}`,
      price: Number.isFinite(Number(rates[currency])) ? Number(rates[currency]) : null,
      change: null,
      trend: null,
      date: body.date || null
    }));
    return res.status(200).json({ pairs, provider, fetchedAt: new Date().toISOString(), date: body.date || null });
  } catch (error) {
    console.error('[EdgeX forex proxy] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Forex provider unavailable', pairs: [], dataQuality: 'unavailable' });
  }
}
