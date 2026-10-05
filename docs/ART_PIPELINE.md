# Art pipeline

There are two kinds of art in SECWATCH:

1. **Mine sprite sheets.** Pixel art for the 1962 raycaster (walls, floors, sprites, first-person tools, the status-bar face), painted into grid templates.
2. **Day images.** Camera feeds, documents and stills used by Days 1–10, the Night Shift and the mine's cards. Every slot has a labelled outline frame at its real size.

## 1. Mine sprite sheets

| file the game reads | cells | cell size | background |
|---|---|---|---|
| `img/mine/walls.png` | 20 | 64×64 | opaque |
| `img/mine/flats.png` | 6 (floors + roofs) | 64×64 | opaque |
| `img/mine/sprites.png` | 20 | 64×64 | transparent |
| `img/mine/tools.png` | 11 | 128×96 | transparent |
| `img/mine/face.png` | 7 | 32×40 | opaque |
| `img/mine/walls_glow.png`, `flats_glow.png`, `sprites_glow.png` | same grids | | optional: white = glows |

The layout is defined once in `js/mineSheets.js` (`SHEETS`). Each cell sits in a slot: a 12px label strip on top and a 1px frame round the art. **The game reads only the inside of the frame.** Labels, frames and gutters are never read, so you can paint straight onto a template.

### Starting points (already made)
- `art/mine/templates/*.png`: blank grids with names and magenta guides.
- `art/mine/reference/*.png`: the same grids filled with the built-in art, to paint over.

Both sets use the final file names. Copy one into `img/mine/`, paint, save.

### Rules
- **Magenta `#FF00FF` is a guide colour.** The loader treats it as transparent, so leave the guides in or paint over them.
  - Wall guides mark the flint clay parting (rows 26–33) and the kerf (row 54).
  - Sprite guides mark eye level (row 32) and the floor (row 63).
  - The lamp guide marks where the flame is drawn (64,68). Leave the lamp glass empty.
- **An empty cell keeps the built-in art.** Fill cells one at a time; the rest stays playable.
- Sprites: feet on the bottom row. A sprite is drawn as tall as a wall, so a person is about 58px tall and a bucket about 18px.
- Partial transparency is blended, so soft edges work (see the `light` sprite).
- Glow: white pixels in a `*_glow.png` cell light themselves and ignore the cap lamp. Without a glow sheet, each cell uses the rule listed in `js/mineSheets.js`: `warm` (orange pixels glow), `bright` (light pixels glow), `full`, `portal` or `none`.

### Checking and previewing
Open **`art/mine_sheets.html`** (from the dashboard: SYSTEM → SPRITE SHEETS).

- Each sheet shows its template, reference and glow reference, with download buttons and a table of what to paint in every cell.
- **Check a sheet you painted:** drop your PNGs on the page. It checks the size, outlines painted cells in green, and lists which cells are still built-in.
- **Preview in the game:** opens the mine using the dropped sheets, without copying anything into `img/mine/`.

### File:// note
Chrome blocks pages from reading image pixels when opened by double-click. Over `file://` the game silently uses built-in art. Run `SECWATCH_PLAY.bat` / `SECWATCH_CONTROL.bat` (or `python3 -m http.server`) to see your sheets.

### Adding a new cell
1. Add a row to the sheet's `cells` in `js/mineSheets.js`: `[name, what to paint, glow rule]`.
2. Add a built-in drawing for it in `js/mineArt.js` (`DRAW.<sheet>.<name>`), or leave it blank.
3. Use it: wall textures in `wallTex()` in `js/mineEngine.js`; sprites via a thing type in `js/mineLevel.js` (`THINGS`).
4. Re-export the templates: open `art/mine_sheets.html` and download, or run the export snippet in `docs/HANDOFF.md`.

## 2. Day images

`js/artManifest.js` lists every image slot, day by day (Days 1–10, the Night Shift, the 1962 mine). Each slot has:

- the file path and pixel size
- a kind: `cam`, `event`, `still`, `doc`, `photo`, `card`, `sheet`
- a title and **what to draw**
- where the game loads it (`used`) or where it would go (`hook`)

Open **`art/day_outlines.html`** (dashboard → IMAGE OUTLINES):

| tag | meaning |
|---|---|
| **have** | the file exists in `img/` |
| **missing** | the game already asks for it and it isn't there (it shows a broken image today) |
| **new** | a suggested slot; the page in `hook` needs a line of code to show it |

Every slot has an **outline frame** PNG at its real size, pre-made in `art/days/day01 … day10/`, `nights/` and `mine1962/`. A frame has a safe area, thirds, a centre mark, the title, the file name, the description and, for camera feeds, the 4:3 crop and where the timestamp goes. Paint over it or use it as a layer, then save the finished image at the slot's `file` path.

Camera feeds follow the STYLE LOCK in `md/SECWATCH_shotlist.md`: B&W CCTV, 1992, grain and scanlines, timestamp lower right.

### Adding a slot
Add an entry to the right day in `js/artManifest.js`. The outline page and the dashboard's FEEDS & IMAGES strip pick it up. Hooking a `new` slot into a day page is a small code change in that day's engine (see `hook`).

### Re-exporting outlines and templates (for maintainers)
Both pages expose their canvases (`window.SHEET_EXPORT`, `window.OUTLINES`). `docs/HANDOFF.md` has the Playwright snippet that writes them to `art/`.
