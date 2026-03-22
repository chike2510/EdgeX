// api/sports.js — API-Football proxy (api-sports.io)
// Uses single date-based requests — avoids rate limit issues

const https = require('https');

const API_KEY = '475fee28ee58ec872d310f504542031a';
const FB_BASE = 'https://v3.football.api-sports.io';
const BB_BASE = 'https://v1.basketball.api-sports.io';
const HEADERS = { 'x-apisports-key': API_KEY };
const SEASON  = 2025; // 2025-26 season

// Major league IDs — used to filter the global date response
const FOOTBALL_LEAGUES = new Set([
  39,   // Premier League
  140,  // La Liga
  78,   // Bundesliga
  135,  // Serie A
  61,   // Ligue 1
  2,    // Champions League
  3,    // Europa League
  848,  // Conference League
  45,   // FA Cup
  48,   // Carabao Cup
  143,  // Copa del Rey
  137,  // Coppa Italia
  88,   // Eredivisie
  94,   // Primeira Liga
  207,  // Scottish Premiership
  203,  // Super Lig
  144,  // Pro League Belgium
  5,    // UEFA Nations League
  32,   // WC Qual. Europe
  30,   // WC Qual. S.America
  33,   // WC Qual. Africa
  34,   // WC Qual. CONCACAF
  31,   // WC Qual. Asia
  1,    // World Cup
  4,    // Euro Championship
  6,    // AFCON
  9,    // Copa America
  11,   // Copa Libertadores
  239,  // MLS
  71,   // Brazilian Serie A
  128,  // Argentine Liga
]);

const BASKETBALL_LEAGUES = new Set([12, 120, 121, 119, 116, 114]);
// 12=NBA, 120=EuroLeague, 121=EuroCup, 119=ACB, 116=Betclic, 114=LBA

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

      // ── TEST ──────────────────────────────────────────────────────────────
      case 'test': {
        const status   = await get(FB_BASE + '/status', {});
        // Single request for all of today's matches — the correct approach
        const todayAll = await get(FB_BASE + '/fixtures', { date: todayStr(0), timezone: 'UTC' });
        const all      = todayAll.response || [];
        const filtered = all.filter(f => FOOTBALL_LEAGUES.has(f.league?.id));
        return res.json({
          active:        status.response?.subscription?.active,
          requests:      status.response?.requests,
          totalToday:    all.length,
          filteredToday: filtered.length,
          errors:        todayAll.errors,
          sample: filtered.slice(0, 5).map(f => ({
            home:    f.teams?.home?.name,
            away:    f.teams?.away?.name,
            league:  f.league?.name,
            leagueId:f.league?.id,
            status:  f.fixture?.status?.short,
            date:    f.fixture?.date,
          })),
        });
      }

      // ── FOOTBALL LIVE ─────────────────────────────────────────────────────
      case 'football-live': {
        // Step 1: Check for live matches (1 request)
        const liveResp  = await get(FB_BASE + '/fixtures', { live: 'all' });
        const liveGames = (liveResp.response || []).filter(f => FOOTBALL_LEAGUES.has(f.league?.id));

        if (liveGames.length > 0) {
          liveGames.sort((a, b) => {
            const ta = [39,2,140,78,135,61].includes(a.league?.id) ? 0 : 1;
            const tb = [39,2,140,78,135,61].includes(b.league?.id) ? 0 : 1;
            return ta - tb;
          });
          return res.json({ success: true, source: 'live', data: liveGames.map(transformFixture) });
        }

        // Step 2: Fetch ALL of today's fixtures in one request, filter client-side
        const todayResp = await get(FB_BASE + '/fixtures', { date: todayStr(0), timezone: 'UTC' });
        const todayGames = (todayResp.response || []).filter(f => FOOTBALL_LEAGUES.has(f.league?.id));

        if (todayGames.length > 0) {
          // Sort: top leagues first
          todayGames.sort((a, b) => {
            const priority = [39,2,140,78,135,61,3,848];
            const ta = priority.indexOf(a.league?.id); 
            const tb = priority.indexOf(b.league?.id);
            const pa = ta === -1 ? 99 : ta;
            const pb = tb === -1 ? 99 : tb;
            if (pa !== pb) return pa - pb;
            return new Date(a.fixture?.date) - new Date(b.fixture?.date);
          });
          return res.json({ success: true, source: 'today', data: todayGames.map(transformFixture) });
        }

        // Step 3: Look ahead day by day (1 request per day max)
        for (let i = 1; i <= 5; i++) {
          const nextResp  = await get(FB_BASE + '/fixtures', { date: todayStr(i), timezone: 'UTC' });
          const nextGames = (nextResp.response || []).filter(f => FOOTBALL_LEAGUES.has(f.league?.id));
          if (nextGames.length > 0) {
            nextGames.sort((a,b) => new Date(a.fixture?.date)-new Date(b.fixture?.date));
            return res.json({ success: true, source: 'upcoming', data: nextGames.map(transformFixture) });
          }
        }

        return res.json({ success: false, error: 'No major league matches found in next 5 days' });
      }

      // ── FOOTBALL FIXTURES ─────────────────────────────────────────────────
      case 'football-fixtures': {
        const all = [];
        // Fetch next 7 days — 1 request per day = 7 requests max
        for (let i = 0; i <= 7; i++) {
          const resp     = await get(FB_BASE + '/fixtures', { date: todayStr(i), timezone: 'UTC' });
          const filtered = (resp.response || []).filter(f => FOOTBALL_LEAGUES.has(f.league?.id));
          all.push(...filtered);
        }
        // Sort: priority leagues first, then by date
        const priority = [39,2,140,78,135,61,3,848,45,48];
        all.sort((a,b) => {
          const pa = priority.indexOf(a.league?.id); const pb = priority.indexOf(b.league?.id);
          const sa = pa===-1?99:pa; const sb = pb===-1?99:pb;
          if(sa!==sb) return sa-sb;
          return new Date(a.fixture?.date)-new Date(b.fixture?.date);
        });
        if (all.length > 0) return res.json({ success: true, data: all.slice(0,80).map(transformFixture) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(FB_BASE + '/fixtures/lineups', { fixture: id });
        return res.json({ success: true, data: (data.response||[]).map(transformLineup) });
      }

      case 'football-events': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(FB_BASE + '/fixtures/events', { fixture: id });
        return res.json({ success: true, data: data.response||[] });
      }

      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(FB_BASE + '/fixtures/statistics', { fixture: id });
        return res.json({ success: true, data: data.response||[] });
      }

      case 'football-odds': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(FB_BASE + '/odds', { fixture: id, bookmaker: 6 });
        return res.json({ success: true, data: data.response||[] });
      }

      // ── BASKETBALL ────────────────────────────────────────────────────────
      case 'basketball-live': {
        // Live first
        const liveResp  = await get(BB_BASE + '/games', { live: 'all' });
        const liveGames = (liveResp.response||[]).filter(g => BASKETBALL_LEAGUES.has(g.league?.id));
        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformGame) });
        }
        // Today
        const todayResp  = await get(BB_BASE + '/games', { date: todayStr(0), timezone: 'UTC' });
        const todayGames = (todayResp.response||[]).filter(g => BASKETBALL_LEAGUES.has(g.league?.id));
        if (todayGames.length > 0) {
          return res.json({ success: true, source: 'today', data: todayGames.map(transformGame) });
        }
        // Upcoming
        for (let i = 1; i <= 3; i++) {
          const nextResp  = await get(BB_BASE + '/games', { date: todayStr(i), timezone: 'UTC' });
          const nextGames = (nextResp.response||[]).filter(g => BASKETBALL_LEAGUES.has(g.league?.id));
          if (nextGames.length > 0) {
            return res.json({ success: true, source: 'upcoming', data: nextGames.map(transformGame) });
          }
        }
        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const all = [];
        for (let i = 0; i <= 5; i++) {
          const resp     = await get(BB_BASE + '/games', { date: todayStr(i), timezone: 'UTC' });
          const filtered = (resp.response||[]).filter(g => BASKETBALL_LEAGUES.has(g.league?.id));
          all.push(...filtered);
        }
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

// ── Transforms ────────────────────────────────────────────────────────────────
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
    : matchDay.toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  const goals    = f.goals || {};
  const hasScore = goals.home !== null && goals.home !== undefined;
  const events   = (f.events||[]).map(e => ({
    type:   e.type==='Goal'?'GOAL':e.type==='Card'?(e.detail?.includes('Red')?'RED':'YELLOW'):e.type==='subst'?'SUB':'EVENT',
    minute: e.time?.elapsed||0,
    extra:  e.time?.extra||null,
    player: e.player?.name||'',
    assist: e.assist?.name||'',
    team:   e.team?.id===f.teams?.home?.id?'home':'away',
    detail: e.type==='Goal'?`${e.player?.name} scores!${e.time?.extra?' ('+e.time.elapsed+'+'+e.time.extra+"')":' ('+e.time?.elapsed+"')"} ${e.detail}`:`${e.player?.name||''} — ${e.detail||e.type}`,
  })).sort((a,b)=>b.minute-a.minute);

  return {
    id:         String(fix?.id),
    home:       f.teams?.home?.name  ||'',
    away:       f.teams?.away?.name  ||'',
    homeLogo:   f.teams?.home?.logo  ||'',
    awayLogo:   f.teams?.away?.logo  ||'',
    league:     f.league?.name       ||'',
    leagueId:   f.league?.id,
    leagueLogo: f.league?.logo       ||'',
    country:    f.league?.country    ||'',
    round:      f.league?.round      ||'',
    venue:      fix?.venue?.name     ||'',
    referee:    fix?.referee         ||'',
    kickoff:    fix?.date ? new Date(fix.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) : '',
    date:       fix?.date||'',
    dayLabel,   dayOffset: diff,
    status:     edgeStatus,
    minute:     fix?.status?.elapsed||0,
    isLive:     edgeStatus==='LIVE',
    score:      {home:goals.home??0, away:goals.away??0},
    hasScore,
    ht:         f.score?.halftime?{home:f.score.halftime.home,away:f.score.halftime.away}:null,
    events,
    odds: null,
  };
}

function transformLineup(l) {
  return {
    team:      l.team?.name||'',
    formation: l.formation||'',
    players:   (l.startXI||[]).map(p=>({name:p.player?.name||'',number:p.player?.number||'',pos:p.player?.pos||'',grid:p.player?.grid||''})),
    subs:      (l.substitutes||[]).map(p=>({name:p.player?.name||'',number:p.player?.number||''})),
  };
}

function transformGame(g) {
  const status = g.status?.short;
  const edgeStatus =
    ['Q1','Q2','Q3','Q4','OT'].includes(status)?'LIVE':
    status==='HT'?'HT':['FT','AOT'].includes(status)?'FT':'NS';

  const today    = new Date(); today.setHours(0,0,0,0);
  const matchDay = new Date(g.date); matchDay.setHours(0,0,0,0);
  const diff     = Math.round((matchDay-today)/86400000);
  const dayLabel = diff===0?'TODAY':diff===1?'TOMORROW'
    :matchDay.toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  const sc = g.scores||{};
  return {
    id:       String(g.id),
    home:     g.teams?.home?.name||'',
    away:     g.teams?.away?.name||'',
    homeLogo: g.teams?.home?.logo||'',
    awayLogo: g.teams?.away?.logo||'',
    league:   g.league?.name||'',
    leagueId: g.league?.id,
    kickoff:  g.date?new Date(g.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):'',
    date:     g.date||'',
    dayLabel, dayOffset:diff,
    status:   edgeStatus,
    isLive:   edgeStatus==='LIVE',
    score:    {home:sc.home?.total??0, away:sc.away?.total??0},
    hasScore: sc.home?.total!==null&&sc.home?.total!==undefined,
    quarters: {
      q1:sc.home?.quarter_1!=null?`${sc.home.quarter_1}-${sc.away.quarter_1}`:null,
      q2:sc.home?.quarter_2!=null?`${sc.home.quarter_2}-${sc.away.quarter_2}`:null,
      q3:sc.home?.quarter_3!=null?`${sc.home.quarter_3}-${sc.away.quarter_3}`:null,
      q4:sc.home?.quarter_4!=null?`${sc.home.quarter_4}-${sc.away.quarter_4}`:null,
    },
  };
}

function get(url, params={}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));
    https.get(u.toString(),{headers:HEADERS},r=>{
      let body='';
      r.on('data',c=>{body+=c;});
      r.on('end',()=>{
        try{resolve(JSON.parse(body));}
        catch{reject(new Error('Invalid JSON'));}
      });
    }).on('error',reject);
  });
                        }
          
