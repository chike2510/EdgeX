/* ===== EdgeX — Football Page ===== */

const LEAGUES_CONFIG = [
  { key:'football_epl',    label:'EPL',       flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key:'football_ucl',   label:'UCL',       flag:'🌟' },
  { key:'football_laliga',label:'LA LIGA',   flag:'🇪🇸' },
  { key:'football_bund',  label:'BUNDESLIGA',flag:'🇩🇪' },
  { key:'football_seriea',label:'SERIE A',   flag:'🇮🇹' },
];

const TEAMS_DB = [
  {name:'Man City',   league:'EPL',      attack:91,defense:87,form:[3,3,1,3,3],homeAdv:1.18,ppg90:2.2,concede:0.9},
  {name:'Arsenal',    league:'EPL',      attack:88,defense:85,form:[3,3,3,1,3],homeAdv:1.15,ppg90:2.1,concede:1.0},
  {name:'Liverpool',  league:'EPL',      attack:90,defense:82,form:[3,1,3,3,1],homeAdv:1.20,ppg90:2.0,concede:1.1},
  {name:'Chelsea',    league:'EPL',      attack:81,defense:78,form:[1,0,3,1,3],homeAdv:1.10,ppg90:1.5,concede:1.4},
  {name:'Tottenham',  league:'EPL',      attack:79,defense:74,form:[3,1,1,0,3],homeAdv:1.08,ppg90:1.4,concede:1.5},
  {name:'Newcastle',  league:'EPL',      attack:77,defense:80,form:[3,3,1,0,1],homeAdv:1.12,ppg90:1.5,concede:1.1},
  {name:'Aston Villa',league:'EPL',      attack:80,defense:76,form:[3,3,1,3,0],homeAdv:1.09,ppg90:1.6,concede:1.3},
  {name:'Brighton',   league:'EPL',      attack:75,defense:72,form:[1,1,3,1,3],homeAdv:1.06,ppg90:1.4,concede:1.4},
  {name:'West Ham',   league:'EPL',      attack:70,defense:68,form:[0,1,3,1,0],homeAdv:1.05,ppg90:1.1,concede:1.7},
  {name:'Brentford',  league:'EPL',      attack:72,defense:70,form:[3,0,1,3,1],homeAdv:1.04,ppg90:1.2,concede:1.6},
  {name:'Real Madrid',league:'LA LIGA',  attack:94,defense:88,form:[3,3,3,1,3],homeAdv:1.22,ppg90:2.5,concede:0.7},
  {name:'Barcelona',  league:'LA LIGA',  attack:92,defense:84,form:[3,3,1,3,3],homeAdv:1.20,ppg90:2.3,concede:0.9},
  {name:'Atletico',   league:'LA LIGA',  attack:79,defense:88,form:[3,1,3,3,0],homeAdv:1.15,ppg90:1.6,concede:0.8},
  {name:'Bayern',     league:'BUNDESLIGA',attack:93,defense:86,form:[3,3,3,3,1],homeAdv:1.21,ppg90:2.8,concede:1.1},
  {name:'Dortmund',   league:'BUNDESLIGA',attack:83,defense:75,form:[1,3,3,1,3],homeAdv:1.14,ppg90:1.9,concede:1.4},
  {name:'PSG',        league:'UCL',      attack:89,defense:83,form:[3,3,1,3,3],homeAdv:1.18,ppg90:2.4,concede:0.9},
  {name:'Inter',      league:'SERIE A',  attack:85,defense:86,form:[3,1,3,3,1],homeAdv:1.16,ppg90:2.0,concede:0.8},
  {name:'AC Milan',   league:'SERIE A',  attack:82,defense:80,form:[3,3,0,1,3],homeAdv:1.14,ppg90:1.8,concede:1.1},
  {name:'Juventus',   league:'SERIE A',  attack:78,defense:82,form:[1,1,3,3,3],homeAdv:1.10,ppg90:1.5,concede:0.9},
  {name:'Porto',      league:'UCL',      attack:76,defense:79,form:[3,3,1,1,3],homeAdv:1.12,ppg90:1.6,concede:1.0},
];

const ALL_MARKETS = [
  {id:'1x2',       label:'Full-Time Result',    group:'Main'},
  {id:'dc',        label:'Double Chance',       group:'Main'},
  {id:'dnb',       label:'Draw No Bet',         group:'Main'},
  {id:'btts',      label:'Both Teams to Score', group:'Goals'},
  {id:'o15',       label:'Over 1.5 Goals',      group:'Goals'},
  {id:'o25',       label:'Over 2.5 Goals',      group:'Goals'},
  {id:'o35',       label:'Over 3.5 Goals',      group:'Goals'},
  {id:'u25',       label:'Under 2.5 Goals',     group:'Goals'},
  {id:'btts_o25',  label:'BTTS + Over 2.5',     group:'Goals'},
  {id:'draw_o25',  label:'Draw or Over 2.5',    group:'Combo'},
  {id:'home_o25',  label:'Home or Over 2.5',    group:'Combo'},
  {id:'away_o25',  label:'Away or Over 2.5',    group:'Combo'},
  {id:'home_gg',   label:'Home or GG',          group:'Combo'},
  {id:'away_gg',   label:'Away or GG',          group:'Combo'},
  {id:'dc_o15',    label:'Double Chance + O1.5',group:'Combo'},
  {id:'2h_o05',    label:'2nd Half Over 0.5',   group:'Halves'},
  {id:'h1_home',   label:'HT Home Win',         group:'Halves'},
  {id:'h1_draw',   label:'HT Draw',             group:'Halves'},
  {id:'h1_away',   label:'HT Away Win',         group:'Halves'},
  {id:'bhu15',     label:'Both Halves Under 1.5',group:'Halves'},
  {id:'1up_home',  label:'Home 1UP (lead by 1)', group:'1UP'},
  {id:'1up_away',  label:'Away 1UP (lead by 1)', group:'1UP'},
  {id:'corners_o', label:'Corners Over 9.5',    group:'Corners'},
];

const KICKOFFS = ['12:30','15:00','17:30','19:45','20:00','20:45','21:00'];
const DATES = [
  {label:'TODAY', offset:0},
  {label:'TOMORROW', offset:1},
  {label:'SAT', offset:2},
  {label:'SUN', offset:3},
];

let ALL_FIXTURES = [];
let LIVE_ODDS_MAP = {}; // gameId -> odds data
let ACCA = [];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Fixtures generate instantly client-side
  ALL_FIXTURES = enrichFixtures(generateFixtures());
  // renderCalendar only if on fixtures tab
  if(document.getElementById('panel-fixtures') && document.getElementById('panel-fixtures').style.display !== 'none') {
    renderCalendar();
  }
  // odds banner hidden — no user-facing API messages
  const banner = document.getElementById('odds-banner');
  if(banner) banner.style.display = 'none';
});

// ── Setup ─────────────────────────────────────────────────────────────────────
function setupBankroll() {
  const inp = document.getElementById('br-input');
  if (inp) { inp.value = getBankroll(); inp.addEventListener('change', e => setBankroll(e.target.value)); }
}

// ── Load fixtures (model data) ─────────────────────────────────────────────────
async function loadFixtures() {
  // Generate fixtures client-side directly — no server dependency
  ALL_FIXTURES = enrichFixtures(generateFixtures());
}

function enrichFixtures(raw) {
  return raw.map((m, i) => {
    const dayIdx = i % DATES.length;
    const date = new Date(); date.setDate(date.getDate() + DATES[dayIdx].offset);
    return { ...m, dayLabel: DATES[dayIdx].label, dateObj: date };
  });
}

// ── Load odds from Odds API ───────────────────────────────────────────────────
async function loadOdds() {
  try {
    const res = await fetch('/api/odds?sport=football_epl&markets=h2h,spreads,totals');
    const json = await res.json();
    renderOddsAPIBanner('odds-banner', json.mode, json.data?.[0]?.bookmaker);
    if (json.success && json.data) {
      json.data.forEach(g => {
        // Match by team name similarity
        ALL_FIXTURES.forEach(fix => {
          if (g.home.includes(fix.home.split(' ')[0]) || fix.home.includes(g.home.split(' ')[0])) {
            LIVE_ODDS_MAP[fix.id] = g.odds;
          }
        });
      });
    }
  } catch {
    renderOddsAPIBanner("odds-banner","sim-clean");
  }
}

// ── Render Calendar ───────────────────────────────────────────────────────────
window.renderCalendar = function renderCalendar() {
  const container = document.getElementById('fixture-calendar');
  if (!container) return;

  const grouped = {};
  ALL_FIXTURES.forEach(m => {
    if (!grouped[m.dayLabel]) grouped[m.dayLabel] = [];
    grouped[m.dayLabel].push(m);
  });

  container.innerHTML = '';
  Object.entries(grouped).forEach(([day, fixtures]) => {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.innerHTML = `
      <div class="cal-day-header">
        <span class="cal-day-label">${day}</span>
        <span class="cal-day-count">${fixtures.length} MATCHES</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      ${fixtures.map(m => buildFixtureRow(m)).join('')}
    `;
    container.appendChild(dayEl);
  });
}

function buildFixtureRow(m) {
  const ec = m.edgeLabel === 'STRONG' ? 'has-edge' : m.edgeLabel === 'MEDIUM' ? 'medium-edge' : '';
  const edgeTxt = m.edgeLabel === 'STRONG' ? `<span class="fr-edge strong">+${m.bestValue.edge}%</span>` :
                  m.edgeLabel === 'MEDIUM' ? `<span class="fr-edge medium">+${m.bestValue.edge}%</span>` : '';

  return `
    <div class="fixture-row ${ec}" onclick="openMatchDetail(${m.id})">
      <div class="fr-time">${m.kickoff}</div>
      <div class="fr-teams">
        <div class="fr-match">${m.home} vs ${m.away}</div>
        <div class="fr-league">${m.league}</div>
      </div>
      <div class="fr-probs">
        <span class="fr-p ${m.hWin>m.draw&&m.hWin>m.aWin?'best':''}">${m.hWin}%</span>
        <span class="fr-p ${m.draw>m.hWin&&m.draw>m.aWin?'best':''}">${m.draw}%</span>
        <span class="fr-p ${m.aWin>m.hWin&&m.aWin>m.draw?'best':''}">${m.aWin}%</span>
      </div>
      ${edgeTxt}
      <span class="fr-arrow">›</span>
    </div>
  `;
}

// ── Match Detail Modal ────────────────────────────────────────────────────────
function openMatchDetail(id) {
  const m = ALL_FIXTURES.find(x => x.id === id);
  if (!m) return;

  const liveOdds = LIVE_ODDS_MAP[id] || null;
  const markets = computeAllMarkets(m, liveOdds);
  const matrix  = buildScoreMatrix(m);
  const kelly   = calcKelly(m.bestValue.prob/100, liveOdds?.h2h ? Math.min(...Object.values(liveOdds.h2h)) : impliedToDecimal(m.bestValue.prob/100));
  const ec      = edgeClass(m.edgeLabel);

  const overlay = document.createElement('div');
  overlay.className = 'match-detail-overlay';
  overlay.innerHTML = `
    <div class="match-detail-panel">
      <div class="mdp-header">
        <div>
          <div style="font-weight:800;font-size:16px;">${m.home} vs ${m.away}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:2px;">${m.league} · ${m.kickoff} · ${m.dayLabel}</div>
        </div>
        <button class="mdp-close" onclick="this.closest('.match-detail-overlay').remove()">✕</button>
      </div>
      <div class="mdp-body">

        <!-- Probabilities -->
        <div class="section-header" style="margin-top:0"><div class="section-title" style="font-size:14px;">Win Probabilities</div></div>
        <div class="prob-section">
          ${probRowDetail('HOME '+m.home, m.hWin, 'home', m.mktHome, liveOdds?.h2h?.[m.home])}
          ${probRowDetail('DRAW', m.draw, 'draw', m.mktDraw, liveOdds?.h2h?.['Draw'])}
          ${probRowDetail('AWAY '+m.away, m.aWin, 'away', m.mktAway, liveOdds?.h2h?.[m.away])}
        </div>

        <!-- xG + xPTS -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;">
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:var(--neon);">${m.hxG}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">xG HOME</div>
          </div>
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:var(--neon2);">${m.axG}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">xG AWAY</div>
          </div>
        </div>

        <!-- Best value pick -->
        <div class="value-box ${ec}">
          <div><div class="vb-pick">📌 ${m.bestValue.label}</div>
          <div class="vb-sub">Model ${m.bestValue.prob}% · Market ${(m.bestValue.prob-m.bestValue.edge).toFixed(1)}%</div>
          <div class="vb-edge">EDGE +${m.bestValue.edge}%</div></div>
          <div class="edge-label-big ${ec}">${m.edgeLabel}</div>
        </div>

        <!-- Kelly -->
        <div class="kelly-box">
          <div class="kelly-left"><div class="kelly-title">⚖️ KELLY CRITERION</div>
          <div class="kelly-pct">${(kelly*100).toFixed(1)}<span class="kelly-unit">% bankroll</span></div></div>
          <div class="kelly-divider"></div>
          <div class="kelly-right"><div class="kelly-stake">$${(kelly*getBankroll()).toFixed(2)}</div><div class="kelly-sublabel">SUGGESTED STAKE</div></div>
          <button class="acca-add-btn" onclick="addToAcca('${m.home} vs ${m.away}','${m.bestValue.label}',${m.bestValue.prob/100},${m.bestValue.edge})">+ ACCA</button>
        </div>

        <!-- ALL MARKETS TABLE -->
        <div class="section-header" style="margin-top:14px;"><div class="section-title" style="font-size:14px;">All Markets</div>
        <div class="section-meta">${liveOdds?'LIVE ODDS':'SIM ODDS'}</div></div>
        ${buildMarketsTable(markets)}

        <!-- Score Matrix -->
        <div class="section-header" style="margin-top:14px;"><div class="section-title" style="font-size:14px;">Score Matrix</div></div>
        ${matrix}

        <!-- Form -->
        <div class="section-header" style="margin-top:14px;"><div class="section-title" style="font-size:14px;">Form & Stats</div></div>
        <div class="form-row">
          <div class="form-side">${m.hFormStr.split('-').map(p=>formPill(p)).join('')}</div>
          <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">FORM</span>
          <div class="form-side">${m.aFormStr.split('-').map(p=>formPill(p)).join('')}</div>
        </div>
        <div class="stat-chips" style="margin-top:10px;">
          <div class="stat-chip">H ATK <span>${m.homeAttack}</span></div>
          <div class="stat-chip">H DEF <span>${m.homeDefense}</span></div>
          <div class="stat-chip">A ATK <span>${m.awayAttack}</span></div>
          <div class="stat-chip">A DEF <span>${m.awayDefense}</span></div>
          <div class="stat-chip">H xPTS <span>${m.hxPts}</span></div>
          <div class="stat-chip">A xPTS <span>${m.axPts}</span></div>
        </div>

        <!-- AI Analysis -->
        <div class="ai-explain" style="margin-top:12px;">
          <div class="ai-explain-title">⚡ EDGE ANALYSIS</div>
          <ul class="ai-explain-list">${m.explanation.map(e=>`<li>${e}</li>`).join('')}</ul>
        </div>

        <button class="log-btn" onclick="logPick('${m.home} vs ${m.away}','${m.bestValue.label}',${m.bestValue.edge},${m.confidence});this.closest('.match-detail-overlay').remove();">
          📋 LOG PICK TO JOURNAL
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  setTimeout(() => animateBars(overlay), 50);
}

function probRowDetail(label, pct, cls, mktPct, liveOdds) {
  const hasM = mktPct !== null;
  const hasL = liveOdds && liveOdds > 1;
  const dispMkt = hasL ? decimalToImplied(liveOdds)*100 : mktPct;
  const edge = dispMkt ? +(pct - dispMkt).toFixed(1) : null;
  const oddsDisp = hasL ? liveOdds.toFixed(2) : (hasM ? impliedToDecimal(mktPct/100).toFixed(2) : '');

  return `
    <div class="prob-row">
      <span class="prob-label" style="width:90px;font-size:9px;">${label}</span>
      <div class="prob-bar-wrap">
        <div class="prob-bar ${cls}" data-w="${pct}" style="width:0%"></div>
        ${dispMkt ? `<div class="mkt-line" style="left:${dispMkt}%"></div>` : ''}
      </div>
      <span class="prob-pct">${pct}%</span>
      ${oddsDisp ? `<span style="font-family:var(--font-mono);font-size:10px;color:var(--neon2);width:36px;text-align:right;">${oddsDisp}</span>` : '<span style="width:36px"></span>'}
      ${edge!==null ? `<span class="prob-edge" style="color:${edge>0?'var(--neon)':'var(--red)'};width:36px;">${edge>0?'+':''}${edge}%</span>` : '<span class="prob-edge"></span>'}
    </div>`;
}

// ── Market computations ────────────────────────────────────────────────────────
function computeAllMarkets(m, liveOdds) {
  const hw = m.hWin/100, dr = m.draw/100, aw = m.aWin/100;
  const hxG = m.hxG, axG = m.axG;

  // HT xG roughly half of FT
  const hHxG = hxG * 0.45, aHxG = axG * 0.45;
  const h2hxG = hxG * 0.55, a2HxG = axG * 0.55;

  const htHW = winProb(hHxG, aHxG).h, htDR = winProb(hHxG,aHxG).d, htAW = winProb(hHxG,aHxG).a;
  const h2hW = winProb(h2hxG,a2HxG).h, h2dR = winProb(h2hxG,a2HxG).d, h2aW = winProb(h2hxG,a2HxG).a;

  const scoreProb = (hg,ag) => poisson(hxG,hg)*poisson(axG,ag);

  // Over/Under calc
  const o15 = calcOverUnder(hxG,axG,1.5), o25 = m.over25/100, o35 = calcOverUnder(hxG,axG,3.5);
  const btts = m.btts/100;

  const getRaw = (id) => {
    switch(id) {
      case '1x2':      return [hw,dr,aw];
      case 'dc':       return [hw+dr, hw+aw, dr+aw];
      case 'dnb':      return [hw/(hw+aw), aw/(hw+aw)];
      case 'btts':     return [btts, 1-btts];
      case 'o15':      return [o15, 1-o15];
      case 'o25':      return [o25, 1-o25];
      case 'o35':      return [o35, 1-o35];
      case 'u25':      return [1-o25, o25];
      case 'btts_o25': return [btts*o25, 1-btts*o25];
      case 'draw_o25': return [dr+o25-dr*o25, 1-(dr+o25-dr*o25)];
      case 'home_o25': return [hw+o25-hw*o25, 1-(hw+o25-hw*o25)];
      case 'away_o25': return [aw+o25-aw*o25, 1-(aw+o25-aw*o25)];
      case 'home_gg':  return [hw+btts-hw*btts, 1-(hw+btts-hw*btts)];
      case 'away_gg':  return [aw+btts-aw*btts, 1-(aw+btts-aw*btts)];
      case 'dc_o15':   return [(hw+dr)*o15, 1-(hw+dr)*o15];
      case '2h_o05':   return [1-poisson(h2hxG+a2HxG,0), poisson(h2hxG+a2HxG,0)];
      case 'h1_home':  return [htHW, htDR+htAW];
      case 'h1_draw':  return [htDR, htHW+htAW];
      case 'h1_away':  return [htAW, htHW+htDR];
      case 'bhu15':    return [poisson(hHxG+aHxG,0)+poisson(hHxG+aHxG,1), 1-poisson(hHxG+aHxG,0)-poisson(hHxG+aHxG,1)];
      case '1up_home': return [1-poisson(hxG,0)*(1-poisson(axG,0)*0.3), 0];
      case '1up_away': return [1-poisson(axG,0)*(1-poisson(hxG,0)*0.3), 0];
      case 'corners_o':return [0.55+Math.random()*0.1, 0.45-Math.random()*0.1];
      default: return [0.5,0.5];
    }
  };

  return ALL_MARKETS.map(mkt => {
    const probs = getRaw(mkt.id).map(p => Math.min(0.98,Math.max(0.02,p)));
    const mainProb = probs[0];
    // Simulate bookmaker odds (add margin)
    const margin = 0.05;
    const bmOdds = impliedToDecimal(Math.max(0.02, mainProb - margin + (Math.random()-0.5)*0.03));
    const bmImplied = decimalToImplied(bmOdds);
    const ev = calcEV(mainProb, bmOdds);
    const edgePct = +(( mainProb - bmImplied)*100).toFixed(1);
    const edgeLbl = edgePct > 5 ? 'STRONG' : edgePct > 2 ? 'MEDIUM' : 'WEAK';

    return { ...mkt, probs, mainProb: +(mainProb*100).toFixed(1), bmOdds: +bmOdds.toFixed(2), ev: +ev.toFixed(3), edgePct, edgeLbl };
  });
}

function winProb(hxG, axG) {
  let h=0,d=0,a=0;
  for(let hg=0;hg<=5;hg++) for(let ag=0;ag<=5;ag++){
    const p=poisson(hxG,hg)*poisson(axG,ag);
    if(hg>ag)h+=p;else if(hg===ag)d+=p;else a+=p;
  }
  return {h,d,a};
}
function calcOverUnder(hxG,axG,line){
  let p=0;for(let hg=0;hg<=6;hg++) for(let ag=0;ag<=6;ag++) if(hg+ag>line) p+=poisson(hxG,hg)*poisson(axG,ag);
  return p;
}

function buildMarketsTable(markets) {
  const groups = {};
  markets.forEach(m => { if(!groups[m.group]) groups[m.group]=[]; groups[m.group].push(m); });

  return `<div class="markets-table-wrap">${
    Object.entries(groups).map(([grp,mkts]) => `
      <div class="market-group-header">${grp.toUpperCase()}</div>
      <table class="markets-table">
        <thead><tr><th>MARKET</th><th>MODEL%</th><th>ODDS</th><th>EV</th><th>EDGE</th></tr></thead>
        <tbody>${mkts.map(mk => `
          <tr>
            <td class="td-val">${mk.label}</td>
            <td class="td-prob">${mk.mainProb}%</td>
            <td class="td-val">${mk.bmOdds}</td>
            <td class="td-ev ${mk.ev>0?'pos':mk.ev<-0.05?'neg':'mid'}">${mk.ev>0?'+':''}${mk.ev}</td>
            <td class="td-edge ${mk.edgeLbl.toLowerCase()}">${mk.edgePct>0?'+':''}${mk.edgePct}%</td>
          </tr>`).join('')}
        </tbody>
      </table>`).join('')
  }</div>`;
}

function buildScoreMatrix(m) {
  const rows = [];
  const maxG = 5;
  let header = '<tr><th>H\\A</th>';
  for(let ag=0;ag<=maxG;ag++) header += `<th>${ag}</th>`;
  header += '</tr>';

  for(let hg=0;hg<=maxG;hg++){
    let row = `<tr><th>${hg}</th>`;
    for(let ag=0;ag<=maxG;ag++){
      const p = poisson(m.hxG,hg)*poisson(m.axG,ag)*100;
      const cls = p>8?'hot1':p>5?'hot2':p>3?'hot3':'';
      row += `<td class="${cls}">${p.toFixed(1)}%</td>`;
    }
    row += '</tr>';
    rows.push(row);
  }
  return `<div class="score-matrix"><table><thead>${header}</thead><tbody>${rows.join('')}</tbody></table></div>`;
}

// ── Accumulator ───────────────────────────────────────────────────────────────
function addToAcca(match, pick, prob, edge) {
  if (ACCA.find(a=>a.match===match)) { ACCA=ACCA.filter(a=>a.match!==match); }
  else { if(ACCA.length>=8){showToast('Max 8 legs');return;} ACCA.push({match,pick,prob,edge}); }
  updateAccaBar();
  showToast(ACCA.find(a=>a.match===match) ? `+ Added: ${pick}` : `Removed from ACCA`);
}

function updateAccaBar() {
  const bar = document.getElementById('acca-bar');
  if(!bar) return;
  if(ACCA.length===0){bar.style.display='none';return;}
  bar.style.display='block';
  const combined=(ACCA.reduce((a,x)=>a*x.prob,1)*100).toFixed(1);
  const odds=(1/ACCA.reduce((a,x)=>a*x.prob,1)).toFixed(2);
  const avgEdge=(ACCA.reduce((s,x)=>s+x.edge,0)/ACCA.length).toFixed(1);
  bar.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--neon2);">⚡ ACCA (${ACCA.length})</span>
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${ACCA.map(a=>a.pick).join(' + ')}</span>
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--neon);">${combined}% · ${odds}x odds · +${avgEdge}% edge</span>
      <button onclick="ACCA=[];updateAccaBar();" style="margin-left:auto;background:none;border:1px solid rgba(255,45,85,0.3);color:var(--red);font-family:var(--font-mono);font-size:9px;padding:3px 8px;border-radius:3px;cursor:pointer;">CLEAR</button>
    </div>`;
}

// ── Data Generation ───────────────────────────────────────────────────────────
function generateFixtures() {
  const ff = pts => pts.slice(-3).reduce((a,b)=>a+b,0)/9;
  const noise = () => (Math.random()-0.5)*0.08;
  const matches = []; const used = new Set();

  while(matches.length < 12) {
    const hi=Math.floor(Math.random()*TEAMS_DB.length), ai=Math.floor(Math.random()*TEAMS_DB.length);
    if(hi===ai||used.has(hi)||used.has(ai)) continue;
    used.add(hi);used.add(ai);
    const h=TEAMS_DB[hi],a=TEAMS_DB[ai];
    const hf=ff(h.form),af=ff(a.form);
    const hxG=(h.attack/100)*(1-a.defense/150)*(0.6+hf*0.8)*h.homeAdv;
    const axG=(a.attack/100)*(1-h.defense/150)*(0.6+af*0.8);

    let hW=0,dr=0,aW=0;
    for(let hg=0;hg<=5;hg++) for(let ag=0;ag<=5;ag++){
      const p=poisson(hxG,hg)*poisson(axG,ag);
      if(hg>ag)hW+=p;else if(hg===ag)dr+=p;else aW+=p;
    }
    const tot=hW+dr+aW; hW/=tot;dr/=tot;aW/=tot;
    const btts=(1-poisson(hxG,0))*(1-poisson(axG,0));
    let o25=0;for(let hg=0;hg<=5;hg++) for(let ag=0;ag<=5;ag++) if(hg+ag>2) o25+=poisson(hxG,hg)*poisson(axG,ag);
    const mH=Math.max(0.05,hW+noise()),mD=Math.max(0.05,dr+noise()),mA=Math.max(0.05,aW+noise());
    const vals=[
      {label:`${h.name} Win`,edge:hW-mH,prob:hW},
      {label:'Draw',edge:dr-mD,prob:dr},
      {label:`${a.name} Win`,edge:aW-mA,prob:aW},
    ];
    vals.sort((x,y)=>y.edge-x.edge);const best=vals[0];
    const conf=Math.min(99,Math.round(55+Math.abs(hxG-axG)*18+(hf+af)*12));
    const edgeLbl=best.edge>0.08?'STRONG':best.edge>0.03?'MEDIUM':'WEAK';
    const reasons=[];
    if(h.attack>85) reasons.push(`${h.name} elite attack rating (${h.attack})`);
    if(a.defense<75) reasons.push(`${a.name} defensive vulnerability (${a.defense} DEF)`);
    if(hf>af) reasons.push(`${h.name} superior recent form`);
    else reasons.push(`${a.name} in stronger form streak`);
    if(h.homeAdv>1.15) reasons.push('pronounced home advantage factored in');
    if(best.edge>0.05) reasons.push(`market underpricing ${best.label} by ${(best.edge*100).toFixed(1)}%`);
    else reasons.push('market tightly aligned — thin edge only');
    const dayIdx=matches.length%DATES.length;
    matches.push({
      id:matches.length+1,home:h.name,away:a.name,league:h.league||a.league||'EPL',
      homeAttack:h.attack,awayAttack:a.attack,homeDefense:h.defense,awayDefense:a.defense,
      hxG:+hxG.toFixed(2),axG:+axG.toFixed(2),
      hWin:+(hW*100).toFixed(1),draw:+(dr*100).toFixed(1),aWin:+(aW*100).toFixed(1),
      btts:+(btts*100).toFixed(1),over25:+(o25*100).toFixed(1),
      hxPts:+(hW*3+dr).toFixed(2),axPts:+(aW*3+dr).toFixed(2),
      mktHome:+(mH*100).toFixed(1),mktDraw:+(mD*100).toFixed(1),mktAway:+(mA*100).toFixed(1),
      bestValue:{...best,edge:+(best.edge*100).toFixed(1),prob:+(best.prob*100).toFixed(1)},
      confidence:conf,edgeLabel:edgeLbl,explanation:reasons,
      hFormStr:h.form.slice(-5).join('-'),aFormStr:a.form.slice(-5).join('-'),
      kickoff:KICKOFFS[Math.floor(Math.random()*KICKOFFS.length)],
      dayLabel:DATES[dayIdx].label,
    });
  }
  return matches;
}

// ── Override fixture loading to use AllSportsAPI ──────────────────────────────
window.loadFixturesFromAPI = async function() {
  const container = document.getElementById('fixture-calendar');
  if (!container) return;
  container.innerHTML = '<div class="loading-wrap"><div class="loader"></div><div class="loading-text">FETCHING LIVE FIXTURES...</div></div>';

  try {
    const apiFixtures = await initFootballFixturesFromAPI();

    if (apiFixtures && apiFixtures.length > 0) {
      // Convert API fixtures to EdgeX format
      window.ALL_FIXTURES = apiFixtures.map((f, i) => ({
        id:         i + 1,
        apiId:      f.id,
        home:       f.home,
        away:       f.away,
        homeLogo:   f.homeLogo,
        awayLogo:   f.awayLogo,
        league:     mapLeagueName(f.league),
        kickoff:    f.kickoff,
        dayLabel:   f.dayLabel,
        dayOffset:  f.dayOffset,
        stadium:    f.stadium,
        status:     f.status,
        // Prediction data (computed from team names via our model)
        ...computePrediction(f.home, f.away),
        // Real odds if available
        mktHome: f.odds ? +(decimalToImplied(f.odds.home)*100).toFixed(1) : null,
        mktDraw: f.odds ? +(decimalToImplied(f.odds.draw)*100).toFixed(1) : null,
        mktAway: f.odds ? +(decimalToImplied(f.odds.away)*100).toFixed(1) : null,
        liveOdds: f.odds || null,
        isRealData: true,
      }));

      renderCalendar();

      // Update odds banner
      const hasliveOdds = apiFixtures.some(f => f.odds);
      const banner = document.getElementById('odds-banner');
      if (banner) {
        banner.style.display = '';
        banner.className = hasliveOdds ? 'odds-api-banner live' : 'odds-api-banner sim';
        banner.innerHTML = hasliveOdds
          ? `<div class="oab-dot live"></div><div class="oab-text">LIVE ODDS — <strong>AllSportsAPI</strong> · Real bookmaker data</div>`
          : `<div class="oab-dot sim"></div><div class="oab-text">LIVE FIXTURES — <strong>AllSportsAPI</strong> · Odds not available for upcoming matches</div>`;
      }
      return;
    }
  } catch(e) {
    console.warn('Fixtures API:', e);
  }

  // Fallback to generated fixtures
  window.ALL_FIXTURES = enrichFixtures(generateFixtures());
  renderCalendar();
};

function mapLeagueName(name) {
  if (!name) return 'Football';
  const n = name.toLowerCase();
  if (n.includes('premier') || n.includes('epl'))         return 'EPL';
  if (n.includes('champions'))                             return 'UCL';
  if (n.includes('la liga') || n.includes('laliga'))       return 'LA LIGA';
  if (n.includes('bundesliga'))                            return 'BUNDESLIGA';
  if (n.includes('serie a'))                               return 'SERIE A';
  if (n.includes('ligue'))                                 return 'LIGUE 1';
  if (n.includes('europa'))                                return 'UEL';
  return name;
}

function computePrediction(homeName, awayName) {
  // Look up team in TEAMS_DB, fall back to average
  const h = TEAMS_DB.find(t => homeName.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(homeName.toLowerCase().split(' ')[0]));
  const a = TEAMS_DB.find(t => awayName.toLowerCase().includes(t.name.toLowerCase())  || t.name.toLowerCase().includes(awayName.toLowerCase().split(' ')[0]));

  if (!h || !a) {
    // Unknown team — return neutral prediction
    return {
      hWin: 40, draw: 28, aWin: 32,
      hxG: 1.2, axG: 1.1,
      btts: 48, over25: 52,
      hxPts: 1.4, axPts: 1.2,
      homeAttack: 75, awayAttack: 75, homeDefense: 75, awayDefense: 75,
      hFormStr: '1-3-1-0-3', aFormStr: '3-1-1-3-0',
      bestValue: { label: 'Home Win', edge: 4.2, prob: 40 },
      confidence: 55, edgeLabel: 'WEAK',
      explanation: ['Limited data for this fixture', 'Model using league averages'],
    };
  }

  // Re-run Poisson engine
  const ff = form => form.slice(-3).reduce((a,b)=>a+b,0)/9;
  const hf = ff(h.form), af = ff(a.form);
  const hxG = (h.attack/100)*(1-a.defense/150)*(0.6+hf*0.8)*h.homeAdv;
  const axG = (a.attack/100)*(1-h.defense/150)*(0.6+af*0.8);
  let hW=0, dr=0, aW=0;
  for (let hg=0;hg<=5;hg++) for (let ag=0;ag<=5;ag++) {
    const p = poisson(hxG,hg)*poisson(axG,ag);
    if(hg>ag) hW+=p; else if(hg===ag) dr+=p; else aW+=p;
  }
  const tot=hW+dr+aW; hW/=tot; dr/=tot; aW/=tot;
  const btts=(1-poisson(hxG,0))*(1-poisson(axG,0));
  let o25=0;
  for(let hg=0;hg<=5;hg++) for(let ag=0;ag<=5;ag++) if(hg+ag>2) o25+=poisson(hxG,hg)*poisson(axG,ag);
  const noise=()=>(Math.random()-0.5)*0.06;
  const mH=Math.max(0.05,hW+noise()),mD=Math.max(0.05,dr+noise()),mA=Math.max(0.05,aW+noise());
  const vals=[{label:`${h.name} Win`,edge:hW-mH,prob:hW},{label:'Draw',edge:dr-mD,prob:dr},{label:`${a.name} Win`,edge:aW-mA,prob:aW}];
  vals.sort((x,y)=>y.edge-x.edge);
  const best=vals[0];
  const conf=Math.min(99,Math.round(55+Math.abs(hxG-axG)*18+(hf+af)*12));
  const edgeLabel=best.edge>0.08?'STRONG':best.edge>0.03?'MEDIUM':'WEAK';
  const explanation=[];
  if(h.attack>85) explanation.push(`${h.name} elite attack (${h.attack})`);
  if(a.defense<76) explanation.push(`${a.name} defensive vulnerability (${a.defense} DEF)`);
  explanation.push(hf>af?`${h.name} in better form`:`${a.name} in stronger form`);
  if(h.homeAdv>1.15) explanation.push('Strong home advantage factored in');
  explanation.push(best.edge>0.05?`Market underpricing ${best.label} by ${(best.edge*100).toFixed(1)}%`:'Market tightly aligned');
  return {
    hWin:+(hW*100).toFixed(1), draw:+(dr*100).toFixed(1), aWin:+(aW*100).toFixed(1),
    hxG:+hxG.toFixed(2), axG:+axG.toFixed(2),
    btts:+(btts*100).toFixed(1), over25:+(o25*100).toFixed(1),
    hxPts:+(hW*3+dr).toFixed(2), axPts:+(aW*3+dr).toFixed(2),
    homeAttack:h.attack, awayAttack:a.attack, homeDefense:h.defense, awayDefense:a.defense,
    hFormStr:h.form.slice(-5).join('-'), aFormStr:a.form.slice(-5).join('-'),
    bestValue:{...best,edge:+(best.edge*100).toFixed(1),prob:+(best.prob*100).toFixed(1)},
    confidence:conf, edgeLabel, explanation,
  };
}
