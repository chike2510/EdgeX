/* ===== EdgeX — Football Live Engine ===== */

const TEAM_PLAYERS = {
  'Man City':   {gk:'Ederson',def:['Walker','Dias','Akanji','Gvardiol'],mid:['Rodri','De Bruyne','Silva'],fwd:['Doku','Haaland','Foden']},
  'Arsenal':    {gk:'Raya',def:['White','Saliba','Magalhaes','Timber'],mid:['Rice','Odegaard','Havertz'],fwd:['Saka','Jesus','Martinelli']},
  'Liverpool':  {gk:'Alisson',def:['Alexander-Arnold','Konate','Van Dijk','Robertson'],mid:['Mac Allister','Gravenberch','Jones'],fwd:['Salah','Nunez','Diaz']},
  'Man Utd':    {gk:'Onana',def:['Dalot','Maguire','Lindelof','Shaw'],mid:['Fernandes','Ugarte','Mainoo'],fwd:['Rashford','Hojlund','Amad']},
  'Chelsea':    {gk:'Sanchez',def:['James','Disasi','Colwill','Cucurella'],mid:['Caicedo','Enzo','Palmer'],fwd:['Sterling','Jackson','Mudryk']},
  'Tottenham':  {gk:'Forster',def:['Porro','Romero','Van de Ven','Udogie'],mid:['Bissouma','Sarr','Maddison'],fwd:['Kulusevski','Son','Johnson']},
  'Newcastle':  {gk:'Pope',def:['Trippier','Schar','Burn','Hall'],mid:['Tonali','Guimaraes','Longstaff'],fwd:['Almiron','Isak','Gordon']},
  'Aston Villa':{gk:'Martinez',def:['Cash','Konsa','Mings','Digne'],mid:['Tielemans','Douglas Luiz','McGinn'],fwd:['Bailey','Watkins','Diaby']},
  'Real Madrid':{gk:'Courtois',def:['Carvajal','Militao','Alaba','Mendy'],mid:['Tchouameni','Kroos','Valverde'],fwd:['Bellingham','Vinicius','Rodrygo']},
  'Barcelona':  {gk:'Ter Stegen',def:['Cancelo','Araujo','Christensen','Balde'],mid:['Pedri','Gavi','De Jong'],fwd:['Yamal','Lewandowski','Raphinha']},
  'Atletico':   {gk:'Oblak',def:['Molina','Gimenez','Witsel','Reinildo'],mid:['De Paul','Koke','Saul'],fwd:['Griezmann','Alvarez','Llorente']},
  'Bayern':     {gk:'Neuer',def:['Kimmich','Upamecano','De Ligt','Davies'],mid:['Goretzka','Leon','Musiala'],fwd:['Gnabry','Kane','Sane']},
  'Dortmund':   {gk:'Kobel',def:['Ryerson','Hummels','Schlotterbeck','Maatsen'],mid:['Can','Brandt','Nmecha'],fwd:['Adeyemi','Fullkrug','Sancho']},
  'PSG':        {gk:'Donnarumma',def:['Hakimi','Marquinhos','Skriniar','Mendes'],mid:['Vitinha','Ugarte','Zaire-Emery'],fwd:['Dembele','Mbappe','Asensio']},
  'Inter':      {gk:'Sommer',def:['Darmian','Acerbi','Bastoni','Dimarco'],mid:['Barella','Calhanoglu','Mkhitaryan'],fwd:['Dumfries','Thuram','Martinez']},
  'AC Milan':   {gk:'Maignan',def:['Calabria','Kjaer','Tomori','Theo'],mid:['Bennacer','Reijnders','Tonali'],fwd:['Pulisic','Giroud','Leao']},
  'Juventus':   {gk:'Szczesny',def:['Danilo','Bremer','Gatti','Cambiaso'],mid:['Locatelli','Rabiot','Miretti'],fwd:['Vlahovic','Chiesa','Yildiz']},
  'Villarreal': {gk:'Reina',def:['Foyth','Albiol','Torres','Pedraza'],mid:['Capoue','Trigueros','Baena'],fwd:['Yeremy','Morales','Danjuma']},
};

function getPlayers(team) {
  const t = TEAM_PLAYERS[team] || {gk:'GK',def:['D1','D2','D3','D4'],mid:['M1','M2','M3'],fwd:['F1','F2','F3']};
  return [t.gk, ...t.def, ...t.mid, ...t.fwd];
}

// Formation positions (normalized 0-1), home attacks left→right
const FORMATION_433 = [
  {x:0.07,y:0.50},  // GK
  {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85}, // DEF
  {x:0.45,y:0.25},{x:0.45,y:0.50},{x:0.45,y:0.75}, // MID
  {x:0.68,y:0.18},{x:0.72,y:0.50},{x:0.68,y:0.82}, // FWD
];

const MATCH_CONFIGS = [
  {id:1,home:'Man City',away:'Arsenal',   minute:67,score:{home:2,away:1},league:'EPL',   status:'LIVE'},
  {id:2,home:'Real Madrid',away:'Atletico',minute:34,score:{home:0,away:0},league:'LA LIGA',status:'LIVE'},
  {id:3,home:'Liverpool',away:'Man Utd',  minute:45,score:{home:1,away:0},league:'EPL',   status:'HT'},
  {id:4,home:'Bayern',away:'Dortmund',    minute:82,score:{home:3,away:1},league:'BUNDESLIGA',status:'LIVE'},
  {id:5,home:'PSG',away:'Inter',          minute:21,score:{home:0,away:0},league:'UCL',   status:'LIVE'},
  {id:6,home:'Chelsea',away:'Tottenham',  minute:55,score:{home:1,away:1},league:'EPL',   status:'LIVE'},
  {id:7,home:'Barcelona',away:'Villarreal',minute:71,score:{home:2,away:0},league:'LA LIGA',status:'LIVE'},
  {id:8,home:'Juventus',away:'AC Milan',  minute:42,score:{home:0,away:1},league:'SERIE A',status:'LIVE'},
];

const EVENT_ICONS = {GOAL:'⚽',YELLOW:'🟨',RED:'🟥',SUB:'🔄',VAR:'📺',CHANCE:'🎯',CORNER:'🚩',FOUL:'⚠️'};

// ── LiveMatch class ────────────────────────────────────────────────────────────
class LiveMatch {
  constructor(cfg) {
    this.id       = cfg.id;
    this.home     = cfg.home;
    this.away     = cfg.away;
    this.minute   = cfg.minute;
    this.score    = {...cfg.score};
    this.league   = cfg.league;
    this.status   = cfg.status;
    this.homePlayers = getPlayers(cfg.home);
    this.awayPlayers = getPlayers(cfg.away);
    this.events   = this._generatePastEvents(cfg.minute, cfg.score);
    this.stats    = this._initStats();
    this.momentum = {home:50+Math.random()*20-10, away:0};
    this.momentum.away = 100-this.momentum.home;
    this.nextGoalProb = {home:50, away:50};
    this.alerts   = [];
    this.passTimer = 0;
    this.xG       = {home: cfg.score.home+Math.random()*0.8, away: cfg.score.away+Math.random()*0.7};
    this._lastAlertUpdate = 0;
  }

  _initStats() {
    const r = (a,b) => Math.round(a+Math.random()*(b-a));
    return {
      possession: {home:r(40,65), away:0},
      shots:      {home:r(3,12),  away:r(2,10)},
      onTarget:   {home:r(1,6),   away:r(1,5)},
      corners:    {home:r(2,8),   away:r(1,7)},
      fouls:      {home:r(3,12),  away:r(4,14)},
      yellowCards:{home:0,        away:0},
      redCards:   {home:0,        away:0},
    };
  }

  _generatePastEvents(minute, score) {
    const events = [];
    let hGoals = 0, aGoals = 0;
    for(let m = 1; m <= minute; m++) {
      const r = Math.random();
      if(hGoals < score.home && r < (score.home - hGoals) * 0.04) {
        const scorer = this.homePlayers[Math.floor(Math.random()*10)+1];
        events.push({type:'GOAL',team:'home',player:scorer,minute:m,detail:`${scorer} scored!`});
        hGoals++;
      } else if(aGoals < score.away && r > 0.97) {
        const scorer = this.awayPlayers[Math.floor(Math.random()*10)+1];
        events.push({type:'GOAL',team:'away',player:scorer,minute:m,detail:`${scorer} scored!`});
        aGoals++;
      } else if(r < 0.025 && m > 15) {
        const team = Math.random()<0.5?'home':'away';
        const players = team==='home'?this.homePlayers:this.awayPlayers;
        events.push({type:'YELLOW',team,player:players[Math.floor(Math.random()*10)+1],minute:m,detail:'Yellow card'});
        this.stats.yellowCards[team]++;
      } else if(r > 0.996 && m > 20) {
        const team = Math.random()<0.5?'home':'away';
        const players = team==='home'?this.homePlayers:this.awayPlayers;
        events.push({type:'SUB',team,player:players[Math.floor(Math.random()*8)+2],minute:m,detail:'Substitution made'});
      }
    }
    this.stats.possession.away = 100 - this.stats.possession.home;
    return events.sort((a,b)=>b.minute-a.minute);
  }

  tick() {
    if(this.status==='FT'||this.status==='HT') return;
    this.minute++;
    if(this.minute===90) { this.status='FT'; return; }

    const r = Math.random();
    // Goal ~0.016 per min per team
    if(r<0.014) this._addGoal('home');
    else if(r<0.028) this._addGoal('away');
    else if(r<0.045) this._addEvent('YELLOW',Math.random()<0.5?'home':'away');
    else if(r<0.047) this._addEvent('RED',Math.random()<0.5?'home':'away');
    else if(this.minute>60&&r<0.06) this._addEvent('SUB',Math.random()<0.5?'home':'away');
    else if(r<0.08) this._addEvent('CORNER',Math.random()<0.5?'home':'away');
    else if(r<0.10) this._addEvent('CHANCE',Math.random()<0.5?'home':'away');
    else if(r<0.105) this._addEvent('VAR','home');

    this._updateStats();
    this._updateMomentum();
    this._updateNextGoalProb();
    if(this.minute-this._lastAlertUpdate>=3){this._updateAlerts();this._lastAlertUpdate=this.minute;}
  }

  _addGoal(team) {
    const players = team==='home'?this.homePlayers:this.awayPlayers;
    const scorer  = players[Math.floor(Math.random()*10)+1];
    this.events.unshift({type:'GOAL',team,player:scorer,minute:this.minute,detail:`${scorer} scores!`});
    this.score[team]++;
    this.xG[team] += 1 + Math.random()*0.3;
    this.momentum[team] = Math.min(85, this.momentum[team]+18);
    this.momentum[team==='home'?'away':'home'] = 100-this.momentum[team];
    this.stats.shots[team]++;
    this.stats.onTarget[team]++;
  }

  _addEvent(type, team) {
    const players = team==='home'?this.homePlayers:this.awayPlayers;
    const player  = players[Math.floor(Math.random()*10)+1];
    const details = {
      YELLOW:`${player} booked`,RED:`${player} sent off!`,SUB:`${player} substituted`,
      CORNER:'Corner awarded',CHANCE:`${player} — chance!`,VAR:'VAR check in progress...',FOUL:'Foul committed'
    };
    this.events.unshift({type,team,player,minute:this.minute,detail:details[type]||type});
    if(type==='YELLOW') this.stats.yellowCards[team]++;
    if(type==='RED')    this.stats.redCards[team]++;
    if(type==='CORNER') this.stats.corners[team]++;
    if(type==='FOUL')   this.stats.fouls[team]++;
    if(type==='CHANCE') { this.stats.shots[team]++; this.xG[team]+=Math.random()*0.4; }
  }

  _updateStats() {
    // Drift possession based on momentum
    const targetPoss = Math.round(this.momentum.home * 0.9);
    this.stats.possession.home += (targetPoss - this.stats.possession.home) * 0.02;
    this.stats.possession.away = 100 - Math.round(this.stats.possession.home);
  }

  _updateMomentum() {
    const recent = this.events.filter(e=>e.minute>=this.minute-5);
    let hPush=0, aPush=0;
    recent.forEach(e=>{
      if(e.type==='GOAL')   e.team==='home'?hPush+=25:aPush+=25;
      if(e.type==='CHANCE') e.team==='home'?hPush+=8:aPush+=8;
      if(e.type==='CORNER') e.team==='home'?hPush+=4:aPush+=4;
    });
    const targetH = Math.max(20,Math.min(80, 50+hPush-aPush));
    this.momentum.home += (targetH-this.momentum.home)*0.08;
    this.momentum.away  = 100-this.momentum.home;
  }

  _updateNextGoalProb() {
    const hStr = this.momentum.home/100;
    const baseGoalProb = 0.7 + (this.minute/90)*0.3; // more goals likely later
    this.nextGoalProb.home = Math.round(hStr*100*baseGoalProb);
    this.nextGoalProb.away = 100-this.nextGoalProb.home;
  }

  _updateAlerts() {
    const alerts=[];
    const recent=this.events.filter(e=>e.minute>=this.minute-4);
    if(recent.some(e=>e.type==='GOAL'&&e.team==='home'))
      alerts.push({msg:`🔥 ${this.home} just scored — momentum shift!`,type:'good'});
    if(recent.some(e=>e.type==='GOAL'&&e.team==='away'))
      alerts.push({msg:`🔥 ${this.away} equaliser! Match wide open`,type:'good'});
    if(recent.some(e=>e.type==='RED'))
      alerts.push({msg:'🟥 Red card! Game-changing moment',type:'hot'});
    if(recent.some(e=>e.type==='VAR'))
      alerts.push({msg:'📺 VAR reviewing — decision pending',type:'warn'});
    if(this.momentum.home>72)
      alerts.push({msg:`⚡ ${this.home} dominating — ${this.momentum.home.toFixed(0)}% pressure`,type:'info'});
    if(this.momentum.away>72)
      alerts.push({msg:`⚡ ${this.away} in control — pressing hard`,type:'info'});
    if(this.minute>80&&Math.abs(this.score.home-this.score.away)===1)
      alerts.push({msg:'⏰ Final 10 mins — desperate push from trailing team',type:'warn'});
    if(this.minute>85&&this.score.home===this.score.away)
      alerts.push({msg:'🎯 Stalemate late on — both teams pushing for winner',type:'warn'});
    if(recent.filter(e=>e.type==='CHANCE').length>=2)
      alerts.push({msg:'🎯 High intensity — multiple chances in quick succession!',type:'hot'});
    this.alerts = alerts.slice(0,3);
  }

  getPlayerStats() {
    const players = [];
    const build = (names, team) => names.slice(1).forEach((name,i) => {
      const isFwd = i>=7;
      players.push({
        name, team,
        passes:  Math.round(20+Math.random()*40),
        shots:   isFwd ? Math.round(Math.random()*5) : Math.round(Math.random()*2),
        keyPass: Math.round(Math.random()*5),
        tackles: isFwd ? Math.round(Math.random()*2) : Math.round(Math.random()*6),
        rating:  +(5.5+Math.random()*4).toFixed(1),
      });
    });
    build(this.homePlayers, 'home');
    build(this.awayPlayers, 'away');
    return players.sort((a,b)=>b.rating-a.rating);
  }
}

// ── Canvas Pitch ───────────────────────────────────────────────────────────────
class PitchCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if(!this.canvas) return;
    this.ctx    = this.canvas.getContext('2d');
    const rect  = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = Math.min(rect.width||320, 720);
    this.canvas.height = Math.round(this.canvas.width * 0.62);
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    this.ballPos    = {x:this.W/2, y:this.H/2};
    this.ballTarget = {x:this.W/2, y:this.H/2};
    this.players    = {home:[], away:[]};
    this.animFrame  = null;
    this.match      = null;
    this.possession = 'home';
    this.passTimer  = 0;
    this.PAD        = 18;
  }

  setMatch(match) {
    this.match = match;
    this._setupPlayers();
    this.start();
  }

  _setupPlayers() {
    const pad=this.PAD, pw=this.W-pad*2, ph=this.H-pad*2;
    this.players.home = FORMATION_433.map((p,i) => ({
      x:pad+p.x*pw, y:pad+p.y*ph, bx:pad+p.x*pw, by:pad+p.y*ph,
      num:i+1, name:this.match.homePlayers[i]||String(i+1),
    }));
    this.players.away = FORMATION_433.map((p,i) => ({
      x:pad+(1-p.x)*pw, y:pad+p.y*ph, bx:pad+(1-p.x)*pw, by:pad+p.y*ph,
      num:i+1, name:this.match.awayPlayers[i]||String(i+1),
    }));
  }

  _drawPitch() {
    const ctx=this.ctx, W=this.W, H=this.H, pad=this.PAD;
    const pw=W-pad*2, ph=H-pad*2;
    // BG
    ctx.fillStyle='#1e4d1a'; ctx.fillRect(0,0,W,H);
    // Stripes
    const ns=10;
    for(let i=0;i<ns;i++){
      ctx.fillStyle=i%2===0?'rgba(0,0,0,0.07)':'rgba(255,255,255,0.03)';
      ctx.fillRect(i*(W/ns),0,W/ns,H);
    }
    // Lines
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1.2;
    // Boundary
    ctx.strokeRect(pad,pad,pw,ph);
    // Center line
    ctx.beginPath(); ctx.moveTo(W/2,pad); ctx.lineTo(W/2,H-pad); ctx.stroke();
    // Center circle
    ctx.beginPath(); ctx.arc(W/2,H/2,ph*0.14,0,Math.PI*2); ctx.stroke();
    // Center dot
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(W/2,H/2,2.5,0,Math.PI*2); ctx.fill();
    // Penalty areas
    const paw=pw*0.15, pah=ph*0.45;
    ctx.strokeRect(pad,H/2-pah/2,paw,pah);
    ctx.strokeRect(W-pad-paw,H/2-pah/2,paw,pah);
    // Goal areas
    const gaw=pw*0.055, gah=ph*0.22;
    ctx.strokeRect(pad,H/2-gah/2,gaw,gah);
    ctx.strokeRect(W-pad-gaw,H/2-gah/2,gaw,gah);
    // Goals
    ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=2;
    ctx.strokeRect(pad-7,H/2-ph*0.10,7,ph*0.20);
    ctx.strokeRect(W-pad,H/2-ph*0.10,7,ph*0.20);
    // Penalty spots
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(pad+pw*0.11,H/2,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W-pad-pw*0.11,H/2,2.5,0,Math.PI*2); ctx.fill();
  }

  _drawPlayers() {
    const ctx=this.ctx;
    const draw = (players, color, shadowColor) => {
      players.forEach(p => {
        ctx.shadowColor=shadowColor; ctx.shadowBlur=10;
        ctx.fillStyle=color;
        ctx.beginPath(); ctx.arc(p.x,p.y,7,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
        ctx.fillStyle='rgba(0,0,0,0.85)';
        ctx.font='bold 7px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(p.num,p.x,p.y);
      });
    };
    draw(this.players.home,'#00ff9d','#00ff9d');
    draw(this.players.away,'#a855f7','#a855f7');
  }

  _drawBall() {
    const ctx=this.ctx;
    // Smooth interpolation
    this.ballPos.x += (this.ballTarget.x-this.ballPos.x)*0.12;
    this.ballPos.y += (this.ballTarget.y-this.ballPos.y)*0.12;
    ctx.shadowColor='#fff'; ctx.shadowBlur=15;
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(this.ballPos.x,this.ballPos.y,5,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
  }

  _updatePositions() {
    [...this.players.home,...this.players.away].forEach(p => {
      p.x += (p.bx-p.x)*0.06 + (Math.random()-0.5)*2;
      p.y += (p.by-p.y)*0.06 + (Math.random()-0.5)*2;
    });
    this.passTimer--;
    if(this.passTimer<=0) {
      const m = this.match;
      // Bias possession based on match momentum
      const homeBias = m ? m.momentum.home/100 : 0.5;
      this.possession = Math.random()<homeBias ? 'home' : 'away';
      const team = this.players[this.possession];
      // Bias toward attacking players when in good position
      const weights = this.possession==='home' ? [0.5,1,1,1,1,2,2,2,4,5,4] : [0.5,1,1,1,1,2,2,2,4,5,4];
      const totalW = weights.reduce((a,b)=>a+b,0);
      let rnd = Math.random()*totalW;
      let pi = 0;
      for(let i=0;i<weights.length;i++){ rnd-=weights[i]; if(rnd<=0){pi=i;break;} }
      const target = team[pi] || team[Math.floor(Math.random()*team.length)];
      this.ballTarget = {x:target.x+(Math.random()-0.5)*15, y:target.y+(Math.random()-0.5)*15};
      this.passTimer  = Math.round(40+Math.random()*50);
    }
  }

  render() {
    if(!this.ctx) return;
    this._drawPitch();
    this._updatePositions();
    this._drawPlayers();
    this._drawBall();
  }

  start() {
    const loop=()=>{ this.render(); this.animFrame=requestAnimationFrame(loop); };
    if(this.animFrame) cancelAnimationFrame(this.animFrame);
    loop();
  }

  stop() {
    if(this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame=null; }
  }
}

// ── Global state ───────────────────────────────────────────────────────────────
window.LIVE_MATCHES = [];
window.activePitch  = null;

function initLiveMatches() {
  window.LIVE_MATCHES = MATCH_CONFIGS.map(cfg => new LiveMatch(cfg));
  // Tick matches every real second = simulate 1 match minute
  setInterval(() => {
    LIVE_MATCHES.forEach(m => { if(m.status==='LIVE') m.tick(); });
    // Update match hub header if open
    if(window.activeMatchId!==null) updateMatchHubHeader(window.activeMatchId);
  }, 8000); // every 8 real seconds = fast but not overwhelming
}

// ── Render live list ───────────────────────────────────────────────────────────
function renderLiveList() {
  const liveCount = LIVE_MATCHES.filter(m=>m.status==='LIVE').length;
  const banner = document.getElementById('live-count');
  if(banner) banner.textContent = `${liveCount} LIVE NOW · ${LIVE_MATCHES.length} total matches`;

  const container = document.getElementById('live-matches');
  if(!container) return;
  container.innerHTML = LIVE_MATCHES.map(m => buildMatchCard(m)).join('');
}

function buildMatchCard(m) {
  const minDisp = m.status==='HT'?'HT':m.status==='FT'?'FT':`${m.minute}'`;
  const minCls  = m.status==='HT'?'ht':m.status==='FT'?'ft':'';
  const lastEvt = m.events[0];
  const evtHtml = lastEvt ? `<div class="latest-event">${EVENT_ICONS[lastEvt.type]||'•'} ${lastEvt.minute}' ${lastEvt.detail}</div>` : '';
  const edgeCls = m.momentum.home>65?'has-edge':'';

  return `
    <div class="match-live-card ${edgeCls}" onclick="openMatchHub(${m.id})">
      <div class="mlc-top">
        <div class="mlc-score">
          <div>
            <div class="mlc-team">${m.home}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">${m.league}</div>
          </div>
          <div class="mlc-num">${m.score.home}</div>
          <div class="mlc-vs">–</div>
          <div class="mlc-num" style="color:var(--neon2)">${m.score.away}</div>
          <div>
            <div class="mlc-team">${m.away}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">&nbsp;</div>
          </div>
        </div>
        <div>
          ${m.status==='LIVE'?`<span class="live-badge"><span class="live-dot"></span>LIVE</span>`:``}
          <div class="mlc-min ${minCls}" style="margin-top:4px;text-align:center">${minDisp}</div>
        </div>
      </div>
      <div class="mom-labels"><span>${m.home} ${m.momentum.home.toFixed(0)}%</span><span>MOMENTUM</span><span>${m.momentum.away.toFixed(0)}% ${m.away}</span></div>
      <div class="momentum-bar"><div class="mb-home" style="width:${m.momentum.home}%"></div><div class="mb-away"></div></div>
      <div class="ngp-row">
        <span class="ngp-label">NEXT GOAL</span>
        <div class="ngp-bar"><div class="ngp-fill" style="width:${m.nextGoalProb.home}%"></div></div>
        <span class="ngp-pct">${m.nextGoalProb.home}% H</span>
      </div>
      ${evtHtml}
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:6px;text-align:right;">Tap for full match hub →</div>
    </div>`;
}

// ── Match Hub ─────────────────────────────────────────────────────────────────
function openMatchHub(id) {
  window.activeMatchId = id;
  const m = LIVE_MATCHES.find(x=>x.id===id);
  if(!m) return;
  document.getElementById('match-hub').style.display='flex';
  updateMatchHubHeader(id);
  renderMHTab('match', id);
  document.querySelectorAll('.mh-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('mht-match').classList.add('active');
}

function updateMatchHubHeader(id) {
  const m = LIVE_MATCHES.find(x=>x.id===id);
  if(!m) return;
  document.getElementById('mh-home-name').textContent = m.home;
  document.getElementById('mh-away-name').textContent = m.away;
  document.getElementById('mh-score').textContent = `${m.score.home} – ${m.score.away}`;
  const minDisp = m.status==='HT'?'HALF TIME':m.status==='FT'?'FULL TIME':`${m.minute}'  LIVE`;
  document.getElementById('mh-min').textContent = minDisp;
}

function renderMHTab(tab, id) {
  const m = LIVE_MATCHES.find(x=>x.id===id);
  if(!m) return;
  const body = document.getElementById('mh-body');

  if(tab==='match') {
    const alertsHtml = m.alerts.map(a=>`<div class="alert-box ${a.type}">${a.msg}</div>`).join('');
    const tlHtml = m.events.slice(0,15).map(e=>`
      <div class="tl-event">
        <span class="tl-min">${e.minute}'</span>
        <span class="tl-icon">${EVENT_ICONS[e.type]||'•'}</span>
        <div class="tl-detail"><strong>${e.team==='home'?m.home:m.away}</strong> — ${e.detail}</div>
      </div>`).join('') || '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);padding:12px 0;">No events yet</div>';

    body.innerHTML = `
      <!-- Momentum -->
      <div class="section-header" style="margin-top:0"><div class="section-title" style="font-size:14px">Momentum</div></div>
      <div class="mom-labels"><span>${m.home} ${m.momentum.home.toFixed(0)}%</span><span>PRESSURE</span><span>${m.momentum.away.toFixed(0)}% ${m.away}</span></div>
      <div class="momentum-bar" style="height:8px;margin:6px 0 12px"><div class="mb-home" style="width:${m.momentum.home}%"></div><div class="mb-away"></div></div>

      <!-- Next Goal Probability -->
      <div class="section-header"><div class="section-title" style="font-size:14px">Next Goal Probability</div></div>
      <div class="ngp-row"><span class="ngp-label">${m.home}</span><div class="ngp-bar"><div class="ngp-fill" style="width:${m.nextGoalProb.home}%"></div></div><span class="ngp-pct">${m.nextGoalProb.home}%</span></div>
      <div class="ngp-row"><span class="ngp-label">${m.away}</span><div class="ngp-bar"><div class="ngp-fill" style="width:${m.nextGoalProb.away}%;background:linear-gradient(90deg,#a855f7,#7b5cff)"></div></div><span class="ngp-pct" style="color:#a855f7">${m.nextGoalProb.away}%</span></div>

      <!-- xG -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 16px">
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--neon)">${m.xG.home.toFixed(2)}</div>
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px">xG ${m.home}</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px;text-align:center">
          <div style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--neon2)">${m.xG.away.toFixed(2)}</div>
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px">xG ${m.away}</div>
        </div>
      </div>

      <!-- Alerts -->
      ${alertsHtml ? `<div class="section-header"><div class="section-title" style="font-size:14px">⚡ Smart Alerts</div></div>${alertsHtml}` : ''}

      <!-- Timeline -->
      <div class="section-header" style="margin-top:14px"><div class="section-title" style="font-size:14px">Event Timeline</div><div class="section-meta">${m.events.length} events</div></div>
      <div class="timeline">${tlHtml}</div>
    `;
  }

  else if(tab==='pitch') {
    body.innerHTML = `
      <div class="section-header" style="margin-top:0"><div class="section-title" style="font-size:14px">2D Match Pitch</div></div>
      <div class="pitch-wrap">
        <canvas id="pitch-canvas"></canvas>
        <div class="pitch-overlay">
          <span class="pitch-team-label pitch-home-label">● ${m.home}</span>
          <span class="pitch-team-label pitch-away-label">${m.away} ●</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:6px;padding:0 4px">
        <span>← Attacking direction</span>
        <span>Attacking direction →</span>
      </div>
      <div class="stat-chips" style="margin-top:12px">
        <div class="stat-chip">POSS <span style="color:var(--neon)">${Math.round(m.stats.possession.home)}%</span></div>
        <div class="stat-chip">SHOTS <span>${m.stats.shots.home}-${m.stats.shots.away}</span></div>
        <div class="stat-chip">ON TGT <span>${m.stats.onTarget.home}-${m.stats.onTarget.away}</span></div>
        <div class="stat-chip">CORNERS <span>${m.stats.corners.home}-${m.stats.corners.away}</span></div>
      </div>
      <div style="margin-top:12px">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-bottom:6px;letter-spacing:1px">FORMATION DISPLAY</div>
        <div style="display:flex;gap:6px">
          <div style="flex:1;background:rgba(0,255,157,0.06);border:1px solid rgba(0,255,157,0.2);border-radius:var(--radius);padding:8px;font-family:var(--font-mono);font-size:9px;color:var(--neon)">${m.home}<br><span style="color:var(--text-muted)">4-3-3</span></div>
          <div style="flex:1;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:var(--radius);padding:8px;font-family:var(--font-mono);font-size:9px;color:#a855f7">${m.away}<br><span style="color:var(--text-muted)">4-3-3</span></div>
        </div>
      </div>`;
    // Init canvas after DOM update
    requestAnimationFrame(() => {
      if(window.activePitch) window.activePitch.stop();
      window.activePitch = new PitchCanvas('pitch-canvas');
      window.activePitch.setMatch(m);
    });
  }

  else if(tab==='stats') {
    const s = m.stats;
    const statRow = (label,h,a,isTime=false) => {
      const total = h+a||1;
      return `<div class="team-stat-row">
        <span class="tsr-val home">${h}${isTime?'%':''}</span>
        <div class="tsr-bar-wrap"><div class="tsr-home" style="width:${h/total*100}%"></div><div class="tsr-away" style="width:${a/total*100}%"></div></div>
        <span class="tsr-val away">${a}${isTime?'%':''}</span>
      </div><div style="text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin:-2px 0 8px">${label}</div>`;
    };
    const playerStats = m.getPlayerStats();
    const best = playerStats[0];
    body.innerHTML = `
      <div class="section-header" style="margin-top:0"><div class="section-title" style="font-size:14px">Team Stats</div></div>
      <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;font-weight:700;margin-bottom:8px">
        <span style="color:var(--neon)">${m.home}</span><span style="color:var(--text-dim)">VS</span><span style="color:#a855f7">${m.away}</span>
      </div>
      ${statRow('POSSESSION',Math.round(s.possession.home),Math.round(s.possession.away),true)}
      ${statRow('SHOTS',s.shots.home,s.shots.away)}
      ${statRow('ON TARGET',s.onTarget.home,s.onTarget.away)}
      ${statRow('CORNERS',s.corners.home,s.corners.away)}
      ${statRow('FOULS',s.fouls.home,s.fouls.away)}
      ${statRow('YELLOW CARDS',s.yellowCards.home,s.yellowCards.away)}

      <div class="section-header" style="margin-top:14px"><div class="section-title" style="font-size:14px">Man of the Match</div></div>
      <div style="background:var(--neon-dim);border:1px solid rgba(0,255,157,0.3);border-radius:var(--radius);padding:12px;margin-bottom:14px;">
        <div style="font-weight:800;font-size:15px;margin-bottom:4px">⭐ ${best.name}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:6px">${best.team==='home'?m.home:m.away}</div>
        <div class="stat-chips">
          <div class="stat-chip">RATING <span style="color:var(--neon)">${best.rating}</span></div>
          <div class="stat-chip">PASSES <span>${best.passes}</span></div>
          <div class="stat-chip">KEY PASS <span>${best.keyPass}</span></div>
          <div class="stat-chip">SHOTS <span>${best.shots}</span></div>
        </div>
      </div>

      <div class="section-header"><div class="section-title" style="font-size:14px">Player Stats</div></div>
      <table class="player-table">
        <thead><tr><th>PLAYER</th><th>TEAM</th><th>PASS</th><th>SHT</th><th>KP</th><th>TCK</th><th>RTG</th></tr></thead>
        <tbody>${playerStats.slice(0,16).map((p,i)=>`
          <tr class="${i===0?'best':''}">
            <td>${p.name}</td>
            <td style="color:${p.team==='home'?'var(--neon)':'#a855f7'}">${p.team==='home'?m.home.split(' ').pop():m.away.split(' ').pop()}</td>
            <td>${p.passes}</td><td>${p.shots}</td><td>${p.keyPass}</td><td>${p.tackles}</td>
            <td class="rating ${p.rating>=8?'high':p.rating>=7?'mid':''}">${p.rating}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  else if(tab==='analysis') {
    // Use poisson from football-page.js predictions
    const hWin = m.score.home>m.score.away?65:m.score.home<m.score.away?25:40;
    const aWin = m.score.away>m.score.home?65:m.score.away<m.score.home?25:40;
    const draw = 100-hWin-aWin;
    const kelly = (hWin/100 > 0.5) ? ((2*hWin/100-1)*0.25).toFixed(1) : '0.0';
    const odds_h = (1/(hWin/100)).toFixed(2), odds_a=(1/(aWin/100)).toFixed(2);
    body.innerHTML = `
      <div class="section-header" style="margin-top:0"><div class="section-title" style="font-size:14px">Win Probabilities</div></div>
      <div class="prob-row"><span class="prob-label" style="width:80px">${m.home}</span><div class="prob-bar-wrap"><div class="prob-bar home" style="width:${hWin}%"></div></div><span class="prob-pct">${hWin}%</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--neon2);width:36px;text-align:right">${odds_h}</span></div>
      <div class="prob-row"><span class="prob-label" style="width:80px">DRAW</span><div class="prob-bar-wrap"><div class="prob-bar draw" style="width:${draw}%"></div></div><span class="prob-pct">${draw}%</span></div>
      <div class="prob-row"><span class="prob-label" style="width:80px">${m.away}</span><div class="prob-bar-wrap"><div class="prob-bar away" style="width:${aWin}%"></div></div><span class="prob-pct">${aWin}%</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--neon2);width:36px;text-align:right">${odds_a}</span></div>

      <div class="kelly-box" style="margin-top:14px">
        <div class="kelly-left"><div class="kelly-title">⚖️ KELLY CRITERION</div><div class="kelly-pct">${kelly}<span class="kelly-unit">% bankroll</span></div></div>
        <div class="kelly-divider"></div>
        <div class="kelly-right"><div class="kelly-stake">$${(parseFloat(kelly)*getBankroll()/100).toFixed(2)}</div><div class="kelly-sublabel">SUGGESTED STAKE</div></div>
      </div>

      <div class="section-header" style="margin-top:14px"><div class="section-title" style="font-size:14px">Market Overview</div></div>
      <div class="stat-chips" style="margin-bottom:12px">
        <div class="stat-chip">BTTS YES <span style="color:var(--neon)">${Math.round(45+Math.random()*25)}%</span></div>
        <div class="stat-chip">O2.5 <span style="color:var(--neon)">${Math.round(50+Math.random()*25)}%</span></div>
        <div class="stat-chip">O1.5 <span style="color:var(--neon)">${Math.round(70+Math.random()*20)}%</span></div>
        <div class="stat-chip">O3.5 <span style="color:var(--yellow)">${Math.round(25+Math.random()*20)}%</span></div>
        <div class="stat-chip">BTTS+O2.5 <span style="color:var(--yellow)">${Math.round(35+Math.random()*20)}%</span></div>
        <div class="stat-chip">DRAW NO BET <span>${Math.round(hWin+5)}%</span></div>
      </div>

      <div class="ai-explain">
        <div class="ai-explain-title">⚡ LIVE ANALYSIS</div>
        <ul class="ai-explain-list">
          <li>${m.home} possession ${Math.round(m.stats.possession.home)}% — ${m.stats.possession.home>55?'dominating the ball':'ceding control'}</li>
          <li>${m.stats.shots.home} shots for ${m.home} vs ${m.stats.shots.away} for ${m.away}</li>
          <li>xG differential: ${m.home} ${m.xG.home.toFixed(2)} vs ${m.away} ${m.xG.away.toFixed(2)}</li>
          <li>Momentum ${m.momentum.home>55?'with '+m.home:'with '+m.away} at this stage</li>
          <li>${m.minute>75?'Late game — set pieces increasingly dangerous':'Plenty of time remaining for either team'}</li>
        </ul>
      </div>
      <button class="log-btn" onclick="logPick('${m.home} vs ${m.away}','${hWin>aWin?m.home+' Win':'Draw'}',${Math.abs(hWin-50)},${Math.round(55+Math.random()*25)},'Football')">📋 LOG PICK TO JOURNAL</button>`;
  }
}

// ── Override initLiveMatches to use AllSportsAPI ──────────────────────────────
const _originalInitLiveMatches = initLiveMatches;

window.initLiveMatches = async function() {
  // Try real API first
  const apiData = await initFootballFromAPI();

  if (apiData && apiData.length > 0) {
    // Convert API fixtures to LiveMatch instances
    window.LIVE_MATCHES = apiData.map(f => {
      // Create LiveMatch with real data
      const m = new LiveMatch({
        id:     f.id,
        home:   f.home,
        away:   f.away,
        minute: f.minute,
        score:  f.score,
        league: f.league,
        status: f.status,
      });
      // Inject real events from API
      if (f.events && f.events.length > 0) {
        m.events = f.events.map(e => ({
          type:   e.type,
          minute: e.minute,
          player: e.player,
          team:   e.team,
          detail: e.detail || e.type,
        }));
      }
      // Inject real odds
      if (f.odds) m.liveOdds = f.odds;
      // Inject logos
      m.homeLogo = f.homeLogo || '';
      m.awayLogo = f.awayLogo || '';
      m.stadium  = f.stadium || '';
      m.isRealData = true;
      return m;
    });

    // Update live banner
    const liveCount = window.LIVE_MATCHES.filter(m => m.status === 'LIVE').length;
    const banner = document.getElementById('live-count');
    if (banner) banner.innerHTML = `<strong style="color:var(--neon)">${liveCount} LIVE NOW</strong> · ${window.LIVE_MATCHES.length} total · <span style="color:var(--neon2)">AllSportsAPI</span>`;

    renderLiveList();

    // Auto-refresh real data every 30s
    setInterval(async () => {
      try {
        const refreshed = await initFootballFromAPI();
        if (refreshed) {
          // Update scores and events on existing matches
          refreshed.forEach(fresh => {
            const existing = window.LIVE_MATCHES.find(m => m.id === fresh.id);
            if (existing) {
              existing.score  = fresh.score;
              existing.minute = fresh.minute;
              existing.status = fresh.status;
              if (fresh.events.length > existing.events.length) {
                existing.events = fresh.events;
              }
              if (fresh.odds) existing.liveOdds = fresh.odds;
            }
          });
          renderLiveList();
          if (window.activeMatchId !== null) {
            updateMatchHubHeader(window.activeMatchId);
          }
        }
      } catch {}
    }, 30000);

  } else {
    // Fallback: use simulation
    window.LIVE_MATCHES = MATCH_CONFIGS.map(cfg => new LiveMatch(cfg));
    const banner = document.getElementById('live-count');
    if (banner) banner.textContent = `${MATCH_CONFIGS.length} simulated matches · AllSportsAPI unavailable`;
    renderLiveList();
  }
};

// ── Override renderMHTab to show real odds when available ─────────────────────
const _origRenderMHTab = renderMHTab;
const _patchedRenderMHTab = function(tab, id) {
  _origRenderMHTab(tab, id);
  // After analysis tab renders, inject real odds if available
  if (tab === 'analysis') {
    const m = LIVE_MATCHES.find(x => String(x.id) === String(id));
    if (m && m.liveOdds && m.isRealData) {
      const oddsEl = document.getElementById('real-odds-inject');
      if (!oddsEl) return;
      const o = m.liveOdds;
      oddsEl.innerHTML = `
        <div class="section-header" style="margin-top:14px">
          <div class="section-title" style="font-size:14px">Live Bookmaker Odds</div>
          <div class="section-meta" style="color:var(--neon2)">AllSportsAPI LIVE</div>
        </div>
        <div class="odds-grid">
          <div class="odds-cell ${o.home<2.5?'value-pick':''}">
            <div class="odds-cell-label">HOME WIN</div>
            <div class="odds-cell-val">${o.home?.toFixed(2)||'—'}</div>
            <div class="odds-cell-ev ${o.home?'pos':''}">Bet365</div>
          </div>
          <div class="odds-cell">
            <div class="odds-cell-label">DRAW</div>
            <div class="odds-cell-val">${o.draw?.toFixed(2)||'—'}</div>
          </div>
          <div class="odds-cell ${o.away<2.5?'value-pick':''}">
            <div class="odds-cell-label">AWAY WIN</div>
            <div class="odds-cell-val">${o.away?.toFixed(2)||'—'}</div>
          </div>
        </div>`;
    }
  }
};
window.renderMHTab = _patchedRenderMHTab;
