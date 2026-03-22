// /api/football.js — Football data endpoint with Poisson xG engine
// Runs server-side on Vercel; client falls back to local engine if this fails

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const fixtures = generateFootballFixtures();
    res.json({ success: true, data: fixtures, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── Poisson helper ────────────────────────────────────────────────────────────
function poisson(lambda, k) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// ── Teams database ────────────────────────────────────────────────────────────
const TEAMS = [
  // ── EPL ──────────────────────────────────────────────────────────────────
  { name:'Man City',      league:'EPL', attack:91, defense:87, form:[3,3,1,3,3], homeAdv:1.18, ppg:2.2 },
  { name:'Arsenal',       league:'EPL', attack:88, defense:85, form:[3,3,3,1,3], homeAdv:1.15, ppg:2.1 },
  { name:'Liverpool',     league:'EPL', attack:90, defense:82, form:[3,1,3,3,1], homeAdv:1.20, ppg:2.0 },
  { name:'Man Utd',       league:'EPL', attack:74, defense:70, form:[0,1,3,0,1], homeAdv:1.10, ppg:1.2 },
  { name:'Chelsea',       league:'EPL', attack:81, defense:78, form:[1,0,3,1,3], homeAdv:1.10, ppg:1.5 },
  { name:'Tottenham',     league:'EPL', attack:79, defense:74, form:[3,1,1,0,3], homeAdv:1.08, ppg:1.4 },
  { name:'Newcastle',     league:'EPL', attack:77, defense:80, form:[3,3,1,0,1], homeAdv:1.12, ppg:1.5 },
  { name:'Aston Villa',   league:'EPL', attack:80, defense:76, form:[3,3,1,3,0], homeAdv:1.09, ppg:1.6 },
  { name:'Brighton',      league:'EPL', attack:75, defense:72, form:[1,1,3,1,3], homeAdv:1.06, ppg:1.4 },
  { name:'West Ham',      league:'EPL', attack:70, defense:68, form:[0,1,3,1,0], homeAdv:1.05, ppg:1.1 },
  { name:'Fulham',        league:'EPL', attack:72, defense:73, form:[1,3,0,1,1], homeAdv:1.04, ppg:1.2 },
  { name:'Wolves',        league:'EPL', attack:68, defense:71, form:[0,0,1,3,1], homeAdv:1.04, ppg:1.0 },
  { name:'Everton',       league:'EPL', attack:65, defense:69, form:[1,0,0,1,3], homeAdv:1.05, ppg:0.9 },
  { name:'Brentford',     league:'EPL', attack:72, defense:70, form:[3,0,1,3,1], homeAdv:1.04, ppg:1.2 },
  { name:'Crystal Palace',league:'EPL', attack:69, defense:72, form:[3,1,0,1,0], homeAdv:1.06, ppg:1.1 },
  { name:'Leicester',     league:'EPL', attack:67, defense:66, form:[1,0,1,0,3], homeAdv:1.04, ppg:1.0 },
  // ── LA LIGA ───────────────────────────────────────────────────────────────
  { name:'Real Madrid',   league:'LA LIGA',    attack:94, defense:88, form:[3,3,3,1,3], homeAdv:1.22, ppg:2.5 },
  { name:'Barcelona',     league:'LA LIGA',    attack:92, defense:84, form:[3,3,1,3,3], homeAdv:1.20, ppg:2.3 },
  { name:'Atletico',      league:'LA LIGA',    attack:79, defense:88, form:[3,1,3,3,0], homeAdv:1.15, ppg:1.6 },
  { name:'Real Sociedad', league:'LA LIGA',    attack:76, defense:75, form:[1,3,1,3,1], homeAdv:1.10, ppg:1.5 },
  { name:'Villarreal',    league:'LA LIGA',    attack:75, defense:74, form:[3,1,0,3,1], homeAdv:1.08, ppg:1.4 },
  { name:'Athletic Bilbao',league:'LA LIGA',   attack:74, defense:76, form:[3,3,1,0,3], homeAdv:1.12, ppg:1.5 },
  // ── BUNDESLIGA ────────────────────────────────────────────────────────────
  { name:'Bayern',        league:'BUNDESLIGA', attack:93, defense:86, form:[3,3,3,3,1], homeAdv:1.21, ppg:2.8 },
  { name:'Dortmund',      league:'BUNDESLIGA', attack:83, defense:75, form:[1,3,3,1,3], homeAdv:1.14, ppg:1.9 },
  { name:'Bayer Leverkusen',league:'BUNDESLIGA',attack:86,defense:80,form:[3,3,3,1,3],  homeAdv:1.16, ppg:2.1 },
  { name:'RB Leipzig',    league:'BUNDESLIGA', attack:81, defense:78, form:[3,1,3,3,1], homeAdv:1.12, ppg:1.8 },
  // ── SERIE A ───────────────────────────────────────────────────────────────
  { name:'Inter',         league:'SERIE A',   attack:85, defense:86, form:[3,1,3,3,1], homeAdv:1.16, ppg:2.0 },
  { name:'AC Milan',      league:'SERIE A',   attack:82, defense:80, form:[3,3,0,1,3], homeAdv:1.14, ppg:1.8 },
  { name:'Juventus',      league:'SERIE A',   attack:78, defense:82, form:[1,1,3,3,3], homeAdv:1.10, ppg:1.5 },
  { name:'Napoli',        league:'SERIE A',   attack:80, defense:78, form:[3,3,1,3,0], homeAdv:1.13, ppg:1.7 },
  { name:'Roma',          league:'SERIE A',   attack:77, defense:74, form:[1,3,3,0,1], homeAdv:1.09, ppg:1.5 },
  // ── UCL / EUROPE ─────────────────────────────────────────────────────────
  { name:'PSG',           league:'UCL',       attack:89, defense:83, form:[3,3,1,3,3], homeAdv:1.18, ppg:2.4 },
  { name:'Porto',         league:'UCL',       attack:76, defense:79, form:[3,3,1,1,3], homeAdv:1.12, ppg:1.6 },
  { name:'Ajax',          league:'UCL',       attack:80, defense:74, form:[3,3,1,3,0], homeAdv:1.14, ppg:1.8 },
  { name:'Benfica',       league:'UCL',       attack:79, defense:77, form:[3,1,3,3,1], homeAdv:1.13, ppg:1.7 },
  { name:'Celtic',        league:'UCL',       attack:74, defense:70, form:[3,3,3,1,3], homeAdv:1.15, ppg:1.8 },
  { name:'Rangers',       league:'UCL',       attack:70, defense:68, form:[1,3,1,3,0], homeAdv:1.11, ppg:1.5 },
];

const KICKOFFS = ['12:30','15:00','17:30','19:45','20:00','20:45'];
const DAYS     = ['TODAY','TOMORROW','SAT','SUN'];

function generateFootballFixtures() {
  const r = () => (Math.random() - 0.5) * 0.08;
  const ff = form => form.slice(-3).reduce((a,b)=>a+b,0)/9;
  const matches = [];
  const used    = new Set();

  while (matches.length < 12) {
    const hi = Math.floor(Math.random() * TEAMS.length);
    const ai = Math.floor(Math.random() * TEAMS.length);
    if (hi === ai || used.has(hi) || used.has(ai)) continue;
    used.add(hi); used.add(ai);

    const h = TEAMS[hi], a = TEAMS[ai];
    const hf = ff(h.form), af = ff(a.form);
    const hxG = (h.attack/100) * (1 - a.defense/150) * (0.6 + hf*0.8) * h.homeAdv;
    const axG = (a.attack/100) * (1 - h.defense/150) * (0.6 + af*0.8);

    let hW = 0, dr = 0, aW = 0;
    for (let hg=0; hg<=5; hg++) for (let ag=0; ag<=5; ag++) {
      const p = poisson(hxG, hg) * poisson(axG, ag);
      if (hg>ag) hW+=p; else if (hg===ag) dr+=p; else aW+=p;
    }
    const tot = hW+dr+aW; hW/=tot; dr/=tot; aW/=tot;
    const btts = (1-poisson(hxG,0)) * (1-poisson(axG,0));
    let o25 = 0;
    for (let hg=0; hg<=5; hg++) for (let ag=0; ag<=5; ag++) if(hg+ag>2) o25+=poisson(hxG,hg)*poisson(axG,ag);

    const mH = Math.max(0.05, hW+r()), mD = Math.max(0.05, dr+r()), mA = Math.max(0.05, aW+r());
    const vals = [
      { label:`${h.name} Win`, edge: hW-mH, prob: hW },
      { label:'Draw',          edge: dr-mD, prob: dr },
      { label:`${a.name} Win`, edge: aW-mA, prob: aW },
    ];
    vals.sort((x,y) => y.edge - x.edge);
    const best = vals[0];
    const conf = Math.min(99, Math.round(55 + Math.abs(hxG-axG)*18 + (hf+af)*12));
    const edgeLabel = best.edge > 0.08 ? 'STRONG' : best.edge > 0.03 ? 'MEDIUM' : 'WEAK';

    const reasons = [];
    if (h.attack > 85) reasons.push(`${h.name} elite attack rating (${h.attack})`);
    if (a.defense < 76) reasons.push(`${a.name} defensive vulnerability (${a.defense} DEF)`);
    reasons.push(hf>af ? `${h.name} superior recent form` : `${a.name} in stronger form streak`);
    if (h.homeAdv > 1.15) reasons.push('pronounced home advantage factored in');
    reasons.push(best.edge > 0.05
      ? `market underpricing ${best.label} by ${(best.edge*100).toFixed(1)}%`
      : 'market tightly aligned — thin edge only');

    const dayIdx = matches.length % DAYS.length;
    matches.push({
      id:          matches.length + 1,
      home:        h.name, away: a.name,
      league:      h.league || a.league || 'EPL',
      homeAttack:  h.attack,  awayAttack:  a.attack,
      homeDefense: h.defense, awayDefense: a.defense,
      hxG: +hxG.toFixed(2), axG: +axG.toFixed(2),
      hWin: +(hW*100).toFixed(1), draw: +(dr*100).toFixed(1), aWin: +(aW*100).toFixed(1),
      btts: +(btts*100).toFixed(1), over25: +(o25*100).toFixed(1),
      hxPts: +(hW*3+dr).toFixed(2), axPts: +(aW*3+dr).toFixed(2),
      mktHome: +(mH*100).toFixed(1), mktDraw: +(mD*100).toFixed(1), mktAway: +(mA*100).toFixed(1),
      bestValue: { ...best, edge: +(best.edge*100).toFixed(1), prob: +(best.prob*100).toFixed(1) },
      confidence: conf, edgeLabel, explanation: reasons,
      hFormStr: h.form.slice(-5).join('-'), aFormStr: a.form.slice(-5).join('-'),
      kickoff:  KICKOFFS[Math.floor(Math.random() * KICKOFFS.length)],
      dayLabel: DAYS[dayIdx],
    });
  }
  return matches;
}
