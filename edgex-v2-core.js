/* EdgeX V2 shared client foundation.
 * This layer is intentionally provider-agnostic: it only normalizes UI state,
 * sorting/filtering, persistence, and presentation helpers. Provider calls stay
 * in the existing page/API flows.
 */
(function (window) {
  'use strict';

  const STORAGE = {
    favorites: 'edgex_v2_favorites',
    saved: 'edgex_v2_saved_analysis',
    settings: 'edgex_v2_settings',
    activity: 'edgex_v2_activity'
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const debounce = (fn, wait = 220) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; };

  const normalize = (item) => ({
    ...item,
    searchText: [item.name, item.symbol, item.league, item.competition, item.home, item.away, item.market, item.verdict].filter(Boolean).join(' ').toLowerCase(),
    confidenceNumber: Number(item.confidence ?? item.conf ?? 0) || 0,
    changeNumber: Number(item.change ?? item.change24h ?? 0) || 0,
    valueNumber: Number(item.value ?? item.marketCap ?? item.price ?? 0) || 0
  });

  const sortItems = (items, sort) => {
    const copy = items.map(normalize);
    const comparators = {
      confidence: (a, b) => b.confidenceNumber - a.confidenceNumber,
      change: (a, b) => b.changeNumber - a.changeNumber,
      value: (a, b) => b.valueNumber - a.valueNumber,
      alphabetical: (a, b) => a.searchText.localeCompare(b.searchText),
      recent: (a, b) => (Number(b.timestamp || b.startTime || 0) - Number(a.timestamp || a.startTime || 0))
    };
    return copy.sort(comparators[sort] || comparators.confidence);
  };

  const filterItems = (items, filters = {}) => items.map(normalize).filter(item => {
    if (filters.query && !item.searchText.includes(filters.query.trim().toLowerCase())) return false;
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.league && filters.league !== 'all' && item.league !== filters.league) return false;
    if (filters.minConfidence && item.confidenceNumber < Number(filters.minConfidence)) return false;
    if (filters.favoriteOnly && !isFavorite(item.id || item.symbol || item.name)) return false;
    return true;
  });

  const favorites = () => read(STORAGE.favorites, []);
  const isFavorite = (id) => favorites().includes(String(id));
  const toggleFavorite = (id) => {
    const key = String(id); const current = favorites();
    const next = current.includes(key) ? current.filter(item => item !== key) : current.concat(key);
    write(STORAGE.favorites, next); window.dispatchEvent(new CustomEvent('edgex:favorites-changed', { detail: next })); return next.includes(key);
  };
  const logActivity = (activity) => { const current = read(STORAGE.activity, []); const next = [{ ...activity, timestamp: activity.timestamp || Date.now() }, ...current].slice(0, 100); write(STORAGE.activity, next); return next; };
  const requestAnalysis = async ({ domain, subject, data }) => { const response = await fetch('/api/edge-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, subject, data }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Analysis unavailable'); return body; };

  const saveAnalysis = (analysis) => {
    const current = read(STORAGE.saved, []); const next = [analysis, ...current.filter(item => item.id !== analysis.id)].slice(0, 100);
    write(STORAGE.saved, next); return next;
  };

  const stateCard = (type, title, message, action) => `<div class="edgex-state edgex-state-${escape(type)}" role="status"><div class="edgex-state-icon">${type === 'loading' ? '…' : type === 'error' ? '!' : type === 'offline' ? '⌁' : '○'}</div><strong>${escape(title)}</strong><p>${escape(message)}</p>${action ? `<button class="edgex-state-action" type="button" data-edgex-action="retry">${escape(action)}</button>` : ''}</div>`;

  const mountSearch = (input, results, dataset, onSelect) => {
    if (!input || !results) return;
    const render = () => {
      const query = input.value.trim().toLowerCase();
      if (!query) { results.innerHTML = '<div class="edgex-search-hint">Search players, teams, fixtures, markets, crypto, forex, or leagues.</div>'; return; }
      const matches = dataset.map(normalize).filter(item => item.searchText.includes(query)).slice(0, 12);
      results.innerHTML = matches.length ? matches.map(item => `<button type="button" class="edgex-search-result" data-result-id="${escape(item.id || item.symbol || item.name)}"><span>${escape(item.name || item.symbol || item.home || item.question)}</span><small>${escape(item.type || item.category || '')}</small></button>`).join('') : stateCard('empty', 'No matches yet', 'Try a team, player, market, coin, or currency pair.');
      results.querySelectorAll('[data-result-id]').forEach(button => button.addEventListener('click', () => onSelect?.(button.dataset.resultId)));
    };
    input.addEventListener('input', debounce(render)); render();
  };

  const mountControls = ({ root, items, render, filters = {}, sorts = [['confidence', 'Highest confidence'], ['recent', 'Most recent'], ['alphabetical', 'A–Z']] }) => {
    if (!root) return;
    let currentFilters = { ...filters }; let currentSort = sorts[0][0];
    root.innerHTML = `<div class="edgex-control-row"><label class="edgex-control-search"><span>⌕</span><input type="search" placeholder="Search this view" aria-label="Search this view"></label><select class="edgex-control-select" aria-label="Sort results">${sorts.map(([value, label]) => `<option value="${escape(value)}">${escape(label)}</option>`).join('')}</select><button class="edgex-filter-toggle" type="button">Filters</button></div><div class="edgex-filter-panel" hidden><label>Minimum confidence<select data-filter="minConfidence"><option value="0">Any confidence</option><option value="70">70%+</option><option value="80">80%+</option><option value="90">90%+</option></select></label><label>Category<select data-filter="category"><option value="all">All categories</option><option value="football">Football</option><option value="basketball">Basketball</option><option value="crypto">Crypto</option><option value="forex">Forex</option></select></label><label>Favorites only<input type="checkbox" data-filter="favoriteOnly"></label></div>`;
    const search = root.querySelector('input[type="search"]'); const select = root.querySelector('select[aria-label]'); const panel = root.querySelector('.edgex-filter-panel');
    root.querySelector('.edgex-filter-toggle').addEventListener('click', () => { panel.hidden = !panel.hidden; });
    const update = () => render(sortItems(filterItems(items, { ...currentFilters, query: search.value }), currentSort), currentFilters);
    search.addEventListener('input', debounce(update)); select.addEventListener('change', () => { currentSort = select.value; update(); });
    root.querySelectorAll('[data-filter]').forEach(control => control.addEventListener('change', () => { currentFilters[control.dataset.filter] = control.type === 'checkbox' ? control.checked : control.value; update(); }));
    update();
  };

  window.EdgeXV2 = { STORAGE, escape, debounce, normalize, filterItems, sortItems, stateCard, mountControls, mountSearch, favorites, isFavorite, toggleFavorite, logActivity, requestAnalysis, saveAnalysis };
})(window);
