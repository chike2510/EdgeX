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
window.computeAPEX = function(home, away, comp, hFormStats, aFormStats) {
  // ── Parse season records ─────────────────────────────────────
  const parseRec = r => { const p=(r||'0-0-0').split('-').map(Number); return {w:p[0]||0,d:p[1]||0,l:p[2]||0}; };
  const hR = parseRec(home?.records?.[0]?.summary);
  const aR = parseRec(away?.records?.[0]?.summary);
  const hGP = hR.w+hR.d+hR.l||1, aGP = aR.w+aR.d+aR.l||1;
  const hWR = hR.w/hGP, aWR = aR.w/aGP;
  const hDR = hR.d/hGP, aDR = aR.d/aGP;

  // ── Live stats (shots — only meaningful during/after match) ──
  const hStat = n => parseFloat((home?.statistics||[]).find(s=>s.name===n)?.value||0);
  const aStat = n => parseFloat((away?.statistics||[]).find(s=>s.name===n)?.value||0);
  const hSOT = hStat('shotsOnTarget'), aSOT = aStat('shotsOnTarget');
  const hSh = hStat('totalShots') || Math.max(hSOT*2.5, 2);
  const aSh = aStat('totalShots') || Math.max(aSOT*2.5, 2);

  // ── Safe parse helper ────────────────────────────────────────
  const safeF = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

  // ── Form stats (from /api/form last 10 games) ────────────────
  const hRecentWR = hFormStats ? hFormStats.wins / (hFormStats.played||1) : hWR;
  const aRecentWR = aFormStats ? aFormStats.wins / (aFormStats.played||1) : aWR;
  const hRecentDR = hFormStats ? hFormStats.draws / (hFormStats.played||1) : hDR;
  const aRecentDR = aFormStats ? aFormStats.draws / (aFormStats.played||1) : aDR;

  // Venue-specific win rates — home team at home, away team away
  const hHomeWR = hFormStats ? (safeF(hFormStats.homeWR) ?? hRecentWR) : hWR;
  const aAwayWR = aFormStats ? (safeF(aFormStats.awayWR) ?? aRecentWR) : aWR;

  // Goals per game
  const hGFpg = hFormStats ? safeF(hFormStats.gfpg) : null;
  const aGFpg = aFormStats ? safeF(aFormStats.gfpg) : null;
  const hGApg = hFormStats ? safeF(hFormStats.gapg) : null;
  const aGApg = aFormStats ? safeF(aFormStats.gapg) : null;

  // Clean sheet rate — critical for BTTS accuracy
  const hCS = hFormStats ? (hFormStats.cs / (hFormStats.played||1)) : 0.25;
  const aCS = aFormStats ? (aFormStats.cs / (aFormStats.played||1)) : 0.25;

  // Momentum — weight last 3 results double (form5 = [oldest..newest])
  const momentum = arr => {
    if (!arr || arr.length < 3) return 0.5;
    const last3 = arr.slice(-3);
    const pts = last3.reduce((s,r) => s + (r==='W'?2:r==='D'?1:0), 0);
    return pts / 6; // 0=terrible, 1=perfect
  };
  const hMomentum = momentum(hFormStats?.form5);
  const aMomentum = momentum(aFormStats?.form5);

  // ── xG calculation (venue + cross-reference + momentum) ──────
  // Cross-reference: own scoring rate vs opponent's defensive weakness
  const calcXG = (gfpg, gapg_opp, recentWR, recentDR, mom, isHome) => {
    let base;
    if (gfpg != null && gapg_opp != null) {
      base = (gfpg * 0.60 + gapg_opp * 0.40) * 0.85;
    } else if (gfpg != null) {
      base = gfpg * 0.82;
    } else {
      base = (isHome ? 0.55 : 0.45) + recentWR*1.2 + recentDR*0.3;
    }
    if (isHome) base += 0.08; // home advantage
    base += (mom - 0.5) * 0.18; // momentum ±0.09
    return Math.max(0.25, base);
  };

  const hXGraw = hSOT > 0 ? hSOT*0.33 + hSh*0.04
    : calcXG(hGFpg, aGApg, hHomeWR, hRecentDR, hMomentum, true);
  const aXGraw = aSOT > 0 ? aSOT*0.33 + aSh*0.04
    : calcXG(aGFpg, hGApg, aAwayWR, aRecentDR, aMomentum, false);

  const hXG = isNaN(hXGraw) ? '0.85' : hXGraw.toFixed(2);
  const aXG = isNaN(aXGraw) ? '0.75' : aXGraw.toFixed(2);
  const hXGn = parseFloat(hXG), aXGn = parseFloat(aXG);
  const totalXG = +(hXGn + aXGn).toFixed(2);

  // ── Win probabilities (venue-adjusted + momentum) ────────────
  const espnProb = comp?.situation?.lastPlay?.probability?.homeWinPercentage;
  const hWRForProb = hFormStats ? (hHomeWR*0.65 + hRecentWR*0.35) : hWR;
  const aWRForProb = aFormStats ? (aAwayWR*0.65 + aRecentWR*0.35) : aWR;
  const hMomAdj = Math.round((hMomentum - 0.5) * 12);
  const aMomAdj = Math.round((aMomentum - 0.5) * 12);
  let hWin = espnProb != null
    ? Math.round(espnProb * 100)
    : Math.round(Math.max(12, Math.min(78,
        hWRForProb*50 + 13 + (hXGn-aXGn)*5 + hMomAdj - aMomAdj*0.5
      )));
  if (isNaN(hWin)) hWin = 40;

  const formDiff = Math.abs(hWRForProb - aWRForProb);
  const draw = Math.round(Math.max(14, Math.min(32, 28 - formDiff*20)));
  const aWin = Math.max(10, 100 - hWin - draw);

  // ── Market probabilities ──────────────────────────────────────
  const o25 = Math.round(Math.max(25, Math.min(82, totalXG*28 + 12)));
  const o15 = Math.round(Math.min(92, o25 + 14));
  // BTTS: penalise if either team keeps clean sheets regularly
  const btts = Math.round(Math.max(20, Math.min(78,
    hXGn*20 + aXGn*20 + 12 - hCS*30 - aCS*30
  )));
  const hO05 = Math.round(Math.min(90, hXGn*38 + 28 - aCS*20));
  const aO05 = Math.round(Math.min(88, aXGn*38 + 24 - hCS*20));

  // ── Confidence ───────────────────────────────────────────────
  const hasData = hGP > 5 && aGP > 5;
  const hasFormData = hFormStats && aFormStats && hFormStats.played >= 5 && aFormStats.played >= 5;
  const confBase = hasFormData ? 68 : hasData ? 55 : 42;
  const conf = Math.round(Math.min(92, Math.max(confBase,
    confBase + (hasFormData ? hFormStats.played*0.5 : hGP*0.3) - formDiff*6
  )));
  const edge = conf>=70?'HIGH':conf>=55?'MEDIUM':'LOW';

  // ── Most likely scoreline (Poisson) ─────────────────────────
  const scores = [];
  for (let h=0;h<=4;h++) for (let a=0;a<=4;a++) {
    const fact = [1,1,2,6,24][h] * [1,1,2,6,24][a];
    const p = Math.exp(-hXGn)*Math.pow(hXGn,h)/[1,1,2,6,24][h]
            * Math.exp(-aXGn)*Math.pow(aXGn,a)/[1,1,2,6,24][a];
    scores.push({h,a,p});
  }
  scores.sort((x,y) => y.p - x.p);
  const top2 = scores.slice(0,2).map(s => s.h+':'+s.a).join(' or ');

  // ── Team insights (momentum + venue + clean sheets) ──────────
  const momStr = m => m>=0.75?'🔥 W-W-W run':m<=0.2?'❄️ poor recent run':'';
  const hMomStr = momStr(hMomentum), aMomStr = momStr(aMomentum);

  const buildInsight = (fs, wr, r, gp, dr, isHome, cs, gfpg, momS, venueWR) => {
    if (!fs) {
      return wr >= 0.55 ? `Strong season — ${r.w}W from ${gp} games`
        : wr <= 0.3 ? `Struggling — only ${r.w}W from ${gp} games`
        : dr/gp >= 0.25 ? `Draw-prone — ${r.d} draws this season`
        : `Season: ${r.w}W ${r.d}D ${r.l}L`;
    }
    const base = fs.wins >= 7 ? `Excellent form — ${fs.wins}W in last ${fs.played}`
      : fs.wins >= 5 ? `Good form — ${fs.wins}W ${fs.draws}D in last ${fs.played}`
      : fs.wins <= 2 ? `Poor run — only ${fs.wins}W in last ${fs.played}`
      : fs.draws >= 4 ? `Draw-prone — ${fs.draws} draws in last ${fs.played}`
      : `Mixed — ${fs.wins}W ${fs.draws}D ${fs.losses}L`;
    const extras = [];
    if (momS) extras.push(momS);
    if (cs >= 0.3) extras.push(`${fs.cs} clean sheets`);
    if (gfpg >= 1.8) extras.push(`scoring ${fs.gfpg}/game`);
    const vWR = parseFloat(venueWR);
    if (isHome && vWR >= 0.6) extras.push(`strong at home (${Math.round(vWR*100)}%)`);
    if (!isHome && !isNaN(vWR) && vWR <= 0.25) extras.push(`weak away (${Math.round(vWR*100)}%)`);
    return base + (extras.length ? ` · ${extras.join(', ')}` : '');
  };

  const hInsight = buildInsight(hFormStats, hWR, hR, hGP, hDR, true, hCS, hGFpg, hMomStr, hFormStats?.homeWR);
  const aInsight = buildInsight(aFormStats, aWR, aR, aGP, aDR, false, aCS, aGFpg, aMomStr, aFormStats?.awayWR);

  // ── Match summary sentence ────────────────────────────────────
  const fav = hWin>aWin&&hWin>draw?'Home side favoured':aWin>hWin&&aWin>draw?'Away side favoured':'Evenly matched';
  const goalsO = totalXG>2.4?'high-scoring game expected':totalXG>1.8?'goals on both sides likely':totalXG>1.3?'at least one goal likely':'tight low-scoring match';
  const momNote = hMomStr ? `Home: ${hMomStr}.` : aMomStr ? `Away: ${aMomStr}.` : '';
  const matchSummary = `${fav}. ${goalsO.charAt(0).toUpperCase()+goalsO.slice(1)}. ${momNote} (${hasFormData?'Last 10 games':'Season record'})`.trim();

  return { hWin, draw, aWin, hXG, aXG, totalXG, o25, o15, btts, hO05, aO05,
           conf, edge, top2, hInsight, aInsight, matchSummary,
           hMomentum, aMomentum, hCS, aCS,
           hRec: home?.records?.[0]?.summary||'—',
           aRec: away?.records?.[0]?.summary||'—' };
};

// ── MARKET PREDICTOR ─────────────────────────────────────────
window.pickPredictions = function(apex) {
  const ML = window.MARKET_LIBRARY;
  const all = [];
  const hXG = parseFloat(apex.hXG) || 0;
  const aXG = parseFloat(apex.aXG) || 0;
  const totalXG = hXG + aXG;
  const hW = apex.hWin || 0;
  const aW = apex.aWin || 0;
  const dr = apex.draw || 0;

  // ── TEAM OVER LINES — scale with xG strength ─────────────────
  // Home: pick Over 1.5 if xG >= 1.4, Over 0.5 if xG >= 0.85
  if (hXG >= 1.4)
    all.push({ ...ML.goals[3], prob: Math.round(Math.min(85, hXG*28+45)),
      reason: `Home xG ${hXG} — strong attacking output` });
  else if (hXG >= 0.85)
    all.push({ ...ML.goals[2], prob: Math.round(Math.min(82, hXG*38+28)),
      reason: `Home xG ${hXG}` });

  // Away: pick Over 1.5 if xG >= 1.2, Over 0.5 if xG >= 0.72
  if (aXG >= 1.2)
    all.push({ ...ML.goals[5], prob: Math.round(Math.min(82, aXG*28+42)),
      reason: `Away xG ${aXG} — genuine goal threat` });
  else if (aXG >= 0.72)
    all.push({ ...ML.goals[4], prob: Math.round(Math.min(80, aXG*38+24)),
      reason: `Away xG ${aXG}` });

  // ── TOTAL GOALS LINES ─────────────────────────────────────────
  // Over 2.5 — needs strong combined xG
  if (apex.o25 > 55)
    all.push({ ...ML.goals[0], label:'Over 2.5 Goals', id:'over25',
      prob: apex.o25, reason: `Combined xG ${totalXG.toFixed(2)}` });

  // Over 1.5 — only add if Over 2.5 not already dominant pick
  if (apex.o15 > 68 && apex.o25 <= 55)
    all.push({ ...ML.goals[0], label:'Over 1.5 Goals', id:'over15',
      prob: apex.o15, reason: `xG ${totalXG.toFixed(2)} — at least 2 goals likely` });

  // 2nd Half Over 0.5 — most games have a 2nd half goal
  if (totalXG > 1.6)
    all.push({ ...ML.goals[1], prob: Math.round(Math.min(88, totalXG*20+52)),
      reason: `Total xG ${totalXG.toFixed(2)} — 2nd half goal very likely` });

  // ── GG MARKETS ────────────────────────────────────────────────
  // GG — both teams need real threat
  if (apex.btts > 55 && hXG > 0.72 && aXG > 0.62)
    all.push({ ...ML.goals[6], prob: apex.btts,
      reason: `Home xG ${hXG} / Away xG ${aXG} — both attacking` });

  // GG + Over 2.5 — high scoring game expected
  if (apex.btts > 60 && totalXG > 2.0)
    all.push({ ...ML.goals[7], prob: Math.round(apex.btts * 0.80),
      reason: `xG ${totalXG.toFixed(2)} + both teams scoring` });

  // ── RESULT-BASED COMBO MARKETS ────────────────────────────────
  // Draw or Over 2.5 — close match with goals
  if (dr > 24 && apex.o25 > 50)
    all.push({ ...ML.goals[8], prob: Math.round(dr*0.5 + apex.o25*0.6 + 8),
      reason: `Even match (draw ${dr}%) in goalsy game` });

  // Home or Over 2.5
  if (hW > 48 && apex.o25 > 48)
    all.push({ ...ML.goals[9], prob: Math.round(hW*0.55 + apex.o25*0.45),
      reason: `Home fav ${hW}% + goals expected` });

  // Away or Over 2.5
  if (aW > 44 && apex.o25 > 48)
    all.push({ ...ML.goals[10], prob: Math.round(aW*0.55 + apex.o25*0.45),
      reason: `Away strong ${aW}% + goals likely` });

  // Double Chance + Over 1.5 — one-sided match with goals
  if ((hW > 55 || aW > 50) && apex.o15 > 65)
    all.push({ ...ML.goals[11], prob: Math.round(Math.max(hW,aW)*0.45 + apex.o15*0.55),
      reason: `Clear favourite + goals market` });

  // ── COMBO MARKETS ─────────────────────────────────────────────
  // Home or GG
  if (hW > 45 && apex.btts > 52)
    all.push({ ...ML.combo[0], prob: Math.round((hW + apex.btts)/2 + 5),
      reason: `Home win or both score — solid cover` });

  // Away or GG
  if (aW > 40 && apex.btts > 52)
    all.push({ ...ML.combo[1], prob: Math.round((aW + apex.btts)/2 + 4),
      reason: `Away win or both score` });

  // ── HALVES MARKETS ────────────────────────────────────────────
  // Home Win 1st Half — dominant home team
  if (hW > 55 && hXG > 1.1)
    all.push({ ...ML.halves[0], prob: Math.round(hW * 0.55 + 10),
      reason: `Strong home team (${hW}% win) likely to lead at HT` });

  // Home Win 2nd Half
  if (hW > 52 && hXG > 1.0)
    all.push({ ...ML.halves[1], prob: Math.round(hW * 0.58 + 8),
      reason: `Home dominance expected to continue` });

  // Away Win 1st Half
  if (aW > 50 && aXG > 1.0)
    all.push({ ...ML.halves[2], prob: Math.round(aW * 0.52 + 10),
      reason: `Strong away team (${aW}% win)` });

  // Away Win 2nd Half
  if (aW > 48 && aXG > 0.95)
    all.push({ ...ML.halves[3], prob: Math.round(aW * 0.55 + 8),
      reason: `Away pressing likely to produce in 2nd half` });

  // Both Halves Under 1.5 — low scoring match
  if (totalXG < 1.6 && apex.o25 < 42)
    all.push({ ...ML.halves[4], prob: Math.round(100 - apex.o25 - 10),
      reason: `Low xG ${totalXG.toFixed(2)} — tight match expected` });

  // ── CORNERS MARKETS ───────────────────────────────────────────
  // Corners Over 9.5 — high xG teams force more corners
  if (totalXG > 2.2 || (hW > 55 && hXG > 1.3))
    all.push({ ...ML.corners[0], prob: Math.round(Math.min(75, totalXG*14+40)),
      reason: `High xG game (${totalXG.toFixed(2)}) drives corner count up` });

  // Corners Under 9.5 — cautious low-energy match
  if (totalXG < 1.5 && dr > 26)
    all.push({ ...ML.corners[1], prob: Math.round(Math.min(72, 75 - totalXG*12)),
      reason: `Low xG ${totalXG.toFixed(2)} — fewer attacking moves expected` });

  // ── 1UP MARKETS ───────────────────────────────────────────────
  // Home 1UP — scale with win probability
  if (hW > 40)
    all.push({ ...ML.oneup[0], prob: Math.round(Math.min(80, hW*0.68 + 22)),
      reason: `Home to lead at some point — ${hW}% win probability` });

  // Away 1UP
  if (aW > 36)
    all.push({ ...ML.oneup[1], prob: Math.round(Math.min(78, aW*0.68 + 20)),
      reason: `Away to lead at some point — ${aW}% win probability` });

  // ── DEDUPLICATE + RANK ────────────────────────────────────────
  // Remove duplicates by label, keep highest prob version
  const seen = {};
  const deduped = all.filter(p => {
    if (!p.label) return false;
    if (seen[p.label] >= p.prob) return false;
    seen[p.label] = p.prob;
    return true;
  });

  // Sort by probability, return top 3
  deduped.sort((a, b) => b.prob - a.prob);
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
