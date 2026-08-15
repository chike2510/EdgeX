(function () {
  'use strict';
  const V2 = window.EdgeXV2;
  if (!V2) return;
  const esc = V2.escape;

  function mountCryptoControls() {
    if (typeof COINS === 'undefined' || !document.getElementById('coin-grid')) return;
    const grid = document.getElementById('coin-grid');
    const host = document.createElement('div'); host.className = 'edgex-control-shell'; host.id = 'edgex-crypto-controls';
    grid.parentNode.insertBefore(host, grid);
    const state = { query: '', sort: 'confidence', category: 'all', minConfidence: '0' };
    host.innerHTML = `<div class="edgex-control-row"><label class="edgex-control-search"><span>⌕</span><input type="search" placeholder="Find an asset" aria-label="Find a crypto asset"></label><select class="edgex-control-select" data-control="sort" aria-label="Sort crypto assets"><option value="confidence">AI confidence</option><option value="change">24h change</option><option value="value">Market cap</option><option value="alphabetical">A–Z</option></select><button class="edgex-filter-toggle" type="button">Filters</button></div><div class="edgex-filter-panel" hidden><label>View<select data-control="category"><option value="all">All assets</option><option value="gainers">Top gainers</option><option value="losers">Top losers</option><option value="volatile">High volatility</option><option value="memecoins">Memecoin Finder</option></select></label><label>Minimum confidence<select data-control="minConfidence"><option value="0">Any confidence</option><option value="70">70%+</option><option value="80">80%+</option></select></label></div>`;
    host.querySelector('.edgex-filter-toggle').onclick = () => { const panel = host.querySelector('.edgex-filter-panel'); panel.hidden = !panel.hidden; };
    host.querySelector('[data-control="sort"]').onchange = event => { state.sort = event.target.value; render(); };
    host.querySelector('[data-control="category"]').onchange = event => { state.category = event.target.value; render(); };
    host.querySelector('[data-control="minConfidence"]').onchange = event => { state.minConfidence = event.target.value; render(); };
    host.querySelector('input').oninput = V2.debounce(event => { state.query = event.target.value; render(); });

    function data() {
      return COINS.map(coin => { const change = Number(typeof chg24 !== 'undefined' ? (chg24[coin.sym] || 0) : 0); const signal = typeof computeSignal === 'function' ? computeSignal(coin.sym) : { conf: 0, verdict: 'NO EDGE' }; return { coin, change, confidence: Number(signal.conf || 0), verdict: signal.verdict }; });
    }
    function render() {
      let rows = data().filter(row => !state.query || `${row.coin.sym} ${row.coin.name}`.toLowerCase().includes(state.query.toLowerCase())).filter(row => row.confidence >= Number(state.minConfidence));
      if (state.category === 'gainers') rows = rows.filter(row => row.change > 0).sort((a,b) => b.change-a.change);
      if (state.category === 'losers') rows = rows.filter(row => row.change < 0).sort((a,b) => a.change-b.change);
      if (state.category === 'volatile') rows = rows.sort((a,b) => Math.abs(b.change)-Math.abs(a.change));
      if (state.category === 'memecoins') rows = rows.filter(row => row.coin.category === 'memecoin');
      if (state.sort === 'confidence') rows.sort((a,b) => b.confidence-a.confidence);
      if (state.sort === 'change') rows.sort((a,b) => b.change-a.change);
      if (state.sort === 'value') rows.sort((a,b) => Number(a.coin.rank ?? Infinity)-Number(b.coin.rank ?? Infinity));
      if (state.sort === 'alphabetical') rows.sort((a,b) => a.coin.name.localeCompare(b.coin.name));
      grid.innerHTML = rows.length ? rows.map(({coin}) => `<div class="coin-card" id="cc-${esc(coin.sym)}" onclick="location.href='crypto-details.html?symbol=${encodeURIComponent(coin.sym)}'"><div class="coin-bg" style="background:radial-gradient(ellipse at top right,${coin.color}12,transparent 70%)"></div><div class="coin-head"><div class="coin-ic" style="background:${coin.color}20;color:${coin.color}">${esc(coin.ic)}</div><span class="live-chip">LIVE</span></div><div class="coin-sym">${esc(coin.sym)}</div><div class="coin-name-sm">${esc(coin.name)}</div><div class="coin-price" id="cp-${esc(coin.sym)}">—</div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px"><div class="coin-chg flat" id="cc-chg-${esc(coin.sym)}">—</div><div class="sig-dot" id="cc-sig-${esc(coin.sym)}" style="background:var(--muted)"></div></div></div>`).join('') : V2.stateCard('empty', 'No matching assets', 'Try another symbol, category, or confidence threshold.');
      rows.forEach(({coin}) => { if (typeof prices !== 'undefined' && prices[coin.sym] != null && typeof updateCoin === 'function') updateCoin(coin.sym, prices[coin.sym], typeof chg24 !== 'undefined' ? chg24[coin.sym] : null); });
    }
    render(); setInterval(render, 4000);
  }

  function mountSportsControls() {
    const content = document.getElementById('content'); if (!content) return;
    const host = document.createElement('div'); host.className = 'edgex-control-shell'; host.id = 'edgex-sports-controls'; content.parentNode.insertBefore(host, content);
    const state = { query: '', status: 'all', sort: 'confidence' };
    host.innerHTML = `<div class="edgex-control-row"><label class="edgex-control-search"><span>⌕</span><input type="search" placeholder="Find a team, competition, or fixture" aria-label="Search sports predictions"></label><select class="edgex-control-select" data-control="status" aria-label="Filter fixture status"><option value="all">All fixtures</option><option value="live">Live now</option><option value="upcoming">Upcoming</option><option value="finished">Finished</option></select><select class="edgex-control-select" data-control="sort" aria-label="Sort fixtures"><option value="confidence">Highest confidence</option><option value="name">Team name A–Z</option><option value="time">Kickoff / status</option></select></div>`;
    host.querySelector('input').oninput = V2.debounce(event => { state.query = event.target.value.toLowerCase(); apply(); });
    host.querySelector('[data-control="status"]').onchange = event => { state.status = event.target.value; apply(); };
    host.querySelector('[data-control="sort"]').onchange = event => { state.sort = event.target.value; apply(); };
    const observer = new MutationObserver(V2.debounce(apply, 80)); observer.observe(content, { childList: true, subtree: true });
    function apply() {
      const cards = Array.from(content.querySelectorAll('.mcard, .bb-card')); if (!cards.length) return;
      cards.forEach(card => { const text = card.textContent.toLowerCase(); const statusOk = state.status === 'all' || (state.status === 'live' && /live|\d+['’]\d+/.test(text)) || (state.status === 'finished' && /finished|final|ft/.test(text)) || (state.status === 'upcoming' && !/live|finished|final|ft|\d+['’]\d+/.test(text)); const queryOk = !state.query || text.includes(state.query); card.hidden = !(statusOk && queryOk); });
      const visible = cards.filter(card => !card.hidden); const parent = visible[0]?.parentElement; if (!parent || visible.some(card => card.parentElement !== parent)) return;
      visible.sort((a,b) => { const ta=a.textContent.trim(), tb=b.textContent.trim(); if(state.sort==='name') return ta.localeCompare(tb); if(state.sort==='time') return ta.slice(0,80).localeCompare(tb.slice(0,80)); const ca=Number((ta.match(/(\d{2})%/)||[])[1]||0), cb=Number((tb.match(/(\d{2})%/)||[])[1]||0); return cb-ca; }).forEach(card => parent.appendChild(card));
    }
    apply();
  }

  document.addEventListener('DOMContentLoaded', () => { mountCryptoControls(); mountSportsControls(); });
})();
