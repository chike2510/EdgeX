const type = document.body.dataset.assetType === 'crypto' ? 'crypto' : 'forex';
const root = document.getElementById('asset-list');
const state = document.getElementById('asset-state');
const refreshButton = document.getElementById('asset-refresh');

const esc = value => window.EdgeXV2?.escape ? window.EdgeXV2.escape(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const formatNumber = (value, digits = 6) => value == null || !Number.isFinite(Number(value)) ? 'Unavailable' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
const formatChange = value => value == null || !Number.isFinite(Number(value)) ? 'Unavailable from provider' : `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;

function render(body) {
  const records = type === 'crypto' ? body.assets : body.pairs;
  if (!Array.isArray(records) || records.length === 0) {
    root.innerHTML = '';
    state.className = 'edgex-v2-state';
    state.innerHTML = `<strong>No ${type} data available</strong><span>The configured provider returned no current values. EdgeX does not substitute sample prices or generated signals.</span>`;
    return;
  }

  const provider = esc(body.provider || 'Configured provider');
  const fetchedAt = body.fetchedAt && Number.isFinite(Date.parse(body.fetchedAt)) ? new Date(body.fetchedAt).toLocaleString() : 'Update time unavailable';
  state.className = 'edgex-v2-state';
  state.innerHTML = `<strong>${provider}</strong><span>Data fetched ${esc(fetchedAt)}. Prices and movement are provider-reported; they are not recommendations.</span>`;
  root.innerHTML = records.map(item => {
    const symbol = String(item.symbol || item.id || item.pair || 'Instrument unavailable');
    const name = String(item.name || symbol);
    const price = item.price == null ? 'Unavailable' : formatNumber(item.price, type === 'crypto' ? 6 : 7);
    const change = formatChange(item.change24h ?? item.change);
    const volume = item.volume24h ?? item.volume;
    const timestamp = item.sourceTimestamp && Number.isFinite(Date.parse(item.sourceTimestamp)) ? new Date(item.sourceTimestamp).toLocaleString() : 'Provider time unavailable';
    const detailParameter = type === 'crypto' ? 'symbol' : 'pair';
    const detailHref = `detail.html?type=${type}&${detailParameter}=${encodeURIComponent(symbol)}`;
    return `<article class="edgex-v2-card"><div class="edgex-v2-kicker">${esc(type === 'crypto' ? 'Crypto asset' : 'Forex pair')}</div><h2>${esc(symbol)}</h2><p>${esc(name)}</p><div class="edgex-market-stats"><div><small>Provider price</small><strong>${esc(price)}${type === 'crypto' && price !== 'Unavailable' ? ' USD' : ''}</strong></div><div><small>24h movement</small><strong>${esc(change)}</strong></div><div><small>Volume</small><strong>${volume == null ? 'Unavailable' : esc(formatNumber(volume, 0))}</strong></div><div><small>Provider update</small><strong>${esc(timestamp)}</strong></div></div><a class="edgex-v2-button" href="${detailHref}">View data details</a></article>`;
  }).join('');
}

async function load() {
  if (!root || !state) return;
  refreshButton.disabled = true;
  state.className = 'edgex-v2-state edgex-v2-state-loading';
  state.innerHTML = `<strong>Loading ${type} data</strong><span>Requesting current provider values.</span>`;
  root.innerHTML = '';
  const endpoint = type === 'crypto'
    ? '/api/edge-crypto?per_page=20'
    : '/api/edge-forex?symbols=EUR,GBP,JPY,CHF,NGN,NZD,CAD,AUD';
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    const body = await response.json();
    if (!response.ok) throw new Error('Provider unavailable');
    render(body);
  } catch {
    state.className = 'edgex-v2-state edgex-v2-state-error';
    state.innerHTML = `<strong>${type === 'crypto' ? 'Crypto' : 'Forex'} data unavailable</strong><span>The provider did not return a usable response. Try again later; no sample values or trading signals are shown.</span>`;
    root.innerHTML = '';
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton?.addEventListener('click', load);
load();
