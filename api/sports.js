// api/sports.js — API-Football (api-sports.io)
// Fetches each major league directly — no date+filter guesswork

const https = require('https');

const API_KEY = '475fee28ee58ec872d310f504542031a';
const FB_BASE = 'https://v3.football.api-sports.io';
const BB_BASE = 'https://v1.basketball.api-sports.io';
const HEADERS = { 'x-apisports-key': API_KEY };
const SEASON  = 2025;
const BB_SEASON = '2025-2026';

// Top leagues — fetched directly by ID
const TOP_LEAGUES = [
  { id: 39,  name: 'EPL' },
  { id: 140, name: 'La Liga' },
  { id: 78,  name: 'Bundesliga' },
  { id: 135, name: 'Serie A' },
  { id: 61,  name: 'Ligue 1' },
  { id: 2,   name: 'UCL' },
  { id: 3,   name: 'Europa League' },
  { id: 848, name: 'Conference League' },
];

// International / cup competitions
const INTL_LEAGUES = [
  { id: 5,   name: 'Nations League' },
  { id: 4,   name: 'Euros' },
  { id: 1,   name: 'World Cup' },
  { id: 6,   name: 'AFCON' },
  { id: 32,  name: 'WC Qual. Europe' },
  { id: 30,  name: 'WC Qual. S.America' },
  { id: 33,  name: 'WC Qual. Africa' },
  { id: 34,  name: 'WC Qual. CONCACAF' },
  { id: 31,  name: 'WC Qual. Asia' },
  { id: 960, name: 'Euro Qual.' },
  { id: 45,  name: 'FA Cup' },
  { id: 48,  name: 'Carabao Cup' },
  { id: 143, name: 'Copa del Rey' },
  { id: 137, name: 'Coppa Italia' },
  { id: 81,  name: 'DFB Pokal' },
  { id: 66,  name: 'Coupe de France' },
];

const ALL_FB_LEAGUES = [...TOP_LEAGUES, ...INTL_LEAGUES];

const BB_LEAGUES = [
  { id: 12,  name: 'NBA' },
  { id: 120, name: 'EuroLeague' },
  { id: 121, name: 'EuroCup' },
  { id: 119, name: 'ACB' },
  { id: 116, name: 'Betclic Elite' },
  { id: 114, name: 'LBA Italy' },
];

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { type, id } = req.query;

  try {
    switch (type) {

      // ── DEBUG ─────────────────────────────────────────────────────────────
      case 'test': {
        const status = await apiGet(FB_BASE + '/status', {});
        // Test direct league fetch — EPL today
        const epl = await fbGet('/fixtures', { league: 39, season: SEASON, date: todayStr(0) });
        const ucl = await fbGet('/fixtures', { league: 2,  season: SEASON, date: todayStr(0) });
        const lag = await fbGet('/fixtures', { league: 140,season: SEASON, date: todayStr(0) });
        return res.json({
          active:   status.response?.subscription?.active,
          requests: status.response?.requests,
          eplToday: (epl.response||[]).length,
          uclToday: (ucl.response||[]).length,
          lagToday: (lag.response||[]).length,
          eplSample: (epl.response||[]).slice(0,2).map(f=>({ home: f.teams?.home?.name, away: f.teams?.away?.name, status: f.fixture?.status?.short })),
        });
      }

      // ── FOOTBALL LIVE ─────────────────────────────────────────────────────
      case 'football-live': {
        // Fetch each top league directly for today — parallel requests
        const today = todayStr(0);
        const results = await Promise.allSettled(
          ALL_FB_LEAGUES.map(l => fbGet('/fixtures', { league: l.id, season: SEASON, date: today }))
        );

        let matches = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') matches.push(...(r.value.response || []));
        });

        // Sort: live first, then by league tier
        const topIds = TOP_LEAGUES.map(l => l.id);
        matches.sort((a, b) => {
          const aLive = ['1H','2H','ET','HT'].includes(a.fixture?.status?.short) ? 0 : 1;
          const bLive = ['1H','2H','ET','HT'].includes(b.fixture?.status?.short) ? 0 : 1;
          if (aLive !== bLive) return aLive - bLive;
          const aTier = topIds.includes(a.league?.id) ? 0 : 1;
          const bTier = topIds.includes(b.league?.id) ? 0 : 1;
          return aTier - bTier;
        });

        if (matches.length > 0) {
          const liveCount = matches.filter(f => ['1H','2H','ET'].includes(f.fixture?.status?.short)).length;
          return res.json({
            success: true,
            source:  liveCount > 0 ? 'live' : 'today',
            count:   matches.length,
            data:    matches.map(transformFixture),
          });
        }

        // Nothing today — look ahead day by day
        for (let i = 1; i <= 4; i++) {
          const nextDay = todayStr(i);
          const nextResults = await Promise.allSettled(
            TOP_LEAGUES.map(l => fbGet('/fixtures', { league: l.id, season: SEASON, date: nextDay }))
          );
          let nextMatches = [];
          nextResults.forEach(r => {
            if (r.status === 'fulfilled') nextMatches.push(...(r.value.response || []));
          });
          if (nextMatches.length > 0) {
            return res.json({ success: true, source: 'upcoming', data: nextMatches.map(transformFixture) });
          }
        }

        return res.json({ success: false, error: 'No matches found in next 4 days' });
      }

      // ── FOOTBALL FIXTURES ─────────────────────────────────────────────────
      case 'football-fixtures': {
        const all = [];
        // Fetch top leagues for next 7 days
        for (let i = 0; i <= 7; i++) {
          try {
            const d = todayStr(i);
            const dayResults = await Promise.allSettled(
              TOP_LEAGUES.map(l => fbGet('/fixtures', { league: l.id, season: SEASON, date: d }))
            );
            dayResults.forEach(r => {
              if (r.status === 'fulfilled') all.push(...(r.value.response || []));
            });
          } catch {}
        }
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 80).map(transformFixture) });
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

      // ── BASKETBALL LIVE ───────────────────────────────────────────────────
      case 'basketball-live': {
        const today = todayStr(0);
        const results = await Promise.allSettled(
          BB_LEAGUES.map(l => bbGet('/games', { league: l.id, season: BB_SEASON, date: today }))
        );
        let games = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') games.push(...(r.value.response || []));
        });

        if (games.length > 0) {
          const liveCount = games.filter(g => ['Q1','Q2','Q3','Q4','OT'].includes(g.status?.short)).length;
          return res.json({ success: true, source: liveCount > 0 ? 'live' : 'today', data: games.map(transformGame) });
        }

        // Look ahead
        for (let i = 1; i <= 3; i++) {
          const nextResults = await Promise.allSettled(
            BB_LEAGUES.map(l => bbGet('/games', { league: l.id, season: BB_SEASON, date: todayStr(i) }))
          );
          let nextGames = [];
          nextResults.forEach(r => {
            if (r.status === 'fulfilled') nextGames.push(...(r.value.response || []));
          });
          if (nextGames.length > 0) {
            return res.json({ success: true, source: 'upcoming', data: nextGames.map(transformGame) });
          }
        }
        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const all = [];
        for (let i = 0; i <= 5; i++) {
          try {
            const d = todayStr(i);
            const results = await Promise.allSettled(
              BB_LEAGUES.map(l => bbGet('/games', { league: l.id, season: BB_SEASON, date: d }))
            );
            results.forEach(r => {
              if (r.status === 'fulfilled') all.push(...(r.value.response || []));
            });
          } catch {}
        }
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 40).map(transformGame) });
        return res.json({ success: false, error: 'No fixtures found' });
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

  const events = (f.events || []).map(e => ({
    type:   e.type === 'Goal'  ? 'GOAL'   :
            e.type === 'Card'  ? (e.detail?.includes('Red') ? 'RED' : 'YELLOW') :
            e.type === 'subst' ? 'SUB'    : 'EVENT',
    minute: e.time?.elapsed || 0,
    player: e.player?.name  || '',
    team:   e.team?.id === f.teams?.home?.id ? 'home' : 'away',
    detail: e.type === 'Goal'
      ? `${e.player?.name} scores! (${e.detail})`
      : `${e.player?.name || ''} — ${e.detail || e.type}`,
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
    kickoff:    fix?.date ? new Date(fix.date).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    }) : '',
    date:       fix?.date || '',
    dayLabel,
    dayOffset:  diff,
    status:     edgeStatus,
    minute:     fix?.status?.elapsed || 0,
    isLive:     edgeStatus === 'LIVE',
    score:      { home: goals.home ?? 0, away: goals.away ?? 0 },
    hasScore,
    ht:         f.score?.halftime
      ? { home: f.score.halftime.home, away: f.score.halftime.away }
      : null,
    events,
    odds: null,
  };
}

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
    : diff === 1 ? 'TOMORROW'
    : matchDay.toLocaleDateString('en-GB', {
        weekday: 'short', month: 'short', day: 'numeric'
      }).toUpperCase();

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
    kickoff:  g.date ? new Date(g.date).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    }) : '',
    date:      g.date || '',
    dayLabel,
    dayOffset: diff,
    status:    edgeStatus,
    isLive:    edgeStatus === 'LIVE',
    score:     { home: sc.home?.total ?? 0, away: sc.away?.total ?? 0 },
    hasScore,
    quarters: {
      q1: sc.home?.quarter_1 != null ? `${sc.home.quarter_1}-${sc.away.quarter_1}` : null,
      q2: sc.home?.quarter_2 != null ? `${sc.home.quarter_2}-${sc.away.quarter_2}` : null,
      q3: sc.home?.quarter_3 != null ? `${sc.home.quarter_3}-${sc.away.quarter_3}` : null,
      q4: sc.home?.quarter_4 != null ? `${sc.home.quarter_4}-${sc.away.quarter_4}` : null,
    },
  };
}

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
        catch { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
          }
            
