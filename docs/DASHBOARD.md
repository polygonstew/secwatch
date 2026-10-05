# The SECWATCH terminal (dashboard)

`index.html` is the front door: a green-phosphor SECWATCH terminal. It boots, asks for an operator name and **badge number**, then opens a dashboard with:

- **MINE MAPS.** Blueprint survey maps of every level in `levels/index.json`. Hover for coordinates, tiles and zones; ENTER THE MINE plays the level. The roots stay *UNSURVEYED* until the save has `JOSEPH_NO1`; then they're drawn, along with the seal.
- **SHIFT LOG.** Every day and night in story order, plus the 1962 levels. Each has OPEN, and ▶ marks the last one you opened.
- **SITE INTEGRITY.** The four threat bars from the save (HARGROVE, LKCO, SYSTEM, EAST WALL), the evidence count, and the custodian and sealed flags.
- **FEEDS & IMAGES.** One thumbnail per image slot per day: real art, red outline for missing, dashed for a new slot. Links to the outline and sprite sheet pages.
- **SYSTEM.** Control panel, image outlines, sprite sheets, docs, new run, wipe save, log out.
- **Command line** at the bottom. Type `HELP`.

Day 1 moved to **`day1.html`**. Nothing else changed in the day pages.

## Badge registry

Any badge logs you in. These badges route straight to a page. The table lives in `js/badges.js`; add a line to add a shortcut.

| badge | goes to |
|---|---|
| `0001` – `0010` | Day 1 – Day 10 |
| `0101` `0102` `0103` | Night 1, 2, 3 (the Night Shift) |
| `1962` | the mine: E1M1 THE SHIFT |
| `0407` | the mine: E1M2 THE EAST HEADING |
| `0047` | Day 6 (David Hargrove's badge: *DEACTIVATED 03/16/91 · ACCESS GRANTED*) |
| `0088` | Day 7 (Earl Combs: *STATUS: ACTIVE*) |
| `7291` | Day 9 (the badge with EAST WALL 9) |

The boot screen hints at one: *LAST LOGIN ... BADGE #0088 03/11/83 07:14*.

Routing writes the operator name and badge into the save (`SW.save.name`, `SW.save.badge`) first, so the day you land on has them.

## Deep links
| URL | |
|---|---|
| `index.html?badge=0004` | routes immediately (good for testing and bookmarks) |
| `index.html?dash` | skips the login and opens the dashboard (the mine's ← SECWATCH link uses this) |

## Commands
`####` (a badge) · `DAY n` · `NIGHT n` · `MINE [1|2]` · `MAP n` · `STATUS` · `LOG` · `REGISTRY` · `CONTROL` · `OUTLINES` · `SHEETS` · `NEWRUN` · `LOGOUT` · `CLS` · `HELP`

## Notes
- The mine maps need the folder served over http (the bats do this). Over `file://` the panel says the archive is offline, and everything else works.
- `NEW RUN` is `SW.newRun()`: it keeps the name and clears bars, evidence and flags. `WIPE SAVE` is `SW.reset()`.
