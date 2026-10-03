/* ════════════════════════════════════════════════════════
   SECWATCH smoke test  (tools/smoke_test.js)

   Plays the important paths in a headless browser and fails loudly
   if anything throws. Needs Node + Playwright and a local server.

     cd secwatch
     python3 -m http.server 8765 &
     node tools/smoke_test.js            (or: NODE_PATH=$(npm root -g) node ...)

   Optional: BASE=http://localhost:8777 node tools/smoke_test.js
   Screenshots land in tools/out/ (git-ignored).
════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive:true });
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if(!cond) failed++; };
const IGNORE = /404|CERT|net::ERR/;

async function page(b, errs){
  const ctx = await b.newContext({ viewport:{ width:1280, height:800 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if(m.type() === 'error' && !IGNORE.test(m.text())) errs.push(m.text()); });
  p.on('dialog', d => d.dismiss());
  return { ctx, p };
}
const adv = async p => { for(let i = 0; i < 2; i++){ await p.keyboard.press('Space'); await p.waitForTimeout(200); } };

(async () => {
  const b = await chromium.launch();

  console.log('MINE e1m1: the mining cycle');
  { const errs = []; const { p } = await page(b, errs);
    await p.goto(BASE + '/mine.html'); await p.waitForTimeout(700);
    await adv(p); await p.waitForTimeout(500); await adv(p); await p.waitForTimeout(800);
    const key = async (k, w) => { await p.keyboard.press(k); await p.waitForTimeout(w || 200); };
    await p.evaluate(() => { MINE.P.x = 14.5; MINE.P.y = 12.5; MINE.P.a = 0; });
    await key('Digit2'); await key('Space', 2200);
    await key('Digit3'); await key('Space', 1800);
    await key('Digit1'); await key('Space', 300);
    await key('Digit4'); await key('Space', 200);
    await p.evaluate(() => { MINE.P.x = 9.5; }); await p.waitForTimeout(3800);
    await p.evaluate(() => { MINE.P.x = 14.5; MINE.P.a = 0; });
    await key('Digit5'); for(let i = 0; i < 3; i++) await key('Space', 900);
    await p.evaluate(() => { MINE.P.x = 12.6; MINE.P.a = 0; }); await key('KeyE', 400);
    const s = await p.evaluate(() => ({ tons: MINE.S.counters.tons, hp: MINE.S.hp }));
    ok(s.tons === 21, 'cut/drill/shoot/load/dump gives 21 tons (got ' + s.tons + ')');
    ok(s.hp === 100, 'player unhurt');
    await p.screenshot({ path: path.join(OUT, 'mine_e1m1.png') });
    ok(!errs.length, 'no errors ' + errs.join(' | '));
  }

  console.log('MINE e1m2: the story to the end');
  { const errs = []; const { p } = await page(b, errs);
    await p.goto(BASE + '/mine.html?level=levels/e1m2.json'); await p.waitForTimeout(700);
    await adv(p); await p.waitForTimeout(500); await adv(p); await p.waitForTimeout(800);
    const tp = (x, y, a) => p.evaluate(([x, y, a]) => { MINE.P.x = x; MINE.P.y = y; MINE.P.a = a; }, [x, y, a]);
    await tp(39.3, 12.5, 0); await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(300);
    for(const who of ['cecil', 'doyle', 'bobby', 'junior']){
      await p.evaluate(w => { const t = MINE.LV.things.find(o => o.type === w), L = MINE.LV;
        for(const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const x = Math.floor(t.x) + dx, y = Math.floor(t.y) + dy; if(L.tiles[y][x] === '.'){ MINE.P.x = x + 0.5; MINE.P.y = y + 0.5; return; } } }, who);
      await p.waitForTimeout(700);
    }
    await p.waitForTimeout(6000);
    ok(await p.evaluate(() => MINE.S.counters.found) === 4, 'found all four');
    await tp(20.5, 12.5, Math.PI); await p.waitForTimeout(600);
    ok(await p.evaluate(() => !!MINE.LV.things.find(t => t.type === 'harold')), 'crack closed, Harold at the drift mouth');
    await tp(3.6, 12.5, Math.PI); await p.waitForTimeout(400); await p.keyboard.press('KeyE'); await p.waitForTimeout(600);
    for(let i = 0; i < 3; i++){ await p.keyboard.press('Space'); await p.waitForTimeout(300); }
    for(const y of [10.5, 12.5, 14.5]){ await tp(17.4, y, 0); await p.waitForTimeout(200); await p.keyboard.press('KeyE'); await p.waitForTimeout(400); }
    ok(await p.evaluate(() => MINE.S.counters.sealed) === 3, 'three stoppings built');
    await p.waitForTimeout(4500);
    ok(await p.evaluate(() => MINE.S.ended), 'level ended');
    ok(await p.evaluate(() => SW.has('JOSEPH_NO1')), 'save has JOSEPH_NO1');
    ok(!errs.length, 'no errors ' + errs.join(' | '));
  }

  console.log('CONTROL panel');
  { const errs = []; const { ctx, p } = await page(b, errs);
    await p.goto(BASE + '/control.html'); await p.waitForTimeout(1500);
    ok(/e1m1/.test(await p.textContent('#fileLbl')), 'opens levels/e1m1.json');
    ok(/valid/.test(await p.textContent('#valid')), 'level validates');
    for(const m of ['things', 'zones', 'triggers', 'script', 'level', 'json', 'tiles']){ await p.click('#modes [data-m=' + m + ']'); await p.waitForTimeout(120); }
    const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#bPlay')]);
    await pop.waitForTimeout(1200); await adv(pop); await pop.waitForTimeout(600);
    ok(await pop.evaluate(() => MINE.LV && MINE.LV.id) === 'e1m1', 'playtest hands the level to the game');
    await p.screenshot({ path: path.join(OUT, 'control.png') });
    ok(!errs.length, 'no errors ' + errs.join(' | '));
  }

  console.log('DASHBOARD');
  { const errs = []; const { p } = await page(b, errs);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(300); await p.keyboard.press('Shift'); await p.waitForTimeout(200);
    await p.fill('#name', 'smoke'); await p.fill('#badge', '1234'); await p.click('#login button'); await p.waitForTimeout(1500);
    ok(await p.isVisible('#dash'), 'unknown badge opens the dashboard');
    ok((await p.locator('#mapTabs button').count()) >= 2, 'mine maps listed');
    await p.screenshot({ path: path.join(OUT, 'dashboard.png') });
    await p.fill('#cmdIn', '0004'); await p.press('#cmdIn', 'Enter'); await p.waitForTimeout(2000);
    ok(/day4\.html/.test(p.url()), 'badge 0004 routes to Day 4');
    await p.goto(BASE + '/index.html?badge=1962'); await p.waitForTimeout(2000);
    ok(/mine\.html/.test(p.url()), '?badge=1962 routes to the mine');
    ok(!errs.filter(e => !/day4|mine/.test(e)).length, 'no dashboard errors ' + errs.join(' | '));
  }

  console.log('ART pages');
  { const errs = []; const { p } = await page(b, errs);
    await p.goto(BASE + '/art/mine_sheets.html'); await p.waitForTimeout(800);
    ok(await p.evaluate(() => Object.keys(SHEET_EXPORT).length) === 5, 'five sprite sheets');
    await p.goto(BASE + '/art/day_outlines.html');
    await p.waitForFunction(() => window.OUTLINES_DONE, null, { timeout:30000 });
    ok(await p.evaluate(() => OUTLINES.length) > 40, 'day outlines drawn');
    ok(!errs.length, 'no errors ' + errs.join(' | '));
  }

  await b.close();
  console.log(failed ? '\n' + failed + ' FAILED' : '\nALL OK');
  process.exit(failed ? 1 : 0);
})();
