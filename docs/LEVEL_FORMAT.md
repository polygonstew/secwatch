# Level format ("WAD")

A level of the 1962 mine is one JSON file in `levels/`. `mine.html` plays it, `control.html` edits it, and `index.html` draws its map.

Shared code: `js/mineLevel.js` (tile table, thing types, trigger catalogue, validator, pretty-printer).

`levels/index.json` lists the levels in order. The editor's "Project folder" save keeps it up to date.

```json
{
  "format": "joseph-wad/1",
  "id": "e1m1",
  "title": "THE SHIFT",
  "when": "FRIDAY, APRIL 6, 1962",
  "w": 64, "h": 25,
  "player": {"x":1.6, "y":12.5, "a":0},
  "start":  { ... },
  "hud":    {"label":"TONS", "counter":"tons", "of":63},
  "rules":  {"gasBase":0.25},
  "next":   "levels/e1m2.json",
  "intro":  ["card", "lines"],
  "zones":  [ ... ],
  "things": [ ... ],
  "triggers": [ ... ],
  "tiles":  ["####...", ...],
  "dust":   ["..**...", ...]
}
```

Coordinates are in tiles. `x` runs east and `y` runs south, with (0,0) at the top-left. A thing at `x:12.5, y:10.5` sits in the centre of tile (12,10). Angles are radians: `0` is east, `1.5708` south, `3.1416` west, `-1.5708` north.

## tiles and dust

`tiles` holds `h` strings, each `w` characters long:

| char | tile | notes |
|---|---|---|
| `.` | open | walkable, mined out |
| `#` | rock | boundary, can't be mined |
| `c` | coal | the player can mine it |
| `u` | coal, undercut | the kerf is cut; drill next |
| `d` | coal, drilled | ready for powder |
| `s` | coal, drilled off the solid | shoots, but makes slack and dust |
| `r` | rubble (shot coal) | load it out with the shovel, 3 scoops |
| `B` | block stopping | the seal |
| `P` | portal | daylight; press E on it to trigger `usetile` with tile `P` |
| `R` | roots | wall in the roots |
| `X` | crack | press E on it to trigger `usetile` with tile `X` |
| `H` | Combs line | painted coal; the cutter refuses it |

`dust` uses the same grid: `*` marks a tile that is rock dusted at the start. Dusted coal in a `warm` zone shows the glyph.

## player, start, hud, rules

```json
"player": {"x":1.6, "y":12.5, "a":0},
"start": {
  "tools": [1,2,3,4,5,6],        // 1 lamp 2 cutter 3 drill 4 powder 5 shovel 6 duster
  "toolsOffSay": "Not today.",   // said when a missing tool is picked
  "powder": 4, "bags": 6,        // supplies (the supply thing refills to these)
  "battery": 100, "drain": 0.1,  // cap lamp %, drain per second
  "clock": 420,                  // minutes after midnight (420 = 7:00 A.M.)
  "quota": 63,                   // informational; HUD + triggers do the work
  "belt": {"on":true, "y":12, "fromX":1},   // belt drawn from fromX to the tail thing
  "counters": {}                 // starting counters, e.g. {"tons":21}
},
"hud":   {"label":"TONS", "counter":"tons", "of":63},   // left HUD panel
"rules": {"gasBase":0.25}        // % methane everywhere before zones add to it
```

Built-in counters: `tons` (dumped at the belt tail), `found`, `sealed`. Any other name you use in `add` or `counter` is created on first use.

## zones

Rectangles of rules. Bounds are inclusive tiles. Later zones override `floor`, `ceil`, `ambient`, `drain` and `drone`; `gas` adds up.

| field | effect |
|---|---|
| `name` | label in the editor and the dashboard map |
| `x0,y0,x1,y1` | the rectangle |
| `warm` | coal textures use the warm parting; dusted coal shows the glyph |
| `anomaly` | lamp burns tall with no gas reading (`??`); shots never ignite |
| `gas` | % methane added (≥ 1.0 puts a blue cap on the flame and can ignite) |
| `nomine` | the cutter, drill and powder refuse here; this is the message shown |
| `nomineWho` | who says the `nomine` line |
| `floor` / `ceil` | `mud`, `floor_dust`, `root_floor` / `ceil_shale`, `ceil_dust`, `root_ceil` |
| `ambient` | warm self-light 0–1 (the roots use 0.1) |
| `drain` | cap lamp drain multiplier |
| `drone` | low hum + breathing loudness 0–1 |

## things

```json
{"id":"luther", "type":"luther", "x":4.5, "y":11.5, "talk":[["LUTHER","Run me three places."]]}
```

| type | behaviour on E | default solid |
|---|---|---|
| `tail` | dumps the car (tons) or extends the belt up to 4 open tiles along its row | no |
| `charger` | lamp back to 100% | yes |
| `supply` | powder and bags back up to the start amounts | yes |
| `luther` `ebward` `harold` `cecil` `doyle` `bobby` `junior` | cycles through `talk` lines | yes |
| `bucket` | pickup: shows `say` (by `who`), adds 1 to `counter`, disappears | no |
| `blocks` | builds `build.tile` at its tile and adds 1 to `build.counter`; `build.side` = `west`/`east`/`any` says where you must stand | yes |
| `car` `cutter` | props | yes |
| `light` | glow source, `glow` = radius (default 6) | no |
| `roots_hang` | decoration | no |

Optional on any thing: `label` (the hint text), `solid` (overrides the default), `hidden`.

A `use` trigger on a thing replaces its talk lines.

## triggers (the story)

```json
{ "id":"portal",
  "when": {"on":"usetile", "tile":"P"},
  "if":   {"counter":"tons", "gte":63},
  "do":   [ {"end":{"next":"levels/e1m2.json", "card":["SATURDAY..."]}} ],
  "else": [ {"say":"Day ain't over.", "who":"LUTHER"} ] }
```

- A trigger fires **once**. Add `"once": false` to let it repeat, with `"cooldown"` in seconds (default 3).
- `if` is optional. It takes one condition or a list, and all must hold. When `if` fails and there's an `else`, the `else` runs instead (with a cooldown, so it can be tried again).
- Actions in `do` run in order. `wait` pauses only the script (the player keeps moving). `card` pauses the script and the game until it is closed.

### when

| `on` | fields | fires when |
|---|---|---|
| `start` | | the level begins (after the intro card) |
| `enter` | `x0 y0 x1 y1` | the player stands in the rectangle |
| `near` | `thing r` | the player is within `r` tiles of the thing (default 1.4) |
| `use` | `thing` | the player presses E on the thing |
| `usetile` | `tile` or `x y` | the player presses E facing that tile |
| `mine` | `step` + optional rect | a mining step finishes: `cut`, `drill`, `shot`, `load` (blank = any) |
| `dust` | optional rect | the player rock-dusts |
| `lamp` | optional rect | the player checks gas |
| `counter` | `name gte` | the counter reaches the value |
| `flag` | `name` | the flag is set |
| `timer` | `sec` | seconds since the level started |

### if

```json
{"flag":"harold_done"}         {"notflag":"harold_done"}
{"counter":"found", "gte":4}   {"counter":"found", "lt":4}
[ {"flag":"a"}, {"counter":"tons","gte":21} ]      // all must hold
```

### do (one verb per step)

| verb | example | does |
|---|---|---|
| `say` | `{"say":"Text", "who":"LUTHER"}` | message line; no `who` = narration |
| `card` | `{"card":["line","","line"]}` | full-screen typed card; the game pauses |
| `obj` | `{"obj":"FIND THE FOUR"}` | objective line |
| `set` | `{"set":"flag", "to":true}` | set a flag |
| `add` | `{"add":"found", "n":1}` | add to a counter |
| `tile` | `{"tile":"B", "x":18, "y":10, "x1":18, "y1":14, "onlyOpen":true}` | change tiles (never under the player) |
| `dust` | `{"dust":true, "x0":1, "y0":9, "x1":20, "y1":15}` | rock dust a rectangle |
| `spawn` | `{"spawn":{"id":"harold","type":"harold","x":2.5,"y":12.5}}` | add a thing |
| `remove` | `{"remove":"harold"}` | remove a thing |
| `move` | `{"move":"luther", "x":3.5, "y":12.5}` | move a thing |
| `give` | `{"give":{"powder":2, "bags":2, "battery":100, "hp":100}}` | powder/bags are added; battery/hp are set |
| `teleport` | `{"teleport":{"x":42.5, "y":12.5, "a":3.14}}` | move the player |
| `belt` | `{"belt":false}` | belt on or off |
| `shake` | `{"shake":0.6}` | screen shake (seconds) |
| `flash` | `{"flash":"#ffffff"}` | screen flash |
| `sound` | `{"sound":"boom"}` | `boom block blip scoop spray cut drill fuse breath` |
| `wait` | `{"wait":1.5}` | pause the script |
| `save` | `{"save":{"evidence":"JOSEPH_NO1", "flag":"sealed_1962"}}` | write to the SECWATCH save (`SW.find` / `SW.flag`) |
| `end` | `{"end":{"next":"levels/e1m2.json", "card":["..."]}}` | finish the level; without `next`, shows the final card with `buttons:[{"label","href"}]` |

## Recipes

**A line when the player walks somewhere:**

```json
{"id":"warmer", "when":{"on":"enter","x0":22,"y0":3,"x1":39,"y1":21}, "do":[{"say":"The air's warmer up here."}]}
```

**A character who says something the first time you reach them:**

```json
{"id":"meet_arvel", "when":{"on":"near","thing":"arvel","r":2}, "do":[{"say":"You seen the lines in the dust?","who":"ARVEL"}]}
```

**A door that only opens after a quota:** a `usetile` trigger with an `if` and an `else`, as in the `portal` example above.

**Count things, then react:** buckets with `"counter":"buckets"`, plus a trigger `{"on":"counter","name":"buckets","gte":4}`.

**Repeating hazard:** `"once":false, "cooldown":4`. See `light_touch` in `e1m2.json`, which sends the player back to the root entrance every time they touch the light.

## Checking a level

The editor validates as you work (✓ / ⚠ in the top bar). In Node:

```sh
node -e "const L=require('./js/mineLevel.js');console.log(L.validate(require('./levels/e1m1.json')))"
```
