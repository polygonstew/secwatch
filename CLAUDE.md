# SECWATCH: notes for Claude sessions

A static HTML/JS horror game: no build, no dependencies. Read `docs/HANDOFF.md` for the full state. This is the short version.

## Map
- `index.html`: terminal dashboard (badge login, mine maps, shift log). **Day 1 is `day1.html`.**
- `day1.html` … `day10.html`, `dream.html?night=N`: the original game (days + Night Shift card game).
- `mine.html` + `js/mine*.js` + `levels/*.json`: JOSEPH No. 1, the 1962 raycaster prequel.
- `control.html` + `js/control.js`: level and story editor. Windows launcher: `SECWATCH_CONTROL.bat`.
- `art/mine_sheets.html`, `art/day_outlines.html`: art grids and outlines; generated PNGs in `art/`.
- `js/swState.js`: the ONE shared save (`SW.find`, `SW.flag`, `SW.save`). Load it before any engine.
- `js/badges.js`: badge → page shortcuts. `js/artManifest.js`: every image slot per day.
- `docs/`: everything, explained. `secWatch_story_and_lore.md`: the story bible.

## Run / test
```sh
python3 -m http.server 8765        # pages must be served (fetch + canvas pixels)
NODE_PATH=$(npm root -g) node tools/smoke_test.js   # expect ALL OK
```

## Conventions
- Match the existing style: plain JS in an IIFE, `'use strict'`, two-space indent, a box-drawing header comment per file saying what it is and how it loads.
- No frameworks, no bundlers, no npm dependencies in the game. CDN fonts only (Google Fonts), with monospace fallback.
- Levels are written with `MineLevel.stringify` (one row, thing or action per line). Validate with `MineLevel.validate`.
- Mine rules live in code (`js/mineEngine.js`); story and maps live in `levels/*.json`. Prefer adding a trigger verb or zone field over hard-coding a story beat.
- Lore: the entity is not evil and doesn't hunt. No monsters. See "THE CORE TRUTH" in the story bible.
- The Joseph brothers (Luther and **Ebward**, spelled as the user wrote it) are the user's family. Keep them decent men in the story.
- `tools/gen_joseph_levels.js --write` overwrites `levels/`. The JSON is the source of truth now.
