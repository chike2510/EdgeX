// api/form.js — EdgeX Team Form Fetcher v2
// Fetches last 10 completed results for a team from ESPN schedule endpoint

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { league, teamId } = req.query;
  if (!league || !teamId) return res.status(400).json({ error: 'league and teamId required' });

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`;

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: { 'User-Agent': 'EdgeX/2.0' },
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (!r.ok) return res.status(r.status).json({ error: `ESPN ${r.status}`, form: [], stats: null });

    const data = await r.json();
    const events = data.events || [];

    // Filter to ONLY truly completed games with actual scores
    const completed = events.filter(ev => {
      const comp = ev.competitions?.[0];
      const status = comp?.status?.type;
      // Must be completed AND have scores
      if (!status?.completed) return false;
      const competitors = comp?.competitors || [];
      // Both teams must have numeric scores
      return competitors.every(c => {
        const sc = c.score;
        return sc !== undefined && sc !== null && sc !== '' && !isNaN(parseFloat(sc));
      });
    }).slice(-10); // Last 10 completed with real scores

    const form = completed.map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const team = competitors.find(c => String(c.team?.id) === String(teamId));
      const opp  = competitors.find(c => String(c.team?.id) !== String(teamId));

      if (!team || !opp) return null;

      // Parse scores as floats then floor — ESPN sometimes sends "1.0"
      const teamScore = Math.floor(parseFloat(team.score));
      const oppScore  = Math.floor(parseFloat(opp.score));

      // Validate both are real numbers
      if (isNaN(teamScore) || isNaN(oppScore)) return null;

      const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
      const isHome = team.homeAway === 'home';

      return {
        date: ev.date,
        opponent: opp?.team?.shortDisplayName || opp?.team?.displayName || '?',
        opponentLogo: opp?.team?.logo || '',
        score: `${teamScore}-${oppScore}`,
        result,
        isHome,
        goalsFor: teamScore,
        goalsAgainst: oppScore,
      };
    }).filter(Boolean);

    const stats = computeFormStats(form);
    return res.status(200).json({ form, stats, teamId, league });

  } catch (err) {
    return res.status(500).json({ error: err.message, form: [], stats: null });
  }
}

function computeFormStats(form) {
  if (!form || form.length === 0) return null;

  const wins   = form.filter(g => g.result === 'W').length;
  const draws  = form.filter(g => g.result === 'D').length;
  const losses = form.filter(g => g.result === 'L').length;
  const played = form.length;

  // Goals — ensure all are valid numbers before summing
  const gf = form.reduce((s, g) => s + (isNaN(g.goalsFor) ? 0 : g.goalsFor), 0);
  const ga = form.reduce((s, g) => s + (isNaN(g.goalsAgainst) ? 0 : g.goalsAgainst), 0);

  const cs   = form.filter(g => g.goalsAgainst === 0).length;
  const pts  = wins * 3 + draws;
  const ppg  = played > 0 ? (pts / played).toFixed(1) : '0';
  const gfpg = played > 0 ? (gf / played).toFixed(1) : '0';
  const gapg = played > 0 ? (ga / played).toFixed(1) : '0';

  // Last 5 for dots display
  const form5 = form.slice(-5).map(g => g.result);

  // Home/away breakdown
  const homeGames = form.filter(g => g.isHome);
  const awayGames = form.filter(g => !g.isHome);
  const homeWins  = homeGames.filter(g => g.result === 'W').length;
  const awayWins  = awayGames.filter(g => g.result === 'W').length;
  const homeWR = homeGames.length > 0 ? (homeWins / homeGames.length).toFixed(2) : '0.00';
  const awayWR = awayGames.length > 0 ? (awayWins / awayGames.length).toFixed(2) : '0.00';

  return {
    played, wins, draws, losses,
    gf, ga,
    gfpg, gapg,      // strings like "1.3"
    cs, pts, ppg,
    form5,
    homeWR, awayWR,  // strings like "0.60"
  };
}
