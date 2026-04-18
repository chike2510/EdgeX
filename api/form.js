// api/form.js — EdgeX Team Form Fetcher
// Fetches last 10 completed results for a team from ESPN schedule endpoint
// Called lazily when user taps a match — keeps list load fast

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600'); // 30min cache
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

    if (!r.ok) return res.status(r.status).json({ error: `ESPN ${r.status}`, form: [] });

    const data = await r.json();
    const events = data.events || [];

    // Filter to completed games only, take last 10
    const completed = events
      .filter(ev => {
        const comp = ev.competitions?.[0];
        const status = comp?.status?.type;
        return status?.completed === true || status?.name === 'STATUS_FINAL';
      })
      .slice(-10); // Last 10 completed

    // Extract form data per game
    const form = completed.map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const team = competitors.find(c => String(c.team?.id) === String(teamId));
      const opp  = competitors.find(c => String(c.team?.id) !== String(teamId));

      if (!team) return null;

      const teamScore = parseInt(team.score || 0);
      const oppScore  = parseInt(opp?.score || 0);
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

    // Compute form stats from last 10
    const stats = computeFormStats(form);

    return res.status(200).json({ form, stats, teamId, league });
  } catch (err) {
    return res.status(500).json({ error: err.message, form: [], stats: null });
  }
}

function computeFormStats(form) {
  if (!form.length) return null;
  const last10 = form.slice(-10);
  const wins   = last10.filter(g => g.result === 'W').length;
  const draws  = last10.filter(g => g.result === 'D').length;
  const losses = last10.filter(g => g.result === 'L').length;
  const gf     = last10.reduce((s, g) => s + g.goalsFor, 0);
  const ga     = last10.reduce((s, g) => s + g.goalsAgainst, 0);
  const cs     = last10.filter(g => g.goalsAgainst === 0).length; // clean sheets
  const form5  = last10.slice(-5).map(g => g.result); // last 5 for display dots
  const pts    = wins * 3 + draws;
  const ppg    = (pts / last10.length).toFixed(1);
  const gfpg   = (gf / last10.length).toFixed(1);
  const gapg   = (ga / last10.length).toFixed(1);

  // Home/away split
  const homeGames = last10.filter(g => g.isHome);
  const awayGames = last10.filter(g => !g.isHome);
  const homeWins  = homeGames.filter(g => g.result === 'W').length;
  const awayWins  = awayGames.filter(g => g.result === 'W').length;

  return {
    played: last10.length,
    wins, draws, losses,
    pts, ppg,
    gf, ga, gfpg, gapg,
    cs, form5,
    homeWR: homeGames.length ? (homeWins / homeGames.length).toFixed(2) : '0',
    awayWR: awayGames.length ? (awayWins / awayGames.length).toFixed(2) : '0',
  };
}
