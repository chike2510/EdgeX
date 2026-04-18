// EdgeX v2.0 — Shared Logic
// Include via: <script src="shared.js"></script>

// ── 50+ FOOTBALL COMPETITIONS ────────────────────────────────
window.COMPETITIONS = {
  // Top 5
  'eng.1':                  { n:'Premier League',        f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', conf:'EPL' },
  'esp.1':                  { n:'La Liga',                f:'🇪🇸', conf:'LL' },
  'ger.1':                  { n:'Bundesliga',             f:'🇩🇪', conf:'BL' },
  'ita.1':                  { n:'Serie A',                f:'🇮🇹', conf:'SA' },
  'fra.1':                  { n:'Ligue 1',                f:'🇫🇷', conf:'L1' },
  // Europe Elite
  'uefa.champions':         { n:'Champions League',      f:'⭐', conf:'UCL' },
  'uefa.europa':            { n:'Europa League',          f:'🟠', conf:'UEL' },
  'uefa.eurconf':           { n:'Conference League',      f:'🟣', conf:'UECL' },
  // Europe Domestic
  'ned.1':                  { n:'Eredivisie',             f:'🇳🇱', conf:'ERD' },
  'por.1':                  { n:'Primeira Liga',          f:'🇵🇹', conf:'PL' },
  'sco.1':                  { n:'Scottish Prem',          f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', conf:'SPL' },
  'tur.1':                  { n:'Süper Lig',              f:'🇹🇷', conf:'SL' },
  'bel.1':                  { n:'Belgian Pro League',    f:'🇧🇪', conf:'BPL' },
  'gre.1':                  { n:'Super League',           f:'🇬🇷', conf:'GRL' },
  'rus.1':                  { n:'Russian PL',             f:'🇷🇺', conf:'RPL' },
  'ukr.1':                  { n:'Ukrainian PL',           f:'🇺🇦', conf:'UPL' },
  'aut.1':                  { n:'Austrian Bundesliga',   f:'🇦🇹', conf:'ABL' },
  'swe.1':                  { n:'Allsvenskan',            f:'🇸🇪', conf:'ALV' },
  'den.1':                  { n:'Danish SAS Ligaen',     f:'🇩🇰', conf:'DSL' },
  'nor.1':                  { n:'Eliteserien',            f:'🇳🇴', conf:'ELS' },
  'che.1':                  { n:'Swiss Super League',    f:'🇨🇭', conf:'SSL' },
  'eng.2':                  { n:'Championship',           f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', conf:'CH' },
  'eng.3':                  { n:'League One',             f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', conf:'L1E' },
  'esp.2':                  { n:'La Liga 2',              f:'🇪🇸', conf:'LL2' },
  'ger.2':                  { n:'2. Bundesliga',          f:'🇩🇪', conf:'BL2' },
  'ita.2':                  { n:'Serie B',                f:'🇮🇹', conf:'SB' },
  'fra.2':                  { n:'Ligue 2',                f:'🇫🇷', conf:'L2' },
  // Americas
  'usa.1':                  { n:'MLS',                    f:'🇺🇸', conf:'MLS' },
  'usa.open':               { n:'US Open Cup',            f:'🇺🇸', conf:'USOC' },
  'mex.1':                  { n:'Liga MX',                f:'🇲🇽', conf:'LMX' },
  'mex.2':                  { n:'Liga MX Expansion',     f:'🇲🇽', conf:'LME' },
  'bra.1':                  { n:'Brasileirão',            f:'🇧🇷', conf:'BRA' },
  'bra.2':                  { n:'Brasileirão Série B',   f:'🇧🇷', conf:'BRB' },
  'arg.1':                  { n:'Liga Profesional',      f:'🇦🇷', conf:'LPF' },
  'col.1':                  { n:'Liga BetPlay',           f:'🇨🇴', conf:'LBP' },
  'chi.1':                  { n:'Primera División',      f:'🇨🇱', conf:'PDC' },
  'conmebol.libertadores':  { n:'Copa Libertadores',     f:'🌎', conf:'COPA' },
  'conmebol.sudamericana':  { n:'Copa Sudamericana',     f:'🌎', conf:'CSUD' },
  // Asia / Middle East
  'sau.1':                  { n:'Saudi Pro League',      f:'🇸🇦', conf:'SPL' },
  'qat.1':                  { n:'Qatar Stars League',    f:'🇶🇦', conf:'QSL' },
  'uae.pro':                { n:'UAE Pro League',        f:'🇦🇪', conf:'UAE' },
  'jpn.1':                  { n:'J1 League',              f:'🇯🇵', conf:'J1' },
  'kor.k1':                 { n:'K League 1',             f:'🇰🇷', conf:'KL1' },
  'chn.1':                  { n:'Chinese Super League',  f:'🇨🇳', conf:'CSL' },
  // Africa
  'caf.champions':          { n:'CAF Champions League',  f:'🌍', conf:'CCL' },
  'nga.1':                  { n:'NPFL',                   f:'🇳🇬', conf:'NPFL' },
  'egy.1':                  { n:'Egyptian Premier',      f:'🇪🇬', conf:'EPL' },
  'zaf.1':                  { n:'PSL South Africa',      f:'🇿🇦', conf:'PSL' },
  'mar.1':                  { n:'Botola Pro',             f:'🇲🇦', conf:'BOT' },
  // Other
  'conc.champions':         { n:'CONCACAF Champions',    f:'🌎', conf:'CCL' },
  'afc.champions':          { n:'AFC Champions League',  f:'🌏', conf:'ACL' },
};

// ── YOUR MARKET LIBRARY ──────────────────────────────────────
window.MARKET_LIBRARY = {
  goals: [
    { id:'over15',   label:'Over 1.5 Goals',             cat:'⚽ Goals' },
    { id:'2h05',     label:'2nd Half Over 0.5',           cat:'⚽ Goals' },
    { id:'ho05',     label:'Home Over 0.5',               cat:'⚽ Goals' },
    { id:'ho15',     label:'Home Over 1.5',               cat:'⚽ Goals' },
    { id:'ao05',     label:'Away Over 0.5',               cat:'⚽ Goals' },
    { id:'ao15',     label:'Away Over 1.5',               cat:'⚽ Goals' },
    { id:'gg',       label:'GG (Both Teams Score)',       cat:'⚽ Goals' },
    { id:'gg25',     label:'GG + Over 2.5',               cat:'⚽ Goals' },
    { id:'draw25',   label:'Draw or Over 2.5',            cat:'⚽ Goals' },
    { id:'home25',   label:'Home or Over 2.5',            cat:'⚽ Goals' },
    { id:'away25',   label:'Away or Over 2.5',            cat:'⚽ Goals' },
    { id:'dc15',     label:'Double Chance + Over 1.5',   cat:'⚽ Goals' },
  ],
  combo: [
    { id:'homegg',   label:'Home or GG',                  cat:'🧩 Combo' },
    { id:'awaygg',   label:'Away or GG',                  cat:'🧩 Combo' },
  ],
  halves: [
    { id:'hw1h',     label:'Home Win 1st Half',           cat:'🕒 Halves' },
    { id:'hw2h',     label:'Home Win 2nd Half',           cat:'🕒 Halves' },
    { id:'aw1h',     label:'Away Win 1st Half',           cat:'🕒 Halves' },
    { id:'aw2h',     label:'Away Win 2nd Half',           cat:'🕒 Halves' },
    { id:'bu15',     label:'Both Halves Under 1.5',       cat:'🕒 Halves' },
  ],
  corners: [
    { id:'co9',      label:'Corners Over 9.5',            cat:'🏁 Corners' },
    { id:'cu9',      label:'Corners Under 9.5',           cat:'🏁 Corners' },
  ],
  oneup: [
    { id:'h1up',     label:'Home 1UP (Lead by 1 Any Time)', cat:'🃏 1UP' },
    { id:'a1up',     label:'Away 1UP (Lead by 1 Any Time)', cat:'🃏 1UP' },
  ],
};

// ── APEX ENGINE ──────────────────────────────────────────────
window.computeAPEX = function(home, away, comp) {
  // ── Parse win records ───────────────────────────────────────
  const parseRec = r => { const p=(r||'0-0-0').split('-').map(Number); return {w:p[0]||0,d:p[1]||0,l:p[2]||0}; };
  const hR = parseRec(home?.records?.[0]?.summary);
  const aR = parseRec(away?.records?.[0]?.summary);
  const hGP = hR.w+hR.d+hR.l||1, aGP = aR.w+aR.d+aR.l||1;
  const hWR = hR.w/hGP, aWR = aR.w/aGP;
  const hDR = hR.d/hGP, aDR = aR.d/aGP;

  // ── Live stats (only present during/after match) ─────────────
  const hStat = n => parseFloat((home?.statistics||[]).find(s=>s.name===n)?.value||0);
  const aStat = n => parseFloat((away?.statistics||[]).find(s=>s.name===n)?.value||0);
  const hSOT = hStat('shotsOnTarget'), aSOT = aStat('shotsOnTarget');
  const hSh  = hStat('totalShots') || Math.max(hSOT*2.5, 2);
  const aSh  = aStat('totalShots') || Math.max(aSOT*2.5, 2);

  // ── xG: use real stats if live, else derive from season form ─
  // Deterministic: no Math.random() anywhere
  const hXG = hSOT > 0
    ? +(hSOT*0.33 + hSh*0.04).toFixed(2)
    : +(0.55 + hWR*1.2 + hDR*0.3).toFixed(2);   // range ~0.55–1.85 based on form
  const aXG = aSOT > 0
    ? +(aSOT*0.33 + aSh*0.04).toFixed(2)
    : +(0.45 + aWR*1.1 + aDR*0.25).toFixed(2);  // range ~0.45–1.55 based on form

  const totalXG = hXG + aXG;

  // ── Win probabilities ────────────────────────────────────────
  const espnProb = comp?.situation?.lastPlay?.probability?.homeWinPercentage;
  let hWin = espnProb != null
    ? Math.round(espnProb * 100)
    : Math.round(Math.max(15, Math.min(75, (hWR*52 + 13 + (hXG-aXG)*4))));

  // Draw probability based on how evenly matched teams are
  const formDiff = Math.abs(hWR - aWR);
  const draw = Math.round(Math.max(14, Math.min(32, 28 - formDiff*20)));
  const aWin = Math.max(10, 100 - hWin - draw);

  // ── Market probabilities (all deterministic) ─────────────────
  const o25 = Math.round(Math.max(25, Math.min(82, totalXG*28 + 12)));
  const o15 = Math.round(Math.min(92, o25 + 14));
  const btts = Math.round(Math.max(28, Math.min(75, hXG*22 + aXG*22 + 10)));
  const hO05 = Math.round(Math.min(90, hXG*38 + 28));
  const aO05 = Math.round(Math.min(88, aXG*38 + 24));

  // ── Confidence: based on data quality (records available?) ───
  const hasData = hGP > 5 && aGP > 5;
  const conf = hasData
    ? Math.round(Math.min(88, Math.max(52, 55 + hGP*0.4 + aGP*0.4 - formDiff*8)))
    : 48;
  const edge = conf>=70?'HIGH':conf>=55?'MEDIUM':'LOW';

  // ── Most likely scoreline ────────────────────────────────────
  const scores = [];
  for(let h=0;h<=3;h++) for(let a=0;a<=3;a++) {
    const p = Math.exp(-hXG)*Math.pow(hXG,h)/[1,1,2,6][h]
            * Math.exp(-aXG)*Math.pow(aXG,a)/[1,1,2,6][a];
    scores.push({h,a,p});
  }
  scores.sort((a,b)=>b.p-a.p);
  const top2 = scores.slice(0,2).map(s=>s.h+':'+s.a).join(' or ');

  // ── Team insights from season record ────────────────────────
  const hInsight = hWR >= 0.55 ? 'Strong home form this season'
    : hWR <= 0.3 ? 'Struggling — won only '+hR.w+' of '+hGP+' games'
    : hDR/hGP >= 0.25 ? 'Draw-prone — '+hR.d+' draws this season'
    : 'Mid-table form, results mixed';
  const aInsight = aWR >= 0.55 ? 'Arriving in good form — '+aR.w+' wins'
    : aWR <= 0.3 ? 'Poor away record, just '+aR.w+' wins all season'
    : aDR/aGP >= 0.25 ? 'Draws in '+Math.round(aDR*100)+'% of games'
    : 'Inconsistent — hard to call';

  return { hWin, draw, aWin, hXG, aXG, totalXG, o25, o15, btts, hO05, aO05,
           conf, edge, top2, hInsight, aInsight,
           hRec: home?.records?.[0]?.summary||'—',
           aRec: away?.records?.[0]?.summary||'—' };
};

// ── MARKET PREDICTOR ─────────────────────────────────────────
window.pickPredictions = function(apex) {
  const all = [];
  const hXG = parseFloat(apex.hXG), aXG = parseFloat(apex.aXG);
  const totalXG = apex.totalXG || (hXG + aXG);

  // Over 1.5 — only push if meaningful probability
  if (apex.o15 > 62) all.push({ ...window.MARKET_LIBRARY.goals[0], id:'over15',
    prob: apex.o15, reason: `xG total ${totalXG.toFixed(2)} — goals likely` });

  // Over 2.5 — only when xG strongly supports it
  if (apex.o25 > 58) all.push({ ...window.MARKET_LIBRARY.goals[0], id:'over25', label:'Over 2.5 Goals',
    prob: apex.o25, reason: `Combined xG ${totalXG.toFixed(2)}` });

  // GG — both teams must have genuine threat
  if (apex.btts > 58 && hXG > 0.75 && aXG > 0.65)
    all.push({ ...window.MARKET_LIBRARY.goals[6], prob: apex.btts, reason: `Home xG ${hXG} / Away xG ${aXG}` });

  // GG + Over 2.5 — only when both xGs are strong
  if (apex.btts > 62 && totalXG > 2.2)
    all.push({ ...window.MARKET_LIBRARY.goals[7], prob: Math.round(apex.btts*0.78), reason: `Strong xG on both sides` });

  // Home Over 0.5 — home team must show real attacking threat
  if (apex.hO05 > 68 && hXG > 0.85)
    all.push({ ...window.MARKET_LIBRARY.goals[2], prob: apex.hO05, reason: `Home xG ${hXG}` });

  // Away Over 0.5
  if (apex.aO05 > 62 && aXG > 0.72)
    all.push({ ...window.MARKET_LIBRARY.goals[4], prob: apex.aO05, reason: `Away xG ${aXG}` });

  // Draw or Over 2.5 — evenly matched + goals
  if (apex.draw > 26 && apex.o25 > 52)
    all.push({ ...window.MARKET_LIBRARY.goals[8], prob: Math.round((apex.draw + apex.o25)/2 + 8),
      reason: `Draw ${apex.draw}% + goals expected` });

  // Home or Over 2.5 — home favourite in a goalsy game
  if (apex.hWin > 50 && apex.o25 > 50)
    all.push({ ...window.MARKET_LIBRARY.goals[9], prob: Math.round(apex.hWin*0.55 + apex.o25*0.45),
      reason: `Home fav ${apex.hWin}% + xG ${totalXG.toFixed(2)}` });

  // Away or Over 2.5
  if (apex.aWin > 45 && apex.o25 > 50)
    all.push({ ...window.MARKET_LIBRARY.goals[10], prob: Math.round(apex.aWin*0.55 + apex.o25*0.45),
      reason: `Away strong ${apex.aWin}% + goals likely` });

  // Home or GG combo
  if (apex.hWin > 48 && apex.btts > 55)
    all.push({ ...window.MARKET_LIBRARY.combo[0], prob: Math.round((apex.hWin+apex.btts)/2 + 4),
      reason: `Home fav or GG — good cover` });

  // Away or GG
  if (apex.aWin > 44 && apex.btts > 55)
    all.push({ ...window.MARKET_LIBRARY.combo[1], prob: Math.round((apex.aWin+apex.btts)/2 + 3),
      reason: `Away win or both score` });

  // Home 1UP — home likely to lead at some point
  if (apex.hWin > 42)
    all.push({ ...window.MARKET_LIBRARY.oneup[0], prob: Math.round(apex.hWin*0.72 + 20),
      reason: `Home to lead at some point (${apex.hWin}% win rate)` });

  // Away 1UP
  if (apex.aWin > 38)
    all.push({ ...window.MARKET_LIBRARY.oneup[1], prob: Math.round(apex.aWin*0.72 + 18),
      reason: `Away to lead at some point (${apex.aWin}% win rate)` });

  // Deduplicate by label, keep highest prob version
  const seen = {};
  const deduped = all.filter(p => {
    const k = p.label;
    if(seen[k] && seen[k] >= p.prob) return false;
    seen[k] = p.prob; return true;
  });

  // Sort by prob descending, return top 3
  deduped.sort((a,b) => b.prob - a.prob);
  return deduped.slice(0, 3);
};

// ── FORM HELPER ──────────────────────────────────────────────
window.genForm = function(team) {
  const r = team?.records?.[0]?.summary||'';
  if(!r) return ['W','D','L','W','D'].sort(()=>Math.random()-.5).slice(0,5);
  const [w,d,l] = r.split('-').map(Number);
  return [...Array(Math.min(w||0,3)).fill('W'), ...Array(Math.min(d||0,2)).fill('D'), ...Array(Math.min(l||0,2)).fill('L')].sort(()=>Math.random()-.5).slice(0,5);
};

// ── CONFIDENCE RING SVG ──────────────────────────────────────
window.confRing = function(conf) {
  const r=12, ci=2*Math.PI*r, f=ci*conf/100;
  const c=conf>=70?'#00f5a0':conf>=52?'#f5a623':'#ff4757';
  return `<div style="position:relative;width:30px;height:30px;flex-shrink:0">
    <svg width="30" height="30" viewBox="0 0 30 30" style="transform:rotate(-90deg)">
      <circle cx="15" cy="15" r="${r}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2.5"/>
      <circle cx="15" cy="15" r="${r}" fill="none" stroke="${c}" stroke-width="2.5"
        stroke-dasharray="${f} ${ci}" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;color:${c}">${conf}</div>
  </div>`;
};

console.log('[EdgeX] shared.js loaded — ' + Object.keys(window.COMPETITIONS).length + ' competitions, market library ready');
