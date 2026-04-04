// api/polymarket.js — Polymarket Gamma API proxy (bypasses CORS)
// Supports: sports, crypto, forex markets + tag-based filtering
const https = require('https');

const GAMMA = 'https://gamma-api.polymarket.com';

// Polymarket tag IDs (from GET /tags)
// Sports: 100381 (Sports), Crypto: 21 (Crypto), Forex/Finance: Economy tags
const TAG_IDS = {
  sports:   '100381',  // Sports tag
  crypto:   '21',      // Crypto tag
  politics: '100001',  // Politics
  economy:  '100002',  // Economy / Finance
  tech:     '100003',  // Tech
  forex:    '100002',  // Reuse economy for forex/macro
};

// Sport-specific series slugs for Polymarket
const SPORT_TAGS = {
  football: 'soccer',
  basketball: 'basketball',
  nba: 'nba',
  epl: 'premier-league',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { sort = 'volume', offset = '0', limit = '50', cat = 'all', tag_id = '' } = req.query;

  try {
    // Build the Gamma API URL based on category
    let url;
    const baseParams = `limit=${limit}&offset=${offset}&active=true&closed=false`;

    if (tag_id) {
      // Direct tag ID filter (used for sports, crypto)
      const sortParam = sort === 'end_date' ? 'end_date_min' : sort === 'liquidity' ? 'liquidity' : 'volume_24hr';
      const asc = sort === 'end_date' ? 'true' : 'false';
      url = `${GAMMA}/events?${baseParams}&tag_id=${tag_id}&order=${sortParam}&ascending=${asc}&related_tags=true`;
    } else if (cat !== 'all' && TAG_IDS[cat]) {
      const sortParam = sort === 'end_date' ? 'end_date_min' : sort === 'liquidity' ? 'liquidity' : 'volume_24hr';
      const asc = sort === 'end_date' ? 'true' : 'false';
      url = `${GAMMA}/events?${baseParams}&tag_id=${TAG_IDS[cat]}&order=${sortParam}&ascending=${asc}&related_tags=true`;
    } else {
      // All markets
      const sortParam = sort === 'end_date' ? 'end_date_min' : sort === 'liquidity' ? 'liquidity' : 'volume_24hr';
      const asc = sort === 'end_date' ? 'true' : 'false';
      url = `${GAMMA}/events?${baseParams}&order=${sortParam}&ascending=${asc}`;
    }

    const data = await fetch_url(url);
    const parsed = JSON.parse(data);

    // Gamma /events returns events with nested markets
    // Flatten to market-level for compatibility with frontend
    if (Array.isArray(parsed)) {
      const markets = [];
      for (const event of parsed) {
        if (!event.markets) {
          // Direct market format (old /markets endpoint)
          markets.push(event);
          continue;
        }
        // Events format — expand each market with event context
        for (const mkt of event.markets || []) {
          markets.push({
            ...mkt,
            question:      mkt.question || event.title,
            outcomePrices: mkt.outcomePrices,
            volume:        mkt.volume || event.volume || 0,
            liquidity:     mkt.liquidity || event.liquidity || 0,
            endDate:       mkt.endDate || event.endDate,
            tags:          event.tags || [],
            eventSlug:     event.slug || '',
            eventTitle:    event.title || '',
          });
        }
      }
      res.end(JSON.stringify(markets));
    } else {
      res.end(data);
    }
  } catch(e) {
    // Fallback to old markets endpoint
    try {
      const sortParam = sort === 'end_date' ? 'end_date_min' : sort;
      const asc = sort === 'end_date' ? 'true' : 'false';
      const fallbackUrl = `${GAMMA}/markets?limit=${limit}&offset=${offset}&active=true&closed=false&order=${sortParam}&ascending=${asc}`;
      const data = await fetch_url(fallbackUrl);
      res.end(data);
    } catch(e2) {
      res.status(500).json({ error: e2.message });
    }
  }
};

function fetch_url(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EdgeX/2.0',
      }
    }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
