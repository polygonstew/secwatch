# SECWATCH Control: the level and story editor

`control.html` edits the mine levels (`levels/*.json`). It's a map painter, a thing placer and a story scripter in one window, in the spirit of the old DOOM WAD editors. It saves plain JSON that you can also read and edit in any text editor.

## Opening it

**Windows:** double-click **`SECWATCH_CONTROL.bat`**.

1. It starts a small local web server in the `secwatch` folder. A minimised window called "SECWATCH server" appears; leave it open while you work.
2. It opens the editor in its own Microsoft Edge app window (no tabs, no address bar). Without Edge, it uses your default browser.
3. It needs Python. If the bat says Python is missing, install it from python.org and tick **"Add python.exe to PATH"**.

`SECWATCH_PLAY.bat` opens the game's dashboard the same way.

**Mac / Linux:** `./control.sh` (or `./control.sh index.html` to play).

**Install as an app:** in Edge or Chrome, open the editor and choose *Apps → Install SECWATCH Control*. You get a Start-menu entry and taskbar icon. The server still has to be running (run the bat first).

Why a server? Browsers won't let a page read the level files or your PNG art when it's opened by double-clicking the HTML file.

## The screen

```
┌ top bar: New · Open · Levels ▾ · Project folder · Save · Save as · ↶ ↷ · ▶ Playtest · ▶ from here ┐
│ modes │                 map                                        │   side panel   │
│ TILES │   wheel = zoom, middle-drag or Space-drag = pan            │  (changes with │
│ ...   │                                                            │    the mode)   │
└ status bar: tile under the mouse, zones, things, shortcuts ─────────────────────────┘
```

The top bar shows the level id and title, the file, ● when there are unsaved changes, and ✓ valid / ⚠ problems. Click ⚠ to see the problems.

## Saving: do this first

Click **Project folder…** and pick the `secwatch` folder (the one with `mine.html` in it). From then on:

- **Save** (Ctrl+S) writes straight into `levels/<id>.json`.
- New levels are added to `levels/index.json` automatically, so they show up on the dashboard and in **Levels ▾**.

Without a project folder, Save asks where to save (Chrome/Edge) or downloads the file (other browsers). Put downloaded files in `levels/` by hand.

The editor also keeps a draft in the browser, so if it closes it offers to restore your work next time.

## Modes

Keys `1`–`7` switch modes.

### 1 TILES
- Palette: **left-click** a swatch to set the left brush, **right-click** a swatch to set the right brush. On the map, the left and right mouse buttons paint with them.
- Tools: **P**encil, **R**ectangle (drag), **F**ill (flood), eyedropper (**I**).
- **Layer**: switch to *Rock dust*, then left paints dust and right removes it.
- Utilities: *Rock border*, *Dust all open*, *Clear dust*.
- Carve a mine with the `.` (open) brush through `c` (coal). Paint the drift mouth with `P` on the west edge. Use `H` for a line nobody may cut.

### 2 THINGS
- Pick a type and click the map to place it. It snaps to tile centres; hold **Shift** for free placement.
- Drag to move. **Del** deletes. The red arrow is the player start; drag it, and set its facing in the panel.
- The selected thing's panel: id (renaming updates the triggers that use it), label, solid, hidden, plus:
  - **Talk lines** for people, one per press of E. Write `LUTHER: text` to set the speaker.
  - **Pickup** text and counter for buckets.
  - **Glow radius** for the light.
  - **Build** settings for stopping spots.
- *+ trigger when near* and *+ trigger on E* make a story beat for this thing in one click.

### 3 ZONES
Drag a rectangle to make a zone (Shift-drag starts one inside another). Click a zone to edit it. Zones carry the rules: gas %, warm coal, anomaly (the lamp burns tall), no-mining message, root floor and ceiling, ambient glow, lamp drain, and drone. See `docs/LEVEL_FORMAT.md`.

### 4 STORY
This is the story creator. Each trigger is one beat: **WHEN** something happens, **IF** a condition holds, **DO** a list of steps.

- **+ Add a story beat…** offers ready-made beats:
  - narration when walking into an area (then drag the area on the map)
  - a character line when you get near someone
  - something on E
  - a counter reaching a number
  - a mining step in an area
  - level start
  - a timed card
  - ending the level at the drift mouth with a quota
- WHEN: pick the kind, then fill its fields. **Pick on map** lets you drag the area.
- IF: add conditions on counters (≥ or <) or flags. When IF fails, the **OTHERWISE** steps run.
- DO: steps run top to bottom. `say` (who + text), `card` (full-screen text) and `obj` (objective) have plain text boxes. Other steps are one line of JSON, and picking a verb fills in an example.
- **repeats**: lets the beat fire again (with a cooldown).
- **▶ test from here**: playtests starting right where this beat happens. For counter beats it pre-loads the counter.

### 5 SCRIPT
The whole level, read like a screenplay: the intro card, then every beat in order with its lines and cards. Click a beat to edit it.

### 6 LEVEL
id, title, date line, next level, the **intro card**, player start, starting tools and supplies, cap lamp, clock, belt, base gas, the HUD counter, and map size.

### 7 JSON
The raw file. Edit it and click **Apply**, or Copy it.

## Playtesting
- **▶ Playtest** (Ctrl+Enter) opens the level in the game in another window. Keep both windows open: edit, Playtest, repeat.
- **▶ from here**: click the map to choose where you start.
- The playtest doesn't need saving first; the editor hands the level over directly.

## Shortcuts
| key | |
|---|---|
| Ctrl+S / Ctrl+Shift+S | save / save as |
| Ctrl+Z, Ctrl+Y (or Ctrl+Shift+Z) | undo / redo (300 steps) |
| Ctrl+Enter | playtest |
| 1–7 | modes |
| P R F I | pencil, rectangle, fill, eyedropper (TILES) |
| Del | delete the selected thing, zone or trigger |
| Esc | cancel area pick or "from here" |
| wheel / middle-drag / Space-drag | zoom / pan |

## Making a new level, start to finish
1. **New**. You get a drift mouth and a block of coal.
2. TILES: carve entries and crosscuts with `.`. Dust near the portal.
3. THINGS: charger and supply by the portal, the belt `tail` in the main entry, and your people.
4. ZONES: a gas pocket somewhere to teach the lamp, and a warm/anomaly zone deep in.
5. LEVEL:
   - id `e1m3`, title, date
   - intro card
   - tools and supplies
   - HUD (e.g. TONS of 42)
   - next level (blank for the last)
6. STORY: a start beat with an objective, beats for places and people, and an end beat on the portal.
7. **Playtest**, fix, **Save**. It appears on the dashboard's mine maps.
8. To give it a badge shortcut, add a line to `js/badges.js`.
