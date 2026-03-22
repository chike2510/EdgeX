/* ===== EdgeX — Basketball Page ===== */

const NBA_TEAMS = [
  {name:'Boston Celtics',   abbr:'BOS',conf:'East',wins:54,losses:18,ortg:121.1,drtg:110.3,pace:99.2,homeAdv:3.2},
  {name:'Milwaukee Bucks',  abbr:'MIL',conf:'East',wins:46,losses:26,ortg:117.4,drtg:112.8,pace:100.1,homeAdv:2.8},
  {name:'Cleveland Cavs',   abbr:'CLE',conf:'East',wins:47,losses:25,ortg:115.6,drtg:110.1,pace:96.4,homeAdv:2.5},
  {name:'New York Knicks',  abbr:'NYK',conf:'East',wins:44,losses:28,ortg:115.0,drtg:111.4,pace:97.8,homeAdv:3.5},
  {name:'Philadelphia 76ers',abbr:'PHI',conf:'East',wins:39,losses:33,ortg:116.1,drtg:114.2,pace:98.3,homeAdv:2.2},
  {name:'Indiana Pacers',   abbr:'IND',conf:'East',wins:42,losses:30,ortg:119.2,drtg:117.5,pace:104.6,homeAdv:2.0},
  {name:'Miami Heat',       abbr:'MIA',conf:'East',wins:39,losses:33,ortg:112.8,drtg:111.9,pace:96.8,homeAdv:2.6},
  {name:'Orlando Magic',    abbr:'ORL',conf:'East',wins:44,losses:28,ortg:113.4,drtg:109.2,pace:98.1,homeAdv:2.3},
  {name:'Oklahoma City',    abbr:'OKC',conf:'West',wins:56,losses:16,ortg:119.6,drtg:108.2,pace:100.8,homeAdv:3.0},
  {name:'Denver Nuggets',   abbr:'DEN',conf:'West',wins:50,losses:22,ortg:118.5,drtg:111.0,pace:98.5,homeAdv:4.0},
  {name:'Minnesota Wolves', abbr:'MIN',conf:'West',wins:51,losses:21,ortg:115.7,drtg:108.4,pace:97.6,homeAdv:3.1},
  {name:'LA Clippers',      abbr:'LAC',conf:'West',wins:43,losses:29,ortg:116.0,drtg:111.5,pace:97.9,homeAdv:2.4},
  {name:'Dallas Mavericks', abbr:'DAL',conf:'West',wins:48,losses:24,ortg:119.1,drtg:112.3,pace:99.4,homeAdv:2.7},
  {name:'Phoenix Suns',     abbr:'PHX',conf:'West',wins:42,losses:30,ortg:114.8,drtg:113.6,pace:98.7,homeAdv:2.5},
  {name:'Sacramento Kings', abbr:'SAC',conf:'West',wins:42,losses:30,ortg:118.6,drtg:116.1,pace:103.2,homeAdv:2.2},
  {name:'Golden State',     abbr:'GSW',conf:'West',wins:40,losses:32,ortg:115.8,drtg:114.2,pace:99.6,homeAdv:3.3},
  {name:'Los Angeles Lakers',abbr:'LAL',conf:'West',wins:40,losses:32,ortg:115.3,drtg:114.6,pace:98.9,homeAdv:2.9},
  {name:'New Orleans Pelicans',abbr:'NOP',conf:'West',wins:37,losses:35,ortg:112.4,drtg:113.8,pace:97.4,homeAdv:2.1},
];

const KICKOFFS_BBall = ['12:00','15:00','17:30','19:00','19:30','20:00','20:30','21:00','22:00'];

let BBall_FIXTURES = [];
let BBall_LIVE_ODDS = {};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupBankroll();
  await Promise.all([loadBBallFixtures(), loadBBallOdds()]);
  renderBBallCalendar();
});

function setupBankroll() {
  const inp = document.getElementById('br-input');
  if(inp){ inp.value=getBankroll(); inp.addEventListener('change',e=>setBankroll(e.target.value)); }
}

async function loadBBallFixtures() {
  // Generate client-side directly — no server dependency
  BBall_FIXTURES = enrichBBall(generateBBallFixtures());
}

async function loadBBallOdds() {
  try {
    const res = await fetch('/api/odds?sport=basketball_nba&markets=h2h,spreads,totals');
    const json = await res.json();
    renderOddsAPIBanner('odds-banner', json.mode, json.data?.[0]?.bookmaker);
    if(json.success && json.data) {
      json.data.forEach(g => {
        BBall_FIXTURES.forEach(fix => {
          if(g.home.includes(fix.homeAbbr)||fix.home.includes(g.home.split(' ').pop())) {
            BBall_LIVE_ODDS[fix.id] = g.odds;
          }
        });
      });
    }
  } catch { renderOddsAPIBanner('odds-banner','sim-clean'); }
}

function enrichBBall(raw) {
  return raw.map((m,i) => ({
    ...m,
    dayLabel: ['TODAY','TOMORROW','SAT','SUN'][i%4],
    kickoff: KICKOFFS_BBall[Math.floor(Math.random()*KICKOFFS_BBall.length)],
  }));
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function renderBBallCalendar() {
  const container = document.getElementById('bball-calendar');
  if(!container) return;

  const grouped = {};
  BBall_FIXTURES.forEach(m => {
    if(!grouped[m.dayLabel]) grouped[m.dayLabel]=[];
    grouped[m.dayLabel].push(m);
  });

  container.innerHTML = '';
  Object.entries(grouped).forEach(([day, fixtures]) => {
    const el = document.createElement('div');
    el.className = 'calendar-day';
    el.innerHTML = `
      <div class="cal-day-header">
        <span class="cal-day-label">${day}</span>
        <span class="cal-day-count">${fixtures.length} GAMES</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      ${fixtures.map(m => buildBBallRow(m)).join('')}
    `;
    container.appendChild(el);
  });
}

function buildBBallRow(m) {
  const liveOdds = BBall_LIVE_ODDS[m.id];
  const mktOdds = liveOdds?.h2h || {};
  const mktHomeOdds = mktOdds[m.home] || impliedToDecimal(m.homeWin/100);
  const ev = calcEV(m.homeWin/100, mktHomeOdds).toFixed(2);
  const ec = m.edgeLabel==='STRONG'?'has-edge':m.edgeLabel==='MEDIUM'?'medium-edge':'';

  return `
    <div class="fixture-row ${ec}" onclick="openBBallDetail(${m.id})">
      <div class="fr-time">${m.kickoff}</div>
      <div class="fr-teams">
        <div class="fr-match">${m.home} vs ${m.away}</div>
        <div class="fr-league">NBA · Spread: ${m.spread>0?'+':''}${m.spread} · O/U ${m.total}</div>
      </div>
      <div class="fr-probs">
        <span class="fr-p ${m.homeWin>m.awayWin?'best':''}">${m.homeWin}%</span>
        <span class="fr-p ${m.awayWin>=m.homeWin?'best':''}">${m.awayWin}%</span>
      </div>
      ${m.edgeLabel!=='WEAK'?`<span class="fr-edge ${m.edgeLabel.toLowerCase()}">+${m.edgeValue}%</span>`:''}
      <span class="fr-arrow">›</span>
    </div>
  `;
}

// ── Match Detail ──────────────────────────────────────────────────────────────
function openBBallDetail(id) {
  const m = BBall_FIXTURES.find(x=>x.id===id);
  if(!m) return;

  const liveOdds = BBall_LIVE_ODDS[id] || null;
  const ec = edgeClass(m.edgeLabel);
  const kelly = calcKelly(m.homeWin/100, liveOdds?.h2h?.[m.home] || impliedToDecimal(m.homeWin/100));

  const overlay = document.createElement('div');
  overlay.className = 'match-detail-overlay';
  overlay.innerHTML = `
    <div class="match-detail-panel">
      <div class="mdp-header">
        <div>
          <div style="font-weight:800;font-size:16px;">🏀 ${m.home} vs ${m.away}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:2px;">NBA · ${m.kickoff} · ${m.dayLabel}</div>
        </div>
        <button class="mdp-close" onclick="this.closest('.match-detail-overlay').remove()">✕</button>
      </div>
      <div class="mdp-body">

        <!-- Teams header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <div style="font-weight:800;font-size:18px;">${m.home}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${m.homeRecord} · NET ${m.homeNet>0?'+':''}${m.homeNet}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">SPREAD</div>
            <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--yellow);">${m.spread>0?'+':''}${m.spread}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800;font-size:18px;">${m.away}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${m.awayRecord} · NET ${m.awayNet>0?'+':''}${m.awayNet}</div>
          </div>
        </div>

        <!-- Win probability bars -->
        <div class="prob-section">
          <div class="prob-row">
            <span class="prob-label" style="width:90px">${m.home}</span>
            <div class="prob-bar-wrap"><div class="prob-bar home" data-w="${m.homeWin}" style="width:0%"></div></div>
            <span class="prob-pct">${m.homeWin}%</span>
            ${liveOdds?.h2h?.[m.home]?`<span style="font-family:var(--font-mono);font-size:10px;color:var(--neon2);width:36px;text-align:right;">${liveOdds.h2h[m.home].toFixed(2)}</span>`:'<span style="width:36px"></span>'}
          </div>
          <div class="prob-row">
            <span class="prob-label" style="width:90px">${m.away}</span>
            <div class="prob-bar-wrap"><div class="prob-bar away" data-w="${m.awayWin}" style="width:0%"></div></div>
            <span class="prob-pct">${m.awayWin}%</span>
            ${liveOdds?.h2h?.[m.away]?`<span style="font-family:var(--font-mono);font-size:10px;color:var(--neon2);width:36px;text-align:right;">${liveOdds.h2h[m.away].toFixed(2)}</span>`:'<span style="width:36px"></span>'}
          </div>
        </div>

        <!-- Net Rating visual -->
        <div style="margin:12px 0;">
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">NET RATING COMPARISON</div>
          ${netRatingBar('ORTG', m.homeOrtg, m.awayOrtg, 105, 125)}
          ${netRatingBar('DRTG', m.homeDrtg, m.awayDrtg, 105, 122, true)}
          ${netRatingBar('PACE', m.homePace, m.awayPace, 94, 107)}
        </div>

        <!-- Markets -->
        <div class="section-header" style="margin-top:14px;"><div class="section-title" style="font-size:14px;">Markets</div><div class="section-meta">${liveOdds?'LIVE':'SIM'}</div></div>
        <table class="markets-table">
          <thead><tr><th>MARKET</th><th>MODEL%</th><th>ODDS</th><th>EV</th><th>EDGE</th></tr></thead>
          <tbody>
            ${buildBBallMarkets(m, liveOdds)}
          </tbody>
        </table>

        <!-- Quarter predictions -->
        <div class="section-header" style="margin-top:14px;"><div class="section-title" style="font-size:14px;">Quarter Predictions</div></div>
        <div class="quarter-grid">${buildQuarterGrid(m)}</div>

        <!-- Best edge -->
        <div class="value-box ${ec}" style="margin-top:12px;">
          <div><div class="vb-pick">📌 ${m.bestPick}</div>
          <div class="vb-sub">Model ${m.bestProb}% · Edge +${m.edgeValue}%</div>
          <div class="vb-edge">FAIR ODDS ${m.fairOdds}</div></div>
          <div class="edge-label-big ${ec}">${m.edgeLabel}</div>
        </div>

        <!-- Kelly -->
        <div class="kelly-box">
          <div class="kelly-left"><div class="kelly-title">⚖️ KELLY</div>
          <div class="kelly-pct">${(kelly*100).toFixed(1)}<span class="kelly-unit">% bankroll</span></div></div>
          <div class="kelly-divider"></div>
          <div class="kelly-right"><div class="kelly-stake">$${(kelly*getBankroll()).toFixed(2)}</div><div class="kelly-sublabel">SUGGESTED STAKE</div></div>
        </div>

        <!-- Stats -->
        <div class="stat-chips" style="margin-top:10px;">
          <div class="stat-chip">H ORTG <span>${m.homeOrtg}</span></div>
          <div class="stat-chip">H DRTG <span>${m.homeDrtg}</span></div>
          <div class="stat-chip">A ORTG <span>${m.awayOrtg}</span></div>
          <div class="stat-chip">A DRTG <span>${m.awayDrtg}</span></div>
          <div class="stat-chip">TOTAL <span>O/U ${m.total}</span></div>
          <div class="stat-chip">PACE <span>${((m.homePace+m.awayPace)/2).toFixed(1)}</span></div>
        </div>

        <div class="ai-explain" style="margin-top:12px;">
          <div class="ai-explain-title">⚡ ANALYSIS</div>
          <ul class="ai-explain-list">${m.reasons.map(r=>`<li>${r}</li>`).join('')}</ul>
        </div>

        <button class="log-btn" onclick="logPick('${m.home} vs ${m.away}','${m.bestPick}',${m.edgeValue},${m.confidence},'Basketball');this.closest('.match-detail-overlay').remove();">
          📋 LOG PICK TO JOURNAL
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  setTimeout(() => animateBars(overlay), 60);
}

function netRatingBar(label, homeVal, awayVal, min, max, lowerBetter=false) {
  const hPct = ((homeVal - min) / (max - min) * 100).toFixed(0);
  const aPct = ((awayVal - min) / (max - min) * 100).toFixed(0);
  const hColor = lowerBetter ? (homeVal<awayVal?'var(--neon)':'var(--red)') : (homeVal>awayVal?'var(--neon)':'var(--red)');
  const aColor = lowerBetter ? (awayVal<homeVal?'var(--neon)':'var(--red)') : (awayVal>homeVal?'var(--neon)':'var(--red)');
  return `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
      <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);width:36px;">${label}</span>
      <span style="font-family:var(--font-mono);font-size:9px;color:${hColor};width:38px;text-align:right;">${homeVal}</span>
      <div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden;">
        <div style="height:100%;background:${hColor};border-radius:3px;width:${hPct}%;transition:width 0.8s ease;"></div>
      </div>
      <div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden;">
        <div style="height:100%;background:${aColor};border-radius:3px;width:${aPct}%;transition:width 0.8s ease;float:right;"></div>
      </div>
      <span style="font-family:var(--font-mono);font-size:9px;color:${aColor};width:38px;">${awayVal}</span>
    </div>`;
}

function buildBBallMarkets(m, liveOdds) {
  const mkts = [
    {label:'Moneyline Home',  prob:m.homeWin, odds:liveOdds?.h2h?.[m.home]||impliedToDecimal(m.homeWin/100)},
    {label:'Moneyline Away',  prob:m.awayWin, odds:liveOdds?.h2h?.[m.away]||impliedToDecimal(m.awayWin/100)},
    {label:`Spread ${m.spread>0?'+':''}${m.spread} (Home)`, prob:m.spreadCoverHome, odds:liveOdds?.spreads?.[m.home]||1.91},
    {label:`Spread ${m.spread<0?'+':''}${-m.spread} (Away)`, prob:m.spreadCoverAway, odds:liveOdds?.spreads?.[m.away]||1.91},
    {label:`Over ${m.total}`,   prob:m.overProb,  odds:liveOdds?.totals?.Over||1.91},
    {label:`Under ${m.total}`,  prob:m.underProb, odds:liveOdds?.totals?.Under||1.91},
    {label:'Q1 Home Win',  prob:m.q1HomeWin,  odds:impliedToDecimal(m.q1HomeWin/100)},
    {label:'Q1 Under 55.5',prob:m.q1Under,    odds:impliedToDecimal(m.q1Under/100)},
    {label:'H1 Home Win',  prob:m.h1HomeWin,  odds:impliedToDecimal(m.h1HomeWin/100)},
    {label:`H1 Over ${(m.total*0.52).toFixed(1)}`, prob:m.h1Over, odds:impliedToDecimal(m.h1Over/100)},
  ];

  return mkts.map(mk => {
    const bmOdds = +mk.odds.toFixed(2);
    const bmImpl = decimalToImplied(bmOdds)*100;
    const edgePct = +(mk.prob - bmImpl).toFixed(1);
    const ev = +calcEV(mk.prob/100, bmOdds).toFixed(3);
    const edgeLbl = edgePct>5?'STRONG':edgePct>2?'MEDIUM':'WEAK';
    return `<tr>
      <td class="td-val">${mk.label}</td>
      <td class="td-prob">${mk.prob.toFixed(1)}%</td>
      <td class="td-val">${bmOdds}</td>
      <td class="td-ev ${ev>0?'pos':ev<-0.05?'neg':'mid'}">${ev>0?'+':''}${ev}</td>
      <td class="td-edge ${edgeLbl.toLowerCase()}">${edgePct>0?'+':''}${edgePct}%</td>
    </tr>`;
  }).join('');
}

function buildQuarterGrid(m) {
  const quarters = [
    {q:'Q1', home:m.q1HomeWin, away:100-m.q1HomeWin, pts:m.q1Total},
    {q:'Q2', home:m.q2HomeWin, away:100-m.q2HomeWin, pts:m.q2Total},
    {q:'Q3', home:m.q3HomeWin, away:100-m.q3HomeWin, pts:m.q3Total},
    {q:'Q4', home:m.q4HomeWin, away:100-m.q4HomeWin, pts:m.q4Total},
  ];
  return quarters.map(q=>`
    <div class="quarter-cell">
      <div class="qc-label">${q.q}</div>
      <div class="qc-val">${q.pts.toFixed(1)} pts</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:3px;">H ${q.home.toFixed(0)}% · A ${q.away.toFixed(0)}%</div>
    </div>`).join('');
}

// ── Data Generation ───────────────────────────────────────────────────────────
function generateBBallFixtures() {
  const matches=[]; const used=new Set();

  while(matches.length < 10) {
    const hi=Math.floor(Math.random()*NBA_TEAMS.length), ai=Math.floor(Math.random()*NBA_TEAMS.length);
    if(hi===ai||used.has(hi)||used.has(ai)) continue;
    used.add(hi);used.add(ai);
    const h=NBA_TEAMS[hi], a=NBA_TEAMS[ai];

    // Net rating based win probability
    const hNet = h.ortg - h.drtg + h.homeAdv;
    const aNet = a.ortg - a.drtg;
    const netDiff = hNet - aNet;
    // ~2.5% per net rating point, centered at 50%
    const hWin = Math.min(92, Math.max(8, Math.round(50 + netDiff * 2.5)));
    const aWin = 100 - hWin;

    // Expected total points
    const avgPace = (h.pace + a.pace) / 2;
    const avgOrtg  = (h.ortg + a.drtg + a.ortg + h.drtg) / 4;
    const expTotal = +(avgPace * avgOrtg / 100).toFixed(1);

    // Spread: net rating diff * 0.4
    const spread = +(netDiff * 0.38).toFixed(1);

    // Over probability: if pace > 100, skew over
    const overProb = Math.min(80, Math.max(20, Math.round(50 + (avgPace - 98.5) * 4)));
    const underProb = 100 - overProb;

    // Spread cover probabilities
    const spreadCoverHome = Math.min(72, Math.max(30, Math.round(52 + netDiff * 1.5)));
    const spreadCoverAway = 100 - spreadCoverHome;

    // Quarter / H1 estimates
    const q1Total = +(expTotal * 0.245 + (Math.random()-0.5)*2).toFixed(1);
    const q2Total = +(expTotal * 0.252 + (Math.random()-0.5)*2).toFixed(1);
    const q3Total = +(expTotal * 0.248 + (Math.random()-0.5)*2).toFixed(1);
    const q4Total = +(expTotal * 0.255 + (Math.random()-0.5)*2).toFixed(1);
    const q1HomeWin = Math.min(75,Math.max(30,Math.round(50+netDiff*2)));
    const q2HomeWin = Math.min(72,Math.max(30,Math.round(50+netDiff*1.8)));
    const q3HomeWin = Math.min(72,Math.max(30,Math.round(50+netDiff*1.6)));
    const q4HomeWin = Math.min(70,Math.max(30,Math.round(50+netDiff*1.4)));
    const h1HomeWin = Math.min(74,Math.max(30,Math.round(50+netDiff*2.2)));
    const h1Over    = Math.min(75,Math.max(28,Math.round(overProb + (Math.random()-0.5)*6)));
    const q1Under   = Math.min(68,Math.max(32,100-Math.round(overProb*0.9)));

    // Market noise for edge detection
    const mktWin = Math.max(5, hWin + Math.round((Math.random()-0.5)*10));
    const edgePct = +(hWin - mktWin).toFixed(1);
    const edgeLabel = Math.abs(edgePct) > 7 ? 'STRONG' : Math.abs(edgePct) > 3 ? 'MEDIUM' : 'WEAK';
    const confidence = Math.min(95, Math.round(50 + Math.abs(netDiff)*3));

    // Best pick
    let bestPick, bestProb, edgeValue;
    if (Math.abs(edgePct) > Math.abs(spreadCoverHome-50)) {
      bestPick  = edgePct > 0 ? `${h.name} Moneyline` : `${a.name} Moneyline`;
      bestProb  = edgePct > 0 ? hWin : aWin;
      edgeValue = Math.abs(edgePct);
    } else {
      bestPick  = `Over ${expTotal}`;
      bestProb  = overProb;
      edgeValue = Math.abs(overProb - 50);
    }
    const fairOdds = impliedToDecimal(bestProb/100).toFixed(2);

    const reasons=[];
    if(h.wins > a.wins) reasons.push(`${h.name} better record (${h.wins}-${h.losses} vs ${a.wins}-${a.losses})`);
    else reasons.push(`${a.name} stronger record on the season`);
    if(h.ortg > a.ortg) reasons.push(`${h.name} superior offensive rating (${h.ortg} vs ${a.ortg})`);
    if(h.drtg < a.drtg) reasons.push(`${h.name} better defensive rating — ${a.name} limited offensively`);
    reasons.push(`home court advantage worth +${h.homeAdv} pts to ${h.name}`);
    if(avgPace > 100) reasons.push(`fast pace (${avgPace.toFixed(0)}) favors high total — Over play`);
    if(Math.abs(spread) > 6) reasons.push(`large spread (${spread>0?'+':''}${spread}) signals clear talent gap`);

    matches.push({
      id: matches.length+1,
      home: h.name, away: a.name,
      homeAbbr: h.abbr, awayAbbr: a.abbr,
      homeRecord: `${h.wins}-${h.losses}`, awayRecord:`${a.wins}-${a.losses}`,
      homeNet: +hNet.toFixed(1), awayNet: +aNet.toFixed(1),
      homeOrtg: h.ortg, homeDrtg: h.drtg, homePace: h.pace,
      awayOrtg: a.ortg, awayDrtg: a.drtg, awayPace: a.pace,
      homeWin: hWin, awayWin: aWin,
      spread, expTotal, overProb, underProb,
      spreadCoverHome, spreadCoverAway,
      total: expTotal,
      q1Total,q2Total,q3Total,q4Total,
      q1HomeWin,q2HomeWin,q3HomeWin,q4HomeWin,
      h1HomeWin, h1Over, q1Under,
      bestPick, bestProb, edgeValue: +edgeValue.toFixed(1), fairOdds,
      edgeLabel, confidence, reasons,
      timestamp: new Date().toISOString(),
    });
  }
  return matches;
}

// ── Override to use AllSportsAPI ──────────────────────────────────────────────
const _origLoadBBall = loadBBallFixtures;

window.loadBBallFixtures = async function() {
  try {
    const apiData = await initBasketballFromAPI();
    if (apiData && apiData.length > 0) {
      BBall_FIXTURES = enrichBBall(apiData.map((g, i) => {
        const sim = generateBBallFixtures().find(s =>
          s.home.toLowerCase().includes(g.home.split(' ').pop().toLowerCase()) ||
          g.home.toLowerCase().includes(s.home.split(' ').pop().toLowerCase())
        ) || generateBBallFixtures()[i % 10];

        return {
          ...sim,
          id:        i + 1,
          apiId:     g.id,
          home:      g.home,
          away:      g.away,
          homeLogo:  g.homeLogo,
          awayLogo:  g.awayLogo,
          league:    g.league,
          kickoff:   g.kickoff || sim.kickoff,
          dayLabel:  g.dayLabel || sim.dayLabel,
          status:    g.status,
          homeWin:   g.isLive ? Math.round(50+(g.score.home-g.score.away)*4) : sim.homeWin,
          awayWin:   g.isLive ? Math.round(50-(g.score.home-g.score.away)*4) : sim.awayWin,
          score:     g.score,
          quarters:  g.quarters,
          isRealData: true,
          isLive:    g.isLive,
        };
      }));

      // Update banner
      const banner = document.getElementById('odds-banner');
      if (banner) {
        const liveCount = apiData.filter(g=>g.isLive).length;
        banner.style.display = '';
        banner.className = liveCount > 0 ? 'odds-api-banner live' : 'odds-api-banner sim';
        banner.innerHTML = liveCount > 0
          ? \`<div class="oab-dot live"></div><div class="oab-text">LIVE SCORES — <strong>AllSportsAPI</strong> · \${liveCount} games LIVE</div>\`
          : \`<div class="oab-dot sim"></div><div class="oab-text">FIXTURES — <strong>AllSportsAPI</strong> · \${apiData.length} upcoming games</div>\`;
      }
      return;
    }
  } catch(e) {
    console.warn('Basketball API:', e);
  }
  // Fallback
  BBall_FIXTURES = enrichBBall(generateBBallFixtures());
};
