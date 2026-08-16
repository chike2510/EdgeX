(() => {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isPublic = path === 'index.html' || path === 'landing.html' || path === '';
  const route = path.replace('.html', '') || 'home';
  const routes = [
    { href: 'home.html', label: 'Home', icon: 'home' },
    { href: 'football.html', label: 'Sports', icon: 'ball' },
    { href: 'basketball.html', label: 'Basketball', icon: 'basketball' },
    { href: 'squads.html', label: 'Player Edge', icon: 'target' },
    { href: 'events.html', label: 'Markets', icon: 'diamond' },
    { href: 'crypto.html', label: 'Crypto', icon: 'coin' },
    { href: 'forex.html', label: 'Forex', icon: 'trend' },
    { href: 'weather.html', label: 'Weather', icon: 'cloud' },
    { href: 'profile.html', label: 'Profile', icon: 'user' },
  ];
  const titleMap = { home: 'Overview', football: 'Football', basketball: 'Basketball', squads: 'Player Edge', events: 'Markets', crypto: 'Crypto', forex: 'Forex', weather: 'Weather', profile: 'Profile' };
  const icons = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-3.7 3.2-5.5 7.5-5.5s6.8 1.8 7.5 5.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 10 8-6 8 6v9H5v-9M9 19v-5h6v5"/></svg>',
    ball: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m12 8 3 2.2-1.1 3.5h-3.8L9 10.2 12 8ZM12 4v4M4.8 9.5 9 10.2M19.2 9.5 15 10.2M7.2 18l2.9-4.3M16.8 18l-2.9-4.3"/></svg>',
    basketball: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M4 12h16M12 3.5c3 2.5 3 14.5 0 17M7 5.5c2.5 1.5 7.5 1.5 10 0M7 18.5c2.5-1.5 7.5-1.5 10 0"/></svg>',
    target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.5"/></svg>',
    diamond: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 8 8-8 8-8-8 8-8Z"/><path d="m12 8 4 4-4 4-4-4 4-4Z"/></svg>',
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 6v12M9 8h3.5a2 2 0 1 1 0 4H9m0 0h4a2 2 0 1 1 0 4H9"/></svg>',
    trend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17 10 12l3 3 6-7"/><path d="M14 8h5v5"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7Z"/></svg>',
  };

  window.edgexGoBack = function (fallback = 'home.html') {
    const ref = document.referrer;
    try {
      if (ref && new URL(ref).origin === location.origin && !/\/(index|landing)\.html$/.test(new URL(ref).pathname)) {
        history.back();
        return false;
      }
    } catch (_) {}
    location.href = fallback;
    return false;
  };

  function icon(name, extra = '') { return `<span class="edgex-shell-icon ${extra}" aria-hidden="true">${icons[name] || ''}</span>`; }
  function link(item) {
    const active = item.href.replace('.html', '') === route || (route === 'events' && item.href === 'markets.html');
    return `<a class="edgex-shell-link${active ? ' is-active' : ''}" href="${item.href}" ${active ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${item.label}</span></a>`;
  }

  function mount() {
    if (isPublic || document.querySelector('.edgex-shell-bar')) return;
    document.body.classList.add('edgex-shell-page');
    document.getElementById('side-nav')?.remove();
    document.querySelectorAll('.mob-menu-btn,.nav-overlay,.mob-bottom-bar').forEach(el => el.remove());
    const shell = document.createElement('div');
    shell.id = 'edgex-global-shell';
    shell.innerHTML = `
      <header class="edgex-shell-bar">
        <button class="edgex-shell-menu" id="edgex-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false">${icons.menu}</button>
        <a class="edgex-shell-brand" href="home.html"><b>EDGE</b><em>X</em></a>
        <div class="edgex-shell-context"><span>INTELLIGENCE</span><strong>${titleMap[route] || 'EdgeX'}</strong></div>
        <div class="edgex-shell-actions"><a href="search.html" aria-label="Search">${icons.search}</a><a href="profile.html" aria-label="Profile">${icons.user}</a></div>
      </header>
      <div class="edgex-shell-scrim" id="edgex-shell-scrim"></div>
      <aside class="edgex-shell-drawer" id="edgex-shell-drawer" aria-label="Main navigation">
        <div class="edgex-shell-drawer-head"><a class="edgex-shell-brand" href="home.html"><b>EDGE</b><em>X</em></a><button id="edgex-shell-close" type="button" aria-label="Close navigation">${icons.close}</button></div>
        <p class="edgex-shell-section-label">Workspace</p><nav>${routes.slice(0, 4).map(link).join('')}</nav>
        <p class="edgex-shell-section-label">Intelligence</p><nav>${routes.slice(4, 8).map(link).join('')}</nav>
        <p class="edgex-shell-section-label">Account</p><nav>${link(routes[8])}</nav>
        <div class="edgex-shell-drawer-foot"><span class="edgex-shell-status-dot"></span><span>Live provider context</span></div>
      </aside>
      <nav class="edgex-shell-bottom" aria-label="Primary navigation">${routes.slice(0, 1).concat(routes.slice(4, 7), routes.slice(8)).map(link).join('')}</nav>`;
    document.body.prepend(shell);
    const drawer = document.getElementById('edgex-shell-drawer');
    const scrim = document.getElementById('edgex-shell-scrim');
    const menu = document.getElementById('edgex-shell-menu');
    const close = document.getElementById('edgex-shell-close');
    const setOpen = open => { drawer.classList.toggle('is-open', open); scrim.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('shell-lock', open); };
    menu.onclick = () => setOpen(true); close.onclick = () => setOpen(false); scrim.onclick = () => setOpen(false);
    drawer.querySelectorAll('a').forEach(anchor => anchor.addEventListener('click', () => setOpen(false)));
    if (new URLSearchParams(location.search).get('menu') === 'open') setOpen(true);
    document.querySelectorAll('.nav-back,.mp-back').forEach(button => { button.setAttribute('href', 'home.html'); button.setAttribute('onclick', "return window.edgexGoBack('home.html')"); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
