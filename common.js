/* ===== EdgeX common.js ===== */


// ── All nav items (sidebar) ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { href:'home.html',          icon:'⌂',  label:'Overview',       section:'CORE' },
  { href:'football.html',      icon:'⚽', label:'Sports',         section:'CORE' },
  { href:'events.html',        icon:'◈',  label:'Markets',        section:'CORE' },
  { href:'saved-analysis.html',icon:'▣',  label:'Saved',          section:'CORE' },
  { href:'profile.html',       icon:'◉',  label:'Profile',        section:'ACCOUNT' },
];

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectTicker();
  markActiveNav();
  injectAccountDrawer();
});

// ── Nav injection ─────────────────────────────────────────────────────────────
function injectNav() {
  const nav = document.getElementById('side-nav');
  if (!nav) return;

  const sections = {};
  NAV_ITEMS.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const itemsHTML = Object.entries(sections).map(([sec, items]) => `
    <div class="nav-section-label">${sec}</div>
    ${items.map(item => `
      <a class="nav-item" href="${item.href}" ${item.href.startsWith('#') ? 'onclick="openInfoPage(\''+item.href.slice(1)+'\')"' : ''}>
        <span class="ni-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.label === 'Events'     ? '<span class="ni-badge">LIVE</span>' : ''}
      </a>`).join('')}
  `).join('');

  nav.innerHTML = `
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-mark">EX</div>
      <div class="nav-logo-text">EdgeX</div>
    </a>
    <div style="flex:1;overflow-y:auto;padding:8px 0;scrollbar-width:none">${itemsHTML}</div>

    <!-- Account setup status; no local-only fake authentication -->
    <div style="border-top:1px solid var(--border);padding:12px 16px 8px">
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:8px">ACCOUNT</div>
      <p id="nav-account-area" style="margin:0;color:var(--text-muted);font-size:11px;line-height:1.5">Sign-in is not enabled yet. Saved research stays in this browser.</p>
    </div>

    <!-- Contact section -->
    <div style="border-top:1px solid var(--border);padding:10px 16px">
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:8px">CONTACT</div>
      <a href="https://wa.me/" target="_blank"
        style="display:flex;align-items:center;gap:8px;padding:7px 0;color:var(--text-muted);text-decoration:none;font-size:12px;font-weight:600;transition:color .15s"
        onmouseover="this.style.color='var(--neon)'" onmouseout="this.style.color='var(--text-muted)'">
        <span>💬</span> WhatsApp
      </a>
      <a href="mailto:support@edgex.app"
        style="display:flex;align-items:center;gap:8px;padding:7px 0;color:var(--text-muted);text-decoration:none;font-size:12px;font-weight:600;transition:color .15s"
        onmouseover="this.style.color='var(--neon)'" onmouseout="this.style.color='var(--text-muted)'">
        <span>✉️</span> support@edgex.app
      </a>
    </div>

    <div class="nav-status">
      <div class="nav-dot"></div>
      <span>Provider-backed data · availability varies</span>
    </div>`;

  // Mobile: hamburger + overlay
  if (!document.querySelector('.mob-menu-btn')) {
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'nav-overlay';
    overlay.onclick = closeDrawer;
    document.body.appendChild(overlay);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'mob-menu-btn';
    menuBtn.id = 'mob-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.onclick = toggleDrawer;
    document.body.appendChild(menuBtn);
  }
}

function toggleDrawer() {
  const nav = document.getElementById('side-nav');
  const ov  = document.getElementById('nav-overlay');
  if (!nav) return;
  const open = nav.classList.toggle('open');
  ov?.classList.toggle('show', open);
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
}

// ── INFO PAGES (About, Tips, Results, Community, FAQ) ────────────────────────
function openInfoPage(page) {
  const pages = {
    about: {
      title: 'About EdgeX',
      html: `
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--neon);letter-spacing:2px;margin-bottom:10px">EDGE DETECTION PLATFORM</div>
        <p style="margin-bottom:14px">EdgeX is a research-only workspace for Sports and Markets. It displays provider-returned fixture, form, event, crypto, forex, and market context when those sources are available. Missing evidence remains unavailable; the product does not publish betting picks or trading instructions.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          ${[['⚽ Sports','Fixtures, form and event evidence'],['📊 Markets','Provider-backed market context'],['₿ Crypto','Current source values'],['↔ Forex','Current source values'],['🧭 Evidence','Data quality and sample size'],['🔍 Detail','Source-supported context']].map(([t,s])=>`
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px">
            <div style="font-weight:700;font-size:12px">${t}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">${s}</div>
          </div>`).join('')}
        </div>
        <div style="background:rgba(255,200,0,.06);border:1px solid rgba(255,200,0,.2);border-radius:var(--radius);padding:12px;font-size:12px;color:var(--yellow)">
          ⚠️ EdgeX is for research and information only. Provider data and model estimates can be incomplete or uncertain. EdgeX is for research and learning, not financial advice.
        </div>`,
    },
    tips: {
      title: 'Research Feed',
      html: buildFreeTips(),
    },
    results: {
      title: 'Results',
      html: buildResults(),
    },
    community: {
      title: 'Community',
      html: `<p style="color:var(--text-muted);margin-bottom:16px">Join the EdgeX community. Share research notes and compare evidence together.</p>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center;color:var(--text-dim)">
          <div style="font-size:32px;margin-bottom:8px">👥</div>
          <div style="font-weight:700;margin-bottom:6px">Community Coming Soon</div>
          <div style="font-size:12px">Community features are not available in this release.</div>
        </div>`,
    },
    faq: {
      title: 'FAQ',
      html: buildFAQ(),
    },
  };

  const p = pages[page];
  if (!p) return;

  // Create modal
  let modal = document.getElementById('edgex-info-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edgex-info-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:800;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(6px)';
    modal.innerHTML = `<div id="edgex-info-sheet" style="background:var(--bg2);border:1px solid var(--border);border-radius:16px 16px 0 0;padding:20px;width:100%;max-height:85vh;overflow-y:auto;position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div id="edgex-info-title" style="font-weight:800;font-size:18px"></div>
        <button onclick="document.getElementById('edgex-info-modal').remove()" style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-muted);padding:5px 10px;cursor:pointer;font-size:16px">✕</button>
      </div>
      <div id="edgex-info-body"></div>
    </div>`;
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  document.getElementById('edgex-info-title').textContent = p.title;
  document.getElementById('edgex-info-body').innerHTML = p.html;
  closeDrawer();
}

function buildFreeTips() {
  return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>Research feed unavailable</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">No provider-backed feed is connected here yet. EdgeX does not publish seeded picks, outcomes, odds, or performance claims.</p></div>`;
}

function buildResults() {
  return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>No saved research history</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">Only research you actually view or save can appear in history.</p></div>`;
}

function buildFAQ() {
  return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>Research-only platform</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">EdgeX presents provider-backed context, sample sizes, uncertainty, and model explanations. Missing evidence is shown as unavailable rather than inferred.</p></div>`;
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function injectAccountDrawer() {
  if (document.getElementById('edgex-auth-modal')) return;
  const el = document.createElement('div');
  el.id = 'edgex-auth-modal';
  el.style.cssText = 'position:fixed;inset:0;z-index:900;display:none;align-items:flex-end;background:rgba(0,0,0,.65);backdrop-filter:blur(8px)';
  el.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px 16px 0 0;padding:24px 20px 36px;width:100%;max-height:80vh;overflow-y:auto;position:relative">
      <button onclick="closeAuthModal()" style="position:absolute;top:14px;right:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-muted);padding:4px 10px;cursor:pointer;font-size:18px">✕</button>
      <div id="edgex-auth-body"></div>
    </div>`;
  el.onclick = e => { if (e.target === el) closeAuthModal(); };
  document.body.appendChild(el);
}

function openAuthModal() {
  closeDrawer();
  const modal = document.getElementById('edgex-auth-modal');
  const body = document.getElementById('edgex-auth-body');
  if (!modal || !body) return;
  body.innerHTML = `<div style="font-weight:800;font-size:20px;margin-bottom:8px">Accounts are being upgraded</div><p style="font-size:13px;color:var(--text-muted);line-height:1.6">Sign-in and synced saved research are not available yet. You can continue using public research without an account.</p>`;
  modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('edgex-auth-modal');
  if (modal) modal.style.display = 'none';
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function injectTicker() {
  const bar = document.getElementById('ticker-bar');
  if (!bar) return;
  bar.innerHTML = `<div class="ticker-track"><div class="ticker-item"><span class="t-dot"></span><span class="t-sym">MARKET DATA</span><span class="t-val">Unavailable</span><span class="t-chg">No live provider feed connected</span></div></div>`;
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
