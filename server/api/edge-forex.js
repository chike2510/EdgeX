import { ForexProvider } from './edgex-providers.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try { const pairs = await ForexProvider.getPairs(req, req.query || {}); return res.status(200).json({ pairs, provider: 'configured-forex-provider', fetchedAt: new Date().toISOString() }); }
  catch (error) { console.error('[EdgeX forex] provider failure', error?.message || error); return res.status(502).json({ error: 'Forex provider unavailable', pairs: [], dataQuality: 'unavailable' }); }
}
