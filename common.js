/* ===== EdgeX common.js ===== */

const EDGEX = {
  bankroll: parseFloat(localStorage.getItem('edgex_bankroll') || '1000'),
  journal:  JSON.parse(localStorage.getItem('edgex_journal')  || '[]'),
  acca:     JSON.parse(localStorage.getItem('edgex_acca')     || '[]'),
};

// ── All nav items (sidebar / drawer) ─────────────────────────────────────────
const NAV_ITEMS = [
  { href:'index.html',         icon:'🏠', label:'Dashboard',    section:'MAIN' },
  { href:'football.html',      icon:'⚽', label:'Football',     section:'SPORTS' },
  { href:'basketball.html',    icon:'🏀', label:'Basketball',   section:'SPORTS' },
  { href:'value-bets.html',    icon:'💎', label:'Value Bets',   section:'BETTING' },
  { href:'acca.html',          icon:'🎯', label:'Acca Builder', section:'BETTING' },
  { href:'player-compare.html',icon:'👤', label:'Players',      section:'BETTING' },
  { href:'crypto.html',        icon:'💰', label:'Crypto',       section:'MARKETS' },
  { href:'forex.html',         icon:'📉', label:'Forex',        section:'MARKETS' },
  { href:'events.html',        icon:'🌍', label:'Events',       section:'MARKETS' },
  { href:'journal.html',       icon:'📋', label:'Journal',      section:'TOOLS' },
];

// ── Mobile bottom bar — 5 items only ─────────────────────────────────────────
const MOB_TABS = [
  { href:'index.html',      icon:'🏠', label:'Home'     },
  { href:'football.html',   icon:'⚽', label:'Football' },
  { href:'basketball.html', icon:'🏀', label:'Hoops'    },
  { href:'value-bets.html', icon:'💎', label:'Value'    },
  { href:'journal.html',    icon:'📋', label:'Journal'  },
];

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectTicker();
  markActiveNav();
  updateAccaBadge();
});

// ── Nav injection ─────────────────────────────────────────────────────────────
function injectNav() {
  const nav = document.getElementById('side-nav');
  if (!nav) return;

  // Group items by section
  const sections = {};
  NAV_ITEMS.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const itemsHTML = Object.entries(sections).map(([sec, items]) => `
    <div class="nav-section-label">${sec}</div>
    ${items.map(item => `
      <a class="nav-item" href="${item.href}">
        <span class="ni-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`).join('')}
  `).join('');

  nav.innerHTML = `
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-mark">EX</div>
      <div class="nav-logo-text">EdgeX</div>
    </a>
    <div style="flex:1;overflow-y:auto;padding:8px 0">${itemsHTML}</div>
    <div class="nav-status">
      <div class="nav-dot"></div>
      <span>Live · API-Football</span>
    </div>`;

  // ── Mobile: inject overlay + menu btn + bottom bar ────────────────────────
  if (!document.querySelector('.mob-bottom-bar')) {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'nav-overlay';
    overlay.onclick = closeDrawer;
    document.body.appendChild(overlay);

    // Hamburger button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mob-menu-btn';
    menuBtn.id = 'mob-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.onclick = toggleDrawer;
    document.body.appendChild(menuBtn);

    // Bottom tab bar
    const bar = document.createElement('nav');
    bar.className = 'mob-bottom-bar';
    bar.innerHTML = MOB_TABS.map(t => `
      <a class="mob-tab" href="${t.href}">
        <span class="mt-icon">${t.icon}</span>
        <span class="mt-label">${t.label}</span>
      </a>`).join('') + `
      <button class="mob-tab" onclick="toggleDrawer()">
        <span class="mt-icon">⋯</span>
        <span class="mt-label">More</span>
      </button>`;
    document.body.appendChild(bar);
  }
}

function toggleDrawer() {
  const nav     = document.getElementById('side-nav');
  const overlay = document.getElementById('nav-overlay');
  if (!nav) return;
  const open = nav.classList.toggle('open');
  overlay?.classList.toggle('show', open);
}

function closeDrawer() {
  document.getElementById('side-nav')?.classList.remove('open');
  document.getElementById('nav-overlay')?.classList.remove('show');
}

function markActiveNav() {
  const cur = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === cur);
  });
  document.querySelectorAll('.mob-tab').forEach(a => {
    if (a.getAttribute('href') === cur) a.classList.add('active');
  });
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function injectTicker() {
  const bar = document.getElementById('ticker-bar');
  if (!bar) return;
  const items = [
    {sym:'BTC',  val:'$85,240', chg:'+2.4%',  pos:true},
    {sym:'ETH',  val:'$3,621',  chg:'+1.8%',  pos:true},
    {sym:'SOL',  val:'$87.4',   chg:'+4.2%',  pos:true},
    {sym:'XRP',  val:'$2.41',   chg:'-1.3%',  pos:false},
    {sym:'BNB',  val:'$592',    chg:'+0.9%',  pos:true},
    {sym:'AVAX', val:'$22.8',   chg:'-2.1%',  pos:false},
    {sym:'DOGE', val:'$0.172',  chg:'+3.1%',  pos:true},
    {sym:'EUR/USD', val:'1.0852',chg:'-0.12%',pos:false},
    {sym:'GBP/USD', val:'1.2681',chg:'+0.08%',pos:true},
    {sym:'USD/JPY', val:'151.4', chg:'+0.21%',pos:true},
    {sym:'GOLD', val:'$3,085',  chg:'+0.3%',  pos:true},
    {sym:'OIL',  val:'$68.4',   chg:'-0.9%',  pos:false},
    {sym:'S&P',  val:'5,612',   chg:'+0.5%',  pos:true},
    {sym:'NASDAQ',val:'17,840', chg:'+0.7%',  pos:true},
  ];
  const html = items.map(i => `<div class="ticker-item">
    <span class="t-dot ${i.pos?'pos':'neg'}"></span>
    <span class="t-sym">${i.sym}</span>
    <span class="t-val">${i.val}</span>
    <span class="t-chg ${i.pos?'pos':'neg'}">${i.chg}</span>
  </div>`).join('');
  bar.innerHTML = `<div class="ticker-track">${html}${html}${html}</div>`;
}

// ── Bankroll ──────────────────────────────────────────────────────────────────
function getBankroll() { return parseFloat(localStorage.getItem('edgex_bankroll') || '1000'); }
function setBankroll(v) {
  const n = parseFloat(v);
  if (!isNaN(n) && n > 0) { localStorage.setItem('edgex_bankroll', String(n)); EDGEX.bankroll = n; }
}

// ── Journal ───────────────────────────────────────────────────────────────────
function getJournal() { return JSON.parse(localStorage.getItem('edgex_journal') || '[]'); }
function saveJournal(j) { localStorage.setItem('edgex_journal', JSON.stringify(j)); }

function logPick(match, pick, edge, conf, sport) {
  const j = getJournal();
  j.unshift({ id: Date.now(), date: new Date().toISOString(), match, pick,
    edge: parseFloat(edge)||0, conf: parseFloat(conf)||0,
    sport: sport||'Football', stake: calcKellyStake(edge), result: 'pending', profit: 0 });
  saveJournal(j);
  showToast('📋 Pick logged to journal');
}

function calcKellyStake(edge) {
  return +(Math.max(0, parseFloat(edge)||0) / 100 * 0.25 * getBankroll()).toFixed(2);
}

// ── Acca ──────────────────────────────────────────────────────────────────────
function getAcca()     { return JSON.parse(localStorage.getItem('edgex_acca') || '[]'); }
function saveAcca(a)   { localStorage.setItem('edgex_acca', JSON.stringify(a)); }

function addToAcca(match, pick, prob, odds) {
  const a = getAcca();
  if (a.length >= 10) { showToast('Max 10 selections'); return false; }
  const idx = a.findIndex(x => x.match === match);
  if (idx >= 0) a.splice(idx, 1);
  a.push({ match, pick, prob: parseFloat(prob)||50, odds: parseFloat(odds)||2.0, added: Date.now() });
  saveAcca(a); updateAccaBadge();
  showToast('✅ Added to acca');
  return true;
}

function removeFromAcca(match) { saveAcca(getAcca().filter(x => x.match !== match)); updateAccaBadge(); }
function clearAcca()           { saveAcca([]); updateAccaBadge(); }

function updateAccaBadge() {
  const n = getAcca().length;
  document.querySelectorAll('.acca-badge').forEach(b => {
    b.textContent = n; b.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}

function getAccaOdds() { return getAcca().reduce((t, s) => t * s.odds, 1); }
function getAccaProb() { return getAcca().reduce((t, s) => t * (s.prob/100), 1) * 100; }

// ── Maths helpers ─────────────────────────────────────────────────────────────
function calcEV(prob, odds)          { return (prob * (odds - 1)) - (1 - prob); }
function decimalToImplied(d)         { return d > 1 ? 1/d : 0; }
function kellyFraction(prob, odds)   { const b=odds-1,q=1-prob; return Math.max(0,(b*prob-q)/b); }
function edgeClass(lbl)              { return lbl==='STRONG'?'strong':lbl==='MEDIUM'?'medium':'weak'; }

function buildScoreMatrix(hxG, axG, maxG=5) {
  function pois(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p;}
  const m=[];
  for(let h=0;h<=maxG;h++){m[h]=[];for(let a=0;a<=maxG;a++)m[h][a]=+(pois(hxG,h)*pois(axG,a)*100).toFixed(1);}
  return m;
}

function calcAsianHandicap(hxG, axG, line) {
  function pois(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p;}
  let h=0,p=0,a=0;
  for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const pr=pois(hxG,i)*pois(axG,j),d=i-j;if(d>-line)h+=pr;else if(d===-line)p+=pr;else a+=pr;}
  return {home:+(h*100).toFixed(1),push:+(p*100).toFixed(1),away:+(a*100).toFixed(1)};
}

// ── Loading ───────────────────────────────────────────────────────────────────
function showLoading(elId) {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:20px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim)"><div class="live-dot"></div>Loading...</div>`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._to); t._to = setTimeout(() => t.classList.remove('show'), 2200);
}
