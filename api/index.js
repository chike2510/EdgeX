import ai from '../server/api/ai.js';
import bayse from '../server/api/bayse.js';
import edgeAnalysis from '../server/api/edge-analysis.js';
import edgeCrypto from '../server/api/edge-crypto.js';
import crypto from '../server/api/crypto.js';
import edgeForex from '../server/api/edge-forex.js';
import forex from '../server/api/forex.js';
import edgeMarkets from '../server/api/edge-markets.js';
import edgeSports from '../server/api/edge-sports.js';
import edgeWeather from '../server/api/edge-weather.js';
import form from '../server/api/form.js';
import playerEdge from '../server/api/player-edge.js';
import playerHistory from '../server/api/player-history.js';
import memecoins from '../server/api/memecoins.js';
import dexscreener from '../server/api/dexscreener.js';
import search from '../server/api/search.js';
import sofascore from '../server/api/sofascore.js';
import sports from '../server/api/sports.js';
import weather from '../server/api/weather.js';

const handlers = {
  ai,
  bayse,
  'edge-analysis': edgeAnalysis,
  'edge-crypto': edgeCrypto,
  crypto,
  'edge-forex': edgeForex,
  forex,
  'edge-markets': edgeMarkets,
  'edge-sports': edgeSports,
  'edge-weather': edgeWeather,
  form,
  'player-edge': playerEdge,
  'player-history': playerHistory,
  memecoins,
  dexscreener,
  search,
  sofascore,
  sports,
  weather,
};

const lazyHandlers = {
  sportapi: () => import('../server/api/sportapi.js'),
  creativesdev: () => import('../server/api/creativesdev.js'),
};

function requestedPath(req) {
  const value = req.query?.route;
  if (Array.isArray(value)) return value.join('/').replace(/^\/+|\/+$/g, '');
  if (typeof value === 'string' && value) return value.replace(/^\/+|\/+$/g, '');
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  return pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '') || 'health';
}

export default async function handler(req, res) {
  const path = requestedPath(req).split('/')[0];
  let target = handlers[path];
  if (!target && lazyHandlers[path]) {
    try {
      const loaded = await lazyHandlers[path]();
      target = loaded.default ?? loaded;
    } catch (error) {
      console.error(`[EdgeX api] optional provider failed to load: ${path}`, error?.message || error);
      return res.status(503).json({ error: 'Optional provider unavailable', path });
    }
  }
  if (!target) return res.status(404).json({ error: 'API route not found', path });

  const originalQuery = req.query || {};
  const forwardedQuery = { ...originalQuery };
  delete forwardedQuery.route;
  req.query = forwardedQuery;
  return target(req, res);
}
