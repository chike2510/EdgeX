// api/polymarket.js — server-side Polymarket proxy (bypasses CORS)
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { sort = 'volume', offset = '0', limit = '50' } = req.query;
  const sortParam = sort === 'end_date' ? 'end_date_min' : sort;
  const asc       = sort === 'end_date' ? 'true' : 'false';

  const url = `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=${offset}&active=true&closed=false&order=${sortParam}&ascending=${asc}`;

  try {
    const data = await fetch_url(url);
    res.end(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

function fetch_url(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'EdgeX/1.0' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
