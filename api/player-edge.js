import { PlayerPropsProvider } from './edgex-providers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=8, stale-while-revalidate=20');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const params = {
    getTrending: query.getTrending || 'true',
    marketType: query.marketType || undefined,
    keyword: query.keyword || undefined,
    sport: query.sport || undefined
  };
  try {
    const props = await PlayerPropsProvider.getProps(req, params);
    return res.status(200).json({ provider: 'squads', props, fetchedAt: new Date().toISOString(), dataQuality: props.length ? 'provider-backed' : 'empty' });
  } catch (error) {
    console.error('[EdgeX player-edge] provider failure', { message: error?.message || String(error) });
    const message = error?.message || 'Player provider unavailable';
    const status = /401|403|Unauthorized/i.test(message) ? 503 : 502;
    return res.status(status).json({ error: 'Player Edge provider unavailable', detail: message, props: [], dataQuality: 'unavailable' });
  }
}
