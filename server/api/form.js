// api/form.js — EdgeX Team Form Fetcher v4
// Fix: ESPN soccer returns scores via $ref links OR in linescores/displayValue
// Solution: extract score from competition displayValue or linescores
import { sportApiProvider } from '../historical/sportapi-runtime.js';

function normalizeSportApiForm(fixtures, teamId, league, requestedLimit) {
  const completed = (Array.isArray(fixtures) ? fixtures : []).filter(fixture => fixture?.completed && fixture?.score?.verified);
  const form = completed.map(fixture => {
    const home = fixture.homeTeam || {};
    const away = fixture.awayTeam || {};
    const isHome = String(home.id) === String(teamId);
    const team = isHome ? home : away;
    const opponent = isHome ? away : home;
    if (!team?.id || !opponent?.id || String(team.id) !== String(teamId)) return null;
    const goalsFor = isHome ? fixture.score.home : fixture.score.away;
    const goalsAgainst = isHome ? fixture.score.away : fixture.score.home;
    if (!Number.isFinite(Number(goalsFor)) || !Number.isFinite(Number(goalsAgainst))) return null;
    const result = Number(goalsFor) > Number(goalsAgainst) ? 'W' : Number(goalsFor) < Number(goalsAgainst) ? 'L' : 'D';
    return {
      date: fixture.kickoff,
      opponent: opponent.name || 'Opponent unavailable',
      opponentLogo: opponent.logoUrl || '',
      score: `${goalsFor}-${goalsAgainst}`,
      result,
      isHome,
      goalsFor: Number(goalsFor),
      goalsAgainst: Number(goalsAgainst),
      provider: 'sportapi',
      evidenceClass: fixture.evidenceClass,
      provenance: fixture.provenance,
    };
  }).filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-requestedLimit);
  return {
    provider: 'sportapi',
    providerLabel: 'SportAPI',
    form,
    stats: computeFormStats(form),
    teamStats: null,
    teamId,
    league,
    _debug: { source: 'sportapi', completed: completed.length, formGames: form.length, requestedLimit },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { league, teamId, debug } = req.query;
  const requestedLimit = Math.max(10, Math.min(15, Number.parseInt(req.query.limit || '15', 10) || 15));
  if (!league || !teamId) return res.status(400).json({ error: 'league and teamId required' });

  // SportAPI is preferred for upcoming/live context. ESPN remains the tertiary fallback.
  try {
    const sportHistory = await sportApiProvider.getTeamHistory(String(teamId), { page: 0 });
    const sportForm = normalizeSportApiForm(sportHistory.data, String(teamId), league, requestedLimit);
    if (sportForm.form.length > 0) return res.status(200).json(sportForm);
  } catch (error) {
    // Continue to ESPN without blocking the form route.
  }

  const urls = [
    `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`,
  ];

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    let r = null;
    for (const url of urls) {
      const candidate = await fetch(url, {
        headers: { 'User-Agent': 'EdgeX/2.0' },
        signal: ctrl.signal,
      });
      if (candidate.ok) { r = candidate; break; }
      r = candidate;
    }
    clearTimeout(tid);

    if (!r?.ok) return res.status(200).json({ provider: 'espn', providerLabel: 'ESPN', form: [], stats: null, teamId, league, _debug: { source: 'espn', espnStatus: r?.status ?? 502 } });

    const data = await r.json();
    const events = data.events || [];

    if (debug === '1') {
      // Show raw competitor structure so we can see where scores live
      const ev = events.find(e => e.competitions?.[0]?.status?.type?.completed);
      const comp = ev?.competitions?.[0];
      return res.status(200).json({
        totalEvents: events.length,
        completedSample: ev ? {
          name: ev.name,
          date: ev.date,
          statusType: comp?.status?.type,
          // Show full competitor objects to find score location
          competitors: comp?.competitors?.map(c => ({
            teamId: c.team?.id,
            teamName: c.team?.displayName,
            score: c.score,
            scoreKeys: c.score ? Object.keys(c.score) : 'not object',
            displayValue: c.displayValue,
            winner: c.winner,
            linescores: c.linescores?.slice(0,2),
          }))
        } : null,
      });
    }

    // Extract score — ESPN soccer uses multiple possible locations:
    // 1. competitor.score as plain number/string
    // 2. competitor.score.$ref (need different approach)  
    // 3. competitor.linescores summed
    // 4. competitor.displayValue (the actual display score string)
    // 5. Parse from event name like "Liverpool 2-1 Everton"
    const extractScore = (competitor) => {
      const sc = competitor.score;

      // ESPN soccer: score is an OBJECT with displayValue inside it
      // e.g. score: { "$ref": "...", "value": 2, "displayValue": "2", "winner": true }
      if (sc && typeof sc === 'object') {
        // Try value field first (numeric)
        if (sc.value !== undefined) {
          const n = parseFloat(sc.value);
          if (!isNaN(n)) return n;
        }
        // Try displayValue (string like "2")
        if (sc.displayValue !== undefined) {
          const n = parseFloat(sc.displayValue);
          if (!isNaN(n)) return n;
        }
      }

      // Try score as plain number/string (other sports)
      if (sc !== null && sc !== undefined && typeof sc !== 'object') {
        const n = parseFloat(String(sc));
        if (!isNaN(n)) return n;
      }

      // Try top-level displayValue on competitor
      if (competitor.displayValue !== undefined) {
        const n = parseFloat(String(competitor.displayValue));
        if (!isNaN(n)) return n;
      }

      // Try summing linescores
      if (competitor.linescores?.length) {
        const total = competitor.linescores.reduce((s, ls) => {
          const v = parseFloat(ls.value ?? ls.displayValue ?? 0);
          return s + (isNaN(v) ? 0 : v);
        }, 0);
        if (total >= 0) return total;
      }

      return null;
    };

    // Filter completed games
    const completed = events.filter(ev => {
      const comp = ev.competitions?.[0];
      return comp?.status?.type?.completed === true;
    });

    const form = completed.map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const team = competitors.find(c => String(c.team?.id) === String(teamId));
      const opp  = competitors.find(c => String(c.team?.id) !== String(teamId));
      if (!team || !opp) return null;

      let teamScore = extractScore(team);
      let oppScore  = extractScore(opp);

      let result;
      if (teamScore === null || oppScore === null) {
        if (team.winner === true) result = 'W';
        else if (opp.winner === true) result = 'L';
        else result = 'D';
        teamScore = teamScore ?? 0;
        oppScore = oppScore ?? 0;
      } else {
        teamScore = Math.floor(teamScore);
        oppScore  = Math.floor(oppScore);
        result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
      }

      return {
        date: ev.date,
        opponent: opp?.team?.shortDisplayName || opp?.team?.displayName || '?',
        opponentLogo: opp?.team?.logo || '',
        score: `${teamScore}-${oppScore}`,
        result,
        isHome: team.homeAway === 'home',
        goalsFor: teamScore,
        goalsAgainst: oppScore,
      };
    }).filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // oldest → newest
      .slice(-requestedLimit); // most recent 10–15, bounded for mobile detail use

    const stats = computeFormStats(form);

    // Step 3: Fetch team stats for corners + defensive data
    let teamStats = null;
    try {
      const tsUrl = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}`;
      const tsCtrl = new AbortController();
      const tsTid = setTimeout(() => tsCtrl.abort(), 6000);
      const tsR = await fetch(tsUrl, { headers: { 'User-Agent': 'EdgeX/2.0' }, signal: tsCtrl.signal });
      clearTimeout(tsTid);
      if (tsR.ok) {
        const tsData = await tsR.json();
        const stats = tsData.team?.record?.items || [];
        const findStat = (arr, name) => {
          for (const item of arr) {
            const s = (item.stats||[]).find(s => s.name === name || s.abbreviation === name);
            if (s) return parseFloat(s.value ?? s.displayValue ?? 0);
          }
          return null;
        };
        // Pull what's available from team record stats
        const cornersFor = findStat(stats, 'cornersFor') ?? findStat(stats, 'cornerKicks');
        const cornersAgainst = findStat(stats, 'cornersAgainst');
        const shotsFor = findStat(stats, 'shotsFor') ?? findStat(stats, 'shots');
        const shotsAgainst = findStat(stats, 'shotsAgainst');
        const gp = findStat(stats, 'gamesPlayed') ?? findStat(stats, 'GP') ?? 1;
        teamStats = {
          cornersForPG: cornersFor != null ? +(cornersFor/gp).toFixed(1) : null,
          cornersAgainstPG: cornersAgainst != null ? +(cornersAgainst/gp).toFixed(1) : null,
          shotsForPG: shotsFor != null ? +(shotsFor/gp).toFixed(1) : null,
          shotsAgainstPG: shotsAgainst != null ? +(shotsAgainst/gp).toFixed(1) : null,
        };
      }
    } catch(e) {
      // teamStats stays null — not critical
    }

    return res.status(200).json({
      provider: 'espn',
      providerLabel: 'ESPN',
      form,
      stats,
      teamStats,
      teamId, league,
      _debug: { source: 'espn', totalEvents: events.length, completed: completed.length, formGames: form.length, requestedLimit }
    });

  } catch (err) {
    return res.status(200).json({ provider: 'espn', providerLabel: 'ESPN', error: err.message, form: [], stats: null });
  }
}

function computeFormStats(form) {
  if (!form || form.length === 0) return null;
  const wins   = form.filter(g => g.result === 'W').length;
  const draws  = form.filter(g => g.result === 'D').length;
  const losses = form.filter(g => g.result === 'L').length;
  const played = form.length;
  const gf = form.reduce((s, g) => s + (g.goalsFor || 0), 0);
  const ga = form.reduce((s, g) => s + (g.goalsAgainst || 0), 0);
  const cs   = form.filter(g => g.goalsAgainst === 0).length;
  const pts  = wins * 3 + draws;
  const gfpg = played > 0 ? (gf / played).toFixed(1) : '0.0';
  const gapg = played > 0 ? (ga / played).toFixed(1) : '0.0';
  const ppg  = played > 0 ? (pts / played).toFixed(1) : '0.0';
  const form5 = form.slice(-5).map(g => g.result);
  const homeGames = form.filter(g => g.isHome);
  const awayGames = form.filter(g => !g.isHome);
  const homeWR = homeGames.length > 0 ? (homeGames.filter(g=>g.result==='W').length/homeGames.length).toFixed(2) : '0.00';
  const awayWR = awayGames.length > 0 ? (awayGames.filter(g=>g.result==='W').length/awayGames.length).toFixed(2) : '0.00';
  return { played, wins, draws, losses, gf, ga, gfpg, gapg, cs, pts, ppg, form5, homeWR, awayWR };
}
