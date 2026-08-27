import { getLatestProfiles, getTokenPairs } from './dexscreener.js';

const MAX_RESULTS = 100;
const numberOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function pairAgeHours(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, (Date.now() - timestamp) / 3_600_000) : null;
}

function riskFor(asset) {
  const reasons = [];
  let riskPoints = 0;
  const marketCap = numberOrNull(asset.marketCap);
  const volume = numberOrNull(asset.volume24h);
  const liquidity = numberOrNull(asset.liquidityUsd);
  const change24h = numberOrNull(asset.change24h);
  const ageHours = pairAgeHours(asset.pairCreatedAt);
  const buys = numberOrNull(asset.buys24h);
  const sells = numberOrNull(asset.sells24h);

  if (marketCap == null) { riskPoints += 4; reasons.push('Reported market capitalisation unavailable'); }
  else if (marketCap < 25_000) { riskPoints += 3; reasons.push('Very small reported market capitalisation'); }
  else if (marketCap < 75_000) { riskPoints += 2; reasons.push('Small reported market capitalisation'); }

  if (liquidity == null || liquidity <= 0) { riskPoints += 4; reasons.push('DEX liquidity unavailable'); }
  else if (liquidity < 5_000) { riskPoints += 3; reasons.push('Thin reported DEX liquidity'); }
  else if (liquidity < 20_000) { riskPoints += 1; reasons.push('Limited reported DEX liquidity'); }

  if (volume == null || volume <= 0) { riskPoints += 3; reasons.push('24h DEX volume unavailable'); }
  else if (liquidity && volume / liquidity > 25) { riskPoints += 2; reasons.push('Unusually high volume relative to liquidity'); }

  if (change24h == null) { riskPoints += 1; reasons.push('24h movement unavailable'); }
  else if (Math.abs(change24h) >= 30) { riskPoints += 2; reasons.push('Extreme 24h movement'); }
  else if (Math.abs(change24h) >= 15) { riskPoints += 1; reasons.push('Elevated 24h movement'); }

  if (ageHours !== null && ageHours < 3) { riskPoints += 2; reasons.push('Pair is less than three hours old'); }
  else if (ageHours !== null && ageHours < 12) { riskPoints += 1; reasons.push('Pair is less than twelve hours old'); }
  if (buys !== null && sells !== null && buys + sells >= 12 && (buys / Math.max(1, sells) > 8 || sells / Math.max(1, buys) > 8)) { riskPoints += 1; reasons.push('Strong 24h buy/sell imbalance'); }

  const level = riskPoints >= 6 ? 'HIGH' : riskPoints >= 3 ? 'ELEVATED' : 'WATCH';
  return { level, score: clamp(riskPoints, 0, 10), reasons };
}

function discoveryScore(asset, risk) {
  const marketCap = numberOrNull(asset.marketCap);
  const volume = numberOrNull(asset.volume24h);
  const liquidity = numberOrNull(asset.liquidityUsd);
  const change24h = numberOrNull(asset.change24h);
  const ageHours = pairAgeHours(asset.pairCreatedAt);
  let score = 50;
  if (marketCap != null) score += marketCap >= 50_000 && marketCap <= 350_000 ? 18 : marketCap >= 10_000 && marketCap <= 500_000 ? 10 : -15;
  if (liquidity != null) score += liquidity >= 20_000 && liquidity <= 500_000 ? 18 : liquidity >= 5_000 ? 8 : -12;
  if (volume != null && liquidity != null && liquidity > 0) {
    const turnover = volume / liquidity;
    score += turnover >= 0.2 && turnover <= 15 ? 12 : -7;
  } else score -= 10;
  if (ageHours !== null) score += ageHours >= 6 && ageHours <= 24 * 45 ? 8 : 0;
  if (change24h != null) score += change24h >= 0 && change24h <= 25 ? 6 : Math.abs(change24h) > 50 ? -10 : 0;
  score -= risk.score * 3;
  return clamp(Math.round(score), 0, 100);
}

export function normalizeMemecoin(asset) {
  const risk = riskFor(asset);
  return {
    id: asset.pairAddress || asset.baseToken?.address || null,
    name: asset.baseToken?.name || null,
    symbol: asset.baseToken?.symbol || null,
    image: null,
    price: asset.priceUsd,
    change24h: asset.change24h,
    change5m: numberOrNull(asset.change5m),
    change1h: numberOrNull(asset.change1h),
    marketCap: asset.marketCap,
    volume24h: asset.volume24h,
    liquidityUsd: numberOrNull(asset.liquidityUsd),
    buys24h: numberOrNull(asset.buys24h),
    sells24h: numberOrNull(asset.sells24h),
    pairCreatedAt: asset.pairCreatedAt || null,
    pairAddress: asset.pairAddress || null,
    tokenAddress: asset.baseToken?.address || null,
    chainId: asset.chainId || null,
    dexId: asset.dexId || null,
    url: asset.url || null,
    liquidityProxy: asset.liquidityUsd && asset.volume24h ? asset.volume24h / asset.liquidityUsd : null,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskReasons: risk.reasons,
    discoveryScore: discoveryScore(asset, risk),
    dataQuality: asset.priceUsd != null && asset.marketCap != null && asset.liquidityUsd != null && asset.volume24h != null ? 'SUPPORTED' : 'PARTIAL',
    sourceTimestamp: asset.fetchedAt,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const perPage = Math.min(Math.max(Number(query.per_page) || 50, 1), MAX_RESULTS);
  const chainId = String(query.chain || 'solana').toLowerCase();
  const minVolume = Math.max(Number(query.min_volume) || 0, 0);
  const minLiquidity = Math.max(Number(query.min_liquidity) || 0, 0);
  const minMarketCap = Math.max(Number(query.min_market_cap) || 10_000, 10_000);
  const maxMarketCap = Math.min(Math.max(Number(query.max_market_cap) || 500_000, minMarketCap), 5_000_000);
  const maxRisk = String(query.max_risk || 'HIGH').toUpperCase();
  const riskOrder = { WATCH: 0, ELEVATED: 1, HIGH: 2 };

  try {
    const profiles = await getLatestProfiles();
    const addresses = profiles.filter(profile => profile.chainId === chainId).map(profile => profile.tokenAddress).slice(0, 30);
    const pairs = await getTokenPairs(chainId, addresses);
    const bestPairByToken = new Map();
    pairs.forEach(pair => {
      const key = pair.baseToken?.address;
      if (!key) return;
      const current = bestPairByToken.get(key);
      if (!current || (pair.liquidityUsd || 0) > (current.liquidityUsd || 0)) bestPairByToken.set(key, pair);
    });
    const data = [...bestPairByToken.values()]
      .map(normalizeMemecoin)
      .filter(asset => asset.marketCap !== null && asset.marketCap >= minMarketCap && asset.marketCap <= maxMarketCap)
      .filter(asset => asset.volume24h !== null && asset.volume24h >= minVolume)
      .filter(asset => asset.liquidityUsd !== null && asset.liquidityUsd >= minLiquidity)
      .filter(asset => (riskOrder[asset.riskLevel] ?? 2) <= (riskOrder[maxRisk] ?? 2))
      .sort((a, b) => b.discoveryScore - a.discoveryScore)
      .slice(0, perPage);
    return res.status(200).json({
      data,
      count: data.length,
      provider: 'dex-screener',
      fetchedAt: new Date().toISOString(),
      methodology: {
        scope: `Only ${chainId} pairs with DEX Screener-reported market capitalisation between $${minMarketCap.toLocaleString()} and $${maxMarketCap.toLocaleString()} are included. FDV-only pairs are excluded rather than treated as market-cap data.`,
        score: 'Discovery context score based on reported market capitalisation, DEX liquidity, volume-to-liquidity turnover, pair age, 24h movement, and data completeness; not a 10x forecast or return prediction.',
        risk: 'Risk flags reflect observable DEX market-data conditions only. No contract audit, holder concentration, liquidity lock, wallet-trading history, or safety certification is inferred.',
        maxAnalyticalItems: MAX_RESULTS,
      },
    });
  } catch (error) {
    console.error('[EdgeX memecoin finder] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Memecoin data unavailable', data: [], dataQuality: 'unavailable' });
  }
}
