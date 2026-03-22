// /api/events.js — Live prediction markets via Polymarket public API
// No API key needed — fully public

const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Polymarket Gamma API — active markets, sorted by volume
    const url = 'https://gamma-api.polymarket.com/markets?limit=24&active=true&closed=false&order=volume&ascending=false';
    const raw = await fetchJSON(url);

    if (!Array.isArray(raw) || raw.length === 0) {
      return res.json({ success: true, mode: 'simulation', data: getFallbackEvents() });
    }

    const events = raw
      .filter(m => m.question && m.outcomePrices && m.question.length < 140)
      .slice(0, 16)
      .map(m => {
        // outcomePrices is a JSON string like "[\"0.72\",\"0.28\"]"
        let prices = [];
        try { prices = JSON.parse(m.outcomePrices); } catch {}
        const yesPct = prices.length > 0 ? Math.round(parseFloat(prices[0]) * 100) : 50;
        const noPct  = 100 - yesPct;

        let outcomes = [];
        try { outcomes = JSON.parse(m.outcomes || '[]'); } catch {}

        const verdict    = yesPct > 60 ? 'LIKELY' : yesPct < 40 ? 'UNLIKELY' : 'UNCERTAIN';
        const verdictColor = yesPct > 60 ? 'var(--neon)' : yesPct < 40 ? 'var(--red)' : 'var(--yellow)';
        const edgeLabel  = Math.abs(yesPct-50) > 20 ? 'STRONG' : Math.abs(yesPct-50) > 10 ? 'MEDIUM' : 'WEAK';
        const volume     = m.volume ? `$${formatVolume(parseFloat(m.volume))} traded` : null;

        // Build category from question keywords
        const q  = m.question.toLowerCase();
        const cat = q.includes('bitcoin')||q.includes('crypto')||q.includes('eth') ? 'Crypto'
          : q.includes('election')||q.includes('president')||q.includes('vote') ? 'Politics'
          : q.includes('fed')||q.includes('rate')||q.includes('gdp')||q.includes('inflation') ? 'Economy'
          : q.includes('nba')||q.includes('nfl')||q.includes('soccer')||q.includes('champion') ? 'Sports'
          : q.includes('ai')||q.includes('tech')||q.includes('apple')||q.includes('openai') ? 'Technology'
          : 'Markets';

        const factors = buildFactors(m, yesPct, volume);

        return {
          id:            m.id || m.conditionId,
          question:      m.question,
          category:      cat,
          yesPct,
          noPct,
          verdict,
          verdictColor,
          edgeLabel,
          confidence:    Math.min(95, Math.round(50 + Math.abs(yesPct-50) * 0.8 + (m.liquidity ? Math.min(20, parseFloat(m.liquidity)/5000) : 0))),
          factors,
          volume:        m.volume ? parseFloat(m.volume) : 0,
          volumeLabel:   volume,
          endDate:       m.endDate ? new Date(m.endDate).toLocaleDateString('en-GB') : null,
          outcomes:      outcomes.length > 0 ? outcomes : ['Yes','No'],
          live:          true,
          url:           m.url || null,
        };
      });

    res.json({ success: true, mode: 'live', data: events, source: 'Polymarket', generatedAt: new Date().toISOString() });

  } catch (err) {
    // Fallback to curated simulation events
    res.json({ success: true, mode: 'simulation', data: getFallbackEvents(), error: err.message });
  }
};

function buildFactors(market, yesPct, volume) {
  const factors = [];
  if (volume) factors.push(`${volume} on Polymarket — strong liquidity signal`);
  if (yesPct > 70)      factors.push(`crowd strongly pricing YES at ${yesPct}% — high conviction`);
  else if (yesPct < 30) factors.push(`crowd strongly pricing NO — ${100-yesPct}% against`);
  else                  factors.push(`market divided — ${yesPct}% YES vs ${100-yesPct}% NO`);
  if (market.endDate) {
    const days = Math.round((new Date(market.endDate) - new Date()) / 86400000);
    if (days > 0) factors.push(`resolves in ${days} day${days===1?'':'s'}`);
  }
  if (market.liquidity && parseFloat(market.liquidity) > 10000) factors.push('deep liquidity — price reliable');
  if (factors.length < 3) factors.push('Polymarket crowd-sourced probability — real money at stake');
  if (factors.length < 4) factors.push('probabilities update in real-time as traders buy/sell');
  return factors;
}

function formatVolume(v) {
  if (v >= 1e6) return (v/1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v/1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

function getFallbackEvents() {
  return [
    { question:'Will Bitcoin hit $100K before end of 2025?', category:'Crypto', yesPct:54, noPct:46, verdict:'UNCERTAIN', verdictColor:'var(--yellow)', edgeLabel:'MEDIUM', confidence:72, factors:['ETF inflows accelerating in Q1 2025','halving supply shock reducing sell pressure','macro uncertainty remains a headwind','options market pricing ~50% probability'], live:false },
    { question:'Will the Fed cut rates in 2025?', category:'Economy', yesPct:76, noPct:24, verdict:'LIKELY', verdictColor:'var(--neon)', edgeLabel:'STRONG', confidence:81, factors:['inflation trending toward 2% target','labour market cooling gradually','Fed dot plot suggests 2 cuts in 2025','markets pricing 75% probability'], live:false },
    { question:'Will Ethereum flip Bitcoin market cap by 2026?', category:'Crypto', yesPct:18, noPct:82, verdict:'UNLIKELY', verdictColor:'var(--red)', edgeLabel:'STRONG', confidence:78, factors:['BTC dominance historically sticky','institutional flows strongly favouring BTC','ETH staking mechanics beneficial but not enough','historical flippening attempts all failed'], live:false },
    { question:'Will AI replace 10% of software jobs by 2026?', category:'Technology', yesPct:35, noPct:65, verdict:'UNLIKELY', verdictColor:'var(--red)', edgeLabel:'MEDIUM', confidence:66, factors:['AI coding tools adoption accelerating','enterprises cutting junior dev hiring','senior roles resilient so far','regulatory friction may slow deployment'], live:false },
  ];
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'EdgeX/2.0' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}
