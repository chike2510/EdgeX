const API = 'https://api.dexscreener.com';
const CACHE_TTL_MS = 60_000;
const cache = new Map();

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function text(value) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function cacheKey(url) { return url; }
async function getJson(url) {
  const key = cacheKey(url);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' } });
  const raw = await response.text();
  let body = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { throw new Error('DEX Screener returned invalid JSON'); }
  if (!response.ok) throw new Error(`DEX Screener returned ${response.status}`);
  cache.set(key, { at: Date.now(), value: body });
  return body;
}

export function normalizePair(pair, context = {}) {
  const base = pair?.baseToken || {};
  const quote = pair?.quoteToken || {};
  const txns = pair?.txns || {};
  const volume = pair?.volume || {};
  const priceChange = pair?.priceChange || {};
  return {
    chainId: text(pair?.chainId), dexId: text(pair?.dexId), pairAddress: text(pair?.pairAddress),
    url: text(pair?.url), baseToken: { address: text(base.address), name: text(base.name), symbol: text(base.symbol) },
    quoteToken: { address: text(quote.address), name: text(quote.name), symbol: text(quote.symbol) },
    priceUsd: number(pair?.priceUsd), fdv: number(pair?.fdv), marketCap: number(pair?.marketCap),
    liquidityUsd: number(pair?.liquidity?.usd), volume24h: number(volume?.h24),
    change5m: number(priceChange?.m5), change1h: number(priceChange?.h1), change6h: number(priceChange?.h6), change24h: number(priceChange?.h24),
    buys24h: number(txns?.h24?.buys), sells24h: number(txns?.h24?.sells),
    pairCreatedAt: pair?.pairCreatedAt ? new Date(Number(pair.pairCreatedAt)).toISOString() : null,
    profileUrl: context.profileUrl || null, source: 'dex-screener', fetchedAt: new Date().toISOString(),
  };
}

export async function getTokenPairs(chainId, tokenAddresses) {
  const addresses = [...new Set((Array.isArray(tokenAddresses) ? tokenAddresses : [tokenAddresses]).map(text).filter(Boolean))].slice(0, 30);
  if (!chainId || !addresses.length) return [];
  const body = await getJson(`${API}/tokens/v1/${encodeURIComponent(chainId)}/${addresses.map(encodeURIComponent).join(',')}`);
  const pairs = Array.isArray(body) ? body : Array.isArray(body?.pairs) ? body.pairs : [];
  return pairs.map(pair => normalizePair(pair));
}

export async function getLatestProfiles() {
  const body = await getJson(`${API}/token-profiles/latest/v1`);
  return (Array.isArray(body) ? body : []).slice(0, 30).map(profile => ({
    chainId: text(profile?.chainId), tokenAddress: text(profile?.tokenAddress), url: text(profile?.url),
    icon: text(profile?.icon), header: text(profile?.header), description: text(profile?.description),
  })).filter(item => item.chainId && item.tokenAddress);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const query = req.query || {};
    if (query.chainId && query.tokenAddress) {
      const data = await getTokenPairs(String(query.chainId), String(query.tokenAddress).split(','));
      return res.status(200).json({ data, dataQuality: data.length ? 'supported' : 'empty', fetchedAt: new Date().toISOString() });
    }
    const profiles = await getLatestProfiles();
    const grouped = new Map();
    for (const profile of profiles) {
      const key = profile.chainId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(profile);
    }
    const enriched = [];
    for (const [chainId, items] of grouped) {
      const pairs = await getTokenPairs(chainId, items.map(item => item.tokenAddress));
      const profileByAddress = new Map(items.map(item => [item.tokenAddress, item]));
      pairs.forEach(pair => enriched.push({ ...pair, profileUrl: profileByAddress.get(pair.baseToken.address)?.url || null }));
    }
    return res.status(200).json({ data: enriched.slice(0, 100), dataQuality: enriched.length ? 'supported' : 'empty', fetchedAt: new Date().toISOString(), rateLimitNote: 'Responses are cached server-side for 60 seconds.' });
  } catch (error) {
    console.error('[EdgeX DEX Screener] provider failure', error?.message || error);
    return res.status(502).json({ error: 'DEX market data unavailable', data: [], dataQuality: 'unavailable' });
  }
}
