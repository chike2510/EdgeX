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
    { id:'dc15',     label:'Double Chance + Over 1.5',   cat:'⚽ Goals' }, // legacy
  ],
  combo: [
    { id:'homegg',   label:'Home or GG',                  cat:'🧩 Combo' },
    { id:'awaygg',   label:'Away or GG',                  cat:'🧩 Combo' },
    { id:'dc1x15',   label:'1X (Home or Draw) + Over 1.5', cat:'🧩 Combo' },
    { id:'dcx215',   label:'X2 (Away or Draw) + Over 1.5', cat:'🧩 Combo' },
    { id:'dc1215',   label:'12 (Home or Away) + Over 1.5', cat:'🧩 Combo' },
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
window.computeAPEX = function(home, away, comp, hFormStats, aFormStats, hTeamStats, aTeamStats) {
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

  // ── Use real last-10 form stats if available ─────────────────
  const safeF = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  const hRecentWR = hFormStats ? hFormStats.wins / (hFormStats.played||1) : hWR;
  const aRecentWR = aFormStats ? aFormStats.wins / (aFormStats.played||1) : aWR;
  const hRecentDR = hFormStats ? hFormStats.draws / (hFormStats.played||1) : hDR;
  const aRecentDR = aFormStats ? aFormStats.draws / (aFormStats.played||1) : aDR;
  // Venue-specific win rates
  const hHomeWR = hFormStats ? (safeF(hFormStats.homeWR) ?? hRecentWR) : hWR;
  const aAwayWR = aFormStats ? (safeF(aFormStats.awayWR) ?? aRecentWR) : aWR;
  // Goals per game
  const hGFpg = hFormStats ? safeF(hFormStats.gfpg) : null;
  const aGFpg = aFormStats ? safeF(aFormStats.gfpg) : null;
  const hGApg = hFormStats ? safeF(hFormStats.gapg) : null;
  const aGApg = aFormStats ? safeF(aFormStats.gapg) : null;
  // Clean sheet rate
  const hCS = hFormStats ? (hFormStats.cs / (hFormStats.played||1)) : 0.22;
  const aCS = aFormStats ? (aFormStats.cs / (aFormStats.played||1)) : 0.22;
  // Momentum — last 3 results (form5 = [oldest..newest])
  const momentum = arr => {
    if (!arr || arr.length < 3) return 0.5;
    const pts = arr.slice(-3).reduce((s,r) => s+(r==='W'?2:r==='D'?1:0), 0);
    return pts / 6;
  };
  const hMomentum = momentum(hFormStats?.form5);
  const aMomentum = momentum(aFormStats?.form5);

  // ── xG calculation (venue-adjusted + cross-referenced + momentum) ──
  const calcXG = (gfpg, gapg_opp, venueWR, recentDR, mom, isHome) => {
    let base;
    if (gfpg != null && gapg_opp != null) base = (gfpg*0.60 + gapg_opp*0.40)*0.85;
    else if (gfpg != null) base = gfpg * 0.82;
    else base = (isHome?0.55:0.45) + venueWR*1.2 + recentDR*0.3;
    if (isHome) base += 0.08;
    base += (mom - 0.5) * 0.18;
    return Math.max(0.25, base);
  };
  const hXGraw = hSOT > 0 ? hSOT*0.33 + hSh*0.04
    : calcXG(hGFpg, aGApg, hHomeWR, hRecentDR, hMomentum, true);
  const aXGraw = aSOT > 0 ? aSOT*0.33 + aSh*0.04
    : calcXG(aGFpg, hGApg, aAwayWR, aRecentDR, aMomentum, false);
  // Final guard — if still NaN for any reason, use safe default
  const hXG = isNaN(hXGraw) ? '0.85' : hXGraw.toFixed(2);
  const aXG = isNaN(aXGraw) ? '0.75' : aXGraw.toFixed(2);

  const hXGn = parseFloat(hXG)||0.85, aXGn = parseFloat(aXG)||0.75;
  const totalXG = +(hXGn + aXGn).toFixed(2);

  // ── Win probabilities ─────────────────────────────────────────
  const espnProb = comp?.situation?.lastPlay?.probability?.homeWinPercentage;
  // Use recent win rate for probability if form data available
  const hWRForProb = hFormStats ? (hHomeWR*0.65 + hRecentWR*0.35) : hWR;
  const aWRForProb = aFormStats ? (aAwayWR*0.65 + aRecentWR*0.35) : aWR;
  let hWin = espnProb != null
    ? Math.round(espnProb * 100)
    : Math.round(Math.max(15, Math.min(75, (hWRForProb*52 + 13 + (hXGn-aXGn)*4))));
  if(isNaN(hWin)) hWin = 40;

  // Draw: evenly matched teams draw more — use recent form diff
  const formDiff = Math.abs(hWRForProb - aWRForProb);
  const draw = Math.round(Math.max(14, Math.min(32, 28 - formDiff*20)));
  const aWin = Math.max(10, 100 - hWin - draw);

  // ── Market probabilities (all deterministic) ─────────────────
  const o25 = Math.round(Math.max(25, Math.min(82, totalXG*28 + 12)));
  const o15 = Math.round(Math.min(92, o25 + 14));
  const btts = Math.round(Math.max(20, Math.min(78, hXGn*20 + aXGn*20 + 12 - hCS*30 - aCS*30)));
  const hO05 = Math.round(Math.min(90, hXGn*38 + 28 - aCS*20));
  const aO05 = Math.round(Math.min(88, aXGn*38 + 24 - hCS*20));

  // ── Confidence: higher when we have real recent form data ─────
  const hasData = hGP > 5 && aGP > 5;
  const hasFormData = hFormStats && aFormStats && hFormStats.played >= 5 && aFormStats.played >= 5;
  const confBase = hasFormData ? 68 : hasData ? 55 : 42;
  const conf = Math.round(Math.min(90, Math.max(confBase, confBase + (hasFormData?hFormStats.played*0.5:hGP*0.3) - formDiff*6)));
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

  // ── Team insights — use last 10 if available, else season record ──
  const hInsight = hFormStats
    ? (hFormStats.wins >= 7 ? `Excellent recent form — ${hFormStats.wins}W in last ${hFormStats.played}`
      : hFormStats.wins >= 5 ? `Good form — ${hFormStats.wins}W ${hFormStats.draws}D in last ${hFormStats.played}`
      : hFormStats.wins <= 2 ? `Poor run — only ${hFormStats.wins} wins in last ${hFormStats.played} games`
      : hFormStats.draws >= 4 ? `Draw-heavy — ${hFormStats.draws} draws, ${parseFloat(hFormStats.gfpg).toFixed(1)} goals/game`
      : `Mixed form — ${hFormStats.wins}W ${hFormStats.draws}D ${hFormStats.losses}L, scoring ${hFormStats.gfpg}/game`)
    : (hWR >= 0.55 ? 'Strong season record'
      : hWR <= 0.3 ? 'Struggling — won only '+hR.w+' of '+hGP+' games'
      : hDR/hGP >= 0.25 ? 'Draw-prone — '+hR.d+' draws this season'
      : 'Season record: '+hR.w+'W '+hR.d+'D '+hR.l+'L');

  const aInsight = aFormStats
    ? (aFormStats.wins >= 7 ? `On fire — ${aFormStats.wins} wins in last ${aFormStats.played}`
      : aFormStats.wins >= 5 ? `Good form — ${aFormStats.wins}W ${aFormStats.draws}D in last ${aFormStats.played}`
      : aFormStats.wins <= 2 ? `Struggling — ${aFormStats.wins} wins in last ${aFormStats.played} games`
      : aFormStats.draws >= 4 ? `Draw-heavy — ${aFormStats.draws} draws, conceding ${aFormStats.gapg}/game`
      : `Mixed — ${aFormStats.wins}W ${aFormStats.draws}D ${aFormStats.losses}L, scoring ${aFormStats.gfpg}/game`)
    : (aWR >= 0.55 ? 'Good season record — '+aR.w+' wins'
      : aWR <= 0.3 ? 'Poor season — just '+aR.w+' wins from '+aGP+' games'
      : aDR/aGP >= 0.25 ? 'Draws in '+Math.round(aDR/aGP*100)+'% of games'
      : 'Season record: '+aR.w+'W '+aR.d+'D '+aR.l+'L');

  // ── Match summary ────────────────────────────────────────────
  const hXGn2 = parseFloat(hXG), aXGn2 = parseFloat(aXG);
  const fav = hWin>aWin&&hWin>draw?'Home side favoured':aWin>hWin&&aWin>draw?'Away side favoured':'Evenly matched';
  const goalsO = totalXG>2.4?'high-scoring game expected':totalXG>1.8?'goals on both sides likely':totalXG>1.3?'at least one goal likely':'tight low-scoring match';
  const hMomStr2 = (hMomentum||0.5)>=0.75?'🔥 Home on W-W-W run.':(hMomentum||0.5)<=0.2?'❄️ Home on poor run.':'';
  const aMomStr2 = (aMomentum||0.5)>=0.75?'🔥 Away on W-W-W run.':(aMomentum||0.5)<=0.2?'❄️ Away on poor run.':'';
  const matchSummary = `${fav}. ${goalsO.charAt(0).toUpperCase()+goalsO.slice(1)}. ${hMomStr2||aMomStr2} (${hFormStats&&aFormStats?'Last 10 games':'Season record'})`.trim();

  // ── Corner projections ────────────────────────────────────────
  const hCornersEst = hTeamStats?.cornersForPG != null
    ? hTeamStats.cornersForPG
    : +(3.8 + hXGn2 * 1.6).toFixed(1);
  const aCornersEst = aTeamStats?.cornersForPG != null
    ? aTeamStats.cornersForPG
    : +(2.9 + aXGn2 * 1.4).toFixed(1);
  const totalCornersEst = +(parseFloat(hCornersEst) + parseFloat(aCornersEst)).toFixed(1);

  return { hWin, draw, aWin, hXG, aXG, totalXG, o25, o15, btts, hO05, aO05,
           conf, edge, top2, hInsight, aInsight, matchSummary,
           hMomentum, aMomentum, hCS, aCS,
           hCornersEst, aCornersEst, totalCornersEst,
           hRec: home?.records?.[0]?.summary||'—',
           aRec: away?.records?.[0]?.summary||'—' };
};

// ── MARKET PREDICTOR ─────────────────────────────────────────
// Returns categorised picks — one best pick per category
// Each pick has: label, cat, prob, reason, risk, insight
window.pickPredictions = function(apex) {
  const ML = window.MARKET_LIBRARY;
  // Always parse to float/int — apex values may be strings
  const hXG = parseFloat(apex.hXG) || 0;
  const aXG = parseFloat(apex.aXG) || 0;
  const totalXG = parseFloat(apex.totalXG) || (hXG + aXG);
  const hW = parseInt(apex.hWin) || 0;
  const aW = parseInt(apex.aWin) || 0;
  const dr = parseInt(apex.draw) || 0;
  const hCS = parseFloat(apex.hCS) || 0;
  const aCS = parseFloat(apex.aCS) || 0;
  const o25 = parseInt(apex.o25) || 0;
  const o15 = parseInt(apex.o15) || 0;
  const btts = parseInt(apex.btts) || 0;
  // Estimated corners per game from xG (xG drives attacking pressure)
  const hCornersEst = +(3.8 + hXG * 1.6).toFixed(1);
  const aCornersEst = +(2.9 + aXG * 1.4).toFixed(1);
  const totalCornersEst = +(hCornersEst + aCornersEst).toFixed(1);

  // Risk label from probability
  const risk = p => p >= 72 ? {riskLabel:'Low Risk', col:'#00f5a0'}
    : p >= 60 ? {riskLabel:'Medium Risk', col:'#f5a623'}
    : {riskLabel:'High Risk', col:'#ff4757'};

  // Each category picks its own best market independently
  const cats = {};

  // ── CATEGORY 1: WINNER ────────────────────────────────────────
  const winnerOpts = [];
  // Straight win markets
  if (hW >= 45) winnerOpts.push({ ...ML.goals[0], id:'hwin', label:'Home Win',
    prob: hW, reason:`Home win probability ${hW}%`,
    insight:`Home side favoured at ${hW}% — ${apex.hInsight||''}` });
  if (aW >= 40) winnerOpts.push({ ...ML.goals[0], id:'awin', label:'Away Win',
    prob: aW, reason:`Away win probability ${aW}%`,
    insight:`Away side favoured at ${aW}% — ${apex.aInsight||''}` });
  // Double Chance — safer when match is close
  if (hW >= 30 && hW <= 55) winnerOpts.push({ ...ML.goals[11], id:'dchome',
    label:'Double Chance: Home or Draw',
    prob: Math.min(88, hW + dr + 2),
    reason:`Home ${hW}% + Draw ${dr}% = ${hW+dr}% combined`,
    insight:`Close match — DC covers home win or draw. Home advantage gives the edge.` });
  if (aW >= 28 && aW <= 52) winnerOpts.push({ ...ML.goals[11], id:'dcaway',
    label:'Double Chance: Away or Draw',
    prob: Math.min(87, aW + dr + 2),
    reason:`Away ${aW}% + Draw ${dr}% = ${aW+dr}% combined`,
    insight:`Tight contest — DC protects against a draw while covering the away side.` });
  if (dr >= 26) winnerOpts.push({ ...ML.goals[0], id:'draw', label:'Draw',
    prob: dr, reason:`Evenly matched — draw probability ${dr}%`,
    insight:`Form diff is small — a draw is the most likely single outcome at ${dr}%` });
  winnerOpts.sort((a,b) => b.prob - a.prob);
  if (winnerOpts.length) cats['winner'] = { ...winnerOpts[0], cat:'🏆 Winner', ...risk(winnerOpts[0].prob) };

  // ── CATEGORY 2: OVER/UNDER GOALS ─────────────────────────────
  const goalOpts = [];
  // Over markets
  if (o25 > 52) goalOpts.push({ ...ML.goals[0], id:'over25', label:'Over 2.5 Goals',
    prob: o25, reason:`Combined xG ${totalXG.toFixed(2)}`,
    insight:`Both sides averaging goals — ${totalXG.toFixed(2)} xG total points to 3+ goals` });
  if (o15 > 65) goalOpts.push({ ...ML.goals[0], id:'over15', label:'Over 1.5 Goals',
    prob: o15, reason:`xG ${totalXG.toFixed(2)} — 2+ goals likely`,
    insight:`xG of ${totalXG.toFixed(2)} makes at least 2 goals highly probable in this fixture` });
  // Under markets — driven by clean sheets and low xG
  const u25prob = Math.round(100 - o25);
  const u15prob = Math.round(100 - o15);
  if (u25prob > 50 && (hCS >= 0.3 || aCS >= 0.3)) goalOpts.push({ ...ML.goals[0], id:'under25', label:'Under 2.5 Goals',
    prob: u25prob, reason:`Low xG ${totalXG.toFixed(2)} + defensive solidity`,
    insight:`${hCS>=0.3?`Home keeps clean sheets in ${Math.round(hCS*100)}% of games`:''} ${aCS>=0.3?`Away keeps clean sheets in ${Math.round(aCS*100)}% of games`:''}. Under 2.5 well supported.`.trim() });
  if (u15prob > 42 && totalXG < 1.4) goalOpts.push({ ...ML.goals[0], id:'under15', label:'Under 1.5 Goals',
    prob: u15prob, reason:`Very low xG ${totalXG.toFixed(2)}`,
    insight:`Extremely tight match expected — combined xG of ${totalXG.toFixed(2)} suggests a low-scoring game` });
  // GG / No GG
  if (btts > 55 && hXG > 0.72 && aXG > 0.62) goalOpts.push({ ...ML.goals[6],
    prob: btts, reason:`Both teams xG: H${hXG} / A${aXG}`,
    insight:`Home xG ${hXG} and Away xG ${aXG} — both sides creating enough to score` });
  const nogGprob = Math.round(100 - btts);
  if (nogGprob > 52 && (hCS >= 0.35 || aCS >= 0.35)) goalOpts.push({ ...ML.goals[0], id:'nogg', label:'No GG (Clean Sheet)',
    prob: nogGprob, reason:`Strong defensive record — clean sheet likely`,
    insight:`${hCS>=0.35?`Home: ${Math.round(hCS*100)}% CS rate`:aCS>=0.35?`Away: ${Math.round(aCS*100)}% CS rate`:''} — one team likely keeps a clean sheet` });
  goalOpts.sort((a,b) => b.prob - a.prob);
  if (goalOpts.length) cats['goals'] = { ...goalOpts[0], cat:'⚽ Over/Under', ...risk(goalOpts[0].prob) };

  // ── CATEGORY 3: TEAM GOALS — home/away individual lines only ──
  // 2nd Half Over 0.5 is its own separate category below
  const teamGoalOpts = [];

  // Home line — ALWAYS add both Over 0.5 and Over 1.5 when eligible
  // Over 0.5 threshold lowered — competes independently with Over 1.5
  if (hXG >= 0.60) {
    const h05prob = Math.round(Math.min(87, hXG*38+28));
    teamGoalOpts.push({ ...ML.goals[2], id:'ho05', label:'Home Over 0.5',
      prob: h05prob,
      reason:`Home xG ${hXG}`,
      insight:`Home xG of ${hXG} — highly likely to score at least once` });
  }
  if (hXG >= 1.25) {
    const h15prob = Math.round(Math.min(82, hXG*28+40));
    teamGoalOpts.push({ ...ML.goals[3], id:'ho15', label:'Home Over 1.5',
      prob: h15prob,
      reason:`Home xG ${hXG} — strong attacking output`,
      insight:`Home xG of ${hXG} — good chance of scoring 2 or more goals` });
  }
  // Away line — same approach
  if (aXG >= 0.55) {
    const a05prob = Math.round(Math.min(85, aXG*38+22));
    teamGoalOpts.push({ ...ML.goals[4], id:'ao05', label:'Away Over 0.5',
      prob: a05prob,
      reason:`Away xG ${aXG}`,
      insight:`Away xG of ${aXG} — enough to trouble the home defence` });
  }
  if (aXG >= 1.10) {
    const a15prob = Math.round(Math.min(80, aXG*28+38));
    teamGoalOpts.push({ ...ML.goals[5], id:'ao15', label:'Away Over 1.5',
      prob: a15prob,
      reason:`Away xG ${aXG} — genuine multi-goal threat`,
      insight:`Away xG of ${aXG} — expected to score more than once` });
  }

  // Sort by prob — best team line wins this category slot
  teamGoalOpts.sort((a,b) => b.prob - a.prob);
  if (teamGoalOpts.length) cats['teamgoals'] = { ...teamGoalOpts[0], cat:'🎯 Team Goals', ...risk(teamGoalOpts[0].prob) };

  // ── CATEGORY 3b: 2ND HALF — its own slot so it never blocks team lines ──
  if (totalXG > 1.4) {
    const p2h = Math.round(Math.min(88, totalXG*18+50));
    cats['secondhalf'] = { ...ML.goals[1], id:'2h05', label:'2nd Half Over 0.5',
      cat:'🕐 2nd Half', prob: p2h,
      reason:`Total xG ${totalXG.toFixed(2)} — 2nd half goal very likely`,
      insight:`Combined xG of ${totalXG.toFixed(2)} means a 2nd half goal is expected in this fixture`,
      ...risk(p2h) };
  }

  // ── CATEGORY 4: COMBO MARKETS ────────────────────────────────
  const comboOpts = [];
  if (hW > 45 && btts > 50) comboOpts.push({ ...ML.combo[0],
    prob: Math.round((hW*0.55 + btts*0.45) + 4),
    reason:`Home ${hW}% + GG ${btts}%`,
    insight:`Home win or both teams score — strong double cover for this fixture` });
  if (aW > 40 && btts > 50) comboOpts.push({ ...ML.combo[1],
    prob: Math.round((aW*0.55 + btts*0.45) + 3),
    reason:`Away ${aW}% + GG ${btts}%`,
    insight:`Away win or both score — good cover in what should be an open game` });
  if (dr > 23 && o25 > 48) comboOpts.push({ ...ML.goals[8],
    prob: Math.round(dr*0.5 + o25*0.55 + 8),
    reason:`Draw ${dr}% + Over 2.5 ${o25}%`,
    insight:`Even matchup with goals expected — Draw or Over 2.5 covers most outcomes` });
  if (hW > 48 && o25 > 46) comboOpts.push({ ...ML.goals[9],
    prob: Math.round(hW*0.55 + o25*0.45),
    reason:`Home ${hW}% or Over 2.5 ${o25}%`,
    insight:`Home side favoured in what should be a goalsy game — excellent coverage` });
  if (aW > 44 && o25 > 46) comboOpts.push({ ...ML.goals[10],
    prob: Math.round(aW*0.55 + o25*0.45),
    reason:`Away ${aW}% or Over 2.5 ${o25}%`,
    insight:`Strong away team in an open game — Away or Over 2.5 provides wide cover` });
  // ── DC + Over 1.5 proper variants ──────────────────
  // 1X (Home or Draw) + Over 1.5
  if ((hW + dr) >= 55 && o15 >= 62) {
    const p1x = Math.round((hW + dr)*0.52 + o15*0.48);
    comboOpts.push({ ...ML.combo[2], prob: p1x,
      reason:`1X: Home ${hW}% + Draw ${dr}% = ${hW+dr}% · Over 1.5 ${o15}%`,
      insight:`Home side won't lose in ${hW+dr}% of outcomes — excellent cover with goals expected` });
  }
  // X2 (Away or Draw) + Over 1.5
  if ((aW + dr) >= 52 && o15 >= 62) {
    const px2 = Math.round((aW + dr)*0.52 + o15*0.48);
    comboOpts.push({ ...ML.combo[3], prob: px2,
      reason:`X2: Away ${aW}% + Draw ${dr}% = ${aW+dr}% · Over 1.5 ${o15}%`,
      insight:`Away side won't lose in ${aW+dr}% of outcomes — solid cover with goals on the cards` });
  }
  // 12 (Home or Away, no draw) + Over 1.5
  if ((hW + aW) >= 68 && dr <= 22 && o15 >= 64) {
    const p12 = Math.round((hW + aW)*0.50 + o15*0.50);
    comboOpts.push({ ...ML.combo[4], prob: p12,
      reason:`12: H${hW}% + A${aW}% = ${hW+aW}% · Draw only ${dr}% · Over 1.5 ${o15}%`,
      insight:`Both teams capable, draw unlikely (${dr}%) — 12 + goals is strong combined signal` });
  }
  comboOpts.sort((a,b) => b.prob - a.prob);
  if (comboOpts.length) cats['combo'] = { ...comboOpts[0], cat:'🧩 Combo', ...risk(comboOpts[0].prob) };

  // ── CATEGORY 5: HALVES ────────────────────────────────────────
  const halvesOpts = [];
  if (hW > 52 && hXG > 1.0) halvesOpts.push({ ...ML.halves[0],
    prob: Math.round(hW*0.55 + 8),
    reason:`Home dominance expected — ${hW}% win prob`,
    insight:`Strong home team at ${hW}% — expected to take the lead before half time` });
  if (hW > 50 && hXG > 0.95) halvesOpts.push({ ...ML.halves[1],
    prob: Math.round(hW*0.58 + 6),
    reason:`Home team to control 2nd half`,
    insight:`Home xG of ${hXG} and form suggests they are likely to score in the 2nd period` });
  if (aW > 48 && aXG > 0.95) halvesOpts.push({ ...ML.halves[2],
    prob: Math.round(aW*0.52 + 8),
    reason:`Away side strong — ${aW}% win prob`,
    insight:`Away team at ${aW}% win rate — strong enough to take the lead by half time` });
  if (aW > 46 && aXG > 0.90) halvesOpts.push({ ...ML.halves[3],
    prob: Math.round(aW*0.55 + 6),
    reason:`Away pressing to pay off in 2nd half`,
    insight:`Away xG of ${aXG} — expect increased pressure and a 2nd half goal from them` });
  if (totalXG < 1.55 && o25 < 44) halvesOpts.push({ ...ML.halves[4],
    prob: Math.round(100 - o25 - 8),
    reason:`Low xG ${totalXG.toFixed(2)} — both halves tight`,
    insight:`Combined xG of only ${totalXG.toFixed(2)} — unlikely to see more than 1 goal in either half` });
  halvesOpts.sort((a,b) => b.prob - a.prob);
  if (halvesOpts.length) cats['halves'] = { ...halvesOpts[0], cat:'🕒 Halves', ...risk(halvesOpts[0].prob) };

  // Corners category removed by user preference

  // ── CATEGORY 7: 1UP ───────────────────────────────────────────
  const upOpts = [];
  if (hW > 38) upOpts.push({ ...ML.oneup[0],
    prob: Math.round(Math.min(80, hW*0.68 + 20)),
    reason:`Home ${hW}% win prob — likely to lead at some point`,
    insight:`With a ${hW}% win probability, the home side is expected to take the lead during the match` });
  if (aW > 34) upOpts.push({ ...ML.oneup[1],
    prob: Math.round(Math.min(78, aW*0.68 + 18)),
    reason:`Away ${aW}% win prob — likely to lead at some point`,
    insight:`Away team at ${aW}% — capable of going ahead at some point even if they don't win` });
  upOpts.sort((a,b) => b.prob - a.prob);
  if (upOpts.length) cats['oneup'] = { ...upOpts[0], cat:'🃏 1UP', ...risk(upOpts[0].prob) };

  // Return all categories as array, sorted by probability
  return Object.values(cats).sort((a,b) => b.prob - a.prob);
};

// Legacy: top 3 flat picks (used by match card strip)
window.topPicks = function(apex) {
  const all = window.pickPredictions(apex);
  return all.slice(0,3);
};


// ── FORM HELPER ──────────────────────────────────────────────
window.genForm = function(team) {
  const r = team?.records?.[0]?.summary||'';
  if(!r) return [];
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


// ═══════════════════════════════════════════════════════════════
// ── AI-POWERED APEX (Groq) ──────────────────────────────────
// Call this to enhance APEX with Groq AI narrative + deeper read
// ═══════════════════════════════════════════════════════════════
window.getAPEXAIInsight = async function(apex, homeName, awayName, competition) {
  const prompt = `You are EdgeX APEX, a research-only sports intelligence analyst. Analyze this match and give a sharp, data-driven evidence summary.

Match: ${homeName} vs ${awayName} (${competition || 'Football'})
APEX Model Output:
- Win probabilities: Home ${apex.hWin}% | Draw ${apex.draw}% | Away ${apex.aWin}%
- xG: Home ${apex.hXG} | Away ${apex.aXG} | Total ${apex.totalXG}
- Over 2.5 Goals: ${apex.o25}% | BTTS: ${apex.btts}% | Over 1.5: ${apex.o15}%
- Home form: ${apex.hInsight}
- Away form: ${apex.aInsight}
- Likely scoreline: ${apex.top2}
- Match summary: ${apex.matchSummary}

Provide a 3-sentence research insight:
1. The strongest supported signal and why (cite the data)
2. One risk factor to watch
3. Confidence verdict (HIGH/MEDIUM/LOW) with brief reason

Be sharp and concise. No filler. Max 120 words.`;

  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system: 'You are a sharp, concise sports intelligence analyst. Respond in plain text, no markdown, no bullet points. Use only supplied data and say NO EDGE when evidence is incomplete.',
        max_tokens: 300,
      }),
    });
    const data = await r.json();
    return { text: data.text || '', provider: data.provider || 'ai', error: data.error || null };
  } catch (e) {
    return { text: '', provider: null, error: e.message };
  }
};

// ═══════════════════════════════════════════════════════════════
// ── BAYSE EDGE SCORER ────────────────────────────────────────
// Compare EdgeX model probability vs Bayse market implied probability
// Returns edge classification and trade recommendation
// ═══════════════════════════════════════════════════════════════
window.scoreBayseEdge = function(modelProb, marketProb) {
  // marketProb = Bayse price (0-1 float or 1-100 percent)
  // Normalize to 0-100
  const mp = marketProb > 1 ? marketProb : marketProb * 100;
  const diff = modelProb - mp;
  const absDiff = Math.abs(diff);

  const edge = absDiff >= 15 ? 'HIGH' : absDiff >= 8 ? 'MEDIUM' : 'LOW';
  const direction = diff > 0 ? 'ABOVE_MARKET' : 'BELOW_MARKET';

  return {
    modelProb: +modelProb.toFixed(1),
    marketProb: +mp.toFixed(1),
    diff: +diff.toFixed(1),
    absDiff: +absDiff.toFixed(1),
    edge,
    direction,
    verdict: edge === 'HIGH'
      ? `Strong evidence gap — model vs market difference is ${absDiff.toFixed(0)}%. Review the supporting context.`
      : edge === 'MEDIUM'
      ? `Moderate evidence gap (${absDiff.toFixed(0)}%). Review only if other factors align.`
      : `Thin evidence gap (${absDiff.toFixed(0)}%). No clear edge until better data arrives.`,
  };
};

// Render an inline edge badge for use in any module
window.renderEdgeBadge = function(modelProb, marketProb) {
  if (marketProb == null) return '';
  const e = window.scoreBayseEdge(modelProb, marketProb);
  const col = e.edge === 'HIGH' ? 'var(--accent)' : e.edge === 'MEDIUM' ? 'var(--gold)' : 'var(--muted)';
  const bg = e.edge === 'HIGH' ? 'rgba(0,245,160,0.08)' : e.edge === 'MEDIUM' ? 'rgba(245,166,35,0.08)' : 'rgba(90,106,122,0.06)';
  return `<span style="font-size:7.5px;padding:2px 5px;border-radius:3px;background:${bg};color:${col};border:1px solid ${col}33;font-family:var(--font-mono)">
    ${e.diff > 0 ? '+' : ''}${e.diff}% · ${e.edge}
  </span>`;
};

console.log('[EdgeX] shared.js — AI APEX + Bayse Edge Scorer loaded');
