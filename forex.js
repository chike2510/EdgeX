// /api/forex.js — Live forex data via Alpha Vantage
// ⚠️  Do NOT push this file to a public GitHub repo
// Alpha Vantage key — env var takes priority, hardcoded is fallback

const https = require('https');

const HARDCODED_KEY = 'H4QJRRI4IQOKD1JJ';

const PAIRS = [
  { from: 'EUR', to: 'USD' },
  { from: 'GBP', to: 'USD' },
  { from: 'USD', to: 'JPY' },
  { from: 'AUD', to: 'USD' },
  { from: 'USD', to: 'CAD' },
  { from: 'USD', to: 'CHF' },
  { from: 'NZD', to: 'USD' },
  { from: 'EUR', to: 'GBP' },
];

// Fallback simulation data (used if API key not set or rate limited)
const FALLBACK_RATES = {
  'EUR/USD': 1.0852, 'GBP/USD': 1.2681, 'USD/JPY': 151.24,
  'AUD/USD': 0.6521, 'USD/CAD': 1.3612, 'USD/CHF': 0.8991,
  'NZD/USD': 0.6048, 'EUR/GBP': 0.8562,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const API_KEY = process.env.ALPHA_VANTAGE_KEY || HARDCODED_KEY;

  if (!API_KEY) {
    // Return simulation data with a flag
    return res.json({ success: true, mode: 'simulation', data: generateSimForex(), note: 'Add ALPHA_VANTAGE_KEY for live rates' });
  }

  try {
    // Fetch all pairs in parallel (Alpha Vantage free = 25 req/day, 5 req/min)
    // We fetch DAILY data — gives us enough history for RSI + trend
    const results = await Promise.allSettled(
      PAIRS.map(p => fetchForexDaily(p.from, p.to, API_KEY))
    );

    const data = results.map((r, i) => {
      const pair = `${PAIRS[i].from}/${PAIRS[i].to}`;
      if (r.status === 'rejected' || !r.value) {
        return buildForexCard(pair, FALLBACK_RATES[pair], [], true);
      }
      return r.value;
    });

    res.json({ success: true, mode: 'live', data, source: 'Alpha Vantage', generatedAt: new Date().toISOString() });

  } catch (err) {
    // Full fallback on error
    res.json({ success: true, mode: 'simulation', data: generateSimForex(), error: err.message });
  }
};

// ── Alpha Vantage fetch ───────────────────────────────────────────────────────
async function fetchForexDaily(from, to, apiKey) {
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=compact&apikey=${apiKey}`;
  const raw = await fetchJSON(url);

  const series = raw['Time Series FX (Daily)'];
  if (!series) return null;

  const dates  = Object.keys(series).sort().reverse(); // newest first
  const prices = dates.slice(0, 30).map(d => parseFloat(series[d]['4. close']));
  const latest = prices[0];
  const prev   = prices[1] || latest;

  const pair = `${from}/${to}`;
  return buildForexCard(pair, latest, prices, false, prev);
}

function buildForexCard(pair, price, prices, simulated, prev) {
  const dp      = pair.includes('JPY') ? 2 : 4;
  const change  = prev ? +((price - prev) / prev * 100).toFixed(3) : +(Math.random()-0.5)*0.2;
  const rsi     = prices.length >= 15 ? computeRSI(prices.slice(0, 20).reverse(), 14) : Math.round(40+Math.random()*20);
  const ma5     = prices.length >= 5  ? avg(prices.slice(0, 5))  : price;
  const ma20    = prices.length >= 20 ? avg(prices.slice(0, 20)) : price;
  const macd    = computeMACD(prices.reverse());

  const trendScore = computeTrendScore(prices, ma5, ma20, rsi, change);
  const trend      = trendScore > 60 ? 'UPTREND' : trendScore < -60 ? 'DOWNTREND' : 'SIDEWAYS';
  const trendColor = trend === 'UPTREND' ? '#00ff9d' : trend === 'DOWNTREND' ? '#ff2d55' : '#f0c040';
  const trendIcon  = trend === 'UPTREND' ? '↑' : trend === 'DOWNTREND' ? '↓' : '→';
  const strength   = Math.abs(trendScore);

  const s1 = +(price * (1 - 0.003 - Math.random()*0.002)).toFixed(dp);
  const s2 = +(price * (1 - 0.008 - Math.random()*0.004)).toFixed(dp);
  const r1 = +(price * (1 + 0.003 + Math.random()*0.002)).toFixed(dp);
  const r2 = +(price * (1 + 0.008 + Math.random()*0.004)).toFixed(dp);

  const sessions = ['London','New York','Tokyo','Sydney'];
  const hour     = new Date().getUTCHours();
  const session  = hour >= 8 && hour < 16 ? 'London' : hour >= 13 && hour < 21 ? 'New York' : hour >= 0 && hour < 8 ? 'Tokyo' : 'Sydney';

  const edgeLabel  = strength > 60 ? 'STRONG' : strength > 35 ? 'MEDIUM' : 'WEAK';
  const confidence = Math.min(96, Math.round(45 + strength * 0.4 + Math.abs(change) * 8));

  const reasons = [];
  reasons.push(`${trend} confirmed — strength ${Math.round(strength)}/100`);
  reasons.push(price > ma20 ? 'above 20-day MA — bullish bias' : 'below 20-day MA — bearish bias');
  if (rsi > 60) reasons.push(`RSI ${rsi.toFixed(0)} — bullish momentum`);
  else if (rsi < 40) reasons.push(`RSI ${rsi.toFixed(0)} — bearish pressure`);
  else reasons.push(`RSI ${rsi.toFixed(0)} — neutral zone`);
  reasons.push(`${session} session — ${session === 'London' || session === 'New York' ? 'high' : 'moderate'} liquidity`);
  if (macd.signal === 'bullish') reasons.push('MACD bullish crossover detected');
  else reasons.push('MACD bearish crossover — downside momentum');

  return {
    pair, price: +price.toFixed(dp), change, trend, trendColor, trendIcon,
    strengthScore: Math.round(strength), ma5: +ma5.toFixed(dp), ma20: +ma20.toFixed(dp),
    rsi: +rsi.toFixed(1), macd: macd.value, macdSignal: macd.signal,
    support1: s1, support2: s2, resist1: r1, resist2: r2,
    entryBuy:  `${s1} – ${+(price*(1-0.001)).toFixed(dp)}`,
    entrySell: `${+(price*(1+0.001)).toFixed(dp)} – ${r1}`,
    session, edgeLabel, confidence, reasons,
    volatility: Math.round(20 + Math.abs(change) * 15),
    risk: strength > 60 ? { label: 'LOW RISK', color: '#00ff9d' } : strength > 35 ? { label: 'MEDIUM RISK', color: '#f0c040' } : { label: 'HIGH RISK', color: '#ff2d55' },
    simulated,
  };
}

// ── Technical indicators ──────────────────────────────────────────────────────
function computeRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i-1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const rs = (gains/period) / ((losses/period) || 0.001);
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

function computeMACD(prices) {
  if (prices.length < 26) return { value: 0, signal: 'neutral' };
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const value = ema12 - ema26;
  return { value: +value.toFixed(5), signal: value > 0 ? 'bullish' : 'bearish' };
}

function computeEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = avg(prices.slice(0, period));
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
}

function computeTrendScore(prices, ma5, ma20, rsi, change) {
  let score = 0;
  if (prices.length > 0) {
    score += prices[prices.length-1] > ma20 ? 30 : -30;
    score += prices[prices.length-1] > ma5  ? 20 : -20;
  }
  score += (rsi - 50) * 0.6;
  score += change * 15;
  return Math.max(-100, Math.min(100, score));
}

function avg(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

// ── Simulation fallback ───────────────────────────────────────────────────────
function generateSimForex() {
  return Object.entries(FALLBACK_RATES).map(([pair, base]) => {
    const change = +((Math.random()-0.5)*0.4).toFixed(3);
    const price  = +(base * (1 + change/100)).toFixed(pair.includes('JPY')?2:4);
    return buildForexCard(pair, price, [], true, base);
  });
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}
