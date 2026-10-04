# Handoff: where the project stands

Read this first if you're picking SECWATCH up in a new session (human or Claude). `CLAUDE.md` in the root has the short version.

## What SECWATCH is
A browser horror game set in Letcher County, KY:
- **Days 1–10** (1994 / 1983) are text-command terminal days.
- **The Night Shift** is a card game played between days.
- **JOSEPH No. 1** is a 1962 prequel: a Wolfenstein-style coal mine that ends in the roots.

Everything is static HTML/JS: no build step and no dependencies. It runs from any web server or GitHub Pages. The full story bible is `secWatch_story_and_lore.md`. The 1962 prequel's research and premise are in `PREQUEL_1962_JOSEPH_NO1.md`.

## Built in the 2026-10 session
| piece | entry point | docs |
|---|---|---|
| 1962 mine raycaster (data-driven) | `mine.html` | `MINE_ENGINE.md` |
| Level files ("WADs"): E1M1 THE SHIFT, E1M2 THE EAST HEADING | `levels/` | `LEVEL_FORMAT.md` |
| Level and story editor | `control.html` + `SECWATCH_CONTROL.bat` | `EDITOR.md` |
| Sprite sheet grid system: templates, reference, checker, preview | `art/mine_sheets.html`, `art/mine/` | `ART_PIPELINE.md` |
| Per-day image outlines + manifest | `art/day_outlines.html`, `art/days/`, `js/artManifest.js` | `ART_PIPELINE.md` |
| Terminal dashboard with badge skip and mine maps | `index.html`, `js/badges.js` | `DASHBOARD.md` |
| Smoke test | `tools/smoke_test.js` | below |
| Level generator (how the levels were first made) | `tools/gen_joseph_levels.js` | header comment |

**Day 1 moved from `index.html` to `day1.html`.** `index.html` is now the dashboard. Nothing linked to `index.html` before, so no day page needed changing.

## Decisions
- **Web, not Godot.** The user offered Godot "if you need a thicker structure". SECWATCH is already static web, and keeping the mine and editor in the same stack means one folder, one save (`js/swState.js`), and it runs anywhere. The sister repo `the-pallid-mask` is the Godot project.
- **The editor is a web page plus a .bat**, not an Electron app. It needs zero installs beyond Python (for the local server), and Edge's `--app` window makes it feel like a desktop app. It's also installable as a PWA (`control.webmanifest`).
- **Levels are data, rules are code.** The mining cycle, gas, dust and lighting live in `js/mineEngine.js`. Story, maps, people and zones live in the level JSON, so the editor can change all of it.
- **The entity is not a monster.** Following the story bible ("It is not evil... It does not want"), the mine has no enemies. The hazards are mining hazards (gas, float dust, shots, the lamp dying). The horror is the warm parting, the tall flame, the dust lines, the heading nobody drove, the crack, and four men standing in the roots who "understand now".

## Story canon this session added (check with the user)
- **The 1962 operation** (Day 7 mentions it) is the Joseph brothers' drift, **Joseph No. 1**, Fire Clay seam, on a Hargrove lease with Harold Combs' paint line.
- **The four men:** Cecil Ison, Doyle Fields, Bobby Mullins (19), Junior Holbrook. The player *finds* them in the roots but can't bring them out. The county report says *MEN RECOVERED: none*. That keeps Day 7's "never found" true on paper.
- **The east heading drove itself.** Nobody on the crew cut past the line. This protects the Joseph brothers in the story: the user's grandfather and great-uncle are the "legend".
- Harold Combs writes the sealing report with his name redacted, which is Day 7's "unnamed expert". The seal: three block stoppings at crosscut 18, scratched *4-7-62* plus four sets of initials.
- **Arvel** (crew member who copied the dust lines into his tally book) is suggested as the Threshold Society member's uncle. He's in the prequel doc but not in the game yet.
- **From the family:** Eb lost his left eye in a lumber accident at twelve. **Uncle Joe**, the brothers' uncle, "could show you" things and put a cow on the second floor of a barn. He exists only in the brothers' E1M1 talk lines. Rules are in the prequel doc's "The Joseph family" note.

## Open questions for the user
1. **"Ebward" or "Edward" Joseph?** Answered: Ebward, and he went by **Eb**. Full name on the title, intro and ending cards and his facing label; EB / Eb in speaker tags and narration.
2. **Lore bug (fixed):** Day 7 now says the 1962 expert is Harold, Earl's *father* (James Combs died in 1948).
3. Real Joseph family details (mine names, places, dates) would replace the invented ones. None were found in public records.
5. **Answered:** it was Eb's left eye, and the uncle was Joe.
7. **Continuity fixed in this pass:** Day 6's letter (and the bible) now name Thomas Combs, not a Hargrove ancestor, as the man who found the wall. Day 8's 1962 entries are the four named men plus the section foreman, so the count stays 41.
4. Should Day 3 / Day 7 show the new `img/day3_1962_report.png` (the sealing report)? There's a slot for it in the manifest.

## Next steps that would help
- **Art:** paint the sprite sheets (`art/mine/templates`), and the `missing` day images first. Those are broken today: `cam1_d2`, `cam6_d2`, `cam9_d2`, `hargrove_photograph`, `cam9_1983`, `cam9_earl_walking`, `camX.gif`, and the gif variants of some cams.
- **Hook new art:** each `new` slot in `js/artManifest.js` names the page/engine where it would be shown (`hook`).
- **Night Shift: claims.** A full proposal (cards, rules, Earl's night as a line that passes to you, how claims carry between nights, no guns) is at the end of `DESIGN_NIGHTSHIFT.md`, with a build plan. Not built; the text pass and the 1962 save fix are done.
- **Night Shift card for the mine:** add a card in `js/dreamData.js` unlocked by evidence `JOSEPH_NO1`. `SW.find` already records it.
- **More mine levels:** E1M3 could be Harold's 1971 last walk, or Earl's 1982 strip cut opening the old drift from above. Use the editor.
- **Day pages → dashboard:** day pages don't link back to `index.html`. A small "SECWATCH" corner link (like `mine.html` has) would help.

## Testing
```sh
cd secwatch
python3 -m http.server 8765 &
NODE_PATH=$(npm root -g) node tools/smoke_test.js
```
It plays a full mining cycle, plays E1M2 to the ending, opens the editor and playtests from it, logs into the dashboard and follows badge routes, and loads both art pages. Expect `ALL OK`. Screenshots go to `tools/out/` (git-ignored).

Quick manual check: `SECWATCH_PLAY.bat` → badge `1962` → play.

## Re-exporting generated PNGs
The template, reference and outline PNGs in `art/` are rendered by the art pages. To regenerate them after changing `js/mineSheets.js`, `js/mineArt.js` or `js/artManifest.js`:

```js
// node, with Playwright and the folder served on :8765
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('http://localhost:8765/art/mine_sheets.html'); await p.waitForTimeout(800);
  const s = await p.evaluate(() => Object.fromEntries(Object.entries(SHEET_EXPORT).map(([k, v]) =>
    [k, { t: v.template.toDataURL(), r: v.reference.toDataURL(), g: v.glow && v.glow.toDataURL() }])));
  const w = (f, d) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  for(const k in s){ w(`art/mine/templates/${k}.png`, s[k].t); w(`art/mine/reference/${k}.png`, s[k].r);
    if(s[k].g){ w(`art/mine/templates/${k}_glow.png`, s[k].t); w(`art/mine/reference/${k}_glow.png`, s[k].g); } }
  await p.goto('http://localhost:8765/art/day_outlines.html'); await p.waitForFunction(() => window.OUTLINES_DONE);
  const o = await p.evaluate(() => OUTLINES.map(x => ({ d: x.day, n: x.name, u: x.canvas.toDataURL() })));
  for(const x of o){ if(x.n === 'walls.png') continue;
    const dir = 'art/days/' + (/^\d+$/.test(x.d) ? 'day' + x.d.padStart(2, '0') : x.d === 'N' ? 'nights' : 'mine1962');
    fs.mkdirSync(dir, { recursive: true }); w(dir + '/' + x.n, x.u); }
  await b.close();
})();
```

## Gotchas
- **Serve the folder.** Over `file://`, levels can't be fetched and image pixels can't be read. The bats run a server on port 8777.
- **One save.** `js/swState.js` is the single save (`localStorage.secwatch_save`), and it syncs the old per-day keys. The mine writes `JOSEPH_NO1` and `sealed_1962` to it.
- **Level files are formatted** by `MineLevel.stringify` (one tile row, thing or action per line). Keep that format for clean diffs. The editor writes it.
- **Don't hand-edit `levels/` with the generator:** `tools/gen_joseph_levels.js --write` overwrites them.
- Google Fonts are optional: everything falls back to monospace offline.
