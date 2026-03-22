// /api/odds.js — The Odds API proxy (server-side only, never exposed to browser)
// ⚠️ Do NOT push this file to a public GitHub repo with the key hardcoded
//    Safer long-term: move key to Vercel env vars as ODDS_API_KEY

const https = require('https');

// Key — env var takes priority, hardcoded is fallback
const HARDCODED_KEY = 'dcbe4931afbdf35023dbf501b9c54598';

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
  h2h:     'h2h',
  spreads: 'spreads',
  totals:  'totals',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Use env var if set, otherwise use hardcoded key
  const API_KEY = process.env.ODDS_API_KEY || HARDCODED_KEY;

  const { sport = 'football_epl', markets = 'h2h,spreads,totals', region = 'eu' } = req.query;

  const sportKey  = SPORT_MAP[sport] || 'soccer_epl';
  const marketKeys = markets.split(',').map(m => MARKET_MAP[m] || m).join(',');

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=${region}&markets=${marketKeys}&oddsFormat=decimal&dateFormat=iso`;

  try {
    const data = await fetchJSON(url);

    // Validate — API returns an array of games
    if (!Array.isArray(data)) {
      return res.json({ success: false, mode: 'simulation', error: data?.message || 'Unexpected API response' });
    }

    const transformed = data.map(game => {
      const bookmakers = game.bookmakers || [];
      return {
        id:        game.id,
        home:      game.home_team,
        away:      game.away_team,
        kickoff:   game.commence_time,
        sport:     game.sport_key,
        bookmaker: bookmakers[0]?.title || 'The Odds API',
        odds: {
          h2h:     extractMarket(bookmakers, 'h2h'),
          spreads: extractMarket(bookmakers, 'spreads'),
          totals:  extractMarket(bookmakers, 'totals'),
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
      if (mkt.key === 'totals') out.point = mkt.outcomes[0]?.point;
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
