// api/sports.js — SportsAPIPro + The Odds API
// EdgeX Intelligence Platform

const https = require('https');

const SAPRO_KEY = '991b2f42-8f9f-47ff-a987-1755d725e536';
const ODDS_KEY  = '00383cc8a2318f6894be715e4fa97148';

const SAPRO_FB  = 'https://v2.football.sportsapipro.com';
const SAPRO_BB  = 'https://v2.basketball.sportsapipro.com';
const SAPRO_TN  = 'https://v2.tennis.sportsapipro.com';
const SAPRO_HK  = 'https://v2.hockey.sportsapipro.com';
const ODDS_URL  = 'https://api.the-odds-api.com/v4';

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
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

      // ── TEST ──────────────────────────────────────────────────────────────
      case 'test': {
        const liveData = await saproGet(SAPRO_FB + '/api/live');
        const games = extractGames(liveData);
        return res.json({
          success: true,
          provider: 'SportsAPIPro',
          liveGames: games.length,
          rawKeys: liveData ? Object.keys(liveData) : [],
          sample: games.slice(0, 3).map(g => ({
            home: g.homeCompetitor?.name,
            away: g.awayCompetitor?.name,
            competition: g.competitionDisplayName,
            status: g.statusText,
          })),
        });
      }

      // ── FOOTBALL LIVE ────────────────────────────────────────────────────
      case 'football-live': {
        const requestedDate = req.query.date;

        if (requestedDate) {
          const data = await saproGet(SAPRO_FB + '/api/fixtures', { date: requestedDate });
          const games = extractGames(data);
          if (!games.length) return res.json({ success: false, error: 'No matches on ' + requestedDate });
          return res.json({ success: true, source: 'dated', date: requestedDate, data: games.map(transformFB) });
        }

        // Parallel: live + today + tomorrow
        const [liveResp, todayResp, tmrwResp] = await Promise.all([
          saproGet(SAPRO_FB + '/api/live'),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(1) }),
        ]);

        const liveGames = extractGames(liveResp);
        if (liveGames.length > 0) {
          return res.json({ success: true, source: 'live', data: liveGames.map(transformFB) });
        }

        const todayGames = extractGames(todayResp);
        const tmrwGames  = extractGames(tmrwResp);
        const combined   = [...todayGames, ...tmrwGames]
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (combined.length > 0) {
          return res.json({ success: true, source: 'today', data: combined.map(transformFB) });
        }

        // Last resort: return all games unfiltered
        return res.json({ success: false, error: 'No matches found for today' });
      }

      // ── FOOTBALL FIXTURES ────────────────────────────────────────────────
      case 'football-fixtures': {
        const [d0, d1, d2] = await Promise.all([
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(-1) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(1) }),
        ]);
        const all = [
          ...extractGames(d0),
          ...extractGames(d1),
          ...extractGames(d2),
        ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 100).map(transformFB) });
        return res.json({ success: false, error: 'No fixtures found. SportsAPIPro may have no data for this date range.' });
      }

      // ── FOOTBALL ODDS (The Odds API) ──────────────────────────────────────
      case 'football-odds': {
        const sport = req.query.sport || 'soccer_epl';
        const data  = await get(
          `${ODDS_URL}/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu&markets=h2h,totals&oddsFormat=decimal`
        );
        return res.json({ success: true, data: safeJSON(data) });
      }

      // ── FOOTBALL DETAIL ───────────────────────────────────────────────────
      case 'football-h2h': {
        const { home, away } = req.query;
        if (!home || !away) return res.json({ success: false, error: 'Missing home/away' });
        // Search for team IDs
        const [sh, sa] = await Promise.all([
          saproGet(SAPRO_FB + '/api/search', { query: home }),
          saproGet(SAPRO_FB + '/api/search', { query: away }),
        ]);
        const hId = sh?.competitors?.[0]?.id || sh?.teams?.[0]?.id;
        const aId = sa?.competitors?.[0]?.id || sa?.teams?.[0]?.id;
        if (!hId || !aId) return res.json({ success: false, error: 'Teams not found' });
        const h2h = await saproGet(SAPRO_FB + '/api/games-h2h', { homeCompetitorId: hId, awayCompetitorId: aId });
        return res.json({ success: true, data: extractGames(h2h) });
      }

      case 'football-lineups': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: buildLineups(data) });
      }

      case 'football-events': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.events || data?.incidents || [] });
      }

      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.statistics || [] });
      }

      case 'football-predictions': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-predictions', { gameId: id });
        return res.json({ success: !!data, data: data || null });
      }

      case 'football-players': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: buildPlayerStats(data) });
      }

      case 'football-standings': {
        const { league } = req.query;
        if (!league) return res.json({ success: false, error: 'Missing league' });
        const data = await saproGet(SAPRO_FB + '/api/standings', { competitionId: league });
        return res.json({ success: true, data: data?.standings || data?.rows || [] });
      }

      case 'football-topscorers': {
        const { league } = req.query;
        const data = await saproGet(SAPRO_FB + '/api/athletes', { competitionId: league || '1', limit: 20, sortBy: 'goals' });
        return res.json({ success: true, data: data?.athletes || [] });
      }

      case 'football-topassists': {
        const { league } = req.query;
        const data = await saproGet(SAPRO_FB + '/api/athletes', { competitionId: league || '1', limit: 20, sortBy: 'assists' });
        return res.json({ success: true, data: data?.athletes || [] });
      }

      case 'football-injuries': {
        if (!id) return res.json({ success: false, error: 'Missing fixture id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.injuries || [] });
      }

      case 'football-team-form': {
        const { team } = req.query;
        if (!team) return res.json({ success: false, error: 'Missing team' });
        const data = await saproGet(SAPRO_FB + '/api/games-results', { competitorId: team, limit: 6 });
        return res.json({ success: true, data: extractGames(data) });
      }

      case 'football-team-search': {
        const { name } = req.query;
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await saproGet(SAPRO_FB + '/api/search', { query: name });
        return res.json({ success: true, data: (data?.competitors || data?.teams || []).slice(0, 5) });
      }

      case 'football-player-search': {
        const { name } = req.query;
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await saproGet(SAPRO_FB + '/api/search', { query: name });
        return res.json({ success: true, data: (data?.athletes || data?.players || []).slice(0, 5) });
      }

      case 'football-player-stats': {
        const { player } = req.query;
        if (!player) return res.json({ success: false, error: 'Missing player id' });
        const data = await saproGet(SAPRO_FB + '/api/athletes', { athleteId: player });
        return res.json({ success: true, data: data || null });
      }

      case 'football-value-bets': {
        const [fixturesResp, oddsRaw] = await Promise.all([
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          get(`${ODDS_URL}/sports/soccer_epl/odds/?apiKey=${ODDS_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`),
        ]);
        const games   = extractGames(fixturesResp).slice(0, 20);
        const oddsArr = safeJSON(oddsRaw) || [];
        return res.json({
          success: true,
          data: games.map(g => {
            const t  = transformFB(g);
            const od = oddsArr.find(o =>
              (o.home_team || '').toLowerCase().includes((t.home || '').toLowerCase().split(' ')[0])
            );
            if (od?.bookmakers?.length) t.odds = extractOddsAPI(od, t.home, t.away);
            return t;
          }),
        });
      }

      // ── BASKETBALL LIVE ───────────────────────────────────────────────────
      case 'basketball-live': {
        const requestedDate = req.query.date;

        if (requestedDate) {
          const data = await saproGet(SAPRO_BB + '/api/fixtures', { date: requestedDate });
          const games = extractGames(data);
          if (!games.length) return res.json({ success: false, error: 'No games on ' + requestedDate });
          return res.json({ success: true, source: 'dated', data: games.map(transformBB) });
        }

        const [liveResp, todayResp, tmrwResp] = await Promise.all([
          saproGet(SAPRO_BB + '/api/live'),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(1) }),
        ]);

        const liveGames = extractGames(liveResp);
        if (liveGames.length > 0) return res.json({ success: true, source: 'live', data: liveGames.map(transformBB) });

        const combined = [
          ...extractGames(todayResp),
          ...extractGames(tmrwResp),
        ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (combined.length > 0) return res.json({ success: true, source: 'today', data: combined.map(transformBB) });
        return res.json({ success: false, error: 'No basketball games found for today' });
      }

      case 'basketball-fixtures': {
        const [d0, d1] = await Promise.all([
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(1) }),
        ]);
        const all = [...extractGames(d0), ...extractGames(d1)];
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 60).map(transformBB) });
        return res.json({ success: false, error: 'No basketball fixtures found' });
      }

      case 'basketball-odds': {
        const data = await get(
          `${ODDS_URL}/sports/basketball_nba/odds/?apiKey=${ODDS_KEY}&regions=us,uk&markets=h2h,totals&oddsFormat=decimal`
        );
        return res.json({ success: true, data: safeJSON(data) });
      }

      case 'basketball-player-props': {
        if (!id) return res.json({ success: false, error: 'Missing game id' });
        const data = await saproGet(SAPRO_BB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.players || [] });
      }

      // ── APEX CONSENSUS ODDS ────────────────────────────────────────────────
      case 'apex-odds': {
        const { sport, homeTeam, awayTeam } = req.query;
        const sportKey = sport || 'soccer_epl';
        const rawData  = await get(
          `${ODDS_URL}/sports/${sportKey}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`
        );
        const allMarkets = safeJSON(rawData) || [];
        if (!Array.isArray(allMarkets)) return res.json({ success: false, error: 'Odds API error' });

        const match = allMarkets.find(m => {
          const ht = (m.home_team || '').toLowerCase();
          const at = (m.away_team || '').toLowerCase();
          const hq = (homeTeam || '').toLowerCase();
          const aq = (awayTeam || '').toLowerCase();
          return ht.includes(hq.split(' ')[0]) || at.includes(aq.split(' ')[0]);
        });

        if (!match) return res.json({ success: false, error: 'Match not found in odds' });

        const allBooks = (match.bookmakers || []).map(bk => {
          const mkt = bk.markets?.find(m => m.key === 'h2h');
          if (!mkt) return null;
          const outs = mkt.outcomes || [];
          const h = outs.find(o => o.name === match.home_team)?.price;
          const d = outs.find(o => o.name === 'Draw')?.price;
          const a = outs.find(o => o.name === match.away_team)?.price;
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

      // ── TENNIS / HOCKEY LIVE ──────────────────────────────────────────────
      case 'tennis-live': {
        const data = await saproGet(SAPRO_TN + '/api/live');
        return res.json({ success: true, data: extractGames(data).slice(0, 30).map(g => transformGeneric(g, 'tennis')) });
      }

      case 'hockey-live': {
        const data = await saproGet(SAPRO_HK + '/api/live');
        return res.json({ success: true, data: extractGames(data).slice(0, 30).map(g => transformGeneric(g, 'hockey')) });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    console.error('[EdgeX sports.js]', type, err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── EXTRACT GAMES ─────────────────────────────────────────────────────────────
// SportsAPIPro can return games in multiple shapes — handle all of them
function extractGames(data) {
  if (!data) return [];
  // Shape 1: { games: [...] }
  if (Array.isArray(data.games)) return data.games;
  // Shape 2: { data: { games: [...] } }
  if (Array.isArray(data.data?.games)) return data.data.games;
  // Shape 3: Direct array
  if (Array.isArray(data)) return data;
  // Shape 4: { data: [...] }
  if (Array.isArray(data.data)) return data.data;
  return [];
}

// ── APEX MATH ─────────────────────────────────────────────────────────────────
function impliedProb(o) { return o > 1 ? 1 / o : 0; }
function calcVig(arr) { return +((arr.reduce((s, o) => s + impliedProb(o), 0) - 1) * 100).toFixed(2); }
function fairProbs(arr) {
  const vig = arr.reduce((s, o) => s + impliedProb(o), 0);
  return arr.map(o => +((impliedProb(o) / vig) * 100).toFixed(1));
}
function apexConsensus(books) {
  if (!books?.length) return [];
  const all = books.map(fairProbs);
  const n = all.length, len = all[0].length;
  return Array.from({ length: len }, (_, i) => +(all.reduce((s, f) => s + f[i], 0) / n).toFixed(1));
}

// ── TRANSFORMS ────────────────────────────────────────────────────────────────
function transformFB(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = new Date(g.startTime || Date.now()); matchDay.setHours(0, 0, 0, 0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const statusText = (g.statusText || g.status?.name || '').toLowerCase();
  const isLive  = statusText.includes('live') || statusText.includes('progress') ||
                  statusText.includes('1st half') || statusText.includes('2nd half') ||
                  statusText.includes('q1') || statusText.includes('q2');
  const isHT    = statusText.includes('half time') || statusText.includes('half-time');
  const isFT    = statusText.includes('finish') || statusText.includes('ended') || statusText === 'ft';
  const edgeStatus = isLive ? 'LIVE' : isHT ? 'HT' : isFT ? 'FT' : 'NS';

  const homeScore = g.homeCompetitor?.score ?? null;
  const awayScore = g.awayCompetitor?.score ?? null;

  return {
    id:         String(g.id),
    home:       g.homeCompetitor?.name || 'Home',
    away:       g.awayCompetitor?.name || 'Away',
    homeId:     g.homeCompetitor?.id,
    awayId:     g.awayCompetitor?.id,
    homeLogo:   g.homeCompetitor?.imageUrl || '',
    awayLogo:   g.awayCompetitor?.imageUrl || '',
    league:     g.competitionDisplayName || g.competition?.name || 'Football',
    leagueId:   g.competitionId || g.competition?.id,
    venue:      g.venue?.name || '',
    kickoff:    g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--',
    date:       g.startTime || '',
    dayLabel,   dayOffset: diff,
    status:     edgeStatus,
    minute:     g.clock || g.statusText || 0,
    isLive,
    score:      { home: homeScore ?? 0, away: awayScore ?? 0 },
    hasScore:   homeScore !== null && homeScore !== undefined,
    ht:         null,
    events:     [],
    odds:       null,
  };
}

function transformBB(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = new Date(g.startTime || Date.now()); matchDay.setHours(0, 0, 0, 0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const statusText = (g.statusText || '').toLowerCase();
  const isLive = statusText.includes('live') || statusText.includes('q1') || statusText.includes('q2') ||
                 statusText.includes('q3') || statusText.includes('q4') || statusText.includes('progress');
  const isFT   = statusText.includes('finish') || statusText.includes('ended') || statusText.includes('final');

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
    league:   g.competitionDisplayName || 'Basketball',
    leagueId: g.competitionId,
    kickoff:  g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--',
    date:     g.startTime || '',
    dayLabel, dayOffset: diff,
    status:   isLive ? 'LIVE' : isFT ? 'FT' : 'NS',
    isLive,
    score:    { home: homeScore ?? 0, away: awayScore ?? 0 },
    hasScore: homeScore !== null,
    quarters: {},
  };
}

function transformGeneric(g, sport) {
  return {
    id:     String(g.id),
    home:   g.homeCompetitor?.name || '',
    away:   g.awayCompetitor?.name || '',
    league: g.competitionDisplayName || sport,
    status: (g.statusText || 'NS').toUpperCase().includes('LIVE') ? 'LIVE' : 'NS',
    isLive: (g.statusText || '').toLowerCase().includes('live'),
    score:  { home: g.homeCompetitor?.score ?? 0, away: g.awayCompetitor?.score ?? 0 },
    kickoff: g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    sport,
  };
}

// ── ODDS API FORMAT HELPER ────────────────────────────────────────────────────
function extractOddsAPI(oddsMarket, homeName, awayName) {
  const bk  = oddsMarket.bookmakers?.[0];
  const mkt = bk?.markets?.find(m => m.key === 'h2h');
  if (!mkt) return null;
  return {
    home: mkt.outcomes?.find(o => o.name === oddsMarket.home_team)?.price,
    draw: mkt.outcomes?.find(o => o.name === 'Draw')?.price,
    away: mkt.outcomes?.find(o => o.name === oddsMarket.away_team)?.price,
  };
}

// ── LINEUP / PLAYER HELPERS ───────────────────────────────────────────────────
function buildLineups(data) {
  if (!data) return [];
  const teams = data.lineups || data.competitors || [];
  return teams.map(t => ({
    team:      t.name || t.team?.name || '',
    formation: t.formation || '',
    players:   (t.startingLineup || t.players || []).map(p => ({
      name: p.name || '', number: p.jerseyNumber || '', pos: p.position || '',
    })),
    subs: (t.substitutes || []).map(p => ({ name: p.name || '', number: p.jerseyNumber || '' })),
  }));
}

function buildPlayerStats(data) {
  if (!data) return [];
  return (data.competitors || data.lineups || []).map(t => ({
    team: { name: t.name || '' },
    players: (t.players || []).map(p => ({
      player: { name: p.name || '', photo: p.imageUrl || '' },
      statistics: [{ games: { rating: p.rating, position: p.position, minutes: p.minutesPlayed } }],
    })),
  }));
}

// ── HTTP HELPERS ──────────────────────────────────────────────────────────────
function saproGet(baseUrl, params = {}) {
  return new Promise(resolve => {
    try {
      const u = new URL(baseUrl);
      Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
      const opts = { headers: { 'x-api-key': SAPRO_KEY, 'Accept': 'application/json' } };
      https.get(u.toString(), opts, r => {
        let body = '';
        r.on('data', c => { body += c; });
        r.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
      }).on('error', () => resolve(null));
    } catch (e) { resolve(null); }
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
  try { return typeof str === 'string' ? JSON.parse(str) : str; } catch { return null; }
}
