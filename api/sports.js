// api/sports.js — API-Football (api-sports.io) proxy
// 100 req/day free — football + basketball
// Docs: https://www.api-football.com/documentation-v3

const https = require('https');

const API_KEY = '475fee28ee58ec872d310f504542031a';
const FB_BASE = 'https://v3.football.api-sports.io';
const BB_BASE = 'https://v3.basketball.api-sports.io';
const HEADERS = { 'x-apisports-key': API_KEY };

// ── Exact league IDs — zero guesswork ─────────────────────────────────────────
const FOOTBALL_LEAGUES = [
  39,   // English Premier League
  2,    // UEFA Champions League
  140,  // La Liga
  78,   // Bundesliga
  135,  // Serie A
  61,   // Ligue 1
  3,    // UEFA Europa League
  848,  // UEFA Conference League
  45,   // FA Cup
  48,   // Carabao Cup
  143,  // Copa del Rey
  137,  // Coppa Italia
  88,   // Eredivisie
  94,   // Primeira Liga
  207,  // Scottish Premiership
  203,  // Super Lig
  144,  // Jupiler Pro League
  1,    // World Cup
  4,    // Euro Championship
  5,    // UEFA Nations League
  6,    // Africa Cup of Nations
  531,  // UEFA Super Cup
];

const BASKETBALL_LEAGUES = [
  12,   // NBA
  120,  // EuroLeague
  121,  // EuroCup
  119,  // ACB Spain
  117,  // BBL Germany
  116,  // Betclic Elite France
  114,  // LBA Italy
];

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { type, id } = req.query;

  try {
    switch (type) {

      case 'football-live': {
        // Fetch all live matches globally, filter to major leagues
        const live = await fbGet('/fixtures', { live: 'all' });
        const liveMatches = (live.response || []).filter(f => FOOTBALL_LEAGUES.includes(f.league?.id));

        if (liveMatches.length > 0) {
          return res.json({ success: true, source: 'live', data: liveMatches.map(transformFixture) });
        }

        // No live games — fetch today by date
        const today = await fbGet('/fixtures', { date: todayStr(0), timezone: 'UTC' });
        const todayFiltered = (today.response || []).filter(f => FOOTBALL_LEAGUES.includes(f.league?.id));
        if (todayFiltered.length > 0) {
          return res.json({ success: true, source: 'today', data: todayFiltered.map(transformFixture) });
        }

        // Look ahead up to 4 days
        for (let i = 1; i <= 4; i++) {
          const upcoming = await fbGet('/fixtures', { date: todayStr(i), timezone: 'UTC' });
          const filtered  = (upcoming.response || []).filter(f => FOOTBALL_LEAGUES.includes(f.league?.id));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'upcoming', data: filtered.map(transformFixture) });
          }
        }

        return res.json({ success: false, error: 'No major league matches found' });
      }

      case 'football-fixtures': {
        const all = [];
        for (let i = 0; i <= 6; i++) {
          try {
            const day      = await fbGet('/fixtures', { date: todayStr(i), timezone: 'UTC' });
            const filtered = (day.response || []).filter(f => FOOTBALL_LEAGUES.includes(f.league?.id));
            all.push(...filtered.map(transformFixture));
          } catch {}
        }
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 60) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await fbGet('/fixtures/lineups', { fixture: id });
        return res.json({ success: true, data: (data.response || []).map(transformLineup) });
      }

      case 'football-events': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await fbGet('/fixtures/events', { fixture: id });
        return res.json({ success: true, data: data.response || [] });
      }

      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await fbGet('/fixtures/statistics', { fixture: id });
        return res.json({ success: true, data: data.response || [] });
      }

      case 'football-odds': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await fbGet('/odds', { fixture: id, bookmaker: 6 });
        return res.json({ success: true, data: data.response || [] });
      }

      case 'basketball-live': {
        const live     = await bbGet('/games', { live: 'all' });
        const liveGames = (live.response || []).filter(g => BASKETBALL_LEAGUES.includes(g.league?.id));

        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformGame) });
        }

        const today     = await bbGet('/games', { date: todayStr(0), timezone: 'UTC' });
        const todayGames = (today.response || []).filter(g => BASKETBALL_LEAGUES.includes(g.league?.id));
        if (todayGames.length > 0) {
          return res.json({ success: true, source: 'today', data: todayGames.map(transformGame) });
        }

        for (let i = 1; i <= 3; i++) {
          const upcoming = await bbGet('/games', { date: todayStr(i), timezone: 'UTC' });
          const filtered  = (upcoming.response || []).filter(g => BASKETBALL_LEAGUES.includes(g.league?.id));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'upcoming', data: filtered.map(transformGame) });
          }
        }

        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const all = [];
        for (let i = 0; i <= 5; i++) {
          try {
            const day      = await bbGet('/games', { date: todayStr(i), timezone: 'UTC' });
            const filtered = (day.response || []).filter(g => BASKETBALL_LEAGUES.includes(g.league?.id));
            all.push(...filtered.map(transformGame));
          } catch {}
        }
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 40) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'test': {
        // Debug — check API key status and raw response
        const status = await apiGet(FB_BASE + '/status', {});
        const todayRaw = await fbGet('/fixtures', { date: todayStr(0), timezone: 'UTC' });
        return res.json({
          apiStatus: status,
          todayTotal: todayRaw.results || 0,
          todaySample: (todayRaw.response || []).slice(0,3).map(f => ({
            id: f.fixture?.id,
            league: f.league?.name,
            leagueId: f.league?.id,
            home: f.teams?.home?.name,
            away: f.teams?.away?.name,
            date: f.fixture?.date,
          })),
          errors: todayRaw.errors,
        });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    console.error('sports.js error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Transform football fixture ────────────────────────────────────────────────
function transformFixture(f) {
  const fix    = f.fixture;
  const status = fix?.status?.short;

  const edgeStatus =
    ['1H','2H','ET','P'].includes(status) ? 'LIVE' :
    status === 'HT'                        ? 'HT'   :
    ['FT','AET','PEN'].includes(status)    ? 'FT'   : 'NS';

  const today    = new Date(); today.setHours(0,0,0,0);
  const matchDay = new Date(fix?.date); matchDay.setHours(0,0,0,0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY'
    : diff === 1  ? 'TOMORROW'
    : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const goals    = f.goals || {};
  const hasScore = goals.home !== null && goals.home !== undefined;
  const scoreHT  = f.score?.halftime;

  const events = (f.events || []).map(e => ({
    type:   e.type === 'Goal' ? 'GOAL' : e.type === 'Card' ? (e.detail?.includes('Red') ? 'RED' : 'YELLOW') : e.type === 'subst' ? 'SUB' : 'EVENT',
    minute: e.time?.elapsed || 0,
    player: e.player?.name || '',
    team:   e.team?.id === f.teams?.home?.id ? 'home' : 'away',
    detail: e.type === 'Goal' ? `${e.player?.name} scores! (${e.detail})` : `${e.player?.name || ''} — ${e.detail || e.type}`,
  })).sort((a, b) => b.minute - a.minute);

  return {
    id:         String(fix?.id),
    home:       f.teams?.home?.name  || '',
    away:       f.teams?.away?.name  || '',
    homeLogo:   f.teams?.home?.logo  || '',
    awayLogo:   f.teams?.away?.logo  || '',
    league:     f.league?.name       || '',
    leagueId:   f.league?.id,
    leagueLogo: f.league?.logo       || '',
    country:    f.league?.country    || '',
    round:      f.league?.round      || '',
    venue:      fix?.venue?.name     || '',
    referee:    fix?.referee         || '',
    kickoff:    fix?.date ? new Date(fix.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
    date:       fix?.date            || '',
    dayLabel,
    dayOffset:  diff,
    status:     edgeStatus,
    minute:     fix?.status?.elapsed || 0,
    isLive:     edgeStatus === 'LIVE',
    score:      { home: goals.home ?? 0, away: goals.away ?? 0 },
    hasScore,
    ht:         scoreHT ? { home: scoreHT.home, away: scoreHT.away } : null,
    events,
    odds:       null,
  };
}

// ── Transform lineup ──────────────────────────────────────────────────────────
function transformLineup(l) {
  return {
    team:      l.team?.name || '',
    formation: l.formation  || '',
    players:   (l.startXI  || []).map(p => ({
      name:   p.player?.name   || '',
      number: p.player?.number || '',
      pos:    p.player?.pos    || '',
      grid:   p.player?.grid   || '',
    })),
    subs: (l.substitutes || []).map(p => ({
      name:   p.player?.name   || '',
      number: p.player?.number || '',
    })),
  };
}

// ── Transform basketball game ─────────────────────────────────────────────────
function transformGame(g) {
  const status = g.status?.short;
  const edgeStatus =
    ['Q1','Q2','Q3','Q4','OT'].includes(status) ? 'LIVE' :
    status === 'HT'                              ? 'HT'   :
    ['FT','AOT'].includes(status)                ? 'FT'   : 'NS';

  const today    = new Date(); today.setHours(0,0,0,0);
  const matchDay = new Date(g.date); matchDay.setHours(0,0,0,0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY'
    : diff === 1  ? 'TOMORROW'
    : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const sc       = g.scores || {};
  const hasScore = sc.home?.total !== null && sc.home?.total !== undefined;

  return {
    id:       String(g.id),
    home:     g.teams?.home?.name || '',
    away:     g.teams?.away?.name || '',
    homeLogo: g.teams?.home?.logo || '',
    awayLogo: g.teams?.away?.logo || '',
    league:   g.league?.name      || '',
    leagueId: g.league?.id,
    kickoff:  g.date ? new Date(g.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
    date:     g.date  || '',
    dayLabel,
    dayOffset: diff,
    status:   edgeStatus,
    isLive:   edgeStatus === 'LIVE',
    score: {
      home: sc.home?.total ?? 0,
      away: sc.away?.total ?? 0,
    },
    hasScore,
    quarters: {
      q1: sc.home?.quarter_1 != null ? `${sc.home.quarter_1}-${sc.away.quarter_1}` : null,
      q2: sc.home?.quarter_2 != null ? `${sc.home.quarter_2}-${sc.away.quarter_2}` : null,
      q3: sc.home?.quarter_3 != null ? `${sc.home.quarter_3}-${sc.away.quarter_3}` : null,
      q4: sc.home?.quarter_4 != null ? `${sc.home.quarter_4}-${sc.away.quarter_4}` : null,
    },
  };
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function fbGet(path, params = {}) { return apiGet(FB_BASE + path, params); }
function bbGet(path, params = {}) { return apiGet(BB_BASE + path, params); }

function apiGet(url, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    https.get(u.toString(), { headers: HEADERS }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Invalid JSON from API-Football')); }
      });
    }).on('error', reject);
  });
}

// Temporary debug export — visit /api/sports?type=test to check API status
// Remove after confirming API works
        
