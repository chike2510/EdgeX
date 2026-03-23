/* ===== EdgeX common.js — Shared across all pages ===== */

// ── Config ────────────────────────────────────────────────────────────────────
const EDGEX = {
  bankroll: parseFloat(localStorage.getItem('edgex_bankroll') || '1000'),
  journal:  JSON.parse(localStorage.getItem('edgex_journal')  || '[]'),
  acca:     JSON.parse(localStorage.getItem('edgex_acca')     || '[]'),
};

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href:'index.html',        icon:'🏠', label:'Dashboard'    },
  { href:'football.html',     icon:'⚽', label:'Football'     },
  { href:'basketball.html',   icon:'🏀', label:'Basketball'   },
  { href:'value-bets.html',   icon:'💎', label:'Value Bets'   },
  { href:'acca.html',         icon:'🎯', label:'Acca Builder' },
  { href:'standings.html',    icon:'🏆', label:'Standings'    },
  { href:'player-compare.html',icon:'👤',label:'Players'      },
  { href:'crypto.html',       icon:'💰', label:'Crypto'       },
  { href:'forex.html',        icon:'📉', label:'Forex'        },
  { href:'events.html',       icon:'🌍', label:'Events'       },
  { href:'journal.html',      icon:'📋', label:'Journal'      },
];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectTicker();
  markActiveNav();
});

// ── Nav Injection ─────────────────────────────────────────────────────────────
function injectNav() {
  const nav = document.getElementById('side-nav');
  if (!nav) return;

  const logoHTML = `<a class="nav-logo" href="index.html"><span class="nav-logo-text">Edge<span class="nav-logo-x">X</span></span></a>`;

  const itemsHTML = NAV_ITEMS.map(item => `
    <a class="nav-item" href="${item.href}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>`).join('');

  nav.innerHTML = `
    <div class="sidebar">
      ${logoHTML}
      <div class="nav-items">${itemsHTML}</div>
    </div>
    <div class="mobile-nav">
      ${NAV_ITEMS.slice(0,6).map(item => `
        <a class="mob-item" href="${item.href}">
          <span class="mob-icon">${item.icon}</span>
          <span class="mob-label">${item.label}</span>
        </a>`).join('')}
    </div>`;
}

function markActiveNav() {
  const cur = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item, .mob-item').forEach(a => {
    const href = a.getAttribute('href');
    if (href === cur) a.classList.add('active');
  });
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function injectTicker() {
  const bar = document.getElementById('ticker-bar');
  if (!bar) return;
  const items = [
    {sym:'BTC',val:'$85,240',chg:'+2.4%',pos:true},
    {sym:'ETH',val:'$3,621',chg:'+1.8%',pos:true},
    {sym:'EUR/USD',val:'1.0852',chg:'-0.12%',pos:false},
    {sym:'GBP/USD',val:'1.2681',chg:'+0.08%',pos:true},
    {sym:'SOL',val:'$87.4',chg:'+4.2%',pos:true},
    {sym:'XRP',val:'$2.41',chg:'-1.3%',pos:false},
    {sym:'GOLD',val:'$3,085',chg:'+0.3%',pos:true},
    {sym:'OIL',val:'$68.4',chg:'-0.9%',pos:false},
    {sym:'USD/JPY',val:'151.24',chg:'+0.22%',pos:true},
    {sym:'BNB',val:'$592',chg:'+0.9%',pos:true},
    {sym:'DOGE',val:'$0.182',chg:'-2.1%',pos:false},
    {sym:'AVAX',val:'$22.8',chg:'-2.1%',pos:false},
  ];
  const html = items.map(i => `
    <div class="tick-item">
      <span class="tick-sym">${i.sym}</span>
      <span class="tick-val">${i.val}</span>
      <span class="tick-chg ${i.pos?'pos':'neg'}">${i.chg}</span>
    </div>`).join('');
  bar.innerHTML = `<div class="tick-track">${html}${html}</div>`;
}

// ── Bankroll ──────────────────────────────────────────────────────────────────
function getBankroll() { return parseFloat(localStorage.getItem('edgex_bankroll') || '1000'); }
function setBankroll(v) {
  const n = parseFloat(v);
  if (!isNaN(n) && n > 0) {
    localStorage.setItem('edgex_bankroll', String(n));
    EDGEX.bankroll = n;
  }
}

// ── Journal ───────────────────────────────────────────────────────────────────
function getJournal() { return JSON.parse(localStorage.getItem('edgex_journal') || '[]'); }
function saveJournal(j) { localStorage.setItem('edgex_journal', JSON.stringify(j)); }

function logPick(match, pick, edge, conf, sport) {
  const j = getJournal();
  j.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    match, pick, edge: parseFloat(edge)||0,
    conf: parseFloat(conf)||0,
    sport: sport||'Football',
    stake: calcKellyStake(edge),
    result: 'pending',
    profit: 0,
  });
  saveJournal(j);
}

function calcKellyStake(edge) {
  const e = parseFloat(edge)||0;
  const f = Math.max(0, e/100) * 0.25;
  return +(f * getBankroll()).toFixed(2);
}

// ── Acca ─────────────────────────────────────────────────────────────────────
function getAcca() { return JSON.parse(localStorage.getItem('edgex_acca') || '[]'); }
function saveAcca(a) { localStorage.setItem('edgex_acca', JSON.stringify(a)); }

function addToAcca(match, pick, prob, odds) {
  const a = getAcca();
  if (a.length >= 10) { alert('Max 10 selections per acca'); return false; }
  const existing = a.findIndex(x => x.match === match);
  if (existing >= 0) a.splice(existing, 1);
  a.push({ match, pick, prob: parseFloat(prob)||50, odds: parseFloat(odds)||2.0, added: Date.now() });
  saveAcca(a);
  updateAccaBadge();
  return true;
}

function removeFromAcca(match) {
  const a = getAcca().filter(x => x.match !== match);
  saveAcca(a);
  updateAccaBadge();
}

function clearAcca() { saveAcca([]); updateAccaBadge(); }

function updateAccaBadge() {
  const count = getAcca().length;
  document.querySelectorAll('.acca-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function getAccaOdds() {
  return getAcca().reduce((total, s) => total * s.odds, 1);
}

function getAccaProb() {
  return getAcca().reduce((total, s) => total * (s.prob/100), 1) * 100;
}

// ── Maths helpers ─────────────────────────────────────────────────────────────
function calcEV(prob, decimalOdds) { return (prob * (decimalOdds - 1)) - (1 - prob); }
function decimalToImplied(d) { return d > 1 ? 1/d : 0; }
function impliedToDecimal(p) { return p > 0 ? 1/p : 999; }
function kellyFraction(prob, odds) {
  const b = odds - 1;
  const q = 1 - prob;
  return Math.max(0, (b*prob - q) / b);
}

// ── Edge class ────────────────────────────────────────────────────────────────
function edgeClass(lbl) {
  if (lbl==='STRONG') return 'strong';
  if (lbl==='MEDIUM') return 'medium';
  return 'weak';
}

// ── Loading state ──────────────────────────────────────────────────────────────
function showLoading(elId) {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:20px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">
      <div class="live-dot"></div> Loading...
    </div>`;
}

// ── Score matrix (Poisson) ────────────────────────────────────────────────────
function buildScoreMatrix(hxG, axG, maxG=5) {
  function pois(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p;}
  const matrix = [];
  for (let h=0; h<=maxG; h++) {
    matrix[h] = [];
    for (let a=0; a<=maxG; a++) {
      matrix[h][a] = +(pois(hxG,h)*pois(axG,a)*100).toFixed(1);
    }
  }
  return matrix;
}

// ── Asian handicap ────────────────────────────────────────────────────────────
function calcAsianHandicap(hxG, axG, line) {
  function pois(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p;}
  let homeCovers=0, push=0, awayCovers=0;
  for(let h=0;h<=8;h++) for(let a=0;a<=8;a++){
    const p=pois(hxG,h)*pois(axG,a);
    const diff=h-a;
    if(diff>-line) homeCovers+=p;
    else if(diff===-line) push+=p;
    else awayCovers+=p;
  }
  return {home:+(homeCovers*100).toFixed(1),push:+(push*100).toFixed(1),away:+(awayCovers*100).toFixed(1)};
}

// ── Form badge ────────────────────────────────────────────────────────────────
function formBadge(result) {
  const map = {'W':'<span style="background:#00ff9d;color:#07090d;padding:1px 5px;border-radius:3px;font-weight:800;font-size:9px">W</span>','D':'<span style="background:#f5c842;color:#07090d;padding:1px 5px;border-radius:3px;font-weight:800;font-size:9px">D</span>','L':'<span style="background:#ff2d55;color:#fff;padding:1px 5px;border-radius:3px;font-weight:800;font-size:9px">L</span>'};
  return map[result] || result;
}

function resultFromScore(homeGoals, awayGoals, perspective) {
  if (homeGoals===null||awayGoals===null) return '?';
  const diff = homeGoals - awayGoals;
  if (perspective==='home') return diff>0?'W':diff===0?'D':'L';
  return diff<0?'W':diff===0?'D':'L';
}
