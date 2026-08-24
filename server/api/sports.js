// api/sports.js — EdgeX v2.0 Sports Proxy
// Proxies ESPN API calls to avoid CORS issues on client
// Free, no API key needed — ESPN public endpoints
import { sportApiProvider } from '../historical/sportapi-runtime.js';
import { creativesDevProvider } from '../historical/creativesdev-runtime.js';

function compactDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{8}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replaceAll('-', '');
  return raw;
}

function isoDate(value) {
  const compact = compactDate(value);
  return /^\d{8}$/.test(compact) ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}` : String(value || '');
}

function scoreboardEvent(fixture, league) {
  const state = fixture.status === 'live' ? 'in' : fixture.completed ? 'post' : fixture.status === 'scheduled' ? 'pre' : fixture.status;
  return {
    id: fixture.providerEventId,
    date: fixture.kickoff,
    name: `${fixture.homeTeam.name} at ${fixture.awayTeam.name}`,
    shortName: `${fixture.homeTeam.shortName || fixture.homeTeam.name} at ${fixture.awayTeam.shortName || fixture.awayTeam.name}`,
    competitions: [{
      id: fixture.providerEventId,
      competitors: [
        { homeAway: 'home', score: fixture.score.home == null ? undefined : String(fixture.score.home), team: { id: fixture.homeTeam.id, displayName: fixture.homeTeam.name, shortDisplayName: fixture.homeTeam.shortName, logo: fixture.homeTeam.logoUrl } },
        { homeAway: 'away', score: fixture.score.away == null ? undefined : String(fixture.score.away), team: { id: fixture.awayTeam.id, displayName: fixture.awayTeam.name, shortDisplayName: fixture.awayTeam.shortName, logo: fixture.awayTeam.logoUrl } },
      ],
      status: { type: { state, completed: fixture.completed, description: fixture.completed ? 'Full Time' : fixture.status === 'live' ? 'In Progress' : 'Scheduled' } },
      venue: fixture.venue?.name ? { fullName: fixture.venue.name } : undefined,
    }],
    _provider: fixture.provenance?.provider,
    _league: league,
  };
}

async function footballFixtures(date, league) {
  const compact = compactDate(date);
  const chain = [];
  if (/^\d{8}$/.test(compact)) {
    try {
      const sportApi = await sportApiProvider.getScheduledEvents(compact);
      chain.push({ provider: 'sportapi', status: sportApi.status, returned: sportApi.data.length });
      if (sportApi.data.length) return { events: sportApi.data.map((fixture) => scoreboardEvent(fixture, league)), provider: 'sportapi', dataQuality: 'available', providerChain: chain };
    } catch (error) {
      chain.push({ provider: 'sportapi', status: 'unavailable', returned: 0, error: error?.message || 'request failed' });
    }
    try {
      const creatives = await creativesDevProvider.getMatchesByDate(isoDate(compact));
      chain.push({ provider: 'creativesdev', status: creatives.status, returned: creatives.data.length });
      if (creatives.data.length) return { events: creatives.data.map((fixture) => scoreboardEvent(fixture, league)), provider: 'creativesdev', dataQuality: 'available', providerChain: chain };
    } catch (error) {
      chain.push({ provider: 'creativesdev', status: 'unavailable', returned: 0, error: error?.message || 'request failed' });
    }
  }
  return { compact, chain };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sport, league, date, event_id } = req.query;

  // The site.api host returns Akamai 403s from Vercel; the public web API host serves the same scoreboard payloads.
  const ESPN = 'https://site.web.api.espn.com/apis/site/v2/sports';

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
    'soccer/fifa.world':       `${ESPN}/soccer/fifa.world/scoreboard`,
    'soccer/concacaf.nations.league': `${ESPN}/soccer/concacaf.nations.league/scoreboard`,
    'soccer/conmebol.1':       `${ESPN}/soccer/conmebol.1/scoreboard`,
    // Basketball
    'basketball/nba':         `${ESPN}/basketball/nba/scoreboard`,
    'basketball/wnba':        `${ESPN}/basketball/wnba/scoreboard`,
    'basketball/ncaa':        `${ESPN}/basketball/mens-college-basketball/scoreboard`,
    'basketball/nba-g-league': `${ESPN}/basketball/nba-g-league/scoreboard`,
    'basketball/mens-college-basketball': `${ESPN}/basketball/mens-college-basketball/scoreboard`,
    'basketball/womens-college-basketball': `${ESPN}/basketball/womens-college-basketball/scoreboard`,
    'basketball/euroleague': `${ESPN}/basketball/euroleague/scoreboard`,
    'basketball/eurocup': `${ESPN}/basketball/eurocup/scoreboard`,
    'basketball/esp.acb': `${ESPN}/basketball/esp.acb/scoreboard`,
    'basketball/ger.bbl': `${ESPN}/basketball/ger.bbl/scoreboard`,
    'basketball/ita.lba': `${ESPN}/basketball/ita.lba/scoreboard`,
    'basketball/fra.pro-a': `${ESPN}/basketball/fra.pro-a/scoreboard`,
    'basketball/tur.bsl': `${ESPN}/basketball/tur.bsl/scoreboard`,
    'basketball/gre.basket': `${ESPN}/basketball/gre.basket/scoreboard`,
    'basketball/bra.nbb': `${ESPN}/basketball/bra.nbb/scoreboard`,
    'basketball/ven.bcaa': `${ESPN}/basketball/ven.bcaa/scoreboard`,
    'basketball/arg.la': `${ESPN}/basketball/arg.la/scoreboard`,
    'basketball/pur.bsn': `${ESPN}/basketball/pur.bsn/scoreboard`,
    'basketball/uru.lub': `${ESPN}/basketball/uru.lub/scoreboard`,
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
    } else if (sport === 'soccer') {
      const fallback = await footballFixtures(date, league);
      if (fallback.events) return res.status(200).json({ leagues: [{ id: league, slug: league }], ...fallback });
      const params = new URLSearchParams();
      if (fallback.compact) params.set('dates', fallback.compact);
      url = `${baseUrl}${params.toString() ? '?' + params : ''}`;
      req._providerChain = fallback.chain;
    } else {
      const params = new URLSearchParams();
      if (date) params.set('dates', compactDate(date));
      url = `${baseUrl}${params.toString() ? '?' + params : ''}`;
    }

    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'EdgeX/2.0' },
    });

        if (!upstream.ok) {
      if (upstream.status === 400 || upstream.status === 404) {
        return res.status(200).json({ leagues: [], events: [], provider: 'ESPN', providerChain: req._providerChain || [], dataQuality: 'unavailable', upstreamStatus: upstream.status });
      }
      return res.status(upstream.status).json({ error: `ESPN returned ${upstream.status}`, providerChain: req._providerChain || [] });
    }
    const data = await upstream.json();
    if (req._providerChain) data.providerChain = [...req._providerChain, { provider: 'espn', status: 'available', returned: Array.isArray(data.events) ? data.events.length : 0 }];
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Upstream fetch failed', message: err.message });
  }
}
