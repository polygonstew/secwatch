/* ════════════════════════════════════════════════════════
   JOSEPH No. 1  --  level format ("WAD")  (js/mineLevel.js)

   Shared by mine.html (plays levels), control.html (edits them)
   and index.html (draws the mine maps). Full reference with
   examples: docs/LEVEL_FORMAT.md

   A level is one JSON file in levels/. Shape:
   {
     "format": "joseph-wad/1",
     "id": "e1m1", "title": "THE SHIFT", "when": "FRIDAY ...",
     "w": 64, "h": 25,
     "tiles": [ "####...", ... ],   h rows of w chars (see TILES)
     "dust":  [ "..**...", ... ],   '*' = rock dusted at start
     "player": { "x":1.6, "y":12.5, "a":0 },   a = radians, 0 = east
     "start":  { tools, powder, bags, battery, drain, clock, quota,
                 belt:{on,y,fromX}, counters:{} },
     "hud":    { "label":"TONS", "counter":"tons", "of":63 },
     "rules":  { "gasBase":0.25 },
     "zones":  [ {x0,y0,x1,y1, name, warm, anomaly, gas, nomine,
                  floor, ceil, ambient, drain, drone} ],
     "things": [ {id, type, x, y, ...} ],
     "triggers": [ {id, when:{on,...}, if, once, cooldown, do:[...], else:[...]} ],
     "intro": [ "card lines shown when the level starts" ],
     "next": "levels/e1m2.json"
   }
════════════════════════════════════════════════════════ */
const MineLevel = (function(){

  /* char, id, name, editor colour */
  const TILES = [
    ['.',  0, 'open (mined)',            '#3a3a36'],
    ['#',  1, 'rock',                    '#6a655c'],
    ['c',  2, 'coal',                    '#14141c'],
    ['u',  3, 'coal, undercut',          '#26263a'],
    ['d',  4, 'coal, drilled',           '#34344e'],
    ['r',  5, 'shot coal (rubble)',      '#4a4a52'],
    ['B',  6, 'block stopping (seal)',   '#d8d8d0'],
    ['P',  7, 'portal (daylight)',       '#cfe3f0'],
    ['R',  8, 'roots',                   '#8a4a1e'],
    ['X', 10, 'crack',                   '#ffb060'],
    ['H', 11, 'Combs line (marked coal)','#d2641c'],
    ['s', 12, 'coal, drilled off solid', '#4a3450']
  ];
  const T = { OPEN:0, ROCK:1, COAL:2, CUT:3, DRILL:4, RUBBLE:5, STOP:6, PORTAL:7, ROOT:8, CRACK:10, MARK:11, SOLID:12 };
  const CH2ID = {}, ID2CH = {}, COLOR = {};
  TILES.forEach(t => { CH2ID[t[0]] = t[1]; ID2CH[t[1]] = t[0]; COLOR[t[1]] = t[3]; });

  /* thing types: sprite cell, solid, behaviour, editor label */
  const THINGS = {
    tail:       { sprite:'tail',       solid:false,  use:'tail',    label:'Belt tailpiece' },
    charger:    { sprite:'charger',    solid:true,  use:'charger', label:'Lamp charger' },
    supply:     { sprite:'supply',     solid:true,  use:'supply',  label:'Powder + dust supply' },
    luther:     { sprite:'luther',     solid:true,  use:'talk',    label:'Luther Joseph' },
    ebward:     { sprite:'ebward',     solid:true,  use:'talk',    label:'Ebward Joseph' },
    harold:     { sprite:'harold',     solid:true,  use:'talk',    label:'Harold Combs' },
    cecil:      { sprite:'cecil',      solid:true,  use:'talk',    label:'Cecil Ison' },
    doyle:      { sprite:'doyle',      solid:true,  use:'talk',    label:'Doyle Fields' },
    bobby:      { sprite:'bobby',      solid:true,  use:'talk',    label:'Bobby Mullins' },
    junior:     { sprite:'junior',     solid:true,  use:'talk',    label:'Junior Holbrook' },
    bucket:     { sprite:'bucket',     solid:false, use:'pickup',  label:'Dinner bucket' },
    car:        { sprite:'car',        solid:true,  use:null,      label:'Shuttle car' },
    cutter:     { sprite:'cutter',     solid:true,  use:null,      label:'Cutting machine' },
    light:      { sprite:'light',      solid:false, use:null,      label:'The light (glow source)' },
    roots_hang: { sprite:'roots_hang', solid:false, use:null,      label:'Hanging roots (decor)' },
    blocks:     { sprite:'blocks',     solid:true,  use:'build',   label:'Stopping spot (build)' }
  };

  /* trigger "when" kinds and their fields (editor builds forms from this) */
  const WHEN = {
    start:    { fields:[],                              help:'Once, when the level begins (after the intro card).' },
    enter:    { fields:['x0','y0','x1','y1'],           help:'Player stands inside the tile rectangle (inclusive).' },
    near:     { fields:['thing','r'],                   help:'Player within r tiles of a thing (default 1.4).' },
    use:      { fields:['thing'],                       help:'Player presses E on the thing. Replaces its talk lines.' },
    usetile:  { fields:['x','y','tile'],                help:'Player presses E facing a tile. Give x,y or a tile char (P, X...).' },
    mine:     { fields:['step','x0','y0','x1','y1'],    help:'A mining step finishes in the rect. step: cut | drill | shot | load (blank = any).' },
    dust:     { fields:['x0','y0','x1','y1'],           help:'Player rock-dusts inside the rect.' },
    lamp:     { fields:['x0','y0','x1','y1'],           help:'Player checks gas with the lamp inside the rect.' },
    counter:  { fields:['name','gte'],                  help:'A counter reaches a value (tons, found, sealed, or your own).' },
    flag:     { fields:['name'],                        help:'A flag becomes true.' },
    timer:    { fields:['sec'],                         help:'Seconds after the level starts.' }
  };

  /* actions: one verb key per step. Example values for the editor. */
  const DO = {
    say:      { example:{ say:'Text on screen.', who:'LUTHER' },          help:'Message line. who: LUTHER, EBWARD, HAROLD, a name, or blank for narration.' },
    card:     { example:{ card:['Full screen text.', '', 'Click to go on.'] }, help:'Full-screen typed card. Game pauses until closed.' },
    obj:      { example:{ obj:'FIND THE FOUR' },                          help:'Objective line, top right.' },
    set:      { example:{ set:'flagname', to:true },                      help:'Set a flag.' },
    add:      { example:{ add:'found', n:1 },                             help:'Add to a counter.' },
    tile:     { example:{ tile:'B', x:18, y:10, x1:18, y1:14, onlyOpen:true }, help:'Change tiles (char from the palette). x1/y1 optional. onlyOpen: only replace open floor.' },
    dust:     { example:{ dust:true, x0:1, y0:9, x1:20, y1:15 },          help:'Rock dust a rectangle.' },
    spawn:    { example:{ spawn:{ id:'harold', type:'harold', x:2.5, y:12.5 } }, help:'Add a thing.' },
    remove:   { example:{ remove:'harold' },                              help:'Remove a thing by id.' },
    move:     { example:{ move:'luther', x:3.5, y:12.5 },                  help:'Move a thing.' },
    give:     { example:{ give:{ powder:2, bags:2, battery:100, hp:100 } }, help:'Set/add supplies (battery/hp are set, others added).' },
    teleport: { example:{ teleport:{ x:42.5, y:12.5, a:3.14 } },          help:'Move the player.' },
    belt:     { example:{ belt:false },                                   help:'Turn the belt on or off.' },
    shake:    { example:{ shake:0.6 },                                    help:'Shake the screen (seconds).' },
    flash:    { example:{ flash:'#ffffff' },                              help:'Flash the screen a colour.' },
    sound:    { example:{ sound:'boom' },                                 help:'boom | block | blip | scoop | spray | cut | drill | fuse | breath' },
    wait:     { example:{ wait:1.5 },                                     help:'Pause the script (seconds). Game keeps running.' },
    save:     { example:{ save:{ evidence:'JOSEPH_NO1', flag:'sealed_1962' } }, help:'Write to the SECWATCH save (SW).' },
    end:      { example:{ end:{ next:'levels/e1m2.json', card:['...'] } }, help:'Finish the level. next = level file, or omit for the final screen (buttons:[{label,href}]).' }
  };

  const ZONE_FIELDS = ['name','x0','y0','x1','y1','warm','anomaly','gas','nomine','floor','ceil','ambient','drain','drone'];

  function blank(w, h){
    w = w || 64; h = h || 25;
    const rows = [], dust = [];
    for(let y = 0; y < h; y++){ rows.push('#'.repeat(w)); dust.push('.'.repeat(w)); }
    return {
      format:'joseph-wad/1', id:'new', title:'NEW LEVEL', when:'', w, h,
      tiles:rows, dust,
      player:{ x:1.5, y:Math.floor(h/2) + 0.5, a:0 },
      start:{ tools:[1,2,3,4,5,6], powder:4, bags:8, battery:100, drain:0.12, clock:420, quota:0,
              belt:{ on:false, y:Math.floor(h/2), fromX:1 }, counters:{} },
      hud:{ label:'TONS', counter:'tons', of:0 },
      rules:{ gasBase:0.25 },
      zones:[], things:[], triggers:[], intro:[], next:null
    };
  }

  /* grid helpers: JSON rows <-> Uint8Array */
  function gridFrom(level){
    const g = new Uint8Array(level.w*level.h).fill(T.ROCK);
    for(let y = 0; y < level.h; y++){
      const row = level.tiles[y] || '';
      for(let x = 0; x < level.w; x++){ const id = CH2ID[row[x]]; g[y*level.w + x] = id == null ? T.ROCK : id; }
    }
    return g;
  }
  function rowsFrom(grid, w, h){
    const rows = [];
    for(let y = 0; y < h; y++){ let s = ''; for(let x = 0; x < w; x++) s += ID2CH[grid[y*w + x]] || '#'; rows.push(s); }
    return rows;
  }
  function dustFrom(level){
    const d = new Uint8Array(level.w*level.h);
    if(level.dust) for(let y = 0; y < level.h; y++){
      const row = level.dust[y] || '';
      for(let x = 0; x < level.w; x++) if(row[x] === '*') d[y*level.w + x] = 1;
    }
    return d;
  }
  function dustRows(d, w, h){
    const rows = [];
    for(let y = 0; y < h; y++){ let s = ''; for(let x = 0; x < w; x++) s += d[y*w + x] ? '*' : '.'; rows.push(s); }
    return rows;
  }

  /* Basic sanity check. Returns a list of problems (strings). */
  function validate(lv){
    const out = [];
    if(lv.format !== 'joseph-wad/1') out.push('format should be "joseph-wad/1"');
    if(!lv.w || !lv.h) out.push('missing w/h');
    if(!Array.isArray(lv.tiles) || lv.tiles.length !== lv.h) out.push('tiles must have h rows');
    else lv.tiles.forEach((r, i) => { if(r.length !== lv.w) out.push('tiles row ' + i + ' is ' + r.length + ' wide, expected ' + lv.w); });
    const ids = new Set();
    (lv.things || []).forEach(t => {
      if(!THINGS[t.type]) out.push('thing ' + t.id + ': unknown type ' + t.type);
      if(ids.has(t.id)) out.push('duplicate thing id ' + t.id); ids.add(t.id);
    });
    const tids = new Set();
    (lv.triggers || []).forEach(tr => {
      if(!tr.when || !WHEN[tr.when.on]) out.push('trigger ' + tr.id + ': unknown when.on ' + (tr.when && tr.when.on));
      if(tids.has(tr.id)) out.push('duplicate trigger id ' + tr.id); tids.add(tr.id);
      [].concat(tr.do || [], tr.else || []).forEach(a => {
        const k = Object.keys(a).find(k => DO[k]);
        if(!k) out.push('trigger ' + tr.id + ': action with no known verb ' + JSON.stringify(a).slice(0, 60));
      });
    });
    if(lv.player){
      const g = gridFrom(lv), c = Math.floor(lv.player.y)*lv.w + Math.floor(lv.player.x);
      if(g[c] !== T.OPEN) out.push('player starts inside a solid tile');
    }
    return out;
  }

  /* Readable JSON: one tile row / thing / action per line. */
  function stringify(lv){
    const q = v => JSON.stringify(v);
    const list = (arr, ind) => arr.length ? '[\n' + arr.map(v => ind + '  ' + q(v)).join(',\n') + '\n' + ind + ']' : '[]';
    const order = ['format','id','title','when','w','h','player','start','hud','rules','next'];
    const out = ['{'];
    order.forEach(k => { if(k in lv) out.push('  ' + q(k) + ': ' + q(lv[k]) + ','); });
    Object.keys(lv).forEach(k => {
      if(order.includes(k) || ['intro','zones','things','triggers','tiles','dust'].includes(k)) return;
      out.push('  ' + q(k) + ': ' + q(lv[k]) + ',');
    });
    out.push('  "intro": ' + list(lv.intro || [], '  ') + ',');
    out.push('  "zones": ' + list(lv.zones || [], '  ') + ',');
    out.push('  "things": ' + list(lv.things || [], '  ') + ',');
    const trs = (lv.triggers || []).map(tr => {
      const head = Object.assign({}, tr); delete head.do; delete head.else;
      let s = '    ' + q(head).slice(0, -1) + ', "do": ' + list(tr.do || [], '      ');
      if(tr.else && tr.else.length) s += ', "else": ' + list(tr.else, '      ');
      return s + ' }';
    });
    out.push('  "triggers": ' + (trs.length ? '[\n' + trs.join(',\n') + '\n  ]' : '[]') + ',');
    out.push('  "tiles": ' + list(lv.tiles || [], '  ') + ',');
    out.push('  "dust": ' + list(lv.dust || [], '  '));
    out.push('}');
    return out.join('\n') + '\n';
  }

  /* Draw a level as a small map (dashboard / editor thumbnails). */
  function drawMap(g, lv, s, opts){
    opts = opts || {};
    const grid = gridFrom(lv), d = dustFrom(lv);
    for(let y = 0; y < lv.h; y++) for(let x = 0; x < lv.w; x++){
      const id = grid[y*lv.w + x];
      let col = COLOR[id];
      if(opts.blueprint){
        col = id === T.OPEN ? (d[y*lv.w + x] ? '#e8eef8' : '#9fb4d0') :
              id === T.MARK ? '#e0782a' : id === T.STOP ? '#ff5050' :
              id === T.PORTAL ? '#ffffff' : id === T.ROOT ? '#b8743a' :
              id === T.CRACK ? '#ffc070' : id === T.COAL || id === T.ROCK ? null : '#5a7090';
      }
      if(col){ g.fillStyle = col; g.fillRect(x*s, y*s, s, s); }
    }
    if(opts.things !== false) (lv.things || []).forEach(t => {
      g.fillStyle = t.type === 'light' ? '#fff0b0' : /^(cecil|doyle|bobby|junior)$/.test(t.type) ? '#ff9040' :
                    /^(luther|ebward|harold)$/.test(t.type) ? '#90d0ff' : '#e0d070';
      if(t.type === 'roots_hang') return;
      g.fillRect(t.x*s - s*0.35, t.y*s - s*0.35, s*0.7, s*0.7);
    });
  }

  return { TILES, T, CH2ID, ID2CH, COLOR, THINGS, WHEN, DO, ZONE_FIELDS, blank, gridFrom, rowsFrom, dustFrom, dustRows, validate, drawMap, stringify };
})();
if(typeof module !== 'undefined') module.exports = MineLevel;
