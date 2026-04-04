// api/sports.js — SportsAPIPro + The Odds API (multi-book consensus)
// EdgeX Intelligence Platform — chike2510/EdgeX

const https = require('https');

// ── KEYS ──────────────────────────────────────────────────────────────────────
const SAPRO_KEY = '991b2f42-8f9f-47ff-a987-1755d725e536';
const ODDS_KEY  = '00383cc8a2318f6894be715e4fa97148';

// ── BASE URLS ─────────────────────────────────────────────────────────────────
const SAPRO_FB = 'https://v2.football.sportsapipro.com';
const SAPRO_BB = 'https://v2.basketball.sportsapipro.com';
const SAPRO_TN = 'https://v2.tennis.sportsapipro.com';
const SAPRO_HK = 'https://v2.hockey.sportsapipro.com';
const ODDS_URL = 'https://api.the-odds-api.com/v4';

const SAPRO_HEADERS = { 'x-api-key': SAPRO_KEY };

// ── MAJOR FOOTBALL COMPETITION IDs (SportsAPIPro internal IDs) ─────────────
// These filter the /api/live and /api/schedule responses
const FB_COMP_NAMES = new Set([
  'Premier League','La Liga','Bundesliga','Serie A','Ligue 1',
  'UEFA Champions League','UEFA Europa League','UEFA Conference League',
  'FA Cup','Copa del Rey','Coppa Italia','DFB Pokal',
  'Eredivisie','Primeira Liga','Super Lig','Pro League',
  'MLS','Brazilian Serie A','Copa Libertadores',
  'World Cup','Euro Championship','Copa America','AFCON',
  'Scottish Premiership','Nations League',
]);

// ── BASKETBALL LEAGUE NAMES ───────────────────────────────────────────────────
const BB_COMP_NAMES = new Set([
  'NBA','EuroLeague','EuroCup','ACB','Betclic Elite','LBA',
  'WNBA','NBL','BBL','BSL',
]);

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

      // ── STATUS / TEST ────────────────────────────────────────────────────
      case 'test': {
        // Ping SportsAPIPro live endpoint
        const liveData = await saproGet(SAPRO_FB + '/api/live');
        const games = liveData?.games || [];
        return res.json({
          success: true,
          provider: 'SportsAPIPro',
          key: SAPRO_KEY.slice(0, 8) + '...',
          liveGames: games.length,
          sample: games.slice(0, 3).map(g => ({
            home: g.homeCompetitor?.name,
            away: g.awayCompetitor?.name,
            league: g.competitionDisplayName,
            status: g.statusText,
          })),
        });
      }

      // ── FOOTBALL LIVE ────────────────────────────────────────────────────
      case 'football-live': {
        const requestedDate = req.query.date;
        let games = [];

        if (requestedDate) {
          // Dated schedule
          const data = await saproGet(SAPRO_FB + '/api/fixtures', { date: requestedDate });
          games = filterFootball(data?.games || []);
          if (!games.length) return res.json({ success: false, error: 'No matches on ' + requestedDate });
          return res.json({ success: true, source: 'dated', date: requestedDate, data: games.map(transformSaproFootball) });
        }

        // Parallel: live now + today + tomorrow
        const [liveResp, todayResp, tmrwResp] = await Promise.all([
          saproGet(SAPRO_FB + '/api/live'),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(1) }),
        ]);

        const live = filterFootball(liveResp?.games || []);
        if (live.length > 0) {
          return res.json({ success: true, source: 'live', data: live.map(transformSaproFootball) });
        }

        const combined = [
          ...filterFootball(todayResp?.games || []),
          ...filterFootball(tmrwResp?.games   || []),
        ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (combined.length > 0) {
          return res.json({ success: true, source: 'today', data: combined.map(transformSaproFootball) });
        }
        return res.json({ success: false, error: 'No major league matches found today' });
      }

      // ── FOOTBALL FIXTURES ────────────────────────────────────────────────
      case 'football-fixtures': {
        const [d0, d1, d2] = await Promise.all([
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(-1) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(1) }),
        ]);
        const all = [
          ...filterFootball(d0?.games || []),
          ...filterFootball(d1?.games || []),
          ...filterFootball(d2?.games || []),
        ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 100).map(transformSaproFootball) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      // ── FOOTBALL ODDS (The Odds API — multi-book) ────────────────────────
      case 'football-odds': {
        const sport = req.query.sport || 'soccer_epl';
        const data  = await get(
          `${ODDS_URL}/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu&markets=h2h,totals&oddsFormat=decimal&bookmakers=betfair,pinnacle,bet365,williamhill,unibet,betway,paddypower,ladbrokes`,
          {}
        );
        return res.json({ success: true, data: parseJSON(data) });
      }

      // ── FOOTBALL H2H ────────────────────────────────────────────────────
      case 'football-h2h': {
        const { home, away } = req.query;
        if (!home && !away) return res.json({ success: false, error: 'Missing home/away names' });
        // SportsAPIPro H2H via search
        const searchH = await saproGet(SAPRO_FB + '/api/search', { query: home });
        const searchA = await saproGet(SAPRO_FB + '/api/search', { query: away });
        const hId = searchH?.teams?.[0]?.id || searchH?.competitors?.[0]?.id;
        const aId = searchA?.teams?.[0]?.id || searchA?.competitors?.[0]?.id;
        if (!hId || !aId) return res.json({ success: false, error: 'Teams not found in SportsAPIPro' });
        const h2h = await saproGet(SAPRO_FB + '/api/games-h2h', { homeCompetitorId: hId, awayCompetitorId: aId });
        return res.json({ success: true, data: h2h?.games || [] });
      }

      // ── FOOTBALL STANDINGS ────────────────────────────────────────────────
      case 'football-standings': {
        const { league } = req.query;
        if (!league) return res.json({ success: false, error: 'Missing league' });
        // SportsAPIPro standings by competition name/id
        const data = await saproGet(SAPRO_FB + '/api/standings', { competitionId: league });
        return res.json({ success: true, data: data?.standings || data?.rows || [] });
      }

      // ── FOOTBALL TOP SCORERS ──────────────────────────────────────────────
      case 'football-topscorers': {
        const { league } = req.query;
        const data = await saproGet(SAPRO_FB + '/api/athletes', {
          competitionId: league || '1', limit: 20, sortBy: 'goals',
        });
        return res.json({ success: true, data: data?.athletes || [] });
      }

      // ── FOOTBALL TOP ASSISTS ──────────────────────────────────────────────
      case 'football-topassists': {
        const { league } = req.query;
        const data = await saproGet(SAPRO_FB + '/api/athletes', {
          competitionId: league || '1', limit: 20, sortBy: 'assists',
        });
        return res.json({ success: true, data: data?.athletes || [] });
      }

      // ── FOOTBALL MATCH DETAIL (stats/lineups/events) ──────────────────────
      case 'football-stats': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.statistics || [] });
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

      case 'football-predictions': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        // SportsAPIPro game predictions endpoint
        const data = await saproGet(SAPRO_FB + '/api/game-predictions', { gameId: id });
        return res.json({ success: !!data, data: data || null });
      }

      case 'football-players': {
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: buildPlayerStats(data) });
      }

      case 'football-team-form': {
        const { team } = req.query;
        if (!team) return res.json({ success: false, error: 'Missing team' });
        const data = await saproGet(SAPRO_FB + '/api/games-results', { competitorId: team, limit: 6 });
        return res.json({ success: true, data: data?.games || [] });
      }

      case 'football-team-search': {
        const { name } = req.query;
        if (!name) return res.json({ success: false, error: 'Missing name' });
        const data = await saproGet(SAPRO_FB + '/api/search', { query: name });
        return res.json({ success: true, data: (data?.teams || data?.competitors || []).slice(0, 5) });
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

      case 'football-injuries': {
        if (!id) return res.json({ success: false, error: 'Missing fixture id' });
        const data = await saproGet(SAPRO_FB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.injuries || [] });
      }

      case 'football-value-bets': {
        // Fetch today's matches + odds for edge detection
        const [fixturesResp, oddsResp] = await Promise.all([
          saproGet(SAPRO_FB + '/api/fixtures', { date: todayStr(0) }),
          get(`${ODDS_URL}/sports/soccer_epl/odds/?apiKey=${ODDS_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`, {}),
        ]);
        const games   = filterFootball(fixturesResp?.games || []).slice(0, 20);
        const oddsArr = parseJSON(oddsResp) || [];
        return res.json({
          success: true,
          data: games.map(g => {
            const t = transformSaproFootball(g);
            const od = oddsArr.find(o =>
              (o.home_team||'').toLowerCase().includes((t.home||'').toLowerCase().split(' ')[0]) ||
              (o.away_team||'').toLowerCase().includes((t.away||'').toLowerCase().split(' ')[0])
            );
            if (od?.bookmakers?.length) t.odds = extractOdds(od);
            return t;
          }),
        });
      }

      // ── BASKETBALL LIVE ───────────────────────────────────────────────────
      case 'basketball-live': {
        const requestedDate = req.query.date;
        let games = [];

        if (requestedDate) {
          const data = await saproGet(SAPRO_BB + '/api/fixtures', { date: requestedDate });
          games = filterBasketball(data?.games || []);
          if (!games.length) return res.json({ success: false, error: 'No games on ' + requestedDate });
          return res.json({ success: true, source: 'dated', data: games.map(transformSaproBB) });
        }

        const [liveResp, todayResp, tmrwResp] = await Promise.all([
          saproGet(SAPRO_BB + '/api/live'),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(1) }),
        ]);

        const live = filterBasketball(liveResp?.games || []);
        if (live.length > 0) return res.json({ success: true, source: 'live', data: live.map(transformSaproBB) });

        const combined = [
          ...filterBasketball(todayResp?.games || []),
          ...filterBasketball(tmrwResp?.games   || []),
        ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (combined.length > 0) return res.json({ success: true, source: 'today', data: combined.map(transformSaproBB) });
        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const [d0, d1] = await Promise.all([
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(0) }),
          saproGet(SAPRO_BB + '/api/fixtures', { date: todayStr(1) }),
        ]);
        const all = [
          ...filterBasketball(d0?.games || []),
          ...filterBasketball(d1?.games || []),
        ];
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 60).map(transformSaproBB) });
        return res.json({ success: false, error: 'No basketball fixtures found' });
      }

      case 'basketball-odds': {
        const data = await get(
          `${ODDS_URL}/sports/basketball_nba/odds/?apiKey=${ODDS_KEY}&regions=us,uk&markets=h2h,totals&oddsFormat=decimal`,
          {}
        );
        return res.json({ success: true, data: parseJSON(data) });
      }

      case 'basketball-player-props': {
        if (!id) return res.json({ success: false, error: 'Missing game id' });
        const data = await saproGet(SAPRO_BB + '/api/game-details', { gameId: id });
        return res.json({ success: true, data: data?.players || [] });
      }

      // ── ODDS API — MULTI-SPORT ────────────────────────────────────────────
      case 'odds-sports': {
        // List all available sports
        const data = await get(`${ODDS_URL}/sports/?apiKey=${ODDS_KEY}`, {});
        return res.json({ success: true, data: parseJSON(data) });
      }

      case 'odds-live': {
        const sport = req.query.sport || 'soccer_epl';
        const data  = await get(
          `${ODDS_URL}/sports/${sport}/scores/?apiKey=${ODDS_KEY}&daysFrom=1`,
          {}
        );
        return res.json({ success: true, data: parseJSON(data) });
      }

      // ── APEX CONSENSUS ODDS ───────────────────────────────────────────────
      // Fetches multi-book odds for a specific match and returns vig-stripped
      // consensus probabilities for the APEX engine.
      case 'apex-odds': {
        const { sport, homeTeam, awayTeam } = req.query;
        const sportKey = sport || 'soccer_epl';
        const rawData  = await get(
          `${ODDS_URL}/sports/${sportKey}/odds/?apiKey=${ODDS_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`,
          {}
        );
        const allMarkets = parseJSON(rawData) || [];
        if (!Array.isArray(allMarkets)) return res.json({ success: false, error: 'Odds API error' });

        const match = allMarkets.find(m => {
          const ht = (m.home_team || '').toLowerCase();
          const at = (m.away_team || '').toLowerCase();
          const hq = (homeTeam || '').toLowerCase();
          const aq = (awayTeam || '').toLowerCase();
          return ht.includes(hq.split(' ')[0]) || at.includes(aq.split(' ')[0]);
        });

        if (!match) return res.json({ success: false, error: 'Match not found in odds data' });

        // Build allBooks array: [[homeOdds, drawOdds, awayOdds], ...]
        const allBooks = (match.bookmakers || []).map(bk => {
          const mkt = bk.markets?.find(m => m.key === 'h2h');
          if (!mkt) return null;
          const outcomes = mkt.outcomes || [];
          const h = outcomes.find(o => o.name === match.home_team)?.price;
          const d = outcomes.find(o => o.name === 'Draw')?.price;
          const a = outcomes.find(o => o.name === match.away_team)?.price;
          if (!h || !a) return null;
          return d ? [h, d, a] : [h, a]; // basketball has no draw
        }).filter(Boolean);

        // APEX Math: margin removal + consensus
        const fairProbs = apexConsensus(allBooks);

        return res.json({
          success: true,
          match: { home: match.home_team, away: match.away_team },
          bookmakers: allBooks.length,
          allBooks,
          fairProbs,
          vig: allBooks.length ? calcVig(allBooks[0]) : null,
        });
      }

      // ── TENNIS LIVE ────────────────────────────────────────────────────────
      case 'tennis-live': {
        const data = await saproGet(SAPRO_TN + '/api/live');
        return res.json({ success: true, data: (data?.games || []).slice(0, 30).map(g => transformGeneric(g, 'tennis')) });
      }

      // ── HOCKEY LIVE ────────────────────────────────────────────────────────
      case 'hockey-live': {
        const data = await saproGet(SAPRO_HK + '/api/live');
        return res.json({ success: true, data: (data?.games || []).slice(0, 30).map(g => transformGeneric(g, 'hockey')) });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    console.error('[EdgeX sports.js]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── APEX MATH ─────────────────────────────────────────────────────────────────
function impliedProb(odds) { return odds > 1 ? 1 / odds : 0; }
function calcVig(oddsArr) {
  const vig = oddsArr.reduce((s, o) => s + impliedProb(o), 0);
  return +((vig - 1) * 100).toFixed(2);
}
function fairProbs(oddsArr) {
  const vig = oddsArr.reduce((s, o) => s + impliedProb(o), 0);
  return oddsArr.map(o => +((impliedProb(o) / vig) * 100).toFixed(1));
}
function apexConsensus(booksOdds) {
  if (!booksOdds || !booksOdds.length) return [];
  const allFair = booksOdds.map(fairProbs);
  const n = allFair.length, len = allFair[0].length;
  return Array.from({ length: len }, (_, i) =>
    +(allFair.reduce((s, f) => s + f[i], 0) / n).toFixed(1)
  );
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function filterFootball(games) {
  if (!games.length) return games;
  // If competition names match major leagues, keep; otherwise keep all
  const filtered = games.filter(g => {
    const comp = g.competitionDisplayName || g.competition?.name || '';
    return FB_COMP_NAMES.has(comp) || comp.includes('League') || comp.includes('Cup') || comp.includes('Championship');
  });
  return filtered.length > 0 ? filtered : games.slice(0, 50);
}

function filterBasketball(games) {
  if (!games.length) return games;
  const filtered = games.filter(g => {
    const comp = g.competitionDisplayName || g.competition?.name || '';
    return BB_COMP_NAMES.has(comp) || comp.includes('NBA') || comp.includes('Basketball');
  });
  return filtered.length > 0 ? filtered : games.slice(0, 30);
}

// ── TRANSFORMS ────────────────────────────────────────────────────────────────
function transformSaproFootball(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = new Date(g.startTime); matchDay.setHours(0, 0, 0, 0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const statusText = g.statusText || g.status?.name || '';
  const isLive     = ['Live', 'In Progress', '1st Half', '2nd Half', 'Half Time'].some(s => statusText.includes(s));
  const isFT       = ['Finished', 'Full Time', 'FT', 'Ended'].some(s => statusText.includes(s));

  const edgeStatus = isLive ? 'LIVE' : statusText.includes('Half Time') ? 'HT' : isFT ? 'FT' : 'NS';

  const homeScore = g.homeCompetitor?.score ?? null;
  const awayScore = g.awayCompetitor?.score ?? null;
  const hasScore  = homeScore !== null && homeScore !== undefined;

  return {
    id:         String(g.id),
    home:       g.homeCompetitor?.name || '',
    away:       g.awayCompetitor?.name || '',
    homeId:     g.homeCompetitor?.id,
    awayId:     g.awayCompetitor?.id,
    homeLogo:   g.homeCompetitor?.imageUrl || '',
    awayLogo:   g.awayCompetitor?.imageUrl || '',
    league:     g.competitionDisplayName || g.competition?.name || '',
    leagueId:   g.competitionId || g.competition?.id,
    leagueLogo: g.competition?.imageUrl || '',
    country:    g.competition?.country?.name || '',
    venue:      g.venue?.name || '',
    kickoff:    g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
    date:       g.startTime || '',
    dayLabel,   dayOffset: diff,
    status:     edgeStatus,
    minute:     g.clock || g.statusText || 0,
    isLive,
    score:      { home: homeScore ?? 0, away: awayScore ?? 0 },
    hasScore,
    ht:         null,
    events:     [],
    odds:       null,
  };
}

function transformSaproBB(g) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const matchDay = new Date(g.startTime); matchDay.setHours(0, 0, 0, 0);
  const diff     = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const statusText = g.statusText || '';
  const isLive     = ['Q1','Q2','Q3','Q4','OT','Live','In Progress'].some(s => statusText.includes(s));
  const isFT       = ['Finished','Final','Ended'].some(s => statusText.includes(s));
  const edgeStatus = isLive ? 'LIVE' : isFT ? 'FT' : 'NS';

  const homeScore = g.homeCompetitor?.score ?? null;
  const awayScore = g.awayCompetitor?.score ?? null;

  return {
    id:       String(g.id),
    home:     g.homeCompetitor?.name || '',
    away:     g.awayCompetitor?.name || '',
    homeId:   g.homeCompetitor?.id,
    awayId:   g.awayCompetitor?.id,
    homeLogo: g.homeCompetitor?.imageUrl || '',
    awayLogo: g.awayCompetitor?.imageUrl || '',
    league:   g.competitionDisplayName || 'Basketball',
    leagueId: g.competitionId,
    kickoff:  g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
    date:     g.startTime || '',
    dayLabel, dayOffset: diff,
    status:   edgeStatus,
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
    status: g.statusText || 'NS',
    isLive: (g.statusText || '').toLowerCase().includes('live'),
    score:  { home: g.homeCompetitor?.score ?? 0, away: g.awayCompetitor?.score ?? 0 },
    kickoff: g.startTime ? new Date(g.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    sport,
  };
}

function buildLineups(data) {
  if (!data) return [];
  const teams = data.lineups || data.competitors || [];
  return teams.map(t => ({
    team:      t.name || t.team?.name || '',
    formation: t.formation || '',
    players:   (t.startingLineup || t.players || []).map(p => ({
      name:   p.name || p.player?.name || '',
      number: p.jerseyNumber || p.number || '',
      pos:    p.position || '',
    })),
    subs: (t.substitutes || []).map(p => ({
      name: p.name || '', number: p.jerseyNumber || '',
    })),
  }));
}

function buildPlayerStats(data) {
  if (!data) return [];
  const teams = data.competitors || data.lineups || [];
  return teams.map(t => ({
    team: { name: t.name || '' },
    players: (t.players || []).map(p => ({
      player: { name: p.name || '', photo: p.imageUrl || '' },
      statistics: [{ games: { rating: p.rating, position: p.position, minutes: p.minutesPlayed } }],
    })),
  }));
}

function extractOdds(oddsMarket) {
  const bk  = oddsMarket.bookmakers?.[0];
  const mkt = bk?.markets?.find(m => m.key === 'h2h');
  if (!mkt) return null;
  return {
    home: mkt.outcomes?.find(o => o.name === oddsMarket.home_team)?.price,
    draw: mkt.outcomes?.find(o => o.name === 'Draw')?.price,
    away: mkt.outcomes?.find(o => o.name === oddsMarket.away_team)?.price,
  };
}

// ── HTTP HELPERS ──────────────────────────────────────────────────────────────
function saproGet(baseUrl, params = {}) {
  return new Promise((resolve) => {
    const u = new URL(baseUrl);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    const opts = { headers: { 'x-api-key': SAPRO_KEY, 'Accept': 'application/json' } };
    https.get(u.toString(), opts, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function get(url, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    https.get(u.toString(), { headers: { 'Accept': 'application/json' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function parseJSON(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str; } catch { return null; }
}
