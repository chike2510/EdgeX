(() => {
  const root = document.getElementById('player-edge-root');
  if (!root) return;
  const state = { sport: '', status: '', provider: 'all', market: '', query: '', props: [], loading: false, error: '' };

  const esc = value => window.EdgeXV2?.escape ? EdgeXV2.escape(value) : String(value ?? '');
  const unavailable = label => `<span class="edgex-v2-muted">${esc(label || 'Unavailable')}</span>`;
  const itemKey = item => String(item.providerMarketId || `${item.playerId || item.playerName || 'player'}:${item.displayName || item.marketType || 'market'}:${item.line ?? 'line'}:${item.selection || 'selection'}`);

  function filters() {
    const markets = [...new Set(state.props.map(item => item.marketType).filter(Boolean))].sort();
    return `<div class="edgex-v2-toolbar edgex-player-toolbar">
      <input id="player-edge-search" type="search" placeholder="Search a player or market" value="${esc(state.query)}" aria-label="Search Player Edge">
      <select id="player-edge-sport" aria-label="Filter sport"><option value="">All sports</option><option value="football">Football</option><option value="basketball">Basketball</option></select>
      <select id="player-edge-status" aria-label="Filter status"><option value="">All timing</option><option value="upcoming">Upcoming</option><option value="live">Live</option></select>
      <select id="player-edge-provider" aria-label="Filter source"><option value="all">All sources</option><option value="squads">Player markets</option></select>
      <select id="player-edge-market" aria-label="Filter market"><option value="">All available markets</option>${markets.map(market => `<option value="${esc(market)}">${esc(market)}</option>`).join('')}</select>
    </div>`;
  }

  function currentItems() {
    const query = state.query.trim().toLowerCase();
    return state.props.filter(item => {
      if (state.sport && String(item.sport || '').toLowerCase() !== state.sport) return false;
      if (state.provider !== 'all' && item.provider !== state.provider) return false;
      if (state.market && item.marketType !== state.market) return false;
      if (query && ![item.playerName, item.team, item.opponent, item.marketType, item.displayName].some(value => String(value || '').toLowerCase().includes(query))) return false;
      if (state.status && String(item.status || '').toLowerCase().includes(state.status) === false) return false;
      return true;
    });
  }

  function propState(item) {
    const explicit = String(item.analysisState || item.propState || item.evidenceState || '').toUpperCase();
    if (['SUPPORTED', 'LINEUP_PENDING', 'INSUFFICIENT_DATA'].includes(explicit)) return explicit;
    const availability = String(item.lineupStatus || item.availability || '').toLowerCase();
    if (availability.includes('pending') || availability.includes('questionable') || availability.includes('unknown')) return 'LINEUP_PENDING';
    const line = Number.isFinite(Number(item.line)) ? Number(item.line) : null;
    const sample = Number(item.sampleSize ?? item.evidence?.sampleSize ?? item.recentAppearances ?? 0);
    return line !== null && Boolean(item.selection) && sample >= 8 ? 'SUPPORTED' : 'INSUFFICIENT_DATA';
  }

  function propStateMeta(stateName) {
    const meta = {
      SUPPORTED: { label: 'SUPPORTED', title: 'Evidence supports a player-props read', copy: 'The available data includes a usable line and enough validated player context for a deterministic projection.', action: 'View analysis' },
      LINEUP_PENDING: { label: 'LINEUP PENDING', title: 'Waiting for lineup confirmation', copy: 'No projection is shown until the player’s availability or expected role is confirmed.', action: 'Lineup required' },
      INSUFFICIENT_DATA: { label: 'INSUFFICIENT DATA', title: 'Not enough validated evidence', copy: 'A line may be available, but the recent minutes or event-level sample is not strong enough for a defensible projection.', action: 'Evidence required' },
    };
    return meta[stateName] || meta.INSUFFICIENT_DATA;
  }

  function card(item) {
    const line = Number.isFinite(Number(item.line)) ? item.line : null;
    const stateName = propState(item);
    const stateMeta = propStateMeta(stateName);
    const canAnalyze = stateName === 'SUPPORTED';
    const cardId = `player-evidence-${itemKey(item)}`;
    return `<article class="edgex-v2-card edgex-player-card edgex-player-card--${stateName.toLowerCase()}" data-prop-state="${stateName}">
      <div class="edgex-player-card-head"><div><span class="edgex-v2-kicker">Player market · ${esc(item.sport || 'Sport')}</span><h3>${esc(item.playerName || 'Player unavailable')}</h3><p>${esc(item.team || 'Team unavailable')} ${item.opponent ? `vs ${esc(item.opponent)}` : ''}</p></div><span class="edgex-v2-chip">${esc(item.status || 'Timing unavailable')}</span></div>
      <div class="edgex-player-state-row"><span class="edgex-player-state-badge edgex-player-state-badge--${stateName.toLowerCase()}" role="status" aria-label="Player prop state: ${esc(stateMeta.label)}">${stateMeta.label}</span><span class="edgex-player-state-title">${stateMeta.title}</span></div>
      <div class="edgex-player-card-grid"><div><small>Market</small><strong>${esc(item.marketType || 'Market unavailable')}</strong></div><div><small>Selection</small><strong>${esc(item.selection || 'Unavailable')}</strong></div><div><small>Line</small><strong>${line === null ? unavailable('Unavailable') : esc(line)}</strong></div><div><small>Fixture</small><strong>${item.fixtureTime ? esc(new Date(item.fixtureTime).toLocaleString()) : unavailable('Unavailable')}</strong></div></div>
      <div class="edgex-v2-state edgex-player-evidence" id="${esc(cardId)}"><strong>${stateMeta.label === 'SUPPORTED' ? 'Market context ready' : stateMeta.label === 'LINEUP PENDING' ? 'Projection paused' : 'Projection withheld'}</strong><span>${stateMeta.copy}</span><small>Market data is shown as returned; EdgeX does not replace missing player evidence with an estimate.</small></div><button class="edgex-v2-button player-analysis-button" data-player-id="${esc(itemKey(item))}" aria-describedby="${esc(cardId)}" type="button" ${canAnalyze ? '' : 'disabled'}>${stateMeta.action}</button>
    </article>`;
  }

  function render() {
    const items = currentItems();
    root.innerHTML = `<div class="edgex-v2-page-head"><div><span class="edgex-v2-eyebrow">Sports intelligence</span><h1>Player Edge</h1><p>Research real player lines from validated market data. No manual prop calculator, no invented lines.</p></div><button class="edgex-v2-button" id="player-edge-refresh" type="button">Refresh</button></div>${filters()}${state.loading ? `<div class="edgex-v2-grid">${[1,2,3].map(() => '<div class="edgex-v2-skeleton"></div>').join('')}</div>` : state.error ? `<div class="edgex-v2-state edgex-v2-state-error"><strong>Player Edge is unavailable</strong><span>${esc(state.error)}</span><button class="edgex-v2-button" id="player-edge-retry" type="button">Try again</button></div>` : items.length ? `<div class="edgex-v2-grid">${items.map(card).join('')}</div>` : `<div class="edgex-v2-state"><strong>${state.props.length ? 'No player lines match these filters' : 'No player lines available'}</strong><span>Try another filter or check back when the available market feed returns supported markets.</span></div>`}`;
    document.getElementById('player-edge-search')?.addEventListener('input', event => { state.query = event.target.value; render(); });
    document.getElementById('player-edge-sport')?.addEventListener('change', event => { state.sport = event.target.value; render(); });
    document.getElementById('player-edge-status')?.addEventListener('change', event => { state.status = event.target.value; render(); });
    document.getElementById('player-edge-provider')?.addEventListener('change', event => { state.provider = event.target.value; render(); });
    document.getElementById('player-edge-market')?.addEventListener('change', event => { state.market = event.target.value; render(); });
    document.getElementById('player-edge-refresh')?.addEventListener('click', load);
    document.getElementById('player-edge-retry')?.addEventListener('click', load);
    ['player-edge-sport','player-edge-status','player-edge-provider','player-edge-market'].forEach(id => { const element = document.getElementById(id); if (element) element.value = state[id.replace('player-edge-','')] || (id.endsWith('provider') ? 'all' : ''); });
    document.querySelectorAll('.player-analysis-button').forEach(button => button.addEventListener('click', () => { if (button.disabled) return; const item = state.props.find(candidate => itemKey(candidate) === button.dataset.playerId); if (item) showAnalysis(item); }));
  }

  async function showAnalysis(item) { const line = Number.isFinite(Number(item.line)) ? Number(item.line) : null; const selection = item.selection || 'Unavailable'; const dialog = document.createElement('dialog'); dialog.className = 'edgex-v2-dialog'; dialog.innerHTML = `<div class="edgex-v2-card"><button class="edgex-v2-dialog-close" type="button">Close</button><span class="edgex-v2-eyebrow">Player Edge analysis</span><h2>${esc(item.playerName || item.displayName || 'Player unavailable')}</h2><p>${esc(item.team || 'Team unavailable')} ${item.opponent ? `vs ${esc(item.opponent)}` : ''} · ${esc(item.displayName || item.marketType || 'Market unavailable')}</p><div class="edgex-market-stats"><div><small>Selection</small><strong>${esc(selection)}</strong></div><div><small>Reference line</small><strong>${line == null ? 'Unavailable' : esc(line)}</strong></div><div><small>Projection</small><strong id="player-ai-projection">Loading…</strong></div><div><small>Confidence</small><strong id="player-ai-confidence">Loading…</strong></div></div><div class="edgex-v2-state" id="player-ai-state"><strong>Generating a structured read</strong><span>EdgeX will use only the validated player context supplied here.</span></div><div id="player-ai-detail"></div></div>`; document.body.appendChild(dialog); dialog.querySelector('.edgex-v2-dialog-close').onclick = () => dialog.remove(); dialog.showModal(); try { const response = await fetch('/api/edge-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: 'player-edge', subject: item.playerName || item.displayName || 'Player', data: { id: item.id, playerId: item.playerId, playerName: item.playerName, team: item.team, opponent: item.opponent, sport: item.sport, marketType: item.marketType, displayName: item.displayName, line, selection, status: item.status, fixtureTime: item.fixtureTime, provider: item.provider, providerData: item } }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Analysis unavailable'); dialog.querySelector('#player-ai-projection').textContent = result.projection || 'No projection returned'; dialog.querySelector('#player-ai-confidence').textContent = result.confidence == null ? 'Not returned' : `${result.confidence}%`; dialog.querySelector('#player-ai-state').innerHTML = `<strong>${esc(result.verdict || 'Analysis returned')}</strong><span>${esc(result.dataQuality || 'Data quality unavailable')}</span>`; dialog.querySelector('#player-ai-detail').innerHTML = `<div class="edgex-v2-state"><strong>Why this read</strong><span>${esc((result.reasons || []).join(' ') || 'No supporting reasons returned.')}</span><small>${esc((result.uncertainties || []).join(' ') || 'No additional uncertainty returned.')}</small></div>`; } catch (error) { dialog.querySelector('#player-ai-state').innerHTML = `<strong>Analysis unavailable</strong><span>${esc(error.message || 'The structured analysis service could not respond.')}</span>`; dialog.querySelector('#player-ai-projection').textContent = 'No projection returned'; dialog.querySelector('#player-ai-confidence').textContent = 'Not returned'; } }

  async function load() {
    state.loading = true; state.error = ''; render();
    try { const response = await fetch('/api/player-edge?getTrending=true'); const body = await response.json(); if (!response.ok) throw new Error(body.detail || body.error || 'Market data unavailable'); state.props = Array.isArray(body.props) ? body.props : []; }
    catch (error) { state.props = []; state.error = error.message || 'Market data unavailable'; }
    finally { state.loading = false; render(); }
  }

  render(); load();
})();
