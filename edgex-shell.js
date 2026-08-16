(() => {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isPublic = false;
  const route = path.replace('.html', '') || 'home';
  const routes = [
    { href: 'home.html', label: 'Home', icon: '⌂' },
    { href: 'football.html', label: 'Sports', icon: '◉' },
    { href: 'basketball.html', label: 'Basketball', icon: '◌' },
    { href: 'squads.html', label: 'Player Edge', icon: '◎' },
    { href: 'events.html', label: 'Markets', icon: '◇' },
    { href: 'crypto.html', label: 'Crypto', icon: '₿' },
    { href: 'forex.html', label: 'Forex', icon: '↗' },
    { href: 'weather.html', label: 'Weather', icon: '☁' },
    { href: 'profile.html', label: 'Profile', icon: '◉' },
  ];
  const titleMap = { home: 'Overview', football: 'Football', basketball: 'Basketball', squads: 'Player Edge', events: 'Markets', crypto: 'Crypto', forex: 'Forex', weather: 'Weather', profile: 'Profile' };

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

  function icon(item) { return `<span class="edgex-shell-icon" aria-hidden="true">${item.icon}</span>`; }
  function link(item, extra = '') {
    const active = item.href.replace('.html', '') === route || (route === 'events' && item.href === 'markets.html');
    return `<a class="edgex-shell-link${active ? ' is-active' : ''}" href="${item.href}" ${active ? 'aria-current="page"' : ''}>${icon(item)}<span>${item.label}</span></a>`;
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
        <button class="edgex-shell-menu" id="edgex-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
        <a class="edgex-shell-brand" href="home.html"><b>EDGE</b><em>X</em></a>
        <div class="edgex-shell-context"><span>INTELLIGENCE</span><strong>${titleMap[route] || 'EdgeX'}</strong></div>
        <div class="edgex-shell-actions"><a href="search.html" aria-label="Search">⌕</a><a href="profile.html" aria-label="Profile">◉</a></div>
      </header>
      <div class="edgex-shell-scrim" id="edgex-shell-scrim"></div>
      <aside class="edgex-shell-drawer" id="edgex-shell-drawer" aria-label="Main navigation">
        <div class="edgex-shell-drawer-head"><a class="edgex-shell-brand" href="home.html"><b>EDGE</b><em>X</em></a><button id="edgex-shell-close" type="button" aria-label="Close navigation">×</button></div>
        <p class="edgex-shell-section-label">Workspace</p>
        <nav>${routes.slice(0, 4).map(item => link(item)).join('')}</nav>
        <p class="edgex-shell-section-label">Intelligence</p>
        <nav>${routes.slice(4, 8).map(item => link(item)).join('')}</nav>
        <p class="edgex-shell-section-label">Account</p>
        <nav>${link(routes[8])}</nav>
        <div class="edgex-shell-drawer-foot"><span class="edgex-shell-status-dot"></span><span>Live provider context</span></div>
      </aside>
      <nav class="edgex-shell-bottom" aria-label="Primary navigation">${routes.slice(0, 1).concat(routes.slice(4, 7), routes.slice(8)).map(item => link(item)).join('')}</nav>`;
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
