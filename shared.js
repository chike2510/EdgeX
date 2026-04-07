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
  const hStat = (n) => parseFloat((home?.statistics||[]).find(s=>s.name===n)?.value||0);
  const aStat = (n) => parseFloat((away?.statistics||[]).find(s=>s.name===n)?.value||0);

  const hSOT = hStat('shotsOnTarget'), aSOT = aStat('shotsOnTarget');
  const hSh  = hStat('totalShots') || Math.max(hSOT*2.5, 2);
  const aSh  = aStat('totalShots') || Math.max(aSOT*2.5, 2);

  const hXG = hSOT > 0 ? (hSOT*0.33 + hSh*0.04).toFixed(2) : (0.7+Math.random()*1.0).toFixed(2);
  const aXG = aSOT > 0 ? (aSOT*0.33 + aSh*0.04).toFixed(2) : (0.6+Math.random()*0.9).toFixed(2);

  const espnProb = comp?.situation?.lastPlay?.probability?.homeWinPercentage;
  const parseRec = r => { const p=(r||'0-0-0').split('-').map(Number); return {w:p[0]||0,d:p[1]||0,l:p[2]||0}; };
  const hR = parseRec(home?.records?.[0]?.summary);
  const aR = parseRec(away?.records?.[0]?.summary);
  const hGP = hR.w+hR.d+hR.l||1, aGP = aR.w+aR.d+aR.l||1;
  const hRate = (hR.w+0.4*hR.d)/hGP, aRate = (aR.w+0.4*aR.d)/aGP;

  let hWin = espnProb != null
    ? Math.round(espnProb*100)
    : Math.round(Math.max(12, Math.min(78, (hRate*0.55 + 0.13 + parseFloat(hXG)*0.04)*100)));

  const draw = Math.round(22 + Math.random()*8);
  const aWin = Math.max(10, 100-hWin-draw);
  const o25  = Math.min(90, Math.max(18, Math.round((parseFloat(hXG)+parseFloat(aXG)) > 2 ? 63 : 40) + Math.round(Math.random()*10-5)));
  const btts = Math.max(22, Math.min(78, Math.round((parseFloat(hXG)+parseFloat(aXG))*19+17)));
  const conf = Math.round(48 + Math.random()*37);
  const edge = conf>=70?'HIGH':conf>=52?'MEDIUM':'LOW';

  return { hWin, draw, aWin: Math.max(10,aWin), hXG, aXG, o25, btts, conf, edge,
           hRec: home?.records?.[0]?.summary||'—', aRec: away?.records?.[0]?.summary||'—' };
};

// ── MARKET PREDICTOR ─────────────────────────────────────────
window.pickPredictions = function(apex) {
  const all = [];
  const hXG = parseFloat(apex.hXG), aXG = parseFloat(apex.aXG);
  const totalXG = hXG + aXG;

  // Goals markets
  if (totalXG > 1.0)   all.push({ ...window.MARKET_LIBRARY.goals[0],  prob: apex.o25, reason: `xG total ${totalXG.toFixed(2)}` });
  if (apex.btts > 50)  all.push({ ...window.MARKET_LIBRARY.goals[6],  prob: apex.btts, reason: `Both XGs positive (${hXG}/${aXG})` });
  if (apex.btts > 55)  all.push({ ...window.MARKET_LIBRARY.goals[7],  prob: Math.round(apex.btts*0.75), reason: `Strong GG + goals expected` });
  if (hXG > 0.8)       all.push({ ...window.MARKET_LIBRARY.goals[2],  prob: Math.min(88, Math.round(hXG*55+30)), reason: `Home xG ${hXG}` });
  if (aXG > 0.8)       all.push({ ...window.MARKET_LIBRARY.goals[4],  prob: Math.min(88, Math.round(aXG*55+30)), reason: `Away xG ${aXG}` });
  if (apex.draw > 25)  all.push({ ...window.MARKET_LIBRARY.goals[8],  prob: Math.round(apex.draw*1.4+30), reason: `Draw prob ${apex.draw}%` });
  if (apex.hWin > 45)  all.push({ ...window.MARKET_LIBRARY.goals[9],  prob: Math.round(apex.hWin*0.8+20), reason: `Home fav + goals` });
  if (apex.aWin > 40)  all.push({ ...window.MARKET_LIBRARY.goals[10], prob: Math.round(apex.aWin*0.8+18), reason: `Away strong + goals` });

  // Combo
  if (apex.hWin > 40 && apex.btts > 45) all.push({ ...window.MARKET_LIBRARY.combo[0], prob: Math.round((apex.hWin+apex.btts)/2+5), reason:`Home fav or GG` });
  if (apex.aWin > 38 && apex.btts > 45) all.push({ ...window.MARKET_LIBRARY.combo[1], prob: Math.round((apex.aWin+apex.btts)/2+5), reason:`Away strong or GG` });

  // Halves
  if (apex.hWin > 45)  all.push({ ...window.MARKET_LIBRARY.halves[0], prob: Math.round(apex.hWin*0.65+15), reason:`Home dominant` });
  if (apex.aWin > 42)  all.push({ ...window.MARKET_LIBRARY.halves[2], prob: Math.round(apex.aWin*0.65+14), reason:`Away strong` });

  // 1UP
  if (apex.hWin > 35)  all.push({ ...window.MARKET_LIBRARY.oneup[0],  prob: Math.round(apex.hWin*0.8+18), reason:`Home likely to lead` });
  if (apex.aWin > 32)  all.push({ ...window.MARKET_LIBRARY.oneup[1],  prob: Math.round(apex.aWin*0.8+16), reason:`Away likely to lead` });

  // Sort by prob and pick top 3
  all.sort((a,b) => b.prob - a.prob);
  return all.slice(0, 3);
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
