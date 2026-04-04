// api/polymarket.js — Polymarket Gamma API proxy (bypasses CORS)
// Supports tag-based filtering: sports, crypto, politics, economy, forex
const https = require('https');

const GAMMA = 'https://gamma-api.polymarket.com';

// Polymarket tag IDs — verified from GET /tags
const TAG_MAP = {
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

  const {
    sort   = 'volume',
    offset = '0',
    limit  = '50',
    cat    = 'all',
  } = req.query;

  // Map sort param to Gamma API field
  const sortField = sort === 'end_date'  ? 'end_date_min'
                  : sort === 'liquidity' ? 'liquidity'
                  : 'volume_24hr';
  const ascending = sort === 'end_date' ? 'true' : 'false';

  const base = `active=true&closed=false&limit=${limit}&offset=${offset}&order=${sortField}&ascending=${ascending}`;

  let url;
  if (cat !== 'all' && TAG_MAP[cat]) {
    // Category filter using tag_id on the /markets endpoint
    // /markets is simpler and always returns flat market objects with question + outcomePrices
    url = `${GAMMA}/markets?${base}&tag_id=${TAG_MAP[cat]}`;
  } else {
    url = `${GAMMA}/markets?${base}`;
  }

  try {
    const raw  = await fetch_url(url);
    const data = JSON.parse(raw);

    // /markets returns an array of market objects directly
    // Each has: question, outcomePrices, volume, liquidity, endDate, etc.
    if (Array.isArray(data)) {
      res.end(JSON.stringify(data));
      return;
    }

    // Some versions wrap in { data: [...] }
    if (Array.isArray(data?.data)) {
      res.end(JSON.stringify(data.data));
      return;
    }

    // Fallback — return empty array so frontend shows empty state not crash
    res.end('[]');
  } catch(e) {
    console.error('[EdgeX polymarket]', e.message);
    res.end('[]');
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
