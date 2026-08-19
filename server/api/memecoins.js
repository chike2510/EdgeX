import { CryptoProvider } from './edgex-providers.js';

const MAX_RESULTS = 100;
const numberOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function riskFor(asset) {
  const reasons = [];
  let riskPoints = 0;
  const marketCap = numberOrNull(asset.marketCap);
  const volume = numberOrNull(asset.volume24h);
  const change24h = numberOrNull(asset.change24h);
  const change7d = numberOrNull(asset.metadata?.price_change_percentage_7d_in_currency);
  const circulating = numberOrNull(asset.metadata?.circulating_supply);
  const totalSupply = numberOrNull(asset.metadata?.total_supply);

  if (marketCap == null) { riskPoints += 2; reasons.push('Market capitalisation unavailable'); }
  else if (marketCap < 10_000_000) { riskPoints += 3; reasons.push('Very small market capitalisation'); }
  else if (marketCap < 100_000_000) { riskPoints += 2; reasons.push('Small market capitalisation'); }
  else if (marketCap < 500_000_000) { riskPoints += 1; reasons.push('Mid-sized market capitalisation'); }

  if (volume == null || volume <= 0) { riskPoints += 3; reasons.push('24h volume unavailable'); }
  else if (marketCap && volume / marketCap < 0.01) { riskPoints += 2; reasons.push('Low volume relative to market capitalisation'); }
  else if (marketCap && volume / marketCap > 2) { riskPoints += 2; reasons.push('Unusually high turnover'); }

  if (change24h == null) { riskPoints += 1; reasons.push('24h movement unavailable'); }
  else if (Math.abs(change24h) >= 30) { riskPoints += 2; reasons.push('Extreme 24h movement'); }
  else if (Math.abs(change24h) >= 15) { riskPoints += 1; reasons.push('Elevated 24h movement'); }

  if (change7d != null && Math.abs(change7d) >= 60) { riskPoints += 1; reasons.push('Extreme 7d movement'); }
  if (circulating != null && totalSupply != null && totalSupply > 0 && circulating / totalSupply < 0.25) {
    riskPoints += 1;
    reasons.push('Low circulating share versus reported total supply');
  }

  const level = riskPoints >= 6 ? 'HIGH' : riskPoints >= 3 ? 'ELEVATED' : 'WATCH';
  return { level, score: clamp(riskPoints, 0, 10), reasons };
}

function discoveryScore(asset, risk) {
  const marketCap = numberOrNull(asset.marketCap);
  const volume = numberOrNull(asset.volume24h);
  const change24h = numberOrNull(asset.change24h);
  let score = 50;
  if (marketCap != null) score += marketCap >= 10_000_000 && marketCap <= 2_000_000_000 ? 12 : -5;
  if (volume != null && marketCap != null && marketCap > 0) {
    const turnover = volume / marketCap;
    score += turnover >= 0.03 && turnover <= 1.2 ? 12 : -8;
  } else score -= 8;
  if (change24h != null) score += change24h >= 0 && change24h <= 15 ? 8 : Math.abs(change24h) > 30 ? -10 : 0;
  score -= risk.score * 3;
  return clamp(Math.round(score), 0, 100);
}

export function normalizeMemecoin(asset) {
  const risk = riskFor(asset);
  return {
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    image: asset.image,
    price: asset.price,
    change24h: asset.change24h,
    change7d: numberOrNull(asset.metadata?.price_change_percentage_7d_in_currency),
    marketCap: asset.marketCap,
    volume24h: asset.volume24h,
    marketCapRank: numberOrNull(asset.metadata?.market_cap_rank),
    circulatingSupply: numberOrNull(asset.metadata?.circulating_supply),
    totalSupply: numberOrNull(asset.metadata?.total_supply),
    liquidityProxy: asset.marketCap && asset.volume24h ? asset.volume24h / asset.marketCap : null,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskReasons: risk.reasons,
    discoveryScore: discoveryScore(asset, risk),
    dataQuality: asset.price != null && asset.marketCap != null && asset.volume24h != null ? 'SUPPORTED' : 'PARTIAL',
    sourceTimestamp: asset.sourceTimestamp,
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
  const minVolume = Math.max(Number(query.min_volume) || 0, 0);
  const maxMarketCap = Number(query.max_market_cap) > 0 ? Number(query.max_market_cap) : Infinity;
  const maxRisk = String(query.max_risk || 'HIGH').toUpperCase();
  const riskOrder = { WATCH: 0, ELEVATED: 1, HIGH: 2 };

  try {
    const assets = await CryptoProvider.getAssets(req, {
      category: 'memecoins',
      per_page: perPage,
      page: Number(query.page) || 1,
      price_change_percentage: '24h,7d',
    });
    const data = assets
      .map(normalizeMemecoin)
      .filter(asset => (asset.volume24h == null || asset.volume24h >= minVolume))
      .filter(asset => (asset.marketCap == null || asset.marketCap <= maxMarketCap))
      .filter(asset => (riskOrder[asset.riskLevel] ?? 2) <= (riskOrder[maxRisk] ?? 2))
      .sort((a, b) => b.discoveryScore - a.discoveryScore);
    return res.status(200).json({
      data,
      count: data.length,
      provider: 'configured-crypto-provider',
      fetchedAt: new Date().toISOString(),
      methodology: {
        score: 'Discovery context score based on reported market cap, volume turnover, 24h movement, and data completeness; not a return forecast.',
        risk: 'Risk flags reflect observable market-data conditions only. No contract audit, holder concentration, liquidity-lock, or safety certification is inferred.',
        maxAnalyticalItems: MAX_RESULTS,
      },
    });
  } catch (error) {
    console.error('[EdgeX memecoin finder] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Memecoin data unavailable', data: [], dataQuality: 'unavailable' });
  }
}
