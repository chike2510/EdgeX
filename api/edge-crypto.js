import { CryptoProvider } from './edgex-providers.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try { const assets = await CryptoProvider.getAssets(req, req.query || {}); return res.status(200).json({ assets, provider: 'configured-crypto-provider', fetchedAt: new Date().toISOString() }); }
  catch (error) { console.error('[EdgeX crypto] provider failure', error?.message || error); return res.status(502).json({ error: 'Crypto provider unavailable', assets: [], dataQuality: 'unavailable' }); }
}
