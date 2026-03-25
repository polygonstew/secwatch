# SECWATCH v2.11b — VIDEO SHOT LIST
## Production Reference  |  Hargrove Properties / LKCO-04 Strip Site

---

## MASTER STYLE GUIDE
> Paste this at the START of every AI prompt to lock the visual language.
> Do not skip it. This is what keeps all clips looking like the same system.

```
STYLE LOCK (prepend to every prompt):
"Black and white security camera footage, analog CCTV, 1992, wide angle fixed
lens, heavy film grain, scan line interference, slight barrel distortion,
low contrast, crushed blacks, blown highlights, timestamp burned into frame
lower right corner reading '01/15/94  23:51', no camera movement, static
mounted camera, real location, photorealistic, no CGI, 4:3 aspect ratio,
320x240 upscaled look, slight vertical hold instability"
```

**Negative prompt for every clip:**
```
color, saturation, smooth video, modern camera, handheld movement, camera
shake, drone shot, dolly move, CGI, cartoon, animation, clean footage,
people in frame (unless specified), text overlays (except timestamp),
modern clothing, modern vehicles, daytime
```

---
---

## SITE A — HARGROVE BUSINESS CENTER
### Interior / Commercial Building — Film or AI Generate

---

### CAM1 — LOBBY
**File:** `cam1_lobby_loop.webm`
**Duration:** 25–30 sec loop
**Type:** AI Generate OR film (interior)

**AI Prompt:**
```
[STYLE LOCK] Empty commercial office building lobby, 1992, night, single
fluorescent tube overhead slightly flickering, front reception desk visible
center frame, two vinyl chairs against wall left side, hallway receding into
darkness behind desk, coffee mug on desk corner, no people, security camera
mounted high looking down at 35 degree angle, institutional carpet worn near
entrance, drop ceiling tiles, exit sign glowing red upper right background
```

**If filming:** Use your home entry hall or basement stairwell landing.
One practical lamp. Push a chair against the wall. Mug on a surface.
Shoot from above eye level looking down.

---

### CAM2 — FLOOR 1 EAST CORRIDOR
**File:** `cam2_fl1east_loop.webm`
**Duration:** 30 sec loop
**Type:** AI Generate OR film

**AI Prompt:**
```
[STYLE LOCK] Empty office building hallway at night, 1992, fluorescent
overhead lights two of three burned out, corridor extends straight into
darkness at far end, closed doors on right side only, painted cinder block
wall on left, linoleum tile floor with scuff marks, security camera mounted
at ceiling looking down the length of the hall, farthest point of corridor
barely visible in low light, nothing moves
```

**If filming:** Any long hallway. Kill most lights, leave one on.
Shoot from high angle at one end looking down the length.

---

### CAM3 — FLOOR 2 WEST CORRIDOR
**File:** `cam3_fl2west_loop.webm`
**Duration:** 25 sec loop
**Type:** AI Generate OR film

**AI Prompt:**
```
[STYLE LOCK] Commercial building hallway at night, 1992, slightly better
lit than adjacent floor, two fluorescent panels working, three doors visible
one slightly ajar showing darkness inside, hallway dead ends at a fire door
with push bar, emergency exit sign above door, industrial carpet runner worn
thin, security camera high angle wide shot, empty, static
```

---

### CAM4 — FLOOR 4 LOBBY / ELEVATOR BANK
**File:** `cam4_fl4lobby_loop.webm`
**Duration:** 20–25 sec loop
**Type:** AI Generate

**AI Prompt:**
```
[STYLE LOCK] Office building elevator lobby fourth floor, 1992, night,
two elevator doors center frame closed, floor indicator panels above each
door unlit, bench seating against far wall, vinyl tile floor, water stain
on drop ceiling tile upper left, security camera wide angle looking across
the space, emergency lighting only, no people, completely still
```

---

### CAM5 — PARKING STRUCTURE
**File:** `cam5_parking_loop.webm`
**Duration:** 35–40 sec loop
**Type:** AI Generate OR film (exterior)

**AI Prompt:**
```
[STYLE LOCK] Empty parking lot exterior night, 1992, single sodium vapor
lamp casting orange-yellow light in center of frame, concrete surface with
painted parking lines faded, chain link fence at far perimeter, weeds
growing through cracks in pavement, security camera mounted on pole looking
across empty lot, occasional moth near lamp, no vehicles, no people,
light fog low to ground
```

**If filming:** Any parking lot or driveway at night with one light.
This is the most filmable clip — just point and hold.

---

### CAM6 — FLOOR 3 CORRIDOR  [EVENT CLIP — plays once]
**File:** `cam6_event.webm`
**Duration:** 8–12 sec  NO LOOP
**Type:** AI Generate

> This clip plays when CAM6 mysteriously comes back online.
> It shows something wrong. Then signal dies. Never loops.

**AI Prompt:**
```
[STYLE LOCK] Office building hallway third floor, 1992, night, camera
comes on with static burst then stabilizes, corridor identical to other
floors but something is wrong, at the far end of the hallway a figure
stands completely still facing away from camera, figure wears work clothes,
figure does not move for several seconds, then camera cuts to static and
signal is lost, security camera angle, heavy grain, atmospheric
```

**Alternative (no figure — more ambiguous):**
```
[STYLE LOCK] Office building hallway third floor at night, camera feed
activates with brief static, hallway appears normal but all doors are open,
at the far end something has been pushed into the corridor, a desk chair
facing toward the camera, an active computer monitor on the floor glowing,
nobody visible, camera signal degrades and dies after 8 seconds
```

---
---

## SITE B — LKCO-04 LETCHER COUNTY STRIP SITE
### Eastern Kentucky / Abandoned Mining Site — FILM THESE

> These are the ones that make or break the game.
> Film them. AI can supplement but the real location is irreplaceable.
> Your strip mine is a genuine set that no AI can match.

---

### CAM7 — TRAILER EXTERIOR (EAST FACE)
**File:** `cam7_trailer_loop.webm`
**Duration:** 30–35 sec loop
**Type:** FILM  (AI backup prompt below)

**SHOT NOTES:**
- Camera position: 20–30 feet from trailer, elevated if possible
  (ladder, truck bed, anything that gets above eye level)
- Frame: entire trailer door visible, weeds in foreground, cut wall
  visible in background upper half of frame
- Light: one work light or strong flashlight aimed at the side of
  the trailer, NOT the camera. Bounce, not direct.
- Trailer door: CLOSED and latched. This matters — later it opens.
- Hold still for 35 full seconds. Nothing moves.
- Get some dead grass or debris in the foreground bottom of frame.

**FFmpeg after filming:**
```bash
ffmpeg -i raw_cam7.mp4 \
  -vf "scale=320:240, \
       hue=s=0.08:h=88, \
       noise=alls=24:allf=t+u, \
       eq=brightness=-0.06:contrast=1.15" \
  -c:v libvp9 -b:v 110k -an cam7_trailer_loop.webm
```

**AI Backup Prompt:**
```
[STYLE LOCK] Abandoned construction trailer single wide, exterior night,
rural Kentucky, 1992, weathered aluminum siding oxidized and stained, door
on right side of frame closed and latched, single bare bulb above door
burned out, weeds and tall grass in foreground, strip mine cut wall visible
in background rising 60 feet, gravel and clay ground, security camera
mounted on pole looking at trailer from distance, nothing moves, fog settling
near ground level, oppressive silence
```

---

### CAM7 — TRAILER DOOR EVENT  [EVENT CLIP — plays once]
**File:** `trailer_door_event.webm`
**Duration:** 6–8 sec  NO LOOP
**Type:** FILM

> This is a replay of CAM7 from earlier the same night.
> The door that was closed is now open.
> Nobody came through CAM8 (the access road).

**SHOT NOTES:**
- Film immediately after CAM7 loop, same position, same framing
- ONLY difference: trailer door is open, hanging slightly ajar
- Hold for 6 seconds. Nothing else changes. Wind does not move the door.
- The wrongness is in the stillness.

**FFmpeg:**
```bash
ffmpeg -i raw_cam7_door.mp4 \
  -vf "scale=320:240, \
       hue=s=0.08:h=88, \
       noise=alls=24:allf=t+u, \
       eq=brightness=-0.06:contrast=1.15" \
  -c:v libvp9 -b:v 110k -an trailer_door_event.webm
```

---

### CAM8 — SITE PERIMETER / ACCESS ROAD
**File:** `cam8_perimeter_loop.webm`
**Duration:** 40–45 sec loop
**Type:** FILM  (AI backup below)

**SHOT NOTES:**
- The road or path coming onto the property, looking outward
- Frame: road center, trees or cut walls on both sides creating a tunnel
- Light: whatever is available. Dark is better. One distant light source
  at the far end of the road is ideal — gives depth.
- If a car passes on a distant road during filming: KEEP IT.
  One passing headlight sweep at 30 seconds in is perfect.
- Nothing approaches. Road stays empty.

**FFmpeg:**
```bash
ffmpeg -i raw_cam8.mp4 \
  -vf "scale=320:240, \
       hue=s=0.12:h=90, \
       noise=alls=18:allf=t, \
       eq=brightness=-0.04:contrast=1.1" \
  -c:v libvp9 -b:v 140k -an cam8_perimeter_loop.webm
```

**AI Backup Prompt:**
```
[STYLE LOCK] Rural gravel access road at night, eastern Kentucky, 1992,
road extends straight from camera into darkness, overgrown trees on both
sides creating tunnel effect, single reflective yellow post visible left
side, no vehicles, no people, security camera mounted on gate post looking
outward down the road, heavy grain and scan interference, oppressively quiet,
occasional insect near lens, slight mist, 40 seconds static shot
```

---

### CAM9 — EAST WALL  80-FOOT BENCH  [THE KEYSTONE CLIP]
**File:** `cam9_eastwall_loop.webm`
**Duration:** 50–60 sec loop
**Type:** FILM — no substitute

**SHOT NOTES — READ ALL OF THESE:**

- Camera position: at the BASE of the cut wall, looking up and slightly
  back so you can see the full height of the terraced wall
- The wall should fill the upper 60% of frame
- Lower 40%: flat bench / debris field / loose rock, possibly some
  old equipment debris if any exists
- Sky at the very top if possible — that edge line against sky is money
- NO artificial light on the wall itself. Let it be dark.
  A single work light behind you aimed at the ground is fine for
  safety — keep it out of frame.
- Hold for 60 seconds. Do not move. Do not speak.
- If wind moves anything — keep it.
- If you hear anything from the mine — keep it.

**What you are NOT looking for:**
- Pretty landscape photography
- The whole mine overview
- Daytime footage

**What you ARE looking for:**
- Something that feels like it is looking back at you

**FFmpeg — this one gets the heaviest processing:**
```bash
ffmpeg -i raw_cam9.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.12:contrast=1.25:saturation=0.1, \
       hue=s=0.1:h=95, \
       noise=alls=20:allf=t+u, \
       curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'" \
  -c:v libvp9 -b:v 90k -an cam9_eastwall_loop.webm
```

**AI Backup Prompt (use only if filming is not possible):**
```
[STYLE LOCK] Looking up at a strip mine cut wall eastern Kentucky, 1992,
wall rises 80 feet in terraced benches of exposed sandstone and clay, dark
striations in rock face, loose debris and shale at base of wall, security
camera looking upward from base of cut, flat bench level in foreground with
old tire and rusted cable coil, sky barely visible at top edge of highest
bench, grain heavy, signal occasionally drops single frames, nothing moves,
the wall is old and permanent and indifferent, night
```

---

### CAM9 — EAST WALL EVENT  [EVENT CLIP — plays once]
**File:** `cam9_eastwall_event.webm`
**Duration:** 15–20 sec  NO LOOP
**Type:** FILM — no substitute

> This is the clip that the whole game builds toward.
> It plays once, after the player has read Earl's logs.
> It should be uncomfortable to watch.

**SHOT NOTES:**
- Same position as CAM9 loop. Identical framing.
- Hold on the empty wall for 10 seconds — looks like the loop
- Then: at the base of the wall, something is there
- What it is: your call. Options listed below.
- It does not move toward camera. It is simply present.
- 5 seconds of it being there. Then clip ends.

**Options for what is at the base of the wall:**
1. A person standing completely still against the wall, facing it
   (facing away from camera). Work clothes. Not moving.
2. A light source deep inside a crack or seam in the rock face.
   No explanation. Warm light. Just there.
3. Nothing — but a large section of the wall face is a different color
   than it was in the loop version. Slightly darker. Slightly warmer.
   Like something behind it changed temperature.
4. Earl's option: a single work boot at the base of the wall.
   Nothing attached to it. Just the boot.

**FFmpeg — identical to loop, keep it seamless:**
```bash
ffmpeg -i raw_cam9_event.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.12:contrast=1.25:saturation=0.1, \
       hue=s=0.1:h=95, \
       noise=alls=20:allf=t+u, \
       curves=all='0/0 0.3/0.18 0.7/0.55 1/0.82'" \
  -c:v libvp9 -b:v 90k -an cam9_eastwall_event.webm
```

---
---

## OPTIONAL / BONUS CLIPS

---

### BOOT SPLASH — CRT POWER-ON
**File:** `boot_splash.webm`
**Duration:** 3–4 sec  NO LOOP
**Type:** AI Generate

> Plays during system boot before the BIOS text appears.
> Optional atmosphere builder.

**AI Prompt:**
```
[STYLE LOCK] CRT monitor powering on, 1992, screen goes from black to
bright white scan line in center then expands to fill screen with
phosphor green color, electron beam warming up effect, slight
brightness surge then settle, no text, just the power-on glow of
a monochrome green CRT terminal coming to life, 3 seconds
```

---

### CAM9 SIGNAL DEGRADED — GLITCH FRAME
**File:** `cam9_glitch.webm`
**Duration:** 2–3 sec  NO LOOP
**Type:** AI Generate

> Random brief burst of degraded signal from CAM9.
> Can be triggered periodically while player is on other screens.
> Just noise and interference, no content.

**AI Prompt:**
```
[STYLE LOCK] Security camera feed with severe signal degradation, 1992,
heavy horizontal scan line tearing, video rolling, signal completely
lost with static snow, brief glimpse of dark outdoor scene through
interference, then static again, 2 seconds, VHS tracking error
```

---
---

## FILMING CHECKLIST

Before each recording session:

- [ ] Phone fully charged or plugged in
- [ ] Camera locked in place (tripod, clamp, or wedged object)
- [ ] Exposure locked (tap and hold on most phone cameras)
- [ ] Focus locked on the scene, not auto
- [ ] Recording in highest quality available (4K preferred, downscale later)
- [ ] Audio on (ambient sound adds a lot, even though it gets stripped)
- [ ] At least 60 seconds of footage per clip (you'll trim it down)
- [ ] Film each clip twice minimum (different holds, different light)
- [ ] No talking during recording
- [ ] Check playback before moving the camera

---

## AI VIDEO TOOLS THAT WORK FOR THIS STYLE

| Tool | Strength | Notes |
|---|---|---|
| **Runway Gen-3** | Best grain/texture control | Use "motion amount: 1-2" for near-static |
| **Kling AI** | Long clips, good realism | 1.5 or 2.0 model for best grain |
| **Sora** | Most realistic | Access limited, worth trying |
| **Pika 2.0** | Good for short event clips | Better for the 6-10 sec moments |
| **Stable Video Diffusion** | Local / free | Less consistent but controllable |

**For all of them:** Generate at native resolution, do NOT upscale inside
the tool. Run FFmpeg afterward — your processing pass adds more authentic
degradation than any in-tool filter.

---

## FFMPEG MASTER RECIPE

Run every clip through this after generation or filming:

```bash
ffmpeg -i INPUT.mp4 \
  -vf "scale=320:240, \
       eq=brightness=-0.05:contrast=1.12:saturation=0.15, \
       hue=s=0.22:h=93, \
       noise=alls=16:allf=t+u" \
  -c:v libvp9 -b:v 150k -an OUTPUT.webm
```

Adjust per camera:
- `noise=alls=N`  — higher for LKCO cams (22-26), lower for Hargrove (12-16)
- `brightness=-0.N` — lower for east wall (-0.12), normal for lobby (-0.04)
- `saturation=0.N`  — lower is more desaturated (0.08 = nearly B&W)
- `-b:v NNNk`     — lower bitrate = more compression artifacts (good)

---

*Shot list version 1.0  —  SECWATCH production reference*
