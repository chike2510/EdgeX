// api/form.js — EdgeX Team Form Fetcher v3
// Fixed: correct ESPN soccer schedule endpoint + proper score parsing

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { league, teamId, debug } = req.query;
  if (!league || !teamId) return res.status(400).json({ error: 'league and teamId required' });

  // ESPN soccer schedule endpoint — note: uses full sport path
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`;

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(url, {
      headers: { 'User-Agent': 'EdgeX/2.0' },
      signal: ctrl.signal,
    });
    clearTimeout(tid);

    if (!r.ok) {
      return res.status(200).json({ 
        form: [], stats: null, teamId, league,
        _debug: { espnStatus: r.status, url }
      });
    }

    const data = await r.json();

    // ESPN soccer schedule can nest events differently — check all paths
    const events = data.events 
      || data.schedule?.map(w => w.events).flat() 
      || [];

    if (debug === '1') {
      // Return raw structure for debugging
      const sample = events.slice(0, 2).map(ev => ({
        name: ev.name,
        date: ev.date,
        compKeys: Object.keys(ev.competitions?.[0] || {}),
        statusType: ev.competitions?.[0]?.status?.type,
        competitors: ev.competitions?.[0]?.competitors?.map(c => ({
          teamId: c.team?.id,
          teamName: c.team?.displayName,
          score: c.score,
          homeAway: c.homeAway,
        }))
      }));
      return res.status(200).json({ 
        totalEvents: events.length,
        url,
        topLevelKeys: Object.keys(data),
        sampleEvents: sample,
      });
    }

    // Filter to completed games with valid scores
    const completed = events.filter(ev => {
      const comp = ev.competitions?.[0];
      const status = comp?.status?.type;
      if (!status?.completed) return false;
      const competitors = comp?.competitors || [];
      if (competitors.length < 2) return false;
      return competitors.every(c => {
        const sc = String(c.score ?? '');
        return sc !== '' && !isNaN(parseFloat(sc));
      });
    }).slice(-10);

    const form = completed.map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const team = competitors.find(c => String(c.team?.id) === String(teamId));
      const opp  = competitors.find(c => String(c.team?.id) !== String(teamId));
      if (!team || !opp) return null;

      const teamScore = Math.floor(parseFloat(team.score));
      const oppScore  = Math.floor(parseFloat(opp.score));
      if (isNaN(teamScore) || isNaN(oppScore)) return null;

      const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
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
    }).filter(Boolean);

    return res.status(200).json({ 
      form, 
      stats: computeFormStats(form), 
      teamId, league,
      _debug: { totalEvents: events.length, completedWithScores: completed.length }
    });

  } catch (err) {
    return res.status(200).json({ error: err.message, form: [], stats: null });
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
