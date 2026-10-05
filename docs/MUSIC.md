# Music and sound

## Where sound lives today

| part of the game | music | sound effects | where |
|---|---|---|---|
| The Night Shift (`dream.html`) | **yes**: 6 layered loops | 7 one-shots | `audio/jam/`, played by `js/JAMengine.js` |
| Days 1–10 | none | phone rings, tapes, voicemail, static | `audio/*.mp3`, played by each day's engine |
| JOSEPH No. 1 (`mine.html`) | none | made live in code: belt, cutter, drill, shots, drone, breathing | `Snd` in `js/mineEngine.js` (no files) |
| The terminal (`index.html`) | none | none | |

Only the Night Shift reads music files, so this guide is about `audio/jam/`.

## How the Night Shift music works

`js/JAMengine.js` plays everything in sync on one clock. One **bar** in the engine is **6.7105 seconds**.

- **Base layer**, always on: `jam_tempo.mp3` and `jam_bg4x.mp3` (the background).
- **Action layer**: starts muted, fades in when a feed (a fight) starts and fades out when it's cleared. Files: `jam_bassline2x`, `jam_drone1-fx4x`, `jam_wot_4x`, `jam_zelda2x`.
- At the end of a night, all music fades out and `jam_won` or `jam_sucks_org` plays.

Each loop's length is read from the file: the engine rounds it to the nearest whole bar and loops exactly there. A file can be a hair long (MP3s add a few milliseconds), and the extra is cut off. Never make one short.

| file | layer | bars | exact length | when |
|---|---|---|---|---|
| `jam_tempo.mp3` | base | 1 | 6.7105 s | always |
| `jam_bg4x.mp3` | base | 4 | 26.842 s | always, at volume 0.5 |
| `jam_bassline2x.mp3` | action | 2 | 13.421 s | during feeds |
| `jam_drone1-fx4x.mp3` | action | 4 | 26.842 s | during feeds |
| `jam_wot_4x.mp3` | action | 4 | 26.842 s | during feeds |
| `jam_zelda2x.mp3` | action | 2 | 13.421 s | during feeds |
| `jam_drone1-d4x.mp3` | not played | 4 | 26.842 s | the old background; see below |
| `jam_tapp.mp3` | sfx | | | a card is played |
| `jam_atk.mp3` | sfx | | | you account for part of a Terror |
| `jam_dmg1/2/3.mp3` | sfx | | | it reaches you (one picked at random) |
| `jam_won.mp3` | sfx | | | you hold the night |
| `jam_sucks_org.mp3` | sfx | | | Lucidity 0 |

**The background, `jam_bg4x.mp3`** (2026-10-05) is a 2-bar phrase played twice, in D. It replaced the old drone `jam_drone1-d4x.mp3`, which is still in the folder. To bring the drone back, change `load('bg', 'audio/jam/jam_bg4x.mp3')` to `load('drone_base', 'audio/jam/jam_drone1-d4x.mp3')` in `JAMengine.init()`, and `this.playLoop('bg', this.baseGain, 0.5)` to `this.playLoop('drone_base', this.baseGain)`. Load both and play both to layer them.

The export came in 0.35% slow: 2 bars took 13.468 s instead of 13.421 s, so it drifted about 95 ms behind the other loops every 4 bars. It was time-stretched to the game's tempo with pitch kept (ffmpeg's `rubberband` filter), and the loop point was crossfaded over 50 ms. It plays at volume 0.5 (−6 dB) because it's mastered at about −14 LUFS; the other loops sit between −21 and −32.

In samples at 44.1 kHz: 1 bar = **295,933**, 2 bars = **591,866**, 4 bars = **1,183,732**. Audacity shows the length in samples if you set its selection toolbar to "samples".

## Replacing a track
1. Make it a whole number of bars at the same tempo: 1, 2, 4, 8… bars of 6.7105 s. The `2x`/`4x` in the names are only a habit now; the engine counts the bars itself.
2. Export as MP3 (44.1 kHz, 128–192 kbps is plenty) with **the same file name**. Keep loudness close to the old file; the background should sit under everything else. If yours is louder, change the volume, the third number in its `playLoop(...)` line (1 = as exported, 0.5 = −6 dB).
3. Put it in `audio/jam/`: either upload it on GitHub (open `audio/jam`, then **Add file → Upload files**; the same name replaces the old one) or copy it into your local folder and commit.
4. Test with badge `0101`, or open `dream.html?night=1`. Browsers only start sound after a click or key press, so click once. Music needs the site served: GitHub Pages or `SECWATCH_PLAY.bat`, not a double-clicked HTML file.

**Check the length before you upload.** A 4-bar loop must be 26.842 s (1,183,732 samples); 2 bars, 13.421 s. If your export is a little long or short, the tempo in your project is off: in Audacity, **Effect → Pitch and Tempo → Change Tempo** (keeps the pitch) fixes it. Set it to the length you need.

**A new tempo?** Change `barLength` at the top of `js/JAMengine.js` to the new bar length in seconds, and make every loop to that length.

**Hear a tick each time a loop restarts?** That's MP3 encoder silence at the start of the file. Export that loop as `.wav` with the same base name, then change its `.mp3` to `.wav` in `JAMengine.init()`.

**Adding a layer:** add a `load('name', 'audio/jam/file.mp3')` line and a `this.playLoop('name', this.baseGain)` (always on) or `this.actionGain` (during fights) line in `init()`.

## Music for the days, the mine or the terminal
None of these play music files yet. Each needs a small hook:
- **days:** a loop under the terminal screens
- **mine:** a low bed under the generated sounds, swapped per zone, for example quieter in the roots
- **terminal:** a hum on the login screen

Decide what you want where and say so. The engine and file layout above can be reused.

## Free tools on Windows 11
- **Audacity**: trim, loop-check and export MP3/WAV.
- **LMMS** or **BandLab** (in the browser): write the parts.
- **Reaper**: a full DAW; the evaluation is free.
