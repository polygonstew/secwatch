/* ════════════════════════════════════════════════════════
   JOSEPH No. 1  --  built-in art  (js/mineArt.js)

   Procedural stand-ins for every cell in js/mineSheets.js.
   Anything you paint into img/mine/*.png replaces the matching
   cell here; anything you leave empty keeps using this.

   MineArt.bake(sheet, name)     -> canvas of the built-in cell
   MineArt.build(userCells)      -> everything the engine draws:
       tex[name]   {R,G,B,A,E, w,h}   walls, flats, sprites
       tools[name] canvas             first-person tools
       face[name]  canvas             status bar face
   MineArt.flame(ctx,x,y,s,mode,gas,t)   lamp flame overlay
════════════════════════════════════════════════════════ */
const MineArt = (function(){

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function speck(g, r, x0, y0, w, h, n, cols, sw, sh){
    for(let i = 0; i < n; i++){
      g.fillStyle = cols[(r()*cols.length) | 0];
      g.fillRect(x0 + ((r()*w) | 0), y0 + ((r()*h) | 0), sw || 1, sh || 1);
    }
  }
  function whiten(g, w, h, r, a){
    g.fillStyle = 'rgba(210,208,200,' + a + ')'; g.fillRect(0, 0, w, h);
    speck(g, r, 0, 0, w, h, 260, ['#d9d7cf', '#bdbbb3', '#e4e2da', '#a8a69e']);
  }
  function circle(g, x, y, rad, fill, stroke){
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI*2);
    if(fill){ g.fillStyle = fill; g.fill(); }
    if(stroke){ g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }
  function line(g, pts, col, w){
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for(let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i+1]);
    g.stroke();
  }

  /* ── walls ─────────────────────────────────────────── */
  function coal(g, r, w, h, warm){
    g.fillStyle = '#0b0b0f'; g.fillRect(0, 0, w, h);
    for(let i = 0; i < 520; i++){
      const v = 10 + ((r()*24) | 0);
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v+7) + ')';
      g.fillRect((r()*w) | 0, (r()*h) | 0, 1 + ((r()*3) | 0), 1 + ((r()*2) | 0));
    }
    g.fillStyle = 'rgba(0,0,0,.55)';
    for(let x = 3; x < w; x += 8 + ((r()*6) | 0)) g.fillRect(x, 0, 1, h);
    speck(g, r, 0, 0, w, h, 46, ['#4e5568', '#4e5568', '#9097aa']);
    for(let x = 0; x < w; x++){
      const top = 26 + Math.round(Math.sin(x*0.2)*1.3 + r()*0.8), hh = 5 + ((r()*3) | 0);
      for(let y = top; y < top + hh; y++){
        const k = r();
        g.fillStyle = warm ? (k < .12 ? '#f0a050' : k < .55 ? '#9a5426' : '#6e3a1c')
                           : (k < .12 ? '#a49480' : k < .55 ? '#5e5042' : '#463b31');
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  function kerf(g, r, w){
    g.fillStyle = '#020203'; g.fillRect(0, 54, w, 10);
    speck(g, r, 0, 60, w, 4, 70, ['#3a3a40', '#55555c', '#26262a']);
  }
  function holes(g){
    [[12,14],[32,11],[52,14],[13,44],[32,46],[51,44]].forEach(p => circle(g, p[0], p[1], 2.6, '#000', '#34343a'));
  }
  function paint(g, r, h, light){
    for(let y = 0; y < h; y++){
      g.fillStyle = light ? '#e0874a' : (r() < .2 ? '#a84e14' : '#d2641c');
      g.fillRect(28 + ((r()*2) | 0), y, 7 + ((r()*2) | 0), 1);
    }
    g.fillStyle = light ? '#c8642a' : '#e0701e';
    g.font = 'bold 11px monospace'; g.fillText('H.C.', 17, 53);
  }
  function glyph(g){
    const c = '#55534d';
    line(g, [32, 8, 32, 56], c, 2);
    line(g, [20, 40, 44, 40], c, 2);
    line(g, [17, 15, 47, 51], c, 2);
    [14, 20, 26].forEach(y => line(g, [34, y, 39, y], c, 1));
  }
  function rubble(g, r, w, h){
    g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0e0e10'; g.fillRect(0, 0, w, 4);
    const chunks = [];
    for(let i = 0; i < 95; i++) chunks.push([r()*w, 12 + Math.pow(r(), 0.55)*52, 3 + r()*7, r()]);
    chunks.sort((a, b) => a[1] - b[1]);
    chunks.forEach(c => {
      const v = 14 + ((r()*36) | 0);
      g.fillStyle = c[3] < .1 ? '#5e5042' : 'rgb(' + v + ',' + v + ',' + (v+6) + ')';
      g.beginPath();
      for(let k = 0; k < 5; k++){
        const a = k/5*Math.PI*2 + r()*0.6, rr = c[2]*(0.6 + r()*0.5);
        const px = c[0] + Math.cos(a)*rr, py = c[1] + Math.sin(a)*rr*0.8;
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(140,150,170,.35)'; g.fillRect(c[0] | 0, (c[1] - c[2]*0.5) | 0, 2, 1);
    });
  }
  function rock(g, r, w, h){
    for(let y = 0; y < h; y++){
      const v = 46 + Math.sin(y*0.45 + r()*0.4)*9 + (y % 13 < 3 ? 12 : 0);
      g.fillStyle = 'rgb(' + (v+4 | 0) + ',' + (v | 0) + ',' + (v-6 | 0) + ')'; g.fillRect(0, y, w, 1);
    }
    speck(g, r, 0, 0, w, h, 300, ['#2a2825', '#5a564e', '#3a3732', '#6a655c']);
  }
  function block(g, r, w, h){
    g.fillStyle = '#4a4a45'; g.fillRect(0, 0, w, h);
    for(let row = 0; row < 8; row++){
      const off = row % 2 ? 8 : 0;
      for(let x = -off; x < w; x += 16){
        const v = 120 + ((r()*20) | 0);
        g.fillStyle = 'rgb(' + v + ',' + v + ',' + (v-6) + ')';
        g.fillRect(x + 1, row*8 + 1, 14, 6);
      }
    }
    speck(g, r, 0, 0, w, h, 220, ['#9a9a92', '#6a6a64', '#b0b0a8']);
  }
  function portal(g, r, w, h){
    g.fillStyle = '#2e1e10'; g.fillRect(0, 0, w, h);
    const sky = g.createLinearGradient(0, 7, 0, 34); sky.addColorStop(0, '#e6eef0'); sky.addColorStop(1, '#b7cddc');
    g.fillStyle = sky; g.fillRect(7, 7, 50, 30);
    for(let x = 7; x < 57; x++){
      const hy = 28 + Math.sin(x*0.15)*4 + Math.sin(x*0.05)*3;
      g.fillStyle = '#5c7550'; g.fillRect(x, hy | 0, 1, 50 - hy);
    }
    for(let i = 0; i < 14; i++) circle(g, 8 + r()*48, 26 + r()*8, 2 + r()*3, '#3d5634');
    g.fillStyle = '#4a4a4a'; g.fillRect(40, 31, 12, 15); g.fillRect(44, 24, 4, 8); g.fillRect(30, 40, 12, 2);
    g.fillStyle = '#8f8573'; g.fillRect(7, 48, 50, 16);
    speck(g, r, 7, 48, 50, 16, 120, ['#7a705e', '#a39883', '#6a604f']);
    g.fillStyle = '#4a3018'; g.fillRect(0, 0, 7, h); g.fillRect(57, 0, 7, h); g.fillRect(0, 0, w, 7);
    speck(g, r, 0, 0, 7, h, 40, ['#3a2410', '#5a3a1e']); speck(g, r, 57, 0, 7, h, 40, ['#3a2410', '#5a3a1e']);
  }
  function tendrils(g, r, w, h, n, dark, hi, fromTop){
    for(let i = 0; i < n; i++){
      const x0 = r()*w, y0 = fromTop ? 0 : r()*h;
      const x1 = x0 + (r() - 0.5)*40, y1 = fromTop ? 10 + r()*34 : y0 + (r() - 0.5)*60;
      const cx = (x0 + x1)/2 + (r() - 0.5)*30, cy = (y0 + y1)/2 + (r() - 0.5)*20;
      const lw = 1 + r()*3;
      g.lineCap = 'round';
      g.strokeStyle = dark; g.lineWidth = lw;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
      g.strokeStyle = hi; g.lineWidth = 1; g.globalAlpha = 0.75;
      g.beginPath(); g.moveTo(x0 + 1, y0); g.quadraticCurveTo(cx + 1, cy, x1 + 1, y1); g.stroke();
      g.globalAlpha = 1;
    }
  }
  function roots(g, r, w, h){
    g.fillStyle = '#2e1f16'; g.fillRect(0, 0, w, h);
    speck(g, r, 0, 0, w, h, 200, ['#3a2a1e', '#241810', '#45321f']);
    tendrils(g, r, w, h, 28, '#160a05', '#c06a2a');
  }
  function crack(g, r, w, h){
    coal(g, r, w, h, true);
    const pts = []; let x = 32;
    for(let y = 10; y <= 64; y += 3){ x += (r() - 0.5)*4; pts.push(x, y); }
    for(let i = 0; i < pts.length - 2; i += 2){
      const t = (pts[i+1] - 10)/54, wd = 1 + t*5;
      line(g, [pts[i], pts[i+1], pts[i+2], pts[i+3]], '#6a2e10', wd + 4);
    }
    for(let i = 0; i < pts.length - 2; i += 2){
      const t = (pts[i+1] - 10)/54, wd = 1 + t*5;
      line(g, [pts[i], pts[i+1], pts[i+2], pts[i+3]], '#ff9a40', wd + 1.5);
      line(g, [pts[i], pts[i+1], pts[i+2], pts[i+3]], '#fff2c8', Math.max(1, wd*0.5));
    }
  }

  /* ── flats ─────────────────────────────────────────── */
  function mud(g, r, w, h){
    g.fillStyle = '#29241e'; g.fillRect(0, 0, w, h);
    speck(g, r, 0, 0, w, h, 400, ['#34302a', '#1f1b17', '#3d372f']);
    for(let i = 0; i < 3; i++){
      g.fillStyle = '#17140f'; g.beginPath();
      g.ellipse(8 + r()*48, 8 + r()*48, 4 + r()*6, 2 + r()*4, 0, 0, Math.PI*2); g.fill();
      g.fillStyle = '#4a463e'; g.fillRect(10 + r()*40, 10 + r()*40, 2, 1);
    }
  }
  function floorDust(g, r, w, h){
    g.fillStyle = '#b5b3ab'; g.fillRect(0, 0, w, h);
    speck(g, r, 0, 0, w, h, 400, ['#c9c7bf', '#a19f97', '#d6d4cc']);
    for(let i = 0; i < 3; i++){ g.fillStyle = '#9a988f'; g.beginPath(); g.ellipse(10 + r()*44, 10 + r()*44, 2.5, 5, r(), 0, Math.PI*2); g.fill(); }
  }
  function rootFloor(g, r, w, h){
    g.fillStyle = '#3f2c20'; g.fillRect(0, 0, w, h);
    speck(g, r, 0, 0, w, h, 260, ['#4a3426', '#2e2016', '#563c2a']);
    tendrils(g, r, w, h, 12, '#1e1008', '#a4561f');
  }
  function ceilShale(g, r, w, h, dusty){
    g.fillStyle = dusty ? '#c4c2ba' : '#24221f'; g.fillRect(0, 0, w, h);
    for(let y = 0; y < h; y += 3 + ((r()*4) | 0)){ g.fillStyle = dusty ? '#b2b0a8' : (r() < .5 ? '#2c2a27' : '#1c1a18'); g.fillRect(0, y, w, 1); }
    speck(g, r, 0, 0, w, h, 200, dusty ? ['#d2d0c8', '#a8a69e'] : ['#302e2a', '#181715']);
    [[12,12],[44,44]].forEach(p => { g.fillStyle = dusty ? '#9c9a92' : '#5a5955'; g.fillRect(p[0]-3, p[1]-3, 7, 7); g.fillStyle = '#2a2a2a'; g.fillRect(p[0], p[1], 1, 1); });
  }
  function rootCeil(g, r, w, h){
    g.fillStyle = '#1a0f09'; g.fillRect(0, 0, w, h);
    tendrils(g, r, w, h, 22, '#0e0704', '#b8622a');
  }

  /* ── sprites (transparent) ─────────────────────────── */
  function belt(k){
    return function(g){
      g.fillStyle = '#2e3033'; [6, 30, 54].forEach(x => g.fillRect(x, 50, 3, 14));
      g.fillStyle = '#55585e'; g.fillRect(0, 47, 64, 3);
      g.fillStyle = '#0d0d0d'; g.fillRect(0, 43, 64, 4);
      [6, 18, 30, 42, 54].forEach(x => circle(g, x, 52, 2, '#8a8d92'));
      for(let i = 0; i < 8; i++){
        const x = (i*8 + k*2) % 64, s = 3 + (i % 3);
        g.fillStyle = '#1c1c22'; g.fillRect(x, 43 - s + 1, s + 1, s);
        g.fillStyle = '#44444f'; g.fillRect(x, 43 - s + 1, s + 1, 1);
      }
    };
  }
  function tail(g){
    g.fillStyle = '#3a3d42'; g.fillRect(6, 36, 52, 24);
    g.fillStyle = '#b89a2a'; for(let x = 8; x < 56; x += 8) g.fillRect(x, 54, 4, 3);
    circle(g, 32, 38, 12, '#5e6168'); circle(g, 32, 38, 4, '#2a2a2c');
    g.strokeStyle = '#0d0d0d'; g.lineWidth = 3; g.beginPath(); g.arc(32, 38, 13, Math.PI, Math.PI*2); g.stroke();
    g.fillStyle = '#26282b'; g.fillRect(8, 60, 6, 4); g.fillRect(50, 60, 6, 4);
  }
  function charger(g){
    g.fillStyle = '#4a3220'; g.fillRect(6, 8, 52, 46);
    g.fillStyle = '#3a2616'; [20, 34, 48].forEach(y => g.fillRect(6, y, 52, 1));
    g.fillStyle = '#3a2616'; g.fillRect(10, 54, 4, 10); g.fillRect(50, 54, 4, 10);
    for(let row = 0; row < 2; row++) for(let i = 0; i < 3; i++){
      const x = 12 + i*16, y = 12 + row*22;
      circle(g, x + 4, y + 2, 3, '#c8c8c0'); g.fillStyle = '#fff2b0'; g.fillRect(x + 3, y + 1, 2, 2);
      g.strokeStyle = '#111'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y + 5); g.lineTo(x + 4, y + 9); g.stroke();
      g.fillStyle = '#1e1e1e'; g.fillRect(x, y + 9, 8, 9);
      g.fillStyle = (row + i) % 2 ? '#3c3' : '#c33'; g.fillRect(x + 6, y + 11, 1, 1);
    }
  }
  function supply(g){
    [[6,46],[22,46],[12,34]].forEach(p => {
      g.fillStyle = '#e2e0d8'; g.fillRect(p[0], p[1], 18, 12);
      g.fillStyle = '#bdbbb3'; g.fillRect(p[0], p[1] + 9, 18, 3);
      g.fillStyle = '#7a7a7a'; g.fillRect(p[0] + 4, p[1] + 4, 10, 2);
    });
    g.fillStyle = '#8a5a2a'; g.fillRect(40, 44, 20, 20);
    g.fillStyle = '#a02020'; g.fillRect(40, 50, 20, 4);
    g.fillStyle = '#5a3a1a'; g.fillRect(40, 44, 20, 1); g.fillRect(40, 63, 20, 1);
  }
  function person(o){
    return function(g, r){
      g.fillStyle = '#17110c'; g.fillRect(22, 58, 8, 6); g.fillRect(34, 58, 8, 6);
      g.fillStyle = o.pants; g.fillRect(23, 40, 8, 18); g.fillRect(33, 40, 8, 18);
      g.fillStyle = o.jacket; g.fillRect(20, 22, 24, o.coat ? 34 : 20);
      g.fillRect(15, 23, 6, 17); g.fillRect(43, 23, 6, 17);
      if(o.bib){ g.fillStyle = o.pants; g.fillRect(25, 26, 14, 16); g.fillRect(26, 22, 2, 4); g.fillRect(36, 22, 2, 4); }
      g.fillStyle = o.skin; g.fillRect(15, 40, 6, 4); g.fillRect(43, 40, 6, 4);
      g.fillRect(29, 18, 6, 4); g.fillRect(26, 9, 12, 11);
      g.fillStyle = '#111'; g.fillRect(28, 13, 2, 1);
      if(o.oneEye){ g.fillStyle = '#946448'; g.fillRect(34, 13, 2, 1); g.fillStyle = '#6a4632'; g.fillRect(34, 14, 2, 1); g.fillStyle = '#cc9c7a'; g.fillRect(35, 11, 1, 2); g.fillRect(36, 15, 1, 2); }
      else g.fillRect(34, 13, 2, 1);
      g.fillStyle = '#5a3a2a'; g.fillRect(30, 17, 4, 1);
      if(o.stubble){ speck(g, r, 27, 15, 10, 5, 14, ['#8a8a86', '#6a6a66']); }
      if(o.fedora){
        g.fillStyle = o.hat; g.fillRect(26, 3, 12, 6); g.fillRect(22, 8, 20, 2);
        g.fillStyle = '#1a120a'; g.fillRect(26, 7, 12, 1);
      } else {
        g.fillStyle = o.hat; g.fillRect(25, 5, 14, 5); g.fillRect(23, 9, 18, 2);
        g.fillStyle = '#cfcfc0'; g.fillRect(30, 5, 4, 3); g.fillStyle = '#fff2b0'; g.fillRect(31, 6, 2, 1);
      }
      speck(g, r, 20, 22, 24, 34, 18, ['rgba(0,0,0,.35)']);
    };
  }
  function manBack(o){
    return function(g, r){
      g.fillStyle = '#17110c'; g.fillRect(22, 58, 8, 6); g.fillRect(34, 58, 8, 6);
      g.fillStyle = o.pants; g.fillRect(23, 40, 8, 18); g.fillRect(33, 40, 8, 18);
      const tw = o.slim ? 20 : 24, tx = 32 - tw/2;
      g.fillStyle = o.jacket; g.fillRect(tx, 22, tw, 20);
      g.fillRect(tx - 5, 23, 6, 17); g.fillRect(tx + tw - 1, 23, 6, 17);
      g.fillStyle = '#2a1e16'; g.fillRect(29, 18, 6, 4); g.fillRect(26, 10, 12, 10);
      g.fillStyle = o.hat; g.fillRect(25, 5, 14, 6); g.fillRect(23, 10, 18, 2);
      line(g, [32, 9, 33, 24, 34, 40], '#0a0a0a', 1);
      g.fillStyle = '#1e1e1e'; g.fillRect(30, 39, 8, 6);
      g.fillStyle = 'rgba(200,116,46,.55)'; g.fillRect(tx + tw - 2, 22, 2, 20); g.fillRect(39, 40, 2, 18);
      const top = o.rootTop;
      for(let i = 0; i < o.roots; i++){
        const x0 = 18 + r()*28, x1 = 22 + r()*20, y1 = top + r()*10;
        g.lineCap = 'round';
        g.strokeStyle = '#1a0d06'; g.lineWidth = 2 + r()*2;
        g.beginPath(); g.moveTo(x0, 64); g.quadraticCurveTo((x0 + x1)/2 + (r() - 0.5)*14, (64 + y1)/2, x1, y1); g.stroke();
        g.strokeStyle = '#c8742e'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x0 + 1, 64); g.quadraticCurveTo((x0 + x1)/2 + 1, (64 + y1)/2, x1 + 1, y1); g.stroke();
      }
      if(o.hands){ line(g, [tx - 3, 40, tx - 8, 30, tx - 4, 22], '#1a0d06', 2); line(g, [tx + tw + 3, 40, tx + tw + 8, 30, tx + tw + 4, 22], '#1a0d06', 2); }
    };
  }
  function bucket(g){
    g.strokeStyle = '#8a8e93'; g.lineWidth = 1; g.beginPath(); g.arc(32, 47, 7, Math.PI, Math.PI*2); g.stroke();
    g.fillStyle = '#a7abb0'; g.fillRect(24, 48, 16, 16);
    g.fillStyle = '#d0d3d6'; g.fillRect(27, 49, 2, 14);
    g.fillStyle = '#7c8086'; g.fillRect(37, 48, 3, 16); g.fillRect(24, 55, 16, 1);
    g.fillStyle = '#8f9398'; g.fillRect(23, 46, 18, 3);
  }
  function car(g){
    g.fillStyle = '#7a6a26'; g.fillRect(2, 38, 60, 20);
    g.fillStyle = '#3a3420'; g.fillRect(4, 38, 56, 6);
    g.fillStyle = '#5a4e1c'; g.fillRect(2, 52, 60, 2);
    circle(g, 14, 58, 6, '#111'); circle(g, 14, 58, 2, '#555');
    circle(g, 50, 58, 6, '#111'); circle(g, 50, 58, 2, '#555');
    circle(g, 32, 49, 7, '#2a2a2a'); g.strokeStyle = '#000'; g.beginPath(); g.arc(32, 49, 4, 0, 6.28); g.stroke();
    g.fillStyle = '#ddd'; g.fillRect(4, 45, 3, 3);
  }
  function cutter(g){
    g.fillStyle = '#46525e'; g.fillRect(6, 46, 40, 14);
    g.fillStyle = '#5a6672'; g.fillRect(6, 46, 40, 2);
    g.fillStyle = '#7c7f84'; g.fillRect(40, 52, 24, 5);
    g.fillStyle = '#b0b2b6'; for(let x = 41; x < 64; x += 3){ g.fillRect(x, 51, 1, 1); g.fillRect(x, 57, 1, 1); }
    g.fillStyle = '#22262a'; g.fillRect(8, 60, 36, 4);
  }
  function light(g, r){
    const gr = g.createRadialGradient(32, 34, 1, 32, 34, 31);
    gr.addColorStop(0, '#fffef0'); gr.addColorStop(0.2, 'rgba(255,230,170,.95)');
    gr.addColorStop(0.5, 'rgba(255,170,80,.45)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    for(let i = 0; i < 5; i++){
      const x = 32 + (r() - 0.5)*20, y = 34 + (r() - 0.5)*20, rr = 6 + r()*8;
      const b = g.createRadialGradient(x, y, 0, x, y, rr);
      b.addColorStop(0, 'rgba(255,240,200,.9)'); b.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = b; g.fillRect(0, 0, 64, 64);
    }
  }
  function rootsHang(g, r){ tendrils(g, r, 64, 64, 14, '#2a160b', '#c06a2a', true); }
  function blocks(g){
    g.fillStyle = '#55554f'; g.fillRect(14, 44, 36, 20);
    for(let row = 0; row < 5; row++) for(let x = 14 + (row % 2 ? 0 : 4); x < 48; x += 9){
      g.fillStyle = '#8a8a84'; g.fillRect(x, 45 + row*4, 8, 3);
    }
    g.fillStyle = '#6a4a2a'; g.fillRect(12, 61, 40, 3);
    line(g, [22, 14, 42, 34], '#e8e8e0', 2); line(g, [42, 14, 22, 34], '#e8e8e0', 2);
  }

  /* ── tools (128x96, bottom of screen) ──────────────── */
  const GLOVE = '#7d6a48', GLOVE2 = '#5a4a30';
  function lampTool(g){
    g.fillStyle = GLOVE; g.fillRect(46, 82, 36, 14); g.fillStyle = GLOVE2; [52, 60, 68, 76].forEach(x => g.fillRect(x, 82, 1, 10));
    g.fillStyle = '#9a7a32'; g.fillRect(50, 72, 28, 12);
    g.fillStyle = '#c8a44a'; g.fillRect(50, 74, 28, 2); g.fillStyle = '#6a5222'; g.fillRect(50, 81, 28, 2);
    g.fillStyle = 'rgba(200,220,230,.18)'; g.fillRect(54, 48, 20, 24);
    g.fillStyle = '#cfe0e8'; g.fillRect(54, 48, 1, 24); g.fillRect(73, 48, 1, 24);
    g.fillStyle = '#9a7a32'; g.fillRect(51, 46, 3, 27); g.fillRect(74, 46, 3, 27);
    g.fillStyle = '#6a6a64'; g.fillRect(55, 28, 18, 19);
    g.fillStyle = '#4a4a46'; for(let y = 29; y < 47; y += 2) g.fillRect(55, y, 18, 1);
    g.fillStyle = '#9a7a32'; g.fillRect(53, 24, 22, 5);
    g.strokeStyle = '#9a7a32'; g.lineWidth = 2; g.beginPath(); g.arc(64, 18, 5, 0, Math.PI*2); g.stroke();
  }
  function cutterTool(k){
    return function(g){
      g.fillStyle = '#686b70';
      g.beginPath(); g.moveTo(36, 84); g.lineTo(92, 84); g.lineTo(74, 22); g.lineTo(54, 22); g.closePath(); g.fill();
      g.fillStyle = '#2e3034';
      g.beginPath(); g.moveTo(48, 80); g.lineTo(80, 80); g.lineTo(70, 30); g.lineTo(58, 30); g.closePath(); g.fill();
      g.fillStyle = '#b0b2b6';
      for(let t = (k ? 0.04 : 0); t < 1; t += 0.08){
        g.fillRect(36 + (54 - 36)*t - 2, 84 + (22 - 84)*t, 3, 3);
        g.fillRect(92 + (74 - 92)*t - 1, 84 + (22 - 84)*t, 3, 3);
      }
      g.fillStyle = '#3a4048'; g.fillRect(10, 80, 108, 16);
      g.fillStyle = '#555c66'; g.fillRect(10, 80, 108, 2);
      g.fillStyle = '#222'; [20, 40, 88, 108].forEach(x => circle(g, x, 88, 2, '#666'));
    };
  }
  function drillTool(k){
    return function(g){
      g.fillStyle = '#8d8d88';
      g.beginPath(); g.moveTo(60, 64); g.lineTo(68, 64); g.lineTo(66, 8); g.lineTo(62, 8); g.closePath(); g.fill();
      g.strokeStyle = '#55554f'; g.lineWidth = 2;
      for(let y = 10 + (k ? 3 : 0); y < 62; y += 6){ g.beginPath(); g.moveTo(59, y); g.lineTo(69, y + 4); g.stroke(); }
      g.fillStyle = '#4a5360'; g.fillRect(34, 62, 60, 34);
      g.fillStyle = '#5c6674'; g.fillRect(34, 62, 60, 3);
      g.fillStyle = '#2a2f36'; for(let x = 40; x < 90; x += 6) g.fillRect(x, 70, 2, 14);
      g.fillStyle = GLOVE; g.fillRect(20, 74, 16, 22); g.fillRect(92, 74, 16, 22);
      g.fillStyle = GLOVE2; g.fillRect(20, 80, 16, 1); g.fillRect(92, 80, 16, 1);
    };
  }
  function powderTool(k){
    return function(g){
      const dy = k ? -20 : 0, s = k ? 0.75 : 1;
      g.fillStyle = '#cdb88c'; g.fillRect(40, 40 + dy, 12*s, 44*s);
      g.fillStyle = '#9a2222'; g.fillRect(40, 50 + dy, 12*s, 4);
      g.fillStyle = '#b8a070'; g.fillRect(40, 40 + dy, 12*s, 2);
      g.fillStyle = GLOVE; g.fillRect(30, 78 + dy/2, 30, 18 - dy/2);
      line(g, [104, 96, k ? 54 : 78, k ? 24 : 30], '#8a6a3c', 5);
      g.fillStyle = GLOVE; g.fillRect(88, 76, 22, 20);
    };
  }
  function shovelTool(k){
    return function(g){
      const dy = k ? -14 : 0;
      line(g, [112, 96, 80, 58 + dy], '#8a6a3c', 6);
      g.fillStyle = '#6a6a66';
      g.beginPath(); g.moveTo(40, 58 + dy); g.lineTo(88, 58 + dy); g.lineTo(96, 84 + dy); g.lineTo(32, 84 + dy); g.closePath(); g.fill();
      g.fillStyle = '#9a9a94'; g.fillRect(32, 83 + dy, 64, 2);
      if(k){ for(let i = 0; i < 12; i++){ g.fillStyle = i % 3 ? '#151519' : '#2a2a32'; g.fillRect(44 + (i*7) % 40, 50 + dy + (i % 3)*3, 6, 5); } }
      g.fillStyle = GLOVE; g.fillRect(96, 78, 20, 18);
    };
  }
  function dusterTool(k){
    return function(g){
      line(g, [124, 96, 108, 80, 74, 70], '#151515', 10);
      line(g, [74, 70, 60, 40], '#8a8a86', 6);
      g.fillStyle = '#5a5a56'; g.fillRect(70, 64, 8, 8);
      g.fillStyle = GLOVE; g.fillRect(64, 70, 22, 18);
      if(k) [[58,30,14],[48,24,10],[66,20,9],[54,14,7],[70,32,8]].forEach(c => circle(g, c[0], c[1], c[2], 'rgba(230,230,224,.85)'));
    };
  }

  /* ── status bar face (32x40) ───────────────────────── */
  function face(mode){
    return function(g, r){
      g.fillStyle = '#1a1612'; g.fillRect(0, 0, 32, 40);
      const skin = mode === 'root' ? '#d9a070' : '#c08a68';
      g.fillStyle = '#3a4a5a'; g.fillRect(8, 35, 16, 5);
      g.fillStyle = skin; g.fillRect(8, 13, 16, 18); g.fillRect(9, 31, 14, 4);
      g.fillStyle = '#2b2b2b'; g.fillRect(6, 4, 20, 8); g.fillRect(4, 10, 24, 3);
      g.fillStyle = '#bbb'; g.fillRect(13, 5, 6, 5); g.fillStyle = '#ffe9a8'; g.fillRect(14, 6, 4, 3);
      const dx = mode === 'look_left' ? -1 : mode === 'look_right' ? 1 : 0;
      const big = mode === 'scared';
      g.fillStyle = '#e8e2d6'; g.fillRect(10, 17, 5, big ? 4 : 3); g.fillRect(17, 17, 5, big ? 4 : 3);
      g.fillStyle = mode === 'root' ? '#ffcf80' : '#111';
      g.fillRect(12 + dx, 18, 2, big ? 2 : 2); g.fillRect(19 + dx, 18, 2, 2);
      g.fillStyle = '#5a3a28'; g.fillRect(10, 15, 5, 1); g.fillRect(17, 15, 5, 1);
      if(mode === 'scared'){ g.fillStyle = '#1a0a08'; g.fillRect(14, 26, 4, 4); }
      else if(mode === 'hurt'){ g.fillStyle = '#5a2a20'; g.fillRect(12, 27, 8, 1); g.fillRect(12, 26, 1, 1); g.fillRect(19, 26, 1, 1); }
      else { g.fillStyle = '#6a3a2a'; g.fillRect(13, 27, 6, 1); }
      if(mode === 'hurt'){ g.fillStyle = '#8a1a1a'; g.fillRect(9, 13, 2, 9); g.fillRect(10, 22, 1, 3); }
      if(mode === 'grimy' || mode === 'hurt') speck(g, r, 8, 13, 16, 22, 70, ['rgba(10,10,12,.75)', 'rgba(30,30,34,.6)']);
      if(mode === 'root'){ g.fillStyle = 'rgba(255,150,60,.18)'; g.fillRect(0, 20, 32, 20); }
    };
  }

  const DRAW = {
    walls: {
      coal:(g,r,w,h)=>coal(g,r,w,h,false),
      coal_cut:(g,r,w,h)=>{coal(g,r,w,h,false);kerf(g,r,w);},
      coal_drill:(g,r,w,h)=>{coal(g,r,w,h,false);kerf(g,r,w);holes(g);},
      coal_solid:(g,r,w,h)=>{coal(g,r,w,h,false);holes(g);},
      coal_warm:(g,r,w,h)=>coal(g,r,w,h,true),
      coal_warm_cut:(g,r,w,h)=>{coal(g,r,w,h,true);kerf(g,r,w);},
      coal_warm_drill:(g,r,w,h)=>{coal(g,r,w,h,true);kerf(g,r,w);holes(g);},
      coal_warm_solid:(g,r,w,h)=>{coal(g,r,w,h,true);holes(g);},
      coal_dust:(g,r,w,h)=>{coal(g,r,w,h,false);whiten(g,w,h,r,.72);},
      dust_glyph:(g,r,w,h)=>{coal(g,r,w,h,true);whiten(g,w,h,r,.74);glyph(g);},
      mark:(g,r,w,h)=>{coal(g,r,w,h,false);paint(g,r,h,false);},
      mark_dust:(g,r,w,h)=>{coal(g,r,w,h,false);whiten(g,w,h,r,.7);paint(g,r,h,true);},
      rubble, rubble_dust:(g,r,w,h)=>{rubble(g,r,w,h);whiten(g,w,h,r,.6);},
      rock, rock_dust:(g,r,w,h)=>{rock(g,r,w,h);whiten(g,w,h,r,.62);},
      block, portal, roots, crack
    },
    flats: {
      mud, floor_dust:floorDust, root_floor:rootFloor,
      ceil_shale:(g,r,w,h)=>ceilShale(g,r,w,h,false), ceil_dust:(g,r,w,h)=>ceilShale(g,r,w,h,true), root_ceil:rootCeil
    },
    sprites: {
      belt_0:belt(0), belt_1:belt(1), belt_2:belt(2), belt_3:belt(3), tail, charger, supply,
      luther: person({hat:'#1e1e1e', jacket:'#3b4a5e', pants:'#2f4a6e', skin:'#c08a68', bib:true}),
      ebward: person({hat:'#d8d4c4', jacket:'#5a4630', pants:'#3a3a3a', skin:'#b88462', oneEye:true}),
      harold: person({hat:'#3a2a1c', jacket:'#2e2e34', pants:'#24242a', skin:'#b88a6a', fedora:true, coat:true, stubble:true}),
      cecil:  manBack({jacket:'#4a4436', pants:'#2e2a22', hat:'#222', roots:7, rootTop:50}),
      doyle:  manBack({jacket:'#3e4a3a', pants:'#26302a', hat:'#333', roots:9, rootTop:44}),
      bobby:  manBack({jacket:'#5a3a2e', pants:'#2a2a30', hat:'#c8c4b4', roots:9, rootTop:42, slim:true, hands:true}),
      junior: manBack({jacket:'#2e3a4a', pants:'#222a34', hat:'#222', roots:13, rootTop:30}),
      bucket, car, cutter, light, roots_hang:rootsHang, blocks
    },
    tools: {
      lamp:lampTool, cutter_0:cutterTool(0), cutter_1:cutterTool(1), drill_0:drillTool(0), drill_1:drillTool(1),
      powder_0:powderTool(0), powder_1:powderTool(1), shovel_0:shovelTool(0), shovel_1:shovelTool(1),
      duster_0:dusterTool(0), duster_1:dusterTool(1)
    },
    face: {}
  };
  ['calm','look_left','look_right','grimy','scared','hurt','root'].forEach(m => DRAW.face[m] = face(m));

  function bake(sheet, name){
    const s = MineSheets.SHEETS[sheet];
    const c = document.createElement('canvas'); c.width = s.cw; c.height = s.ch;
    const g = c.getContext('2d');
    const fn = DRAW[sheet] && DRAW[sheet][name];
    if(fn) fn(g, rng(hash(sheet + ':' + name)), s.cw, s.ch);
    return c;
  }

  function glowOf(rule, R, G, B, A, i, x, y){
    switch(rule){
      case 'full':   return A[i] > 8 ? 1 : 0;
      case 'portal': return (x >= 7 && x < 57 && y >= 7) ? 1 : 0;
      case 'bright': { const l = (R[i]*0.3 + G[i]*0.59 + B[i]*0.11)/255; return l > 0.5 ? Math.min(1, (l - 0.5)*2.2) : 0; }
      case 'warm':   return (R[i] > 140 && B[i] < 110 && R[i] > G[i] + 30) ? Math.min(1, (R[i] - 120)/110) : 0;
      default:       return 0;
    }
  }

  function toTex(canvas, rule, glowCanvas){
    const w = canvas.width, h = canvas.height, n = w*h;
    const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const R = new Uint8Array(n), G = new Uint8Array(n), B = new Uint8Array(n), A = new Uint8Array(n);
    for(let i = 0; i < n; i++){ R[i] = d[i*4]; G[i] = d[i*4+1]; B[i] = d[i*4+2]; A[i] = d[i*4+3]; }
    let E = null;
    if(glowCanvas){
      const e = glowCanvas.getContext('2d').getImageData(0, 0, w, h).data;
      E = new Float32Array(n); for(let i = 0; i < n; i++) E[i] = (e[i*4]/255)*(e[i*4+3]/255);
    } else if(rule && rule !== 'none'){
      E = new Float32Array(n);
      for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = y*w + x; E[i] = glowOf(rule, R, G, B, A, i, x, y); }
    }
    return { R, G, B, A, E, w, h };
  }

  /* user = { 'walls:coal': canvas, 'walls_glow:crack': canvas, ... } */
  function build(user){
    user = user || {};
    const out = { tex:{}, tools:{}, face:{}, from:{} };
    for(const sheet in MineSheets.SHEETS){
      const s = MineSheets.SHEETS[sheet];
      s.cells.forEach(cell => {
        const name = cell[0], key = sheet + ':' + name;
        const c = user[key] || bake(sheet, name);
        out.from[key] = user[key] ? 'sheet' : 'built-in';
        if(s.kind === 'tool') out.tools[name] = c;
        else if(s.kind === 'face') out.face[name] = c;
        else out.tex[name] = toTex(c, cell[2], user[sheet + '_glow:' + name]);
      });
    }
    return out;
  }

  /* Flame inside the safety lamp. mode: normal | cap | tall | out */
  function flame(g, x, y, s, mode, gas, t){
    if(mode === 'out') return;
    const fl = 1 + Math.sin(t*23)*0.06 + Math.sin(t*7)*0.05;
    let h = (mode === 'tall' ? 19 : 6)*fl;
    g.fillStyle = 'rgba(255,200,90,.25)'; g.beginPath(); g.ellipse(x, y - h*s*0.5, 5*s, h*s*0.8, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = mode === 'tall' ? '#ffe9a0' : '#ffd060';
    g.beginPath(); g.moveTo(x - 2.5*s, y); g.quadraticCurveTo(x - 2.5*s, y - h*s*0.5, x, y - h*s); g.quadraticCurveTo(x + 2.5*s, y - h*s*0.5, x + 2.5*s, y); g.closePath(); g.fill();
    g.fillStyle = '#fff8e0'; g.fillRect(x - 0.5*s, y - h*s*0.6, 1*s, h*s*0.5);
    if(mode === 'cap'){
      const ch = Math.min(18, 4 + (gas - 1)*10)*s;
      g.fillStyle = 'rgba(90,140,255,.75)';
      g.beginPath(); g.moveTo(x - 3.5*s, y - h*s); g.lineTo(x, y - h*s - ch); g.lineTo(x + 3.5*s, y - h*s); g.closePath(); g.fill();
    }
  }

  return { bake, build, flame, DRAW, rng, hash };
})();
