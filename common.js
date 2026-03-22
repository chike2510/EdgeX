/* ===== EdgeX common.js — Shared across all pages ===== */

// ── Config ────────────────────────────────────────────────────────────────────
const EDGEX = {
  bankroll: parseFloat(localStorage.getItem('edgex_bankroll') || '1000'),
  journal:  JSON.parse(localStorage.getItem('edgex_journal')  || '[]'),
  acca:     JSON.parse(localStorage.getItem('edgex_acca')     || '[]'),
  oddsMode: 'simulation', // 'live' or 'simulation'
};

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href:'index.html',      icon:'🏠', label:'Dashboard'  },
  { href:'football.html',   icon:'⚽', label:'Football'   },
  { href:'basketball.html', icon:'🏀', label:'Basketball' },
  { href:'crypto.html',     icon:'💰', label:'Crypto'     },
  { href:'forex.html',      icon:'📉', label:'Forex'      },
  { href:'events.html',     icon:'🌍', label:'Events'     },
  { href:'journal.html',    icon:'📋', label:'Journal'    },
];

const TICKER_ITEMS = [
  {sym:'BTC',val:'$68,420',chg:'+2.4%',pos:true},
  {sym:'ETH',val:'$3,621',chg:'+1.8%',pos:true},
  {sym:'EUR/USD',val:'1.0852',chg:'-0.12%',pos:false},
  {sym:'GBP/USD',val:'1.2681',chg:'+0.08%',pos:true},
  {sym:'SOL',val:'$176.4',chg:'+4.2%',pos:true},
  {sym:'XRP',val:'$0.621',chg:'-1.3%',pos:false},
  {sym:'BTC DOM',val:'54.2%',chg:'+0.4%',pos:true},
  {sym:'USD/JPY',val:'151.24',chg:'+0.22%',pos:true},
  {sym:'BNB',val:'$592',chg:'+0.9%',pos:true},
  {sym:'AVAX',val:'$37.8',chg:'-2.1%',pos:false},
  {sym:'GOLD',val:'$2312',chg:'+0.3%',pos:true},
  {sym:'OIL',val:'$82.4',chg:'-0.9%',pos:false},
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

  const logoHTML = `
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-mark">EX</div>
      <div class="nav-logo-text">EDGEX</div>
    </a>
    <div class="nav-section-label">MARKETS</div>
  `;

  const itemsHTML = NAV_ITEMS.map(item => `
    <a class="nav-item" href="${item.href}" data-page="${item.href}">
      <span class="ni-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  const statusHTML = `
    <div class="nav-status">
      <div class="nav-dot"></div>
      <span>SYSTEM LIVE</span>
    </div>
  `;

  nav.innerHTML = logoHTML + itemsHTML + statusHTML;
}

function markActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page || (page === '' && a.dataset.page === 'index.html'));
  });
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function injectTicker() {
  const bar = document.getElementById('ticker-bar');
  if (!bar) return;
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  bar.innerHTML = `<div class="ticker-track">${
    items.map(i => `<div class="ticker-item"><span class="t-sym">${i.sym}</span><span class="t-val">${i.val}</span><span class="t-chg ${i.pos?'pos':'neg'}">${i.chg}</span></div>`).join('')
  }</div>`;
}

// ── Bankroll ──────────────────────────────────────────────────────────────────
function getBankroll() { return EDGEX.bankroll; }
function setBankroll(val) {
  const v = parseFloat(val);
  if (isNaN(v) || v <= 0) return;
  EDGEX.bankroll = v;
  localStorage.setItem('edgex_bankroll', v);
}

// ── Journal ───────────────────────────────────────────────────────────────────
function getJournal() { return EDGEX.journal; }
function logPick(match, pick, edge, conf, market = 'Football') {
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB'),
    market, match, pick, edge, conf,
    result: 'PENDING',
    profit: 0,
    stake: +(EDGEX.bankroll * 0.02).toFixed(2),
  };
  EDGEX.journal.unshift(entry);
  if (EDGEX.journal.length > 100) EDGEX.journal.pop();
  localStorage.setItem('edgex_journal', JSON.stringify(EDGEX.journal));
  showToast(`✅ Logged: ${pick} — ${match}`);
}

// ── Kelly Criterion ───────────────────────────────────────────────────────────
function calcKelly(probWin, decimalOdds) {
  if (!decimalOdds || decimalOdds <= 1 || probWin <= 0) return 0;
  const b = decimalOdds - 1, q = 1 - probWin;
  const k = (b * probWin - q) / b;
  return Math.max(0, Math.min(k * 0.25, 0.10)); // Quarter Kelly, max 10%
}

function calcEV(probWin, decimalOdds, stake = 1) {
  return ((probWin * (decimalOdds - 1)) - (1 - probWin)) * stake;
}

function decimalToImplied(odds) { return odds > 1 ? 1/odds : 0; }
function impliedToDecimal(prob) { return prob > 0 ? 1/prob : 100; }

// ── Edge label ────────────────────────────────────────────────────────────────
function edgeClass(edgeLabel) {
  return edgeLabel==='STRONG'?'strong':edgeLabel==='MEDIUM'?'medium':'weak';
}
function getEdgeLabel(modelProb, mktProb) {
  const diff = modelProb - mktProb;
  return diff > 0.08 ? 'STRONG' : diff > 0.03 ? 'MEDIUM' : 'WEAK';
}

// ── Formatting ────────────────────────────────────────────────────────────────
function fmtPrice(p) {
  if (p >= 1000) return p.toLocaleString('en-US', {maximumFractionDigits:2});
  if (p >= 1)    return p.toFixed(2);
  return p.toFixed(4);
}
function fmtPct(v) { return v.toFixed(1) + '%'; }
function formPill(v) {
  const c = v==='3'?'w':v==='1'?'d':'l', l = v==='3'?'W':v==='1'?'D':'L';
  return `<div class="form-pill ${c}">${l}</div>`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2800);
}

// ── Loading ───────────────────────────────────────────────────────────────────
function showLoading(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.innerHTML = `<div class="loading-wrap"><div class="loader"></div><div class="loading-text">LOADING...</div></div>`;
}

// ── Animate bars ──────────────────────────────────────────────────────────────
function animateBars(root) {
  setTimeout(() => {
    (root || document).querySelectorAll('[data-w]').forEach(el => {
      el.style.width = el.dataset.w + '%';
    });
  }, 80);
}

// ── Poisson helpers ───────────────────────────────────────────────────────────
function poisson(lambda, k) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// ── Odds API banner ───────────────────────────────────────────────────────────
function renderOddsAPIBanner(container, mode, bookmaker = '') {
  const el = document.getElementById(container);
  if (!el) return;
  if (mode === 'live') {
    el.className = 'odds-api-banner live';
    el.innerHTML = `<div class="oab-dot live"></div><div class="oab-text">LIVE ODDS — <strong>The Odds API</strong> · ${bookmaker}</div>`;
  } else if (mode === 'sim-clean') {
    // Hide entirely — no need to show anything
    el.style.display = 'none';
  } else {
    el.className = 'odds-api-banner sim';
    el.innerHTML = `<div class="oab-dot sim"></div><div class="oab-text">SIMULATION MODE — odds are model-generated estimates</div>`;
  }
}
