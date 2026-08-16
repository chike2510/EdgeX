(() => {
  const root = document.getElementById('edgex-detail-root');
  if (!root) return;
  const type = document.body.dataset.detailType || 'crypto';
  const params = new URLSearchParams(location.search);
  const subject = params.get('symbol') || params.get('pair') || (type === 'crypto' ? 'BTC' : 'EUR/USD');
  const esc = value => window.EdgeXV2?.escape ? EdgeXV2.escape(value) : String(value ?? '');
  const formatNumber = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? 'Unavailable' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  const formatChange = value => value == null || !Number.isFinite(Number(value)) ? 'Unavailable from provider' : `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  const apiDomain = type === 'crypto' ? 'crypto' : 'forex';
  const overviewHref = type === 'crypto' ? 'crypto.html' : 'forex.html';

  root.innerHTML = `<div class="edgex-v2-page-head"><div><span class="edgex-v2-eyebrow">${type === 'crypto' ? 'Crypto intelligence' : 'Forex intelligence'}</span><h1>${esc(subject)}</h1><p>Detail view uses only provider-backed values. Missing indicators and analysis remain unavailable.</p></div><a class="edgex-v2-button" href="${overviewHref}">Back</a></div><div class="edgex-v2-state edgex-v2-state-loading"><strong>Loading ${type} detail</strong><span>Checking available market data and supported timeframes.</span></div>`;

  async function load() {
    try {
      const endpoint = type === 'crypto' ? `/api/edge-crypto?symbol=${encodeURIComponent(subject)}` : `/api/edge-forex?pair=${encodeURIComponent(subject)}`;
      const response = await fetch(endpoint);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Provider unavailable');
      const item = type === 'crypto' ? body.assets?.[0] : body.pairs?.[0];
      if (!item) throw new Error('No detail data available');
      window.EdgeXV2?.logActivity?.({ type: type === 'crypto' ? 'Crypto detail' : 'Forex detail', subject });
      const price = item.price;
      const change = item.change24h ?? item.change;
      root.querySelector('.edgex-v2-state')?.remove();
      root.insertAdjacentHTML('beforeend', `<div class="edgex-detail-grid"><section class="edgex-v2-card"><span class="edgex-v2-kicker">Current data</span><div class="edgex-market-stats"><div><small>Price</small><strong>${price == null ? 'Unavailable' : esc(formatNumber(price, type === 'crypto' ? 4 : 5))}</strong></div><div><small>24h change</small><strong>${esc(formatChange(change))}</strong></div><div><small>Volume</small><strong>${item.volume24h == null && item.volume == null ? 'Unavailable' : esc(formatNumber(item.volume24h ?? item.volume, 0))}</strong></div><div><small>Provider update</small><strong>${item.sourceTimestamp ? esc(new Date(item.sourceTimestamp).toLocaleTimeString()) : 'Unavailable'}</strong></div></div></section><section class="edgex-v2-card"><span class="edgex-v2-kicker">Supported indicators</span><div class="edgex-v2-state"><strong>Only provider-supplied indicators are shown</strong><span>Technical indicators, macro context, news, and charts remain unavailable until the configured provider returns them.</span></div></section><section class="edgex-v2-card"><span class="edgex-v2-kicker">AI analysis</span><div class="edgex-v2-state" id="asset-ai-state"><strong>Checking provider evidence</strong><span>EdgeX will not invent a bias or confidence from incomplete market context.</span></div><div id="asset-ai-detail"></div></section></div>`);
      const result = await window.EdgeXV2?.requestAnalysis?.({ domain: apiDomain, subject: { symbol: item.symbol || subject, name: item.name || subject }, data: { provider: body.provider || item.provider || 'configured provider', symbol: item.symbol || subject, name: item.name || subject, price, change24h: change, volume24h: item.volume24h ?? item.volume, sourceTimestamp: item.sourceTimestamp } });
      if (!result) return;
      const state = document.getElementById('asset-ai-state');
      const detail = document.getElementById('asset-ai-detail');
      if (state) state.innerHTML = `<strong>${esc(result.verdict || 'Analysis returned')}</strong><span>${esc(result.dataQuality || 'Data quality unavailable')}</span>`;
      if (detail) detail.innerHTML = `<div class="edgex-v2-state"><strong>Why this read</strong><span>${esc((result.reasons || []).join(' ') || 'No supporting reasons returned.')}</span><small>${esc((result.uncertainties || []).join(' ') || 'No additional uncertainty returned.')}</small></div>`;
    } catch (error) {
      const state = root.querySelector('.edgex-v2-state');
      if (state) { state.className = 'edgex-v2-state edgex-v2-state-error'; state.innerHTML = `<strong>Detail data unavailable</strong><span>${esc(error.message || 'Provider unavailable')}</span><a class="edgex-v2-button" href="${overviewHref}">Return to overview</a>`; }
    }
  }
  load();
})();
