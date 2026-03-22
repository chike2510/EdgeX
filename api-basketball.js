// /api/basketball.js — NBA data endpoint with Net Rating engine

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    const games = generateNBAGames();
    res.json({ success: true, data: games, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const NBA_TEAMS = [
  { name:'Boston Celtics',    abbr:'BOS', wins:54, losses:18, ortg:121.1, drtg:110.3, pace:99.2,  homeAdv:3.2 },
  { name:'Milwaukee Bucks',   abbr:'MIL', wins:46, losses:26, ortg:117.4, drtg:112.8, pace:100.1, homeAdv:2.8 },
  { name:'Cleveland Cavs',    abbr:'CLE', wins:47, losses:25, ortg:115.6, drtg:110.1, pace:96.4,  homeAdv:2.5 },
  { name:'New York Knicks',   abbr:'NYK', wins:44, losses:28, ortg:115.0, drtg:111.4, pace:97.8,  homeAdv:3.5 },
  { name:'Philadelphia 76ers',abbr:'PHI', wins:39, losses:33, ortg:116.1, drtg:114.2, pace:98.3,  homeAdv:2.2 },
  { name:'Indiana Pacers',    abbr:'IND', wins:42, losses:30, ortg:119.2, drtg:117.5, pace:104.6, homeAdv:2.0 },
  { name:'Oklahoma City',     abbr:'OKC', wins:56, losses:16, ortg:119.6, drtg:108.2, pace:100.8, homeAdv:3.0 },
  { name:'Denver Nuggets',    abbr:'DEN', wins:50, losses:22, ortg:118.5, drtg:111.0, pace:98.5,  homeAdv:4.0 },
  { name:'Minnesota Wolves',  abbr:'MIN', wins:51, losses:21, ortg:115.7, drtg:108.4, pace:97.6,  homeAdv:3.1 },
  { name:'Dallas Mavericks',  abbr:'DAL', wins:48, losses:24, ortg:119.1, drtg:112.3, pace:99.4,  homeAdv:2.7 },
  { name:'Phoenix Suns',      abbr:'PHX', wins:42, losses:30, ortg:114.8, drtg:113.6, pace:98.7,  homeAdv:2.5 },
  { name:'Golden State',      abbr:'GSW', wins:40, losses:32, ortg:115.8, drtg:114.2, pace:99.6,  homeAdv:3.3 },
  { name:'Los Angeles Lakers',abbr:'LAL', wins:40, losses:32, ortg:115.3, drtg:114.6, pace:98.9,  homeAdv:2.9 },
  { name:'Sacramento Kings',  abbr:'SAC', wins:42, losses:30, ortg:118.6, drtg:116.1, pace:103.2, homeAdv:2.2 },
];

const KICKOFFS = ['12:00','15:00','17:30','19:30','20:00','20:30','21:00'];

function generateNBAGames() {
  const r = (a, b) => a + Math.random() * (b - a);
  const impliedToDecimal = p => p > 0 ? +(1/p).toFixed(2) : 100;
  const matches = [];
  const used    = new Set();

  while (matches.length < 10) {
    const hi = Math.floor(Math.random() * NBA_TEAMS.length);
    const ai = Math.floor(Math.random() * NBA_TEAMS.length);
    if (hi === ai || used.has(hi) || used.has(ai)) continue;
    used.add(hi); used.add(ai);

    const h = NBA_TEAMS[hi], a = NBA_TEAMS[ai];
    const hNet  = h.ortg - h.drtg + h.homeAdv;
    const aNet  = a.ortg - a.drtg;
    const diff  = hNet - aNet;
    const hWin  = Math.min(92, Math.max(8, Math.round(50 + diff * 2.5)));
    const aWin  = 100 - hWin;

    const avgPace = (h.pace + a.pace) / 2;
    const avgOrtg = (h.ortg + a.drtg + a.ortg + h.drtg) / 4;
    const expTotal = +(avgPace * avgOrtg / 100).toFixed(1);
    const spread   = +(diff * 0.38).toFixed(1);

    const overProb        = Math.min(80, Math.max(20, Math.round(50 + (avgPace - 98.5) * 4)));
    const spreadCoverHome = Math.min(72, Math.max(30, Math.round(52 + diff * 1.5)));
    const spreadCoverAway = 100 - spreadCoverHome;

    const mktWin  = Math.max(5, hWin + Math.round((Math.random()-0.5)*10));
    const edgePct = +(hWin - mktWin).toFixed(1);
    const edgeLabel = Math.abs(edgePct) > 7 ? 'STRONG' : Math.abs(edgePct) > 3 ? 'MEDIUM' : 'WEAK';
    const confidence = Math.min(95, Math.round(50 + Math.abs(diff)*3));

    let bestPick, bestProb, edgeValue;
    if (Math.abs(edgePct) > Math.abs(spreadCoverHome - 50)) {
      bestPick  = edgePct > 0 ? `${h.name} Moneyline` : `${a.name} Moneyline`;
      bestProb  = edgePct > 0 ? hWin : aWin;
      edgeValue = Math.abs(edgePct);
    } else {
      bestPick  = `Over ${expTotal}`;
      bestProb  = overProb;
      edgeValue = Math.abs(overProb - 50);
    }

    const dayIdx = matches.length % 4;
    const reasons = [];
    if (h.wins > a.wins) reasons.push(`${h.name} better record (${h.wins}-${h.losses} vs ${a.wins}-${a.losses})`);
    else reasons.push(`${a.name} stronger record on the season`);
    if (h.ortg > a.ortg) reasons.push(`${h.name} superior offensive rating (${h.ortg} vs ${a.ortg})`);
    if (h.drtg < a.drtg) reasons.push(`${h.name} better defensive rating — limits ${a.name} scoring`);
    reasons.push(`home court advantage worth +${h.homeAdv} pts to ${h.name}`);
    if (avgPace > 100) reasons.push(`fast pace (${avgPace.toFixed(0)}) favors high total`);
    if (Math.abs(spread) > 6) reasons.push(`large spread (${spread>0?'+':''}${spread}) signals clear talent gap`);

    matches.push({
      id: matches.length + 1,
      home: h.name, away: a.name,
      homeAbbr: h.abbr, awayAbbr: a.abbr,
      homeRecord: `${h.wins}-${h.losses}`, awayRecord: `${a.wins}-${a.losses}`,
      homeNet: +hNet.toFixed(1), awayNet: +aNet.toFixed(1),
      homeOrtg: h.ortg, homeDrtg: h.drtg, homePace: h.pace,
      awayOrtg: a.ortg, awayDrtg: a.drtg, awayPace: a.pace,
      homeWin: hWin, awayWin: aWin,
      spread, expTotal, total: expTotal,
      overProb, underProb: 100 - overProb,
      spreadCoverHome, spreadCoverAway,
      q1Total:  +(expTotal * 0.245 + (Math.random()-0.5)*2).toFixed(1),
      q2Total:  +(expTotal * 0.252 + (Math.random()-0.5)*2).toFixed(1),
      q3Total:  +(expTotal * 0.248 + (Math.random()-0.5)*2).toFixed(1),
      q4Total:  +(expTotal * 0.255 + (Math.random()-0.5)*2).toFixed(1),
      q1HomeWin: Math.min(75, Math.max(30, Math.round(50 + diff*2))),
      q2HomeWin: Math.min(72, Math.max(30, Math.round(50 + diff*1.8))),
      q3HomeWin: Math.min(72, Math.max(30, Math.round(50 + diff*1.6))),
      q4HomeWin: Math.min(70, Math.max(30, Math.round(50 + diff*1.4))),
      h1HomeWin: Math.min(74, Math.max(30, Math.round(50 + diff*2.2))),
      h1Over:    Math.min(75, Math.max(28, Math.round(overProb + (Math.random()-0.5)*6))),
      q1Under:   Math.min(68, Math.max(32, 100 - Math.round(overProb*0.9))),
      bestPick, bestProb, edgeValue: +edgeValue.toFixed(1),
      fairOdds: impliedToDecimal(bestProb/100),
      edgeLabel, confidence, reasons,
      kickoff:  KICKOFFS[Math.floor(Math.random() * KICKOFFS.length)],
      dayLabel: ['TODAY','TOMORROW','SAT','SUN'][dayIdx],
    });
  }
  return matches;
}
