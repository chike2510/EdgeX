// api/sports.js — EdgeX v2.0 Sports Proxy
// Proxies ESPN API calls to avoid CORS issues on client
// Free, no API key needed — ESPN public endpoints

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sport, league, date, event_id } = req.query;

  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';

  const ROUTES = {
    // Football / Soccer
    'soccer/eng.1':           `${ESPN}/soccer/eng.1/scoreboard`,
    'soccer/uefa.champions':  `${ESPN}/soccer/uefa.champions/scoreboard`,
    'soccer/uefa.europa':     `${ESPN}/soccer/uefa.europa/scoreboard`,
    'soccer/uefa.eurconf':    `${ESPN}/soccer/uefa.eurconf/scoreboard`,
    'soccer/esp.1':           `${ESPN}/soccer/esp.1/scoreboard`,
    'soccer/ger.1':           `${ESPN}/soccer/ger.1/scoreboard`,
    'soccer/ita.1':           `${ESPN}/soccer/ita.1/scoreboard`,
    'soccer/fra.1':           `${ESPN}/soccer/fra.1/scoreboard`,
    'soccer/ned.1':           `${ESPN}/soccer/ned.1/scoreboard`,
    'soccer/por.1':           `${ESPN}/soccer/por.1/scoreboard`,
    'soccer/sco.1':           `${ESPN}/soccer/sco.1/scoreboard`,
    'soccer/tur.1':           `${ESPN}/soccer/tur.1/scoreboard`,
    'soccer/bel.1':           `${ESPN}/soccer/bel.1/scoreboard`,
    'soccer/gre.1':           `${ESPN}/soccer/gre.1/scoreboard`,
    'soccer/rus.1':           `${ESPN}/soccer/rus.1/scoreboard`,
    'soccer/ukr.1':           `${ESPN}/soccer/ukr.1/scoreboard`,
    'soccer/aut.1':           `${ESPN}/soccer/aut.1/scoreboard`,
    'soccer/swe.1':           `${ESPN}/soccer/swe.1/scoreboard`,
    'soccer/den.1':           `${ESPN}/soccer/den.1/scoreboard`,
    'soccer/nor.1':           `${ESPN}/soccer/nor.1/scoreboard`,
    'soccer/che.1':           `${ESPN}/soccer/che.1/scoreboard`,
    'soccer/eng.2':           `${ESPN}/soccer/eng.2/scoreboard`,
    'soccer/eng.3':           `${ESPN}/soccer/eng.3/scoreboard`,
    'soccer/mex.1':           `${ESPN}/soccer/mex.1/scoreboard`,
    'soccer/usa.1':           `${ESPN}/soccer/usa.1/scoreboard`,
    'soccer/arg.1':           `${ESPN}/soccer/arg.1/scoreboard`,
    'soccer/bra.1':           `${ESPN}/soccer/bra.1/scoreboard`,
    'soccer/jpn.1':           `${ESPN}/soccer/jpn.1/scoreboard`,
    'soccer/kor.1':           `${ESPN}/soccer/kor.1/scoreboard`,
    'soccer/sau.1':           `${ESPN}/soccer/sau.1/scoreboard`,
    'soccer/egy.1':           `${ESPN}/soccer/egy.1/scoreboard`,
    'soccer/mar.1':           `${ESPN}/soccer/mar.1/scoreboard`,
    'soccer/rsa.1':           `${ESPN}/soccer/rsa.1/scoreboard`,
    'soccer/nga.1':           `${ESPN}/soccer/nga.1/scoreboard`,
    'soccer/chn.1':           `${ESPN}/soccer/chn.1/scoreboard`,
    'soccer/aus.1':           `${ESPN}/soccer/aus.1/scoreboard`,
    'soccer/concacaf.champions': `${ESPN}/soccer/concacaf.champions/scoreboard`,
    'soccer/conmebol.copa':   `${ESPN}/soccer/conmebol.copa/scoreboard`,
    'soccer/caf.cl':          `${ESPN}/soccer/caf.cl/scoreboard`,
    'soccer/afc.cl':          `${ESPN}/soccer/afc.cl/scoreboard`,
    // Basketball
    'basketball/nba':         `${ESPN}/basketball/nba/scoreboard`,
    'basketball/wnba':        `${ESPN}/basketball/wnba/scoreboard`,
    'basketball/ncaa':        `${ESPN}/basketball/mens-college-basketball/scoreboard`,
  };

  const key = `${sport}/${league}`;
  const baseUrl = ROUTES[key];

  if (!baseUrl) {
    return res.status(400).json({ error: 'Unknown sport/league combination', available: Object.keys(ROUTES) });
  }

  try {
    let url;
    if (event_id) {
      // Route to summary endpoint for match detail page
      const summaryBase = `${ESPN}/${sport}/${league}/summary`;
      url = `${summaryBase}?event=${event_id}`;
    } else {
      const params = new URLSearchParams();
      if (date) params.set('dates', date);
      url = `${baseUrl}${params.toString() ? '?' + params : ''}`;
    }

    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'EdgeX/2.0' },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `ESPN returned ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Upstream fetch failed', message: err.message });
  }
}
