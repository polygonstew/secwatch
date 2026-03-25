# SECWATCH v2.11b — VIDEO PRODUCTION BIBLE
## Veo 3 Edition  |  Hargrove Properties / LKCO-04

---

## HOW TO USE THIS DOCUMENT

Every prompt in here is written specifically for **Google Veo 3** via Google One AI Pro.
Veo 3 does not use a separate negative prompt field — instead, all the things you want
to avoid are woven directly into the prompt language using phrases like "no camera
movement," "avoid color," "do not include people," and "static mounted shot." This is
more reliable than a separate field anyway because Veo responds better to descriptive
exclusion than keyword lists.

Each section below contains:
- The story significance of the clip (why it matters to the player)
- Every shot you need for that camera or area
- The exact Veo 3 prompt, ready to paste
- FFmpeg command to run afterward

Generate each clip at whatever resolution Veo offers, then run it through FFmpeg.
The FFmpeg pass is not optional — it is what makes all the clips feel like the
same piece of hardware.

---

## VEO 3 GENERAL TIPS

- Set motion to the **lowest available setting**. Security cameras do not move.
  If the scene drifts or pans, regenerate. Stillness is the whole point.
- Generate **at least 3 variations** of each clip and pick the one with the
  most convincing grain and the least "AI smoothness."
- If a clip looks too clean or too modern, add the phrase
  **"worn magnetic tape, VHS tracking degradation, 1992 analog video"**
  to the end of the prompt and regenerate.
- Duration: aim for the longest clip Veo will give you. You can loop it in
  the game but you cannot lengthen it.
- Veo sometimes adds subtle camera drift even on static shots. If you cannot
  get a fully locked frame, a very slow barely-perceptible drift is acceptable
  on the exterior LKCO shots. On the interior Hargrove shots it should be
  completely still.

---

## FFMPEG MASTER RECIPE
Run every single clip through this after Veo generates it.
This is what unifies the look across all cameras.

```bash
ffmpeg -i INPUT.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.05:contrast=1.12:saturation=0.15, \
       hue=s=0.22:h=93, \
       noise=alls=16:allf=t+u" \
  -c:v libvp9 -b:v 150k -an OUTPUT.webm
```

Per-camera adjustments noted in each section below.
The two knobs you will turn most often:
- `noise=alls=N` — raise it for the LKCO outdoor cams, lower for Hargrove interiors
- `brightness=-0.N` — lower (darker) for the east wall, normal for lobbies

---
---

# SITE A — HARGROVE BUSINESS CENTER
### Interior Commercial Building, 400 Commerce Blvd

---

## CAM1 — LOBBY

### Story Significance
CAM1 is the first thing the player sees when they run SEC1.EXE. It establishes
the tone of the whole Hargrove side of the game — institutional, abandoned, but
ordinary. The coffee mug on the desk is important. It makes the building feel like
someone was just here, which makes the Badge Log entry from 02:17 AM feel more
wrong when the player finds it later. This camera should feel safe. It is the
baseline against which everything else is measured. Nothing happens here. That
is its entire job.

### Shots Needed
- [ ] `cam1_lobby_loop.webm` — idle loop, nothing moves

### Veo 3 Prompt — `cam1_lobby_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV fixed lens,
static mounted camera with absolutely no movement, wide angle looking down
at 35 degrees into an empty commercial office building lobby at night. Front
reception desk in center of frame, two vinyl chairs against the left wall,
hallway receding into darkness behind the desk, one coffee mug visible on the
desk corner, overhead fluorescent tube flickering very slightly, worn
institutional carpet near the entrance, drop ceiling tiles, red exit sign
glowing in the background. Heavy film grain, scan line interference visible
across the frame, slight barrel distortion from cheap wide angle lens, crushed
blacks, timestamp burned into lower right corner reading 01/15/94 23:51,
4 to 3 aspect ratio, no people, no color, no smooth modern video, no camera
movement whatsoever, worn magnetic tape, VHS tracking degradation, 1992
analog video. Hold perfectly still for the full duration.
```

**FFmpeg:** Use master recipe as-is. `noise=alls=13`

---

## CAM2 — FLOOR 1 EAST CORRIDOR

### Story Significance
CAM2 is where the player starts to feel the building's emptiness as something
more than just vacancy. Two of the three overhead lights are burned out. The
hallway goes somewhere the camera cannot see. The player will glance at this
feed and move on — but it sits in the back of their mind. When they later read
that Badge 0047 accessed the Floor 3 stairwell at 02:17, they will think about
this hallway. They will wonder what is at the dark end of it. You never show them.

### Shots Needed
- [ ] `cam2_fl1east_loop.webm` — idle loop, corridor receding into dark

### Veo 3 Prompt — `cam2_fl1east_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV, static
ceiling-mounted camera with no movement, wide angle looking down the full
length of an empty office building corridor at night. Camera mounted at
ceiling height looking along the hallway. Two of three overhead fluorescent
panels are burned out, only the nearest one gives dim light, the far end of
the corridor fades into complete darkness. Closed doors visible on the right
side only, painted cinder block wall on the left, linoleum tile floor with
scuff marks, a fire extinguisher mounted on the left wall midway down. Heavy
film grain, horizontal scan line interference, slight barrel distortion,
crushed blacks,  no on screen text, 4 to 3 ratio,
no people, no color, no camera movement, no smooth footage, the far end of
the hallway is not visible, something could be standing there in the darkness
and the camera would not show it, worn analog video, VHS degradation.
```

**FFmpeg:** `noise=alls=14` `brightness=-0.06`

---

## CAM3 — FLOOR 2 WEST CORRIDOR

### Story Significance
CAM3 is one floor up from CAM2 and slightly better lit, which makes it feel
paradoxically more unsettling — you can see more, which means there is more to
notice. The door that is slightly ajar is deliberate. The player's eye will go
straight to it. Is something in that room? You never answer that. The fire door
at the end with its push bar is the way out of this floor. The player knows,
because they read FLOOR2.DAT, that this is the floor directly beneath Floor 3.

### Shots Needed
- [ ] `cam3_fl2west_loop.webm` — idle loop, one door ajar

### Veo 3 Prompt — `cam3_fl2west_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV, static
ceiling-mounted wide angle camera with no movement, empty office building
corridor second floor at night. Both overhead fluorescent lights are working,
corridor is more visible than floors below. Three doors visible along the
left side, the second door is slightly ajar showing only darkness inside the
room, hallway dead-ends at a metal fire door with a push bar and an emergency
exit sign glowing above it. Industrial carpet runner worn thin down the center,
water stain on one ceiling tile. Heavy film grain, scan line interference,
slight barrel distortion, crushed blacks, timestamp 01/15/94 23:51 lower right,
4 to 3 ratio, no people, no color, no camera movement, the open door draws the
eye but reveals nothing, worn magnetic tape, analog video degradation 1992.
```

**FFmpeg:** Use master recipe as-is. `noise=alls=12`

---

## CAM4 — FLOOR 4 ELEVATOR LOBBY

### Story Significance
CAM4 exists primarily as contrast and misdirection. The player has been told
repeatedly not to go to Floor 3. Floor 4, one floor above it, is completely
normal — elevator doors, a bench, ordinary emptiness. It makes Floor 3 feel
even more like something was deliberately sealed rather than simply forgotten.
There is also a quiet detail worth planting: one of the elevator floor indicators
is stuck on 3. The player may or may not notice. If they do, it rewards attention.

### Shots Needed
- [ ] `cam4_fl4lobby_loop.webm` — idle loop, elevator bank, one indicator on 3

### Veo 3 Prompt — `cam4_fl4lobby_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV, static
wide angle ceiling camera with no movement, empty office building elevator
lobby on the fourth floor at night. Two elevator doors side by side in the
center of frame, both closed. Floor indicator panel above the left elevator
is dark and unlit, floor indicator above the right elevator is faintly lit
showing the number 3. Vinyl bench seating against the far wall, vinyl tile
floor, water stain on drop ceiling tile upper left corner. Emergency lighting
only, dim and harsh. Heavy film grain, scan line interference, barrel
distortion, crushed blacks, timestamp 01/15/94 23:51 lower right, 4 to 3
ratio, no people, no color, no camera movement, completely still, one elevator
indicator reads 3, worn magnetic tape, VHS degradation, 1992 analog video.
```

**FFmpeg:** Use master recipe as-is. `noise=alls=12`

---

## CAM5 — PARKING STRUCTURE

### Story Significance
CAM5 is the exterior breather — wide open space after all those narrow hallways.
It is the most normal clip in the game and intentionally so. It gives the player
a moment to relax before they either find the Badge Log or run SEC2.EXE. There
is also a practical story function: when the player eventually reads that Badge
0047 accessed Floor 3 at 02:17 AM, they will think about this parking lot. No car.
No person. How did they get in? That question has no answer anywhere in the files.

### Shots Needed
- [ ] `cam5_parking_loop.webm` — idle loop, empty lot, single lamp

### Veo 3 Prompt — `cam5_parking_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV, static
pole-mounted camera with no movement, wide angle looking across an empty
commercial parking lot at night. Single sodium vapor street lamp in the
center of frame casting a cone of light, concrete surface with faded painted
parking lines, chain link fence at far perimeter, weeds growing through
cracks in the pavement near the fence. A single moth or insect circling near
the lamp. Light ground fog settling low across the lot. No vehicles. No
people. Heavy film grain, scan line interference, slight barrel distortion,
crushed blacks, timestamp 01/15/94 23:51 lower right, 4 to 3 ratio, no color,
no camera movement, completely empty, worn magnetic tape, VHS tracking
degradation, 1992 analog video, hold completely still.
```

**FFmpeg:** `noise=alls=15` `brightness=-0.03`

---

## CAM6 — FLOOR 3 CORRIDOR  *(Event Clip — plays once, no loop)*

### Story Significance
This is the payoff for everything the player has read on the Hargrove side.
The Motion Log shows CAM6 went dark on 01/14 at 02:19 AM — yesterday. The
Badge Log shows Badge 0047 (D. Hargrove, deactivated 1991) used the Floor 3
stairwell at 02:17. Pellegrino's note says if the camera is gone, leave the
building. When this feed briefly comes back online, the player has already
read all of that. What they see — or almost see — at the far end of the hall
should confirm nothing and deny nothing. The signal dies before they can be
certain. That uncertainty is the entire point.

### Shots Needed
- [ ] `cam6_event.webm` — feed activates, something at the far end, signal dies

### Veo 3 Prompt — `cam6_event.webm`
```
Black and white security camera footage from 1992, analog CCTV, static
ceiling-mounted camera with no movement. Security camera feed activates
after a burst of static, corridor identical to the other floors but all the
doors along the hallway are standing open. At the very far end of the
corridor, barely visible in the low light, a person stands completely still
facing away from the camera wearing work clothes, not moving at all. The
figure is far enough away to be ambiguous, dark enough to be uncertain.
The camera holds on this for five seconds. Then heavy scan line tearing and
signal degradation, video rolling and breaking apart, feed cuts to static
snow and is lost. Heavy film grain throughout, horizontal interference lines,
crushed blacks, timestamp 01/15/94 02:19 burned in lower right, 4 to 3
ratio, no color, no camera movement, worn magnetic tape, severe analog
signal failure at the end, 1992 CCTV footage.
```

**FFmpeg:** `noise=alls=20` `brightness=-0.09`
Note: the signal-loss at the end can also be added as a second FFmpeg pass
with heavy noise and rolling effect if Veo does not generate it convincingly.

---
---

# SITE B — LKCO-04 LETCHER COUNTY STRIP SITE
### Eastern Kentucky, Letcher County, Played-Out Coal Operation

---

## CAM7 — TRAILER EXTERIOR

### Story Significance
The trailer is Earl Combs. Everything Earl had, everything Earl knew, everything
Earl left behind — it is all in that trailer. The player discovers this gradually
by reading FOREMAN.LOG and INCIDENT.RPT. The trailer exterior is the visual
anchor for all of that. When the idle loop plays, the door is closed. The site
looks abandoned, which it should be. But the player will have read that someone
called in a trespass complaint last week. And when the door event plays later —
the replay from 02:17 the previous night — the door is open. Nobody came down
the access road on CAM8. The question of how the door opened is never answered.
It does not need to be.

### Shots Needed
- [ ] `cam7_trailer_loop.webm` — idle loop, door closed, nothing moves
- [ ] `trailer_door_event.webm` — identical framing, door open, 6 seconds, no loop

### Veo 3 Prompt — `cam7_trailer_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV field unit,
static pole-mounted camera with no movement, looking at the exterior of an
old abandoned single-wide construction trailer at night in rural eastern
Kentucky. Weathered aluminum siding oxidized and streaked with rust stains,
door on the right side of the trailer is closed and latched, a single bare
lightbulb fixture above the door is burned out and dark, metal steps leading
up to the door, weeds and tall dead grass in the foreground, gravel and
packed clay ground around the base of the trailer. In the background the
base of a strip mine cut wall rises 60 feet, terraced exposed rock and earth
visible behind and above the trailer. Low ground fog near the base of the
cut wall. No people. Heavy film grain, horizontal scan line interference,
barrel distortion, crushed blacks, timestamp 01/15/94 23:51 lower right, 4
to 3 ratio, no color, no camera movement, the trailer door is completely
closed, worn magnetic tape, VHS degradation, 1992 analog video, completely
still, oppressive silence implied.
```

### Veo 3 Prompt — `trailer_door_event.webm`
```
Black and white security camera footage from 1992, analog CCTV field unit,
static pole-mounted camera with no movement, identical framing to earlier
footage of the same trailer. Weathered aluminum siding, metal steps, burned
out bulb above the door, weeds in foreground, strip mine cut wall rising in
background. The trailer door is open, hanging partially ajar, darkness
visible inside the trailer through the open door. Nothing is in the doorway.
Nothing is moving. No wind moves the door. No light comes from inside. The
door is simply open when it was not before. Hold for six seconds. No people
visible anywhere. Heavy film grain, scan line interference, crushed blacks,
timestamp 01/14/94 02:17 lower right, 4 to 3 ratio, no color, no camera
movement, worn magnetic tape, 1992 analog video, the door is open and
should not be.
```

**FFmpeg both clips:** `noise=alls=23` `brightness=-0.07` `saturation=0.08`
These are the oldest and most degraded cameras on the system. Push the noise.

---

## CAM8 — SITE PERIMETER / ACCESS ROAD

### Story Significance
CAM8 is the alibi camera. It is the camera that should show how someone got onto
the property. The access road is the only way in. When the player sees that the
trailer door was open at 02:17 the previous night — and then checks CAM8 to see
what came down that road — the answer is nothing. No vehicle. No person. No
movement at all. CAM8 is a locked door that was never unlocked. That is what
makes the open trailer door genuinely disturbing. Whatever opened it did not
come down the road.

### Shots Needed
- [ ] `cam8_perimeter_loop.webm` — idle loop, empty road, nothing approaches

### Veo 3 Prompt — `cam8_perimeter_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV field unit,
static gate-mounted camera with no movement, looking outward down a rural
gravel access road in eastern Kentucky at night. The road extends straight
from the camera into darkness, overgrown trees and brush on both sides
creating a dark tunnel effect, a single yellow reflective road post visible
on the left side, the road disappears into darkness at the far end. Low
ground mist settling across the road surface. In the far distance, barely
visible through the trees, a single car passes on a paved road far away,
headlights sweeping briefly through the trees, then gone. Nothing approaches.
The road stays empty. Heavy film grain, horizontal scan line interference,
barrel distortion, crushed blacks, timestamp 01/15/94 23:51 lower right,
4 to 3 ratio, no color, no camera movement, no vehicles on the access road,
no people, worn magnetic tape, VHS tracking degradation, 1992 analog video,
40 seconds, completely still except the single distant car.
```

**FFmpeg:** `noise=alls=18` `brightness=-0.05`

---

## CAM9 — EAST WALL, 80-FOOT BENCH

### Story Significance
CAM9 is the entire game. Everything — Earl's logs, the geology report, the
excavation log cutting off mid-entry, Pellegrino's redacted incident report,
COMBS.TXT appearing in the directory like it was always there — all of it is
preamble to this camera and this wall. The player has read that the geologists
found something at 76 to 84 feet that was not a void and not geology. They have
read that Earl went down to the bench eleven times. They have read his last entry,
left running on a terminal in an empty trailer, ending mid-sentence at 07:14 AM
on March 11th 1983. And now they are looking at the wall. The idle loop should
feel like the wall is looking back. The event clip should confirm that it was.

### Shots Needed
- [ ] `cam9_eastwall_loop.webm` — idle loop, just the wall, 50-60 sec, nothing
- [ ] `cam9_eastwall_event.webm` — same framing, something at the base, plays once

### Veo 3 Prompt — `cam9_eastwall_loop.webm`
```
Black and white security camera footage from 1992, analog CCTV field unit
with degraded signal, static camera mounted at the base of a strip mine cut
wall looking upward, no camera movement whatsoever. The cut wall rises 80
feet in terraced benches of exposed sandstone and dark clay, geological
striations visible in the rock face, loose shale and debris at the base of
the wall in the foreground. The flat bench level at the bottom of the frame
contains old tire tracks in the clay, a rusted cable coil near the left
edge, loose broken rock. The top edge of the highest bench is visible
against a dark night sky. The wall is enormous and indifferent. Nothing
moves. Occasional single frame dropout from signal degradation. Heavy film
grain, horizontal scan line interference worse than other cameras, barrel
distortion, deeply crushed blacks, the darkest parts of the wall face are
nearly pure black, timestamp 01/15/94 23:51 lower right, 4 to 3 ratio,
no color, no camera movement, no people, no sound implied, worn magnetic
tape, severe VHS degradation, analog signal dropout, 1992 field unit camera,
the wall is old and has been here long before the mining, hold completely
still for the full duration, 50 seconds.
```

### Veo 3 Prompt — `cam9_eastwall_event.webm`
```
Black and white security camera footage from 1992, analog CCTV field unit,
static camera at the base of a strip mine cut wall looking upward, identical
framing to previous footage of the same wall. The scene holds on the empty
wall for ten seconds, looking normal. Then at the base of the cut wall, in
the debris field at the bottom of the frame, a person is standing completely
still with their back to the camera, facing the wall, wearing work clothes
and boots. The person does not move. They are simply there, standing against
the base of the 80-foot wall, facing it, in the dark. They were not there
before. They do not move toward the camera. They stand completely still for
five seconds. Then heavy signal degradation and scan line tearing, the image
breaks apart into static, feed is lost. Heavy film grain throughout, crushed
blacks, wall face nearly pure black in places, timestamp 01/15/94 02:19
lower right, 4 to 3 ratio, no color, no camera movement, worn magnetic
tape, severe analog failure at end, 1992 CCTV, the figure does not move.
```

**FFmpeg both clips:** `noise=alls=20` `brightness=-0.13` `saturation=0.08`
```bash
ffmpeg -i INPUT.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.13:contrast=1.28:saturation=0.08, \
       hue=s=0.10:h=95, \
       noise=alls=20:allf=t+u, \
       curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'" \
  -c:v libvp9 -b:v 90k -an OUTPUT.webm
```
The extra curves pass crushes the midtones. The east wall should look
different from every other camera — older, darker, worse.

---
---

# OPTIONAL BONUS CLIPS

---

## BOOT CRT POWER-ON

### Story Significance
Optional atmosphere builder. Plays during the system boot before the BIOS
text appears. Tells the player immediately and wordlessly what kind of
experience they are about to have. Sets the contract: this is old hardware,
analog, physical. Not a simulation.

### Shots Needed
- [ ] `boot_splash.webm` — CRT powering on, 3-4 sec, no loop

### Veo 3 Prompt
```
Black and white footage from 1992, a monochrome green phosphor CRT computer
monitor powering on, shot straight-on at the screen surface. Screen begins
completely black, then a single bright scan line appears in the center of
the screen as the electron beam warms up, the line slowly expands upward and
downward to fill the screen with the green phosphor glow of the powered-on
monitor, slight brightness surge as it reaches full illumination then settles,
the green is the only color, no text on screen, just the power-on glow,
3 seconds, no camera movement, film grain, the specific green of a 1992
monochrome terminal monitor, static camera.
```

---

## CAM9 SIGNAL BURST  *(optional ambient interrupt)*

### Story Significance
A 2-second burst of CAM9 interference that can fire randomly while the player
is doing other things on the terminal. They did not ask for the feed. It just
interrupts briefly and dies. It tells them the east wall is still out there
and still doing something to the signal. Use sparingly. Once is enough.

### Shots Needed
- [ ] `cam9_glitch.webm` — static burst with brief glimpse of wall, 2-3 sec

### Veo 3 Prompt
```
Black and white analog video signal failure from 1992, severe VHS tracking
error, heavy horizontal scan line tearing and rolling, video completely
unstable, through the heavy static interference brief glimpses of an outdoor
night scene are visible, the base of a large rock wall, darkness, the signal
is overwhelmed with noise, static snow, the image cannot stabilize, 2 seconds,
analog signal failure, worn magnetic tape, VHS degradation, no color, no
clean footage, everything is interference and grain.
```

---
---

## MASTER FFMPEG QUICK REFERENCE

| Camera | noise | brightness | saturation | bitrate |
|--------|-------|------------|------------|---------|
| CAM1 Lobby | 13 | -0.05 | 0.15 | 160k |
| CAM2 FL1 Corridor | 14 | -0.06 | 0.15 | 150k |
| CAM3 FL2 Corridor | 12 | -0.05 | 0.15 | 150k |
| CAM4 FL4 Lobby | 12 | -0.05 | 0.15 | 150k |
| CAM5 Parking | 15 | -0.03 | 0.18 | 155k |
| CAM6 FL3 Event | 20 | -0.09 | 0.10 | 120k |
| CAM7 Trailer | 23 | -0.07 | 0.08 | 110k |
| CAM8 Road | 18 | -0.05 | 0.12 | 140k |
| CAM9 East Wall | 20 | -0.13 | 0.08 | 90k |
| Boot Splash | 8 | 0.00 | 0.00 | 200k |

**Paste this and swap the values per camera:**
```bash
ffmpeg -i INPUT.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.05:contrast=1.12:saturation=0.15, \
       hue=s=0.22:h=93, \
       noise=alls=16:allf=t+u" \
  -c:v libvp9 -b:v 150k -an OUTPUT.webm
```

---

## CLIP CHECKLIST

### Hargrove Business Center
- [ ] `cam1_lobby_loop.webm`
- [ ] `cam2_fl1east_loop.webm`
- [ ] `cam3_fl2west_loop.webm`
- [ ] `cam4_fl4lobby_loop.webm`
- [ ] `cam5_parking_loop.webm`
- [ ] `cam6_event.webm`  *(plays once)*

### LKCO Strip Site
- [ ] `cam7_trailer_loop.webm`
- [ ] `trailer_door_event.webm`  *(plays once)*
- [ ] `cam8_perimeter_loop.webm`
- [ ] `cam9_eastwall_loop.webm`
- [ ] `cam9_eastwall_event.webm`  *(plays once)*

### Optional
- [ ] `boot_splash.webm`
- [ ] `cam9_glitch.webm`

---

*SECWATCH Production Bible v2.0  —  Veo 3 Edition*
*Total clips: 11 required  /  2 optional*
