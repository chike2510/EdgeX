// api/sports.js — API-Football proxy
// Uses league+season+next/last — not league+date (not supported on free plan)

const https = require('https');

const API_KEY = '475fee28ee58ec872d310f504542031a';
const FB_BASE = 'https://v3.football.api-sports.io';
const BB_BASE = 'https://v1.basketball.api-sports.io';
const HEADERS = { 'x-apisports-key': API_KEY };
const SEASON  = 2025; // 2025-26 season

const TOP_LEAGUES = [
  { id: 39,  name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 78,  name: 'Bundesliga' },
  { id: 135, name: 'Serie A' },
  { id: 61,  name: 'Ligue 1' },
  { id: 2,   name: 'Champions League' },
  { id: 3,   name: 'Europa League' },
  { id: 848, name: 'Conference League' },
  { id: 45,  name: 'FA Cup' },
  { id: 48,  name: 'Carabao Cup' },
  { id: 143, name: 'Copa del Rey' },
  { id: 137, name: 'Coppa Italia' },
  { id: 88,  name: 'Eredivisie' },
  { id: 94,  name: 'Primeira Liga' },
];

const INTL_LEAGUES = [
  { id: 5,   name: 'Nations League' },
  { id: 32,  name: 'WC Qual. Europe' },
  { id: 30,  name: 'WC Qual. S.America' },
  { id: 33,  name: 'WC Qual. Africa' },
  { id: 34,  name: 'WC Qual. CONCACAF' },
  { id: 31,  name: 'WC Qual. Asia' },
];

const ALL_LEAGUES = [...TOP_LEAGUES, ...INTL_LEAGUES];

const BB_LEAGUES = [
  { id: 12,  name: 'NBA',         season: '2025-2026' },
  { id: 120, name: 'EuroLeague',  season: '2025-2026' },
  { id: 121, name: 'EuroCup',     season: '2025-2026' },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { type, id } = req.query;

  try {
    switch (type) {

      // ── TEST ──────────────────────────────────────────────────────────────
      case 'test': {
        const status = await apiGet(FB_BASE + '/status', {});
        // Test with last=5 and next=5 for EPL — the correct free-tier approach
        const eplLast = await fbGet('/fixtures', { league: 39, season: SEASON, last: 5 });
        const eplNext = await fbGet('/fixtures', { league: 39, season: SEASON, next: 5 });
        return res.json({
          active:    status.response?.subscription?.active,
          requests:  status.response?.requests,
          eplLast:   (eplLast.response||[]).map(f=>({ home: f.teams?.home?.name, away: f.teams?.away?.name, date: f.fixture?.date, status: f.fixture?.status?.short })),
          eplNext:   (eplNext.response||[]).map(f=>({ home: f.teams?.home?.name, away: f.teams?.away?.name, date: f.fixture?.date })),
          eplErrors: eplLast.errors,
        });
      }

      // ── FOOTBALL LIVE ─────────────────────────────────────────────────────
      case 'football-live': {
        // Step 1: Check for actually live matches
        const liveResp = await fbGet('/fixtures', { live: 'all' });
        const liveAll  = liveResp.response || [];
        const liveFiltered = liveAll.filter(f => ALL_LEAGUES.some(l => l.id === f.league?.id));
        if (liveFiltered.length > 0) {
          return res.json({ success: true, source: 'live', data: liveFiltered.map(transformFixture) });
        }

        // Step 2: Fetch last 3 + next 5 for each top league in parallel
        const results = await Promise.allSettled(
          ALL_LEAGUES.map(l => Promise.all([
            fbGet('/fixtures', { league: l.id, season: SEASON, last: 3 }),
            fbGet('/fixtures', { league: l.id, season: SEASON, next: 3 }),
          ]))
        );

        const todayStr = new Date().toISOString().split('T')[0];
        let todayMatches    = [];
        let recentMatches   = [];
        let upcomingMatches = [];

        results.forEach(r => {
          if (r.status !== 'fulfilled') return;
          const [lastResp, nextResp] = r.value;
          const last = lastResp.response || [];
          const next = nextResp.response  || [];

          last.forEach(f => {
            const d = (f.fixture?.date || '').split('T')[0];
            if (d === todayStr) todayMatches.push(f);
            else recentMatches.push(f);
          });
          next.forEach(f => {
            const d = (f.fixture?.date || '').split('T')[0];
            if (d === todayStr) todayMatches.push(f);
            else upcomingMatches.push(f);
          });
        });

        // Prioritise: today > recent > upcoming
        if (todayMatches.length > 0) {
          // Sort: in-progress first, then by kickoff
          todayMatches.sort((a,b) => {
            const aLive = ['1H','2H','ET','HT'].includes(a.fixture?.status?.short) ? 0 : 1;
            const bLive = ['1H','2H','ET','HT'].includes(b.fixture?.status?.short) ? 0 : 1;
            return aLive - bLive;
          });
          return res.json({ success: true, source: 'today', data: todayMatches.map(transformFixture) });
        }

        if (recentMatches.length > 0) {
          // Show most recent finished matches
          recentMatches.sort((a,b) => new Date(b.fixture?.date) - new Date(a.fixture?.date));
          return res.json({ success: true, source: 'recent', data: recentMatches.slice(0,20).map(transformFixture) });
        }

        if (upcomingMatches.length > 0) {
          upcomingMatches.sort((a,b) => new Date(a.fixture?.date) - new Date(b.fixture?.date));
          return res.json({ success: true, source: 'upcoming', data: upcomingMatches.slice(0,20).map(transformFixture) });
        }

        return res.json({ success: false, error: 'No matches found' });
      }

      // ── FOOTBALL FIXTURES ─────────────────────────────────────────────────
      case 'football-fixtures': {
        const results = await Promise.allSettled(
          TOP_LEAGUES.map(l => fbGet('/fixtures', { league: l.id, season: SEASON, next: 10 }))
        );
        const all = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') all.push(...(r.value.response || []));
        });
        all.sort((a,b) => new Date(a.fixture?.date) - new Date(b.fixture?.date));
        if (all.length > 0) return res.json({ success: true, data: all.slice(0,80).map(transformFixture) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await fbGet('/fixtures/lineups', { fixture: id });
        return res.json({ success: true, data: (data.response||[]).map(transformLineup) });
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

      // ── BASKETBALL ────────────────────────────────────────────────────────
      case 'basketball-live': {
        const liveResp  = await bbGet('/games', { live: 'all' });
        const liveGames = (liveResp.response||[]).filter(g => BB_LEAGUES.some(l => l.id === g.league?.id));
        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformGame) });
        }

        // next + last for each league
        const results = await Promise.allSettled(
          BB_LEAGUES.map(l => Promise.all([
            bbGet('/games', { league: l.id, season: l.season, last: 5 }),
            bbGet('/games', { league: l.id, season: l.season, next: 5 }),
          ]))
        );

        const todayStr = new Date().toISOString().split('T')[0];
        let todayGames = [], recentGames = [], upcomingGames = [];

        results.forEach(r => {
          if (r.status !== 'fulfilled') return;
          const [lastR, nextR] = r.value;
          [...(lastR.response||[]), ...(nextR.response||[])].forEach(g => {
            const d = (g.date||'').split('T')[0];
            if (d === todayStr)        todayGames.push(g);
            else if (new Date(g.date) < new Date()) recentGames.push(g);
            else upcomingGames.push(g);
          });
        });

        if (todayGames.length > 0)    return res.json({ success: true, source: 'today',    data: todayGames.map(transformGame) });
        if (recentGames.length > 0)   return res.json({ success: true, source: 'recent',   data: recentGames.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15).map(transformGame) });
        if (upcomingGames.length > 0) return res.json({ success: true, source: 'upcoming', data: upcomingGames.sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,15).map(transformGame) });

        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const results = await Promise.allSettled(
          BB_LEAGUES.map(l => bbGet('/games', { league: l.id, season: l.season, next: 10 }))
        );
        const all = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') all.push(...(r.value.response||[]));
        });
        all.sort((a,b) => new Date(a.date) - new Date(b.date));
        if (all.length > 0) return res.json({ success: true, data: all.slice(0,40).map(transformGame) });
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
    : matchDay.toLocaleDateString('en-GB', { weekday:'short', month:'short', day:'numeric' }).toUpperCase();

  const goals    = f.goals || {};
  const hasScore = goals.home !== null && goals.home !== undefined;
  const events   = (f.events||[]).map(e => ({
    type:   e.type === 'Goal'  ? 'GOAL'   :
            e.type === 'Card'  ? (e.detail?.includes('Red') ? 'RED' : 'YELLOW') :
            e.type === 'subst' ? 'SUB' : 'EVENT',
    minute: e.time?.elapsed || 0,
    player: e.player?.name  || '',
    team:   e.team?.id === f.teams?.home?.id ? 'home' : 'away',
    detail: e.type === 'Goal' ? `${e.player?.name} scores! (${e.detail})` : `${e.player?.name||''} — ${e.detail||e.type}`,
  })).sort((a,b) => b.minute - a.minute);

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
    kickoff:    fix?.date ? new Date(fix.date).toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit', timeZone:'UTC' }) : '',
    date:       fix?.date || '',
    dayLabel,
    dayOffset:  diff,
    status:     edgeStatus,
    minute:     fix?.status?.elapsed || 0,
    isLive:     edgeStatus === 'LIVE',
    score:      { home: goals.home ?? 0, away: goals.away ?? 0 },
    hasScore,
    ht:         f.score?.halftime ? { home: f.score.halftime.home, away: f.score.halftime.away } : null,
    events,
    odds: null,
  };
}

function transformLineup(l) {
  return {
    team:      l.team?.name || '',
    formation: l.formation  || '',
    players:   (l.startXI||[]).map(p => ({ name: p.player?.name||'', number: p.player?.number||'', pos: p.player?.pos||'', grid: p.player?.grid||'' })),
    subs:      (l.substitutes||[]).map(p => ({ name: p.player?.name||'', number: p.player?.number||'' })),
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
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW'
    : matchDay.toLocaleDateString('en-GB',{ weekday:'short', month:'short', day:'numeric' }).toUpperCase();

  const sc       = g.scores || {};
  const hasScore = sc.home?.total !== null && sc.home?.total !== undefined;

  return {
    id:       String(g.id),
    home:     g.teams?.home?.name || '',
    away:     g.teams?.away?.name || '',
    homeLogo: g.teams?.home?.logo || '',
    awayLogo: g.teams?.away?.logo || '',
    league:   g.league?.name || '',
    leagueId: g.league?.id,
    kickoff:  g.date ? new Date(g.date).toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit', timeZone:'UTC' }) : '',
    date:     g.date || '',
    dayLabel,
    dayOffset: diff,
    status:   edgeStatus,
    isLive:   edgeStatus === 'LIVE',
    score:    { home: sc.home?.total ?? 0, away: sc.away?.total ?? 0 },
    hasScore,
    quarters: {
      q1: sc.home?.quarter_1 != null ? `${sc.home.quarter_1}-${sc.away.quarter_1}` : null,
      q2: sc.home?.quarter_2 != null ? `${sc.home.quarter_2}-${sc.away.quarter_2}` : null,
      q3: sc.home?.quarter_3 != null ? `${sc.home.quarter_3}-${sc.away.quarter_3}` : null,
      q4: sc.home?.quarter_4 != null ? `${sc.home.quarter_4}-${sc.away.quarter_4}` : null,
    },
  };
}

function fbGet(path, params={}) { return apiGet(FB_BASE+path, params); }
function bbGet(path, params={}) { return apiGet(BB_BASE+path, params); }

function apiGet(url, params={}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k,v]) => u.searchParams.set(k, String(v)));
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
   
