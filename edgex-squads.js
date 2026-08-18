(() => {
  const rosterGrid = document.getElementById('squad-roster-grid');
  const rosterLayer = document.getElementById('squad-roster-layer');
  const detailLayer = document.getElementById('squad-player-detail-layer');
  const selectedSummary = document.getElementById('squad-selected-summary');
  if (!rosterGrid || !rosterLayer || !detailLayer) return;

  const state = { players: [], query: '', evidence: 'all', loading: true, error: '' };
  const esc = value => window.EdgeXV2?.escape ? EdgeXV2.escape(value) : String(value ?? '');

  const keyOf = item => String(item.providerMarketId || `${item.playerId || item.playerName || 'player'}:${item.displayName || item.marketType || 'market'}:${item.line ?? 'line'}`);
  const evidenceState = item => {
    const explicit = String(item.analysisState || item.propState || item.evidenceState || '').toUpperCase();
    if (['SUPPORTED', 'LINEUP_PENDING', 'INSUFFICIENT_DATA'].includes(explicit)) return explicit;
    const availability = String(item.lineupStatus || item.availability || '').toLowerCase();
    if (availability.includes('pending') || availability.includes('questionable') || availability.includes('unknown')) return 'LINEUP_PENDING';
    const sample = Number(item.sampleSize ?? item.evidence?.sampleSize ?? item.recentAppearances ?? 0);
    return Number.isFinite(Number(item.line)) && Boolean(item.selection) && sample >= 8 ? 'SUPPORTED' : 'INSUFFICIENT_DATA';
  };
  const stateMeta = {
    SUPPORTED: { label: 'SUPPORTED', title: 'Analysis ready', copy: 'Validated player context is available.' },
    LINEUP_PENDING: { label: 'LINEUP PENDING', title: 'Waiting for availability', copy: 'The player role or participation is not confirmed.' },
    INSUFFICIENT_DATA: { label: 'INSUFFICIENT DATA', title: 'Evidence is limited', copy: 'The available sample is not strong enough for a defensible read.' },
  };
  const uniquePlayers = items => {
    const map = new Map();
    items.forEach(item => {
      const key = String(item.playerId || item.playerName || '').trim().toLowerCase();
      if (!key) return;
      const current = map.get(key);
      if (!current || evidenceState(item) === 'SUPPORTED') map.set(key, { ...item, evidenceState: evidenceState(item), marketCount: (current?.marketCount || 0) + 1 });
      else current.marketCount = (current.marketCount || 0) + 1;
    });
    return [...map.values()];
  };
  const filtered = () => state.players.filter(item => {
    const query = state.query.trim().toLowerCase();
    if (state.evidence !== 'all' && evidenceState(item) !== state.evidence) return false;
    if (query && ![item.playerName, item.team, item.opponent, item.position].some(value => String(value || '').toLowerCase().includes(query))) return false;
    return true;
  });
  const rosterCard = item => {
    const status = evidenceState(item), meta = stateMeta[status];
    const playerKey = keyOf(item);
    return `<article class="edgex-squad-roster-card edgex-squad-roster-card--${status.toLowerCase()}" data-player-key="${esc(playerKey)}"><div class="edgex-squad-roster-card-head"><div class="edgex-squad-avatar">${esc(String(item.playerName || 'P').trim().slice(0, 1).toUpperCase())}</div><div class="edgex-squad-roster-identity"><h2>${esc(item.playerName || 'Player unavailable')}</h2><p>${esc(item.team || 'Team unavailable')} ${item.position ? `· ${esc(item.position)}` : ''}</p></div><span class="edgex-player-state-badge edgex-player-state-badge--${status.toLowerCase()}" role="status">${meta.label}</span></div><div class="edgex-squad-roster-meta"><span>${esc(item.marketType || 'Market context')}</span><strong>${item.line == null ? 'Line unavailable' : `Line ${esc(item.line)}`}</strong><span>${item.marketCount || 1} market${(item.marketCount || 1) === 1 ? '' : 's'}</span></div><div class="edgex-squad-roster-copy"><strong>${meta.title}</strong><span>${meta.copy}</span></div><button class="edgex-v2-button edgex-squad-open-player" type="button" data-player-key="${esc(playerKey)}">View player</button></article>`;
  };
  const render = () => {
    if (state.loading) { rosterGrid.innerHTML = '<div class="edgex-v2-grid"><div class="edgex-v2-skeleton"></div><div class="edgex-v2-skeleton"></div><div class="edgex-v2-skeleton"></div></div>'; return; }
    if (state.error) { rosterGrid.innerHTML = `<div class="edgex-v2-state edgex-v2-state-error"><strong>Squad data unavailable</strong><span>${esc(state.error)}</span><button id="squad-retry" class="edgex-v2-button" type="button">Try again</button></div>`; document.getElementById('squad-retry')?.addEventListener('click', load); return; }
    const items = filtered();
    rosterGrid.innerHTML = items.length ? items.map(rosterCard).join('') : `<div class="edgex-v2-state"><strong>No players match this view</strong><span>Try another search or evidence filter.</span></div>`;
    rosterGrid.querySelectorAll('.edgex-squad-open-player').forEach(button => button.addEventListener('click', () => openPlayer(button.dataset.playerKey)));
  };
  const openPlayer = playerKey => {
    const item = state.players.find(candidate => keyOf(candidate) === playerKey);
    if (!item) return;
    rosterLayer.hidden = true; detailLayer.hidden = false;
    selectedSummary.innerHTML = `<span class="edgex-v2-eyebrow">Selected player</span><h1>${esc(item.playerName || 'Player unavailable')}</h1><p>${esc(item.team || 'Team unavailable')} · ${esc(item.marketType || 'Market context')}</p>`;
    window.dispatchEvent(new CustomEvent('edgex:squad-focus', { detail: { player: item } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closePlayer = () => { detailLayer.hidden = true; rosterLayer.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const load = async () => {
    state.loading = true; state.error = ''; render();
    try {
      const response = await fetch('/api/player-edge?getTrending=true');
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || body.error || 'Market data unavailable');
      state.players = uniquePlayers(Array.isArray(body.props) ? body.props : []);
    } catch (error) { state.players = []; state.error = error.message || 'Squad data unavailable'; }
    finally { state.loading = false; render(); }
  };
  document.getElementById('squad-player-search')?.addEventListener('input', event => { state.query = event.target.value; render(); });
  document.getElementById('squad-state-filter')?.addEventListener('change', event => { state.evidence = event.target.value; render(); });
  document.getElementById('squad-back-button')?.addEventListener('click', closePlayer);
  render(); load();
})();
