/* ===== EdgeX — AllSportsAPI Integration ===== */
// Football + Basketball live scores, fixtures, odds
// Key works for both sports

const ALLSPORTS_KEY = '8fea7d5de9a5e7147788af09cf1718a7260fc575a55415df87fae477e897f670';
const FB_BASE  = 'https://apiv2.allsportsapi.com/football/';
const BB_BASE  = 'https://apiv2.allsportsapi.com/basketball/';

// ── Fetch helper ──────────────────────────────────────────────────────────────
async function asFetch(base, params = {}) {
  const url = new URL(base);
  url.searchParams.set('APIkey', ALLSPORTS_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`AllSportsAPI ${res.status}`);
  const json = await res.json();
  if (json.success !== 1) throw new Error('AllSportsAPI returned success=0');
  return json.result || [];
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════════════════════
//  FOOTBALL
// ══════════════════════════════════════════════════════════════════════════════

async function fetchFootballLive() {
  const raw = await asFetch(FB_BASE, { met: 'Livescore' });
  return raw.map(transformFootballMatch);
}

async function fetchFootballFixtures(daysAhead = 4) {
  const from = todayStr(0);
  const to   = todayStr(daysAhead);
  const raw  = await asFetch(FB_BASE, { met: 'Fixtures', from, to });
  return raw.map(transformFootballMatch);
}

async function fetchFootballOddsLive() {
  try {
    const raw = await asFetch(FB_BASE, { met: 'OddsLive' });
    // Build map: event_key → odds
    const map = {};
    raw.forEach(o => {
      if (!o.event_key) return;
      const odds = extractOdds(o.odds);
      if (odds) map[String(o.event_key)] = odds;
    });
    return map;
  } catch (e) {
    return {};
  }
}

function transformFootballMatch(e) {
  // Parse score from e.g. "2 - 1"
  const parseScore = (str) => {
    if (!str || str === '' || str === '? - ?') return null;
    const parts = String(str).split('-').map(s => parseInt(s.trim(), 10));
    return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])
      ? { home: parts[0], away: parts[1] }
      : null;
  };

  const liveScore = parseScore(e.event_final_result);
  const htScore   = parseScore(e.event_halftime_result);

  // Status: event_status is a minute string when live (e.g. "74"), "HT", "Finished", or ""
  const statusRaw = String(e.event_status || '');
  const minute    = parseInt(statusRaw, 10);
  const isLive    = e.event_live === '1';
  const status    = statusRaw === 'HT' ? 'HT'
    : statusRaw === 'Finished'         ? 'FT'
    : isLive                           ? 'LIVE'
    : 'NS';

  // Day label
  const today = new Date(); today.setHours(0,0,0,0);
  const matchDay = new Date(e.event_date); matchDay.setHours(0,0,0,0);
  const diff = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY'
    : diff === 1 ? 'TOMORROW'
    : diff === -1 ? 'YESTERDAY'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();

  // Parse goalscorers
  const goals = [];
  if (Array.isArray(e.goalscorer)) {
    e.goalscorer.forEach(g => {
      if (g.score) goals.push({
        type: 'GOAL',
        minute: parseInt(g.time || g.score_info_time || 0),
        player: g.home_scorer || g.away_scorer || '',
        team: g.home_scorer ? 'home' : 'away',
        score: g.score,
        detail: g.score_info || 'Goal',
      });
    });
  }

  // Parse cards
  const cards = [];
  if (Array.isArray(e.cards)) {
    e.cards.forEach(c => {
      cards.push({
        type: c.card === 'red card' ? 'RED' : 'YELLOW',
        minute: parseInt(c.time || 0),
        player: c.home_fault || c.away_fault || '',
        team: c.home_fault ? 'home' : 'away',
        detail: c.card,
      });
    });
  }

  // Combine events sorted by minute desc
  const events = [...goals, ...cards].sort((a, b) => b.minute - a.minute);

  return {
    id:          String(e.event_key),
    home:        e.event_home_team || 'Home',
    away:        e.event_away_team || 'Away',
    homeLogo:    e.home_team_logo || '',
    awayLogo:    e.away_team_logo || '',
    league:      e.league_name || 'Football',
    leagueRound: e.league_round || '',
    stadium:     e.event_stadium || '',
    referee:     e.event_referee || '',
    kickoff:     e.event_time || '',
    date:        e.event_date || '',
    dayLabel,
    dayOffset:   diff,
    status,
    minute:      isNaN(minute) ? 0 : minute,
    isLive,
    score:       liveScore || { home: 0, away: 0 },
    htScore,
    events,
    odds:        null, // filled in later from OddsLive
    // Raw for debug
    _raw: e,
  };
}

function extractOdds(oddsArr) {
  if (!Array.isArray(oddsArr) || oddsArr.length === 0) return null;
  const result = {};
  oddsArr.forEach(o => {
    const name = (o.odd_name || '').toLowerCase();
    if (name.includes('home') || name === '1') result.home = parseFloat(o.odd_home_value || o.odd_odd);
    if (name.includes('draw') || name === 'x') result.draw = parseFloat(o.odd_draw_value || o.odd_odd);
    if (name.includes('away') || name === '2') result.away = parseFloat(o.odd_away_value || o.odd_odd);
  });
  // AllSportsAPI also returns structured odds
  if (Array.isArray(oddsArr)) {
    const main = oddsArr.find(o => o.odd_name === 'Match Result' || o.odd_name === '1X2' || o.odd_id === '1');
    if (main) {
      result.home = parseFloat(main.odd_1  || main.odd_home_value || result.home);
      result.draw = parseFloat(main.odd_x  || main.odd_draw_value || result.draw);
      result.away = parseFloat(main.odd_2  || main.odd_away_value || result.away);
    }
  }
  return (result.home && result.away) ? result : null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  BASKETBALL
// ══════════════════════════════════════════════════════════════════════════════

async function fetchBasketballLive() {
  const raw = await asFetch(BB_BASE, { met: 'Livescore' });
  return raw.map(transformBasketballMatch);
}

async function fetchBasketballFixtures(daysAhead = 4) {
  const from = todayStr(0);
  const to   = todayStr(daysAhead);
  const raw  = await asFetch(BB_BASE, { met: 'Fixtures', from, to });
  return raw.map(transformBasketballMatch);
}

function transformBasketballMatch(e) {
  const parseScore = (str) => {
    if (!str || str === '') return null;
    const parts = String(str).split('-').map(s => parseInt(s.trim(), 10));
    return parts.length === 2 && !isNaN(parts[0]) ? { home: parts[0], away: parts[1] } : null;
  };

  const finalScore = parseScore(e.event_final_result);
  const statusRaw  = String(e.event_status || '');
  const isLive     = e.event_live === '1';
  const status     = statusRaw === 'HT' || statusRaw.includes('Half') ? 'HT'
    : statusRaw === 'Finished' || statusRaw === 'After OT'            ? 'FT'
    : isLive                                                           ? 'LIVE'
    : 'NS';

  // Quarter scores
  const qs = e.scores || {};
  const quarters = {
    q1: qs['1stQuarter']?.[0] || null,
    q2: qs['2ndQuarter']?.[0] || null,
    q3: qs['3rdQuarter']?.[0] || null,
    q4: qs['4thQuarter']?.[0] || null,
  };

  // Statistics
  const stats = {};
  if (Array.isArray(e.statistics)) {
    e.statistics.forEach(s => { stats[s.type] = { home: s.home, away: s.away }; });
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const matchDay = new Date(e.event_date); matchDay.setHours(0,0,0,0);
  const diff = Math.round((matchDay - today) / 86400000);
  const dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW'
    : matchDay.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();

  return {
    id:        String(e.event_key),
    home:      e.event_home_team || 'Home',
    away:      e.event_away_team || 'Away',
    homeLogo:  e.event_home_team_logo || '',
    awayLogo:  e.event_away_team_logo || '',
    league:    e.league_name || 'Basketball',
    kickoff:   e.event_time || '',
    date:      e.event_date || '',
    dayLabel,
    dayOffset: diff,
    status,
    isLive,
    score:     finalScore || { home: 0, away: 0 },
    quarters,
    apiStats:  stats,
    _raw: e,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT HELPERS — called by football-live.js and basketball-page.js
// ══════════════════════════════════════════════════════════════════════════════

window.ALLSPORTS_LOADED = false;

async function initFootballFromAPI() {
  try {
    showToast('📡 Fetching live matches...');

    // Fetch live matches + odds in parallel
    const [liveMatches, oddsMap] = await Promise.all([
      fetchFootballLive(),
      fetchFootballOddsLive(),
    ]);

    // Attach odds
    liveMatches.forEach(m => { if (oddsMap[m.id]) m.odds = oddsMap[m.id]; });

    if (liveMatches.length > 0) {
      window.ALLSPORTS_LOADED = true;
      showToast(`✅ ${liveMatches.filter(m=>m.isLive).length} live · ${liveMatches.length} total`);
      return liveMatches;
    }
    throw new Error('No live matches');
  } catch (e) {
    console.warn('AllSportsAPI football:', e.message);
    return null;
  }
}

async function initFootballFixturesFromAPI() {
  try {
    const fixtures = await fetchFootballFixtures(4);
    // Fetch live odds and attach
    try {
      const oddsMap = await fetchFootballOddsLive();
      fixtures.forEach(m => { if (oddsMap[m.id]) m.odds = oddsMap[m.id]; });
    } catch {}
    return fixtures.length > 0 ? fixtures : null;
  } catch (e) {
    console.warn('AllSportsAPI fixtures:', e.message);
    return null;
  }
}

async function initBasketballFromAPI() {
  try {
    const [liveGames, upcomingGames] = await Promise.all([
      fetchBasketballLive(),
      fetchBasketballFixtures(4),
    ]);
    const all = [...liveGames, ...upcomingGames.filter(g => !liveGames.find(l => l.id === g.id))];
    return all.length > 0 ? all : null;
  } catch (e) {
    console.warn('AllSportsAPI basketball:', e.message);
    return null;
  }
}
