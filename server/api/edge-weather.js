import { WeatherProvider } from './edgex-providers.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try { const snapshot = await WeatherProvider.getSnapshot(req, req.query || {}); return res.status(200).json({ snapshot, provider: 'open-meteo', fetchedAt: new Date().toISOString() }); }
  catch (error) { console.error('[EdgeX weather] provider failure', error?.message || error); return res.status(502).json({ error: 'Weather provider unavailable', snapshot: null, dataQuality: 'unavailable' }); }
}
