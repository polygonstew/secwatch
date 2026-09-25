/* ════════════════════════════════════════════════════════
   THE NIGHT SHIFT  --  engine  (js/dreamEngine.js)

   One night = one short roguelike run:
     case file -> descent map -> pick a node per depth
       feed (fight) -> reward pick -> back to map
       rest (tape deck) / archive (shop)
     -> last depth cleared -> waking video -> end -> next day
   Lucidity 0 -> end: FIGHT IT (retry night) or WAKE UP
   (stay up all night: tired, East Wall rises, story goes on).

   Where the pieces came from:
     bwp/lts            lanes, wards/anchors, rewards, deck math,
                        candle HUD, video interludes, the look
     nightmares.html    descent map, Clarity, rest nodes
     remco.html         East Wall scales Terror HP, entity canvas,
                        per-night win/lose text + next-day routing
     nightmare.html     'stay up all night', JAM music + shakes
     new                evidence -> cards (SW.find in the days),
                        intent patterns, WHISPER curses, wall pulse

   Nothing about a specific card / Terror / night is hard-coded;
   it all comes from js/dreamData.js.
════════════════════════════════════════════════════════ */

const LANES = 3;
const BAR_NAMES = { h:'HARGROVE', l:'LKCO', s:'SYSTEM', e:'EAST WALL' };
const GLYPH = { x:'✕', doc:'≡', o:'◯', beam:'◈', arrow:'⇄', noise:'▓', badge:'◆',
                tape:'▶', phone:'☏', ward:'▣', screen:'▭' };

const save = SW.save;
const nightIdx = Math.max(0, Math.min(NS_NIGHTS.length - 1,
  (parseInt(new URLSearchParams(location.search).get('night'), 10) || 1) - 1));
const NIGHT = NS_NIGHTS[nightIdx];

const G = {
  phase:'brief',
  depth:0, path:[],             // node index chosen per depth
  node:null,
  lanes:[],                     // [{enemy, ward}]
  lucidity:{ cur:20, max:20 },
  focus:{ cur:3, max:3 },
  draw:[], hand:[], discard:[], exhausted:[],
  turn:1, uid:1,
  feedMaxHp:1,
  stats:{ feeds:0, turns:0, cards:0, statics:0 },
  busy:false
};
const $ = id => document.getElementById(id);

/* ════════════ audio (JAMengine needs a server; silent otherwise) ════════════ */
const JAM = {
  started:false,
  start(){ if(this.started || typeof JAMengine === 'undefined') return; this.started = true;
           try{ JAMengine.init().catch(()=>{}); }catch(e){} },
  sfx(n,v){ try{ JAMengine.playSFX(n,v); }catch(e){} },
  hit(){ try{ JAMengine.playDamage(); }catch(e){} },
  action(on){ try{ on ? JAMengine.fadeActionIn() : JAMengine.fadeActionOut(); }catch(e){} },
  stop(){ try{ JAMengine.stopMusic(); }catch(e){} }
};
document.addEventListener('pointerdown', () => JAM.start(), { once:true });
document.addEventListener('keydown',     () => JAM.start(), { once:true });

/* ════════════ deck building from the save ════════════ */
function evidenceCards(){
  const out = [];
  save.evidence.forEach(ev => { const id = NS_EVIDENCE[ev]; if(id && !out.includes(id)) out.push(id); });
  if(save.flags.custodian && !out.includes(NS_EVIDENCE.CUSTODIAN)) out.push(NS_EVIDENCE.CUSTODIAN);
  return out;
}
function deckList(){
  let list = NS_STARTER.concat(evidenceCards(), save.deck || []);
  (save.shred || []).forEach(id => { const i = list.indexOf(id); if(i >= 0) list.splice(i, 1); });
  return list.filter(id => NS_CARDS[id]).slice(0, NS_CONFIG.maxDeck);
}
const inst = id => ({ ...NS_CARDS[id], id, uid:'c' + (G.uid++) });
function shuffle(a){ for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const owned = () => G.draw.length + G.hand.length + G.discard.length;

function drawCards(n){
  for(let i = 0; i < n; i++){
    if(!G.draw.length){
      if(!G.discard.length) return;
      G.draw = shuffle(G.discard); G.discard = [];
      log('Reshuffled.');
    }
    G.hand.push(G.draw.shift());
  }
}

/* ════════════ phases ════════════ */
function setPhase(p){
  G.phase = p;
  ['brief','map','battle','reward','rest','archive','interlude','end']
    .forEach(v => $('view-' + v).classList.toggle('hidden', v !== p));
}

/* ════════════ start of night ════════════ */
function beginNight(){
  const ew = save.bars.e || 0;
  G.lucidity.max = Math.max(8, NS_CONFIG.lucidity - Math.floor(ew / 2));
  G.lucidity.cur = G.lucidity.max;
  G.focus.max = Math.max(1, NS_CONFIG.focus + (save.flags.tired ? NS_CONFIG.tiredFocus : 0));
  G.depth = 0; G.path = [];
  G.draw = shuffle(deckList().map(inst)); G.hand = []; G.discard = []; G.exhausted = [];
  G.stats = { feeds:0, turns:0, cards:0, statics:0 };
}

function renderBrief(){
  $('brief-clock').textContent = NIGHT.clock + '   //   NIGHT ' + (nightIdx + 1) + ' OF ' + NS_NIGHTS.length;
  $('brief-title').textContent = NIGHT.title;
  $('brief-where').textContent = NIGHT.where;
  $('brief-bars').innerHTML = barsHTML();

  const ev = evidenceCards();
  const seen = save.flags['seen_' + NIGHT.id] || [];
  $('brief-evidence-hint').textContent = ev.length
    ? 'Everything you read, played or dialed during the day comes with you as a card.'
    : 'You carry nothing but the basics. What you read during the day becomes cards here -- next time, dig.';
  $('brief-evidence').innerHTML = ev.map(id => {
    const c = NS_CARDS[id];
    return `<span class="mini-card ${seen.includes(id) ? '' : 'new'}" title="${esc(c.desc)}">${esc(c.file || c.name)}</span>`;
  }).join('') + (save.deck || []).map(id => `<span class="mini-card" title="${esc(NS_CARDS[id]?.desc || '')}">${esc(NS_CARDS[id]?.name || id)}</span>`).join('');
  SW.flag('seen_' + NIGHT.id, ev);

  const t = [];
  const ew = save.bars.e || 0;
  if(ew >= 2) t.push(`East Wall ${ew}: Terrors +${Math.floor(ew / 2)} HP, your Lucidity -${Math.floor(ew / 2)}.`);
  ['h','l','s','e'].forEach(k => { const b = Math.floor((save.bars[k] || 0) / 4);
    if(b) t.push(`${BAR_NAMES[k]} ${save.bars[k]}: its Terrors hit +${b}.`); });
  if(ew >= NS_CONFIG.wallPulseAt) t.push(`The wall pulses every ${NS_CONFIG.wallPulseEvery} turns. OBSERVER LOGGED.`);
  if(save.flags.tired) t.push(`You stayed up last night. ${NS_CONFIG.tiredFocus} Focus.`);
  if(!t.length) t.push('Nothing yet. You have not dug deep enough to be noticed.');
  $('brief-threats').innerHTML = t.map(x => `<li>${esc(x)}</li>`).join('');
  setPhase('brief');
}

function barsHTML(){
  return ['h','l','s','e'].map(k => {
    const v = save.bars[k] || 0;
    return `<div class="bar ${v >= 7 ? 'hot' : v >= 4 ? 'warn' : ''}">${BAR_NAMES[k]} ${v >= 10 ? '--' : v}
      <div class="track"><div class="fill" style="width:${v * 10}%"></div></div></div>`;
  }).join('');
}

/* ════════════ descent map ════════════ */
const NODE_LABEL = { feed:'FEED', elite:'STRONG SIGNAL', rest:'TAPE DECK', archive:'ARCHIVE' };
function renderMap(){
  $('map-luc').textContent = `${G.lucidity.cur}/${G.lucidity.max}`;
  $('map-clarity').textContent = save.clarity || 0;
  $('map-deck').textContent = owned();
  $('map-title').textContent = NIGHT.title;
  const wrap = $('map-depths'); wrap.innerHTML = '';
  NIGHT.map.forEach((nodes, d) => {
    const row = document.createElement('div');
    row.className = 'depth'; row.dataset.depth = (d + 1) * 26 + ' FT';
    nodes.forEach((n, i) => {
      const el = document.createElement('div');
      const state = d < G.depth ? (G.path[d] === i ? 'taken' : 'skipped') : d === G.depth ? 'avail' : 'locked';
      el.className = `node ${n.type} ${state}`;
      const foes = n.enemies ? n.enemies.map(id => NS_ENEMIES[id]?.name || id).join(' / ') : '';
      el.innerHTML = `<div class="ntype">${NODE_LABEL[n.type] || n.type}${d === NIGHT.map.length - 1 ? ' -- LAST' : ''}</div>
        <div class="nname">${n.type === 'rest' ? 'Rewind or erase' : n.type === 'archive' ? 'Spend Clarity' : 'CAM ' + String.fromCharCode(65 + i) + (d + 1)}</div>
        ${foes ? `<div class="nfoes">${esc(foes)}</div>` : ''}`;
      if(state === 'avail') el.addEventListener('click', () => enterNode(i));
      row.appendChild(el);
    });
    wrap.appendChild(row);
  });
  setPhase('map');
}

function enterNode(i){
  G.path[G.depth] = i;
  G.node = NIGHT.map[G.depth][i];
  if(G.node.type === 'rest') return openRest();
  if(G.node.type === 'archive') return openArchive();
  startFeed(G.node);
}

function nodeDone(){
  G.depth++;
  if(G.depth >= NIGHT.map.length) return nightWon();
  renderMap();
}

/* ════════════ feed (battle) ════════════ */
function laneSlots(n){ return n <= 1 ? [1] : n === 2 ? [0, 2] : [0, 1, 2]; }

function makeEnemy(id){
  const d = NS_ENEMIES[id];
  const ew = save.bars.e || 0;
  const hp = d.hp + Math.floor(ew / 2) + (G.node.type === 'elite' ? 4 : 0);
  return { ...d, id, hp, maxHp:hp, step:0, shield:0, exposed:0, bonus:0, silenced:false,
           barBonus: Math.floor((save.bars[d.bar] || 0) / 4) };
}

function startFeed(node){
  G.lanes = Array.from({ length:LANES }, () => ({ enemy:null, ward:null }));
  const slots = laneSlots(node.enemies.length);
  node.enemies.forEach((id, i) => { if(NS_ENEMIES[id]) G.lanes[slots[i]].enemy = makeEnemy(id); });
  G.feedMaxHp = G.lanes.reduce((s, l) => s + (l.enemy ? l.enemy.maxHp : 0), 0) || 1;
  G.turn = 1;
  G.discard.push(...G.hand); G.hand = [];
  G.focus.cur = G.focus.max;
  drawCards(NS_CONFIG.handSize);
  $('observer').classList.toggle('hidden', (save.bars.e || 0) < NS_CONFIG.wallPulseAt);
  $('log').innerHTML = '';
  log(`${node.type === 'elite' ? 'STRONG SIGNAL' : 'FEED'} ACQUIRED -- ${node.enemies.map(id => NS_ENEMIES[id].name).join(', ')}`, 'hot');
  setPhase('battle');
  renderAll();
  JAM.action(true);
}

function renderAll(){ renderHud(); renderLanes(); renderHand(); }

function renderHud(){
  $('lucidity-val').textContent = `${G.lucidity.cur}/${G.lucidity.max}`;
  const low = G.lucidity.cur <= G.lucidity.max * 0.35;
  $('lucidity-plaque').classList.toggle('hurt', low);
  document.body.classList.toggle('low-lucidity', low && G.phase === 'battle');
  const c = $('candles'); c.innerHTML = '';
  for(let i = 0; i < Math.max(G.focus.max, G.focus.cur); i++){
    const d = document.createElement('div');
    d.className = 'candle' + (i >= G.focus.cur ? ' spent' : '');
    d.innerHTML = '<div class="flame"></div><div class="wax"></div>';
    c.appendChild(d);
  }
  $('deck-count').textContent = G.draw.length;
  $('discard-count').textContent = G.discard.length;
  $('turn-val').textContent = G.turn;
  $('feed-label').textContent = `${NIGHT.title} -- ${(G.depth + 1) * 26} FT`;
  const pips = $('depth-pips'); pips.innerHTML = '';
  NIGHT.map.forEach((_, i) => {
    const p = document.createElement('div');
    p.className = 'mission-pip' + (i < G.depth ? ' done' : i === G.depth ? ' current' : '');
    pips.appendChild(p);
  });
}

function intentOf(e){
  const [kind, n = 0] = e.pattern[e.step % e.pattern.length];
  return { kind, n: kind === 'attack' ? n + e.bonus + e.barBonus : n };
}
function intentBadge(e){
  if(e.silenced) return `<div class="intent-badge silenced">— silenced —</div>`;
  const it = intentOf(e);
  const txt = { attack:`⚔ ${it.n}`, guard:`▣ guard ${it.n}`, extend:`↑ extend +${it.n}`,
                whisper:`≋ whisper ×${it.n}`, watch:'◌ watching' }[it.kind] || it.kind;
  return `<div class="intent-badge ${it.kind}">${txt}</div>`;
}

function renderLanes(){
  const er = $('lane-enemy-row'), wr = $('lane-ward-row');
  er.innerHTML = ''; wr.innerHTML = '';
  G.lanes.forEach((lane, i) => {
    const cam = 'CAM ' + String.fromCharCode(65 + i) + (G.depth + 1);
    if(lane.enemy){
      const e = lane.enemy;
      const pod = document.createElement('div');
      pod.className = 'podium';
      pod.innerHTML = `
        <div class="enemy-card ${e.boss ? 'boss' : ''}" data-lane="${i}">
          ${intentBadge(e)}
          <div class="feed-tag">${cam}</div>
          <div class="enemy-glyph">${e.glyph}</div>
          <div class="enemy-name">${esc(e.name)}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${Math.max(0, e.hp / e.maxHp) * 100}%"></div></div>
          <div class="hp-text">${e.hp} / ${e.maxHp}</div>
          <div class="status-row">
            ${e.shield ? `<span class="status shield">▣ ${e.shield}</span>` : ''}
            ${e.exposed ? `<span class="status exposed">◈ +${e.exposed}</span>` : ''}
            ${e.bonus + e.barBonus ? `<span class="status atk" title="extend + threat bar">⚔ +${e.bonus + e.barBonus}</span>` : ''}
          </div>
          <div class="enemy-flavor">${esc(e.flavor)}</div>
        </div>
        <div class="stump"></div>`;
      er.appendChild(pod);
    }else{
      const em = document.createElement('div');
      em.className = 'lane-empty'; em.dataset.lane = i;
      em.textContent = `[ ${cam} -- NO SIGNAL ]`;
      er.appendChild(em);
    }
    const w = document.createElement('div');
    w.className = 'ward-slot' + (lane.ward ? ' filled' : '');
    w.dataset.lane = i;
    w.innerHTML = lane.ward ? `<span>▣ anchor ${lane.ward.value}</span>` : 'anchor';
    wr.appendChild(w);
  });
}

/* ---------- cards ---------- */
function statLabel(c){
  return ({ damage:`DMG ${c.value}`, damage_all:`ALL ${c.value}`, drain:`DRAIN ${c.value}`,
            heal:`+${c.value} LUCIDITY`, recall:`+${c.value} · DRAW 1`, ward:`ANCHOR ${c.value}`,
            ward_all:`ANCHOR ALL ${c.value}`, swap:'MOVE', draw:`DRAW ${c.value}`,
            energy:`+${c.value} FOCUS`, expose:`EXPOSE +${c.value}`, silence:'SILENCE',
            purge:'CLEAR' })[c.effect] || '';
}
function cardEl(c, affordable = true){
  const el = document.createElement('div');
  el.className = `card ${c.kind || ''}${c.exhaust ? ' exhaust' : ''}${affordable ? '' : ' unaffordable'}`;
  el.dataset.uid = c.uid || '';
  el.innerHTML = `
    <div class="rune-medallion cost-badge">${c.cost}</div>
    ${c.file ? `<div class="card-file">${esc(c.file)}</div>` : ''}
    <div class="card-glyph">${GLYPH[c.icon] || '◇'}</div>
    <div class="card-title">${esc(c.name)}</div>
    <div class="card-desc">${esc(c.desc)}</div>
    <div class="card-flavor">${esc(c.flavor || '')}</div>
    <div class="card-stat">${statLabel(c)}</div>`;
  return el;
}

function renderHand(){
  const h = $('hand'); h.innerHTML = '';
  const n = G.hand.length, mid = (n - 1) / 2;
  G.hand.forEach((c, i) => {
    const ok = G.focus.cur >= c.cost && !G.busy;
    const el = cardEl(c, ok);
    el.style.setProperty('--rot', ((i - mid) * 5) + 'deg');
    el.style.setProperty('--lift', (Math.abs(i - mid) * Math.abs(i - mid) * 4) + 'px');
    if(!ok) el.addEventListener('pointerdown', () => shakeEl(el));
    else if(c.target === 'self' || c.target === 'all') el.addEventListener('click', () => playCard(c.uid));
    else el.addEventListener('pointerdown', e => startDrag(e, el, c));
    h.appendChild(el);
  });
}

function startDrag(e, origin, card){
  e.preventDefault();
  const sel = card.target === 'enemy' ? '.enemy-card[data-lane]' : '.ward-slot[data-lane]';
  const r = origin.getBoundingClientRect();
  const ox = e.clientX - r.left, oy = e.clientY - r.top;
  const ghost = origin.cloneNode(true);
  ghost.classList.add('dragging');
  Object.assign(ghost.style, { width:r.width + 'px', height:r.height + 'px', left:(e.clientX - ox) + 'px', top:(e.clientY - oy) + 'px' });
  ghost.style.setProperty('--rot', '0deg'); ghost.style.setProperty('--lift', '0px');
  document.body.appendChild(ghost);
  origin.style.opacity = '0';
  let target = null;
  const move = ev => {
    ghost.style.left = (ev.clientX - ox) + 'px'; ghost.style.top = (ev.clientY - oy) + 'px';
    document.querySelectorAll('.drop-hover').forEach(n => n.classList.remove('drop-hover'));
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    target = under && under.closest(sel);
    if(target) target.classList.add('drop-hover');
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.querySelectorAll('.drop-hover').forEach(n => n.classList.remove('drop-hover'));
    const played = target ? playCard(card.uid, parseInt(target.dataset.lane, 10)) : false;
    ghost.remove();
    if(!played) origin.style.opacity = '1';
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

/* ---------- effects: one function per card "effect" ---------- */
function hurt(i, amount){
  const lane = G.lanes[i];
  if(!lane || !lane.enemy) return 0;
  const e = lane.enemy;
  let dmg = amount + e.exposed;
  const blocked = Math.min(e.shield, dmg);
  e.shield -= blocked; dmg -= blocked;
  e.hp = Math.max(0, e.hp - dmg);
  const el = document.querySelector(`.enemy-card[data-lane="${i}"]`);
  if(el){
    if(blocked) floatText(el, 'blocked ' + blocked, 'info');
    if(dmg) floatText(el, '-' + dmg, 'dmg');
    el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 400);
  }
  JAM.sfx('atk', .7);
  if(e.hp <= 0){
    log(`${e.name}: SIGNAL LOST`, 'good');
    if(el) el.classList.add('dying');
    lane.enemy = null;
  }
  return dmg;
}
function heal(n){
  G.lucidity.cur = Math.min(G.lucidity.max, G.lucidity.cur + n);
  floatText($('lucidity-plaque'), '+' + n, 'heal');
}
function anchor(i, n){
  if(i === undefined || isNaN(i) || !G.lanes[i]) return false;
  const lane = G.lanes[i];
  lane.ward = { value: Math.max(n, lane.ward ? lane.ward.value : 0) };
  const s = document.querySelector(`.ward-slot[data-lane="${i}"]`);
  if(s) floatText(s, '+' + n, 'info');
  return true;
}
const needsEnemy = i => !!(G.lanes[i] && G.lanes[i].enemy);

const EFFECTS = {
  damage(c, i){ if(!needsEnemy(i)) return false; hurt(i, c.value); return true; },
  damage_all(c){ let any = false; G.lanes.forEach((l, i) => { if(l.enemy){ any = true; hurt(i, c.value); } }); return any; },
  drain(c, i){ if(!needsEnemy(i)) return false; const d = hurt(i, c.value); const h = Math.floor(d / 2); if(h) heal(h); return true; },
  heal(c){ heal(c.value); return true; },
  recall(c){ heal(c.value); drawCards(1); return true; },
  ward(c, i){ return anchor(i, c.value); },
  ward_all(c){ G.lanes.forEach((_, i) => anchor(i, c.value)); return true; },
  swap(c, i){
    if(!needsEnemy(i)) return false;
    const to = [i - 1, i + 1].find(j => j >= 0 && j < LANES && !G.lanes[j].enemy);
    const el = document.querySelector(`.enemy-card[data-lane="${i}"]`);
    if(to === undefined){ if(el){ floatText(el, 'it will not move', 'info'); shakeEl(el); } return false; }
    G.lanes[to].enemy = G.lanes[i].enemy; G.lanes[i].enemy = null;
    return true;
  },
  draw(c){ drawCards(c.value); return true; },
  energy(c){ G.focus.cur += c.value; return true; },
  expose(c, i){ if(!needsEnemy(i)) return false; G.lanes[i].enemy.exposed += c.value; return true; },
  silence(c, i){ if(!needsEnemy(i)) return false; G.lanes[i].enemy.silenced = true; log(`${G.lanes[i].enemy.name} goes quiet.`); return true; },
  purge(){ G.stats.statics++; return true; }
};

function playCard(uid, lane){
  if(G.phase !== 'battle' || G.busy) return false;
  const c = G.hand.find(x => x.uid === uid);
  if(!c || G.focus.cur < c.cost) return false;
  const fn = EFFECTS[c.effect];
  if(!fn || !fn(c, lane)) return false;
  G.focus.cur -= c.cost;
  G.hand = G.hand.filter(x => x.uid !== uid);
  (c.exhaust ? G.exhausted : G.discard).push(c);
  JAM.sfx('tapp', .6);
  renderAll();
  checkClear();
  return true;
}

/* ---------- enemy phase ---------- */
async function endTurn(){
  if(G.phase !== 'battle' || G.busy) return;
  G.busy = true;
  $('end-turn-btn').disabled = true;
  G.lanes.forEach(l => { if(l.enemy) l.enemy.exposed = 0; });
  G.discard.push(...G.hand); G.hand = [];
  renderAll();

  for(let i = 0; i < LANES; i++){
    const e = G.lanes[i].enemy;
    if(!e) continue;
    await sleep(380);
    e.shield = 0;
    if(e.silenced){ e.silenced = false; e.step++; log(`${e.name} does nothing.`); renderLanes(); continue; }
    const it = intentOf(e);
    e.step++;
    act(e, i, it);
    renderAll();
    if(G.lucidity.cur <= 0) break;
  }

  /* the wall itself (East Wall high) */
  if(G.lucidity.cur > 0 && (save.bars.e || 0) >= NS_CONFIG.wallPulseAt && G.turn % NS_CONFIG.wallPulseEvery === 0){
    await sleep(300);
    G.lucidity.cur = Math.max(0, G.lucidity.cur - 1);
    floatText($('lucidity-plaque'), '-1', 'dmg');
    log('THE WALL EXTENDS.', 'hot');
    shakeBody();
  }

  await sleep(250);
  G.busy = false;
  $('end-turn-btn').disabled = false;
  if(G.lucidity.cur <= 0) return nightLost();
  G.turn++; G.stats.turns++;
  G.focus.cur = G.focus.max;
  drawCards(NS_CONFIG.handSize);
  renderAll();
}

function act(e, i, it){
  const el = document.querySelector(`.enemy-card[data-lane="${i}"]`);
  if(it.kind === 'attack'){
    if(el){ el.classList.add('attacking'); setTimeout(() => el.classList.remove('attacking'), 420); }
    const lane = G.lanes[i];
    let dmg = it.n, absorbed = 0;
    if(lane.ward){
      absorbed = Math.min(lane.ward.value, dmg);
      lane.ward.value -= absorbed; dmg -= absorbed;
      if(lane.ward.value <= 0) lane.ward = null;
      const ws = document.querySelector(`.ward-slot[data-lane="${i}"]`);
      if(absorbed && ws) floatText(ws, 'held ' + absorbed, 'info');
    }
    if(dmg > 0){
      G.lucidity.cur = Math.max(0, G.lucidity.cur - dmg);
      floatText($('lucidity-plaque'), '-' + dmg, 'dmg');
      JAM.hit(); shakeBody();
    }
    log(`${e.name} -- ${it.n}${absorbed ? ` (${absorbed} held)` : ''}`, dmg ? 'hot' : '');
  }else if(it.kind === 'guard'){
    e.shield = it.n;
    log(`${e.name} braces. ▣ ${it.n}`);
  }else if(it.kind === 'extend'){
    e.bonus += it.n;
    log(`${e.name} extends. Attacks +${it.n}.`, 'hot');
  }else if(it.kind === 'whisper'){
    for(let k = 0; k < it.n; k++) G.discard.push(inst('static'));
    if(el) floatText(el, '+' + it.n + ' STATIC', 'info');
    log(`${e.name} whispers. ${it.n} STATIC in your discard.`, 'hot');
  }else{
    log(`${e.name} is aware of you.`);
  }
}

function checkClear(){
  if(G.phase !== 'battle') return;
  if(G.lanes.some(l => l.enemy)) return;
  G.busy = true;
  setTimeout(() => {
    G.busy = false;
    G.stats.feeds++;
    const elite = G.node.type === 'elite';
    save.clarity = (save.clarity || 0) + (elite ? NS_CONFIG.clarityElite : NS_CONFIG.clarityPerFeed);
    SW.commit();
    G.lucidity.cur = Math.min(G.lucidity.max, G.lucidity.cur + NS_CONFIG.mercyHeal);
    JAM.action(false);
    if(G.depth >= NIGHT.map.length - 1) return nodeDone();   // boss: straight to waking
    openReward(elite ? 2 : 1);
  }, 450);
}

/* ════════════ reward ════════════ */
function openReward(picks){
  const grid = $('reward-grid'); grid.innerHTML = '';
  $('reward-eyebrow').textContent = `the feed goes dark  ·  +${G.node.type === 'elite' ? NS_CONFIG.clarityElite : NS_CONFIG.clarityPerFeed} clarity`;
  if(owned() >= NS_CONFIG.maxDeck){
    $('reward-title').textContent = 'Your case file is full';
    setPhase('reward'); return;
  }
  const have = new Set(save.deck || []);
  let pool = NS_REWARDS.filter(id => !have.has(id));
  if(pool.length < 3) pool = NS_REWARDS.slice();
  shuffle(pool).slice(0, 3).forEach(id => {
    const w = document.createElement('div');
    w.className = 'pick';
    w.appendChild(cardEl(NS_CARDS[id]));
    w.addEventListener('click', () => {
      takeCard(id);
      w.remove();
      if(--picks <= 0 || owned() >= NS_CONFIG.maxDeck) finishReward();
      else $('reward-title').textContent = 'And one more';
    });
    grid.appendChild(w);
  });
  $('reward-title').textContent = picks > 1 ? 'Choose two to carry forward' : 'Choose what you carry forward';
  setPhase('reward');
}
function takeCard(id){
  save.deck = (save.deck || []).concat(id);
  G.discard.push(inst(id));
  G.stats.cards++;
  SW.commit();
}
function finishReward(){ nodeDone(); }

/* ════════════ tape deck (rest) ════════════ */
function openRest(){
  $('rest-heal-n').textContent = NS_CONFIG.restHeal;
  $('rest-grid').classList.add('hidden'); $('rest-leave').classList.add('hidden');
  document.querySelector('.rest-choices').classList.remove('hidden');
  setPhase('rest');
}
function restHeal(){
  G.lucidity.cur = Math.min(G.lucidity.max, G.lucidity.cur + NS_CONFIG.restHeal);
  nodeDone();
}
function restShred(){
  document.querySelector('.rest-choices').classList.add('hidden');
  const grid = $('rest-grid'); grid.innerHTML = ''; grid.classList.remove('hidden');
  $('rest-leave').classList.remove('hidden');
  const all = G.draw.concat(G.hand, G.discard);
  const seen = new Set();
  all.forEach(c => {
    if(c.kind === 'curse' || seen.has(c.id)) return;
    seen.add(c.id);
    const w = document.createElement('div'); w.className = 'pick';
    w.appendChild(cardEl(c));
    w.addEventListener('click', () => {
      ['draw','hand','discard'].some(k => { const j = G[k].findIndex(x => x.id === c.id); if(j >= 0){ G[k].splice(j, 1); return true; } });
      const di = (save.deck || []).indexOf(c.id);
      if(di >= 0) save.deck.splice(di, 1); else save.shred = (save.shred || []).concat(c.id);
      SW.commit();
      nodeDone();
    });
    grid.appendChild(w);
  });
}

/* ════════════ archive (shop) ════════════ */
function openArchive(){
  const price = NS_CONFIG.archivePrice;
  $('archive-price').textContent = price;
  const grid = $('archive-grid'); grid.innerHTML = '';
  const draw = () => {
    $('archive-clarity').textContent = save.clarity || 0;
    grid.querySelectorAll('.pick').forEach(p => p.classList.toggle('poor', (save.clarity || 0) < price));
  };
  shuffle(NS_REWARDS.slice()).slice(0, 4).forEach(id => {
    const w = document.createElement('div'); w.className = 'pick';
    w.appendChild(cardEl(NS_CARDS[id]));
    const tag = document.createElement('div'); tag.className = 'price'; tag.textContent = price + ' clarity';
    w.appendChild(tag);
    w.addEventListener('click', () => {
      if((save.clarity || 0) < price || owned() >= NS_CONFIG.maxDeck) return shakeEl(w);
      save.clarity -= price;
      takeCard(id);
      w.remove(); draw();
    });
    grid.appendChild(w);
  });
  draw();
  setPhase('archive');
}

/* ════════════ end of night ════════════ */
function nightWon(){
  save.bars.e = Math.max(0, (save.bars.e || 0) + NS_CONFIG.winEastWall);
  SW.setBars(save.bars);
  SW.flag(NIGHT.id, 'held');
  SW.flag('tired', false);
  JAM.stop(); JAM.sfx('won', .8);
  playInterlude(NIGHT.video, () => showEnd('win'));
}
function nightLost(){
  JAM.stop(); JAM.sfx('death', .9);
  showEnd('loss');
}

function showEnd(result){
  const v = $('view-end');
  v.classList.remove('win', 'loss'); v.classList.add(result);
  const name = save.name ? save.name : 'you';
  if(result === 'win'){
    $('end-eyebrow').textContent = 'the night lets you go';
    $('end-title').textContent = 'YOU WOKE UP';
    $('end-summary').textContent = NIGHT.win;
    $('end-retry').classList.add('hidden');
    $('end-wake').textContent = 'Get up  →';
    $('end-hint').textContent = 'East Wall eased by ' + (-NS_CONFIG.winEastWall) + '.';
  }else{
    $('end-eyebrow').textContent = 'the night keeps ' + name.toLowerCase();
    $('end-title').textContent = 'PERCEIVED';
    $('end-summary').textContent = NIGHT.lose;
    $('end-retry').classList.remove('hidden');
    $('end-wake').textContent = 'Wake up  (stay up all night)';
    $('end-hint').textContent = `Waking now: East Wall +${NS_CONFIG.loseEastWall}, and you start the next night tired.`;
  }
  $('end-stats').innerHTML = `
    <div class="stat-block"><div class="num">${G.stats.feeds}</div><div class="lbl">Feeds Cut</div></div>
    <div class="stat-block"><div class="num">${G.stats.turns}</div><div class="lbl">Turns</div></div>
    <div class="stat-block"><div class="num">${G.stats.cards}</div><div class="lbl">Cards Taken</div></div>
    <div class="stat-block"><div class="num">${save.clarity || 0}</div><div class="lbl">Clarity</div></div>`;
  setPhase('end');
  document.body.classList.remove('low-lucidity');
}

function wake(){
  if($('view-end').classList.contains('loss')){
    save.bars.e = Math.min(10, (save.bars.e || 0) + NS_CONFIG.loseEastWall);
    SW.setBars(save.bars);
    SW.flag(NIGHT.id, 'taken');
    SW.flag('tired', true);
  }
  SW.commit();
  location.href = NIGHT.next;
}

/* ════════════ waking video (optional videos/<id>.mp4) ════════════ */
let interludeDone = null;
function playInterlude(id, done){
  if(!id) return done();
  interludeDone = done;
  const v = $('interlude-video');
  $('interlude-missing').classList.add('hidden');
  $('interlude-missing-id').textContent = id + '.mp4';
  v.src = 'videos/' + id + '.mp4';
  v.onended = finishInterlude;
  v.onerror = () => $('interlude-missing').classList.remove('hidden');
  setPhase('interlude');
  v.play().catch(() => {});
}
function finishInterlude(){
  const v = $('interlude-video');
  v.pause(); v.onended = v.onerror = null;
  const d = interludeDone; interludeDone = null;
  if(d) d();
}

/* ════════════ entity canvas (from remco.html) ════════════
   The more of the feed's HP you strip, the more of *it* shows. */
function entityCanvas(){
  const cv = $('entity-canvas'), ctx = cv.getContext('2d');
  const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
  fit(); addEventListener('resize', fit);
  (function frame(ts){
    requestAnimationFrame(frame);
    if(G.phase !== 'battle') return;
    const t = ts * 0.001, W = cv.width, H = cv.height;
    const left = G.lanes.reduce((s, l) => s + (l.enemy ? l.enemy.hp : 0), 0);
    const rev = 1 - Math.min(1, left / G.feedMaxHp);
    const ew = (save.bars.e || 0) / 10;
    ctx.clearRect(0, 0, W, H);
    for(let i = 0; i < 6; i++){
      const ph = (i / 6) * Math.PI * 2;
      const cx = W * .5 + Math.sin(t * .28 + ph) * W * .3 * (1 + rev * .7);
      const cy = H * .42 + Math.cos(t * .19 + ph * 1.4) * H * .3 * (1 + rev * .7);
      const r = (60 + i * 30) * (.5 + rev * .9 + ew * .4) * (.75 + .25 * Math.sin(t * .7 + i));
      const a = .02 + rev * .1 + ew * .03;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${Math.round(70 + 140 * rev)},${Math.round(20 * (1 - rev))},10,${a * 3})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * (.4 + .28 * Math.cos(t * .38 + i * .9)), t * .07 + ph, 0, Math.PI * 2);
      ctx.fill();
    }
    if(Math.random() < .015 + ew * .03){
      ctx.fillStyle = `rgba(255,40,0,${.04 + Math.random() * .06})`;
      ctx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 2);
    }
  })(0);
}

/* ════════════ helpers ════════════ */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]); }
function log(msg, cls){
  const d = document.createElement('div');
  if(cls) d.className = cls;
  d.textContent = '> ' + msg;
  const l = $('log'); l.appendChild(d);
  while(l.children.length > 8) l.firstChild.remove();
}
function floatText(anchor, text, kind){
  if(!anchor) return;
  const r = anchor.getBoundingClientRect();
  const t = document.createElement('div');
  t.className = 'float-text ' + kind; t.textContent = text;
  t.style.left = (r.left + r.width / 2 - 10) + 'px'; t.style.top = r.top + 'px';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1150);
}
function shakeEl(el){
  el.animate([{ transform:'translateX(0)' }, { transform:'translateX(-6px)' }, { transform:'translateX(5px)' }, { transform:'translateX(0)' }], { duration:300 });
}
function shakeBody(){ document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }

/* ════════════ wire up ════════════ */
$('brief-go').addEventListener('click', () => { JAM.start(); renderMap(); });
$('end-turn-btn').addEventListener('click', endTurn);
$('reward-skip').addEventListener('click', finishReward);
$('rest-heal').addEventListener('click', restHeal);
$('rest-shred').addEventListener('click', restShred);
$('rest-leave').addEventListener('click', nodeDone);
$('archive-leave').addEventListener('click', nodeDone);
$('interlude-skip').addEventListener('click', finishInterlude);
$('interlude-continue').addEventListener('click', finishInterlude);
$('end-wake').addEventListener('click', wake);
$('end-retry').addEventListener('click', () => { beginNight(); renderBrief(); });
document.addEventListener('keydown', e => { if(e.key === 'e' || e.key === 'E') endTurn(); });

entityCanvas();
beginNight();
renderBrief();
