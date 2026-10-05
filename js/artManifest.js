/* ════════════════════════════════════════════════════════
   SECWATCH  --  image manifest  (js/artManifest.js)

   Every image slot in the game, day by day. Used by:
     index.html             dashboard: FEEDS & IMAGES panel
     art/day_outlines.html  draws a labelled outline frame per slot
                            (the PNGs in art/days/), and shows which
                            slots already have real art

   status (worked out at runtime by trying to load `file`):
     have    the file exists in img/
     missing the game already asks for this file but it isn't there
     new     a suggested slot: nothing uses it yet, code needs a
             hook when the art arrives (see `hook`)

   Fields: file, w, h, kind, title, draw (what to make), used (where
   the game loads it), alt (other files that fill the same slot),
   hook (for new slots: where it would go in).

   Camera look for every cam*: the STYLE LOCK in md/SECWATCH_shotlist.md
   (B&W CCTV, 1992, grain, scanlines, timestamp lower right).
════════════════════════════════════════════════════════ */
const ART_MANIFEST = [
  { day:'1', title:'DAY 1 — THE NIGHT SHIFT', when:'01/15/94 23:51', page:'day1.html', slots:[
    { file:'img/cam1.png', alt:['img/cam1.gif'], w:1344, h:768, kind:'cam', title:'CAM1 LOBBY', draw:'Empty lobby, reception desk centre, two vinyl chairs, one fluorescent tube flickering. Coffee mug on the desk.', used:'js/SECengine.js camera grid' },
    { file:'img/cam2.png', alt:['img/cam2.gif'], w:1344, h:768, kind:'cam', title:'CAM2 FLOOR 1 EAST CORRIDOR', draw:'Long carpeted corridor, office doors both sides, exit sign at the end.', used:'js/SECengine.js' },
    { file:'img/cam3.png', alt:['img/cam3.gif'], w:1344, h:768, kind:'cam', title:'CAM3 FLOOR 2 WEST CORRIDOR', draw:'Corridor, drop ceiling, a stack of boxes against one wall.', used:'js/SECengine.js' },
    { file:'img/cam4.png', alt:['img/cam4.gif'], w:1344, h:768, kind:'cam', title:'CAM4 FLOOR 4 ELEVATOR BANK', draw:'Two elevator doors, brass call panel, potted plant.', used:'js/SECengine.js' },
    { file:'img/cam5.jpg', alt:['img/cam5.gif'], w:1408, h:768, kind:'cam', title:'CAM5 PARKING STRUCTURE', draw:'Empty parking deck at night, sodium light, no vehicles.', used:'js/SECengine.js' },
    { file:'img/cam6.jpg', alt:['img/cam6.gif'], w:1408, h:768, kind:'cam', title:'CAM6 FLOOR 3 CORRIDOR (offline)', draw:'Floor 3 corridor, ALL the doors open, Suite 3-C at the far end.', used:'js/SECengine.js' },
    { file:'img/cam6_event1.png', w:1344, h:768, kind:'event', title:'CAM6 EVENT', draw:'Same corridor. A figure in work clothes at the far end, facing away, facing the door to 3-C. Not moving.', used:'js/SECengine.js CAM6 event' },
    { file:'img/cam7.png', alt:['img/cam7.gif'], w:1344, h:768, kind:'cam', title:'CAM7 LKCO TRAILER (east face)', draw:'Site office trailer at the strip site, gravel, one security light.', used:'js/SECengine.js, day7/day8' },
    { file:'img/cam7_door_open.png', w:1344, h:768, kind:'event', title:'CAM7 TRAILER DOOR EVENT', draw:'The trailer door standing open. Nobody in frame.', used:'js/SECengine.js' },
    { file:'img/cam8.png', alt:['img/cam8.gif'], w:1344, h:768, kind:'cam', title:'CAM8 SITE PERIMETER / ACCESS ROAD', draw:'Chain-link gate, haul road climbing into the dark.', used:'js/SECengine.js, day7/day8' },
    { file:'img/cam9.png', alt:['img/cam9.gif', 'img/cam9.jpg'], w:1344, h:768, kind:'cam', title:'CAM9 EAST WALL, 80-FOOT BENCH', draw:'THE KEYSTONE. Cut rock face, horizontal strata, flat bench. Cable reel bottom left.', used:'js/SECengine.js' },
    { file:'img/cam9_event1.png', w:1344, h:768, kind:'event', title:'CAM9 EVENT', draw:'A figure in work clothes at the base of the wall, facing it. Not moving.', used:'js/SECengine.js' },
    { file:'img/cam9_surge.gif', w:320, h:240, kind:'cam', title:'CAM9 SURGE (animated)', draw:'Signal surge / degrade on the east wall feed.', used:'js/SECengine.js' },
    { file:'img/camX.gif', w:320, h:240, kind:'cam', title:'NO SIGNAL (animated)', draw:'Offline feed: static, rolling bar, NO SIGNAL.', used:'js/SECengine.js offline cams' }
  ]},
  { day:'2', title:'DAY 2 — THE MORNING AFTER', when:'01/16/94 06:22', page:'day2.html', slots:[
    { file:'img/cam1_d2.png', alt:['img/cam1_d2.gif'], w:1344, h:768, kind:'cam', title:'CAM1 LOBBY, MORNING', draw:'Same lobby in grey morning light. The coffee mug is on the FLOOR now, still upright.', used:'js/Day2engine.js' },
    { file:'img/cam6_d2.png', w:1344, h:768, kind:'cam', title:'CAM6 FLOOR 3, MORNING', draw:'Floor 3 corridor. Doors open. Nobody.', used:'js/Day2engine.js' },
    { file:'img/cam9_d2.png', w:1344, h:768, kind:'cam', title:'CAM9 EAST WALL, REEL GONE', draw:'The bench with an oblong depression in the gravel where the cable reel sat for eleven years. No drag marks.', used:'js/Day2engine.js, day8.html' },
    { file:'img/day2_witness.png', w:1000, h:700, kind:'doc', title:'WITNESS.TXT (screen)', draw:'Terminal screenshot: "leave the system running. We don\'t know why..."', status:'new', hook:'Day2engine.js file viewer' }
  ]},
  { day:'3', title:'DAY 3 — THE PAPER TRAIL', when:'01/16/94 14:00', page:'day3.html', slots:[
    { file:'img/combs-article.png', w:1228, h:593, kind:'doc', title:'MICROFICHE: COMBS ARTICLE', draw:'Newspaper clipping on microfiche.', used:'js/Day3engine.js' },
    { file:'img/hargrove-article.png', w:997, h:492, kind:'doc', title:'MICROFICHE: HARGROVE ARTICLE', draw:'Newspaper clipping.', used:'js/Day3engine.js' },
    { file:'img/hargrove-article2.png', w:998, h:480, kind:'doc', title:'MICROFICHE: HARGROVE ARTICLE 2', draw:'Second clipping.', used:'js/Day3engine.js' },
    { file:'img/day3_deed_1887.png', w:1000, h:1300, kind:'doc', title:'1887 SURVEY NOTE', draw:'Handwritten survey: "...instruments gave inconsistent readings. Surveyor declined to proceed."', status:'new', hook:'Day3engine.js records' },
    { file:'img/day3_deed_1987.png', w:1000, h:1300, kind:'doc', title:'1987 TRANSFER (the printer)', draw:'Property transfer, LKCO-04, Nov 3 1987. Buyer: blank line where the player\'s name prints.', status:'new', hook:'Day3engine.js printer event' },
    { file:'img/day3_1962_report.png', w:1000, h:1300, kind:'doc', title:'1962 INCIDENT REPORT', draw:'Joseph No. 1 sealing report. CAUSE: unknown. MEN RECOVERED: none. RECOMMENDED BY: black bar.', status:'new', hook:'Day 3 or Day 7 file' }
  ]},
  { day:'4', title:'DAY 4 — RICKY MEADE\'S HOUSE', when:'01/16/94 16:30', page:'day4.html', slots:[
    { file:'img/day4_house.png', w:1344, h:768, kind:'still', title:'1407 CORNETT BRANCH RD', draw:'Small house, lights on in daylight. Truck in the drive, flat left rear tyre.', status:'new', hook:'day4.html room view' },
    { file:'img/day4_kitchen.png', w:1344, h:768, kind:'still', title:'THE KITCHEN', draw:'Kept, not haunted. Clean dishes. Calendar on February 1983. 68 degrees.', status:'new', hook:'day4.html' },
    { file:'img/day4_terminal.png', w:1344, h:768, kind:'still', title:'LKCO RELAY TERMINAL', draw:'Old terminal on a desk, still running since 1983, cursor blinking.', status:'new', hook:'day4.html' },
    { file:'img/day4_letter.png', w:1000, h:1300, kind:'doc', title:'LETTER_MOM.TXT', draw:'Printout of Ricky\'s letter home. "Earl Combs is fair, a real straight shooter, Ma."', status:'new', hook:'Day4engine.js' }
  ]},
  { day:'5', title:'DAY 5 — UNDERGROUND', when:'01/17/94', page:'day5.html', slots:[
    { file:'img/day5_bench.png', w:1344, h:768, kind:'still', title:'THE BENCH, BY FLASHLIGHT', draw:'Flat bench, bare wall, flashlight circle, the oblong depression.', status:'new', hook:'day5.html full-screen text' },
    { file:'img/day5_crack.png', w:1344, h:768, kind:'still', title:'THE CRACK', draw:'Six-inch crack at the base of the wall. Goes back farther than the light.', status:'new', hook:'day5.html' },
    { file:'img/day5_glyphs.png', w:1344, h:768, kind:'still', title:'CHALK GLYPHS', draw:'Twelve sets of the glyph on the passage wall (inverted cross + slash). One shaky, initials D.H.', status:'new', hook:'day5.html' },
    { file:'img/day5_boundary.png', w:1344, h:768, kind:'still', title:'THE BOUNDARY', draw:'Light ahead. Not electric. Not natural. Barely anything drawn.', status:'new', hook:'day5.html [Y/N]' }
  ]},
  { day:'6', title:'DAY 6 — THE HARGROVE HOUSE', when:'01/17/94 evening', page:'day6.html', slots:[
    { file:'img/hargrove_photograph.png', w:1000, h:700, kind:'photo', title:'THE PHOTOGRAPH (safe)', draw:'East wall bench, 1983, from where CAM9 is. Earl near the wall, facing it. The space between Earl and the wall: your eye slides off it.', used:'day6.html safe' },
    { file:'img/day6_house.png', w:1344, h:768, kind:'still', title:'402 HARGROVE DRIVE', draw:'Big well-kept house at dusk. Back door unlocked.', status:'new', hook:'day6.html' },
    { file:'img/day6_minutes.png', w:1000, h:1300, kind:'doc', title:'THRESHOLD SOCIETY MINUTES', draw:'Typed meeting minutes, 1986-1991, getting less formal.', status:'new', hook:'day6.html filing cabinet' },
    { file:'img/day6_letter_1989.png', w:1000, h:1300, kind:'doc', title:'JAMES HARGROVE\'S LETTER', draw:'"David, I\'ll start with the thing I should have told you..." September 1989.', status:'new', hook:'day6.html safe' }
  ]},
  { day:'7', title:'DAY 7 — 1983', when:'03/11/83 07:08', page:'day7.html', slots:[
    { file:'img/cam9_1983.png', w:1344, h:768, kind:'cam', title:'CAM9, 1983', draw:'East wall bench in 1983. Cable reel in place. Timestamp 03/11/83.', used:'day7.html' },
    { file:'img/cam9_earl_walking.png', w:1344, h:768, kind:'event', title:'EARL WALKS TO THE WALL', draw:'07:14. Earl walks in from the left, work clothes, unhurried. Stands at the base of the wall. Does not turn around.', used:'day7.html' },
    { file:'img/day7_notes.png', w:1000, h:1300, kind:'doc', title:'EARL\'S NOTES', draw:'Fourteen handwritten pages. Eleven descents.', status:'new', hook:'day7.html files' }
  ]},
  { day:'8', title:'DAY 8 — THE ARRANGEMENT STRAINS', when:'01/??/94', page:'day8.html', slots:[
    { file:'img/day8_names.png', w:1000, h:1300, kind:'doc', title:'THE LIST OF NAMES', draw:'Forty-one names since 1887. A forty-second line, added 03/11/83 07:14.', status:'new', hook:'day8.html' }
  ]},
  { day:'9', title:'DAY 9 — THE OTHERS', when:'variable', page:'day9.html', slots:[
    { file:'img/day9_sessions.png', w:1344, h:768, kind:'still', title:'SESSION LOGS', draw:'Rows of badge numbers and H/L/S/E readings. Badge 7291: EAST WALL 9.', status:'new', hook:'day9.html' }
  ]},
  { day:'10', title:'DAY 10 — THE WALL SENDS ITS REGARDS', when:'now', page:'day10.html', slots:[
    { file:'img/day10_photo.png', w:1000, h:750, kind:'photo', title:'THE POSTED PHOTOGRAPH', draw:'Cut hillside in winter, horizontal strata. Bottom left: an oblong depression in the gravel. Nothing else. Your eye slides off one part of it.', status:'new', hook:'day10.html' }
  ]},
  { day:'N', title:'THE NIGHT SHIFT (card game)', when:'nights 1-3', page:'dream.html?night=1', slots:[
    { file:'img/terror_intrusion.png', w:512, h:512, kind:'card', title:'TERROR: THE INTRUSION', draw:'Card portrait.', status:'new', hook:'js/dreamData.js TERRORS.intrusion' },
    { file:'img/terror_warmth.png', w:512, h:512, kind:'card', title:'TERROR: THE WARMTH', draw:'Card portrait.', status:'new', hook:'TERRORS.warmth' },
    { file:'img/terror_shape.png', w:512, h:512, kind:'card', title:'TERROR: THE SHAPE', draw:'Card portrait.', status:'new', hook:'TERRORS.shape' },
    { file:'img/terror_badge47.png', w:512, h:512, kind:'card', title:'TERROR: BADGE #0047', draw:'David Hargrove\'s badge, cut in half.', status:'new', hook:'TERRORS.badge47' },
    { file:'img/terror_phantom.png', w:512, h:512, kind:'card', title:'TERROR: EXT. 311', draw:'A desk phone, receiver off the hook.', status:'new', hook:'TERRORS.phantom' },
    { file:'img/terror_cable.png', w:512, h:512, kind:'card', title:'TERROR: THE CABLE REEL', draw:'The reel, half in shadow.', status:'new', hook:'TERRORS.cable' },
    { file:'img/terror_witness.png', w:512, h:512, kind:'card', title:'TERROR: WITNESS.TXT', draw:'Green text on black.', status:'new', hook:'TERRORS.witness_t' },
    { file:'img/terror_threshold.png', w:512, h:512, kind:'card', title:'TERROR: PRIVATE MEETINGS', draw:'A dark office building at night, a dozen cars in the lot, torchlight in the lower windows.', status:'new', hook:'TERRORS.threshold' },
    { file:'img/terror_eastwall.png', w:512, h:512, kind:'card', title:'TERROR: THE EAST WALL', draw:'Bare rock face at the bench, warm light with no source, nobody in frame.', status:'new', hook:'TERRORS.eastwall' }
  ]},
  { day:'M', title:'1962 — JOSEPH No. 1 (the mine)', when:'04/06/62 – 04/07/62', page:'mine.html', slots:[
    { file:'img/mine_title.png', w:1344, h:768, kind:'still', title:'TITLE CARD: THE DRIFT MOUTH', draw:'Drift mouth in the hillside, timber set, belt coming out to a wooden tipple. Spring 1962.', status:'new', hook:'mine.html title card' },
    { file:'img/mine_tipple.png', w:1344, h:768, kind:'still', title:'THE TIPPLE, SATURDAY', draw:'Picking table, shaker screens, boys sorting slate. Some flint clay set to one side.', status:'new', hook:'levels/e1m1.json end card' },
    { file:'img/mine_seal.png', w:1344, h:768, kind:'still', title:'THE SEAL', draw:'Three block stoppings, wet plaster, scratched: 4-7-62 and four sets of initials.', status:'new', hook:'levels/e1m2.json end card' },
    { file:'art/mine/templates/walls.png', w:330, h:312, kind:'sheet', title:'SPRITE SHEETS (walls, flats, sprites, tools, face)', draw:'Grid templates. See art/mine_sheets.html.', used:'mine.html via img/mine/*.png' }
  ]}
];
if(typeof module !== 'undefined') module.exports = ART_MANIFEST;
