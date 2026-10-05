/* ════════════════════════════════════════════════════════
   JOSEPH No. 1 level generator  (tools/gen_joseph_levels.js)

   How levels/e1m1.json and levels/e1m2.json were first made,
   including the seeded root maze. The JSON files are the source of
   truth now (edit them in control.html), so by default this writes
   to tools/out/ and leaves levels/ alone.

     node tools/gen_joseph_levels.js            -> tools/out/e1m1.json, e1m2.json
     node tools/gen_joseph_levels.js --write --force
                                                -> OVERWRITES levels/e1m1.json, e1m2.json

   WARNING: the text in here is the FIRST DRAFT. The levels have since had a
   line-by-line pass (no stage dialect, Eb's eye, Uncle Joe's stories). Writing
   over levels/ throws all of that away. Use it for the maze code, not the text.

   Useful as a pattern for generating new levels or a new root maze
   (change the seed in rng(1962)).
════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const L = require(path.join(__dirname, '..', 'js', 'mineLevel.js'));
const W = 64, H = 25, T = L.T;
function rng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const I = (x,y) => y*W + x;

function base(){
  const g = new Uint8Array(W*H).fill(T.ROCK);
  for(let y = 3; y <= 21; y++) for(let x = 1; x <= 39; x++) g[I(x,y)] = x === 30 ? T.MARK : T.COAL;
  g[I(0,12)] = T.PORTAL;
  return g;
}
function open(g, x0, y0, x1, y1){ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) g[I(x,y)] = T.OPEN; }
function dustOpen(g, d, maxX){
  for(let y = 0; y < H; y++) for(let x = 0; x <= maxX; x++){
    if(g[I(x,y)] !== T.OPEN) continue;
    for(let yy = y-1; yy <= y+1; yy++) for(let xx = x-1; xx <= x+1; xx++) if(xx >= 0 && yy >= 0 && xx < W && yy < H && g[I(xx,yy)] !== T.PORTAL) d[I(xx,yy)] = 1;
  }
}
const say = (text, who) => who ? { say:text, who } : { say:text };

/* ───────────── E1M1  THE SHIFT ───────────── */
function e1m1(){
  const g = base(), d = new Uint8Array(W*H);
  for(const y of [10,12,14]) open(g, 1, y, 14, y);
  for(const x of [4,8,12]) open(g, x, 10, x, 14);
  dustOpen(g, d, 8);
  return {
    format:'joseph-wad/1', id:'e1m1', title:'THE SHIFT', when:'FRIDAY, APRIL 6, 1962',
    w:W, h:H, tiles:L.rowsFrom(g, W, H), dust:L.dustRows(d, W, H),
    player:{ x:1.6, y:12.5, a:0 },
    start:{ tools:[1,2,3,4,5,6], powder:4, bags:6, battery:100, drain:0.1, clock:420, quota:63,
            belt:{ on:true, y:12, fromX:1 }, counters:{} },
    hud:{ label:'TONS', counter:'tons', of:63 },
    rules:{ gasBase:0.25 },
    zones:[
      { name:'gas pocket (south face)', x0:15, y0:13, x1:16, y1:15, gas:1.2 },
      { name:'gas rising', x0:22, y0:3, x1:24, y1:21, gas:0.2 },
      { name:'gas rising more', x0:25, y0:3, x1:26, y1:21, gas:0.45 },
      { name:'the east: warm coal, the lamp burns tall', x0:27, y0:3, x1:39, y1:21, warm:true, anomaly:true, drone:0.35 },
      { name:'Combs line: no mining', x0:30, y0:3, x1:39, y1:21, nomine:'That\'s Harold\'s paint. Not one cut past it.', nomineWho:'LUTHER' }
    ],
    things:[
      { id:'charger', type:'charger', x:1.5, y:10.5 },
      { id:'supply', type:'supply', x:1.5, y:14.5 },
      { id:'luther', type:'luther', x:4.5, y:11.5, talk:[
        ['LUTHER','Run me three places. Sixty-three ton.'],
        ['LUTHER','Undercut it first. Nobody shoots off the solid in my mine.'],
        ['LUTHER','Harold\'s paint is up at thirty. Not one cut past it.'],
        ['LUTHER','Belt tail moves up when you hit it with E and there\'s open entry ahead of it.']] },
      { id:'ebward', type:'ebward', x:8.5, y:13.5, talk:[
        ['EBWARD','Check your gas before every shot. Lamp\'s on 1.'],
        ['EBWARD','If the flame grows a blue cap, hang a curtain on the face and give it time.'],
        ['EBWARD','Dust as you go. Dust don\'t burn if it\'s white.'],
        ['EBWARD','Powder and dust bags are at the portal. Lamp rack too.']] },
      { id:'tail', type:'tail', x:13.5, y:12.5 }
    ],
    triggers:[
      { id:'begin', when:{ on:'start' }, do:[
        { obj:'RUN 3 PLACES  /  63 TONS' },
        say('Morning. Faces are at the end of all three entries. Belt tail\'s at thirteen.', 'LUTHER'),
        { wait:2.5 },
        say('Powder and dust bags are by the portal. Lamp rack too.', 'EBWARD') ] },
      { id:'first_cut', when:{ on:'mine', step:'cut' }, do:[ say('Now drill it. Holes above the kerf. That\'s 3.', 'EBWARD') ] },
      { id:'first_drill', when:{ on:'mine', step:'drill' }, do:[ say('Hold your lamp up to it before you load powder. 1, then SPACE.', 'EBWARD') ] },
      { id:'first_shot', when:{ on:'mine', step:'shot' }, do:[ say('Load it out. Shovel\'s on 5. Three scoops to a place.', 'LUTHER') ] },
      { id:'first_load', when:{ on:'mine', step:'load' }, do:[ say('Car holds three scoops. Dump it at the tail with E.', 'LUTHER') ] },
      { id:'one_place', when:{ on:'counter', name:'tons', gte:21 }, do:[
        say('That\'s one place. Move the tail up when there\'s open entry ahead of it.', 'LUTHER'),
        { wait:3 }, say('And dust it. Watch that dust meter.', 'EBWARD') ] },
      { id:'warmer', when:{ on:'enter', x0:22, y0:3, x1:39, y1:21 }, do:[ say('The air\'s warmer up here. It ought to be colder this far under.') ] },
      { id:'east_lamp', when:{ on:'lamp', x0:27, y0:3, x1:39, y1:21 }, do:[ { wait:1.5 }, say('You hold the lamp closer. The flame leans toward the east rib.') ] },
      { id:'east_cut', when:{ on:'mine', step:'cut', x0:27, y0:3, x1:39, y1:21 }, do:[ say('The cutter bar comes out of the kerf warm. Not hot from the work. Warm like a stone that\'s been in somebody\'s pocket.') ] },
      { id:'east_load', when:{ on:'mine', step:'load', x0:27, y0:3, x1:39, y1:21 }, do:[ say('A piece of the parting rolls off the shovel. It\'s warm. You set it on the rib instead of the belt.') ] },
      { id:'east_dust', when:{ on:'dust', x0:26, y0:3, x1:39, y1:21 }, do:[ { wait:1 }, say('The dust on the east rib won\'t lay even. It settles in lines.') ] },
      { id:'paint', when:{ on:'enter', x0:28, y0:3, x1:29, y1:21 }, do:[ say('Orange paint across the face up ahead. H.C. Harold Combs\' line.') ] },
      { id:'compass', when:{ on:'enter', x0:29, y0:3, x1:29, y1:21 }, do:[ { wait:2 }, say('You check your compass against the survey spad. The needle won\'t settle.') ] },
      { id:'quota', when:{ on:'counter', name:'tons', gte:63 }, do:[
        { obj:'WALK OUT  /  [E] AT THE DRIFT MOUTH' }, say('That\'s the shift. Bring it on out.', 'LUTHER') ] },
      { id:'portal', when:{ on:'usetile', tile:'P' }, if:{ counter:'tons', gte:63 }, do:[
        { end:{ next:'levels/e1m2.json', card:[
          'SATURDAY, APRIL 7, 1962', '',
          'Cleanup shift. Cecil Ison, Doyle Fields, Bobby Mullins and Junior Holbrook',
          'go in at seven to pull the last pillar short of Harold\'s line.', '',
          'You\'re on the picking table at the tipple. The belt runs all morning.',
          'Coal. Slate. Flint clay.', '',
          'Some of the flint clay is warm. The picking boys set those pieces',
          'to one side without being told.', '',
          '2:17 P.M.', '2:18 P.M.', '2:19 P.M.', '',
          'The belt stops.' ] } } ],
        else:[ say('Day ain\'t over. Run me sixty-three ton.', 'LUTHER') ] }
    ],
    intro:[
      'JOSEPH No. 1 DRIFT  /  FIRE CLAY SEAM',
      'FRIDAY, APRIL 6, 1962   7:00 A.M.', '',
      'You run the face for Luther and Ebward Joseph.',
      'Eleven men, one cutting machine, one loader,',
      'and a belt they bought used out of Jenkins.', '',
      'Run three places. Sixty-three ton.', '',
      'Cut it. Drill it. Check your gas. Shoot it.',
      'Load it. Dump it on the belt. Dust as you go.', '',
      'The lease says nobody drives east of Harold Combs\' paint.'
    ],
    next:'levels/e1m2.json'
  };
}

/* ───────────── E1M2  THE EAST HEADING ───────────── */
function roots(g){
  const X0 = 42, X1 = 62, Y0 = 3, Y1 = 21;
  for(let y = 2; y <= 22; y++) for(let x = 41; x <= 62; x++) g[I(x,y)] = T.ROOT;
  const r = rng(1962), carved = new Set();
  // recursive backtracker on odd nodes, then braid a few walls for loops
  const NX = 11, NY = 10, nx = i => X0 + i*2, ny = j => Y0 + j*2;
  const vis = new Set(), stack = [[0, 4]];
  vis.add('0,4'); carved.add(I(nx(0), ny(4)));
  while(stack.length){
    const [i, j] = stack[stack.length - 1];
    const opts = [[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b]) => i+a >= 0 && i+a < NX && j+b >= 0 && j+b < NY && !vis.has((i+a)+','+(j+b)));
    if(!opts.length){ stack.pop(); continue; }
    const w = opts.map(([a]) => a === 1 ? 1.6 : 1); let k = r()*w.reduce((x,y) => x+y, 0), pick = opts[0];
    for(let q = 0; q < opts.length; q++){ if(k < w[q]){ pick = opts[q]; break; } k -= w[q]; }
    const [a, b] = pick;
    carved.add(I(nx(i) + a, ny(j) + b)); carved.add(I(nx(i+a), ny(j+b)));
    vis.add((i+a)+','+(j+b)); stack.push([i+a, j+b]);
  }
  for(let y = Y0; y <= Y1; y++) for(let x = X0; x <= X1; x++){
    const c = I(x,y); if(carved.has(c)) continue;
    const h = carved.has(I(x-1,y)) && carved.has(I(x+1,y)), v = carved.has(I(x,y-1)) && carved.has(I(x,y+1));
    if((h ^ v) && r() < 0.12) carved.add(c);
  }
  carved.add(I(42,12)); carved.add(I(42,11)); carved.add(I(42,13));
  carved.forEach(c => g[c] = T.OPEN);
  g[I(41,12)] = T.OPEN;
  // BFS
  const dist = new Map(), prev = new Map(), q = [I(42,12)]; dist.set(I(42,12), 0);
  while(q.length){ const c = q.shift(), x = c % W, y = (c / W) | 0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const n = I(x+dx,y+dy);
      if(g[n] === T.OPEN && !dist.has(n) && x+dx >= 42){ dist.set(n, dist.get(c)+1); prev.set(n, c); q.push(n); } } }
  let light = I(42,12); dist.forEach((v, c) => { if(v > dist.get(light)) light = c; });
  const lx = light % W, ly = (light / W) | 0;
  for(let y = ly-1; y <= ly+1; y++) for(let x = lx-1; x <= lx+1; x++) if(x >= X0 && x <= X1 && y >= Y0 && y <= Y1){ g[I(x,y)] = T.OPEN; if(!dist.has(I(x,y))) dist.set(I(x,y), dist.get(light)+1); }
  const pred = prev.get(light);
  const chamber = [];
  for(let y = ly-1; y <= ly+1; y++) for(let x = lx-1; x <= lx+1; x++){ const c = I(x,y); if(c !== light && c !== pred && g[c] === T.OPEN) chamber.push(c); }
  const junior = chamber.sort((a,b) => Math.hypot(a%W-lx, ((a/W)|0)-ly) - Math.hypot(b%W-lx, ((b/W)|0)-ly))[0];
  const deg = c => { const x = c % W, y = (c/W)|0; return [[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy]) => g[I(x+dx,y+dy)] === T.OPEN).length; };
  const far = [...dist.keys()].filter(c => c !== light && c !== junior && c !== I(42,12) && dist.get(c) > 6)
    .sort((a,b) => (deg(a) === 1 ? -1000 : 0) + dist.get(b) - ((deg(b) === 1 ? -1000 : 0) + dist.get(a)));
  const picks = [];
  const sep = (a,b) => Math.hypot(a%W - b%W, ((a/W)|0) - ((b/W)|0));
  for(const c of far){ if(picks.length >= 3) break; if(sep(c, light) < 5) continue; if(picks.every(p => sep(p, c) >= 5)) picks.push(c); }
  picks.sort((a,b) => dist.get(a) - dist.get(b));
  const hang = []; const r2 = rng(7);
  const cells = [...dist.keys()].filter(c => c !== light && c !== junior && !picks.includes(c) && c !== I(42,12));
  for(let i = 0; i < 32 && cells.length; i++){ const k = (r2()*cells.length)|0; hang.push(cells.splice(k,1)[0]); }
  return { light, junior, men:picks, hang, lx, ly };
}
function e1m2(){
  const g = base(), d = new Uint8Array(W*H);
  for(const y of [10,14]) open(g, 1, y, 38, y);
  open(g, 1, 12, 39, 12);
  for(const x of [4,8,12,16,20,24,28,32,36]) open(g, x, 10, x, 14);
  for(const x of [6,10,14]) open(g, x, 5, x, 9);
  for(const x of [6,10]) open(g, x, 15, x, 19);
  dustOpen(g, d, 39);
  g[I(40,12)] = T.CRACK;
  const R = roots(g);
  const c2 = c => ({ x:(c % W) + 0.5, y:((c / W) | 0) + 0.5 });
  const men = [['cecil', R.men[0]], ['doyle', R.men[1]], ['bobby', R.men[2]], ['junior', R.junior]];
  const things = [
    { id:'luther', type:'luther', x:1.5, y:10.5, talk:[
      ['LUTHER','I been in this mine every day for two year. I never drove that heading.'],
      ['LUTHER','Go on. We\'re right here.']] },
    { id:'ebward', type:'ebward', x:1.5, y:14.5, talk:[
      ['EBWARD','Somebody\'s got to stay on the fan.'],
      ['EBWARD','Holler if you need us. We\'ll hear you.']] },
    { id:'tail', type:'tail', x:33.5, y:12.5 },
    { id:'car', type:'car', x:32.5, y:11.5 },
    { id:'cutter', type:'cutter', x:36.5, y:13.5 },
    { id:'bucket1', type:'bucket', x:33.3, y:14.3, label:'Cecil\'s bucket', say:'Cecil\'s dinner bucket. His dinner\'s still in it.', counter:'buckets' },
    { id:'bucket2', type:'bucket', x:33.8, y:14.3, label:'Doyle\'s bucket', say:'Doyle\'s bucket. The coffee in the thermos is still warm.', counter:'buckets' },
    { id:'bucket3', type:'bucket', x:34.3, y:14.3, label:'Bobby\'s bucket', say:'Bobby\'s bucket. His mother packed it. There\'s a note in the lid.', counter:'buckets' },
    { id:'bucket4', type:'bucket', x:34.8, y:14.3, label:'Junior\'s bucket', say:'Junior\'s bucket. Empty, and washed out.', counter:'buckets' },
    Object.assign({ id:'light', type:'light', glow:6 }, c2(R.light))
  ];
  men.forEach(([id, c]) => things.push(Object.assign({ id, type:id }, c2(c))));
  R.hang.forEach((c, i) => { const p = c2(c); things.push({ id:'hang' + i, type:'roots_hang', x:p.x + (i % 3 - 1)*0.18, y:p.y + ((i >> 1) % 3 - 1)*0.18 }); });
  const near = (id, text, extra) => ({ id:'found_' + id, when:{ on:'near', thing:id, r:1.5 }, do:[ say(text), ...(extra || []), { add:'found', n:1 } ] });
  return {
    format:'joseph-wad/1', id:'e1m2', title:'THE EAST HEADING', when:'SATURDAY, APRIL 7, 1962',
    w:W, h:H, tiles:L.rowsFrom(g, W, H), dust:L.dustRows(d, W, H),
    player:{ x:2.6, y:12.5, a:0 },
    start:{ tools:[1,6], toolsOffSay:'Not today. Today you\'re looking for four men.', powder:0, bags:4, battery:100, drain:0.07,
            clock:871, quota:0, belt:{ on:false, y:12, fromX:1 }, counters:{} },
    hud:{ label:'FOUND', counter:'found', of:4 },
    rules:{ gasBase:0.2 },
    zones:[
      { name:'the east: warm, lamp burns tall', x0:27, y0:3, x1:40, y1:21, warm:true, anomaly:true, drone:0.45 },
      { name:'the roots', x0:41, y0:1, x1:63, y1:23, anomaly:true, floor:'root_floor', ceil:'root_ceil', ambient:0.1, drain:3, drone:1 }
    ],
    things,
    triggers:[
      { id:'begin', when:{ on:'start' }, do:[
        { obj:'FIND CECIL, DOYLE, BOBBY AND JUNIOR' },
        say('Belt quit at 2:19 and the power\'s still on. Nobody\'s come out.', 'LUTHER'),
        { wait:3 }, say('Somebody\'s got to stay on the fan. Take a light. We\'re right here.', 'EBWARD') ] },
      { id:'fresh_dust', when:{ on:'enter', x0:15, y0:3, x1:39, y1:21 }, do:[ say('The whole section\'s been rock dusted. Fresh. Even. Better than this crew ever dusted anything.') ] },
      { id:'paint', when:{ on:'enter', x0:30, y0:9, x1:30, y1:15 }, do:[ say('Harold\'s paint. The heading goes right through it like it was never there.') ] },
      { id:'new_heading', when:{ on:'enter', x0:31, y0:3, x1:39, y1:21 }, do:[ { wait:1.5 }, say('This heading wasn\'t here yesterday. Nobody on this section drove it. Nobody could have, not in one shift.') ] },
      { id:'car', when:{ on:'near', thing:'car', r:2 }, do:[ say('The shuttle car\'s parked square in the crosscut. Cable hung up on its hooks.') ] },
      { id:'cutter', when:{ on:'near', thing:'cutter', r:2 }, do:[ say('The cutter\'s been cleaned. Bits and all.') ] },
      { id:'buckets', when:{ on:'near', thing:'bucket1', r:2.2 }, do:[ say('Four dinner buckets lined up along the rib, neat as church shoes.') ] },
      { id:'crack_see', when:{ on:'enter', x0:37, y0:11, x1:39, y1:13 }, do:[ { sound:'breath' }, say('A crack at the bottom of the face. Six inches. Warm air coming out of it, steady, pushing against the fan.') ] },
      { id:'crack_go', when:{ on:'usetile', tile:'X' }, do:[ say('You get down on your hands and knees. You fit through. You shouldn\'t.'), { tile:'.', x:40, y:12 }, { sound:'breath' } ] },
      { id:'roots', when:{ on:'enter', x0:42, y0:2, x1:62, y1:22 }, do:[
        say('Roots. In the floor, in the ribs, in the top. Stigmaria: the roots of trees that died three hundred million years ago, before the coal was coal.'),
        { wait:4 }, say('Every miner has seen them turned to stone in the fire clay.'), { wait:3 }, say('These aren\'t stone.') ] },
      near('cecil', 'Cecil Ison. Facing the rock. The roots come up over his boots like ivy on a fence post. His cap lamp is off. You put your hand on his shoulder. He\'s warm. He doesn\'t turn around.'),
      near('doyle', 'Doyle Fields, standing the same way. His lips are moving. No sound. Then, plain as day, in his own voice:', [ { wait:2.5 }, say('Tell Luther it ain\'t his fault.', 'DOYLE') ]),
      near('bobby', 'Bobby Mullins is nineteen. You can see from the side of his face that he\'s smiling. The roots have his hands. He isn\'t fighting them. He\'s holding on.'),
      near('junior', 'Junior Holbrook, closest to the light. He doesn\'t turn around.', [ { wait:2.5 }, say('I understand now.', 'JUNIOR') ]),
      { id:'all_four', when:{ on:'counter', name:'found', gte:4 }, do:[
        { wait:3 }, { obj:'TURN BACK' }, say('That\'s all four. You can\'t carry a man who\'s holding on.'), { wait:2.5 }, say('You should turn back.') ] },
      { id:'light_see', when:{ on:'near', thing:'light', r:3.2 }, do:[
        say('There is light ahead. Not electric. Not natural. Something that\'s been making its own light longer than this mountain\'s been here.'), { wait:3 }, say('You should turn back.') ] },
      { id:'light_touch', when:{ on:'near', thing:'light', r:0.9 }, once:false, cooldown:4, do:[
        { flash:'#fff4d0' }, { card:['', '', '          Not yet.', '', ''] }, { teleport:{ x:42.5, y:12.5, a:3.14159 } } ] },
      { id:'closing', when:{ on:'enter', x0:1, y0:3, x1:39, y1:21 }, if:{ counter:'found', gte:4 }, do:[
        { tile:'c', x:40, y:12 }, { dust:true, x0:40, y0:12, x1:40, y1:12 }, { sound:'breath' },
        say('Behind you the crack is closing. Slow, like a hand. The four of them are on the other side of it.'),
        { spawn:{ id:'harold', type:'harold', x:2.5, y:12.5, talk:[['HAROLD','Block, not powder.'],['HAROLD','Go on. I\'ll be here.']] } },
        { obj:'HAROLD COMBS IS AT THE DRIFT MOUTH' } ] },
      { id:'harold', when:{ on:'use', thing:'harold' }, do:[
        { card:[
          'Harold Combs is standing in the drift mouth.',
          'In nine years of walking this property he has never once come this close.', '',
          '"How far east."', '', 'You tell him.', '',
          '"They ain\'t dead. Not the way you mean it.',
          ' I can\'t tell you the way I mean it."', '',
          '"Nobody goes back in there. Not you, not Luther, not the county."', '',
          '"You wall it up. Block, not powder. You don\'t shoot at it."', '',
          '"I\'ll write it up for the county. My name won\'t be on it."' ] },
        say('Blocks are on the motor. We\'ll lay \'em at eighteen.', 'EBWARD'),
        { spawn:{ id:'seal1', type:'blocks', x:18.5, y:10.5, say:'First stopping. Ebward mortars. Nobody talks.' } },
        { spawn:{ id:'seal2', type:'blocks', x:18.5, y:12.5, say:'Second. Luther scratches the date in the wet face: 4-7-62. Then four sets of initials.' } },
        { spawn:{ id:'seal3', type:'blocks', x:18.5, y:14.5, say:'Third. Plastered. The air goes quiet behind it.' } },
        { obj:'WALL IT UP: 3 STOPPINGS AT CROSSCUT 18' } ] },
      { id:'sealed', when:{ on:'counter', name:'sealed', gte:3 }, do:[
        { wait:3 }, { save:{ evidence:'JOSEPH_NO1', flag:'sealed_1962' } },
        { end:{ card:[
          'The county got Harold\'s report Monday morning.', '',
          'CAUSE: unknown.', 'MEN RECOVERED: none.', 'RECOMMENDED BY: ████████', '',
          'Luther and Ebward Joseph moved the outfit to the next ridge that May.',
          'They ran coal there a long time. They didn\'t talk about No. 1.', '',
          'They got their men out of the work.', 'They shut it right.', 'They never went back east.', '', '',
          'LKCO-04   JOSEPH No. 1 DRIFT   SEALED 1962',
          'EAST HEADING: 4 MEN.  NOT RECOVERED.',
          'STATUS: [updating]', 'STATUS: ACTIVE' ],
          buttons:[ { label:'SECWATCH terminal', href:'index.html?dash' }, { label:'Day 1  (1994)', href:'day1.html' } ] } } ] }
    ],
    intro:[ 'THE EAST HEADING', 'SATURDAY, APRIL 7, 1962   2:31 P.M.', '',
      'Four men in the east heading. The belt stopped twelve minutes ago.', '',
      'Your lamp. Your rock duster. Nothing else today.' ],
    next:null
  };
}
if(process.argv.includes('--write') && !process.argv.includes('--force')){ console.error('Refusing to overwrite levels/ (this file has first-draft text). Add --force if you really mean it.'); process.exit(1); }
const OUTDIR = process.argv.includes('--write') ? path.join(__dirname, '..', 'levels') : path.join(__dirname, 'out');
fs.mkdirSync(OUTDIR, { recursive:true });
for(const [n, lv] of [['e1m1', e1m1()], ['e1m2', e1m2()]]){
  const probs = L.validate(lv);
  console.log(n, probs.length ? probs : 'ok');
  // compact JSON: rows on their own lines, things/triggers one per line
  const j = JSON.stringify(lv, null, 1);
  fs.writeFileSync(path.join(OUTDIR, n + '.json'), L.stringify(lv));
  console.log('wrote', path.join(OUTDIR, n + '.json'));
}
