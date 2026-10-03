/* ════════════════════════════════════════════════════════
   JOSEPH No. 1  --  engine  (js/mineEngine.js)

   Wolfenstein-style raycaster for the 1962 drift. Everything
   story-side lives in the level files (levels/*.json, format in
   js/mineLevel.js and docs/LEVEL_FORMAT.md). This file is the
   rules of the mine:

     cut -> drill -> check gas -> shoot -> load -> dump -> dust

   Load order (mine.html):
     swState.js, mineSheets.js, mineArt.js, mineLevel.js, mineEngine.js

   URL options
     mine.html                       levels/e1m1.json
     mine.html?level=levels/e1m2.json  start on a given level
     mine.html?playtest=1            level handed over by control.html
                                     (localStorage 'mine_playtest')
════════════════════════════════════════════════════════ */
(function(){
'use strict';

const L = MineLevel, T = L.T;
const VW = 320, VH = 160, HALF = 80, SW_ = 640, SH_ = 400, VIEW_H = 320;
const AMB = 0.035, FOV = 0.66;
const SCOOP_T = 7, SLACK_T = 5, CAR_MAX = 3;
const DUST_GAS = 60, DUST_SOLID = 80;
const TOOL_NAMES = ['', 'LAMP', 'CUTTER', 'DRILL', 'POWDER', 'SHOVEL', 'DUSTER'];
const WHO_COL = { LUTHER:'#e3c27a', EBWARD:'#9fc6e0', HAROLD:'#d58a5a', '':'#d8d4c8' };

/* ── canvases ─────────────────────────────────────────── */
const cv = document.getElementById('screen'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const view = document.createElement('canvas'); view.width = VW; view.height = VH;
const vctx = view.getContext('2d'), img = vctx.createImageData(VW, VH), buf = img.data;
const zbuf = new Float32Array(VW), cone = new Float32Array(VW);
for(let x = 0; x < VW; x++){ const s = (x - VW/2)/(VW*0.34); cone[x] = 0.16 + 0.84*Math.exp(-s*s); }

/* ── world ────────────────────────────────────────────── */
let ART = null, TX = null, LVJ = null, LV = null;
let W = 0, H = 0, map, dust, seen, glow, dayl, scoops, yieldT;
let cWarm, cAnom, cGas, cNomine, cFloor, cCeil, cAmb, cDrain, cDrone;
const P = { x:1.5, y:12.5, a:0 };
let S = null;

const FLATS = ['mud', 'floor_dust', 'root_floor', 'ceil_shale', 'ceil_dust', 'root_ceil'];

function idx(x, y){ return y*W + x; }
function inMap(x, y){ return x >= 0 && y >= 0 && x < W && y < H; }
function tileAt(x, y){ return inMap(x, y) ? map[idx(x, y)] : T.ROCK; }

/* ── level setup ──────────────────────────────────────── */
async function fetchLevel(url){
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now());
  if(!r.ok) throw new Error('could not load ' + url);
  return r.json();
}

function setupLevel(j){
  LVJ = j; LV = JSON.parse(JSON.stringify(j));
  W = LV.w; H = LV.h;
  map = L.gridFrom(LV); dust = L.dustFrom(LV);
  const n = W*H;
  seen = new Uint8Array(n); glow = new Float32Array(n); dayl = new Float32Array(n);
  scoops = new Uint8Array(n); yieldT = new Uint8Array(n);
  cWarm = new Uint8Array(n); cAnom = new Uint8Array(n); cGas = new Float32Array(n);
  cNomine = new Int16Array(n).fill(-1); cFloor = new Int8Array(n).fill(-1); cCeil = new Int8Array(n).fill(-1);
  cAmb = new Float32Array(n); cDrain = new Float32Array(n).fill(1); cDrone = new Float32Array(n);
  for(let i = 0; i < n; i++) if(map[i] === T.RUBBLE){ scoops[i] = 3; yieldT[i] = SCOOP_T; }
  (LV.zones || []).forEach((z, zi) => {
    for(let y = Math.max(0, z.y0); y <= Math.min(H - 1, z.y1); y++)
      for(let x = Math.max(0, z.x0); x <= Math.min(W - 1, z.x1); x++){
        const c = idx(x, y);
        if(z.warm) cWarm[c] = 1;
        if(z.anomaly) cAnom[c] = 1;
        if(z.gas) cGas[c] += +z.gas;
        if(z.nomine) cNomine[c] = zi;
        if(z.floor && FLATS.indexOf(z.floor) >= 0) cFloor[c] = FLATS.indexOf(z.floor);
        if(z.ceil && FLATS.indexOf(z.ceil) >= 0) cCeil[c] = FLATS.indexOf(z.ceil);
        if(z.ambient) cAmb[c] = +z.ambient;
        if(z.drain) cDrain[c] = +z.drain;
        if(z.drone) cDrone[c] = +z.drone;
      }
  });
  const st = LV.start || {};
  S = {
    counters: Object.assign({ tons:0, found:0, sealed:0 }, st.counters || {}),
    flags: {}, fired: new Set(), cool: {}, talkIdx: {},
    tools: st.tools || [1,2,3,4,5,6], tool: (st.tools || [1])[0],
    powder: st.powder != null ? st.powder : 4, bags: st.bags != null ? st.bags : 8,
    battery: st.battery != null ? st.battery : 100, drain: st.drain != null ? st.drain : 0.12,
    hp: 100, minutes: st.clock != null ? st.clock : 420, car: 0, carTons: 0, dust: 0,
    beltOn: !!(st.belt && st.belt.on), obj: '', msgs: [], action: null, fuses: [],
    shake: 0, flash: 0, flashCol: '#fff', t: 0, gasCell: -1, gasRead: null, gasT: -99,
    brattice: {}, cleared: {}, walk: 0, stepT: 0, faceT: 0, faceLook: 'calm', hurtT: 0, scareT: 0,
    toolAnim: 0, toolFire: 0, busy: 0, ended: false, dead: false, puffs: []
  };
  P.x = LV.player.x; P.y = LV.player.y; P.a = LV.player.a || 0;
  LV.things = (LV.things || []).map(t => Object.assign({}, t));
  computeLight();
  markSeen();
}

function computeLight(){
  glow.fill(0); dayl.fill(0);
  const lights = LV.things.filter(t => t.type === 'light' && !t.hidden);
  const portals = [];
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(map[idx(x, y)] === T.PORTAL) portals.push([x + 0.5, y + 0.5]);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const c = idx(x, y), cx = x + 0.5, cy = y + 0.5;
    let g = cAmb[c];
    lights.forEach(l => { const r = l.glow || 6, d = Math.hypot(cx - l.x, cy - l.y); g += 0.85*Math.exp(-d/(r*0.7)); });
    glow[c] = Math.min(1.4, g);
    let dl = 0;
    portals.forEach(p => { const d = Math.hypot(cx - p[0], cy - p[1]); if(d < 7) dl = Math.max(dl, 0.48*(1 - d/7)); });
    dayl[c] = dl;
  }
}

/* ── things ───────────────────────────────────────────── */
function thing(id){ return LV.things.find(t => t.id === id); }
function tdef(t){ return L.THINGS[t.type] || {}; }
function isSolid(t){ return t.solid != null ? t.solid : !!tdef(t).solid; }

function frontThing(maxD){
  let best = null, bd = maxD;
  const dx = Math.cos(P.a), dy = Math.sin(P.a);
  LV.things.forEach(t => {
    if(t.hidden) return;
    const u = tdef(t).use; if(!u && !hasUseTrigger(t.id)) return;
    const ox = t.x - P.x, oy = t.y - P.y, d = Math.hypot(ox, oy);
    if(d > bd || d < 0.01) return;
    if((ox*dx + oy*dy)/d < 0.55) return;
    best = t; bd = d;
  });
  return best;
}
function hasUseTrigger(id){ return (LV.triggers || []).some(tr => tr.when && tr.when.on === 'use' && tr.when.thing === id); }

/* ── rays ─────────────────────────────────────────────── */
function castFacing(maxD){
  const rdx = Math.cos(P.a), rdy = Math.sin(P.a);
  let mx = Math.floor(P.x), my = Math.floor(P.y);
  const ddx = Math.abs(1/rdx), ddy = Math.abs(1/rdy);
  let sx, sy, sdx, sdy;
  if(rdx < 0){ sx = -1; sdx = (P.x - mx)*ddx; } else { sx = 1; sdx = (mx + 1 - P.x)*ddx; }
  if(rdy < 0){ sy = -1; sdy = (P.y - my)*ddy; } else { sy = 1; sdy = (my + 1 - P.y)*ddy; }
  for(let i = 0; i < 16; i++){
    let d;
    if(sdx < sdy){ d = sdx; sdx += ddx; mx += sx; } else { d = sdy; sdy += ddy; my += sy; }
    if(d > maxD) return null;
    if(!inMap(mx, my)) return null;
    const t = map[idx(mx, my)];
    if(t !== T.OPEN) return { x:mx, y:my, c:idx(mx, my), t, d };
  }
  return null;
}

/* ── messages / cards ─────────────────────────────────── */
function say(text, who){
  who = (who || '').toUpperCase();
  S.msgs.push({ text, who, t: S.t, life: 5 + text.length*0.045 });
  if(S.msgs.length > 6) S.msgs.shift();
}

const cardEl = document.getElementById('card'), cardText = document.getElementById('cardText'),
      cardHint = document.getElementById('cardHint'), cardBtns = document.getElementById('cardBtns');
let cardState = null;
function card(lines, buttons){
  return new Promise(res => {
    if(document.pointerLockElement) document.exitPointerLock();
    cardEl.classList.add('on'); cardBtns.innerHTML = ''; cardText.textContent = '';
    cardHint.style.display = buttons ? 'none' : '';
    const full = (lines || []).join('\n');
    cardState = { full, n: 0, done: false, res, buttons };
    S && (S.cardOpen = true);
  });
}
function cardTick(dt){
  if(!cardState || cardState.done) return;
  cardState.n += dt*70;
  const n = Math.min(cardState.full.length, cardState.n | 0);
  cardText.textContent = cardState.full.slice(0, n);
  if(n >= cardState.full.length) cardFinish();
}
function cardFinish(){
  const cs = cardState; if(!cs || cs.done) return;
  cs.done = true; cardText.textContent = cs.full;
  if(cs.buttons){
    cs.buttons.forEach(b => {
      const el = document.createElement(b.href ? 'a' : 'button');
      el.className = 'cbtn'; el.textContent = b.label;
      if(b.href) el.href = b.href;
      else el.onclick = ev => { ev.stopPropagation(); closeCard(); b.fn && b.fn(); };
      cardBtns.appendChild(el);
    });
  }
}
function cardAdvance(){
  if(!cardState) return;
  if(!cardState.done){ cardFinish(); return; }
  if(cardState.buttons) return;
  closeCard();
}
function closeCard(){
  const cs = cardState; cardState = null;
  cardEl.classList.remove('on');
  if(S) S.cardOpen = false;
  if(cs) cs.res();
}
cardEl.addEventListener('click', cardAdvance);

/* ── triggers ─────────────────────────────────────────── */
function inRect(w, x, y){
  return x >= w.x0 && x < w.x1 + 1 && y >= w.y0 && y < w.y1 + 1;
}
function rectOK(w, x, y){ return w.x0 == null || inRect(w, x, y); }
function matchWhen(w, ev){
  switch(w.on){
    case 'start':   return ev && ev.on === 'start';
    case 'enter':   return !ev && inRect(w, P.x, P.y);
    case 'near':    { if(ev) return false; const t = thing(w.thing); return !!t && !t.hidden && Math.hypot(t.x - P.x, t.y - P.y) <= (w.r || 1.4); }
    case 'use':     return ev && ev.on === 'use' && ev.thing === w.thing;
    case 'usetile': return ev && ev.on === 'usetile' && ((w.tile && ev.tile === w.tile) || (w.x != null && ev.x === +w.x && ev.y === +w.y));
    case 'mine':    return ev && ev.on === 'mine' && (!w.step || w.step === ev.step) && rectOK(w, ev.x + 0.5, ev.y + 0.5);
    case 'dust':    return ev && ev.on === 'dust' && rectOK(w, ev.x, ev.y);
    case 'lamp':    return ev && ev.on === 'lamp' && rectOK(w, ev.x, ev.y);
    case 'counter': return !ev && (S.counters[w.name] || 0) >= +w.gte;
    case 'flag':    return !ev && !!S.flags[w.name];
    case 'timer':   return !ev && S.t >= +w.sec;
  }
  return false;
}
function condOK(c){
  if(!c) return true;
  return [].concat(c).every(k => {
    if(k.flag != null) return !!S.flags[k.flag];
    if(k.notflag != null) return !S.flags[k.notflag];
    if(k.counter != null){
      const v = S.counters[k.counter] || 0;
      if(k.gte != null && !(v >= +k.gte)) return false;
      if(k.lt != null && !(v < +k.lt)) return false;
      return true;
    }
    return true;
  });
}
function fire(ev){
  if(!S || S.ended || S.dead) return false;
  let handled = false;
  for(const tr of (LV.triggers || [])){
    const once = tr.once !== false;
    if(once && S.fired.has(tr.id)) continue;
    if(S.cool[tr.id] && S.t < S.cool[tr.id]) continue;
    if(!tr.when || !matchWhen(tr.when, ev)) continue;
    const pass = condOK(tr.if);
    if(!pass && !(tr.else && tr.else.length)) continue;
    if(pass && once) S.fired.add(tr.id);
    else S.cool[tr.id] = S.t + (tr.cooldown || 3);
    run(pass ? tr.do : tr.else);
    handled = true;
  }
  return handled;
}
async function run(list){
  const s0 = S;
  for(const a of (list || [])){
    if(!S || S !== s0 || (S.ended && !('end' in a))) return;
    await act(a);
  }
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
async function act(a){
  if('say' in a) say(a.say, a.who);
  else if('card' in a) await card(a.card);
  else if('obj' in a) S.obj = a.obj;
  else if('set' in a) S.flags[a.set] = ('to' in a) ? a.to : true;
  else if('add' in a) S.counters[a.add] = (S.counters[a.add] || 0) + (a.n == null ? 1 : +a.n);
  else if('tile' in a) setTiles(a);
  else if('dust' in a) dustRect(a.x0, a.y0, a.x1, a.y1, a.dust !== false);
  else if('spawn' in a){ LV.things = LV.things.filter(t => t.id !== a.spawn.id); LV.things.push(Object.assign({}, a.spawn)); if(a.spawn.type === 'light') computeLight(); }
  else if('remove' in a){ const t = thing(a.remove); LV.things = LV.things.filter(t => t.id !== a.remove); if(t && t.type === 'light') computeLight(); }
  else if('move' in a){ const t = thing(a.move); if(t){ t.x = +a.x; t.y = +a.y; if(t.type === 'light') computeLight(); } }
  else if('give' in a){
    const g = a.give;
    if(g.powder) S.powder += +g.powder; if(g.bags) S.bags += +g.bags;
    if(g.battery != null) S.battery = +g.battery; if(g.hp != null) S.hp = +g.hp;
  }
  else if('teleport' in a){ P.x = +a.teleport.x; P.y = +a.teleport.y; if(a.teleport.a != null) P.a = +a.teleport.a; }
  else if('belt' in a) S.beltOn = !!a.belt;
  else if('shake' in a) S.shake = +a.shake;
  else if('flash' in a){ S.flash = 1; S.flashCol = a.flash || '#fff'; }
  else if('sound' in a) Snd.play(a.sound);
  else if('wait' in a) await sleep((+a.wait)*1000);
  else if('save' in a){
    if(typeof SW !== 'undefined'){
      if(a.save.evidence) SW.find(a.save.evidence);
      if(a.save.flag) SW.flag(a.save.flag, true);
      SW.commit && SW.commit();
    }
  }
  else if('end' in a) await endLevel(a.end);
}
function setTiles(a){
  const id = L.CH2ID[a.tile]; if(id == null) return;
  const x0 = +a.x, y0 = +a.y, x1 = a.x1 != null ? +a.x1 : x0, y1 = a.y1 != null ? +a.y1 : y0;
  let light = id === T.PORTAL;
  for(let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for(let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++){
      if(!inMap(x, y)) continue;
      const c = idx(x, y);
      if(a.onlyOpen && map[c] !== T.OPEN) continue;
      if(id !== T.OPEN && Math.floor(P.x) === x && Math.floor(P.y) === y) continue;
      if(map[c] === T.PORTAL) light = true;
      map[c] = id;
      if(id === T.RUBBLE){ scoops[c] = 3; yieldT[c] = SCOOP_T; }
    }
  if(light) computeLight();
}
function dustRect(x0, y0, x1, y1, on){
  for(let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
    for(let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) dust[idx(x, y)] = on ? 1 : 0;
}

async function endLevel(e){
  S.ended = true;
  if(e.card && e.card.length) await card(e.card, (!e.next && e.buttons) ? mkButtons(e.buttons) : null);
  if(e.next){ await startLevel(e.next); return; }
  if(!e.card || !e.card.length) await card(['THE END'], mkButtons(e.buttons || []));
}
function mkButtons(list){
  const out = (list || []).map(b => b.href ? { label:b.label, href:b.href } :
    { label:b.label, fn:() => { if(b.level) startLevel(b.level); else restart(); } });
  out.push({ label:'Play again', fn:() => startLevel(FIRST) });
  return out;
}

/* ── mining rules ─────────────────────────────────────── */
function gasAt(c){
  if(c < 0) return 0;
  if(cAnom[c]) return -1;
  let g = (LV.rules && LV.rules.gasBase != null ? +LV.rules.gasBase : 0.25) + cGas[c];
  if(S.cleared[c]) g = Math.min(g, 0.3);
  return Math.round(g*10)/10;
}
function nomine(c){
  if(c < 0 || cNomine[c] < 0) return false;
  say(LV.zones[cNomine[c]].nomine, LV.zones[cNomine[c]].nomineWho || '');
  return true;
}
function toolOK(n){
  if(S.tools.indexOf(n) >= 0) return true;
  say(LV.start && LV.start.toolsOffSay || 'You don\'t have that today.');
  return false;
}

function useTool(){
  if(!S || S.cardOpen || S.ended || S.dead || S.action) return;
  const n = S.tool;
  if(!toolOK(n)) return;
  const f = castFacing(n === 1 ? 2.4 : 1.7);
  if(n === 1){
    const c = f ? f.c : idx(Math.floor(P.x), Math.floor(P.y));
    const g = gasAt(c);
    S.gasCell = c; S.gasRead = g; S.gasT = S.t; S.toolFire = 0.5;
    if(g < 0) say('No cap on the flame. It burns tall and yellow and steady. That isn\'t gas.');
    else if(g >= 1) say('Blue cap on the flame. Gas, ' + g.toFixed(1) + '%. Don\'t shoot it. Hang a curtain on it [E].');
    else say('Flame\'s clean. ' + g.toFixed(1) + '%.');
    Snd.play('blip');
    fire({ on:'lamp', x:P.x, y:P.y });
    return;
  }
  if(n === 6){
    if(S.bags <= 0){ say('Out of rock dust. Bags are at the supply by the portal.'); return; }
    begin('dust', null, 0.7); Snd.play('spray'); return;
  }
  if(!f){ say(n === 5 ? 'Nothing to load here.' : 'You need a coal face in front of you.'); return; }
  if(n === 2){
    if(f.t !== T.COAL && f.t !== T.MARK){ say(f.t === T.CUT ? 'It\'s already undercut. Drill it.' : 'The cutter needs a solid coal face.'); return; }
    if(f.t === T.MARK || nomine(f.c)){ if(f.t === T.MARK && cNomine[f.c] < 0) say('That\'s Harold\'s paint. Nobody cuts it.', 'LUTHER'); return; }
    begin('cut', f, 1.8); Snd.play('cut'); return;
  }
  if(n === 3){
    if(f.t !== T.COAL && f.t !== T.CUT){ say(f.t === T.DRILL || f.t === T.SOLID ? 'Already drilled. Load it with powder.' : 'Nothing to drill.'); return; }
    if(nomine(f.c)) return;
    begin(f.t === T.CUT ? 'drill' : 'drill_solid', f, 1.4); Snd.play('drill'); return;
  }
  if(n === 4){
    if(f.t !== T.DRILL && f.t !== T.SOLID){ say(f.t === T.COAL ? 'Undercut it and drill it before you shoot it.' : 'Nothing drilled to shoot.'); return; }
    if(S.powder <= 0){ say('Out of powder. Restock at the supply by the portal.'); return; }
    if(S.fuses.some(z => z.c === f.c)) return;
    if(S.gasCell !== f.c || S.t - S.gasT > 90) say('You didn\'t check your gas on that face, son.', 'EBWARD');
    S.powder--; S.toolFire = 0.5;
    S.fuses.push({ c:f.c, x:f.x, y:f.y, t:3.2, solid: f.t === T.SOLID });
    say('FIRE IN THE HOLE!'); Snd.play('fuse');
    return;
  }
  if(n === 5){
    if(f.t !== T.RUBBLE){ say('Nothing shot down to load.'); return; }
    if(S.car >= CAR_MAX){ say('Car\'s full. Dump it at the belt tail [E].'); return; }
    begin('load', f, 0.6); Snd.play('scoop'); return;
  }
}
function begin(kind, f, dur){ S.action = { kind, f, t:0, dur, a0:P.a, x0:P.x, y0:P.y }; }

function finishAction(){
  const a = S.action; S.action = null;
  const f = a.f;
  if(a.kind === 'dust'){
    const fx = P.x + Math.cos(P.a)*1.1, fy = P.y + Math.sin(P.a)*1.1;
    for(let y = Math.floor(fy - 2.5); y <= Math.floor(fy + 2.5); y++)
      for(let x = Math.floor(fx - 2.5); x <= Math.floor(fx + 2.5); x++)
        if(inMap(x, y) && Math.hypot(x + 0.5 - fx, y + 0.5 - fy) < 2.4) dust[idx(x, y)] = 1;
    S.dust = Math.max(0, S.dust - 34); S.bags--; S.minutes += 5;
    for(let i = 0; i < 14; i++) S.puffs.push({ x: 300 + Math.random()*80, y: 120 + Math.random()*80, r: 8 + Math.random()*22, t: 0 });
    fire({ on:'dust', x:fx, y:fy });
    return;
  }
  if(!f || map[f.c] !== f.t){ return; }
  if(a.kind === 'cut'){ map[f.c] = T.CUT; S.dust = Math.min(100, S.dust + 12); S.minutes += 20; fire({ on:'mine', step:'cut', x:f.x, y:f.y }); }
  else if(a.kind === 'drill'){ map[f.c] = T.DRILL; S.dust = Math.min(100, S.dust + 5); S.minutes += 10; fire({ on:'mine', step:'drill', x:f.x, y:f.y }); }
  else if(a.kind === 'drill_solid'){
    map[f.c] = T.SOLID; S.dust = Math.min(100, S.dust + 5); S.minutes += 10;
    say('You\'re fixin\' to shoot that off the solid. It\'ll make slack and throw dust.', 'EBWARD');
    fire({ on:'mine', step:'drill', x:f.x, y:f.y });
  }
  else if(a.kind === 'load'){
    scoops[f.c]--; S.car++; S.carTons += yieldT[f.c] || SCOOP_T; S.dust = Math.min(100, S.dust + 4); S.minutes += 5;
    if(scoops[f.c] <= 0){ map[f.c] = T.OPEN; }
    fire({ on:'mine', step:'load', x:f.x, y:f.y });
  }
}

function detonate(z){
  const c = z.c;
  if(map[c] !== T.DRILL && map[c] !== T.SOLID) return;
  const dustBefore = S.dust;
  map[c] = T.RUBBLE; scoops[c] = 3; yieldT[c] = z.solid ? SLACK_T : SCOOP_T;
  S.dust = Math.min(100, S.dust + (z.solid ? 40 : 20)); S.minutes += 5;
  S.shake = 0.7; S.flash = 0.5; S.flashCol = '#fff6d8';
  Snd.play('boom');
  const d = Math.hypot(z.x + 0.5 - P.x, z.y + 0.5 - P.y);
  const g = gasAt(c);
  if(g >= 1){
    if(dustBefore >= DUST_GAS) return die('gas');
    S.hp -= d < 4 ? 35 : 10; S.hurtT = 2;
    say('The shot lit the gas at the face. Blue fire rolls along the top and dies in the rock dust.');
    S.flashCol = '#8ab0ff'; S.flash = 1;
  } else if(z.solid && dustBefore >= DUST_SOLID) return die('dust');
  if(d < 2.2){ S.hp -= 45; S.hurtT = 2; say('Too close. Coal comes off the face like buckshot.'); }
  if(z.solid) say('Shot off the solid. It came down in slack.', 'EBWARD');
  if(S.hp <= 0) return die('hurt');
  fire({ on:'mine', step:'shot', x:z.x, y:z.y });
}

async function die(why){
  if(S.dead) return;
  S.dead = true;
  const lines = {
    gas:  ['IGNITION', '', 'The shot lit gas at the face, and the float dust', 'carried it down the entries.', '', 'Check your gas. Hang a curtain. Keep it white.'],
    dust: ['DUST EXPLOSION', '', 'You shot off the solid in a dusty place.', 'The flame got into the float dust.', '', 'Undercut before you shoot. Dust as you go.'],
    hurt: ['HURT TOO BAD TO WORK', '', 'They carry you out on a board.', '', 'Get back around the corner before the shot.']
  }[why];
  Snd.play('boom');
  await card(lines, [{ label:'Restart this shift', fn: restart }]);
}
function restart(){ setupLevel(LVJ); begin_level(); }

/* ── interact (E) ─────────────────────────────────────── */
function interact(){
  if(!S || S.cardOpen || S.ended || S.dead) return;
  const t = frontThing(1.6);
  if(t){
    const handled = fire({ on:'use', thing:t.id });
    const u = tdef(t).use;
    if(u === 'tail') useTail(t);
    else if(u === 'charger'){ S.battery = 100; say('Lamp\'s charged.'); Snd.play('blip'); }
    else if(u === 'supply'){
      const st = LV.start || {};
      S.powder = Math.max(S.powder, st.powder || 4); S.bags = Math.max(S.bags, st.bags || 8);
      say('Powder ' + S.powder + '. Dust bags ' + S.bags + '.'); Snd.play('blip');
    }
    else if(u === 'pickup'){
      if(t.say) say(t.say, t.who);
      if(t.counter) S.counters[t.counter] = (S.counters[t.counter] || 0) + 1;
      LV.things = LV.things.filter(o => o !== t); Snd.play('blip');
    }
    else if(u === 'build') build(t);
    else if(u === 'talk' && !handled && t.talk && t.talk.length){
      const i = (S.talkIdx[t.id] || 0) % t.talk.length; S.talkIdx[t.id] = i + 1;
      const line = t.talk[i];
      Array.isArray(line) ? say(line[1], line[0]) : say(line, t.type);
    }
    return;
  }
  const f = castFacing(1.7);
  if(!f) return;
  const handled = fire({ on:'usetile', x:f.x, y:f.y, tile:L.ID2CH[f.t] });
  if(handled) return;
  if((f.t === T.COAL || f.t === T.CUT || f.t === T.DRILL || f.t === T.SOLID || f.t === T.MARK) && cGas[f.c] >= 0.7 && !S.cleared[f.c]){
    if(S.brattice[f.c]){ say('The curtain\'s up. Give it time.'); return; }
    S.brattice[f.c] = S.t + 12;
    say('You hang a brattice curtain to sweep the face. Give it a few minutes.');
    Snd.play('scoop');
  }
}
function useTail(t){
  if(S.car > 0){
    S.counters.tons = (S.counters.tons || 0) + S.carTons;
    say('Dumped ' + S.carTons + ' ton on the belt.' + (S.beltOn ? '' : ' The belt isn\'t running.'));
    S.car = 0; S.carTons = 0; Snd.play('scoop');
    return;
  }
  const y = Math.floor(t.y); let x = Math.floor(t.x), moved = 0;
  while(moved < 4 && tileAt(x + 1, y) === T.OPEN){ x++; moved++; }
  if(moved > 0){ t.x = x + 0.5; S.minutes += 15; say('Belt extended ' + moved + ' tile' + (moved > 1 ? 's' : '') + '. Tail\'s at ' + x + '.'); Snd.play('block'); }
  else say('Nothing open ahead of the tail. Mine the entry first.');
}
function build(t){
  const b = t.build || { tile:'B', counter:'sealed', side:'west' };
  const cx = Math.floor(t.x), cy = Math.floor(t.y);
  if(b.side === 'west' && P.x >= cx){ say('Build it from the outby side. The portal side.'); return; }
  if(b.side === 'east' && P.x < cx + 1){ say('Build it from the east side.'); return; }
  if(Math.floor(P.x) === cx && Math.floor(P.y) === cy){ say('Step back off of it.'); return; }
  map[idx(cx, cy)] = L.CH2ID[b.tile || 'B'];
  LV.things = LV.things.filter(o => o !== t);
  if(b.counter) S.counters[b.counter] = (S.counters[b.counter] || 0) + 1;
  if(t.say) say(t.say, t.who);
  Snd.play('block'); S.shake = 0.15;
}

/* ── input ────────────────────────────────────────────── */
const keys = {};
let mapOpen = false;
addEventListener('keydown', e => {
  if(cardState){ if(e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape'){ cardAdvance(); e.preventDefault(); } return; }
  keys[e.code] = true;
  if(e.code === 'Tab' || e.code === 'KeyM'){ mapOpen = !mapOpen; e.preventDefault(); }
  if(e.code === 'KeyE' || e.code === 'KeyF'){ interact(); }
  if(e.code === 'Space' || e.code === 'ControlLeft'){ useTool(); e.preventDefault(); }
  if(/^Digit[1-6]$/.test(e.code)) pickTool(+e.code.slice(5));
  if(e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
cv.addEventListener('mousedown', e => {
  Snd.init();
  if(cardState) return;
  if(!document.pointerLockElement){ cv.requestPointerLock && cv.requestPointerLock(); return; }
  if(e.button === 0) useTool();
  if(e.button === 2) interact();
});
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => { if(document.pointerLockElement === cv && S && !S.cardOpen) P.a += e.movementX*0.0024; });
addEventListener('wheel', e => {
  if(!S || cardState) return;
  const list = S.tools; let i = list.indexOf(S.tool);
  i = (i + (e.deltaY > 0 ? 1 : -1) + list.length) % list.length; pickTool(list[i]);
});
function pickTool(n){ if(!S || S.action) return; if(S.tools.indexOf(n) < 0){ say((LV.start && LV.start.toolsOffSay) || 'Not today.'); return; } S.tool = n; Snd.play('blip'); }

/* touch */
(function(){
  const pad = document.getElementById('touch'); if(!pad) return;
  if(!('ontouchstart' in window)) return;
  pad.classList.add('on');
  pad.querySelectorAll('[data-k]').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); Snd.init(); if(k === 'USE') useTool(); else if(k === 'E') interact(); else if(k === 'MAP') mapOpen = !mapOpen;
      else if(k === 'TOOL'){ const l = S.tools; pickTool(l[(l.indexOf(S.tool) + 1) % l.length]); } else keys[k] = true; };
    const off = e => { e.preventDefault(); keys[k] = false; };
    b.addEventListener('touchstart', on); b.addEventListener('touchend', off);
  });
})();

/* ── update ───────────────────────────────────────────── */
function solidAt(x, y){
  if(tileAt(Math.floor(x), Math.floor(y)) !== T.OPEN) return true;
  for(const t of LV.things){ if(!t.hidden && isSolid(t) && Math.abs(t.x - x) < 0.36 && Math.abs(t.y - y) < 0.36) return true; }
  return false;
}
function tryMove(dx, dy){
  const r = 0.22;
  const nx = P.x + dx;
  if(!solidAt(nx + Math.sign(dx)*r, P.y - r*0.7) && !solidAt(nx + Math.sign(dx)*r, P.y + r*0.7)) P.x = nx;
  const ny = P.y + dy;
  if(!solidAt(P.x - r*0.7, ny + Math.sign(dy)*r) && !solidAt(P.x + r*0.7, ny + Math.sign(dy)*r)) P.y = ny;
}
function markSeen(){
  const px = Math.floor(P.x), py = Math.floor(P.y);
  for(let y = py - 3; y <= py + 3; y++) for(let x = px - 3; x <= px + 3; x++) if(inMap(x, y)) seen[idx(x, y)] = 1;
}

function update(dt){
  if(!S) return;
  if(S.cardOpen || S.dead) return;
  S.t += dt;
  const run = keys.ShiftLeft || keys.ShiftRight;
  const sp = (run ? 4.0 : 2.5)*dt, turn = 2.6*dt;
  if(keys.ArrowLeft || keys.KeyQ) P.a -= turn;
  if(keys.ArrowRight) P.a += turn;
  const fx = Math.cos(P.a), fy = Math.sin(P.a);
  let mx = 0, my = 0;
  if(keys.KeyW || keys.ArrowUp){ mx += fx; my += fy; }
  if(keys.KeyS || keys.ArrowDown){ mx -= fx; my -= fy; }
  if(keys.KeyA){ mx += fy; my -= fx; }
  if(keys.KeyD){ mx -= fy; my += fx; }
  const ml = Math.hypot(mx, my);
  if(ml > 0 && !S.action){
    tryMove(mx/ml*sp, my/ml*sp);
    S.walk += dt*(run ? 11 : 8);
    if(S.walk - S.stepT > Math.PI){ S.stepT = S.walk; Snd.play('step'); }
  }
  markSeen();
  const pc = idx(Math.floor(P.x), Math.floor(P.y));
  S.minutes += dt*0.5;
  S.battery = Math.max(0, S.battery - S.drain*cDrain[pc]*dt);
  for(const k in S.brattice) if(S.t >= S.brattice[k]){ S.cleared[k] = true; delete S.brattice[k]; say('The curtain\'s swept the face. Check it again.'); }
  if(S.action){
    const a = S.action; a.t += dt;
    if(a.f){ const f = castFacing(2); if(!f || f.c !== a.f.c){ S.action = null; say('You stepped off the face.'); } }
    if(S.action && a.t >= a.dur) finishAction();
  }
  for(let i = S.fuses.length - 1; i >= 0; i--){
    const z = S.fuses[i]; z.t -= dt;
    if(z.t <= 0){ S.fuses.splice(i, 1); detonate(z); if(S.dead) return; }
  }
  S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt*1.6);
  S.toolFire = Math.max(0, S.toolFire - dt); S.hurtT = Math.max(0, S.hurtT - dt); S.scareT = Math.max(0, S.scareT - dt);
  S.puffs.forEach(p => p.t += dt); S.puffs = S.puffs.filter(p => p.t < 1.2);
  S.faceT -= dt;
  if(S.faceT <= 0){ S.faceT = 1 + Math.random()*1.5; const r = Math.random(); S.faceLook = r < .2 ? 'look_left' : r < .4 ? 'look_right' : 'calm'; }
  fire(null);
  Snd.ambient();
}

/* ── render: world ────────────────────────────────────── */
let breath = 1;
function wallTex(t, c){
  const warm = cWarm[c], d = dust[c];
  switch(t){
    case T.COAL:   return warm ? (d ? TX.dust_glyph : TX.coal_warm) : (d ? TX.coal_dust : TX.coal);
    case T.CUT:    return warm ? TX.coal_warm_cut : TX.coal_cut;
    case T.DRILL:  return warm ? TX.coal_warm_drill : TX.coal_drill;
    case T.SOLID:  return warm ? TX.coal_warm_solid : TX.coal_solid;
    case T.MARK:   return d ? TX.mark_dust : TX.mark;
    case T.RUBBLE: return d ? TX.rubble_dust : TX.rubble;
    case T.ROCK:   return d ? TX.rock_dust : TX.rock;
    case T.STOP:   return TX.block;
    case T.PORTAL: return TX.portal;
    case T.ROOT:   return TX.roots;
    case T.CRACK:  return TX.crack;
  }
  return TX.rock;
}
let HZ = 0;
function px(o, t, i, Lm, g, d, hz, hl){
  let lr = Lm + g + d*0.9 + AMB, lg = Lm*0.93 + g*0.6 + d*0.95 + AMB, lb = Lm*0.8 + g*0.32 + d + AMB;
  if(t.E){ const e = t.E[i]; if(e > 0){ if(lr < e) lr = e; if(lg < e) lg = e*0.92; if(lb < e) lb = e*0.8; } }
  let r = t.R[i]*lr, gg = t.G[i]*lg, b = t.B[i]*lb;
  if(hz > 0){ const hc = 118*hl; r += (hc - r)*hz; gg += (hc*0.97 - gg)*hz; b += (hc*0.9 - b)*hz; }
  buf[o] = r; buf[o+1] = gg; buf[o+2] = b; buf[o+3] = 255;
}
function lampPower(){
  let p = S.battery > 0 ? 0.35 + 0.65*(S.battery/100) : 0.06;
  if(S.battery < 20 && S.battery > 0 && Math.random() < 0.06) p *= 0.4;
  return p;
}

function renderWorld(){
  buf.fill(0);
  const dirX = Math.cos(P.a), dirY = Math.sin(P.a), plX = -dirY*FOV, plY = dirX*FOV;
  const lp = lampPower();
  HZ = Math.min(0.75, S.dust/100*0.55);
  breath = 0.86 + 0.14*Math.sin(S.t*0.9);
  const FD = TX[FLATS[1]], FM = TX[FLATS[0]], CS = TX[FLATS[3]], CD = TX[FLATS[4]];

  /* floor + ceiling */
  const rdx0 = dirX - plX, rdy0 = dirY - plY, rdx1 = dirX + plX, rdy1 = dirY + plY;
  for(let y = HALF + 1; y < VH; y++){
    const rowDist = HALF/(y - HALF);
    const stx = rowDist*(rdx1 - rdx0)/VW, sty = rowDist*(rdy1 - rdy0)/VW;
    let fx = P.x + rowDist*rdx0, fy = P.y + rowDist*rdy0;
    const att = lp*2.3/(1 + 0.42*rowDist*rowDist);
    const hz = HZ*(1 - Math.exp(-rowDist*0.35));
    let o = y*VW*4, oc = (VH - 1 - y)*VW*4;
    for(let x = 0; x < VW; x++, o += 4, oc += 4){
      const cx = Math.floor(fx), cy = Math.floor(fy);
      let tf = FM, tc = CS, g = 0, d = 0;
      if(cx >= 0 && cy >= 0 && cx < W && cy < H){
        const c = cy*W + cx;
        g = glow[c]*breath; d = dayl[c];
        if(dust[c]){ tf = FD; tc = CD; }
        if(cFloor[c] >= 0) tf = TX[FLATS[cFloor[c]]];
        if(cCeil[c] >= 0) tc = TX[FLATS[cCeil[c]]];
      }
      const ti = (((fy - cy)*64) & 63)*64 + (((fx - cx)*64) & 63);
      const Lm = att*cone[x], hl = Math.min(1, Lm*0.9 + g + d);
      px(o, tf, ti, Lm, g, d, hz, hl);
      px(oc, tc, ti, Lm*0.8, g, d, hz, hl);
      fx += stx; fy += sty;
    }
  }

  /* walls */
  for(let x = 0; x < VW; x++){
    const camX = 2*x/VW - 1, rdx = dirX + plX*camX, rdy = dirY + plY*camX;
    let mx = Math.floor(P.x), my = Math.floor(P.y), prev = idx(mx, my);
    const ddx = Math.abs(1/rdx), ddy = Math.abs(1/rdy);
    let stx, sty, sdx, sdy, side = 0, hit = T.ROCK, hc = -1;
    if(rdx < 0){ stx = -1; sdx = (P.x - mx)*ddx; } else { stx = 1; sdx = (mx + 1 - P.x)*ddx; }
    if(rdy < 0){ sty = -1; sdy = (P.y - my)*ddy; } else { sty = 1; sdy = (my + 1 - P.y)*ddy; }
    for(let i = 0; i < 96; i++){
      if(sdx < sdy){ sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; }
      if(!inMap(mx, my)){ hit = T.ROCK; hc = prev; break; }
      const c = idx(mx, my), t = map[c];
      if(t !== T.OPEN){ hit = t; hc = c; break; }
      prev = c;
    }
    const perp = Math.max(0.0001, side === 0 ? sdx - ddx : sdy - ddy);
    zbuf[x] = perp;
    let wx = side === 0 ? P.y + perp*rdy : P.x + perp*rdx; wx -= Math.floor(wx);
    let tx = (wx*64) | 0; if(side === 0 && rdx > 0) tx = 63 - tx; if(side === 1 && rdy < 0) tx = 63 - tx;
    const lh = VH/perp, ys = Math.max(0, Math.floor(HALF - lh/2)), ye = Math.min(VH - 1, Math.floor(HALF + lh/2));
    const tex = wallTex(hit, hc >= 0 ? hc : prev);
    const Lm = lp*2.3/(1 + 0.42*perp*perp)*cone[x]*(side ? 0.8 : 1);
    const g = (prev >= 0 ? glow[prev] : 0)*breath, d = prev >= 0 ? dayl[prev] : 0;
    const hz = HZ*(1 - Math.exp(-perp*0.35)), hl = Math.min(1, Lm*0.9 + g + d);
    const step = 64/lh; let tp = (ys - HALF + lh/2)*step;
    for(let y = ys; y <= ye; y++, tp += step){
      px((y*VW + x)*4, tex, ((tp | 0) & 63)*64 + tx, Lm, g, d, hz, hl);
    }
  }

  /* sprites */
  const list = [];
  LV.things.forEach(t => { if(!t.hidden) list.push({ x:t.x, y:t.y, tex: TX[(L.THINGS[t.type] || {}).sprite || t.type] }); });
  const tail = LV.things.find(t => t.type === 'tail');
  const bt = LV.start && LV.start.belt;
  if(tail && bt){
    const frame = S.beltOn ? ((S.t*8) | 0) % 4 : 0, by = Math.floor(tail.y);
    for(let x = (bt.fromX || 1); x < Math.floor(tail.x); x++) list.push({ x:x + 0.5, y:by + 0.82, tex: TX['belt_' + frame] });
  }
  list.forEach(s => s.d = (s.x - P.x)*(s.x - P.x) + (s.y - P.y)*(s.y - P.y));
  list.sort((a, b) => b.d - a.d);
  const inv = 1/(plX*dirY - dirX*plY);
  for(const s of list){
    if(!s.tex) continue;
    const dx = s.x - P.x, dy = s.y - P.y;
    const tX = inv*(dirY*dx - dirX*dy), tY = inv*(-plY*dx + plX*dy);
    if(tY <= 0.15) continue;
    const ssx = (VW/2)*(1 + tX/tY), h = Math.abs(VH/tY);
    const ys = Math.floor(HALF - h/2), xs = Math.floor(ssx - h/2);
    const sc = Math.floor(s.y)*W + Math.floor(s.x);
    const g = (sc >= 0 && sc < W*H ? glow[sc] : 0)*breath, d = sc >= 0 && sc < W*H ? dayl[sc] : 0;
    const cx = Math.max(0, Math.min(VW - 1, ssx | 0));
    const Lm = lp*2.3/(1 + 0.42*tY*tY)*cone[cx];
    const hz = HZ*(1 - Math.exp(-tY*0.35)), hl = Math.min(1, Lm*0.9 + g + d);
    const x0 = Math.max(0, xs), x1 = Math.min(VW - 1, Math.floor(ssx + h/2));
    const y0 = Math.max(0, ys), y1 = Math.min(VH - 1, Math.floor(HALF + h/2));
    for(let x = x0; x <= x1; x++){
      if(tY >= zbuf[x]) continue;
      const tx = Math.min(63, ((x - xs)*64/h) | 0);
      for(let y = y0; y <= y1; y++){
        const ty = Math.min(63, ((y - ys)*64/h) | 0), i = ty*64 + tx;
        const al = s.tex.A[i]; if(al < 8) continue;
        const o = (y*VW + x)*4;
        if(al > 247){ px(o, s.tex, i, Lm, g, d, hz, hl); continue; }
        const r0 = buf[o], g0 = buf[o+1], b0 = buf[o+2], k = al/255;
        px(o, s.tex, i, Lm, g, d, hz, hl);
        buf[o] = r0 + (buf[o] - r0)*k; buf[o+1] = g0 + (buf[o+1] - g0)*k; buf[o+2] = b0 + (buf[o+2] - b0)*k;
      }
    }
  }
  vctx.putImageData(img, 0, 0);
}

/* ── render: overlay ──────────────────────────────────── */
function toolFrame(){
  const n = S.tool, a = S.action, anim = ((S.t*12) | 0) % 2;
  switch(n){
    case 1: return 'lamp';
    case 2: return a && a.kind === 'cut' ? 'cutter_' + anim : 'cutter_0';
    case 3: return a && (a.kind === 'drill' || a.kind === 'drill_solid') ? 'drill_' + anim : 'drill_0';
    case 4: return S.toolFire > 0 ? 'powder_1' : 'powder_0';
    case 5: return a && a.kind === 'load' ? 'shovel_1' : 'shovel_0';
    case 6: return a && a.kind === 'dust' ? 'duster_1' : 'duster_0';
  }
  return 'lamp';
}
function lampMode(){
  const f = castFacing(2.4);
  const c = f ? f.c : idx(Math.floor(P.x), Math.floor(P.y));
  const g = gasAt(c);
  if(g < 0) return ['tall', 0];
  if(g >= 1) return ['cap', g];
  return ['normal', g];
}
function drawTool(){
  const name = toolFrame(), c = ART.tools[name]; if(!c) return;
  const moving = keys.KeyW || keys.KeyS || keys.ArrowUp || keys.ArrowDown || keys.KeyA || keys.KeyD;
  const bx = moving ? Math.cos(S.walk*0.5)*10 : 0, by = moving ? Math.abs(Math.sin(S.walk*0.5))*8 : 0;
  const jx = S.action && S.action.kind !== 'dust' ? (Math.random() - 0.5)*3 : 0;
  const dx = SW_/2 - 128 + bx + jx, dy = VIEW_H - 192 + by + 6;
  ctx.drawImage(c, dx, dy, 256, 192);
  if(name === 'lamp'){ const m = lampMode(); MineArt.flame(ctx, dx + 128, dy + 136, 2, m[0], m[1], S.t); }
  if(S.action){
    const p = S.action.t/S.action.dur;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(SW_/2 - 60, VIEW_H - 18, 120, 8);
    ctx.fillStyle = '#e3a24a'; ctx.fillRect(SW_/2 - 59, VIEW_H - 17, 118*p, 6);
  }
}
function wrap(text, maxW){
  const words = text.split(' '), out = []; let line = '';
  words.forEach(w => { const t = line ? line + ' ' + w : w; if(ctx.measureText(t).width > maxW && line){ out.push(line); line = w; } else line = t; });
  if(line) out.push(line);
  return out;
}
function drawMessages(){
  ctx.font = '14px "Share Tech Mono", monospace'; ctx.textBaseline = 'top';
  let y = 8;
  S.msgs.filter(m => S.t - m.t < m.life).slice(-3).forEach(m => {
    const age = S.t - m.t, a = Math.min(1, (m.life - age)*1.5);
    const lines = wrap((m.who ? m.who + ': ' : '') + m.text, 470);
    ctx.globalAlpha = a*0.55; ctx.fillStyle = '#000';
    ctx.fillRect(4, y - 3, 486, lines.length*16 + 5);
    lines.forEach(ln => {
      ctx.globalAlpha = a;
      ctx.fillStyle = WHO_COL[m.who] || (m.who ? '#e0b0a0' : WHO_COL['']); ctx.fillText(ln, 10, y);
      y += 16;
    });
    y += 6;
  });
  ctx.globalAlpha = 1;
  if(S.obj){
    ctx.font = '13px "Share Tech Mono", monospace';
    const w = ctx.measureText(S.obj).width;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(4, VIEW_H - 22, w + 14, 18);
    ctx.fillStyle = '#9be59b'; ctx.fillText(S.obj, 11, VIEW_H - 19);
  }
  const h = hint();
  if(h){
    ctx.font = '14px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.55)'; const w = ctx.measureText(h).width + 16; ctx.fillRect(SW_/2 - w/2, VIEW_H - 46, w, 20);
    ctx.fillStyle = '#e3c27a'; ctx.fillText(h, SW_/2, VIEW_H - 43);
    ctx.textAlign = 'left';
  }
}
function hint(){
  if(S.action) return '';
  const t = frontThing(1.6);
  if(t){
    const u = tdef(t).use, lab = t.label || tdef(t).label;
    if(u === 'tail') return S.car > 0 ? '[E] DUMP CAR (' + S.carTons + ' T)' : '[E] EXTEND BELT';
    if(u === 'charger') return '[E] CHARGE LAMP';
    if(u === 'supply') return '[E] RESTOCK POWDER + DUST';
    if(u === 'pickup') return '[E] PICK UP ' + (lab || '').toUpperCase();
    if(u === 'build') return '[E] BUILD STOPPING';
    if(u === 'talk' || hasUseTrigger(t.id)) return '[E] ' + (lab || t.id).toUpperCase();
  }
  const f = castFacing(1.7); if(!f) return '';
  if(f.t === T.PORTAL) return '[E] DRIFT MOUTH';
  if(f.t === T.CRACK) return '[E] THE CRACK';
  const n = S.tool;
  if(n === 2 && f.t === T.COAL) return '[SPACE] UNDERCUT';
  if(n === 3 && (f.t === T.COAL || f.t === T.CUT)) return f.t === T.CUT ? '[SPACE] DRILL' : '[SPACE] DRILL (OFF THE SOLID)';
  if(n === 4 && (f.t === T.DRILL || f.t === T.SOLID)) return '[SPACE] SHOOT';
  if(n === 5 && f.t === T.RUBBLE) return '[SPACE] LOAD (' + scoops[f.c] + ' LEFT)';
  if(n === 1 && f.t !== T.OPEN) return '[SPACE] CHECK GAS';
  return '';
}

function panel(x, w, label, value, sub, col){
  ctx.fillStyle = '#100d0a'; ctx.fillRect(x + 2, VIEW_H + 4, w - 4, 72);
  ctx.strokeStyle = '#3a3026'; ctx.strokeRect(x + 2.5, VIEW_H + 4.5, w - 5, 71);
  ctx.font = '11px "Share Tech Mono", monospace'; ctx.fillStyle = '#7a6a50'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w/2, VIEW_H + 10);
  ctx.font = 'bold 24px "Share Tech Mono", monospace'; ctx.fillStyle = col || '#e3a24a';
  ctx.fillText(value, x + w/2, VIEW_H + 26);
  if(sub){ ctx.font = '11px "Share Tech Mono", monospace'; ctx.fillStyle = '#9a8a6a'; ctx.fillText(sub, x + w/2, VIEW_H + 56); }
  ctx.textAlign = 'left';
}
function clock(m){
  m = Math.floor(m) % 1440; let h = Math.floor(m/60), mm = m % 60;
  const ap = h >= 12 ? 'P' : 'A'; h = h % 12 || 12;
  return h + ':' + (mm < 10 ? '0' : '') + mm + ap;
}
function drawHUD(){
  ctx.fillStyle = '#1c1712'; ctx.fillRect(0, VIEW_H, SW_, SH_ - VIEW_H);
  ctx.fillStyle = '#2a221a'; ctx.fillRect(0, VIEW_H, SW_, 2);
  const hud = LV.hud || { label:'TONS', counter:'tons', of:0 };
  const v = S.counters[hud.counter] || 0;
  panel(0, 100, hud.label, hud.of ? v + '/' + hud.of : '' + v, hud.counter === 'tons' ? 'CAR ' + S.car + '/' + CAR_MAX : '');
  panel(100, 70, 'POWDER', '' + S.powder, 'BAGS ' + S.bags);
  const dc = S.dust >= DUST_SOLID ? '#ff5a4a' : S.dust >= DUST_GAS ? '#ffb040' : '#d8d4c8';
  panel(170, 90, 'FLOAT DUST', Math.round(S.dust) + '%', '', dc);
  ctx.fillStyle = '#2a221a'; ctx.fillRect(176, VIEW_H + 58, 78, 8);
  ctx.fillStyle = dc; ctx.fillRect(177, VIEW_H + 59, 76*S.dust/100, 6);
  /* face */
  ctx.fillStyle = '#100d0a'; ctx.fillRect(262, VIEW_H + 2, 76, 76);
  const pc = idx(Math.floor(P.x), Math.floor(P.y));
  let fm = S.faceLook;
  if(S.dust > 60) fm = 'grimy';
  if(cFloor[pc] === 2 || glow[pc] > 0.45) fm = 'root';
  if(S.scareT > 0 || S.fuses.length) fm = 'scared';
  if(S.hp < 40 || S.hurtT > 0) fm = 'hurt';
  const fc = ART.face[fm] || ART.face.calm;
  if(fc) ctx.drawImage(fc, 268, VIEW_H, 64, 80);
  const lm = S.tool === 1 || S.t - S.gasT < 6 ? (S.tool === 1 ? lampMode() : [S.gasRead < 0 ? 'tall' : '', S.gasRead]) : null;
  let gv = '--', gcol = '#7a6a50';
  if(lm){ if(lm[0] === 'tall'){ gv = '??'; gcol = '#ffe08a'; } else { gv = (lm[1] || 0).toFixed(1) + '%'; gcol = lm[1] >= 1 ? '#7aa0ff' : '#d8d4c8'; } }
  panel(340, 80, 'GAS', gv, S.tool === 1 ? 'LAMP UP' : 'HOLD LAMP [1]', gcol);
  panel(420, 80, 'CAP LAMP', Math.round(S.battery) + '%', 'HP ' + Math.max(0, Math.round(S.hp)), S.battery < 20 ? '#ff5a4a' : '#e3a24a');
  /* tools + clock */
  ctx.fillStyle = '#100d0a'; ctx.fillRect(502, VIEW_H + 4, 136, 72);
  ctx.strokeStyle = '#3a3026'; ctx.strokeRect(502.5, VIEW_H + 4.5, 135, 71);
  ctx.font = 'bold 20px "Share Tech Mono", monospace'; ctx.fillStyle = '#e3a24a'; ctx.textAlign = 'center';
  ctx.fillText(clock(S.minutes), 570, VIEW_H + 8);
  ctx.font = '12px "Share Tech Mono", monospace';
  for(let i = 1; i <= 6; i++){
    const on = S.tools.indexOf(i) >= 0, sel = S.tool === i;
    ctx.fillStyle = sel ? '#ffe08a' : on ? '#9a8a6a' : '#3a3026';
    ctx.fillText('' + i, 512 + (i - 1)*23, VIEW_H + 36);
  }
  ctx.fillStyle = '#e3c27a'; ctx.fillText(TOOL_NAMES[S.tool], 570, VIEW_H + 54);
  ctx.textAlign = 'left';
}

function drawMap(){
  const s = Math.min(Math.floor(600/W), Math.floor(280/H)), ox = Math.floor((SW_ - W*s)/2), oy = 28;
  ctx.fillStyle = 'rgba(14,24,42,.94)'; ctx.fillRect(0, 0, SW_, VIEW_H);
  ctx.strokeStyle = 'rgba(120,150,200,.12)';
  for(let x = 0; x <= W; x++){ ctx.beginPath(); ctx.moveTo(ox + x*s + 0.5, oy); ctx.lineTo(ox + x*s + 0.5, oy + H*s); ctx.stroke(); }
  for(let y = 0; y <= H; y++){ ctx.beginPath(); ctx.moveTo(ox, oy + y*s + 0.5); ctx.lineTo(ox + W*s, oy + y*s + 0.5); ctx.stroke(); }
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const c = idx(x, y); if(!seen[c]) continue;
    const t = map[c]; let col = null;
    if(t === T.OPEN) col = dust[c] ? '#e8eef8' : '#9fb4d0';
    else if(t === T.MARK) col = '#e0782a';
    else if(t === T.STOP) col = '#ff5050';
    else if(t === T.PORTAL) col = '#ffffff';
    else if(t === T.ROOT) col = '#b8743a';
    else if(t === T.CRACK) col = '#ffc070';
    else if(t === T.RUBBLE) col = '#5a6a80';
    else if(t === T.CUT || t === T.DRILL || t === T.SOLID) col = '#38506e';
    if(col){ ctx.fillStyle = col; ctx.fillRect(ox + x*s, oy + y*s, s, s); }
  }
  const tail = LV.things.find(t => t.type === 'tail'), bt = LV.start && LV.start.belt;
  if(tail && bt){ ctx.fillStyle = '#e0c040'; ctx.fillRect(ox + (bt.fromX || 1)*s, oy + (Math.floor(tail.y) + 0.75)*s, (Math.floor(tail.x) - (bt.fromX || 1) + 1)*s, 2); }
  LV.things.forEach(t => {
    if(t.hidden || !seen[idx(Math.floor(t.x), Math.floor(t.y))] || t.type === 'roots_hang') return;
    ctx.fillStyle = /^(cecil|doyle|bobby|junior)$/.test(t.type) ? '#ff9040' : t.type === 'light' ? '#fff0b0' : '#e0d070';
    ctx.fillRect(ox + t.x*s - 2, oy + t.y*s - 2, 4, 4);
  });
  const px0 = ox + P.x*s, py0 = oy + P.y*s;
  ctx.fillStyle = '#ff3a3a'; ctx.beginPath();
  ctx.moveTo(px0 + Math.cos(P.a)*7, py0 + Math.sin(P.a)*7);
  ctx.lineTo(px0 + Math.cos(P.a + 2.5)*5, py0 + Math.sin(P.a + 2.5)*5);
  ctx.lineTo(px0 + Math.cos(P.a - 2.5)*5, py0 + Math.sin(P.a - 2.5)*5); ctx.fill();
  ctx.font = '13px "Share Tech Mono", monospace'; ctx.fillStyle = '#cfe0ff';
  ctx.fillText((LV.title || '') + '  /  MINE MAP  /  TAB TO CLOSE', ox, 8);
}

function render(){
  if(!S || !ART) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW_, SH_);
  renderWorld();
  const sx = S.shake > 0 ? (Math.random() - 0.5)*12*S.shake : 0, sy = S.shake > 0 ? (Math.random() - 0.5)*12*S.shake : 0;
  ctx.drawImage(view, sx, sy, SW_, VIEW_H);
  S.puffs.forEach(p => { ctx.fillStyle = 'rgba(225,225,218,' + (0.5*(1 - p.t/1.2)) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y - p.t*30, p.r*(1 + p.t), 0, 6.28); ctx.fill(); });
  drawTool();
  if(S.flash > 0){ ctx.globalAlpha = Math.min(1, S.flash); ctx.fillStyle = S.flashCol; ctx.fillRect(0, 0, SW_, VIEW_H); ctx.globalAlpha = 1; }
  if(mapOpen) drawMap();
  drawMessages();
  drawHUD();
  if(!document.pointerLockElement && !cardState && S.t < 10 && !('ontouchstart' in window)){
    ctx.font = '13px "Share Tech Mono", monospace'; ctx.fillStyle = 'rgba(227,162,74,.8)'; ctx.textAlign = 'center';
    ctx.fillText('CLICK TO TAKE THE MOUSE  ·  ARROWS/WASD WORK TOO', SW_/2, VIEW_H - 72); ctx.textAlign = 'left';
  }
}

/* ── audio ────────────────────────────────────────────── */
const Snd = {
  ac: null,
  init(){
    if(this.ac) return;
    try{ this.ac = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
    const ac = this.ac, len = ac.sampleRate*2;
    this.master = ac.createGain(); this.master.gain.value = 0.7; this.master.connect(ac.destination);
    const nb = ac.createBuffer(1, len, ac.sampleRate), nd = nb.getChannelData(0);
    for(let i = 0; i < len; i++) nd[i] = Math.random()*2 - 1;
    const bb = ac.createBuffer(1, len, ac.sampleRate), bd = bb.getChannelData(0); let l = 0;
    for(let i = 0; i < len; i++){ l = (l + 0.02*(Math.random()*2 - 1))/1.02; bd[i] = l*3.5; }
    this.noise = nb; this.brown = bb;
    this.belt = this.loop(bb, 'lowpass', 160);
    this.breath = this.loop(nb, 'bandpass', 260);
    this.drone = ac.createGain(); this.drone.gain.value = 0; this.drone.connect(this.master);
    [55, 55.7, 82.4].forEach(f => { const o = ac.createOscillator(); o.frequency.value = f; o.connect(this.drone); o.start(); });
  },
  loop(b, type, freq){
    const ac = this.ac, s = ac.createBufferSource(); s.buffer = b; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.master); s.start(); return g;
  },
  burst(dur, type, freq, gain){
    const ac = this.ac, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  tone(type, f0, f1, dur, gain){
    const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  play(n){
    if(!this.ac) return;
    switch(n){
      case 'cut':   this.burst(1.8, 'bandpass', 900, 0.35); this.tone('sawtooth', 70, 62, 1.8, 0.12); break;
      case 'drill': this.tone('square', 210, 240, 1.4, 0.06); this.burst(1.4, 'highpass', 2500, 0.15); break;
      case 'boom':  this.burst(2.4, 'lowpass', 380, 1.0); this.tone('sine', 60, 28, 1.3, 0.7); break;
      case 'scoop': this.burst(0.35, 'bandpass', 1800, 0.4); break;
      case 'spray': this.burst(0.8, 'highpass', 3200, 0.3); break;
      case 'step':  this.burst(0.07, 'lowpass', 500, 0.12); break;
      case 'blip':  this.tone('square', 660, 660, 0.06, 0.05); break;
      case 'fuse':  this.burst(3.2, 'highpass', 5000, 0.08); break;
      case 'block': this.burst(0.18, 'lowpass', 900, 0.5); this.tone('sine', 140, 90, 0.15, 0.2); break;
      case 'breath':this.burst(2.5, 'bandpass', 240, 0.4); break;
    }
  },
  ambient(){
    if(!this.ac || !S) return;
    const t = this.ac.currentTime;
    let bg = 0;
    const tail = LV.things.find(o => o.type === 'tail');
    if(S.beltOn && tail){ const d = Math.abs(P.y - tail.y) + Math.max(0, P.x - tail.x); bg = 0.35/(1 + d*0.35); }
    this.belt.gain.setTargetAtTime(bg, t, 0.2);
    const pc = idx(Math.floor(P.x), Math.floor(P.y));
    this.drone.gain.setTargetAtTime(cDrone[pc]*0.12, t, 0.5);
    this.breath.gain.setTargetAtTime(cDrone[pc]*(0.12 + 0.12*Math.sin(S.t*0.9)), t, 0.2);
  }
};

/* ── boot ─────────────────────────────────────────────── */
const qs = new URLSearchParams(location.search);
const FIRST = 'levels/e1m1.json';

async function startLevel(url){
  let j;
  try{ j = await fetchLevel(url); }
  catch(e){
    await card(['COULD NOT LOAD THE LEVEL', '', url, '', 'Levels load over http. Run the folder with a local', 'server (SECWATCH_CONTROL.bat, or python3 -m http.server)', 'and open http://localhost:8000/mine.html']);
    return;
  }
  setupLevel(j); begin_level();
}
async function begin_level(){
  if(LV.intro && LV.intro.length) await card(LV.intro);
  fire({ on:'start' });
}

let last = performance.now();
function frame(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now;
  cardTick(dt); update(dt); render();
  requestAnimationFrame(frame);
}

(async function boot(){
  let sources = null;
  if(qs.get('sheets') === 'preview'){ try{ sources = JSON.parse(localStorage.getItem('mine_sheet_preview')); }catch(e){} }
  const loaded = await MineSheets.load('img/mine/', sources);
  ART = MineArt.build(loaded.cells); TX = ART.tex;
  if(loaded.report.length) console.log('[mine] sheets:', loaded.report.join(' | '));
  window.MINE = { ART, report: loaded.report, get S(){ return S; }, get LV(){ return LV; }, P, startLevel, fire };
  requestAnimationFrame(frame);
  const title = ['JOSEPH No. 1', '', 'LKCO-04  /  FIRE CLAY SEAM  /  LETCHER COUNTY, KENTUCKY', '',
    'For Luther and Ebward Joseph.', '',
    'MOVE      W A S D  /  arrows       TURN   mouse  /  arrows',
    'TOOLS     1 lamp  2 cutter  3 drill  4 powder  5 shovel  6 duster',
    'USE TOOL  SPACE / left click       USE    E / right click',
    'MAP       TAB                      RUN    SHIFT', '',
    'Cut it, drill it, check your gas, shoot it, load it, dust it.', '',
    'click to begin'];
  if(qs.get('playtest')){
    let j = null;
    try{ j = JSON.parse(localStorage.getItem('mine_playtest')); }catch(e){}
    if(j){ setupLevel(j); await card(['PLAYTEST', '', j.title || j.id, '', 'click to begin']); Snd.init(); begin_level(); return; }
  }
  const lv = qs.get('level') || FIRST;
  S = null;
  await card(title);
  Snd.init();
  await startLevel(lv);
})();

})();
