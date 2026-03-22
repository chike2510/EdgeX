// /api/odds.js — The Odds API proxy (keeps API key server-side)
// Get free key at https://the-odds-api.com — 500 requests/month free
// Add ODDS_API_KEY to Vercel environment variables

const https = require('https');

const SPORT_MAP = {
  football_epl:    'soccer_epl',
  football_ucl:    'soccer_uefa_champs_league',
  football_laliga: 'soccer_spain_la_liga',
  football_bund:   'soccer_germany_bundesliga',
  football_seriea: 'soccer_italy_serie_a',
  football_ligue1: 'soccer_france_ligue_one',
  basketball_nba:  'basketball_nba',
  basketball_nbl:  'basketball_euroleague',
};

const MARKET_MAP = {
  h2h:     'h2h',       // Moneyline / 1X2
  spreads: 'spreads',   // Handicap / Spread
  totals:  'totals',    // Over/Under
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const API_KEY = process.env.ODDS_API_KEY;

  if (!API_KEY) {
    return res.json({
      success: false,
      mode: 'simulation',
      error: 'ODDS_API_KEY not configured. Add it to Vercel environment variables.',
    });
  }

  const { sport = 'football_epl', markets = 'h2h,spreads,totals', region = 'eu' } = req.query;

  const sportKey = SPORT_MAP[sport] || 'soccer_epl';
  const marketKeys = markets.split(',').map(m => MARKET_MAP[m] || m).join(',');

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=${region}&markets=${marketKeys}&oddsFormat=decimal&dateFormat=iso`;

  try {
    const data = await fetchJSON(url);

    // Transform to EdgeX format
    const transformed = data.map(game => {
      const bookmakers = game.bookmakers || [];
      const h2h = extractMarket(bookmakers, 'h2h');
      const spreads = extractMarket(bookmakers, 'spreads');
      const totals = extractMarket(bookmakers, 'totals');

      return {
        id: game.id,
        home: game.home_team,
        away: game.away_team,
        kickoff: game.commence_time,
        sport: game.sport_key,
        bookmaker: bookmakers[0]?.title || 'The Odds API',
        odds: {
          h2h: h2h,
          spreads: spreads,
          totals: totals,
        },
      };
    });

    res.json({
      success: true,
      mode: 'live',
      data: transformed,
      count: transformed.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.json({ success: false, mode: 'simulation', error: err.message });
  }
};

function extractMarket(bookmakers, key) {
  for (const bm of bookmakers) {
    const mkt = bm.markets?.find(m => m.key === key);
    if (mkt) {
      const out = {};
      mkt.outcomes.forEach(o => { out[o.name] = o.price; });
      if (mkt.key === 'totals') {
        out.point = mkt.outcomes[0]?.point;
      }
      return out;
    }
  }
  return null;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON from Odds API')); }
      });
    }).on('error', reject);
  });
}
