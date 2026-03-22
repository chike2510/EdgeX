// /api/crypto.js — Live crypto data via CoinGecko (free, no key needed)

const https = require('https');

const COINS = [
  { id: 'bitcoin',       symbol: 'BTC', name: 'Bitcoin'   },
  { id: 'ethereum',      symbol: 'ETH', name: 'Ethereum'  },
  { id: 'solana',        symbol: 'SOL', name: 'Solana'    },
  { id: 'binancecoin',   symbol: 'BNB', name: 'BNB'       },
  { id: 'ripple',        symbol: 'XRP', name: 'XRP'       },
  { id: 'avalanche-2',   symbol: 'AVAX',name: 'Avalanche' },
  { id: 'matic-network', symbol: 'MATIC',name:'Polygon'   },
  { id: 'chainlink',     symbol: 'LINK', name:'Chainlink'  },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const ids = COINS.map(c => c.id).join(',');

    // Fetch market data + 7-day sparkline for RSI calculation
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
    const raw = await fetchJSON(url);

    if (!Array.isArray(raw)) {
      return res.json({ success: false, mode: 'simulation', error: 'CoinGecko rate limit or error' });
    }

    const enriched = raw.map(coin => {
      const spark  = coin.sparkline_in_7d?.price || [];
      const rsi    = computeRSI(spark, 14);
      const ma7    = spark.length >= 7  ? avg(spark.slice(-7))  : coin.current_price;
      const ma20   = spark.length >= 20 ? avg(spark.slice(-20)) : coin.current_price;
      const vol    = spark.length > 1   ? computeVolatility(spark.slice(-24)) : 30;

      const bullish   = computeBullish(rsi, coin.price_change_percentage_24h_in_currency, coin.current_price, ma20);
      const signal    = getSignal(bullish);
      const edgeZone  = getEdgeZone(rsi, coin.current_price, ma20);
      const edgeLabel = Math.abs(bullish - 50) > 22 ? 'STRONG' : Math.abs(bullish - 50) > 10 ? 'MEDIUM' : 'WEAK';
      const confidence = Math.min(96, Math.round(50 + Math.abs(rsi - 50) * 0.9 + Math.abs(coin.price_change_percentage_24h_in_currency || 0) * 1.2));

      const reasons = [];
      const chg24 = coin.price_change_percentage_24h_in_currency || 0;
      if (chg24 > 3)  reasons.push(`+${chg24.toFixed(1)}% 24h momentum — bullish pressure`);
      else if (chg24 < -3) reasons.push(`${chg24.toFixed(1)}% 24h sell-off ongoing`);
      else reasons.push('24h price consolidating — no clear momentum');
      reasons.push(coin.current_price > ma20 ? 'trading above 20-period MA — bullish structure' : 'trading below 20-period MA — bearish structure');
      if (rsi > 68) reasons.push(`RSI ${rsi.toFixed(0)} — overbought territory, reversal risk`);
      else if (rsi < 32) reasons.push(`RSI ${rsi.toFixed(0)} — oversold, bounce potential`);
      else reasons.push(`RSI ${rsi.toFixed(0)} — neutral momentum`);
      reasons.push(`7d change: ${(coin.price_change_percentage_7d_in_currency||0).toFixed(1)}% · mkt cap rank #${coin.market_cap_rank}`);

      return {
        symbol:     coin.symbol.toUpperCase(),
        name:       coin.name,
        price:      coin.current_price,
        change24:   +(chg24).toFixed(2),
        change7d:   +(coin.price_change_percentage_7d_in_currency || 0).toFixed(2),
        change1h:   +(coin.price_change_percentage_1h_in_currency || 0).toFixed(2),
        marketCap:  coin.market_cap,
        volume24h:  coin.total_volume,
        rank:       coin.market_cap_rank,
        rsi:        +rsi.toFixed(1),
        ma7:        +ma7.toFixed(2),
        ma20:       +ma20.toFixed(2),
        volatility: +vol.toFixed(1),
        bullish,
        bearish:    100 - bullish,
        signal,
        edgeZone,
        edgeLabel,
        confidence,
        reasons,
        ath:        coin.ath,
        athChange:  +(coin.ath_change_percentage || 0).toFixed(1),
        image:      coin.image,
      };
    });

    res.json({ success: true, mode: 'live', data: enriched, source: 'CoinGecko', generatedAt: new Date().toISOString() });

  } catch (err) {
    res.json({ success: false, mode: 'simulation', error: err.message });
  }
};

// ── RSI Calculation ───────────────────────────────────────────────────────────
function computeRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

function computeVolatility(prices) {
  if (prices.length < 2) return 30;
  const returns = [];
  for (let i = 1; i < prices.length; i++) returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  const mean = returns.reduce((a,b)=>a+b,0) / returns.length;
  const variance = returns.reduce((a,b)=>a+Math.pow(b-mean,2),0) / returns.length;
  return +Math.sqrt(variance) * 100;
}

function avg(arr) { return arr.reduce((a,b)=>a+b,0) / arr.length; }

function computeBullish(rsi, chg24, price, ma20) {
  let score = 50;
  score += (rsi - 50) * 0.5;
  score += (chg24 || 0) * 2.5;
  score += price > ma20 ? 8 : -8;
  return Math.min(97, Math.max(3, Math.round(score)));
}

function getSignal(bull) {
  if (bull > 72) return { label: 'STRONG BUY',  color: '#00ff9d' };
  if (bull > 58) return { label: 'BUY',          color: '#7affc4' };
  if (bull > 45) return { label: 'NEUTRAL',      color: '#f0c040' };
  if (bull > 32) return { label: 'SELL',         color: '#ff6b6b' };
               return { label: 'STRONG SELL',  color: '#ff2d55' };
}

function getEdgeZone(rsi, price, ma20) {
  if (rsi > 70) return { zone: 'OVERBOUGHT', action: 'Reversal risk — consider exit',   risk: 'HIGH'   };
  if (rsi < 30) return { zone: 'OVERSOLD',   action: 'Bounce opportunity',              risk: 'MEDIUM' };
  if (price > ma20 * 1.05) return { zone: 'BREAKOUT',  action: 'Momentum play',         risk: 'MEDIUM' };
  if (price < ma20 * 0.95) return { zone: 'DISCOUNT',  action: 'Accumulation zone',     risk: 'LOW'    };
  return                          { zone: 'NEUTRAL',   action: 'Wait for clear signal',  risk: 'LOW'    };
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'EdgeX/2.0' } }, r => {
      let body = '';
      r.on('data', chunk => { body += chunk; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}
