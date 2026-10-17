// EdgeX shared browser metadata. Predictions and betting helpers were retired.
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

// Compatibility shim: season totals are not a substitute for actual recent results.
window.genForm = function () { return []; };
