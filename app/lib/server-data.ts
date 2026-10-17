import { cached } from '../../server/api/edgex-data.js';
import sportsHandler from '../../server/api/sports.js';
import marketsHandler from '../../server/api/edge-markets.js';
import cryptoHandler from '../../server/api/crypto.js';
import forexHandler from '../../server/api/forex.js';

type Query = Record<string, string>;
type JsonRecord = Record<string, any>;
type LegacyHandler = (req: any, res: any) => Promise<unknown> | unknown;

type ApiResult = { status: number; body: JsonRecord; headers: Record<string, string> };

async function invoke(handler: LegacyHandler, query: Query): Promise<ApiResult> {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: {} as JsonRecord,
    setHeader(name: string, value: string) { this.headers[name.toLowerCase()] = value; return this; },
    status(code: number) { this.statusCode = code; return this; },
    json(body: JsonRecord) { this.body = body; return this; },
    end(body?: string) { if (body) this.body = { raw: body }; return this; },
  };
  const req = {
    method: 'GET',
    query,
    headers: { host: 'edgex.local', 'x-forwarded-proto': 'https' },
    url: '/api',
  };
  try {
    await handler(req, response);
  } catch {
    return { status: 502, body: { error: 'Provider unavailable', dataQuality: 'unavailable' }, headers: response.headers };
  }
  return { status: response.statusCode, body: response.body || {}, headers: response.headers };
}

async function load(key: string, ttlMs: number, handler: LegacyHandler, query: Query, fallback: JsonRecord): Promise<JsonRecord> {
  return cached(`app-router:${key}`, ttlMs, async () => {
    const result = await invoke(handler, query);
    return result.status >= 200 && result.status < 300 ? result.body : fallback;
  });
}

export function getSportsData(options: Query = {}) {
  const date = options.date || new Date().toISOString().slice(0, 10);
  const query = { sport: options.sport || 'soccer', league: options.league || 'eng.1', date, ...(options.event_id ? { event_id: options.event_id } : {}) };
  return load(`sports:${JSON.stringify(query)}`, 30_000, sportsHandler, query, { events: [], provider: 'ESPN', dataQuality: 'unavailable' });
}

export function getMarketsData(options: Query = {}) {
  const query = { limit: options.limit || '50', ...(options.category ? { category: options.category } : {}) };
  return load(`markets:${JSON.stringify(query)}`, 30_000, marketsHandler, query, { markets: [], provider: 'bayse', dataQuality: 'unavailable' });
}

export function getCryptoData(options: Query = {}) {
  const query = { per_page: options.per_page || '12', ...(options.symbol ? { symbol: options.symbol } : {}) };
  return load(`crypto:${JSON.stringify(query)}`, 30_000, cryptoHandler, query, { data: [], provider: 'coingecko', dataQuality: 'unavailable' });
}

export function getForexData(options: Query = {}) {
  const query = { ...(options.base ? { base: options.base } : {}), ...(options.symbols ? { symbols: options.symbols } : {}), ...(options.currency ? { currency: options.currency } : {}) };
  return load(`forex:${JSON.stringify(query)}`, 30 * 60_000, forexHandler, query, { pairs: [], provider: 'frankfurter-ecb', dataQuality: 'unavailable' });
}
