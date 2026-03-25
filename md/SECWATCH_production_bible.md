# SECWATCH PRODUCTION BIBLE
## Complete Asset & Content Reference  |  All 7 Days
### Keep this document offline — contains story spoilers and scripts

---

## FILE STRUCTURE

```
/                       root
  day1.html
  day2.html
  day3.html
  day4.html
  day5.html
  day6.html
  day7.html
  /img/                 all images and animated GIFs/WebPs
  /audio/               all MP3 files
  convert_anim.bat      MP4 to GIF/WebP converter
  convert_secwatch.bat  MP4 to WebM converter (backup)
```

---

## TOOL REFERENCE

**convert_anim.bat**
Converts MP4 to animated GIF or WebP.
Run it, type filename, pick camera profile, pick format.
Output goes to same folder. Drop result in /img/.

**To activate animation in HTML:**
Find the camera in the CAMS registry and add:
  `anim:'img/FILENAME.gif'`
The anim field takes priority over img automatically.

**FFmpeg camera profiles:**
1 = Hargrove Interior (CAM1-5)
2 = CAM6 / Event clips
3 = LKCO Exterior (CAM7-8)
4 = CAM9 East Wall (darkest)

---
---

# DAY 1 ASSETS
## day1.html — Night of 01/15/94, 23:51

---

## IMAGES  /img/

### Hargrove Business Center
| File | Description | Status |
|------|-------------|--------|
| cam1.png | Lobby, front desk, mug visible, exit sign in bg | DONE |
| cam2.png | Corridor, dark, fire door visible at far end | DONE |
| cam3.png | Corridor, lit, scuff marks on floor | DONE |
| cam4.png | Elevator bank, 4th floor, fisheye lens | DONE |
| cam5.jpg | Parking lot, single lamp, empty | DONE |
| cam6.jpg | Floor 3 corridor, blank plate, all doors open, debris | DONE |
| cam6_event1.png | Floor 3, figure at far end under EXIT sign, facing away | DONE |

### LKCO Strip Site
| File | Description | Status |
|------|-------------|--------|
| cam7.png | Trailer exterior, door CLOSED, cut wall behind | DONE |
| cam7_door_open.png | Trailer exterior, door OPEN, same framing | DONE |
| cam8.png | Access road, fog, reflective post, empty | DONE |
| cam9.png | East wall, dark version, cable reel visible bottom left | DONE |
| cam9_event1.png | East wall, figure at base facing wall, work clothes | DONE |

### Optional / Bonus
| File | Description | Status |
|------|-------------|--------|
| cam6_event2.png | Alt figure position for Floor 3 — different spot | DONE |
| cam9_event2.png | Alt figure position for east wall event | DONE |
| cam9_surge.gif | Brief surge/flare effect before cam9 event — animated | NEEDED |

**cam9_surge.gif prompt (Veo → convert_anim):**
Security camera feed surge, east wall, sudden exposure
overload, camera auto-adjusting, brief white flare then
settling back to degraded signal, 2-3 seconds, no people.

---

## AUDIO  /audio/

### Phone SFX
Short clips. Can source free SFX online (freesound.org).
| File | Description | Length |
|------|-------------|--------|
| phone_dial.mp3 | Dial tone, loops | 2-3 sec |
| phone_ring.mp3 | Single ring, JS loops it | 1 ring |
| phone_busy.mp3 | Busy signal, loops | 2-3 sec |
| phone_pickup.mp3 | Click of line picking up | 0.5 sec |
| phone_hangup.mp3 | Click of line going dead | 0.5 sec |

### Voice — ext.204 Pellegrino Voicemail
**File:** pellegrino_vm.mp3
**Voice character:** Professional facilities manager.
Slightly rushed. Not alarmed yet. End of the message
the tone shifts — the Floor 3 warning sounds rehearsed,
like he's said it before.
**Recording notes:** Office background. Normal room.

**Script:**
"You've reached Randy Pellegrino, Hargrove Properties
facilities management. I'm either away from my desk or
on another line. If this is regarding the Commerce
Boulevard property, the system has been reactivated
as of tonight and the night desk has been staffed.
If you're calling about the Letcher County site --
[3 second pause]
-- leave a number. I'll call you back.
Don't go up to Floor 3."
[beep sound at end]

---

### Voice — ext.107 LKCO Maintenance Relay
**File:** maintenance_107.mp3
**Voice character:** Nobody should be answering this line.
The site has been closed for eleven years. Whoever picks
up sounds like they are very far away. Not threatening.
Just distant. Matter of fact.
**Recording notes:** Outdoor if possible. Wind sound good.
Add room reverb in Audacity. Long pauses are important.

**Script:**
[3 seconds of silence or wind before speaking]
"...maintenance."
[4-5 second pause]
"...site's been closed since '83."
[line goes dead — stop recording]

---

### Voice — Wrong Number
**File:** wrong_number.mp3
**Voice character:** Annoyed. Half-asleep. Normal person.
**Recording notes:** Casual. No effects needed.

**Script:**
"Yeah?"
[2 second pause]
"You got the wrong number."
[click — stop recording]

---

### Voice — ext.099 Hargrove Family Law
**File:** ext_099.mp3
**Voice character:** This is the most important phone call
in Day 1. Flat voice. No emotion. Slightly hollow, like
the person is reading from something. Not robotic —
human, but wrong in a way that is hard to place.
Professional but not warm. Record this one last.
**Recording notes:** Quiet room. No reverb. Flat and close.
Slight pause between each line. The long pause before
"Don't dig any further" should be 4-5 seconds.

**Script:**
"Hargrove family law."
[2 second pause]
"We've been expecting a call."
[2 second pause]
"Which file are you calling about?"
[2 second pause]
"We have a Combs on file. And a Hargrove."
[4-5 second pause]
"Don't dig any further."
[click — stop recording]

---

### Audio — ext.311
**File:** ext_311.mp3
**No voice needed.**
**Build in Audacity:**
1. New track, 10 seconds of silence
2. Import any bass-heavy thunder/rumble sound
3. Slow it down 400%, pitch down 4 semitones
4. Layer it starting at the 3 second mark, fading in
5. Let it swell to about 60% volume at 7 seconds
6. Cut at 10 seconds — hard stop
7. Export as MP3

The player dials 311. One ring. Then this. No voice.
The sound should feel like the earth moving, not thunder.

---

### Voice — TAPE_01 Earl Combs Feb 16 1983
**File:** tape_01.mp3
**Voice character:** Earl is 40s, Appalachian, foreman.
This tape is the normal one. He sounds tired but competent.
This is the tape that makes the player like Earl before
everything gets worse. Record this one warm.
**Recording notes:** Outdoor if possible. Some wind okay.
Handheld recorder quality — hold the phone slightly away.
Background ambient noise adds authenticity.

**Script:**
"February sixteenth. 1983. This is Earl Combs,
site foreman, Kelly Branch Number Two. I'm recording this
because I want there to be a record that isn't just the
computer log.

The east wall crew hit something today at about
seventy-eight feet. I sent Darnell and Pete down to probe
it. They were down there maybe twenty minutes.

They came back and I asked what they found and Pete said
'Nothing Earl. Just rock.' And Darnell didn't say anything.
Walked to his truck and sat there until end of shift.

It wasn't nothing.

I'm going to backfill it in the morning.
I shouldn't have sent them down there."
[stop recording]

---

### Voice — TAPE_02 Earl Combs March 1983 Personal
**File:** tape_02.mp3
**Voice character:** Same Earl. Different. More quiet.
He's been alone for a while now. This sounds like a man
talking to himself, not recording for a record.
**Recording notes:** Interior. Quiet room. The recording
should start mid-sentence as if the recorder was already
running when the thought started. Closer mic than tape_01.

**Script:**
[start recording already speaking, no pause at start]
"-- don't know if it's the same thing my daddy talked
about or something different. He worked a deep mine over
in Harlan in the fifties. Said there were places in the
earth you could feel before you saw them. Said the old
miners had a name for it but wouldn't say the name out loud.

I used to think that was superstition.

[4 second pause]

The wall is warm. I've put my hand on it three times now.
Nothing down here should be warm at night in February.

I'm not going to tell anybody about the wall."
[stop — no click, just end]

---

### Voice — TAPE_03 Earl Final Recording
**File:** tape_03.mp3
**Voice character:** Earl has made a decision. He is calm
in a way that is more unsettling than fear. This is a man
who has accepted something. Record this one slowly.
**Recording notes:** Outdoor. Night if possible. Gravel
or ground underfoot sounds at the start — footsteps,
then they stop. The long silence in the middle is crucial.
Do not rush it.

**Script:**
[sound of footsteps on gravel for 5 seconds]
[footsteps stop]
"It's March tenth. Equipment pulls tomorrow.

[5 second pause]

I've been thinking about what you say to something like this.
To make sure it understands.

[pause — 3 seconds — then speak quieter, almost to yourself]
You can feel it listening.

[4 second pause — then normal voice again, matter of fact]
Okay. We're done here. The land is sold.
The people who own it now don't know you're there.
And that's how it's going to stay. That's the deal.
Same as before.

[2 second pause]

I need you to let that be enough.

[6-8 second silence]
[something very faint at the end — breathe, or a distant sound]
[tape cuts — stop recording abruptly mid-second]"

---

### Voice — TAPE_04 Hargrove Building Security 03/12/91
**File:** tape_04.mp3
**Voice character:** Mike Stroud, building security.
Young. Nervous but trying to sound professional.
This tape is found hidden in the FLOORS directory.
The player discovers it. It is not supposed to be there.
**Recording notes:** Interior. Hallway echo if possible
(bathroom works). Footsteps throughout. Voice changes
when he enters Suite 3-C — becomes uncertain, then
controlled fear, then the tape cuts. The cut is abrupt.

**Script:**
"Hargrove Building Security, this is Mike Stroud,
March twelfth 1991, recording for my own file.
I'm on Floor 3, main corridor.
[footsteps echoing]
Nothing in the corridor. Heading to Suite 3-C.
Pellegrino said not to go in but I just want to--

[door opens slowly]

...it's dark. Smells like --
I don't know what that smell is.
There's something on the wall.
Looks like --

[breathing changes — slower, almost controlled]

-- I'm going to come back with a flashlight.

[1 second pause]

I'm going to come back with a--"
[hard stop — tape ends]

---

### Voice — TAPE_05 Earl Combs October 1982 Site Survey
**File:** tape_05.mp3
**Voice character:** Earl before everything.
This is the most important tape for emotional impact.
He sounds genuinely happy here. Content. This is who
he was before 1983. Record this one bright and warm —
completely different energy from tapes 01-03.
**Recording notes:** Outdoor. Daytime if the ambient
sounds different. Wind is fine. Upbeat, professional,
like a man who loves his job and his corner of the world.

**Script:**
"October second, 1982. Earl Combs recording initial
site survey for Kelly Branch site four.
Seam looks good from the surface survey.
Should be a productive season.

Good crew lined up -- Darnell and Pete are back,
Ricky Meade's boy is joining us this winter.

[sound of wind, natural pause — he's just looking around]

I like this part of the county.
Good and quiet.

[another pause]

Yeah.

Should be a good winter."
[stop recording — natural end, not a cut]

---

### Audio — CAM9 Static
**File:** cam9_static.mp3
**No voice needed.**
**Build in Audacity:**
1. Generate 40 seconds of white noise
2. Apply bass boost filter — heavy
3. At 35-37 seconds: add three distinct low-frequency
   thuds. Not Morse. Not a pattern you'd recognize.
   Just three slow beats with 1.5 seconds between each.
   Below 80hz if possible.
4. After the three beats: back to static, then silence
5. The three beats should feel like something hitting
   the inside of a wall from the other side
6. Does not loop — plays once only
7. Export as MP3

---
---

# DAY 2 ASSETS
## day2.html — Morning of 01/16/94, 06:22

---

## NEW IMAGES NEEDED  /img/

| File | Description | Notes |
|------|-------------|-------|
| cam1_d2.png | Same lobby as cam1.png | The coffee mug has moved. It is now on the floor beside the desk. Still upright. Still the same mug. Nobody moved it. The building was empty all night. Generate with same framing as cam1.png. |
| cam6_d2.png | Same Floor 3 corridor as cam6.jpg | One door is now closed. Suite 3-C specifically. All other doors remain open from the Day 1 blank plate. Just that one door. Closed. |
| cam9_d2.png | Same east wall as cam9.png | The cable reel that was visible bottom-left in cam9.png is gone. Nothing else changed. No drag marks. Just gone. Use same framing. |

**Generation note:** These three images need to feel
identical to Day 1 versions except for the one detail.
Same framing. Same lighting. Same grain level.
The wrongness should be subtle enough that players
who go back and compare will feel it more than players
who notice immediately.

---

## NEW AUDIO  /audio/

### Voice — Pellegrino Day 2 Opening
**File:** pellegrino_d2_open.mp3
**Voice character:** Pellegrino on the phone at 6am.
He hasn't slept. He sounds like a man who has been
sitting by the phone since 2am. Not panicking — Pellegrino
doesn't panic — but the effort of staying calm is audible.
**Recording notes:** Close mic. Interior. The line quality
should sound slightly different from a landline — add very
light phone EQ in Audacity (cut below 300hz, cut above 3khz).

**Script:**
"Thank God. Listen -- did you file your incident
report yet?"
[stop here — the JS will wait for player response]

---

### Voice — Pellegrino Day 2 Camera Question
**File:** pellegrino_d2_cam6.mp3
**Voice character:** Same call. He's asking carefully.
He already knows the answer. He needs to hear you say it.

**Script:**
"The Floor 3 camera. It shows a brief reconnection
at 02:19 last night. Did you -- did you see a feed?"
[stop]

---

### Voice — Pellegrino Day 2 Badge Reveal
**File:** pellegrino_d2_badgeA.mp3
**Voice character:** This is the moment Pellegrino says
something he has never said out loud to anyone.
Long pauses. He is choosing words very carefully.

**Script:**
"David Hargrove has been dead since March of 1991."
[3 second pause]
"His badge shouldn't work. It was physically destroyed."
[4 second pause]
"I destroyed it myself."
[stop]

---

### Voice — Pellegrino Day 2 Closing
**File:** pellegrino_d2_close.mp3
**Voice character:** Final words of the call. He sounds
like he has already decided to disappear after this.
Very quiet. Not dramatic. Just done.

**Script:**
"Listen. Don't go back in that building."
[2 second pause]
"If Aldridge and Carr asks -- tell them the system
needs another week. Tell them anything."
[3 second pause — barely audible]
"Just don't go back in."
[click — line goes dead]

---

### Voice — TAPE_06
**File:** tape_06.mp3
**Voice character:** This is the most disturbing recording.
It is Earl. But wrong. Not afraid — that would be
easier to process. He sounds like a man who has been
underground for a very long time and has stopped
noticing. Flat. Slow. The detail about Ricky Meade's
truck is important — say it like you've been thinking
about it for months.
**Recording notes:** Record in a small room, close mic,
no reverb. The closer and flatter the better.
Pauses are crucial. Do not rush any of them.
The tape cuts at the end — hard stop, no fade.

**Script:**
"I don't know when this is.
I don't have a watch anymore.

[4 second pause]

The wall is -- it's different now.
Since we backfilled.
It's not warm anymore.

[3 second pause]

It's hot.

[5 second pause]

I keep thinking about Ricky Meade's truck.
Still in his driveway.
Nobody went to get it.

[8 second pause]

I shouldn't be this far down.

[3 second pause]

I can see light."
[hard cut — stop recording immediately after "light"]

---
---

# DAYS 3-7 ASSETS
## Not yet built — reference only

---

## DAY 3 — LETCHER COUNTY RECORDS OFFICE
**UI style:** County Clerk Access System v1.2 (1987)
Different terminal font — slightly wider characters.
Amber on dark brown rather than green on black.

**New images needed:**
- county_terminal.png — background/wallpaper for this UI
  A wood-paneled government office. Fluorescent lights.
  Filing cabinets. The terminal on a desk.

**Key mechanic:** Printer queue. The 1987 print job
that never printed contains the player's name.
The name comes from the name-game module (Day 1).

**No new audio needed for Day 3.**

---

## DAY 4 — RICKY MEADE'S HOUSE
**UI style:** TRS-80 or Commodore aesthetic.
White on black. Different font entirely.
Personal computer, 1983. It has been running since then.

**New images needed:**
- ricky_house_exterior.png
  Rural house. Day or dusk. A truck in the driveway.
  The truck has been there since 1983. Weeds around it.
  Nobody ever came to get it.

- ricky_terminal.png
  The home computer screen. Old. A blinking cursor.
  The room around it dark.

**No new audio needed for Day 4.**

---

## DAY 5 — UNDERGROUND (EAST WALL BENCH LEVEL)
**UI style:** Pure text. No panels. Full screen terminal.
This is the most minimal UI in the game.
Green on black. Nothing else.

**New images needed:** None.
This day is entirely text-based.

**New audio needed:**
- underground_ambient.mp3
  Low hum. Not mechanical. Something between wind
  and breathing. Very low frequency. Loops.
  Build in Audacity: sine wave at 40hz, very quiet,
  with slow volume modulation (0.1hz LFO).
  Should feel like pressure rather than sound.
  8-10 seconds, seamless loop.

- wall_warm.mp3
  A single sound that plays when the player types
  TOUCH WALL for the first time.
  Not a voice. Not a sound effect.
  The closest description: the sound of something
  very large shifting its attention.
  Build: low rumble, slow attack 3 seconds,
  hold 2 seconds, slow fade 3 seconds.
  Total 8 seconds. Does not loop.

---

## DAY 6 — HARGROVE FAMILY HOME
**UI style:** HomeSafe v3.2 (1991 home security terminal)
Blue-gray on dark. Slightly more consumer-friendly
than the Hargrove business terminal. Menus instead of
pure command line — some things are selectable with
numbers rather than typed.

**New images needed:**
- hargrove_house_exterior.png
  Upper-middle class house, 1994. Maintained but empty.
  Nobody has lived here in three years.
  Lights on inside. Nobody home.

- hargrove_safe_interior.png
  Inside an open safe. Documents visible.
  A manila envelope. A photograph face-down.
  Do not show what the photograph depicts.

**New audio needed:**
- house_ambient.mp3
  Empty house. Refrigerator hum. Very faint.
  The kind of quiet that only happens in houses
  where nobody has spoken in years. Loops.

---

## DAY 7 — BACK TO SECWATCH
**UI style:** Identical to Day 1. SECWATCH v2.11b.
Same boot sequence. Same layout.
The date is wrong: 03/11/83  07:08.
The badge is Earl's: #0088.

**New images needed:**
- cam9_1983.png
  East wall, 1983 version. Identical framing to cam9.png
  but the cable reel IS there. It looks newer.
  The wall looks the same. It always looks the same.
  This is the last image in the game.

**New audio needed:**
- earl_walking.mp3
  Footsteps on gravel. 30 seconds.
  Getting slightly quieter as he walks away.
  No voice. Just footsteps on the ground.
  Fading to silence.
  This plays during the final CAM9 sequence.

---
---

# BADGE LOGIN SYSTEM (To be built)

Four special badge numbers that unlock hidden content.
Players find these numbers embedded in the files.

| Badge | Found In | Unlocks |
|-------|----------|---------|
| 0023 | BADGE.LOG (Day 1) | PERSONAL directory, alternate incident view |
| 0047 | BADGE.LOG (Day 1) | D. Hargrove access — system accepts it, logs it, changes Day 2 |
| 0088 | SITE94.CFG (Day 1) | Day 7 early access, 1983 LKCO filesystem |
| 1983 | Source code comment only | C:\BEFORE — one file, a coordinate |

The coordinate in C:\BEFORE points to a real location
in Letcher County, KY. Decide what that location is.
The game never explains why that coordinate matters.

---
---

# THREAT LEVEL SYSTEM (To be built)

Four bars. All start at 0. Max 10.

| Bar | Raises When |
|-----|-------------|
| HARGROVE | CAM6 event, BADGE.LOG read, incident report read, badge 0047 login |
| LKCO | FOREMAN.LOG read, COMBS.TXT opened, TAPE_03 played, CAM9 viewed 3+ times |
| SYSTEM | SCANDISK after ghost file, ext.099 dialed, WITNESS.TXT read, ext.311 dialed |
| EAST WALL | Raises on its own over time. 1 tick per 3 real minutes. Resets only if player chooses Y at Day 5 boundary. |

Events at each combined level documented in design notes.
OBSERVER LOGGED appears on camera HUD when East Wall hits 7.

---
---

# DIALOG TO RECORD — COMPLETE LIST BY DAY

## Day 1
- pellegrino_vm.mp3 ← script above
- maintenance_107.mp3 ← script above
- wrong_number.mp3 ← script above
- ext_099.mp3 ← script above
- tape_01.mp3 ← script above
- tape_02.mp3 ← script above
- tape_03.mp3 ← script above
- tape_04.mp3 ← script above
- tape_05.mp3 ← script above

## Day 2
- pellegrino_d2_open.mp3 ← script above
- pellegrino_d2_cam6.mp3 ← script above
- pellegrino_d2_badgeA.mp3 ← script above
- pellegrino_d2_close.mp3 ← script above
- tape_06.mp3 ← script above

## Day 3
- Nothing to record

## Day 4
- Nothing to record

## Day 5
- Nothing to record (text-only day)

## Day 6
- Nothing to record

## Day 7
- earl_walking.mp3 ← footsteps only, no voice

## Total voice sessions needed: 2
One session as Pellegrino (middle-aged, professional, tired)
One session as Earl (Appalachian foreman, changes across tapes)

**Recording order recommendation:**
Session 1 — Earl, record in this order:
  tape_05 first (warm, upbeat — sets the character)
  tape_01 (tired but normal)
  tape_02 (quieter, alone)
  tape_03 (calm acceptance)
  tape_06 last (hollow, wrong — you'll know the character
  well enough by now to find this voice)

Session 2 — Pellegrino:
  pellegrino_vm first (professional, rehearsed)
  pellegrino_d2_open (hasn't slept)
  pellegrino_d2_cam6 (careful)
  pellegrino_d2_badgeA (this is the hard one — take your time)
  pellegrino_d2_close (already gone)

---
---

# AUDACITY TIPS FOR THIS PROJECT

**Phone EQ (for Pellegrino calls):**
Effect → Equalization
Cut everything below 300hz
Cut everything above 3400hz
Adds the telephone narrowband sound

**Tape hiss (for Earl recordings):**
Generate → Noise → White noise at -30db
Mix under the recording track
Gives the cassette texture

**Tape warble (for tape_06 specifically):**
Effect → Pitch → slight wobble
Or Effect → Tremolo at very slow rate
Makes it sound like an old tape with worn heads

**Export settings:**
Format: MP3
Bit rate: 128kbps
All files

---

*Production Bible v1.0*
*SECWATCH — 7 Day Creepypasta Experience*
*Keep offline. Do not publish.*
