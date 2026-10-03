/* ════════════════════════════════════════════════════════
   JOSEPH No. 1  --  sprite sheet layout  (js/mineSheets.js)

   One grid layout, shared by:
     mine.html               the game (reads your art)
     art/mine_sheets.html    makes the blank templates + reference
                             sheets, and checks a sheet you painted

   HOW A SHEET IS LAID OUT
   Every cell sits in a "slot":

       +------------------------+  <- 12px label strip (ignored)
       | name                   |
       +------------------------+  <- 1px frame line   (ignored)
       |                        |
       |   cw x ch  ART HERE    |  <- the only pixels the game reads
       |                        |
       +------------------------+  <- 1px frame line   (ignored)

   Slots are packed left to right, `cols` per row, no gaps.
   So you can paint straight onto a template PNG: labels and
   frame lines are never read.

   RULES THE LOADER FOLLOWS
     - Pure magenta (#FF00FF) is a guide colour: always ignored,
       read as transparent. The templates draw guides in it.
     - A cell with no visible pixels left = "not painted yet":
       the game uses its built-in art for that cell. Fill cells
       one at a time and watch them appear.
     - walls / flats are opaque. sprites / tools / face use alpha.
     - Optional glow sheets (walls_glow.png, flats_glow.png,
       sprites_glow.png): same grid, white = lit from inside
       (ignores the cap lamp). Without one, each cell uses the
       glow rule listed below.

   FILES THE GAME LOOKS FOR (missing file = built-in art)
     img/mine/walls.png     img/mine/walls_glow.png
     img/mine/flats.png     img/mine/flats_glow.png
     img/mine/sprites.png   img/mine/sprites_glow.png
     img/mine/tools.png
     img/mine/face.png

   Over file:// (double-click) Chrome won't let a page read
   image pixels, so the game falls back to built-in art. Serve
   the folder (python3 -m http.server) to see your sheets.
════════════════════════════════════════════════════════ */
const MineSheets = (function(){
  const LABEL = 12, B = 1;
  const GUIDE = [255, 0, 255];

  /* cell: [name, what to paint, glow rule]
     glow rules: none | bright (light pixels glow) |
                 warm (orange pixels glow) | full | portal */
  const SHEETS = {
    walls: { cw:64, ch:64, cols:5, kind:'tex', glowSheet:true, cells:[
      ['coal',            'Fire Clay coal face. Flint clay parting band across rows 26-33.', 'none'],
      ['coal_cut',        'Coal face, undercut: black kerf slot along the bottom (rows 54-63), bug dust.', 'none'],
      ['coal_drill',      'Undercut face with shot holes drilled above the kerf.', 'none'],
      ['coal_solid',      'Face drilled WITHOUT an undercut ("off the solid"). Holes, no kerf.', 'none'],
      ['coal_warm',       'East coal past row 27: same face, parting band runs warm orange.', 'warm'],
      ['coal_warm_cut',   'Warm face, undercut.', 'warm'],
      ['coal_warm_drill', 'Warm face, undercut + drilled.', 'warm'],
      ['coal_warm_solid', 'Warm face, drilled off the solid.', 'warm'],
      ['coal_dust',       'Coal rib coated in white rock dust.', 'none'],
      ['dust_glyph',      'Rock-dusted EAST rib: the dust settles in lines = the coordinate glyph (inverted cross + slash).', 'none'],
      ['mark',            'Harold Combs\' line: coal with an orange paint stripe and "H.C."', 'none'],
      ['mark_dust',       'Combs line, rock dusted (paint still shows).', 'none'],
      ['rubble',          'Shot coal: broken pile up to near the roof, dark gap at top.', 'none'],
      ['rubble_dust',     'Shot pile, rock dusted.', 'none'],
      ['rock',            'Sandstone / shale (mine boundary, roof rock).', 'none'],
      ['rock_dust',       'Rock, rock dusted.', 'none'],
      ['block',           'Block stopping: mortared cinder block, plastered. The seal.', 'none'],
      ['portal',          'Drift mouth seen from inside: timber set framing daylight, hills, tipple.', 'portal'],
      ['roots',           'Root wall: Stigmaria roots through fire clay. Warm highlights.', 'warm'],
      ['crack',           'Coal face with a six-inch crack at the bottom, glowing warm from inside.', 'bright']
    ]},
    flats: { cw:64, ch:64, cols:6, kind:'tex', glowSheet:true, cells:[
      ['mud',        'Floor: wet fire clay bottom, puddles. Seen from above, tiles.', 'none'],
      ['floor_dust', 'Floor: rock dusted white, boot prints.', 'none'],
      ['root_floor', 'Floor in the roots: fire clay with root tendrils.', 'warm'],
      ['ceil_shale', 'Roof: dark shale, roof-bolt plates.', 'none'],
      ['ceil_dust',  'Roof: rock dusted white, bolt plates.', 'none'],
      ['root_ceil',  'Roof in the roots: tangled hanging tendrils.', 'warm']
    ]},
    sprites: { cw:64, ch:64, cols:6, kind:'sprite', glowSheet:true, cells:[
      ['belt_0',     'Belt line, frame 1. Low conveyor, bottom ~24 rows. Coal on belt.', 'none'],
      ['belt_1',     'Belt line, frame 2 (coal moved a step).', 'none'],
      ['belt_2',     'Belt line, frame 3.', 'none'],
      ['belt_3',     'Belt line, frame 4.', 'none'],
      ['tail',       'Belt tailpiece: drum + frame. [E] dump the car / extend belt.', 'none'],
      ['charger',    'Lamp rack / charger with cap lamps. [E] recharge.', 'none'],
      ['supply',     'Rock dust sacks + permissible powder box. [E] restock.', 'none'],
      ['luther',     'Luther Joseph, front view. Hard hat + cap lamp. Feet on bottom row.', 'none'],
      ['ebward',     'Ebward Joseph, front view. Hard hat + cap lamp.', 'none'],
      ['harold',     'Harold Combs, front view. Fedora, long coat. No lamp. Never goes under.', 'none'],
      ['cecil',      'Cecil Ison, BACK view, facing the rock. Roots up over his boots.', 'none'],
      ['doyle',      'Doyle Fields, back view, roots to the knees.', 'none'],
      ['bobby',      'Bobby Mullins (19), back view, slimmer. Roots hold his hands.', 'none'],
      ['junior',     'Junior Holbrook, back view, closest to the light. Roots to the waist, warm-lit.', 'none'],
      ['bucket',     'Aluminum dinner bucket on the floor (small, bottom of cell).', 'none'],
      ['car',        'Shuttle car, parked. Low and wide, bottom half of cell.', 'none'],
      ['cutter',     'Cutting machine, cleaned. Long cutter bar.', 'none'],
      ['light',      'The light. A place where the rock stops. Soft, no hard edge.', 'full'],
      ['roots_hang', 'Roots hanging from the top (top half of cell), transparent below.', 'warm'],
      ['blocks',     'Pallet of cinder block + chalk X on the rib. Where a stopping goes.', 'none']
    ]},
    tools: { cw:128, ch:96, cols:4, kind:'tool', cells:[
      ['lamp',     'Flame safety lamp in a gloved hand. Leave the glass EMPTY: the game draws the flame at the magenta cross (64,68).', 'none'],
      ['cutter_0', 'Cutter bar reaching forward from the bottom of the screen. Chain frame 1.', 'none'],
      ['cutter_1', 'Cutter bar, chain frame 2.', 'none'],
      ['drill_0',  'Electric coal drill + auger, frame 1.', 'none'],
      ['drill_1',  'Drill, frame 2 (auger flights rotated).', 'none'],
      ['powder_0', 'Gloves: powder stick + wooden tamping stick.', 'none'],
      ['powder_1', 'Tamping the stick into the hole (pushed forward).', 'none'],
      ['shovel_0', 'No. 4 scoop shovel, blade down.', 'none'],
      ['shovel_1', 'Shovel raised, coal on the blade.', 'none'],
      ['duster_0', 'Rock dust hose + nozzle.', 'none'],
      ['duster_1', 'Nozzle spraying a white cloud.', 'none']
    ]},
    face: { cw:32, ch:40, cols:4, kind:'face', cells:[
      ['calm',       'Status bar face: you. Hard hat, cap lamp, looking ahead.', 'none'],
      ['look_left',  'Eyes left.', 'none'],
      ['look_right', 'Eyes right.', 'none'],
      ['grimy',      'Coal-black from float dust (dust meter high).', 'none'],
      ['scared',     'Wide eyes, mouth open.', 'none'],
      ['hurt',       'Hurt: blood from under the hat.', 'none'],
      ['root',       'In the roots: lit warm from below, calm, eyes reflecting light.', 'none']
    ]}
  };

  /* guide marks drawn (in magenta) on the blank templates */
  const GUIDES = {
    tex:    [{y:0.5, note:'mid'}],
    sprite: [{y:0.5, note:'eye level'}],
    walls:  { coal:[26,33], coal_cut:[26,33,54], coal_drill:[26,33,54], coal_solid:[26,33],
              coal_warm:[26,33], coal_warm_cut:[26,33,54], coal_warm_drill:[26,33,54], coal_warm_solid:[26,33],
              coal_dust:[26,33], dust_glyph:[26,33], mark:[26,33], mark_dust:[26,33] },
    toolAnchor: { lamp:[64,68] }
  };

  function slot(sheet, i){
    const s = SHEETS[sheet], col = i % s.cols, row = (i / s.cols) | 0;
    const sw = s.cw + 2*B, sh = s.ch + 2*B + LABEL;
    return { x: col*sw, y: row*sh, ix: col*sw + B, iy: row*sh + LABEL + B, sw, sh };
  }
  function size(sheet){
    const s = SHEETS[sheet], rows = Math.ceil(s.cells.length / s.cols);
    return { w: s.cols*(s.cw + 2*B), h: rows*(s.ch + 2*B + LABEL) };
  }

  /* Cut one cell out of a loaded sheet image. Returns a canvas, or
     null when the cell is empty (only transparent/guide pixels). */
  function cutCell(srcCtx, sheet, i){
    const s = SHEETS[sheet], p = slot(sheet, i);
    let d;
    try{ d = srcCtx.getImageData(p.ix, p.iy, s.cw, s.ch); }catch(e){ return null; }
    const a = d.data; let any = false;
    for(let k = 0; k < a.length; k += 4){
      if(a[k] === GUIDE[0] && a[k+1] === GUIDE[1] && a[k+2] === GUIDE[2]){ a[k+3] = 0; continue; }
      if(a[k+3] > 8) any = true;
    }
    if(!any) return null;
    const c = document.createElement('canvas'); c.width = s.cw; c.height = s.ch;
    c.getContext('2d').putImageData(d, 0, 0);
    return c;
  }

  function loadImage(src){
    return new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src.startsWith('data:') ? src : src + '?v=' + Date.now();
    });
  }

  /* Load every sheet under `base`. Resolves to
       { 'walls:coal': canvas, 'walls_glow:crack': canvas, ... }
     and a report of what was found. Never rejects. */
  async function load(base, sources){
    sources = sources || {};
    const out = {}, report = [];
    const jobs = [];
    for(const name in SHEETS){
      jobs.push([name, name]);
      if(SHEETS[name].glowSheet) jobs.push([name + '_glow', name]);
    }
    await Promise.all(jobs.map(async ([file, sheet]) => {
      const im = sources[file] ? await loadImage(sources[file]) : await loadImage(base + file + '.png');
      if(!im) return;
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      try{ g.getImageData(0, 0, 1, 1); }
      catch(e){ report.push(file + '.png: found, but the browser blocked reading it (serve over http)'); return; }
      let n = 0;
      SHEETS[sheet].cells.forEach((cell, i) => {
        const cc = cutCell(g, sheet, i);
        if(cc){ out[file + ':' + cell[0]] = cc; n++; }
      });
      report.push(file + '.png: ' + n + ' painted cell' + (n === 1 ? '' : 's'));
    }));
    return { cells: out, report };
  }

  return { SHEETS, GUIDES, LABEL, B, GUIDE, slot, size, cutCell, load };
})();
