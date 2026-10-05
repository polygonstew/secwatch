# JOSEPH No. 1: the mine engine

`mine.html` is a Wolfenstein 3D-style raycaster set in the 1962 drift. The rules of the mine are code (`js/mineEngine.js`). Everything story-side is data (`levels/*.json`, see `LEVEL_FORMAT.md`).

## Files
| file | what |
|---|---|
| `mine.html` | the page: canvas, card overlay, touch buttons |
| `js/mineEngine.js` | raycaster, lighting, mining rules, triggers, HUD, automap, audio |
| `js/mineLevel.js` | level format: tiles, thing types, trigger catalogue, validator, pretty-printer, map drawing |
| `js/mineSheets.js` | sprite sheet grid layout and loader |
| `js/mineArt.js` | built-in procedural art for every cell, plus the lamp flame |
| `levels/e1m1.json`, `levels/e1m2.json`, `levels/index.json` | the episode |

Load order in `mine.html`: `swState.js`, `mineSheets.js`, `mineArt.js`, `mineLevel.js`, `mineEngine.js`.

## URL options
| URL | |
|---|---|
| `mine.html` | starts at `levels/e1m1.json` |
| `mine.html?level=levels/e1m2.json` | starts on a given level |
| `mine.html?playtest=1` | the level the editor handed over (localStorage `mine_playtest`) |
| `mine.html?sheets=preview` | uses sheets dropped into `art/mine_sheets.html` (localStorage `mine_sheet_preview`) |

## Controls
WASD / arrows move · mouse or ←/→ turn (click to lock the mouse) · Shift runs · 1–6 tools · Space or left click uses the tool · E or right click interacts · Tab or M opens the mine map. Touch screens get on-screen buttons.

## The mining cycle (the rules)
| step | tool | tile change | dust | clock |
|---|---|---|---|---|
| undercut | 2 cutter | `c` → `u` | +12 | +20 min |
| drill | 3 drill | `u` → `d` (or `c` → `s`, *off the solid*) | +5 | +10 min |
| check gas | 1 lamp | reads gas at the facing tile | | |
| shoot | 4 powder | `d`/`s` → `r` after a 3.2s fuse | +20 (+40 off the solid) | +5 min |
| load | 5 shovel | 3 scoops per `r`; car holds 3 | +4 each | +5 min |
| dump | E at the belt tail | car → `tons` (7 per scoop, 5 if shot off the solid) | | |
| extend belt | E at the tail, empty car | tail moves up to 4 open tiles along its row | | +15 min |
| rock dust | 6 duster | dusts tiles in a 2.4 radius ahead | −34 | +5 min |

**Gas.** The base is `rules.gasBase` plus zone `gas`. At ≥ 1.0% the lamp grows a blue cap. Press E on a gassy face to hang a brattice curtain, which clears it after 12 seconds. In an `anomaly` zone the flame burns tall and yellow: no reading, and no ignition.

**Ignition.** Shooting a face at ≥ 1.0% gas:
- With the float dust meter at ≥ 60, it's an explosion and the level restarts.
- Below 60, there's a blue flash and damage, and the rock dust saved you.

Shooting off the solid with dust at ≥ 80 is also an explosion. Standing within 2.2 tiles of a shot costs 45 HP.

**Lamp.** Battery drains `start.drain`%/s × the zone's `drain`. The charger refills it. Under 20% it flickers.

Constants are at the top of `js/mineEngine.js`:

| constant | value | meaning |
|---|---|---|
| `SCOOP_T` | 7 | tons per scoop |
| `SLACK_T` | 5 | tons per scoop when shot off the solid |
| `CAR_MAX` | 3 | scoops the car holds |
| `DUST_GAS` | 60 | dust level at which gas ignition becomes an explosion |
| `DUST_SOLID` | 80 | dust level at which an off-the-solid shot explodes |

## Rendering
- An internal 320×160 view is scaled ×2 onto a 640×400 canvas. The bottom 80px is the status bar.
- DDA raycasting for walls, floor and ceiling casting per row, and billboard sprites with a z-buffer and soft alpha.
- Light per pixel = cap lamp (distance falloff × a cone towards screen centre × battery) + zone ambient + glow from `light` things (pulsing slowly: the breathing) + daylight near portal tiles + the texture's own glow.
- Float dust adds haze, lit by the lamp.

## Triggers at runtime
`fire(ev)` runs every frame with `ev = null` (enter / near / counter / flag / timer), and with an event object for start, use, usetile, mine, dust and lamp. Actions run through `run()`/`act()`. A `card` returns a promise, so scripts wait for it. Loading a new level stops any old script.

## Audio
WebAudio only, with no audio files: belt rumble (louder near the tail), cutter, drill, shot, scoop, duster hiss, steps, and a drone plus breathing that follow each zone's `drone` value.

## Debugging
In the browser console, `MINE` gives `MINE.S` (state), `MINE.LV` (live level), `MINE.P` (player), `MINE.startLevel(url)`, `MINE.fire(ev)` and `MINE.report` (which sheets loaded). For example, `MINE.P.x = 38.5` teleports the player.

## Saving into SECWATCH
The last beat of `e1m2` writes evidence `JOSEPH_NO1` and flag `sealed_1962` to the shared save (`js/swState.js`). The dashboard then shows the seal on the map and reveals the surveyed roots.
