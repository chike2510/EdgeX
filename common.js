/* ===== EdgeX common.js ===== */

const EDGEX = {
  bankroll: parseFloat(localStorage.getItem('edgex_bankroll') || '1000'),
  journal:  JSON.parse(localStorage.getItem('edgex_journal')  || '[]'),
  acca:     JSON.parse(localStorage.getItem('edgex_acca')     || '[]'),
};

// ── All nav items (sidebar) ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { href:'index.html',          icon:'⌂',  label:'Home',           section:'MAIN' },
  { href:'football.html',       icon:'⚽', label:'Sports',         section:'SPORTS' },
  { href:'basketball.html',     icon:'🏀', label:'Basketball',     section:'SPORTS' },
  { href:'standings.html',      icon:'▤',  label:'Standings',      section:'SPORTS' },
  { href:'squads.html',         icon:'◎',  label:'Player Edge',    section:'SPORTS' },
  { href:'events.html',         icon:'◈',  label:'Markets',        section:'INTELLIGENCE' },
  { href:'crypto.html',         icon:'₿',  label:'Crypto',         section:'INTELLIGENCE' },
  { href:'forex.html',          icon:'↗',  label:'Forex',          section:'INTELLIGENCE' },
  { href:'weather.html',        icon:'☁',  label:'Weather',        section:'INTELLIGENCE' },
  { href:'saved-analysis.html', icon:'▣',  label:'Saved Analysis', section:'ACCOUNT' },
  { href:'favorites.html',     icon:'☆',  label:'Favorites',      section:'ACCOUNT' },
  { href:'notifications.html', icon:'◌',  label:'Notifications',  section:'ACCOUNT' },
  { href:'profile.html',       icon:'◉',  label:'Profile',        section:'ACCOUNT' },
  { href:'settings.html',      icon:'⚙',  label:'Settings',       section:'ACCOUNT' },
  { href:'search.html',        icon:'⌕',  label:'Search',         section:'TOOLS' },
];

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectTicker();
  markActiveNav();
  updateAccaBadge();
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
        ${item.label === 'Value Bets' ? '<span class="ni-badge">EDGE</span>' : ''}
        ${item.label === 'Free Tips'  ? '<span class="ni-badge">FREE</span>' : ''}
        ${item.label === 'Events'     ? '<span class="ni-badge">LIVE</span>' : ''}
      </a>`).join('')}
  `).join('');

  nav.innerHTML = `
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-mark">EX</div>
      <div class="nav-logo-text">EdgeX</div>
    </a>
    <div style="flex:1;overflow-y:auto;padding:8px 0;scrollbar-width:none">${itemsHTML}</div>

    <!-- Account section at bottom of sidebar -->
    <div style="border-top:1px solid var(--border);padding:12px 16px 8px">
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:8px">ACCOUNT</div>
      <div id="nav-account-area">
        <button onclick="openAuthModal('login')"
          style="width:100%;margin-bottom:6px;padding:8px;background:linear-gradient(135deg,var(--neon),var(--neon2));border:none;border-radius:var(--radius);color:#07090d;font-family:var(--font-mono);font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.5px">
          LOG IN
        </button>
        <button onclick="openAuthModal('signup')"
          style="width:100%;padding:8px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);color:var(--text-muted);font-family:var(--font-mono);font-size:10px;font-weight:700;cursor:pointer">
          SIGN UP — FREE
        </button>
      </div>
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
      <span>Live · Connected sports and market data</span>
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
        <p style="margin-bottom:14px">EdgeX is an AI-powered intelligence platform for Football, Basketball, Crypto, and Forex. It combines Poisson xG models, net rating engines, RSI/MACD signals and live multi-bookmaker odds to surface evidence-backed research signals.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          ${[['⚽ Poisson xG','Football context'],['🏀 Net Rating','Basketball analysis'],['💰 RSI + Bias','Crypto signals'],['📉 Trend','Forex context'],['🧭 Evidence','Data quality'],['🔍 Context','Research detail'],['📊 Matrix','Score context'],['⚡ APEX','Signal explanation']].map(([t,s])=>`
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px">
            <div style="font-weight:700;font-size:12px">${t}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">${s}</div>
          </div>`).join('')}
        </div>
        <div style="background:rgba(255,200,0,.06);border:1px solid rgba(255,200,0,.2);border-radius:var(--radius);padding:12px;font-size:12px;color:var(--yellow)">
          ⚠️ EdgeX is for research and information only. Signals are model-generated and do not constitute betting or financial advice. Use the platform for research and information only.
        </div>`,
    },
    tips: {
      title: 'Free Tips',
      html: buildFreeTips(),
    },
    results: {
      title: 'Results',
      html: buildResults(),
    },
    community: {
      title: 'Community',
      html: `<p style="color:var(--text-muted);margin-bottom:16px">Join the EdgeX community. Share picks, discuss models, and track results together.</p>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center;color:var(--text-dim)">
          <div style="font-size:32px;margin-bottom:8px">👥</div>
          <div style="font-weight:700;margin-bottom:6px">Community Coming Soon</div>
          <div style="font-size:12px">Forums, leaderboards and social picks are in development.</div>
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

function buildFreeTips() { return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>Research feed coming from connected providers</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">No public tip history is shown until EdgeX receives validated provider data. This surface does not fabricate picks, outcomes, odds, or performance metrics.</p></div>`;
  const tips = [
    { match:'Arsenal vs Chelsea',        league:'Premier League ⚽', pick:'Home Win',  conf:78, odds:'2.10', status:'pending' },
    { match:'Lakers vs Warriors',        league:'NBA 🏀',            pick:'Home -3.5', conf:72, odds:'1.90', status:'pending' },
    { match:'BTC/USD',                   league:'Crypto ₿',          pick:'▲ Long',    conf:81, odds:'—',    status:'pending' },
    { match:'Man City vs PSG',           league:'Champions League ⚽',pick:'Over 2.5',  conf:74, odds:'1.75', status:'won' },
    { match:'EUR/USD',                   league:'Forex 💱',           pick:'▲ Buy',     conf:67, odds:'—',    status:'won' },
    { match:'Celtics vs Heat',           league:'NBA 🏀',             pick:'Away Win',  conf:61, odds:'2.40', status:'lost' },
    { match:'Barcelona vs Atletico',     league:'La Liga ⚽',          pick:'Draw',      conf:65, odds:'3.20', status:'won' },
  ];
  const statusStyle = { won:'color:#07090d;background:var(--neon)', lost:'color:#fff;background:var(--red)', pending:'color:var(--yellow);background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.3)' };
  const won = tips.filter(t=>t.status==='won').length;
  const settled = tips.filter(t=>t.status!=='pending').length;
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--neon)">${Math.round(won/settled*100)}%</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">WIN RATE</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700">${tips.length}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">TIPS</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--neon2)">+14.2</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">AVG ODDS</div>
      </div>
    </div>
    ${tips.map(t=>`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <span style="font-weight:700;font-size:13px">${t.match}</span>
        <span style="font-family:var(--font-mono);font-size:9px;padding:2px 8px;border-radius:3px;font-weight:700;${statusStyle[t.status]}">${t.status.toUpperCase()}</span>
      </div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-bottom:6px">${t.league}</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;color:var(--text-muted)">Pick: <strong style="color:var(--text)">${t.pick}</strong>${t.odds!=='—'?' <span style=\"font-family:var(--font-mono);font-size:10px;background:var(--bg4);border:1px solid var(--border);border-radius:3px;padding:1px 6px\">@'+t.odds+'</span>':''}</span>
        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--neon2)">${t.conf}% CONF</span>
      </div>
    </div>`).join('')}`;
}

function buildResults() { return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>No connected activity history</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">Results will appear only for analysis actually generated from connected providers. EdgeX does not seed or simulate performance history.</p></div>`;
  const results = [
    { match:'Man City vs PSG',       pick:'Over 2.5',  result:'WON',  conf:74, odds:'1.75', profit:'+75'  },
    { match:'EUR/USD',               pick:'Buy',       result:'WON',  conf:67, odds:'—',    profit:'+42'  },
    { match:'Barcelona vs Atletico', pick:'Draw',      result:'WON',  conf:65, odds:'3.20', profit:'+220' },
    { match:'BTC/USD',               pick:'Long',      result:'WON',  conf:80, odds:'—',    profit:'+180' },
    { match:'Arsenal vs Chelsea',    pick:'Home Win',  result:'LOST', conf:72, odds:'2.10', profit:'-100' },
    { match:'Celtics vs Heat',       pick:'Away Win',  result:'LOST', conf:61, odds:'2.40', profit:'-100' },
  ];
  const won = results.filter(r=>r.result==='WON').length;
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--neon)">${won}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">WON</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--red)">${results.length-won}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">LOST</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700">${Math.round(won/results.length*100)}%</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px">RATE</div>
      </div>
    </div>
    ${results.map(r=>`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <span style="font-weight:700;font-size:13px">${r.match}</span>
        <span style="font-family:var(--font-mono);font-size:9px;padding:2px 8px;border-radius:3px;font-weight:700;${r.result==='WON'?'color:#07090d;background:var(--neon)':'color:#fff;background:var(--red)'}">${r.result}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;color:var(--text-muted)">Pick: <strong style="color:var(--text)">${r.pick}</strong></span>
        <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${r.result==='WON'?'var(--neon)':'var(--red)'}">${r.profit}</span>
      </div>
    </div>`).join('')}`;
}

function buildFAQ() { return `<div style="padding:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius)"><strong>Research-only platform</strong><p style="margin-top:8px;color:var(--text-muted);line-height:1.6">EdgeX presents provider-backed context and model explanations. It can research public wallet activity but does not offer wallet custody, deposits, withdrawals, brokerage, transaction signing, copy trading, or transaction execution.</p></div>`;
  const faqs = [
    { q:'What APIs power EdgeX?', a:'Football and basketball data come from SportsAPIPro. Odds come from The Odds API (8+ bookmakers). Crypto uses CoinGecko. Forex uses Alpha Vantage. Events use Polymarket.' },
    { q:'How is the APEX confidence score calculated?', a:'APEX strips bookmaker vig using margin removal, averages fair probabilities across all books (multi-book consensus), then applies H2H weighting and form adjustment. The result is a 50–94% confidence score.' },
    { q:'What is Value Edge (%)?', a:'Edge = (fair probability × offered odds − 1) × 100. A positive edge means the price is higher than our model estimates it should be — a profitable long-run bet.' },
    { q:'Is EdgeX free?', a:'Yes. EdgeX is free to use. All tips and analysis tools are available without payment.' },
    { q:'Does EdgeX guarantee winning bets?', a:'No. EdgeX provides statistical analysis only. All models carry uncertainty. Always bet responsibly and within your means.' },
  ];
  return faqs.map((f, i) => `
    <div style="border-bottom:1px solid var(--border);padding:14px 0">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
        ${i+1}. ${f.q}
      </div>
      <div style="font-size:12px;color:var(--text-muted);line-height:1.7">${f.a}</div>
    </div>`).join('');
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

function openAuthModal(type) {
  closeDrawer();
  const modal = document.getElementById('edgex-auth-modal');
  if (!modal) return;
  const isLogin = type === 'login';
  document.getElementById('edgex-auth-body').innerHTML = `
    <div style="font-weight:800;font-size:20px;margin-bottom:4px">${isLogin ? 'Welcome Back' : 'Create Account'}</div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">${isLogin ? 'Log in to save picks and track your journal.' : 'Join EdgeX free. No credit card needed.'}</div>
    <div style="margin-bottom:12px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:.8px;margin-bottom:5px;text-transform:uppercase">Email</div>
      <input id="edgex-auth-email" type="email" placeholder="you@example.com" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-size:14px;outline:none;font-family:var(--font-sans)">
    </div>
    <div style="margin-bottom:${isLogin ? '6' : '12'}px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:.8px;margin-bottom:5px;text-transform:uppercase">Password</div>
      <input id="edgex-auth-pass" type="password" placeholder="••••••••" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-size:14px;outline:none;font-family:var(--font-sans)">
    </div>
    ${!isLogin ? `<div style="margin-bottom:12px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:.8px;margin-bottom:5px;text-transform:uppercase">Your Name</div>
      <input id="edgex-auth-name" type="text" placeholder="EdgeX User" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);padding:11px 14px;color:var(--text);font-size:14px;outline:none;font-family:var(--font-sans)">
    </div>` : ''}
    <button onclick="submitAuth('${type}')"
      style="width:100%;padding:13px;background:linear-gradient(135deg,var(--neon),var(--neon2));border:none;border-radius:var(--radius);color:#07090d;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.5px;margin-top:4px">
      ${isLogin ? 'Log In' : 'Create Free Account'}
    </button>
    <div style="text-align:center;margin-top:14px;font-size:13px;color:var(--text-muted)">
      ${isLogin ? 'No account? <a onclick="openAuthModal(\'signup\')" style="color:var(--neon);cursor:pointer;font-weight:600">Sign Up</a>'
                : 'Already have one? <a onclick="openAuthModal(\'login\')" style="color:var(--neon);cursor:pointer;font-weight:600">Log In</a>'}
    </div>`;
  modal.style.display = 'flex';
}

function closeAuthModal() {
  const m = document.getElementById('edgex-auth-modal');
  if (m) m.style.display = 'none';
}

function submitAuth(type) {
  const email = document.getElementById('edgex-auth-email')?.value?.trim();
  const name  = document.getElementById('edgex-auth-name')?.value?.trim();
  if (!email) { showToast('Please enter your email'); return; }
  const displayName = name || email.split('@')[0];
  localStorage.setItem('edgex_user', JSON.stringify({ email, name: displayName }));
  closeAuthModal();
  showToast(`✓ Welcome to EdgeX, ${displayName}!`);
  // Update sidebar account area
  const area = document.getElementById('nav-account-area');
  if (area) {
    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--neon),var(--neon2));display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">👤</div>
        <div>
          <div style="font-size:12px;font-weight:700">${displayName}</div>
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--neon);margin-top:2px">FREE PLAN</div>
        </div>
      </div>
      <button onclick="logoutUser()" style="width:100%;padding:7px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-muted);font-family:var(--font-mono);font-size:9px;cursor:pointer;margin-top:4px">LOG OUT</button>`;
  }
}

function logoutUser() {
  localStorage.removeItem('edgex_user');
  showToast('Logged out');
  location.reload();
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function injectTicker() {
  const bar = document.getElementById('ticker-bar');
  if (!bar) return;
  const items = [
    {sym:'BTC',   val:'$85,240', chg:'+2.4%', pos:true},
    {sym:'ETH',   val:'$3,621',  chg:'+1.8%', pos:true},
    {sym:'SOL',   val:'$87.4',   chg:'+4.2%', pos:true},
    {sym:'XRP',   val:'$2.41',   chg:'-1.3%', pos:false},
    {sym:'BNB',   val:'$592',    chg:'+0.9%', pos:true},
    {sym:'EUR/USD',val:'1.0852', chg:'-0.12%',pos:false},
    {sym:'GBP/USD',val:'1.2681', chg:'+0.08%',pos:true},
    {sym:'GOLD',  val:'$3,085',  chg:'+0.3%', pos:true},
    {sym:'S&P',   val:'5,612',   chg:'+0.5%', pos:true},
    {sym:'NASDAQ',val:'17,840',  chg:'+0.7%', pos:true},
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
function getJournal()    { return JSON.parse(localStorage.getItem('edgex_journal') || '[]'); }
function saveJournal(j)  { localStorage.setItem('edgex_journal', JSON.stringify(j)); }

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
function getAcca()   { return JSON.parse(localStorage.getItem('edgex_acca') || '[]'); }
function saveAcca(a) { localStorage.setItem('edgex_acca', JSON.stringify(a)); }

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
function calcEV(prob, odds)        { return (prob * (odds - 1)) - (1 - prob); }
function decimalToImplied(d)       { return d > 1 ? 1/d : 0; }
function kellyFraction(prob, odds) { const b=odds-1,q=1-prob; return Math.max(0,(b*prob-q)/b); }
function edgeClass(lbl)            { return lbl==='STRONG'?'strong':lbl==='MEDIUM'?'medium':'weak'; }

// ── APEX multi-book consensus (shared across pages) ───────────────────────────
function apexFairProbs(oddsArr) {
  const vig = oddsArr.reduce((s,o) => s + (o>1?1/o:0), 0);
  return oddsArr.map(o => (o>1?1/o:0) / vig);
}

function apexConsensus(booksOdds) {
  if (!booksOdds || !booksOdds.length) return [];
  const allFair = booksOdds.map(apexFairProbs);
  const n = allFair.length, len = allFair[0].length;
  return Array.from({length:len}, (_,i) => allFair.reduce((s,f)=>s+f[i],0)/n);
}

function buildScoreMatrix(hxG, axG, maxG = 5) {
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
