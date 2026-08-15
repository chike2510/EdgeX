import { cached, normalizeFixture, safeNumber } from './edgex-data.js';

const TTL = { live: 10_000, fixtures: 60_000, market: 30_000, crypto: 30_000, forex: 30_000, weather: 30_000, props: 8_000 };

async function requestJson(url, options = {}) {
  const startedAt = Date.now();
  const response = await fetch(url, options);
  const raw = await response.text();
  let body;
  try { body = raw ? JSON.parse(raw) : null; } catch { throw new Error('Provider returned invalid JSON'); }
  if (!response.ok) throw new Error(`Provider request failed (${response.status})`);
  console.info('[EdgeX provider]', { url: url.split('?')[0], status: response.status, latencyMs: Date.now() - startedAt });
  return body;
}

function baseUrl(req) {
  const protocol = req.headers?.['x-forwarded-proto'] || 'https';
  return `${protocol}://${req.headers?.host || 'localhost'}`;
}

export const SportsProvider = {
  async getFixtures(req, params = {}) {
    const key = `sports:fixtures:${JSON.stringify(params)}`;
    return cached(key, params.live ? TTL.live : TTL.fixtures, async () => {
      const qs = new URLSearchParams(params);
      const payload = await requestJson(`${baseUrl(req)}/api/sports?${qs}`);
      const events = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : [];
      return events.map(event => normalizeFixture(event, params));
    });
  }
};

export const MarketProvider = {
  async getMarkets(req, params = {}) {
    const qs = new URLSearchParams(params);
    const bayseBase = process.env.BAYSE_API_BASE_URL || 'https://relay.bayse.markets';
    const payload = await requestJson(`${bayseBase}/v1/pm/events${qs.toString() ? `?${qs}` : ''}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' },
    });
    const markets = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return markets.map(market => ({
      id: market.id || market.eventId || null,
      question: market.question || market.title || null,
      category: market.category || null,
      probability: safeNumber(market.probability || market.yesPrice || market.outcome1Price || market.markets?.[0]?.outcome1Price),
      movement24h: safeNumber(market.movement24h || market.change24h),
      volume: safeNumber(market.volume || market.totalVolume || market.totalOrders),
      liquidity: safeNumber(market.liquidity),
      threshold: safeNumber(market.eventThreshold || market.markets?.[0]?.marketThreshold),
      outcomes: (market.outcomes || market.markets?.slice(0, 1).flatMap(item => [
        { id: item.outcome1Id || null, label: item.outcome1Label || null, probability: safeNumber(item.outcome1Price) },
        { id: item.outcome2Id || null, label: item.outcome2Label || null, probability: safeNumber(item.outcome2Price) },
      ]) || []).filter(item => item.label),
      resolutionDate: market.resolutionDate || market.closingDate || null,
      sourceTimestamp: new Date().toISOString(),
      metadata: market
    }));
  }
};

export const CryptoProvider = {
  async getAssets(req, params = {}) {
    const qs = new URLSearchParams(params);
    const payload = await requestJson(`${baseUrl(req)}/api/crypto?${qs}`);
    const assets = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return assets.map(asset => ({
      id: asset.id || asset.symbol || null,
      name: asset.name || null,
      symbol: asset.symbol || null,
      price: safeNumber(asset.current_price || asset.price),
      change24h: safeNumber(asset.price_change_percentage_24h || asset.change24h),
      marketCap: safeNumber(asset.market_cap || asset.marketCap),
      volume24h: safeNumber(asset.total_volume || asset.volume24h),
      image: asset.image || null,
      sourceTimestamp: new Date().toISOString(),
      metadata: asset
    }));
  }
};

export const ForexProvider = {
  async getPairs(req, params = {}) {
    const qs = new URLSearchParams(params);
    const payload = await requestJson(`${baseUrl(req)}/api/forex?${qs}`);
    const pairs = Array.isArray(payload?.pairs) ? payload.pairs : Array.isArray(payload?.data) ? payload.data : [];
    return pairs.map(pair => ({
      symbol: pair.symbol || pair.pair || null,
      price: safeNumber(pair.price || pair.rate),
      change: safeNumber(pair.change || pair.changePercent),
      trend: pair.trend || null,
      sourceTimestamp: new Date().toISOString(),
      metadata: pair
    }));
  }
};

export const WeatherProvider = {
  async getSnapshot(req, params = {}) {
    const qs = new URLSearchParams(params);
    const payload = await requestJson(`${baseUrl(req)}/api/weather?${qs}`);
    return {
      location: payload?.location || null,
      temperature: safeNumber(payload?.current?.temperature || payload?.temperature),
      rainProbability: safeNumber(payload?.current?.rainProbability || payload?.rainProbability),
      wind: safeNumber(payload?.current?.wind || payload?.wind),
      humidity: safeNumber(payload?.current?.humidity || payload?.humidity),
      conditions: payload?.current?.conditions || payload?.conditions || null,
      sourceTimestamp: new Date().toISOString(),
      metadata: payload
    };
  }
};

export function normalizePlayerProps(payload) {
  const groups = Array.isArray(payload?.props) ? payload.props : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return groups.flatMap(group => {
    const player = group.player || {};
    const game = group.game || {};
    const market = group.market || {};
    const home = game.homeTeam || {};
    const away = game.awayTeam || {};
    const team = player.team?.id === away.id ? away.name : home.name;
    const opponent = player.team?.id === away.id ? home.name : away.name;
    const entries = Array.isArray(group.props) ? group.props : [];
    return entries.flatMap(entry => (Array.isArray(entry.lines) ? entry.lines : []).map(line => ({
      provider: 'squads', providerMarketId: line.id || market.id || group.groupId || null, eventId: game.id || null,
      playerId: player.id || null, playerName: player.name || null, playerImage: player.imageUrl128 || player.imageUrl || null,
      team: team || null, opponent: opponent || null, sport: group.sport || null, marketType: market.name || market.id || null,
      displayName: `${market.name || 'Player market'} · ${entry.type || 'Line'}`, line: safeNumber(entry.betPoints),
      selection: line.selectionLine || null, fixtureTime: game.startDate || null, status: game.isLive ? 'live' : game.status || null,
      sourceTimestamp: new Date().toISOString(), metadata: { group, entry, line }
    })));
  });
}

export const PlayerPropsProvider = {
  async getProps(req, params = {}) {
    const base = process.env.SQUADS_API_BASE_URL || 'https://api.squads.game';
    const filteredParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
    const qs = new URLSearchParams(filteredParams);
    const payload = await requestJson(`${base}/bet/public-props?${qs}`, { headers: { Accept: 'application/json' } });
    return normalizePlayerProps(payload);
  }
};

export const Providers = { SportsProvider, MarketProvider, CryptoProvider, ForexProvider, WeatherProvider, PlayerPropsProvider };
