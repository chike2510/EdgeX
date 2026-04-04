// api/polymarket.js — Polymarket Gamma API proxy
// Fetches LIVE markets from https://gamma-api.polymarket.com/markets
// No auth required. Returns flat array matching frontend parseMarket() expectations.

const https = require('https');

const GAMMA = 'https://gamma-api.polymarket.com';

// Polymarket tag IDs (verified from gamma-api.polymarket.com/tags)
const TAG_IDS = {
  crypto:   '21',
  sports:   '100381',
  politics: '100001',
  economy:  '100002',
  tech:     '100003',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { sort = 'volume', offset = '0', limit = '50', cat = 'all' } = req.query;

  // Build sort param for Gamma API
  const orderField = sort === 'end_date'   ? 'end_date_min'
                   : sort === 'liquidity'  ? 'liquidity'
                   : 'volume_24hr';
  const ascending  = sort === 'end_date' ? 'true' : 'false';

  // Base query string — always active, not closed
  let params = `active=true&closed=false&limit=${limit}&offset=${offset}&order=${orderField}&ascending=${ascending}`;

  // Add tag filter if category is not 'all'
  if (cat !== 'all' && TAG_IDS[cat]) {
    params += `&tag_id=${TAG_IDS[cat]}`;
  }

  const url = `${GAMMA}/markets?${params}`;

  try {
    const raw  = await fetchURL(url);
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      // Gamma API returned non-JSON (error page, rate limit, etc.)
      console.error('[EdgeX polymarket] parse error:', raw?.slice(0, 200));
      return res.end('[]');
    }

    // Gamma /markets returns an array directly
    if (Array.isArray(parsed)) {
      // Filter: must have a question and outcomePrices to be usable
      const valid = parsed.filter(m => m.question && m.outcomePrices);
      return res.end(JSON.stringify(valid));
    }

    // Some error response wrapped in object
    if (parsed?.error || parsed?.message) {
      console.error('[EdgeX polymarket] API error:', parsed.error || parsed.message);
      return res.end('[]');
    }

    return res.end('[]');
  } catch (e) {
    console.error('[EdgeX polymarket] fetch error:', e.message);
    res.end('[]');
  }
};

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EdgeX/2.0',
      },
    };
    https.get(url, options, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
