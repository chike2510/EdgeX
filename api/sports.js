// api/sports.js — SportDB (Flashscore) proxy
// Docs: https://dashboard.sportdb.dev/docs

const https = require('https');

const API_KEY  = 'qbpxgZr2waQwViWBryBD08J3qO2qDWCfViwK36WZ';
const BASE     = 'https://api.sportdb.dev/api/flashscore';
const HEADERS  = { 'X-API-Key': API_KEY, 'Accept': 'application/json' };

const SEASON = '2025-2026';

// Known league paths discovered from SportDB docs
const FOOTBALL_COMPS = [
  { key:'epl',         path:'football/england:198/premier-league:dYlOSQOD',          name:'Premier League',   priority:1 },
  { key:'ucl',         path:'football/europe:200/champions-league:5epdGGOo',          name:'Champions League', priority:2 },
  { key:'laliga',      path:'football/spain:206/laliga:bkNKtAYi',                     name:'La Liga',          priority:3 },
  { key:'bundesliga',  path:'football/germany:81/bundesliga:W6BOzpK2',                name:'Bundesliga',       priority:4 },
  { key:'seriea',      path:'football/italy:135/serie-a:JH4OF1GC',                    name:'Serie A',          priority:5 },
  { key:'ligue1',      path:'football/france:97/ligue-1:XoJiGygC',                   name:'Ligue 1',          priority:6 },
  { key:'uel',         path:'football/europe:200/europa-league:5epdGGob',             name:'Europa League',    priority:7 },
  { key:'eredivisie',  path:'football/netherlands:165/eredivisie:bkMnsPsH',           name:'Eredivisie',       priority:8 },
  { key:'primeiraliga',path:'football/portugal:171/primeira-liga:KrJbDsxd',           name:'Primeira Liga',    priority:9 },
];

function getComp(leagueParam) {
  if (!leagueParam) return FOOTBALL_COMPS[0];
  const lc = leagueParam.toLowerCase().replace(/[\s_-]/g,'');
  return FOOTBALL_COMPS.find(c => c.key === lc || c.name.toLowerCase().replace(/\s/g,'') === lc)
    || FOOTBALL_COMPS[0];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { type, id, date, league, page, player, name, h2h, team, offset: qOffset } = req.query;

  try {
    switch (type) {

      // ── FOOTBALL LIVE ──────────────────────────────────────────────────────
      case 'football-live': {
        let offset = 0;
        if (date) {
          const today = new Date(); today.setHours(0,0,0,0);
          const d = new Date(date); d.setHours(0,0,0,0);
          offset = Math.round((d - today) / 86400000);
        }
        const raw = await get(`${BASE}/football/live`, { offset });
        if (!Array.isArray(raw) || raw.length === 0)
          return res.json({ success: false, error: 'No matches found' });
        const matches = raw.map(m => transformMatch(m, offset)).filter(Boolean);
        matches.sort((a,b) => (a.priority||99)-(b.priority||99) || new Date(a.date)-new Date(b.date));
        const liveCount = matches.filter(m=>m.isLive).length;
        return res.json({ success: true, source: liveCount>0?'live':offset<0?'past':offset>0?'upcoming':'today', data: matches });
      }

      // ── FOOTBALL FIXTURES ──────────────────────────────────────────────────
      case 'football-fixtures': {
        const all = [];
        for (let i = -7; i <= 7; i++) {
          try {
            const raw = await get(`${BASE}/football/live`, { offset: i });
            if (Array.isArray(raw)) all.push(...raw.map(m=>transformMatch(m,i)).filter(Boolean));
          } catch {}
        }
        if (all.length === 0) return res.json({ success: false, error: 'No fixtures found' });
        all.sort((a,b)=>new Date(a.date)-new Date(b.date));
        return res.json({ success: true, data: all.slice(0,120) });
      }

      // ── FOOTBALL STANDINGS ─────────────────────────────────────────────────
      case 'football-standings': {
        const comp = getComp(league);
        for (const season of [SEASON, '2024-2025']) {
          try {
            const data = await get(`${BASE}/${comp.path}/${season}/standings`);
            if (Array.isArray(data) && data.length > 0)
              return res.json({ success: true, data: data.map(transformStanding), league: comp.name, season });
          } catch {}
        }
        return res.json({ success: false, error: 'Standings unavailable' });
      }

      // ── FOOTBALL RESULTS ───────────────────────────────────────────────────
      case 'football-results': {
        const comp = getComp(league);
        const data = await get(`${BASE}/${comp.path}/${SEASON}/results`, { page: page||1 });
        return res.json({ success: true, data: (data||[]).map(transformResult), league: comp.name });
      }

      // ── MATCH STATS + EVENTS ───────────────────────────────────────────────
      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const [stats, details] = await Promise.allSettled([
          get(`${BASE}/match/${id}/stats`),
          get(`${BASE}/match/${id}/details`, { with_events: 'true' }),
        ]);
        return res.json({
          success: true,
          data: stats.status==='fulfilled' ? (stats.value||[]) : [],
          events: details.status==='fulfilled' ? (details.value?.events||details.value||[]) : [],
        });
      }

      // ── MATCH LINEUPS ──────────────────────────────────────────────────────
      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(`${BASE}/match/${id}/lineups`);
        return res.json({ success: true, data: transformLineups(data) });
      }

      // ── MATCH ODDS ─────────────────────────────────────────────────────────
      case 'football-odds': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(`${BASE}/match/${id}/odds`, { geoIpCode: 'GB' });
        return res.json({ success: true, data: data||[] });
      }

      // ── FOOTBALL EVENTS (match incidents) ─────────────────────────────────
      case 'football-events': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(`${BASE}/match/${id}/details`, { with_events: 'true' });
        return res.json({ success: true, data: data?.events||data||[] });
      }

      // ── TOP SCORERS / ASSISTS ──────────────────────────────────────────────
      case 'football-topscorers':
      case 'football-topassists': {
        const comp = getComp(league);
        // Fetch results and aggregate goals per player would require many requests
        // Instead return standings with goal data from the table
        const data = await get(`${BASE}/${comp.path}/${SEASON}/standings`);
        return res.json({ success: true, data: data||[], league: comp.name, type: 'standings-fallback' });
      }

      // ── PLAYER SEARCH ──────────────────────────────────────────────────────
      case 'football-player-search': {
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await get(`${BASE}/search`, { q: name, type: 'player' });
        return res.json({ success: true, data: (data?.results||[]).slice(0,8) });
      }

      // ── PLAYER STATS ───────────────────────────────────────────────────────
      case 'football-player-stats': {
        if (!player) return res.json({ success: false, error: 'Missing player' });
        // player = "slug/id" or just search result link
        const parts = player.replace('/api/flashscore/player/','').split('/');
        const slug = parts[0], pid = parts[1]||parts[0];
        const profile = await get(`${BASE}/player/${slug}/${pid}`);
        return res.json({ success: true, data: profile });
      }

      // ── TEAM SEARCH ────────────────────────────────────────────────────────
      case 'football-team-search': {
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await get(`${BASE}/search`, { q: name, type: 'team' });
        return res.json({ success: true, data: (data?.results||[]).slice(0,5) });
      }

      // ── VALUE BETS ─────────────────────────────────────────────────────────
      case 'football-value-bets': {
        const raw = await get(`${BASE}/football/live`, { offset: 0 });
        const matches = (Array.isArray(raw)?raw:[]).map(m=>transformMatch(m,0)).filter(Boolean);
        return res.json({ success: true, data: matches.slice(0,20) });
      }

      // ── FOOTBALL PREDICTIONS — client handles this ─────────────────────────
      case 'football-predictions':
        return res.json({ success: false, error: 'Use client-side prediction engine' });

      // ── BASKETBALL LIVE ────────────────────────────────────────────────────
      case 'basketball-live': {
        let offset = 0;
        if (date) {
          const today = new Date(); today.setHours(0,0,0,0);
          const d = new Date(date); d.setHours(0,0,0,0);
          offset = Math.round((d - today) / 86400000);
        }
        const raw = await get(`${BASE}/basketball/live`, { offset });
        if (!Array.isArray(raw) || raw.length === 0)
          return res.json({ success: false, error: 'No basketball games found' });
        const games = raw.map(g=>transformBBGame(g,offset)).filter(Boolean);
        const liveCount = games.filter(g=>g.isLive).length;
        return res.json({ success: true, source: liveCount>0?'live':offset<0?'past':offset>0?'upcoming':'today', data: games });
      }

      // ── BASKETBALL FIXTURES ────────────────────────────────────────────────
      case 'basketball-fixtures': {
        const all = [];
        for (let i = -5; i <= 7; i++) {
          try {
            const raw = await get(`${BASE}/basketball/live`, { offset: i });
            if (Array.isArray(raw)) all.push(...raw.map(g=>transformBBGame(g,i)).filter(Boolean));
          } catch {}
        }
        if (all.length === 0) return res.json({ success: false, error: 'No fixtures found' });
        all.sort((a,b)=>new Date(a.date)-new Date(b.date));
        return res.json({ success: true, data: all.slice(0,80) });
      }

      // ── BASKETBALL PLAYER PROPS ────────────────────────────────────────────
      case 'basketball-player-props': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await get(`${BASE}/match/${id}/stats`);
        return res.json({ success: true, data: data||[] });
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

function transformMatch(m, dayOffset) {
  if (!m) return null;
  const home = m.homeName || '';
  const away = m.awayName || '';
  if (!home || !away) return null;

  // eventStageId: 1=scheduled, 2=live, 3=finished, 6=ET, 7=penalties, 12=1H, 13=2H, 38=HT, 242=FT
  const sid = parseInt(m.eventStageId) || 0;
  const isLive = sid===2||sid===12||sid===13||sid===6||sid===7;
  const isHT   = sid===38;
  const isFT   = sid===3||sid===242;
  const edgeStatus = isLive?'LIVE':isHT?'HT':isFT?'FT':'NS';

  let minute = m.gameTime ? parseInt(m.gameTime)||0 : 0;
  if (isLive && !minute && m.stageStartUtime) {
    const elapsed = Math.floor((Date.now()/1000 - m.stageStartUtime)/60);
    minute = sid===13 ? Math.min(90, 45+elapsed) : Math.min(45, elapsed);
  }

  const matchDate = m.startDateTimeUtc ? new Date(m.startDateTimeUtc) : null;
  const today = new Date(); today.setHours(0,0,0,0);
  let diff = dayOffset || 0;
  if (matchDate) {
    const md = new Date(matchDate); md.setHours(0,0,0,0);
    diff = Math.round((md-today)/86400000);
  }
  const dayLabel = diff===0?'TODAY':diff===1?'TOMORROW':diff===-1?'YESTERDAY'
    :(matchDate||new Date()).toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();

  const hs = m.homeScore; const as_ = m.awayScore;
  const hasScore = hs!==undefined && hs!==null && hs!=='' && hs!=='-';

  const ln = m.tournamentName||'';
  const priority = ['Premier League','Champions','La Liga','Bundesliga','Serie A','Ligue 1','Europa League'].findIndex(k=>ln.includes(k));

  return {
    id:          m.eventId || String(Math.random()),
    home,
    away,
    homeLogo:    '',
    awayLogo:    '',
    league:      ln,
    leagueId:    m.tournamentTemplateId || 0,
    leagueLogo:  '',
    country:     m.country || '',
    round:       m.round || m.eventStage || '',
    venue:       '',
    kickoff:     matchDate ? matchDate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) : '',
    date:        m.startDateTimeUtc || '',
    dayLabel,    dayOffset: diff,
    status:      edgeStatus,
    minute,
    isLive,
    score:       { home: parseInt(hs)||0, away: parseInt(as_)||0 },
    hasScore,
    ht:          null,
    events:      [],
    odds:        null,
    priority:    priority>=0?priority:99,
    detailsLink: m.links?.details||null,
    lineupsLink: m.links?.lineups||null,
    statsLink:   m.links?.stats||null,
  };
}

function transformBBGame(g, dayOffset) {
  if (!g) return null;
  const home = g.homeName||''; const away = g.awayName||'';
  if (!home||!away) return null;
  const sid = parseInt(g.eventStageId)||0;
  const isLive = sid===2||(sid>=10&&sid<=20);
  const isFT   = sid===3||sid===242;
  const edgeStatus = isLive?'LIVE':isFT?'FT':'NS';
  const matchDate = g.startDateTimeUtc ? new Date(g.startDateTimeUtc) : null;
  const today = new Date(); today.setHours(0,0,0,0);
  let diff = dayOffset||0;
  if (matchDate){ const md=new Date(matchDate);md.setHours(0,0,0,0);diff=Math.round((md-today)/86400000); }
  const dayLabel = diff===0?'TODAY':diff===1?'TOMORROW':diff===-1?'YESTERDAY'
    :(matchDate||new Date()).toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
  const hs=g.homeScore, as_=g.awayScore;
  const hasScore = hs!==undefined&&hs!==null&&hs!==''&&hs!=='-';
  return {
    id:       g.eventId||String(Math.random()),
    home, away,
    homeLogo:'', awayLogo:'',
    league:   g.tournamentName||'Basketball',
    leagueId: g.tournamentTemplateId||0,
    kickoff:  matchDate?matchDate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):'',
    date:     g.startDateTimeUtc||'',
    dayLabel, dayOffset:diff,
    status:   edgeStatus, isLive,
    score:    {home:parseInt(hs)||0, away:parseInt(as_)||0},
    hasScore, quarters:{},
    detailsLink: g.links?.details||null,
    statsLink:   g.links?.stats||null,
  };
}

function transformStanding(row) {
  return {
    rank:        row.rank||0,
    team:        { name:row.teamName||'', id:row.teamId, slug:row.teamSlug, logo:row.teamLogo||'' },
    points:      row.points||0,
    goalsDiff:   row.goalDiff||0,
    description: row.rankClass||'',
    all:{ played:row.matches||0, win:row.wins||0, draw:row.draws||0, lose:row.lossesRegular||0 },
    goals: row.goals||'',
    form: (row.events||[]).slice(-5).map(e=>e.result||'').filter(Boolean),
  };
}

function transformResult(r) {
  return {
    id: r.eventId||String(Math.random()),
    home:r.homeName, away:r.awayName,
    score:{ home:parseInt(r.homeFullTimeScore)||0, away:parseInt(r.awayFullTimeScore)||0 },
    hasScore:true, status:'FT',
    date:r.startDateTimeUtc||'', league:r.tournamentName||'', round:r.round||'',
    kickoff: r.startDateTimeUtc?new Date(r.startDateTimeUtc).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):'',
    detailsLink: r.links?.details||null,
  };
}

function transformLineups(data) {
  if (!data) return [];
  const sides = [];
  for (const side of ['home','away']) {
    const s = data[side]; if (!s) continue;
    sides.push({
      team:      s.teamName||side,
      formation: s.formation||'',
      players:   (s.players||s.startXI||[]).map(p=>({ name:p.name||p.playerName||'', number:p.jerseyNumber||p.number||'', pos:p.position||'' })),
      subs:      (s.substitutes||s.subs||[]).map(p=>({ name:p.name||p.playerName||'', number:p.jerseyNumber||'' })),
    });
  }
  return sides;
}

function get(url, params={}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));
    https.get(u.toString(),{headers:HEADERS},r=>{
      let body='';
      r.on('data',c=>{body+=c;});
      r.on('end',()=>{ try{resolve(JSON.parse(body));}catch{reject(new Error('Invalid JSON'));} });
    }).on('error',reject);
  });
}
