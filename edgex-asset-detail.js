(() => {
  const root = document.getElementById('edgex-detail-root');
  if (!root) return;
  const type = document.body.dataset.detailType || 'crypto';
  const params = new URLSearchParams(location.search);
  const subject = params.get('symbol') || params.get('pair') || (type === 'crypto' ? 'BTC' : 'EUR/USD');
  const esc = value => window.EdgeXV2?.escape ? EdgeXV2.escape(value) : String(value ?? '');
  root.innerHTML = `<div class="edgex-v2-page-head"><div><span class="edgex-v2-eyebrow">${type === 'crypto' ? 'Crypto intelligence' : 'Forex intelligence'}</span><h1>${esc(subject)}</h1><p>Detail view uses only provider-backed values. Missing indicators and analysis remain unavailable.</p></div><a class="edgex-v2-button" href="${type === 'crypto' ? 'crypto.html' : 'forex.html'}">Back</a></div><div class="edgex-v2-state edgex-v2-state-loading"><strong>Loading ${type} detail</strong><span>Checking available market data and supported timeframes.</span></div>`;

  async function load() {
    try {
      const endpoint = type === 'crypto' ? `/api/edge-crypto?symbol=${encodeURIComponent(subject)}` : `/api/edge-forex?pair=${encodeURIComponent(subject)}`;
      const response = await fetch(endpoint); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Provider unavailable');
      const item = type === 'crypto' ? body.assets?.[0] : body.pairs?.[0];
      if (!item) throw new Error('No detail data available');
      window.EdgeXV2?.logActivity?.({ type: type === 'crypto' ? 'Crypto detail' : 'Forex detail', subject });
      const price = item.price;
      const change = item.change24h ?? item.change;
      root.querySelector('.edgex-v2-state')?.remove();
      root.insertAdjacentHTML('beforeend', `<div class="edgex-detail-grid"><section class="edgex-v2-card"><span class="edgex-v2-kicker">Current data</span><div class="edgex-market-stats"><div><small>Price</small><strong>${price == null ? 'Unavailable' : esc(price)}</strong></div><div><small>Change</small><strong>${change == null ? 'Unavailable' : esc(change)}</strong></div><div><small>Volume</small><strong>${item.volume ?? item.total_volume ?? 'Unavailable'}</strong></div></div></section><section class="edgex-v2-card"><span class="edgex-v2-kicker">Supported indicators</span><div class="edgex-v2-state"><strong>Only provider-supplied indicators are shown</strong><span>Technical indicators, macro context, news, and charts remain unavailable until the configured provider returns them.</span></div></section><section class="edgex-v2-card"><span class="edgex-v2-kicker">AI analysis</span><div class="edgex-v2-state"><strong>NO EDGE / INSUFFICIENT DATA</strong><span>EdgeX will not invent a bias or confidence from incomplete market context.</span></div></section></div>`);
    } catch (error) { root.querySelector('.edgex-v2-state').className = 'edgex-v2-state edgex-v2-state-error'; root.querySelector('.edgex-v2-state').innerHTML = `<strong>Detail data unavailable</strong><span>${esc(error.message || 'Provider unavailable')}</span><a class="edgex-v2-button" href="${type === 'crypto' ? 'crypto.html' : 'forex.html'}">Return to overview</a>`; }
  }
  load();
})();
