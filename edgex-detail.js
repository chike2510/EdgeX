(function () {
  const root = document.getElementById('edgex-detail-root'); if (!root || !window.EdgeXV2) return;
  const V = window.EdgeXV2; const type = document.body.dataset.detailType || 'analysis';
  const meta = {
    market: ['Markets Intelligence', 'Market details', 'Existing public market context, EdgeX analysis, and uncertainty in one view.'],
    player: ['Player Edge', 'Player analysis', 'Provider-backed player lines only. EdgeX never invents the line.'],
    crypto: ['Crypto Intelligence', 'Crypto asset details', 'Price, context, and AI analysis when a supported provider is connected.'],
    forex: ['Forex Intelligence', 'Forex pair details', 'Technical and macro context without broker or trade execution features.'],
    fixture: ['Sports Intelligence', 'Fixture details', 'Live fixture context, match statistics, and explainable analysis when available.'],
    league: ['Sports Intelligence', 'League details', 'Fixtures, standings, top players, and league context from supported providers.']
  }[type] || ['EdgeX Intelligence', 'Details', 'Supported provider data will appear here.'];
  root.innerHTML = `<main class="edgex-page"><div class="edgex-v2-toolbar"><div><div class="edgex-v2-eyebrow">${V.escape(meta[0])}</div><h1>${V.escape(meta[1])}</h1><p class="edgex-page-intro">${V.escape(meta[2])}</p></div><a class="edgex-v2-chip" href="index.html">Back to Home</a></div><section class="edgex-v2-grid"><article class="edgex-v2-card">${V.stateCard('loading', 'Checking supported data', 'This detail view will use the configured provider path and will not fill missing values.')}</article><article class="edgex-v2-card"><div class="edgex-v2-eyebrow">AI output</div><h3>Explainable when ready</h3><p>Verdict, confidence, reasons, uncertainties, and data quality will be shown only when the required inputs are available.</p></article><article class="edgex-v2-card"><div class="edgex-v2-eyebrow">Data policy</div><h3>No invented values</h3><p>Missing statistics, lines, probabilities, charts, and indicators remain clearly unavailable.</p></article></section></main>`;
})();
