/* ════════════════════════════════════════════════════════
   SECWATCH CONTROL  --  level + story editor  (js/control.js)

   Edits the level "WADs" in levels/*.json that mine.html plays.
   Format: js/mineLevel.js  ·  How-to: docs/EDITOR.md

   Modes (left column)
     TILES     paint the map, rock dust layer
     THINGS    place people, machines, buckets, the light...
     ZONES     rectangles with rules (gas, warm, no-mining, roots)
     STORY     triggers: WHEN this happens, IF this holds, DO that
     SCRIPT    the whole level's story, read top to bottom
     LEVEL     title, intro card, start supplies, HUD, next level
     JSON      the raw file

   Saving: "Project folder…" (Chrome/Edge) lets Save write straight
   into levels/ and keeps levels/index.json up to date. Without it,
   Save uses a file picker or downloads the file.
════════════════════════════════════════════════════════ */
(function(){
'use strict';
const L = MineLevel, T = L.T;
const $ = s => document.querySelector(s);
const side = $('#side'), cv = $('#map'), g = cv.getContext('2d');

let LVL = null, grid = null, dustG = null;
let fileHandle = null, dirHandle = null, fileName = '';
let dirty = false;
const undoS = [], redoS = [];
let mode = 'tiles';
let brush = '.', brush2 = 'c', tool = 'pencil', dustMode = false;
let thingBrush = 'luther';
let sel = null;                 // { k:'thing'|'zone'|'trigger'|'player', i }
let zoom = 14, panX = 20, panY = 20, viewTex = false, showGrid = true;
let hover = null, drag = null, pickRect = null, playHere = false, spaceDown = false;
let LEVELS = [];
let ART = null; const TEXC = {};
const dpr = Math.max(1, window.devicePixelRatio || 1);

/* ── small DOM helpers ───────────────────────────────── */
function h(tag, props, ...kids){
  const e = document.createElement(tag);
  if(props) for(const k in props){
    const v = props[k];
    if(k === 'style') e.style.cssText = v;
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if(k === 'html') e.innerHTML = v;
    else if(k in e && k !== 'list') e[k] = v;
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => { if(c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}
const row = (label, ...kids) => h('div', { className:'row' }, h('label', null, label), ...kids);
function edit(fn, full){ before(); fn(); after(full !== false); }
function txt(v, set, ph){ return h('input', { type:'text', value: v == null ? '' : v, placeholder: ph || '', onchange: e => edit(() => set(e.target.value)) }); }
function num(v, set, step){ return h('input', { type:'number', step: step || 'any', value: v == null ? '' : v, onchange: e => edit(() => set(e.target.value === '' ? undefined : +e.target.value)) }); }
function chk(v, set){ return h('input', { type:'checkbox', checked: !!v, onchange: e => edit(() => set(e.target.checked)) }); }
function pick(opts, v, set){
  const s = h('select', { onchange: e => edit(() => set(e.target.value)) });
  opts.forEach(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; s.append(h('option', { value: val, selected: String(val) === String(v == null ? '' : v) }, lab)); });
  return s;
}
function area(v, set, rows){ return h('textarea', { rows: rows || 4, value: v || '', onchange: e => edit(() => set(e.target.value)) }); }
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = 'none', 2600); }
function esc(s){ return String(s).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[c]); }

/* ── level state ─────────────────────────────────────── */
function normalize(j){
  const b = L.blank(j.w || 64, j.h || 25);
  for(const k in b) if(j[k] == null) j[k] = b[k];
  j.start = Object.assign({}, b.start, j.start);
  j.hud = Object.assign({}, b.hud, j.hud);
  j.rules = Object.assign({}, b.rules, j.rules);
  if(!j.dust || j.dust.length !== j.h) j.dust = b.dust;
  return j;
}
function load(j, name, handle){
  LVL = normalize(j); fileName = name || ''; fileHandle = handle || null;
  undoS.length = 0; redoS.length = 0; dirty = false; sel = null;
  syncFrom(); fit(); refresh();
}
function syncFrom(){ grid = L.gridFrom(LVL); dustG = L.dustFrom(LVL); }
function syncTo(){ LVL.tiles = L.rowsFrom(grid, LVL.w, LVL.h); LVL.dust = L.dustRows(dustG, LVL.w, LVL.h); }
function before(){ syncTo(); undoS.push(JSON.stringify(LVL)); if(undoS.length > 300) undoS.shift(); redoS.length = 0; }
function after(full){ syncTo(); dirty = true; draft(); if(full) renderSide(); draw(); updateTop(); }
function undo(){ if(!undoS.length) return; syncTo(); redoS.push(JSON.stringify(LVL)); LVL = JSON.parse(undoS.pop()); syncFrom(); dirty = true; fixSel(); refresh(); }
function redo(){ if(!redoS.length) return; syncTo(); undoS.push(JSON.stringify(LVL)); LVL = JSON.parse(redoS.pop()); syncFrom(); dirty = true; fixSel(); refresh(); }
function fixSel(){
  if(!sel) return;
  const arr = sel.k === 'thing' ? LVL.things : sel.k === 'zone' ? LVL.zones : sel.k === 'trigger' ? LVL.triggers : null;
  if(arr && !arr[sel.i]) sel = null;
}
function draft(){ try{ localStorage.setItem('control_draft', JSON.stringify({ name:fileName, lvl:LVL, t:Date.now() })); }catch(e){} }
function refresh(){ renderSide(); draw(); updateTop(); }
function updateTop(){
  $('#fileLbl').innerHTML = esc((LVL.id || '') + ' · ' + (LVL.title || '')) + ' · <span class="muted">' + esc(fileName || 'unsaved') + '</span>' + (dirty ? ' <span class="dirty">●</span>' : '');
  syncTo();
  const p = L.validate(LVL);
  const v = $('#valid');
  v.innerHTML = p.length ? '<span class="bad" style="cursor:pointer">⚠ ' + p.length + ' problem' + (p.length > 1 ? 's' : '') + '</span>' : '<span class="ok">✓ valid</span>';
  v.onclick = () => p.length && alert(p.join('\n'));
  document.title = (dirty ? '● ' : '') + 'SECWATCH Control · ' + (LVL.id || '');
  $('#bUndo').disabled = !undoS.length; $('#bRedo').disabled = !redoS.length;
}

/* ── art (uses your sheets in img/mine/ when served over http) ── */
async function loadArt(){
  try{
    const loaded = await MineSheets.load('img/mine/');
    ART = MineArt.build(loaded.cells);
  }catch(e){ ART = MineArt.build({}); }
  renderSide(); draw();
}
function texCanvas(name){
  if(TEXC[name]) return TEXC[name];
  const t = ART && ART.tex[name]; if(!t) return null;
  const c = document.createElement('canvas'); c.width = t.w; c.height = t.h;
  const d = c.getContext('2d').createImageData(t.w, t.h);
  for(let i = 0; i < t.w*t.h; i++){ d.data[i*4] = t.R[i]; d.data[i*4+1] = t.G[i]; d.data[i*4+2] = t.B[i]; d.data[i*4+3] = t.A[i]; }
  c.getContext('2d').putImageData(d, 0, 0);
  return TEXC[name] = c;
}
function zoneMap(){
  const n = LVL.w*LVL.h, warm = new Uint8Array(n), floor = new Array(n);
  (LVL.zones || []).forEach(z => {
    for(let y = Math.max(0, z.y0); y <= Math.min(LVL.h - 1, z.y1); y++)
      for(let x = Math.max(0, z.x0); x <= Math.min(LVL.w - 1, z.x1); x++){
        const c = y*LVL.w + x; if(z.warm) warm[c] = 1; if(z.floor) floor[c] = z.floor;
      }
  });
  return { warm, floor };
}
function tileTex(id, c, zm){
  const w = zm.warm[c], d = dustG[c];
  switch(id){
    case T.OPEN:   return zm.floor[c] || (d ? 'floor_dust' : 'mud');
    case T.COAL:   return w ? (d ? 'dust_glyph' : 'coal_warm') : (d ? 'coal_dust' : 'coal');
    case T.CUT:    return w ? 'coal_warm_cut' : 'coal_cut';
    case T.DRILL:  return w ? 'coal_warm_drill' : 'coal_drill';
    case T.SOLID:  return w ? 'coal_warm_solid' : 'coal_solid';
    case T.MARK:   return d ? 'mark_dust' : 'mark';
    case T.RUBBLE: return d ? 'rubble_dust' : 'rubble';
    case T.ROCK:   return d ? 'rock_dust' : 'rock';
    case T.STOP:   return 'block';
    case T.PORTAL: return 'portal';
    case T.ROOT:   return 'roots';
    case T.CRACK:  return 'crack';
  }
  return 'rock';
}

/* ── map view ────────────────────────────────────────── */
function size(){ const r = cv.getBoundingClientRect(); return { w:r.width, h:r.height }; }
function resize(){ const s = size(); cv.width = s.w*dpr; cv.height = s.h*dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); if(!resize.done && s.w){ resize.done = true; fit(); } draw(); }
function fit(){
  const s = size(); if(!LVL || !s.w) return;
  zoom = Math.max(3, Math.floor(Math.min((s.w - 30)/LVL.w, (s.h - 30)/LVL.h)));
  panX = Math.round((s.w - LVL.w*zoom)/2); panY = Math.round((s.h - LVL.h*zoom)/2);
}
const ZC = { gas:'#5a8aff', warm:'#ff9a40', anomaly:'#ffe070', nomine:'#ff5050', floor:'#c07030' };
function zoneColor(z){ return z.nomine ? ZC.nomine : z.floor ? ZC.floor : z.gas ? ZC.gas : z.anomaly ? ZC.anomaly : z.warm ? ZC.warm : '#aaaaaa'; }
function thingColor(t){
  return t.type === 'light' ? '#fff0b0' : /^(cecil|doyle|bobby|junior)$/.test(t.type) ? '#ff9040' :
         /^(luther|ebward|harold)$/.test(t.type) ? '#90d0ff' : t.type === 'roots_hang' ? '#7a4a20' : '#e0d070';
}
function triggerRect(tr){
  const w = tr && tr.when; if(!w) return null;
  if(['enter','mine','dust','lamp'].includes(w.on) && w.x0 != null) return [+w.x0, +w.y0, +w.x1, +w.y1];
  if(w.on === 'usetile' && w.x != null) return [+w.x, +w.y, +w.x, +w.y];
  return null;
}
function draw(){
  if(!LVL) return;
  const s = size(), z = zoom;
  g.fillStyle = '#0c0c0c'; g.fillRect(0, 0, s.w, s.h);
  g.imageSmoothingEnabled = false;
  const zm = viewTex ? zoneMap() : null;
  for(let y = 0; y < LVL.h; y++) for(let x = 0; x < LVL.w; x++){
    const px = panX + x*z, py = panY + y*z;
    if(px > s.w || py > s.h || px + z < 0 || py + z < 0) continue;
    const c = y*LVL.w + x, id = grid[c];
    let drawn = false;
    if(viewTex && ART){ const tc = texCanvas(tileTex(id, c, zm)); if(tc){ g.drawImage(tc, px, py, z, z); drawn = true; if(id === T.OPEN){ g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, py, z, z); } } }
    if(!drawn){ g.fillStyle = L.COLOR[id]; g.fillRect(px, py, z, z); }
    if(dustG[c] && !viewTex){ g.fillStyle = 'rgba(255,255,255,.17)'; g.fillRect(px, py, z, z); if(z >= 8){ g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(px + z*0.25, py + z*0.25, 1, 1); g.fillRect(px + z*0.7, py + z*0.65, 1, 1); } }
  }
  if(showGrid && z >= 7){
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.beginPath();
    for(let x = 0; x <= LVL.w; x++){ g.moveTo(panX + x*z + 0.5, panY); g.lineTo(panX + x*z + 0.5, panY + LVL.h*z); }
    for(let y = 0; y <= LVL.h; y++){ g.moveTo(panX, panY + y*z + 0.5); g.lineTo(panX + LVL.w*z, panY + y*z + 0.5); }
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.font = '10px monospace';
    if(z >= 12) for(let x = 0; x < LVL.w; x += 5) g.fillText(x, panX + x*z + 2, panY - 3);
    if(z >= 12) for(let y = 0; y < LVL.h; y += 5) g.fillText(y, panX - 16, panY + y*z + 10);
  }
  /* zones */
  (LVL.zones || []).forEach((zn, i) => {
    const on = sel && sel.k === 'zone' && sel.i === i;
    if(mode !== 'zones' && !on) return;
    const col = zoneColor(zn);
    g.fillStyle = col + (on ? '30' : '14'); g.fillRect(panX + zn.x0*z, panY + zn.y0*z, (zn.x1 - zn.x0 + 1)*z, (zn.y1 - zn.y0 + 1)*z);
    g.strokeStyle = on ? '#ffcf80' : col; g.lineWidth = on ? 2 : 1; g.setLineDash([5, 3]);
    g.strokeRect(panX + zn.x0*z + 0.5, panY + zn.y0*z + 0.5, (zn.x1 - zn.x0 + 1)*z - 1, (zn.y1 - zn.y0 + 1)*z - 1); g.setLineDash([]);
    g.fillStyle = on ? '#ffcf80' : col; g.font = '11px monospace'; g.fillText(zn.name || 'zone ' + i, panX + zn.x0*z + 3, panY + zn.y0*z + 12);
  });
  /* belt */
  const tail = (LVL.things || []).find(t => t.type === 'tail'), bt = LVL.start && LVL.start.belt;
  if(tail && bt){ g.fillStyle = bt.on ? '#e0c040' : '#806a20'; g.fillRect(panX + (bt.fromX || 1)*z, panY + (Math.floor(tail.y) + 0.8)*z, (Math.floor(tail.x) - (bt.fromX || 1) + 0.5)*z, Math.max(2, z*0.12)); }
  /* trigger areas */
  if(mode === 'triggers' || mode === 'script'){
    (LVL.triggers || []).forEach((tr, i) => {
      const r = triggerRect(tr); if(!r) return;
      const on = sel && sel.k === 'trigger' && sel.i === i;
      g.strokeStyle = on ? '#9be59b' : 'rgba(155,229,155,.35)'; g.lineWidth = on ? 2 : 1; g.setLineDash(on ? [] : [3, 3]);
      g.strokeRect(panX + r[0]*z + 0.5, panY + r[1]*z + 0.5, (r[2] - r[0] + 1)*z - 1, (r[3] - r[1] + 1)*z - 1); g.setLineDash([]);
      if(on){ g.fillStyle = 'rgba(155,229,155,.12)'; g.fillRect(panX + r[0]*z, panY + r[1]*z, (r[2] - r[0] + 1)*z, (r[3] - r[1] + 1)*z); }
    });
    const tr = sel && sel.k === 'trigger' && LVL.triggers[sel.i];
    if(tr && tr.when && tr.when.thing){ const t = LVL.things.find(o => o.id === tr.when.thing); if(t){ g.strokeStyle = '#9be59b'; g.lineWidth = 2; g.beginPath(); g.arc(panX + t.x*z, panY + t.y*z, (tr.when.r || 1.4)*z, 0, 6.28); g.stroke(); } }
  }
  /* things */
  (LVL.things || []).forEach((t, i) => {
    const cx = panX + t.x*z, cy = panY + t.y*z, on = sel && sel.k === 'thing' && sel.i === i;
    const def = L.THINGS[t.type] || {};
    const sp = viewTex && ART ? texCanvas(def.sprite || t.type) : null;
    if(sp && z >= 8){ g.drawImage(sp, cx - z*0.6, cy - z*0.75, z*1.2, z*1.2); }
    else if(t.type !== 'roots_hang' || mode === 'things'){
      g.fillStyle = thingColor(t); g.beginPath(); g.arc(cx, cy, Math.max(2.5, z*0.32), 0, 6.28); g.fill();
      if(z >= 12){ g.fillStyle = '#111'; g.font = 'bold ' + Math.floor(z*0.45) + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.type[0].toUpperCase(), cx, cy + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
    }
    if(on){ g.strokeStyle = '#ffcf80'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, Math.max(5, z*0.5), 0, 6.28); g.stroke(); }
    if(z >= 16 && t.type !== 'roots_hang' && (mode === 'things' || on)){ g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '10px monospace'; g.fillText(t.id, cx + z*0.4, cy - z*0.35); }
  });
  /* player */
  const p = LVL.player, px = panX + p.x*z, py = panY + p.y*z, a = p.a || 0, r = Math.max(6, z*0.55);
  g.fillStyle = sel && sel.k === 'player' ? '#ffcf80' : '#ff3a3a'; g.beginPath();
  g.moveTo(px + Math.cos(a)*r, py + Math.sin(a)*r); g.lineTo(px + Math.cos(a + 2.5)*r*0.7, py + Math.sin(a + 2.5)*r*0.7); g.lineTo(px + Math.cos(a - 2.5)*r*0.7, py + Math.sin(a - 2.5)*r*0.7); g.fill();
  /* hover + drag previews */
  if(hover && hover.x >= 0 && hover.y >= 0 && hover.x < LVL.w && hover.y < LVL.h){
    g.strokeStyle = playHere ? '#9be59b' : 'rgba(255,207,128,.8)'; g.lineWidth = 1;
    g.strokeRect(panX + hover.x*z + 0.5, panY + hover.y*z + 0.5, z - 1, z - 1);
  }
  if(drag && (drag.k === 'rect' || drag.k === 'zone' || drag.k === 'pick')){
    const x0 = Math.min(drag.x0, drag.x1), y0 = Math.min(drag.y0, drag.y1), x1 = Math.max(drag.x0, drag.x1), y1 = Math.max(drag.y0, drag.y1);
    g.strokeStyle = drag.k === 'pick' ? '#9be59b' : '#ffcf80'; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.strokeRect(panX + x0*z, panY + y0*z, (x1 - x0 + 1)*z, (y1 - y0 + 1)*z); g.setLineDash([]);
  }
  if(pickRect || playHere){
    g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(8, 8, 420, 22); g.fillStyle = '#9be59b'; g.font = '13px monospace';
    g.fillText(playHere ? 'Click where the player should start the playtest (Esc cancels)' : 'Drag a rectangle on the map for this trigger (Esc cancels)', 14, 23);
  }
}

/* ── map input ───────────────────────────────────────── */
function cellAt(e){
  const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const fx = (mx - panX)/zoom, fy = (my - panY)/zoom;
  return { fx, fy, x: Math.floor(fx), y: Math.floor(fy), mx, my };
}
const inside = (x, y) => x >= 0 && y >= 0 && x < LVL.w && y < LVL.h;
function thingAt(fx, fy){
  let best = -1, bd = 0.5;
  LVL.things.forEach((t, i) => { const d = Math.hypot(t.x - fx, t.y - fy); if(d < bd){ bd = d; best = i; } });
  return best;
}
function paint(x, y, alt){
  if(!inside(x, y)) return;
  const c = y*LVL.w + x;
  if(dustMode) dustG[c] = alt ? 0 : 1;
  else grid[c] = L.CH2ID[alt ? brush2 : brush];
}
function flood(x, y, alt){
  if(!inside(x, y)) return;
  const arr = dustMode ? dustG : grid, from = arr[y*LVL.w + x];
  const to = dustMode ? (alt ? 0 : 1) : L.CH2ID[alt ? brush2 : brush];
  if(from === to) return;
  const st = [[x, y]];
  while(st.length){
    const [cx, cy] = st.pop(); if(!inside(cx, cy)) continue;
    const c = cy*LVL.w + cx; if(arr[c] !== from) continue;
    arr[c] = to; st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}
function snap(v, free){ return free ? Math.round(v*10)/10 : Math.floor(v) + 0.5; }

cv.addEventListener('mousedown', e => {
  e.preventDefault();
  const c = cellAt(e), alt = e.button === 2;
  if(e.button === 1 || spaceDown){ drag = { k:'pan', sx:e.clientX, sy:e.clientY, px:panX, py:panY }; return; }
  if(playHere){ if(inside(c.x, c.y)) playtest({ x:c.x + 0.5, y:c.y + 0.5 }); playHere = false; draw(); return; }
  if(pickRect){ drag = { k:'pick', x0:c.x, y0:c.y, x1:c.x, y1:c.y }; return; }
  if(mode === 'tiles'){
    if(tool === 'pick'){ if(inside(c.x, c.y)){ const ch = L.ID2CH[grid[c.y*LVL.w + c.x]]; if(alt) brush2 = ch; else brush = ch; tool = 'pencil'; renderSide(); } return; }
    before();
    if(tool === 'fill'){ flood(c.x, c.y, alt); after(false); return; }
    if(tool === 'rect'){ drag = { k:'rect', x0:c.x, y0:c.y, x1:c.x, y1:c.y, alt }; return; }
    paint(c.x, c.y, alt); drag = { k:'paint', alt }; draw(); return;
  }
  if(mode === 'things' || mode === 'level'){
    const pd = Math.hypot(LVL.player.x - c.fx, LVL.player.y - c.fy);
    if(pd < 0.55){ sel = { k:'player' }; before(); drag = { k:'player' }; renderSide(); draw(); return; }
    const i = thingAt(c.fx, c.fy);
    if(i >= 0){
      sel = { k:'thing', i }; if(alt){ renderSide(); draw(); return; }
      before(); drag = { k:'thing', i }; renderSide(); draw(); return;
    }
    if(mode === 'things' && inside(c.x, c.y) && !alt){
      edit(() => {
        const id = uniqueId(thingBrush);
        const t = { id, type: thingBrush, x: snap(c.fx, e.shiftKey), y: snap(c.fy, e.shiftKey) };
        if(thingBrush === 'blocks') t.build = { tile:'B', counter:'sealed', side:'west' };
        if(thingBrush === 'light') t.glow = 6;
        LVL.things.push(t); sel = { k:'thing', i: LVL.things.length - 1 };
      });
    }
    return;
  }
  if(mode === 'zones'){
    const hits = LVL.zones.map((z, i) => ({ z, i })).filter(o => c.x >= o.z.x0 && c.x <= o.z.x1 && c.y >= o.z.y0 && c.y <= o.z.y1)
      .sort((a, b) => (a.z.x1 - a.z.x0)*(a.z.y1 - a.z.y0) - (b.z.x1 - b.z.x0)*(b.z.y1 - b.z.y0));
    if(hits.length && !e.shiftKey){ sel = { k:'zone', i: hits[0].i }; renderSide(); draw(); return; }
    drag = { k:'zone', x0:c.x, y0:c.y, x1:c.x, y1:c.y }; return;
  }
  if(mode === 'triggers' || mode === 'script'){
    const i = thingAt(c.fx, c.fy);
    if(i >= 0){
      const id = LVL.things[i].id, ti = LVL.triggers.findIndex(tr => tr.when && tr.when.thing === id);
      if(ti >= 0){ sel = { k:'trigger', i: ti }; setMode('triggers'); return; }
    }
    const ti = LVL.triggers.findIndex(tr => { const r = triggerRect(tr); return r && c.x >= r[0] && c.x <= r[2] && c.y >= r[1] && c.y <= r[3]; });
    if(ti >= 0){ sel = { k:'trigger', i: ti }; setMode('triggers'); }
  }
});
addEventListener('mousemove', e => {
  if(!LVL) return;
  const c = cellAt(e);
  const nh = { x:c.x, y:c.y };
  const changed = !hover || hover.x !== nh.x || hover.y !== nh.y;
  hover = nh;
  if(drag){
    if(drag.k === 'pan'){ panX = drag.px + e.clientX - drag.sx; panY = drag.py + e.clientY - drag.sy; draw(); return; }
    if(drag.k === 'paint' && changed){ paint(c.x, c.y, drag.alt); }
    if(drag.k === 'rect' || drag.k === 'zone' || drag.k === 'pick'){ drag.x1 = c.x; drag.y1 = c.y; }
    if(drag.k === 'thing'){ const t = LVL.things[drag.i]; t.x = snap(c.fx, e.shiftKey); t.y = snap(c.fy, e.shiftKey); }
    if(drag.k === 'player'){ LVL.player.x = snap(c.fx, e.shiftKey); LVL.player.y = snap(c.fy, e.shiftKey); }
    draw();
  } else if(changed) draw();
  if(changed) status(c);
});
addEventListener('mouseup', () => {
  if(!drag) return;
  const d = drag; drag = null;
  const x0 = Math.min(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), x1 = Math.max(d.x0, d.x1), y1 = Math.max(d.y0, d.y1);
  if(d.k === 'paint'){ after(false); }
  else if(d.k === 'rect'){ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) paint(x, y, d.alt); after(false); }
  else if(d.k === 'thing' || d.k === 'player'){ after(true); }
  else if(d.k === 'zone'){
    if(x1 - x0 + y1 - y0 < 0) return;
    edit(() => { LVL.zones.push({ name:'zone ' + (LVL.zones.length + 1), x0:Math.max(0, x0), y0:Math.max(0, y0), x1:Math.min(LVL.w - 1, x1), y1:Math.min(LVL.h - 1, y1) }); sel = { k:'zone', i: LVL.zones.length - 1 }; });
  }
  else if(d.k === 'pick'){ const cb = pickRect; pickRect = null; cb && cb(x0, y0, x1, y1); }
  else draw();
});
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const c = cellAt(e), nz = Math.max(3, Math.min(48, zoom*(e.deltaY < 0 ? 1.15 : 1/1.15)));
  panX = c.mx - c.fx*nz; panY = c.my - c.fy*nz; zoom = nz; draw();
}, { passive:false });
cv.addEventListener('mouseleave', () => { hover = null; draw(); });

function status(c){
  if(!inside(c.x, c.y)){ $('#status').textContent = 'x ' + c.x + '  y ' + c.y; return; }
  const ci = c.y*LVL.w + c.x, tl = L.TILES.find(t => t[1] === grid[ci]);
  const zs = LVL.zones.filter(z => c.x >= z.x0 && c.x <= z.x1 && c.y >= z.y0 && c.y <= z.y1).map(z => z.name || '?');
  const th = LVL.things.filter(t => Math.floor(t.x) === c.x && Math.floor(t.y) === c.y).map(t => t.id);
  $('#status').textContent = 'x ' + c.x + '  y ' + c.y + '   ' + (tl ? tl[2] + " '" + tl[0] + "'" : '') + (dustG[ci] ? '  · rock dusted' : '') +
    (zs.length ? '   zones: ' + zs.join(', ') : '') + (th.length ? '   things: ' + th.join(', ') : '') +
    '      [wheel] zoom  [middle/space-drag] pan  [ctrl+z] undo  [ctrl+s] save';
}

/* ── side panels ─────────────────────────────────────── */
function setMode(m){
  mode = m;
  document.querySelectorAll('#modes [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  pickRect = null; renderSide(); draw();
}
document.querySelectorAll('#modes [data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));

function renderSide(){
  if(!LVL) return;
  side.innerHTML = '';
  ({ tiles:sideTiles, things:sideThings, zones:sideZones, triggers:sideStory, script:sideScript, level:sideLevel, json:sideJSON })[mode]();
}
function swatch(id){
  const c = h('canvas', { className:'sw', width:16, height:16 });
  const x = c.getContext('2d');
  const name = tileTex(id, 0, { warm:[0], floor:[] });
  const tc = ART && texCanvas(id === T.OPEN ? 'mud' : name);
  if(tc && id !== T.OPEN){ x.imageSmoothingEnabled = false; x.drawImage(tc, 0, 0, 16, 16); } else { x.fillStyle = L.COLOR[id]; x.fillRect(0, 0, 16, 16); }
  return c;
}

function sideTiles(){
  side.append(h('h2', null, 'TILES'),
    h('div', { className:'help' }, 'Left click paints the LEFT tile, right click paints the RIGHT tile. Click a swatch to set left, right-click a swatch to set right.'));
  const pal = h('div', { className:'pal' });
  L.TILES.forEach(t => {
    const b = h('button', { className: t[0] === brush ? 'on' : '', title: "char '" + t[0] + "'",
      onclick: () => { brush = t[0]; dustMode = false; renderSide(); },
      oncontextmenu: e => { e.preventDefault(); brush2 = t[0]; dustMode = false; renderSide(); } },
      swatch(t[1]), t[2] + (t[0] === brush2 ? '  (R)' : ''));
    pal.append(b);
  });
  side.append(pal);
  side.append(h('h3', null, 'TOOL'), h('div', { className:'row' },
    ...[['pencil','Pencil'], ['rect','Rectangle'], ['fill','Fill'], ['pick','Eyedropper']].map(([k, lab]) =>
      h('button', { className: tool === k ? 'on' : '', onclick: () => { tool = k; renderSide(); } }, lab))));
  side.append(h('h3', null, 'LAYER'), h('div', { className:'row' },
    h('button', { className: !dustMode ? 'on' : '', onclick: () => { dustMode = false; renderSide(); } }, 'Tiles'),
    h('button', { className: dustMode ? 'on' : '', onclick: () => { dustMode = true; renderSide(); } }, 'Rock dust (L on / R off)')));
  const counts = {}; grid.forEach(v => counts[v] = (counts[v] || 0) + 1);
  side.append(h('h3', null, 'MAP'), h('div', { className:'help' },
    LVL.w + '×' + LVL.h + ' · open ' + (counts[T.OPEN] || 0) + ' · coal ' + (counts[T.COAL] || 0) + ' · roots ' + (counts[T.ROOT] || 0) + ' · dusted ' + dustG.reduce((a, b) => a + b, 0)),
    h('div', { className:'row' },
      h('button', { onclick: () => edit(() => { for(let x = 0; x < LVL.w; x++){ grid[x] = T.ROCK; grid[(LVL.h - 1)*LVL.w + x] = T.ROCK; } for(let y = 0; y < LVL.h; y++){ grid[y*LVL.w] = grid[y*LVL.w] === T.PORTAL ? T.PORTAL : T.ROCK; grid[y*LVL.w + LVL.w - 1] = T.ROCK; } }) }, 'Rock border'),
      h('button', { onclick: () => edit(() => { for(let i = 0; i < grid.length; i++) if(grid[i] === T.OPEN) dustG[i] = 1; }) }, 'Dust all open'),
      h('button', { onclick: () => edit(() => dustG.fill(0)) }, 'Clear dust')));
  side.append(h('div', { className:'note' }, 'The mine is a grid. Open tiles are walkable. Coal can be mined by the player. Rock, roots and block stoppings cannot. Portal tiles let daylight in. "Combs line" coal is painted orange and refuses the cutter.'));
}

function uniqueId(base){ let i = 1, id = base; const has = id => LVL.things.some(t => t.id === id); while(has(id)) id = base + (++i); return id; }
function talkToText(talk){ return (talk || []).map(l => Array.isArray(l) ? (l[0] ? l[0] + ': ' : '') + l[1] : l).join('\n'); }
function textToTalk(s){ return s.split('\n').map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^([A-Z][A-Z .'-]{0,20}):\s*(.*)$/); return m ? [m[1], m[2]] : ['', x]; }); }
function renameThing(oldId, newId){
  LVL.triggers.forEach(tr => {
    if(tr.when && tr.when.thing === oldId) tr.when.thing = newId;
    [].concat(tr.do || [], tr.else || []).forEach(a => { if(a.remove === oldId) a.remove = newId; if(a.move === oldId) a.move = newId; });
  });
}
function sideThings(){
  side.append(h('h2', null, 'THINGS'), h('div', { className:'help' }, 'Pick a type, click the map to place (snaps to tile centres, hold Shift for free). Drag to move. Del deletes. Drag the red arrow to move the player start.'));
  const pal = h('div', { className:'pal' });
  Object.keys(L.THINGS).forEach(k => {
    const d = L.THINGS[k], sw = h('canvas', { className:'sw', width:16, height:16 });
    const tc = ART && texCanvas(d.sprite); if(tc){ const x = sw.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(tc, 0, 0, 16, 16); }
    pal.append(h('button', { className: thingBrush === k ? 'on' : '', onclick: () => { thingBrush = k; renderSide(); } }, sw, d.label));
  });
  side.append(pal);
  if(sel && sel.k === 'player'){
    const p = LVL.player;
    side.append(h('h3', null, 'PLAYER START'), row('x', num(p.x, v => p.x = v)), row('y', num(p.y, v => p.y = v)),
      row('facing', pick([[0,'east →'], [1.5708,'south ↓'], [3.1416,'west ←'], [-1.5708,'north ↑']], nearDir(p.a || 0), v => p.a = +v)));
  }
  const t = sel && sel.k === 'thing' && LVL.things[sel.i];
  if(t){
    const d = L.THINGS[t.type] || {};
    side.append(h('h3', null, 'SELECTED: ' + t.id));
    side.append(row('id', h('input', { type:'text', value:t.id, onchange: e => { const nv = e.target.value.trim(); if(!nv || nv === t.id) return; if(LVL.things.some(o => o.id === nv)){ toast('id already used'); renderSide(); return; } edit(() => { renameThing(t.id, nv); t.id = nv; }); } })));
    side.append(row('type', pick(Object.keys(L.THINGS), t.type, v => t.type = v)));
    side.append(row('x', num(t.x, v => t.x = v)), row('y', num(t.y, v => t.y = v)));
    side.append(row('label', txt(t.label, v => { if(v) t.label = v; else delete t.label; }, d.label)));
    side.append(row('solid', pick([['', 'default (' + (d.solid ? 'yes' : 'no') + ')'], ['yes','yes'], ['no','no']], t.solid == null ? '' : t.solid ? 'yes' : 'no', v => { if(v === '') delete t.solid; else t.solid = v === 'yes'; })));
    side.append(row('hidden', chk(t.hidden, v => { if(v) t.hidden = true; else delete t.hidden; })));
    if(d.use === 'talk'){
      side.append(h('h3', null, 'TALK LINES'), h('div', { className:'help' }, 'One line per press of E. Start a line with a name and a colon to set who says it: LUTHER: text'),
        area(talkToText(t.talk), v => { const tl = textToTalk(v); if(tl.length) t.talk = tl; else delete t.talk; }, 5));
    }
    if(d.use === 'pickup'){
      side.append(row('says', txt(t.say, v => t.say = v)), row('who', txt(t.who, v => { if(v) t.who = v; else delete t.who; })),
        row('counter +1', txt(t.counter, v => { if(v) t.counter = v; else delete t.counter; }, 'e.g. buckets')));
    }
    if(t.type === 'light') side.append(row('glow radius', num(t.glow || 6, v => t.glow = v)));
    if(d.use === 'build'){
      const b = t.build || (t.build = { tile:'B', counter:'sealed', side:'west' });
      side.append(h('h3', null, 'BUILD'), row('becomes', pick(L.TILES.map(x => [x[0], x[2]]), b.tile, v => b.tile = v)),
        row('counter +1', txt(b.counter, v => b.counter = v)), row('build from', pick(['west','east','any'], b.side, v => b.side = v)),
        row('says', txt(t.say, v => t.say = v)));
    }
    const refs = LVL.triggers.filter(tr => (tr.when && tr.when.thing === t.id));
    side.append(h('div', { className:'row' },
      h('button', { onclick: () => { addTrigger('near', { thing:t.id }); } }, '+ trigger when near'),
      h('button', { onclick: () => { addTrigger('use', { thing:t.id }); } }, '+ trigger on E')));
    if(refs.length) side.append(h('div', { className:'help' }, 'Triggers using it: ' + refs.map(r => r.id).join(', ')));
    side.append(h('div', { className:'row' },
      h('button', { onclick: () => edit(() => { const c = JSON.parse(JSON.stringify(t)); c.id = uniqueId(t.type); c.x += 1; LVL.things.push(c); sel = { k:'thing', i:LVL.things.length - 1 }; }) }, 'Duplicate'),
      h('button', { className:'danger', onclick: () => delSel() }, 'Delete')));
  }
  side.append(h('h3', null, 'ALL THINGS (' + LVL.things.length + ')'));
  const lst = h('div', { className:'lst' });
  LVL.things.forEach((o, i) => { if(o.type === 'roots_hang') return; lst.append(h('div', { className: sel && sel.k === 'thing' && sel.i === i ? 'sel' : '', onclick: () => { sel = { k:'thing', i }; center(o.x, o.y); renderSide(); draw(); } }, o.id + '  ·  ' + o.type + '  (' + o.x + ', ' + o.y + ')')); });
  side.append(lst, h('div', { className:'help' }, LVL.things.filter(o => o.type === 'roots_hang').length + ' hanging-root decorations not listed.'));
}
function center(x, y){ const s = size(); panX = s.w/2 - x*zoom; panY = s.h/2 - y*zoom; }

function sideZones(){
  side.append(h('h2', null, 'ZONES'), h('div', { className:'help' }, 'Drag on the map to make a zone (Shift-drag to start one inside another). Click a zone to edit it. Zones set the rules of an area. Gas adds together where zones overlap.'));
  const lst = h('div', { className:'lst' });
  LVL.zones.forEach((z, i) => lst.append(h('div', { className: sel && sel.k === 'zone' && sel.i === i ? 'sel' : '', onclick: () => { sel = { k:'zone', i }; renderSide(); draw(); } },
    h('span', { style:'color:' + zoneColor(z) }, '■ '), (z.name || 'zone ' + i) + '  (' + z.x0 + ',' + z.y0 + ')–(' + z.x1 + ',' + z.y1 + ')')));
  side.append(lst);
  const z = sel && sel.k === 'zone' && LVL.zones[sel.i];
  if(!z) return;
  side.append(h('h3', null, 'ZONE'),
    row('name', txt(z.name, v => z.name = v)),
    row('x0 / y0', num(z.x0, v => z.x0 = v, 1), num(z.y0, v => z.y0 = v, 1)),
    row('x1 / y1', num(z.x1, v => z.x1 = v, 1), num(z.y1, v => z.y1 = v, 1)),
    row('warm', chk(z.warm, v => { if(v) z.warm = true; else delete z.warm; }), h('span', { className:'muted' }, 'coal parting runs warm orange; dusted coal shows the glyph')),
    row('anomaly', chk(z.anomaly, v => { if(v) z.anomaly = true; else delete z.anomaly; }), h('span', { className:'muted' }, 'lamp burns tall, no gas, shots never ignite')),
    row('gas %', num(z.gas, v => { if(v) z.gas = v; else delete z.gas; })),
    row('no mining', txt(z.nomine, v => { if(v) z.nomine = v; else delete z.nomine; }, 'message when refused')),
    row('...said by', txt(z.nomineWho, v => { if(v) z.nomineWho = v; else delete z.nomineWho; }, 'LUTHER')),
    row('floor', pick(['', 'mud', 'floor_dust', 'root_floor'], z.floor, v => { if(v) z.floor = v; else delete z.floor; })),
    row('roof', pick(['', 'ceil_shale', 'ceil_dust', 'root_ceil'], z.ceil, v => { if(v) z.ceil = v; else delete z.ceil; })),
    row('ambient', num(z.ambient, v => { if(v) z.ambient = v; else delete z.ambient; }), h('span', { className:'muted' }, 'warm light 0–1')),
    row('lamp drain ×', num(z.drain, v => { if(v) z.drain = v; else delete z.drain; })),
    row('drone', num(z.drone, v => { if(v) z.drone = v; else delete z.drone; }), h('span', { className:'muted' }, 'low hum + breathing 0–1')),
    h('div', { className:'row' },
      h('button', { onclick: () => edit(() => { const i = sel.i; if(i > 0){ const a = LVL.zones; [a[i - 1], a[i]] = [a[i], a[i - 1]]; sel.i--; } }) }, '▲'),
      h('button', { onclick: () => edit(() => { const i = sel.i, a = LVL.zones; if(i < a.length - 1){ [a[i + 1], a[i]] = [a[i], a[i + 1]]; sel.i++; } }) }, '▼'),
      h('button', { onclick: () => edit(() => { LVL.zones.push(JSON.parse(JSON.stringify(z))); sel = { k:'zone', i:LVL.zones.length - 1 }; }) }, 'Duplicate'),
      h('button', { className:'danger', onclick: () => delSel() }, 'Delete')));
}

/* ── story (triggers) ────────────────────────────────── */
const TEMPLATES = [
  ['Narration when the player walks into an area', () => ({ when:{ on:'enter', x0:0, y0:0, x1:0, y1:0 }, do:[{ say:'Something the player notices.' }] }), true],
  ['A character speaks when you get near a thing', () => ({ when:{ on:'near', thing: firstThing(), r:1.6 }, do:[{ say:'Line of dialogue.', who:'LUTHER' }] })],
  ['Something happens when you press E on a thing', () => ({ when:{ on:'use', thing: firstThing() }, do:[{ card:['A full-screen moment.', '', 'Click to go on.'] }] })],
  ['Something happens when you press E on a tile', () => ({ when:{ on:'usetile', tile:'X' }, do:[{ say:'You look closer.' }] })],
  ['When a counter reaches a number', () => ({ when:{ on:'counter', name:'tons', gte:21 }, do:[{ say:'That\'s one place.', who:'LUTHER' }] })],
  ['When a mining step finishes in an area', () => ({ when:{ on:'mine', step:'cut', x0:0, y0:0, x1:0, y1:0 }, do:[{ say:'The cutter bar comes out warm.' }] }), true],
  ['At the start of the level', () => ({ when:{ on:'start' }, do:[{ obj:'OBJECTIVE' }, { say:'Opening line.', who:'LUTHER' }] })],
  ['Full-screen card after N seconds', () => ({ when:{ on:'timer', sec:30 }, do:[{ card:['Thirty seconds in.'] }] })],
  ['End the level at the drift mouth (with a quota)', () => ({ when:{ on:'usetile', tile:'P' }, if:{ counter:'tons', gte:63 }, do:[{ end:{ next:'levels/e1m2.json', card:['The next day.'] } }], else:[{ say:'Day ain\'t over.', who:'LUTHER' }] })],
  ['Blank trigger', () => ({ when:{ on:'start' }, do:[] })]
];
function firstThing(){ const t = LVL.things.find(o => o.type !== 'roots_hang'); return t ? t.id : ''; }
function uniqueTid(base){ let i = 1, id = base; while(LVL.triggers.some(t => t.id === id)) id = base + '_' + (++i); return id; }
function addTrigger(on, extra){
  const tr = { id: uniqueTid(on + (extra && extra.thing ? '_' + extra.thing : '')), when: Object.assign({ on }, extra || {}), do:[{ say:'...' }] };
  edit(() => { LVL.triggers.push(tr); sel = { k:'trigger', i:LVL.triggers.length - 1 }; });
  setMode('triggers');
}
function whenText(w){
  if(!w) return '?';
  const r = w.x0 != null ? ' (' + w.x0 + ',' + w.y0 + ')–(' + w.x1 + ',' + w.y1 + ')' : '';
  switch(w.on){
    case 'start': return 'the level starts';
    case 'enter': return 'the player enters' + r;
    case 'near': return 'the player gets within ' + (w.r || 1.4) + ' of ' + w.thing;
    case 'use': return 'the player presses E on ' + w.thing;
    case 'usetile': return w.tile ? 'the player presses E on a \'' + w.tile + '\' tile' : 'the player presses E on tile ' + w.x + ',' + w.y;
    case 'mine': return (w.step || 'any mining step') + ' finishes' + (r ? ' in' + r : '');
    case 'dust': return 'the player rock-dusts' + (r ? ' in' + r : '');
    case 'lamp': return 'the player checks gas' + (r ? ' in' + r : '');
    case 'counter': return w.name + ' reaches ' + w.gte;
    case 'flag': return 'flag ' + w.name + ' is set';
    case 'timer': return w.sec + 's after the start';
  }
  return w.on;
}
function ifText(c){
  if(!c) return '';
  return [].concat(c).map(k => k.flag != null ? 'flag ' + k.flag : k.notflag != null ? 'not ' + k.notflag :
    k.counter != null ? k.counter + (k.gte != null ? ' ≥ ' + k.gte : '') + (k.lt != null ? ' < ' + k.lt : '') : '?').join(' and ');
}
function verbOf(a){ return Object.keys(L.DO).find(k => k in a) || '?'; }
function actHTML(a){
  const v = verbOf(a);
  switch(v){
    case 'say':  return (a.who ? '<span class="who">' + esc(a.who) + ':</span> ' : '<span class="muted">narration:</span> ') + esc(a.say);
    case 'card': return '<div class="card">' + esc((a.card || []).join('\n')) + '</div>';
    case 'obj':  return 'objective → <b>' + esc(a.obj) + '</b>';
    case 'end':  return 'END LEVEL' + (a.end.next ? ' → ' + esc(a.end.next) : ' (final screen)') + (a.end.card ? '<div class="card">' + esc(a.end.card.join('\n')) + '</div>' : '');
    case 'wait': return '<span class="muted">wait ' + a.wait + 's</span>';
  }
  return '<span class="muted">' + esc(JSON.stringify(a)) + '</span>';
}
function sideScript(){
  side.append(h('h2', null, 'SCRIPT'), h('div', { className:'help' }, 'The whole level\'s story, top to bottom. Click any beat to edit it in STORY.'));
  const box = h('div', { className:'script' });
  if(LVL.intro && LVL.intro.length) box.append(h('div', { className:'tr', onclick: () => setMode('level'), html:'<span class="w">INTRO CARD</span><div class="card">' + esc(LVL.intro.join('\n')) + '</div>' }));
  LVL.triggers.forEach((tr, i) => {
    let s = '<span class="w">WHEN ' + esc(whenText(tr.when)) + '</span>' + (tr.if ? ' <span class="muted">IF ' + esc(ifText(tr.if)) + '</span>' : '') + (tr.once === false ? ' <span class="muted">(repeats)</span>' : '');
    s += '<div>' + (tr.do || []).map(actHTML).join('<br>') + '</div>';
    if(tr.else && tr.else.length) s += '<div class="muted">OTHERWISE:</div><div>' + tr.else.map(actHTML).join('<br>') + '</div>';
    box.append(h('div', { className:'tr', onclick: () => { sel = { k:'trigger', i }; setMode('triggers'); }, html:s }));
  });
  side.append(box);
}
function sideStory(){
  side.append(h('h2', null, 'STORY'), h('div', { className:'help' }, 'Each trigger is one story beat: WHEN something happens, IF a condition holds, DO a list of things. Triggers fire once unless "repeats" is ticked.'));
  const add = h('select', { onchange: e => {
    const t = TEMPLATES[+e.target.value]; if(!t) return;
    const tr = Object.assign({ id: uniqueTid('beat') }, t[1]());
    edit(() => { LVL.triggers.push(tr); sel = { k:'trigger', i:LVL.triggers.length - 1 }; });
    if(t[2]) startPick(tr);
  } });
  add.append(h('option', { value:'' }, '+ Add a story beat…'));
  TEMPLATES.forEach((t, i) => add.append(h('option', { value:i }, t[0])));
  side.append(h('div', { className:'row' }, add));
  const lst = h('div', { className:'lst' });
  LVL.triggers.forEach((tr, i) => lst.append(h('div', { className: sel && sel.k === 'trigger' && sel.i === i ? 'sel' : '', onclick: () => { sel = { k:'trigger', i }; renderSide(); draw(); } },
    h('b', null, tr.id), '  ', h('span', { className:'muted' }, whenText(tr.when) + ' · ' + (tr.do || []).length + ' step' + ((tr.do || []).length === 1 ? '' : 's')))));
  side.append(lst);
  const tr = sel && sel.k === 'trigger' && LVL.triggers[sel.i];
  if(!tr) return;
  const w = tr.when || (tr.when = { on:'start' });
  side.append(h('h3', null, 'BEAT: ' + tr.id));
  side.append(row('id', h('input', { type:'text', value:tr.id, onchange: e => { const v = e.target.value.trim(); if(!v || LVL.triggers.some(o => o !== tr && o.id === v)){ toast('id empty or taken'); renderSide(); return; } edit(() => tr.id = v); } })));
  side.append(row('WHEN', pick(Object.keys(L.WHEN), w.on, v => { tr.when = { on:v }; })));
  side.append(h('div', { className:'help' }, L.WHEN[w.on] ? L.WHEN[w.on].help : ''));
  const f = (L.WHEN[w.on] || { fields:[] }).fields;
  const thingIds = LVL.things.filter(t => t.type !== 'roots_hang').map(t => t.id);
  f.forEach(k => {
    if(k === 'thing') side.append(row('thing', pick(['', ...thingIds], w.thing, v => w.thing = v)));
    else if(k === 'tile') side.append(row('tile', pick([['', '(use x,y)'], ...L.TILES.map(t => [t[0], t[0] + '  ' + t[2]])], w.tile, v => { if(v) w.tile = v; else delete w.tile; })));
    else if(k === 'step') side.append(row('step', pick([['', 'any'], 'cut', 'drill', 'shot', 'load'], w.step, v => { if(v) w.step = v; else delete w.step; })));
    else if(k === 'name') side.append(row('name', txt(w.name, v => w.name = v, 'tons, found, sealed, a flag…')));
    else if(['x0','y0','x1','y1'].includes(k)) return;
    else side.append(row(k, num(w[k], v => { if(v == null) delete w[k]; else w[k] = v; })));
  });
  if(f.includes('x0')){
    side.append(row('area', h('span', null, w.x0 != null ? '(' + w.x0 + ',' + w.y0 + ')–(' + w.x1 + ',' + w.y1 + ')' : 'anywhere'),
      h('button', { onclick: () => startPick(tr) }, 'Pick on map'),
      w.x0 != null && w.on !== 'enter' ? h('button', { onclick: () => edit(() => { delete w.x0; delete w.y0; delete w.x1; delete w.y1; }) }, 'Anywhere') : null));
  }
  /* IF */
  side.append(h('h3', null, 'IF (optional)'));
  const conds = tr.if ? [].concat(tr.if) : [];
  conds.forEach((c, ci) => {
    const kind = c.flag != null ? 'flag' : c.notflag != null ? 'notflag' : 'counter';
    const name = c.flag != null ? c.flag : c.notflag != null ? c.notflag : c.counter;
    const set = nc => edit(() => { const a = [].concat(tr.if); a[ci] = nc; tr.if = a.length === 1 ? a[0] : a; });
    side.append(h('div', { className:'row' },
      h('select', { onchange: e => set(e.target.value === 'counter' ? { counter:name, gte:1 } : { [e.target.value]: name }) },
        ...['counter','flag','notflag'].map(k => h('option', { value:k, selected:k === kind }, k === 'notflag' ? 'flag NOT set' : k))),
      h('input', { type:'text', value:name || '', style:'width:90px', onchange: e => { const n = Object.assign({}, c); n[kind] = e.target.value; set(n); } }),
      kind === 'counter' ? h('select', { onchange: e => { const n = { counter:c.counter }; n[e.target.value] = c.gte != null ? c.gte : c.lt; set(n); } },
        h('option', { value:'gte', selected:c.gte != null }, '≥'), h('option', { value:'lt', selected:c.lt != null }, '<')) : null,
      kind === 'counter' ? h('input', { type:'number', value: c.gte != null ? c.gte : c.lt, style:'width:60px', onchange: e => { const n = Object.assign({}, c); n[c.gte != null ? 'gte' : 'lt'] = +e.target.value; set(n); } }) : null,
      h('button', { onclick: () => edit(() => { const a = [].concat(tr.if); a.splice(ci, 1); if(!a.length) delete tr.if; else tr.if = a.length === 1 ? a[0] : a; }) }, '✕')));
  });
  side.append(h('div', { className:'row' }, h('button', { onclick: () => edit(() => { const a = tr.if ? [].concat(tr.if) : []; a.push({ counter:'tons', gte:1 }); tr.if = a.length === 1 ? a[0] : a; }) }, '+ condition')));
  side.append(row('repeats', chk(tr.once === false, v => { if(v) tr.once = false; else delete tr.once; }), tr.once === false ? h('span', null, 'cooldown ', num(tr.cooldown, v => { if(v) tr.cooldown = v; else delete tr.cooldown; })) : null));
  side.append(h('h3', null, 'DO'));
  side.append(actionsEditor(tr, 'do'));
  if(tr.if){ side.append(h('h3', null, 'OTHERWISE (when the IF fails)')); side.append(actionsEditor(tr, 'else')); }
  side.append(h('div', { className:'row', style:'margin-top:12px' },
    h('button', { onclick: () => edit(() => { const i = sel.i, a = LVL.triggers; if(i > 0){ [a[i - 1], a[i]] = [a[i], a[i - 1]]; sel.i--; } }) }, '▲'),
    h('button', { onclick: () => edit(() => { const i = sel.i, a = LVL.triggers; if(i < a.length - 1){ [a[i + 1], a[i]] = [a[i], a[i + 1]]; sel.i++; } }) }, '▼'),
    h('button', { onclick: () => edit(() => { const c = JSON.parse(JSON.stringify(tr)); c.id = uniqueTid(tr.id); LVL.triggers.splice(sel.i + 1, 0, c); sel.i++; }) }, 'Duplicate'),
    h('button', { onclick: () => playtestTrigger(tr) }, '▶ test from here'),
    h('button', { className:'danger', onclick: () => delSel() }, 'Delete')));
}
function startPick(tr){
  pickRect = (x0, y0, x1, y1) => edit(() => { const w = tr.when; if(w.on === 'usetile'){ w.x = x0; w.y = y0; delete w.tile; } else Object.assign(w, { x0, y0, x1, y1 }); });
  draw();
}
function actionsEditor(tr, key){
  const list = tr[key] || (tr[key] = []);
  const box = h('div');
  list.forEach((a, i) => {
    const v = verbOf(a);
    const wrap = h('div', { className:'act' });
    const verbSel = h('select', { onchange: e => edit(() => { list[i] = JSON.parse(JSON.stringify(L.DO[e.target.value].example)); }) },
      ...Object.keys(L.DO).map(k => h('option', { value:k, selected:k === v }, k)));
    wrap.append(h('div', { className:'hd' }, h('span', { className:'muted' }, (i + 1) + '.'), verbSel,
      h('button', { title:'up', onclick: () => edit(() => { if(i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]]; }) }, '▲'),
      h('button', { title:'down', onclick: () => edit(() => { if(i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]]; }) }, '▼'),
      h('button', { title:'delete', onclick: () => edit(() => list.splice(i, 1)) }, '✕')));
    if(v === 'say'){
      wrap.append(h('div', { className:'row' }, h('input', { type:'text', list:'whoList', placeholder:'who (blank = narration)', value:a.who || '', style:'width:150px', onchange: e => edit(() => { if(e.target.value) a.who = e.target.value.toUpperCase(); else delete a.who; }) })));
      wrap.append(h('textarea', { rows:2, value:a.say, onchange: e => edit(() => a.say = e.target.value) }));
    } else if(v === 'card'){
      wrap.append(h('textarea', { rows:5, value:(a.card || []).join('\n'), onchange: e => edit(() => a.card = e.target.value.split('\n')) }));
    } else if(v === 'obj'){
      wrap.append(h('input', { type:'text', value:a.obj, style:'width:100%', onchange: e => edit(() => a.obj = e.target.value) }));
    } else if(v === 'wait'){
      wrap.append(h('div', { className:'row' }, 'seconds ', h('input', { type:'number', step:'any', value:a.wait, onchange: e => edit(() => a.wait = +e.target.value) })));
    } else {
      const ta = h('textarea', { rows:2, value:JSON.stringify(a), onchange: e => {
        try{ const nv = JSON.parse(e.target.value); edit(() => list[i] = nv); }
        catch(err){ wrap.classList.add('err'); toast('Not valid JSON: ' + err.message); }
      } });
      wrap.append(ta, h('div', { className:'help' }, L.DO[v] ? L.DO[v].help : ''));
    }
    box.append(wrap);
  });
  const add = h('select', { onchange: e => { const k = e.target.value; if(!k) return; edit(() => list.push(JSON.parse(JSON.stringify(L.DO[k].example)))); } });
  add.append(h('option', { value:'' }, '+ add a step…'));
  Object.keys(L.DO).forEach(k => add.append(h('option', { value:k }, k + ' — ' + L.DO[k].help.split('.')[0])));
  box.append(h('div', { className:'row' }, add));
  return box;
}

/* ── level settings ──────────────────────────────────── */
function nearDir(a){ const o = [0, 1.5708, 3.1416, -1.5708]; let b = 0; o.forEach(v => { if(Math.abs(Math.atan2(Math.sin(a - v), Math.cos(a - v))) < Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))) b = v; }); return b; }
function hhmm(m){ m = Math.round(m || 0); return String(Math.floor(m/60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function sideLevel(){
  const s = LVL.start, hud = LVL.hud;
  side.append(h('h2', null, 'LEVEL'),
    row('id', txt(LVL.id, v => LVL.id = v)),
    row('title', txt(LVL.title, v => LVL.title = v)),
    row('when', txt(LVL.when, v => LVL.when = v)),
    row('next level', h('input', { type:'text', list:'levelList', value:LVL.next || '', placeholder:'none (final level)', onchange: e => edit(() => LVL.next = e.target.value || null) })));
  side.append(h('h3', null, 'INTRO CARD'), h('div', { className:'help' }, 'Shown full-screen when the level starts. One line per line.'),
    area((LVL.intro || []).join('\n'), v => LVL.intro = v ? v.split('\n') : [], 7));
  side.append(h('h3', null, 'PLAYER START'),
    row('x / y', num(LVL.player.x, v => LVL.player.x = v), num(LVL.player.y, v => LVL.player.y = v)),
    row('facing', pick([[0,'east →'], [1.5708,'south ↓'], [3.1416,'west ←'], [-1.5708,'north ↑']], nearDir(LVL.player.a || 0), v => LVL.player.a = +v)));
  const tools = h('div', { className:'row' }, h('label', null, 'tools'));
  ['lamp','cutter','drill','powder','shovel','duster'].forEach((n, i) => {
    const on = (s.tools || []).includes(i + 1);
    tools.append(h('label', { style:'min-width:0;color:var(--ink)' }, h('input', { type:'checkbox', checked:on, onchange: e => edit(() => {
      const set = new Set(s.tools || []); e.target.checked ? set.add(i + 1) : set.delete(i + 1); s.tools = [...set].sort();
    }) }), ' ' + (i + 1) + ' ' + n));
  });
  side.append(h('h3', null, 'START'), tools,
    row('tool refused', txt(s.toolsOffSay, v => { if(v) s.toolsOffSay = v; else delete s.toolsOffSay; }, 'Not today.')),
    row('powder / bags', num(s.powder, v => s.powder = v, 1), num(s.bags, v => s.bags = v, 1)),
    row('battery / drain', num(s.battery, v => s.battery = v), num(s.drain, v => s.drain = v), h('span', { className:'muted' }, '%/sec')),
    row('clock', h('input', { type:'time', value:hhmm(s.clock), onchange: e => edit(() => { const [a, b] = e.target.value.split(':'); s.clock = (+a)*60 + (+b); }) })),
    row('belt', chk(s.belt && s.belt.on, v => { s.belt = Object.assign({ y:12, fromX:1 }, s.belt, { on:v }); }), h('span', { className:'muted' }, 'running'),
      'from x', num(s.belt && s.belt.fromX, v => { s.belt = Object.assign({ on:false, y:12 }, s.belt, { fromX:v }); }, 1)),
    row('gas base %', num(LVL.rules.gasBase, v => LVL.rules.gasBase = v)));
  side.append(h('h3', null, 'HUD (left panel)'),
    row('label', txt(hud.label, v => hud.label = v)),
    row('counter', txt(hud.counter, v => hud.counter = v, 'tons')),
    row('out of', num(hud.of, v => hud.of = v, 1)));
  const nw = h('input', { type:'number', value:LVL.w, style:'width:60px' }), nh = h('input', { type:'number', value:LVL.h, style:'width:60px' });
  side.append(h('h3', null, 'MAP SIZE'), h('div', { className:'row' }, 'w', nw, 'h', nh,
    h('button', { onclick: () => resizeMap(+nw.value, +nh.value) }, 'Resize (keeps top-left)')));
}
function resizeMap(w, hh){
  if(!(w >= 8 && hh >= 8 && w <= 256 && hh <= 256)){ toast('8–256 tiles'); return; }
  edit(() => {
    const ng = new Uint8Array(w*hh).fill(T.ROCK), nd = new Uint8Array(w*hh);
    for(let y = 0; y < Math.min(hh, LVL.h); y++) for(let x = 0; x < Math.min(w, LVL.w); x++){ ng[y*w + x] = grid[y*LVL.w + x]; nd[y*w + x] = dustG[y*LVL.w + x]; }
    LVL.w = w; LVL.h = hh; grid = ng; dustG = nd;
  });
  fit(); draw();
}

function sideJSON(){
  syncTo();
  const ta = h('textarea', { rows:30, value:L.stringify(LVL), style:'font-size:11px;white-space:pre' });
  side.append(h('h2', null, 'JSON'), h('div', { className:'help' }, 'The raw level file. Edit and Apply, or copy it somewhere safe.'), ta,
    h('div', { className:'row' },
      h('button', { className:'primary', onclick: () => {
        try{ const j = normalize(JSON.parse(ta.value)); before(); LVL = j; syncFrom(); after(true); toast('Applied'); }
        catch(e){ toast('Not valid JSON: ' + e.message); }
      } }, 'Apply'),
      h('button', { onclick: () => { navigator.clipboard && navigator.clipboard.writeText(ta.value); toast('Copied'); } }, 'Copy')));
}

function delSel(){
  if(!sel) return;
  if(sel.k === 'thing') edit(() => { LVL.things.splice(sel.i, 1); sel = null; });
  else if(sel.k === 'zone') edit(() => { LVL.zones.splice(sel.i, 1); sel = null; });
  else if(sel.k === 'trigger'){ if(!confirm('Delete trigger ' + LVL.triggers[sel.i].id + '?')) return; edit(() => { LVL.triggers.splice(sel.i, 1); sel = null; }); }
}

/* ── files ───────────────────────────────────────────── */
async function writeFile(handle, text){ const w = await handle.createWritable(); await w.write(text); await w.close(); }
function download(text, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type:'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
async function save(as){
  syncTo();
  const probs = L.validate(LVL);
  if(probs.length && !confirm('This level has problems:\n\n' + probs.join('\n') + '\n\nSave anyway?')) return;
  const text = L.stringify(LVL), name = (LVL.id || 'level') + '.json';
  try{
    if(dirHandle && !as){
      const lv = await dirHandle.getDirectoryHandle('levels', { create:true });
      const fname = (fileName && fileName.startsWith('levels/') ? fileName.slice(7) : name);
      const fh = await lv.getFileHandle(fname, { create:true });
      await writeFile(fh, text); fileName = 'levels/' + fname;
      await updateIndex(lv);
    } else if(fileHandle && !as){ await writeFile(fileHandle, text); }
    else if(window.showSaveFilePicker){
      fileHandle = await showSaveFilePicker({ suggestedName:name, types:[{ description:'Mine level', accept:{ 'application/json':['.json'] } }] });
      await writeFile(fileHandle, text); fileName = fileHandle.name;
    } else { download(text, name); fileName = name; toast('Downloaded ' + name + '. Put it in levels/'); }
    dirty = false; updateTop(); if(dirHandle || fileHandle) toast('Saved ' + fileName);
  }catch(e){ if(e.name !== 'AbortError') toast('Save failed: ' + e.message); }
}
async function updateIndex(lv){
  let idx = { episode:'', levels:[] };
  try{ const fh = await lv.getFileHandle('index.json'); idx = JSON.parse(await (await fh.getFile()).text()); }catch(e){}
  const file = fileName, ent = idx.levels.find(l => l.file === file);
  const info = { file, id:LVL.id, title:LVL.title, when:LVL.when };
  if(ent) Object.assign(ent, info); else idx.levels.push(info);
  const fh = await lv.getFileHandle('index.json', { create:true });
  await writeFile(fh, JSON.stringify(idx, null, 2) + '\n');
  LEVELS = idx.levels;
}
async function openFile(){
  if(dirty && !confirm('Discard unsaved changes?')) return;
  if(window.showOpenFilePicker){
    try{
      const [fh] = await showOpenFilePicker({ types:[{ description:'Mine level', accept:{ 'application/json':['.json'] } }] });
      const j = JSON.parse(await (await fh.getFile()).text()); load(j, fh.name, fh); toast('Opened ' + fh.name);
    }catch(e){ if(e.name !== 'AbortError') toast('Open failed: ' + e.message); }
    return;
  }
  $('#fileIn').click();
}
$('#fileIn').onchange = async e => {
  const f = e.target.files[0]; if(!f) return;
  try{ load(JSON.parse(await f.text()), f.name, null); toast('Opened ' + f.name + ' (Save will download a copy)'); }catch(err){ toast('Not a level: ' + err.message); }
  e.target.value = '';
};
async function fetchLevels(){
  try{
    if(dirHandle){ const lv = await dirHandle.getDirectoryHandle('levels'); const fh = await lv.getFileHandle('index.json'); LEVELS = JSON.parse(await (await fh.getFile()).text()).levels; }
    else { const r = await fetch('levels/index.json?v=' + Date.now()); LEVELS = (await r.json()).levels; }
  }catch(e){ LEVELS = LEVELS || []; }
  const dl = $('#levelList') || document.body.appendChild(h('datalist', { id:'levelList' }));
  dl.innerHTML = ''; LEVELS.forEach(l => dl.append(h('option', { value:l.file }, l.title)));
}
async function openLevel(file){
  if(dirty && !confirm('Discard unsaved changes?')) return;
  try{
    let j;
    if(dirHandle){ const lv = await dirHandle.getDirectoryHandle('levels'); const fh = await lv.getFileHandle(file.replace(/^levels\//, '')); j = JSON.parse(await (await fh.getFile()).text()); }
    else { const r = await fetch(file + '?v=' + Date.now()); if(!r.ok) throw new Error(r.status); j = await r.json(); }
    load(j, file, null); toast('Opened ' + file);
  }catch(e){ toast('Could not open ' + file + ' (' + e.message + '). Run SECWATCH_CONTROL.bat so the folder is served.'); }
}
function menu(anchor, items){
  document.querySelectorAll('.menu').forEach(m => m.remove());
  const r = anchor.getBoundingClientRect();
  const m = h('div', { className:'menu', style:'left:' + r.left + 'px;top:' + (r.bottom + 2) + 'px' });
  items.forEach(([lab, fn]) => m.append(h('div', { onclick: () => { m.remove(); fn(); } }, lab)));
  document.body.append(m);
  setTimeout(() => addEventListener('mousedown', function off(e){ if(!m.contains(e.target)){ m.remove(); removeEventListener('mousedown', off); } }), 0);
}

/* ── playtest ────────────────────────────────────────── */
function playtest(from, extra){
  syncTo();
  const copy = JSON.parse(JSON.stringify(LVL));
  if(from) copy.player = { x:from.x, y:from.y, a:LVL.player.a || 0 };
  if(extra) extra(copy);
  try{ localStorage.setItem('mine_playtest', JSON.stringify(copy)); }catch(e){ toast('Could not hand the level to the game: ' + e.message); return; }
  window.open('mine.html?playtest=1', 'minetest');
}
function playtestTrigger(tr){
  const w = tr.when || {};
  let at = null;
  if(w.x0 != null) at = { x:+w.x0 + 0.5, y:+w.y0 + 0.5 };
  else if(w.thing){ const t = LVL.things.find(o => o.id === w.thing); if(t) at = { x:t.x - 1, y:t.y }; }
  playtest(at, copy => {
    if(w.on === 'counter') copy.start.counters = Object.assign({}, copy.start.counters, { [w.name]: +w.gte });
  });
}

/* ── top bar + keys ──────────────────────────────────── */
$('#bNew').onclick = () => {
  if(dirty && !confirm('Discard unsaved changes?')) return;
  const b = L.blank(64, 25);
  for(let y = 3; y <= 21; y++) for(let x = 1; x <= 39; x++){ const r = b.tiles[y].split(''); r[x] = 'c'; b.tiles[y] = r.join(''); }
  const r = b.tiles[12].split(''); r[0] = 'P'; for(let x = 1; x <= 6; x++) r[x] = '.'; b.tiles[12] = r.join('');
  b.player = { x:1.5, y:12.5, a:0 };
  b.things = [{ id:'charger', type:'charger', x:2.5, y:12.5 }];
  load(b, '', null); toast('New level: a drift mouth and a coal block. Carve it out with the "open" tile.');
};
$('#bOpen').onclick = openFile;
$('#bBuilt').onclick = async e => { await fetchLevels(); menu(e.currentTarget, LEVELS.length ? LEVELS.map(l => [l.title + '  ·  ' + l.file, () => openLevel(l.file)]) : [['(no levels/index.json found)', () => {}]]); };
$('#bFolder').onclick = async () => {
  if(!window.showDirectoryPicker){ toast('This browser can\'t open folders. Use Chrome or Edge (SECWATCH_CONTROL.bat opens Edge).'); return; }
  try{
    dirHandle = await showDirectoryPicker({ mode:'readwrite' });
    try{ await dirHandle.getDirectoryHandle('levels'); }catch(e){ toast('That folder has no levels/ folder. Pick the secwatch folder.'); dirHandle = null; return; }
    await fetchLevels(); toast('Project folder: ' + dirHandle.name + '. Save now writes into levels/.');
    $('#bFolder').textContent = '📁 ' + dirHandle.name;
  }catch(e){ if(e.name !== 'AbortError') toast(e.message); }
};
$('#bSave').onclick = () => save(false);
$('#bSaveAs').onclick = () => save(true);
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
$('#bPlay').onclick = () => playtest();
$('#bPlayHere').onclick = () => { playHere = true; draw(); };
$('#bView').onclick = () => { viewTex = !viewTex; $('#bView').textContent = 'View: ' + (viewTex ? 'textures' : 'colour'); draw(); };
$('#bGrid').onclick = () => { showGrid = !showGrid; $('#bGrid').textContent = 'Grid: ' + (showGrid ? 'on' : 'off'); draw(); };
$('#bFit').onclick = () => { fit(); draw(); };
$('#sideToggle').onclick = () => side.classList.toggle('open');

addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  const mod = e.ctrlKey || e.metaKey;
  if(mod && e.key.toLowerCase() === 's'){ e.preventDefault(); save(e.shiftKey); return; }
  if(mod && e.key === 'Enter'){ e.preventDefault(); playtest(); return; }
  if(typing) return;
  if(mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if(mod && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
  if(e.key === 'Delete' || e.key === 'Backspace'){ delSel(); return; }
  if(e.key === 'Escape'){ pickRect = null; playHere = false; draw(); return; }
  if(e.code === 'Space'){ spaceDown = true; e.preventDefault(); }
  const m = { '1':'tiles', '2':'things', '3':'zones', '4':'triggers', '5':'script', '6':'level', '7':'json' }[e.key];
  if(m) setMode(m);
  if(mode === 'tiles'){ const t = { p:'pencil', r:'rect', f:'fill', i:'pick' }[e.key.toLowerCase()]; if(t){ tool = t; renderSide(); } }
});
addEventListener('keyup', e => { if(e.code === 'Space') spaceDown = false; });
addEventListener('beforeunload', e => { if(dirty){ e.preventDefault(); e.returnValue = ''; } });
new ResizeObserver(resize).observe($('#center'));
document.body.append(h('datalist', { id:'whoList' }, ...['LUTHER','EB','HAROLD','DOYLE','JUNIOR','ARVEL'].map(w => h('option', { value:w }))));

/* ── boot ────────────────────────────────────────────── */
(async function(){
  load(L.blank(), '', null);
  setMode('tiles');
  await fetchLevels();
  let restored = false;
  try{
    const d = JSON.parse(localStorage.getItem('control_draft'));
    if(d && d.lvl && confirm('Restore the level you were editing (' + (d.lvl.id || '') + ', ' + new Date(d.t).toLocaleString() + ')?')){ load(d.lvl, d.name, null); dirty = true; restored = true; }
  }catch(e){}
  if(!restored){
    const want = new URLSearchParams(location.search).get('level') || (LEVELS[0] && LEVELS[0].file);
    if(want) await openLevel(want);
  }
  updateTop();
  loadArt();
})();
})();
