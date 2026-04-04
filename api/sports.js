// api/sports.js — EdgeX Intelligence Platform
// SportsAPIPro (correct endpoints from docs) + The Odds API
// Football V2: https://v2.football.sportsapipro.com
// Basketball V1: https://v1.basketball.sportsapipro.com

const https = require('https');

const SAPRO_KEY  = '991b2f42-8f9f-47ff-a987-1755d725e536';
const ODDS_KEY   = '00383cc8a2318f6894be715e4fa97148';

// ── CORRECT BASE URLS (from docs.sportsapipro.com) ────────────────────────────
const FB_BASE  = 'https://v2.football.sportsapipro.com';   // Football V2
const BB_BASE  = 'https://v1.basketball.sportsapipro.com'; // Basketball V1
const ODDS_URL = 'https://api.the-odds-api.com/v4';

function dateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { type, id } = req.query;

  try {
    switch (type) {

      // ── FOOTBALL LIVE ──────────────────────────────────────────────────────
      // Doc: GET /api/live — all currently live matches
      // Doc: GET /api/today — all matches scheduled for today
      // Doc: GET /api/schedule/{date} — matches for specific date
      case 'football-live': {
        const requestedDate = req.query.date;

        if (requestedDate) {
          // Specific date navigation: GET /api/schedule/{date}
          const data = await sapro(`${FB_BASE}/api/schedule/${requestedDate}`);
          const games = toGames(data);
          if (!games.length) return res.json({ success: false, error: `No matches on ${requestedDate}` });
          return res.json({ success: true, source: 'dated', date: requestedDate, data: games.map(transformFB) });
        }

        // Step 1: Try live now — GET /api/live
        const liveData = await sapro(`${FB_BASE}/api/live`);
        const liveGames = toGames(liveData);
        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformFB) });
        }

        // Step 2: Try today — GET /api/today
        const todayData = await sapro(`${FB_BASE}/api/today`);
        const todayGames = toGames(todayData);
        if (todayGames.length > 0) {
          return res.json({ success: true, source: 'today', data: todayGames.map(transformFB) });
        }

        // Step 3: Try schedule for today + tomorrow — GET /api/schedule/{date}
        const [sched0, sched1] = await Promise.all([
          sapro(`${FB_BASE}/api/schedule/${dateStr(0)}`),
          sapro(`${FB_BASE}/api/schedule/${dateStr(1)}`),
        ]);
        const schedGames = [...toGames(sched0), ...toGames(sched1)]
          .sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));

        if (schedGames.length > 0) {
          return res.json({ success: true, source: 'schedule', data: schedGames.map(transformFB) });
        }

        return res.json({ success: false, error: 'No football matches found. Check back later.' });
      }

      // ── FOOTBALL FIXTURES ──────────────────────────────────────────────────
      // Doc: GET /api/schedule/{date} for yesterday, today, tomorrow
      case 'football-fixtures': {
        const requestedDate = req.query.date;

        if (requestedDate) {
          const data = await sapro(`${FB_BASE}/api/schedule/${requestedDate}`);
          const games = toGames(data);
          if (!games.length) return res.json({ success: false, error: `No fixtures on ${requestedDate}` });
          return res.json({ success: true, data: games.map(transformFB) });
        }

        const [d0, d1, d2] = await Promise.all([
          sapro(`${FB_BASE}/api/schedule/${dateStr(-1)}`),
          sapro(`${FB_BASE}/api/schedule/${dateStr(0)}`),
          sapro(`${FB_BASE}/api/schedule/${dateStr(1)}`),
        ]);
        const all = [
          ...toGames(d0),
          ...toGames(d1),
          ...toGames(d2),
        ].sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));

        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 100).map(transformFB) });
        return res.json({ success: false, error: 'No fixtures found for this date range.' });
      }

      // ── FOOTBALL MATCH DETAIL ──────────────────────────────────────────────
      // Doc: GET /api/match/{matchId} — full details
      // Doc: GET /api/match/{matchId}/lineups
      // Doc: GET /api/match/{matchId}/statistics
      // Doc: GET /api/match/{matchId}/incidents
      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await sapro(`${FB_BASE}/api/match/${id}/lineups`);
        return res.json({ success: true, data: data?.home ? [data.home, data.away] : (data?.lineups || []) });
      }
      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await sapro(`${FB_BASE}/api/match/${id}/statistics`);
        return res.json({ success: true, data: data?.statistics || data || [] });
      }
      case 'football-events': {
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await sapro(`${FB_BASE}/api/match/${id}/incidents`);
        return res.json({ success: true, data: data?.incidents || data || [] });
      }
      case 'football-predictions': {
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await sapro(`${FB_BASE}/api/match/${id}`);
        return res.json({ success: !!data, data: data || null });
      }
      case 'football-players': {
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await sapro(`${FB_BASE}/api/match/${id}/lineups`);
        return res.json({ success: true, data: data || [] });
      }

      // ── FOOTBALL SEARCH ────────────────────────────────────────────────────
      // Doc: GET /api/search?q={query}
      case 'football-team-search': {
        const { name } = req.query;
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await sapro(`${FB_BASE}/api/search?q=${encodeURIComponent(name)}`);
        return res.json({ success: true, data: (data?.results || data || []).slice(0, 5) });
      }
      case 'football-player-search': {
        const { name } = req.query;
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await sapro(`${FB_BASE}/api/search?q=${encodeURIComponent(name)}`);
        return res.json({ success: true, data: (data?.results || data || []).slice(0, 5) });
      }

      // ── FOOTBALL H2H ───────────────────────────────────────────────────────
      case 'football-h2h': {
        // We need match id to get h2h — use existing match id
        const { h2h } = req.query;
        if (!h2h && !id) return res.json({ success: false, error: 'Missing match id or h2h param' });
        const matchId = id || h2h;
        const data = await sapro(`${FB_BASE}/api/match/${matchId}/head-to-head`);
        return res.json({ success: true, data: data?.events || data?.games || [] });
      }

      // ── FOOTBALL ODDS (The Odds API) ───────────────────────────────────────
      case 'football-odds': {
        const sport = req.query.sport || 'soccer_epl';
        const raw = await get(
          `${ODDS_URL}/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu&markets=h2h,totals&oddsFormat=decimal`
        );
        return res.json({ success: true, data: safeJSON(raw) });
      }

      // ── FOOTBALL VALUE BETS ────────────────────────────────────────────────
      case 'football-value-bets': {
        const [schedData, oddsRaw] = await Promise.all([
          sapro(`${FB_BASE}/api/schedule/${dateStr(0)}`),
          get(`${ODDS_URL}/sports/soccer_epl/odds/?apiKey=${ODDS_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`),
        ]);
        const games   = toGames(schedData).slice(0, 20);
        const oddsArr = safeJSON(oddsRaw) || [];
        return res.json({
          success: true,
          data: games.map(g => {
            const t  = transformFB(g);
            const od = oddsArr.find(o =>
              (o.home_team || '').toLowerCase().includes((t.home || '').toLowerCase().split(' ')[0])
            );
            if (od?.bookmakers?.length) t.odds = extractH2HOdds(od);
            return t;
          }),
        });
      }

      // ── BASKETBALL LIVE ────────────────────────────────────────────────────
      // Doc: GET /games/current — live games
      // Doc: GET /games/fixtures?date=YYYY-MM-DD — upcoming/scheduled
      case 'basketball-live': {
        const requestedDate = req.query.date;

        if (requestedDate) {
          const data = await sapro(`${BB_BASE}/games/fixtures?date=${requestedDate}`);
          const games = toGames(data);
          if (!games.length) return res.json({ success: false, error: `No games on ${requestedDate}` });
          return res.json({ success: true, source: 'dated', data: games.map(transformBB) });
        }

        // Step 1: Live now
        const liveData = await sapro(`${BB_BASE}/games/current`);
        const liveGames = toGames(liveData);
        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformBB) });
        }

        // Step 2: Today + tomorrow fixtures
        const [today, tmrw] = await Promise.all([
          sapro(`${BB_BASE}/games/fixtures?date=${dateStr(0)}`),
          sapro(`${BB_BASE}/games/fixtures?date=${dateStr(1)}`),
        ]);
        const combined = [...toGames(today), ...toGames(tmrw)]
          .sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));

        if (combined.length > 0) {
          return res.json({ success: true, source: 'today', data: combined.map(transformBB) });
        }

        return res.json({ success: false, error: 'No basketball games found today.' });
      }

      // ── BASKETBALL FIXTURES ────────────────────────────────────────────────
      case 'basketball-fixtures': {
        const requestedDate = req.query.date;
        if (requestedDate) {
          const data = await sapro(`${BB_BASE}/games/fixtures?date=${requestedDate}`);
          const games = toGames(data);
          return res.json({ success: true, data: games.map(transformBB) });
        }
        const [d0, d1] = await Promise.all([
          sapro(`${BB_BASE}/games/fixtures?date=${dateStr(0)}`),
          sapro(`${BB_BASE}/games/fixtures?date=${dateStr(1)}`),
        ]);
        const all = [...toGames(d0), ...toGames(d1)];
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 60).map(transformBB) });
        return res.json({ success: false, error: 'No basketball fixtures found.' });
      }

      // ── BASKETBALL ODDS (The Odds API) ────────────────────────────────────
      case 'basketball-odds': {
        const raw = await get(
          `${ODDS_URL}/sports/basketball_nba/odds/?apiKey=${ODDS_KEY}&regions=us,uk&markets=h2h,totals&oddsFormat=decimal`
        );
        return res.json({ success: true, data: safeJSON(raw) });
      }

      // ── APEX MULTI-BOOK CONSENSUS ODDS ────────────────────────────────────
      case 'apex-odds': {
        const { sport, homeTeam, awayTeam } = req.query;
        const sportKey = sport || 'soccer_epl';
        const raw = await get(
          `${ODDS_URL}/sports/${sportKey}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`
        );
        const markets = safeJSON(raw) || [];
        if (!Array.isArray(markets)) return res.json({ success: false, error: 'Odds API error' });

        const hq = (homeTeam || '').toLowerCase();
        const match = markets.find(m =>
          (m.home_team || '').toLowerCase().includes(hq.split(' ')[0]) ||
          (m.away_team || '').toLowerCase().includes((awayTeam || '').toLowerCase().split(' ')[0])
        );
        if (!match) return res.json({ success: false, error: 'Match not found in odds' });

        const allBooks = (match.bookmakers || []).map(bk => {
          const mkt  = bk.markets?.find(m => m.key === 'h2h');
          if (!mkt) return null;
          const outs = mkt.outcomes || [];
          const h    = outs.find(o => o.name === match.home_team)?.price;
          const d    = outs.find(o => o.name === 'Draw')?.price;
          const a    = outs.find(o => o.name === match.away_team)?.price;
          if (!h || !a) return null;
          return d ? [h, d, a] : [h, a];
        }).filter(Boolean);

        return res.json({
          success: true,
          match: { home: match.home_team, away: match.away_team },
          bookmakers: allBooks.length,
          allBooks,
          fairProbs: apexConsensus(allBooks),
          vig: allBooks.length ? calcVig(allBooks[0]) : null,
        });
      }

      // ── TEST ENDPOINT ──────────────────────────────────────────────────────
      case 'test': {
        const [fbLive, bbLive, fbToday] = await Promise.all([
          sapro(`${FB_BASE}/api/live`),
          sapro(`${BB_BASE}/games/current`),
          sapro(`${FB_BASE}/api/today`),
        ]);
        return res.json({
          success: true,
          football: {
            live: toGames(fbLive).length,
            today: toGames(fbToday).length,
            sample: toGames(fbLive).slice(0, 2).map(g => ({ home: g.homeCompetitor?.name, away: g.awayCompetitor?.name, status: g.statusText })),
          },
          basketball: {
            live: toGames(bbLive).length,
            sample: toGames(bbLive).slice(0, 2).map(g => ({ home: g.homeCompetitor?.name, away: g.awayCompetitor?.name })),
          },
        });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    console.error('[EdgeX sports.js] type=' + type, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── toGames: safely extract games array from any SportsAPIPro response shape ──
// Docs confirm response is always { games: [...], lastUpdateId: N }
function toGames(data) {
  if (!data) return [];
  if (Array.isArray(data.games))  return data.games;  // { games: [...] } — standard shape
  if (Array.isArray(data.events)) return data.events; // some schedule endpoints use 'events'
  if (Array.isArray(data))        return data;        // direct array fallback
  if (Array.isArray(data.data))   return data.data;   // wrapped in data key
  return [];
}

// ── TRANSFORM FOOTBALL MATCH ──────────────────────────────────────────────────
function transformFB(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = g.startTime ? new Date(g.startTime) : new Date();
  matchDay.setHours(0, 0, 0, 0);
  const diff = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY'
    : diff === 1  ? 'TOMORROW'
    : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const st  = (g.statusText || '').toLowerCase();
  // statusGroup: 6 = live, 7 = finished, others = not started
  const sg  = g.statusGroup;
  const isLive  = sg === 6 || st.includes('live') || st.includes('1st half') || st.includes('2nd half') || st.includes('progress');
  const isHT    = st.includes('half time') || st.includes('halftime');
  const isFT    = sg === 7 || st.includes('finish') || st.includes('ended') || st === 'ft' || st === 'aet';
  const status  = isLive ? 'LIVE' : isHT ? 'HT' : isFT ? 'FT' : 'NS';

  const homeScore = g.homeCompetitor?.score ?? null;
  const awayScore = g.awayCompetitor?.score ?? null;

  return {
    id:         String(g.id),
    home:       g.homeCompetitor?.name  || 'Home',
    away:       g.awayCompetitor?.name  || 'Away',
    homeId:     g.homeCompetitor?.id,
    awayId:     g.awayCompetitor?.id,
    homeLogo:   g.homeCompetitor?.imageUrl || '',
    awayLogo:   g.awayCompetitor?.imageUrl || '',
    league:     g.competitionDisplayName || g.competition?.name || 'Football',
    leagueId:   g.competitionId          || g.competition?.id,
    kickoff:    g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--',
    date:       g.startTime || '',
    dayLabel,
    dayOffset:  diff,
    status,
    minute:     g.statusText || 0,
    isLive,
    score:      { home: homeScore ?? 0, away: awayScore ?? 0 },
    hasScore:   homeScore !== null && homeScore !== undefined,
    ht:         null,
    events:     [],
    odds:       null,
  };
}

// ── TRANSFORM BASKETBALL GAME ─────────────────────────────────────────────────
function transformBB(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = g.startTime ? new Date(g.startTime) : new Date();
  matchDay.setHours(0, 0, 0, 0);
  const diff = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY'
    : diff === 1  ? 'TOMORROW'
    : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const st   = (g.statusText || '').toLowerCase();
  const sg   = g.statusGroup;
  const isLive = sg === 6 || st.includes('q1') || st.includes('q2') || st.includes('q3') || st.includes('q4') || st.includes('ot') || st.includes('live') || st.includes('progress');
  const isFT   = sg === 7 || st.includes('final') || st.includes('finish') || st.includes('ended');

  const homeScore = g.homeCompetitor?.score ?? null;
  const awayScore = g.awayCompetitor?.score ?? null;

  return {
    id:       String(g.id),
    home:     g.homeCompetitor?.name || 'Home',
    away:     g.awayCompetitor?.name || 'Away',
    homeId:   g.homeCompetitor?.id,
    awayId:   g.awayCompetitor?.id,
    homeLogo: g.homeCompetitor?.imageUrl || '',
    awayLogo: g.awayCompetitor?.imageUrl || '',
    league:   g.competition?.name || g.competitionDisplayName || 'Basketball',
    leagueId: g.competition?.id   || g.competitionId,
    kickoff:  g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--',
    date:     g.startTime || '',
    dayLabel,
    dayOffset: diff,
    status:   isLive ? 'LIVE' : isFT ? 'FT' : 'NS',
    isLive,
    score:    { home: homeScore ?? 0, away: awayScore ?? 0 },
    hasScore: homeScore !== null,
    quarters: {},
  };
}

// ── ODDS HELPERS ──────────────────────────────────────────────────────────────
function extractH2HOdds(oddsMarket) {
  const bk  = oddsMarket.bookmakers?.[0];
  const mkt = bk?.markets?.find(m => m.key === 'h2h');
  if (!mkt) return null;
  return {
    home: mkt.outcomes?.find(o => o.name === oddsMarket.home_team)?.price,
    draw: mkt.outcomes?.find(o => o.name === 'Draw')?.price,
    away: mkt.outcomes?.find(o => o.name === oddsMarket.away_team)?.price,
  };
}

function impliedProb(o) { return o > 1 ? 1 / o : 0; }
function calcVig(arr)   { return +((arr.reduce((s, o) => s + impliedProb(o), 0) - 1) * 100).toFixed(2); }
function fairProbs(arr) {
  const vig = arr.reduce((s, o) => s + impliedProb(o), 0);
  return arr.map(o => +((impliedProb(o) / vig) * 100).toFixed(1));
}
function apexConsensus(books) {
  if (!books?.length) return [];
  const all = books.map(fairProbs);
  const n   = all.length, len = all[0].length;
  return Array.from({ length: len }, (_, i) => +(all.reduce((s, f) => s + f[i], 0) / n).toFixed(1));
}

// ── HTTP HELPERS ──────────────────────────────────────────────────────────────
function sapro(url) {
  return new Promise(resolve => {
    try {
      https.get(url, {
        headers: {
          'x-api-key': SAPRO_KEY,
          'Accept': 'application/json',
          'User-Agent': 'EdgeX/2.0',
        }
      }, r => {
        let body = '';
        r.on('data', c => { body += c; });
        r.on('end', () => {
          try   { resolve(JSON.parse(body)); }
          catch { resolve(null); }
        });
      }).on('error', () => resolve(null));
    } catch { resolve(null); }
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    try {
      https.get(url, { headers: { 'Accept': 'application/json' } }, r => {
        let body = '';
        r.on('data', c => { body += c; });
        r.on('end', () => resolve(body));
      }).on('error', reject);
    } catch (e) { reject(e); }
  });
}

function safeJSON(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str; }
  catch { return null; }
}
