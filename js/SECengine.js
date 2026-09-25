'use strict';

/* ════════════════════════════════════════════════════════
   GAME STATE
════════════════════════════════════════════════════════ */
const S = {
  playerName:null, employeeID:null,
  cwd:'C:\\SECWATCH', inputMode:'cmd', inputBuf:'',
  activeCamKey:null, activeSite:null,
  sec2Runs:0, lkcoVisits:0, cam9Viewed:0,
  logReads:0, dialAttempts:0, tapePlayCount:0,
  badgeLogRead:false, incidentRptRead:false,
  cam6EventPlayed:false, cam9EventPlayed:false,
  trailerEventPlayed:false, ghostFileIn:false,
  tape04Unlocked:false, tape05Unlocked:false,
  notesUnlocked:false,
  endDay1Triggered:false,
  /* threat level */
  tl:{h:0,l:0,s:0,e:0},
  observerLogged:false,
  /* badge unlock flags */
  badge0047Active:false,
  badge0088Active:false,
  badge0023Active:false,
};

/* special badge numbers */
const SPECIAL_BADGES = {
  '0047':{
    name:'D. HARGROVE',
    onLogin: async function(){
      await sleep(600);
      ln('  WARNING: Badge #0047 was deactivated 03/15/91.','err');
      await sleep(400);
      ln('  Employee of record: D. HARGROVE -- DECEASED','err');
      await sleep(800);
      ln('  Access granted.','warn');
      S.badge0047Active = true;
      TL.raise('h',2,'badge 0047 used');
      TL.raise('s',1,'badge 0047 used');
    }
  },
  '0088':{
    name:'E. COMBS',
    onLogin: async function(){
      await sleep(600);
      ln('  WARNING: Badge #0088 -- LKCO site foreman.','warn');
      await sleep(400);
      ln('  Last recorded use: 03/11/83  07:14','warn');
      await sleep(800);
      ln('  ...Access granted.','hi');
      S.badge0088Active = true;
      TL.raise('l',2,'badge 0088 used');
      /* unlock 1983 LKCO filesystem view */
      FS['C:\\SECWATCH\\SITES\\LKCO\\NOTES_1983.TXT'] = {type:'file',content:
`[This file predates the SECWATCH network connection]
[Recovered from local LKCO-04 node storage]
[Date: 03/10/83]

I am leaving this here for whoever logs in next.

The system will still be running.
I made sure of that before I came down.

If you are reading this you found the site.
You found the files.
You know what is in the east wall.

There is nothing to be done about it.
The only thing that helps is the system running.
We don't know why. It started in 1962.
The man before me figured it out.
He left notes. I found his notes.
Now I am leaving mine.

If you go down to the bench:
  Stay back from the base of the wall.
  Do not touch it.
  Do not let it feel you listening.
  Come back up before the light changes.

The eleventh time I went down I understood
what it was. What it has always been.
The twelfth time is different.

I am going for the twelfth time tomorrow.

-- E. Combs
   03/10/83
`};
      if(!FS['C:\\SECWATCH\\SITES\\LKCO'].children.includes('NOTES_1983.TXT')){
        FS['C:\\SECWATCH\\SITES\\LKCO'].children.push('NOTES_1983.TXT');
      }
    }
  },
  '0023':{
    name:'MAINTENANCE',
    onLogin: async function(){
      await sleep(400);
      ln('  Badge #0023 -- Maintenance clearance.','dim');
      await sleep(400);
      ln('  Access granted.  Limited permissions apply.','hi');
      S.badge0023Active = true;
      /* unlock personal directory */
      FS['C:\\SECWATCH\\PERSONAL'] = {type:'dir',
        children:['STROUD_NOTES.TXT']};
      FS['C:\\SECWATCH\\PERSONAL\\STROUD_NOTES.TXT'] = {type:'file',content:
`Personal notes -- M. Stroud, Bldg Security
NOT FOR OFFICIAL RECORD

03/12/91 -- I went to Floor 3 today.
Pellegrino told me not to. I went anyway.
The corridor is the same as the other floors.
Except all the doors are open.

I went into 3-C.
I don't know how long I was in there.
My recorder cut out.

When I came back down I checked the clock.
I had been up there for four hours.
I thought it was twenty minutes.

I'm not filing a report.
I'm not telling Pellegrino.

The smell in that room is like something
that has been warm for a very long time.

I'm not going back up there.

[Note appended same day, different handwriting]:
We found Stroud on the morning of 03/16/91.
He was on Floor 3.
He was fine.
He did not remember writing the above.
-- R.P.
`};
      if(!FS['C:\\SECWATCH'].children.includes('PERSONAL')){
        FS['C:\\SECWATCH'].children.push('PERSONAL');
      }
    }
  },
  '1983':{
    name:'[UNRECOGNIZED]',
    onLogin: async function(){
      await sleep(300);
      ln('  Badge #1983 -- not in employee database.','warn');
      await sleep(1200);
      const d=document.createElement('div');
      d.className='ln err';d.textContent='  Badge not recognized.';
      termOutput.appendChild(d);termOutput.scrollTop=termOutput.scrollHeight;
      await sleep(800);
      d.textContent='  Badge not recognized.  Access granted.';
      termOutput.scrollTop=termOutput.scrollHeight;
      await sleep(400);
      /* unlock C:\BEFORE */
      FS['C:\\BEFORE'] = {type:'dir',children:['_']};
      FS['C:\\BEFORE\\_'] = {type:'file',content:
`37.1954 N  82.9371 W

do not go there

it is already gone
`};
      if(!FS['C:\\SECWATCH'].children.includes('BEFORE')){
        /* appears as a root dir */
        FS['C:\\SECWATCH'].children.push('BEFORE');
      }
      TL.raise('s',3,'badge 1983');
      TL.raise('e',2,'badge 1983');
    }
  },
};

const DATE_STR='01/15/94', TIME_STR='23:51';
let _res=null;

/* ════════════════════════════════════════════════════════
   THREAT LEVEL ENGINE
   TL.raise(bar, amount)
   bars: 'h'=HARGROVE  'l'=LKCO  's'=SYSTEM  'e'=EAST WALL
════════════════════════════════════════════════════════ */
const TL = {
  bars:{h:0,l:0,s:0,e:0},
  els:{h:{},l:{},s:{},e:{}},
  ewRow:null, ewTimer:null,

  init(){
    this.els.h={fill:document.getElementById('barH'),val:document.getElementById('valH')};
    this.els.l={fill:document.getElementById('barL'),val:document.getElementById('valL')};
    this.els.s={fill:document.getElementById('barS'),val:document.getElementById('valS')};
    this.els.e={fill:document.getElementById('barE'),val:document.getElementById('valE')};
    this.ewRow=document.getElementById('ewRow');
  },

  _render(bar){
    const v=Math.min(this.bars[bar],10);
    const el=this.els[bar];
    if(!el.fill)return;
    el.fill.style.width=(v*10)+'%';
    el.val.textContent=v===10?'--':v;
    if(v>=7){el.fill.classList.add('red');el.fill.classList.remove('amber');el.val.className='int-val err';}
    else if(v>=4){el.fill.classList.add('amber');el.fill.classList.remove('red');el.val.className='int-val warn';}
    else{el.fill.classList.remove('amber','red');el.val.className='int-val';}
  },

  raise(bar,amt=1){
    const prev=this.bars[bar];
    this.bars[bar]=Math.min(10,this.bars[bar]+amt);
    if(this.bars[bar]===prev)return;
    this._render(bar);
    this._check(bar,prev);
  },

  _check(bar,prev){
    const v=this.bars[bar];

    /* level 3 SYSTEM -- terminal message */
    if(v>=3&&prev<3&&bar==='s'){
      setTimeout(()=>{
        if(termInputRow&&termInputRow.classList.contains('on')){
          const d=document.createElement('div');d.className='ln dim';
          d.textContent='SECWATCH: Anomalous access pattern detected.  Logging for review.';
          termOutput.insertBefore(d,termInputRow);
          termOutput.scrollTop=termOutput.scrollHeight;
        }
      },3000);
    }

    /* level 5 HARGROVE -- wrong timestamp shows on cams */
    if(v>=5&&prev<5&&bar==='h'){S._wrongTimestamp=true;}

    /* level 5 SYSTEM -- phantom ring, starts repeating */
    if(v>=5&&prev<5&&bar==='s'){
      setTimeout(()=>TL._phantomRing(),45000+Math.random()*60000);
    }

    /* level 6 LKCO -- FOREMAN.LOG gets extra line */
    if(v>=6&&prev<6&&bar==='l'){
      const fl=FS['C:\\SECWATCH\\SITES\\LKCO\\FOREMAN.LOG'];
      if(fl&&!fl.content.includes('[it is not gone]')){
        fl.content=fl.content.replace('Last entry.','Last entry.\n\n  [it is not gone]');
      }
    }

    /* level 7 any bar -- OBSERVER LOGGED on HUD */
    if(v>=7&&prev<7){
      S.observerLogged=true;
      if(camHUD&&camHUD.classList.contains('active')){
        hudAlert.textContent='OBSERVER LOGGED';hudAlert.classList.add('show');
      }
    }

    /* show east wall row when any bar hits 5 */
    if(this.bars.h>=5||this.bars.l>=5||this.bars.s>=5){
      if(this.ewRow)this.ewRow.classList.add('show');
      if(!this.ewTimer)this._startEWTimer();
    }

    /* level 9 SYSTEM -- store flag for day 2 witness.txt */
    if(v>=9&&prev<9&&bar==='s'){
      try{sessionStorage.setItem('sw_tl9','1');}catch(e){}
    }
  },

  _startEWTimer(){
    this.ewTimer=setInterval(()=>this.raise('e',1),3*60*1000);
  },

  _phantomRing(){
    if(S.inputMode!=='cmd')return;
    const prev=commsLabelR.textContent;
    phoneNumber.textContent='???';
    phoneStatus.textContent='INCOMING...';phoneStatus.className='ringing';
    commsLabelR.textContent='LINE: INCOMING';
    playAudio('audio/phone_ring.mp3');
    setTimeout(()=>{
      stopAudio();
      phoneStatus.textContent='MISSED CALL';phoneStatus.className='dead';
      commsLabelR.textContent=prev;
      if(TL.bars.s>=5)setTimeout(()=>TL._phantomRing(),90000+Math.random()*120000);
    },3500);
  },

  onCamOpen(){
    if(S.observerLogged&&camHUD&&camHUD.classList.contains('active')){
      hudAlert.textContent='OBSERVER LOGGED';hudAlert.classList.add('show');
    }
    if(S._wrongTimestamp&&camHUD&&camHUD.classList.contains('active')){
      hudDate.textContent='01/14/94\u00a002:17';
    }
  },
};

/* ════════════════════════════════════════════════════════
   CAMERA REGISTRY
   anim = gif or webp (animated, uses <img> tag -- ALWAYS WORKS)
   img  = still fallback
   To add animation: set anim:'img/camX.gif' and it takes priority
════════════════════════════════════════════════════════ */
const CAMS = {
  cam1:{label:'CAM1',loc:'LOBBY',           img:'img/cam1.png',  /*anim:'img/cam1.gif',*/  online:true},
  cam2:{label:'CAM2',loc:'FL1-EAST',        img:'img/cam2.png',  /*anim:'img/cam2.gif',*/  online:true},
  cam3:{label:'CAM3',loc:'FL2-WEST',        img:'img/cam3.png',  /*anim:'img/cam3.gif',*/  online:true},
  cam4:{label:'CAM4',loc:'FL4-LOBBY',       img:'img/cam4.png',  /*anim:'img/cam4.gif',*/  online:true},
  cam5:{label:'CAM5',loc:'PARKING-STRUCT',  img:'img/cam5.jpg',  anim:'img/cam5.gif',  online:true},
  cam6:{
    label:'CAM6',loc:'FL3-CORRIDOR',
    img:'img/cam6.jpg', /*anim:'img/cam6.gif',*/
    online:false,
    event:{img:'img/cam6_event1.png',ts:'02:19',sig:'SIG: ???',alertText:'SIGNAL RESTORED',dur:6500}
  },
  cam7:{
    label:'CAM7',loc:'TRAILER-EXT-EAST',
    img:'img/cam7.png', anim:'img/cam7.gif',
    online:true,
    event:{
      img:'img/cam7_door_open.png',ts:'02:17',sig:'SIG: OK',alertText:'MOTION REPLAY',dur:5500,
      triggerFn:s=>s.logReads>=1&&!s.trailerEventPlayed,
      onPlay:s=>{s.trailerEventPlayed=true;}
    }
  },
  cam8:{label:'CAM8',loc:'PERIMETER-ROAD',  img:'img/cam8.png',  anim:'img/cam8.gif',  online:true},
  cam9:{
    label:'CAM9',loc:'EAST-WALL-80FT',
    img:'img/cam9.png', anim:'img/cam9.gif',
    online:true, degraded:true,
    event:{
      img:'img/cam9_event1.png',
      surgeSrc:'img/cam9_surge.gif',
      ts:'02:19',sig:'SIG: ???',alertText:'MOTION DETECTED',dur:9000,
      triggerFn:s=>s.sec2Runs>=3&&s.logReads>=1&&!s.cam9EventPlayed,
      onPlay:s=>{s.cam9EventPlayed=true;TL.raise('l',3);TL.raise('e',2);}
    }
  },
};

const SITE_CAMS={hargrove:['cam1','cam2','cam3','cam4','cam5','cam6'],lkco:['cam7','cam8','cam9']};

/* ════════════════════════════════════════════════════════
   PHONE REGISTRY
════════════════════════════════════════════════════════ */
const PHONES = {
  '200':{name:'HARGROVE FRONT DESK',audio:'audio/phone_ring.mp3',rings:12,
    transcript:["[rings 12 times]","[no answer]"]},
  '201':{name:'SECURITY DESK',audio:'audio/phone_busy.mp3',rings:0,
    transcript:["[busy signal]","[You are the security desk.]"]},
  '204':{name:'R. PELLEGRINO -- FACILITIES',audio:'audio/pellegrino_vm.mp3',rings:4,
    transcript:[
      "You've reached Randy Pellegrino, Hargrove Properties.",
      "I'm either away from my desk or on another line.",
      "If this is regarding Commerce Boulevard, the system",
      "has been reactivated tonight and night desk is staffed.",
      "If you're calling about the Letcher County site --",
      "[long pause]",
      "-- leave a number. I'll call you back.",
      "Don't go up to Floor 3.","[beep]"
    ]},
  '107':{name:'LKCO MAINTENANCE RELAY',audio:'audio/maintenance_107.mp3',rings:7,
    transcript:[
      "[wind sound]","[3 seconds of silence]",
      "...maintenance.",
      "[long pause]",
      "...site's been closed since '83.",
      "[line goes dead]"
    ]},
  '099':{name:'[UNKNOWN]',audio:'audio/ext_099.mp3',rings:2,
    transcript:[
      "Hargrove family law.",
      "[pause]",
      "We've been expecting a call.",
      "[pause]",
      "Which file are you calling about?",
      "[pause]",
      "We have a Combs on file. And a Hargrove.",
      "[very long pause]",
      "Don't dig any further.",
      "[click]"
    ]},
  '311':{name:'[UNKNOWN]',audio:'audio/ext_311.mp3',rings:1,
    transcript:[
      "[one ring]",
      "[silence -- 8 seconds]",
      "[a sound like deep earth moving]",
      "[line goes dead]"
    ]},
};

/* ════════════════════════════════════════════════════════
   TAPE REGISTRY
════════════════════════════════════════════════════════ */
const TAPES = {
  'TAPE_01':{label:'E.COMBS -- SITE LOG -- FEB 83',audio:'audio/tape_01.mp3',
    transcript:["February sixteenth. 1983. This is Earl Combs,","site foreman, Kelly Branch Number Two.","I'm recording this because I want there to be","a record that isn't just the computer log.","","The east wall crew hit something today at","about seventy-eight feet. I sent Darnell","and Pete down to probe it. They were down","there maybe twenty minutes.","","They came back and I asked what they found","and Pete said 'Nothing Earl. Just rock.'","And Darnell didn't say anything. Walked to","his truck and sat there until end of shift.","","It wasn't nothing.","","I'm going to backfill it in the morning.","I shouldn't have sent them down there."]},
  'TAPE_02':{label:'E.COMBS -- MARCH 83 -- PERSONAL',audio:'audio/tape_02.mp3',
    transcript:["[mid-sentence -- recorder already running]","-- don't know if it's the same thing my","daddy talked about or something different.","He worked a deep mine over in Harlan in","the fifties. Said there were places in the","earth you could feel before you saw them.","Said the old miners had a name for it but","wouldn't say it out loud.","","I used to think that was superstition.","","[pause]","","The wall is warm. I've put my hand on it","three times now. Nothing down here should","be warm at night in February.","","I'm not going to tell anybody about the wall."]},
  'TAPE_03':{label:'[label handwritten -- partially illegible]',audio:'audio/tape_03.mp3',
    transcript:["It's March tenth. Equipment pulls tomorrow.","","[footsteps stop]","","I've been thinking about what you say to","something like this. To make sure it understands.","","[pause -- wind drops -- sudden silence]","","[quieter, almost to himself]","You can feel it listening.","","[normal voice]","Okay. We're done here. The land is sold.","The people who own it now don't know you're","there. And that's how it's going to stay.","That's the deal. Same as before.","","I need you to let that be enough.","","[long silence]","[something faint that might be wind]","[tape cuts]"]},
  'TAPE_04':{label:'HARGROVE BLDG SEC -- FL3 -- 03/12/91',audio:'audio/tape_04.mp3',
    transcript:["Hargrove Building Security, this is Mike Stroud,","March twelfth 1991, recording for my own file.","I'm on Floor 3, main corridor.","[footsteps echoing in empty hallway]","Nothing in the corridor. Checking Suite 3-C.","Pellegrino said not to go in but I just","want to take a quick look--","[door opens slowly]","...It's dark in here. Smells like --","I don't know what that smell is.","There's something on the wall. Looks like --","[breathing changes suddenly]","-- I'm going to come back with a flashlight.","[static burst]","I'm going to come back with a--","[tape ends abruptly]"]},
  'TAPE_05':{label:'E.COMBS -- OCT 82 -- SITE SURVEY',audio:'audio/tape_05.mp3',
    transcript:["October second, 1982. Earl Combs recording","initial site survey for Kelly Branch site four.","Seam looks good from the surface survey.","Should be a productive season.","Good crew lined up -- Darnell and Pete are","back, Ricky Meade's boy is joining us this","winter.","[sound of wind -- content pause]","I like this part of the county.","Good and quiet.","Yeah.","","Should be a good winter."]},
};

/* ════════════════════════════════════════════════════════
   VIRTUAL FILESYSTEM
════════════════════════════════════════════════════════ */
const FS = {
  'C:\\SECWATCH':{type:'dir',
    children:['DISPATCH.TXT','README.TXT','SEC1.EXE','SEC2.EXE',
              'MOTION.LOG','BADGE.LOG','INCIDENT.RPT','BLDG.CFG','FLOORS','SITES']},
  'C:\\SECWATCH\\README.TXT':{type:'file',content:
`SECWATCH v2.11b -- Hargrove Properties LLC

COMMANDS
  sec1.exe / sec2.exe   Camera interfaces
  type / read [file]    Display file
  dir / cd [dir]        Browse directories
  dial [ext]            Dial phone extension
  play [tape]           Play tape file
  stop                  Stop audio
  scandisk              Run once after login to check for filesystem changes
  cls / help
`},
  'C:\\SECWATCH\\DISPATCH.TXT':{type:'file',content:
`FROM:  R. Pellegrino  ext.204
TO:    Night Desk
DATE:  01/14/94

Aldridge & Carr LLP moves in Monday 01/17.
Verify Hargrove cameras. Check logs.
RE: FLOOR 3. Do not access. You know why.

Also: trespass complaint at LKCO last week.
Run SEC2.EXE. Three feeds. Log it and go home.

The Combs files are old business.
I mean it.

Call me if ANYTHING looks wrong.
ext.204.
`},
  'C:\\SECWATCH\\BLDG.CFG':{type:'file',content:
`; HARGROVE BUSINESS CENTER
[BUILDING]
NAME = HARGROVE BUSINESS CENTER
ADDRESS = 400 Commerce Blvd
FLOORS = 8

[CAMERAS]
TOTAL=6 / ACTIVE=5 / OFFLINE=1
; CAM6 FL3-CORRIDOR SIGNAL LOST 01/14/94 02:19

[PHONE]
FRONT_DESK = ext.200
FACILITIES = ext.204   R. Pellegrino
SECURITY   = ext.201
`},
  'C:\\SECWATCH\\MOTION.LOG':{type:'file',content:
`MOTION LOG -- HARGROVE BUSINESS CENTER
08/14/91  17:58  CAM1  LOBBY  [authorized]
  [Building sealed 08/15/91]
01/13/94  11:47  CAM6  FL3-CORRIDOR  MOTION: YES
01/14/94  02:17  CAM6  FL3-CORRIDOR  MOTION: YES
01/14/94  02:19  CAM6  FL3-CORRIDOR  SIGNAL LOST
END OF LOG
`},
  'C:\\SECWATCH\\BADGE.LOG':{type:'file',content:
`BADGE LOG -- HARGROVE BUSINESS CENTER
08/14/91  07:11  Badge #0023  MAIN ENTRANCE  GRANTED
08/14/91  17:55  Badge #0023  MAIN ENTRANCE  EXIT
  [All access suspended 08/15/91]
01/14/94  02:17  Badge #0047  FL3 STAIRWELL  GRANTED
!! Badge #0047 DEACTIVATED 03/15/91
!! Reason: EMPLOYEE DEPARTURE
!! Employee: D. HARGROVE
END OF LOG
`},
  'C:\\SECWATCH\\INCIDENT.RPT':{type:'file',content:
`INCIDENT REPORT #91-0047 -- HARGROVE BUSINESS CENTER
Date: 03/16/91  Filed By: R. Pellegrino

[REDACTED] discovered near Suite 3-[REDACTED].
Emergency services: [REDACTED].
14 pages handwritten notes -- SEALED
Case No. [REDACTED]

Floor 3 sealed. Badge #0047 deactivated 03/15/91.

--
Note appended 01/14/94  23:02  R. Pellegrino

  "If you are reading this after tonight, stop.
   Close this file. If the camera is gone,
   leave the building. Call me first.
   ext.204."
`},
  'C:\\SECWATCH\\FLOORS':{type:'dir',
    children:['CAMS.TXT','FLOOR3.DAT']
    /* TAPE_04.MP3 injected after player reads INCIDENT.RPT */
  },
  'C:\\SECWATCH\\FLOORS\\CAMS.TXT':{type:'file',content:
`CAM1 LOBBY           Ground Floor
CAM2 FL1-EAST        Floor 1, East Corridor
CAM3 FL2-WEST        Floor 2, West Corridor
CAM4 FL4-LOBBY       Floor 4, Central Hub
CAM5 PARKING-STRUCT  Exterior, Lot B
CAM6 FL3-CORRIDOR    Floor 3  !! OFFLINE
`},
  'C:\\SECWATCH\\FLOORS\\FLOOR3.DAT':{type:'file',content:
`!! ACCESS RESTRICTED
!! FLOOR 3 SEALED BY COURT ORDER
Contact ext.204. DO NOT ACCESS.
`},
  'C:\\SECWATCH\\FLOORS\\TAPE_04.MP3':{type:'audio',tape:'TAPE_04',content:
`[AUDIO FILE -- found on Floor 3, dated 03/12/91]
Type: play TAPE_04 to listen
WARNING: contents have not been reviewed by management
`},
  'C:\\SECWATCH\\SITES':{type:'dir',children:['LKCO']},
  'C:\\SECWATCH\\SITES\\LKCO':{type:'dir',
    /* COMBS.TXT injected after 2nd visit. TAPE_05 after COMBS appears. */
    children:['SITE94.CFG','README.TXT','FOREMAN.LOG',
              'GEOL.RPT','EXCAVATION.LOG','INCIDENT.RPT','CAMS.TXT',
              'TAPE_01.MP3','TAPE_02.MP3','TAPE_03.MP3']},
  'C:\\SECWATCH\\SITES\\LKCO\\README.TXT':{type:'file',content:
`LKCO-04 LETCHER COUNTY STRIP SITE
Node: SECWATCH v1.8c (1981 hardware)
Last sync: 03/11/83

type SITE94.CFG / FOREMAN.LOG / GEOL.RPT
type EXCAVATION.LOG / INCIDENT.RPT
play TAPE_01 / TAPE_02 / TAPE_03

CAMERAS via SEC2.EXE: CAM7 CAM8 CAM9
PHONE: ext.107 (LKCO maintenance relay)
`},
  'C:\\SECWATCH\\SITES\\LKCO\\SITE94.CFG':{type:'file',content:
`; LKCO SITE CONFIG  last modified 03/11/83 by E.COMBS
[PROPERTY]
ID=LKCO-04 / COUNTY=LETCHER KY / STATUS=INACTIVE
[PERSONNEL]
FOREMAN=E.COMBS Badge #0088 / STATUS=[REDACTED]
CONTACT=ext.107 (LKCO maintenance relay)
[NOTES]
; Do not excavate east wall. See GEOL.RPT.
; Do not excavate east wall.
; Do not excavate east wall.
`},
  'C:\\SECWATCH\\SITES\\LKCO\\FOREMAN.LOG':{type:'file',content:
`------------------------------------------------------------
OFFICIAL SITE LOG: HARGROVE BIZ CTR / LKCO-04 STRIP SITE
FOREMAN: COMBS, E. (ID: 8842)
PERIOD: 01/10/94 - 01/15/94
------------------------------------------------------------

01/10/94:
Routine maintenance on CAM9 (East Wall). Heavy precipitation causing 
minor runoff issues. Ground team reports "humming" near the old 
mine shaft entrance. Likely a transformer issue. Pellegrino notified.

01/12/94:
Suite 3-C lock is failing again. This is the third time this week. 
I’ve propped it with a folding chair for now. I don't care what 
corporate says, that floor smells like ozone and wet copper. 
It’s giving the night shift headaches.

01/13/94:
Chloe didn't come home last night. Her friends said they were 
going up to the LKCO ridge to "see the lights." I told her a 
thousand times that ground is unstable. If she’s hiding in the 
tunnels, I’ll find her myself. 

01/14/94:
I spent six hours at the East Wall. The concrete is 88 degrees. 
Ambient temperature is 28. There is no electrical wiring in that 
section of the foundation. I put my ear to the slab. It’s not a 
hum. It’s a pulse. 

01/15/94 (FINAL ENTRY):
I saw David Hargrove on CAM6 tonight. He was wearing the same 
suit he was buried in. He didn't use a key. He just walked 
through the door into 3-C. 

I’m going down to the East Wall one last time. I’m taking the 
heavy flashlight and the master badge. If Chloe is where I 
think she is, she isn't "missing." She's just on the other side.

Pellegrino: If you find this, don't turn off the terminal. 
If the SECWATCH cycle breaks, the wall stops holding. 
------------------------------------------------------------
  [Badge #0088 last: 03/11/83 07:14]
  [E.Combs whereabouts: UNKNOWN    ]
`},
  'C:\\SECWATCH\\SITES\\LKCO\\GEOL.RPT':{type:'file',content:
`GEOLOGICAL SURVEY -- LKCO-04
Appalachian Land Survey Co. / Nov 1982

EAST WALL: Anomalous reading 76-84ft depth.
Not consistent with void, pocket, or water.
Not consistent with any known formation.
Survey team declined to probe directly.
Recommendation: Do not excavate east wall.

ADDENDUM 04/14/83: Request to return declined.
We will not be returning to this site.
`},
  'C:\\SECWATCH\\SITES\\LKCO\\EXCAVATION.LOG':{type:'file',content:
`EQUIPMENT LOG -- LKCO-04
02/16/83 09:51  DOZER-1  EMERGENCY STOP
02/16/83 09:51  DOZER-2  EMERGENCY STOP
02/16/83 09:52  DOZER-1  OPERATING [manual override]
02/16/83 10:04  DOZER-1  SHUTDOWN
  [No log 02/17 through 02/22]
02/22/83 11:03  DOZER-1  SHUTDOWN
02/22/83 11:03  DOZER-2
`},
  'C:\\SECWATCH\\SITES\\LKCO\\INCIDENT.RPT':{type:'file',content:
`INCIDENT REPORT -- LKCO-04
Filed: 03/16/83  R. Pellegrino

Sheriff wellness check 03/14/83.
Trailer occupied. Combs not present.
SECWATCH terminal on and logged in.
14 pages handwritten notes. Sealed.
One photograph face-down.

Whereabouts of E.Combs: UNKNOWN.
East wall bench area was not searched.
It was not searched.

--
Note appended 01/14/94  R. Pellegrino

  Earl.
  If this is somehow you I am sorry.
  I should have listened in March.
  The new people don't know about the wall.
  I need you to let that be enough.
`},
  'C:\\SECWATCH\\SITES\\LKCO\\CAMS.TXT':{type:'file',content:
`CAM7 TRAILER-EXT-EAST  door side
CAM8 PERIMETER-ROAD    access road
CAM9 EAST-WALL-80FT    80-foot bench

NOTE: CAM9 signal degraded.
      This has always been normal.
`},
  'C:\\SECWATCH\\SITES\\LKCO\\TAPE_01.MP3':{type:'audio',tape:'TAPE_01',content:`[AUDIO] E.COMBS FEB 83 -- play TAPE_01`},
  'C:\\SECWATCH\\SITES\\LKCO\\TAPE_02.MP3':{type:'audio',tape:'TAPE_02',content:`[AUDIO] E.COMBS MARCH 83 -- play TAPE_02`},
  'C:\\SECWATCH\\SITES\\LKCO\\TAPE_03.MP3':{type:'audio',tape:'TAPE_03',content:`[AUDIO] FINAL RECORDING -- play TAPE_03`},
  'C:\\SECWATCH\\SITES\\LKCO\\TAPE_05.MP3':{type:'audio',tape:'TAPE_05',content:`[AUDIO] E.COMBS OCT 82 PRE-SURVEY -- play TAPE_05`},
  /* ghost files */
  'C:\\SECWATCH\\SITES\\LKCO\\COMBS.TXT':{type:'file',content:
`03/11/83  07:14

it is not a wall.
it is a scab.
we kept picking at it until the earth started to bleed.
chloe is calling from the vents.
she says it is warm in the deep.
DO NOT LOOK AT THE CRACKS.
KEEP THE SYSTEM RUNNING.

03/11/83  07:14
`},
};

/* ════════════════════════════════════════════════════════
   END OF DAY 1 CHECK
   Runs after every command. Triggers once all conditions met.
════════════════════════════════════════════════════════ */
function checkEndDay1() {
  if (S.endDay1Triggered) return;
  
  // ADD THIS LINE: Prevent the day from ending while audio is playing
  if (currentAudio) return; 

  if (S.cam6EventPlayed && S.cam9EventPlayed &&
      S.ghostFileIn && S.logReads >= 1 && S.tapePlayCount >= 1) {
    S.endDay1Triggered = true;
    setTimeout(runEndDay1, 2000);
  }
}

async function runEndDay1() {
  hideInput();
  stopAudio();
  await sleep(1200);
  await signalLossClose(600);
  await sleep(600);
  ln('');
  ln('  -----------------------------------------------','dim');
  await sleep(500);
  ln('  SYSTEM: No further motion events detected.','dim');
  await sleep(700);
  ln('  SYSTEM: All feeds stable.','dim');
  await sleep(600);
  ln('  SYSTEM: Shift end -- 01/16/94  06:14','dim');
  await sleep(1400);
  termOutput.innerHTML='';
  await sleep(400);
  ln('');ln('');
  await lnSlow('  SECWATCH SHIFT LOG -- HARGROVE PROPERTIES','hi',20);
  await sleep(300);
  ln('  Night of 01/15/94  to  Morning of 01/16/94','hi');
  await sleep(700);
  ln('');
  ln('  INCIDENTS LOGGED:  3','warn');
  ln('  CAMERA FAILURES:   1  (FL3-CORRIDOR)','warn');
  ln('  BADGE VIOLATIONS:  1  (Badge #0047 -- DEACTIVATED 1991)','err');
  ln('');
  await sleep(1000);
  await lnSlow('  All incidents forwarded to R. Pellegrino.','',18);
  await sleep(600);
  await lnSlow('  Hargrove Properties has been notified.','',18);
  await sleep(1400);
  ln('');
  ln('  -----------------------------------------------','dim');
  await sleep(700);
  await lnSlow('  Aldridge & Carr LLP tenancy begins Monday.','dim',18);
  await sleep(500);
  await lnSlow("  They don't know about Floor 3.",'warn',22);
  await sleep(400);
  await lnSlow("  They don't know about Earl.",'warn',22);
  await sleep(800);
  await lnSlow("  Nobody told them about the wall.",'err',26);
  await sleep(2200);
  ln('');ln('');
  const card = document.createElement('div');
  card.className='ln hi';
  Object.assign(card.style,{fontSize:'1.3em',letterSpacing:'0.2em',textAlign:'center',textShadow:'0 0 14px var(--g),0 0 32px rgba(51,255,51,0.5)'});
  card.textContent='END OF DAY 1';
  termOutput.appendChild(card);
  termOutput.scrollTop=termOutput.scrollHeight;
  await sleep(2200);
  const sub = document.createElement('div');
  sub.className='ln dim';
  Object.assign(sub.style,{textAlign:'center',letterSpacing:'0.1em',marginTop:'8px'});
  sub.textContent='LOADING DAY 2...';
  termOutput.appendChild(sub);
  termOutput.scrollTop=termOutput.scrollHeight;
  await sleep(2800);
  if(typeof SW!=='undefined')SW.setBars(TL.bars);
  window.location.href='day2.html';
}

/* ════════════════════════════════════════════════════════
   DOM REFS
════════════════════════════════════════════════════════ */
const camFeed=document.getElementById('camFeed');
const camAcquire=document.getElementById('camAcquire');
const camNoFeed=document.getElementById('camNoFeed');
const camHUD=document.getElementById('camHUD');
const camBar=document.getElementById('camBar');
const camFrame=document.getElementById('camFrame');
const camLabelR=document.getElementById('camLabelRight');
const hudCamID=document.getElementById('hudCamID');
const hudLoc=document.getElementById('hudLoc');
const hudDate=document.getElementById('hudDate');
const hudSig=document.getElementById('hudSig');
const hudAlert=document.getElementById('hudAlert');
const phoneNumber=document.getElementById('phoneNumber');
const phoneStatus=document.getElementById('phoneStatus');
const commsLabelR=document.getElementById('commsLabelRight');
const tapeName=document.getElementById('tapeName');
const tapeStatus=document.getElementById('tapeStatus');
const tapeBar=document.getElementById('tapeBar');
const transcript=document.getElementById('transcript');
const termOutput=document.getElementById('termOutput');
const termInputRow=document.getElementById('termInputRow');
const termPrompt=document.getElementById('termPrompt');
const termTyped=document.getElementById('termTyped');
const termLabelR=document.getElementById('termLabelRight');
const ghost=document.getElementById('ghost');

/* ════════════════════════════════════════════════════════
   AUDIO ENGINE
════════════════════════════════════════════════════════ */
let currentAudio=null, tapeInterval=null, phoneTimeout=null;

function playAudio(src,loop=false){
  stopAudio();
  currentAudio=new Audio(src);
  currentAudio.loop=loop;
  currentAudio.volume=0.85;
  currentAudio.play().catch(()=>{});
  return currentAudio;
}
function stopAudio(){
  if(currentAudio){currentAudio.pause();currentAudio.src='';currentAudio=null;}
  clearInterval(tapeInterval);clearTimeout(phoneTimeout);
  tapeBar.style.width='0%';
}
function setTranscript(lines,cls=''){
  transcript.innerHTML='';
  transcript.className=cls||'';
  lines.forEach(l=>{
    const d=document.createElement('div');
    d.textContent=l||'\u00a0';
    d.style.lineHeight='1.55';d.style.fontSize='0.88em';
    transcript.appendChild(d);
  });
  transcript.scrollTop=0;
}

async function runDial(ext){
  const entry=PHONES[ext];
  S.dialAttempts++;
  if(entry)if(typeof SW!=='undefined')SW.find('EXT_'+ext);
  phoneNumber.textContent=ext.padStart(3,'0');
  commsLabelR.textContent='LINE: DIALING';
  playAudio('audio/phone_dial.mp3');
  phoneStatus.textContent='DIALING...';phoneStatus.className='';
  await sleep(1200);
  if(!entry){
    stopAudio();
    phoneStatus.textContent='RINGING...';phoneStatus.className='ringing';
    commsLabelR.textContent='LINE: RINGING';
    playAudio('audio/phone_ring.mp3',true);
    await sleep((2+Math.floor(Math.random()*3))*2200);
    stopAudio();
    playAudio('audio/wrong_number.mp3');
    phoneStatus.textContent='CONNECTED';phoneStatus.className='connected';
    commsLabelR.textContent='LINE: CONNECTED';
    setTranscript(['"Yeah?"','[pause]','"You got the wrong number."','[click]'],'active');
    await sleep(3500);
    stopAudio();
    phoneStatus.textContent='LINE DISCONNECTED';phoneStatus.className='dead';
    commsLabelR.textContent='LINE: IDLE';return;
  }
  if(entry.rings===0){
    playAudio('audio/phone_busy.mp3',true);
    phoneStatus.textContent='BUSY';phoneStatus.className='ringing';
    commsLabelR.textContent='LINE: BUSY';
    setTranscript(entry.transcript);
    await sleep(4000);stopAudio();
    phoneStatus.textContent='LINE DISCONNECTED';phoneStatus.className='dead';
    commsLabelR.textContent='LINE: IDLE';return;
  }
  phoneStatus.textContent='RINGING...';phoneStatus.className='ringing';
  commsLabelR.textContent='LINE: RINGING';
  playAudio('audio/phone_ring.mp3',true);
  await sleep(entry.rings*2200);
  stopAudio();playAudio('audio/phone_pickup.mp3');
  await sleep(400);
  phoneStatus.textContent='CONNECTED';phoneStatus.className='connected';
  commsLabelR.textContent='LINE: CONNECTED';
  setTranscript(entry.transcript,'active');
  await sleep(300);
  playAudio(entry.audio);
  await new Promise(r=>{
    if(currentAudio){currentAudio.onended=r;} 
    else r();
  });
  stopAudio();playAudio('audio/phone_hangup.mp3');
  await sleep(600);stopAudio();
  phoneStatus.textContent='LINE DISCONNECTED';phoneStatus.className='dead';
  commsLabelR.textContent='LINE: IDLE';
}

async function runPlayTape(key){
  const tape=TAPES[key];
  if(!tape){ln('  Tape not found: '+key,'err');return;}
  stopAudio();
  S.tapePlayCount++;
  if(typeof SW!=='undefined')SW.find(key);
  if(key==='TAPE_03')TL.raise('l',1);
  if(key==='TAPE_04')TL.raise('h',2);
  if(key==='TAPE_05')TL.raise('l',1);
  tapeName.textContent=tape.label;
  tapeStatus.textContent='LOADING...';
  tapeBar.style.width='0%';
  setTranscript(['[LOADING TAPE...]']);
  await sleep(700);
  tapeStatus.textContent='> PLAYING';
  setTranscript(tape.transcript,'active');
  const a=playAudio(tape.audio);
  tapeInterval=setInterval(()=>{
    if(!currentAudio||!currentAudio.duration)return;
    tapeBar.style.width=(currentAudio.currentTime/currentAudio.duration*100)+'%';
  },500);
  if(a){
    a.onended = () => {
      clearInterval(tapeInterval);
      tapeStatus.textContent='STOPPED';
      tapeBar.style.width='100%';
      
      // ADD THESE TWO LINES:
      currentAudio = null; 
      checkEndDay1(); 
    };
  }
}

/* ════════════════════════════════════════════════════════
   CAMERA ENGINE  --  anim (gif/webp) takes priority over img
════════════════════════════════════════════════════════ */
function buildCamBar(site){
  S.activeSite=site;
  camBar.innerHTML='';
  SITE_CAMS[site].forEach(k=>{
    const c=CAMS[k];
    const btn=document.createElement('span');
    btn.className='cam-btn '+(c.online?'online':'offline');
    btn.id='btn_'+k;
    btn.textContent=c.label+(c.online?'':' [OFF]');
    camBar.appendChild(btn);
    const sep=document.createElement('span');
    sep.style.color='var(--border)';sep.textContent=' | ';
    camBar.appendChild(sep);
  });
  
  // NEW: Add a clickable EXIT button for tablet users
  const exitBtn = document.createElement('span');
  exitBtn.className = 'cam-btn';
  exitBtn.id = 'btn_exit';
  exitBtn.style.color = 'var(--amb)';
  exitBtn.textContent = '[EXIT]';
  camBar.appendChild(exitBtn);

  const hint=document.createElement('span');
  hint.style.color='var(--gdim)';
  hint.style.marginLeft='8px';
  hint.textContent='TYPE: '+SITE_CAMS[site].map(k=>CAMS[k].label.replace('CAM','')).join(' / ');
  camBar.appendChild(hint);
  
  camLabelR.textContent=site==='lkco'?'LKCO-04 LETCHER CO.':'HARGROVE BIZ CTR';
}

function setHUD(camLabel,loc,ts,sig,alert=''){
  hudCamID.textContent=camLabel;hudLoc.textContent=loc;
  hudDate.textContent=DATE_STR+'\u00a0\u00a0'+ts;
  hudSig.textContent=sig;
  hudSig.className=sig.includes('WEAK')||sig.includes('???')?'weak':sig.includes('LOST')?'lost':'';
  hudAlert.textContent=alert;hudAlert.classList.toggle('show',!!alert);
}

function setCamActive(key){
  if(S.activeCamKey){const o=document.getElementById('btn_'+S.activeCamKey);if(o)o.classList.remove('active');}
  S.activeCamKey=key;
  if(key){const b=document.getElementById('btn_'+key);if(b)b.classList.add('active');}
}

async function acquireFeed(cam){
  camFeed.classList.remove('active','degraded','surge');
  camFeed.src='';
  camNoFeed.classList.add('hidden');
  camAcquire.classList.add('active');
  camHUD.classList.remove('active');
  camFrame.classList.remove('signal-loss');

  /* anim (gif/webp) takes priority, then img */
  const src=cam.anim||cam.img;

  await new Promise(r=>{const t=new Image();t.onload=t.onerror=r;t.src=src;});
  await sleep(cam.degraded?1600:900);

  camAcquire.classList.remove('active');
  camFeed.src=src;
  camFeed.classList.add('active');
  if(cam.degraded)camFeed.classList.add('degraded');

  const sig=cam.degraded?'SIG: WEAK':'SIG: OK';
  setHUD(cam.label,cam.loc,TIME_STR,sig);
  camHUD.classList.add('active');
  TL.onCamOpen();

  if(cam.degraded&&S.cam9Viewed===1){playAudio('audio/cam9_static.mp3');}
}

async function signalLossClose(ms=750){
  camFrame.classList.add('signal-loss');
  await sleep(ms);
  camFeed.classList.remove('active','degraded','surge');
  camFeed.src='';
  camNoFeed.classList.remove('hidden');
  camHUD.classList.remove('active');
  camFrame.classList.remove('signal-loss');
  setCamActive(null);stopAudio();
}

async function switchFeedImg(src){
  camFeed.style.opacity='0';
  await sleep(150);
  await new Promise(r=>{const t=new Image();t.onload=t.onerror=r;t.src=src;});
  camFeed.src=src;
  camFeed.style.opacity='1';
}

async function showCam(camKey){
  const cam=CAMS[camKey];if(!cam)return;
  setCamActive(camKey);
  if(!cam.online){
    if(!S.cam6EventPlayed)await runCam6Event();
    else ln('  CAM6 -- signal lost. Feed unrecoverable.','err');
    return;
  }
  await acquireFeed(cam);
  const evt=cam.event;
  if(evt&&evt.triggerFn&&evt.triggerFn(S)){
    await sleep(1500);
    hudAlert.textContent=evt.alertText;hudAlert.classList.add('show');
    evt.onPlay&&evt.onPlay(S);
    await sleep(900);

    /* cam9 surge if asset available */
    if(cam===CAMS.cam9&&evt.surgeSrc){
      camFeed.classList.remove('degraded');
      camFeed.classList.add('surge');
      await switchFeedImg(evt.surgeSrc);
      await sleep(2500);
      camFeed.classList.remove('surge');
      camFeed.classList.add('degraded');
    }

    await switchFeedImg(evt.img);
    hudDate.textContent=DATE_STR+'\u00a0\u00a0'+evt.ts;
    hudSig.textContent=evt.sig;hudSig.className='weak';
    await sleep(evt.dur);

    if(cam===CAMS.cam9){
      await signalLossClose(800);
      ln('  CAM9 -- signal lost.','err');ln('');
    } else {
      hudAlert.classList.remove('show');
      ln('  CAM7 -- 02:17 motion replay.','warn');
      ln('  Trailer door: OPEN.','err');
      ln('  CAM8 access road: no vehicle recorded.','err');ln('');
    }
  }
}

async function runCam6Event(){
  S.cam6EventPlayed=true;
  TL.raise('h',2);TL.raise('s',1);
  const cam=CAMS.cam6,evt=cam.event;
  camNoFeed.classList.add('hidden');
  camAcquire.textContent='RECONNECTING...';
  camAcquire.classList.add('active');
  camHUD.classList.remove('active');
  setHUD(cam.label,cam.loc,TIME_STR,'SIG: ---');
  camHUD.classList.add('active');
  await sleep(2400);
  await acquireFeed(cam);
  setHUD(cam.label,cam.loc,evt.ts,'SIG: WEAK',evt.alertText);
  camAcquire.textContent='ACQUIRING SIGNAL...';
  await sleep(2400);
  await switchFeedImg(evt.img);
  hudSig.textContent=evt.sig;hudSig.className='weak';
  await sleep(evt.dur);
  await signalLossClose(800);
  ln('  CAM6 -- signal lost. Feed unrecoverable.','err');ln('');
}

/* ════════════════════════════════════════════════════════
   TERMINAL ENGINE
════════════════════════════════════════════════════════ */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function ln(text='',cls=''){
  const d=document.createElement('div');
  d.className='ln'+(cls?' '+cls:'');
  d.textContent=text;
  termOutput.appendChild(d);
  termOutput.scrollTop=termOutput.scrollHeight;
}
async function lnSlow(text,cls='',ms=12){
  const d=document.createElement('div');
  d.className='ln'+(cls?' '+cls:'');d.textContent='';
  termOutput.appendChild(d);
  for(const ch of text){d.textContent+=ch;termOutput.scrollTop=termOutput.scrollHeight;await sleep(ms);}
}
function showInput(p){
  termPrompt.textContent=p||S.cwd+'> ';
  termTyped.textContent=S.inputBuf='';
  ghost.value=''; // ADD THIS: Clears the hidden mobile input
  termInputRow.classList.add('on');
  termLabelR.textContent=S.cwd;
  ghost.style.pointerEvents='auto';
  setTimeout(() => ghost.focus(), 50); // Small delay helps mobile keyboards pop up
}
function hideInput(){termInputRow.classList.remove('on');ghost.style.pointerEvents='none';}
function resolvePath(n){
  if(!n)return S.cwd;const u=n.toUpperCase();
  if(u==='..'){const p=S.cwd.split('\\');return p.length<=2?S.cwd:p.slice(0,-1).join('\\');}
  return S.cwd+'\\'+u;
}
/*
    ghost.addEventListener('keydown',e=>{
      if(!termInputRow.classList.contains('on'))return;
      if(S.inputMode==='any'){const r=_res;_res=null;S.inputMode='cmd';hideInput();r();return;}
      if(S.inputMode==='login'){
        if(/^\d$/.test(e.key)&&S.inputBuf.length<4){S.inputBuf+=e.key;termTyped.textContent=S.inputBuf;}
        else if(e.key==='Backspace'){S.inputBuf=S.inputBuf.slice(0,-1);termTyped.textContent=S.inputBuf;}
        else if(e.key==='Enter'&&S.inputBuf.length>=1){
          const v=S.inputBuf;hideInput();ln('BADGE #: '+v,'echo');
          const r=_res;_res=null;S.inputMode='cmd';r(v);}
        return;
      }
      if(S.inputMode==='cmd'){
        if(e.key==='Enter'){
          const cmd=S.inputBuf.trim();hideInput();
          if(cmd)ln(S.cwd+'> '+cmd,'echo');
          S.inputBuf='';
          if(cmd)handleCmd(cmd);else showInput();
        }else if(e.key==='Backspace'){S.inputBuf=S.inputBuf.slice(0,-1);termTyped.textContent=S.inputBuf;}
        else if(e.key.length===1){S.inputBuf+=e.key;termTyped.textContent=S.inputBuf;}
      }
    });
    document.addEventListener('click',()=>{if(termInputRow.classList.contains('on'))ghost.focus();});
    document.addEventListener('keydown',()=>{const d=new Audio();d.volume=0;d.play().catch(()=>{});},{once:true});
*/

// 1. NEW: Captures text from mobile virtual keyboards
ghost.addEventListener('input', e => {
  if (!termInputRow.classList.contains('on')) return;
  if (S.inputMode === 'cmd' || S.inputMode === 'login') {
    // Sync our visual buffer directly with the hidden input's value
    S.inputBuf = ghost.value;
    termTyped.textContent = S.inputBuf;
  }
});

// 2. UPDATED: Handles 'Enter' and terminal navigation
ghost.addEventListener('keydown', e => {
  if (!termInputRow.classList.contains('on')) return;
  
  if (S.inputMode === 'any') {
    const r=_res;_res=null;S.inputMode='cmd';hideInput();r();return;
  }
  
  if (e.key === 'Enter') {
    e.preventDefault(); // Stops mobile keyboards from doing weird things
    if (S.inputMode === 'login') {
      const v = S.inputBuf; hideInput(); ln('BADGE #: ' + v, 'echo');
      const r = _res; _res = null; S.inputMode = 'cmd'; r(v);
    } else if (S.inputMode === 'cmd') {
      const cmd = S.inputBuf.trim(); hideInput();
      if (cmd) ln(S.cwd + '> ' + cmd, 'echo');
      S.inputBuf = '';
      ghost.value = ''; // Clear it out
      if (cmd) handleCmd(cmd); else showInput();
    }
  }
});
document.addEventListener('click', () => { if(termInputRow.classList.contains('on')) ghost.focus(); });
document.addEventListener('touchstart', () => { if(termInputRow.classList.contains('on')) ghost.focus(); }, {passive: true});
document.addEventListener('keydown', () => { const d=new Audio(); d.volume=0; d.play().catch(()=>{}); }, {once:true});
// NEW: Make the Camera Bar fully touch/click interactive
camBar.addEventListener('click', e => {
  // Only register clicks if the player is currently inside SEC1 or SEC2
  if (S.inputMode !== 'any' || !_res) return;
  
  const btn = e.target.closest('.cam-btn');
  if (!btn) return; // They clicked the background, not a button

  // If they clicked the [EXIT] button
  if (btn.id === 'btn_exit') {
    const rr = _res; _res = null; S.inputMode = 'cmd'; hideInput(); rr('exit');
    return;
  }

  // If they clicked a camera button (extract '1' from 'btn_cam1')
  const camId = btn.id.replace('btn_cam', '');
  const nums = SITE_CAMS[S.activeSite].map(k => k.replace('cam', ''));
  
  // If the camera is valid for this site, trigger it
  if (nums.includes(camId)) {
    const rr = _res; _res = null; S.inputMode = 'cmd'; hideInput(); rr(camId);
  }
});
/* ════════════════════════════════════════════════════════
   COMMANDS
════════════════════════════════════════════════════════ */
async function handleCmd(raw){
  const parts=raw.trim().split(/\s+/);
  const cmd=parts[0].toLowerCase();
  const arg=parts.slice(1).join(' ').toUpperCase();

  switch(cmd){
    case 'cls':termOutput.innerHTML='';break;
    case 'ver':ln('');ln('SECWATCH OS  v2.11b  (C) 1989 ClearPath Systems','hi');ln('');break;
    case 'date':ln('');ln('Date: '+DATE_STR);ln('Time: '+TIME_STR);ln('');break;
    case 'help':case'?':
      ln('');
      ln('  sec1.exe / sec2.exe  Camera interfaces');
      ln('  dir                  List directory');
      ln('  cd [name]            Change directory (cd .. = up)');
      ln('  type / read [file]   Display file');
      ln('  dial [ext]           Dial phone (try: 204, 107, 099, 311)');
      ln('  play [tape]          Play tape (TAPE_01 through TAPE_05)');
      ln('  stop                 Stop audio');
      ln('  scandisk             Disk check');
      ln('  cls / ver / date');
      ln('');break;
    case 'stop':
      stopAudio();tapeStatus.textContent='STOPPED';commsLabelR.textContent='LINE: IDLE';
      ln('  Audio stopped.','dim');break;
    case 'dial':
      if(!arg){ln('Usage: dial [extension]','warn');break;}
      ln('');hideInput();
      if(arg==='099')TL.raise('s',2);
      if(arg==='311'){TL.raise('s',2);TL.raise('e',1);}
      await runDial(arg.replace(/\D/g,''));break;
    case 'play':{
      if(!arg){ln('Usage: play [TAPE_01 .. TAPE_05]','warn');break;}
      const key=arg.replace('.MP3','').replace('.WAV','');
      ln('');hideInput();await runPlayTape(key);break;
    }
    case 'dir':{
      const node=FS[S.cwd];
      if(!node||node.type!=='dir'){ln('Path error.','err');break;}
      /* ghost file + hidden tape injection */
      if(S.cwd==='C:\\SECWATCH\\SITES\\LKCO'){
        S.lkcoVisits++;
        if(S.lkcoVisits>=2&&!S.ghostFileIn){
          S.ghostFileIn=true;
          if(!node.children.includes('COMBS.TXT'))node.children.push('COMBS.TXT');
          await sleep(700);
          const f=document.createElement('div');f.className='ln warn';f.textContent='  --';
          termOutput.appendChild(f);await sleep(200);termOutput.removeChild(f);
        }
        if(S.ghostFileIn&&!S.tape05Unlocked){
          S.tape05Unlocked=true;
          if(!node.children.includes('TAPE_05.MP3'))node.children.push('TAPE_05.MP3');
        }
      }
      if(S.cwd==='C:\\SECWATCH\\FLOORS'&&S.incidentRptRead&&!S.tape04Unlocked){
        S.tape04Unlocked=true;
        if(!node.children.includes('TAPE_04.MP3'))node.children.push('TAPE_04.MP3');
        await sleep(400);
        ln('  SYSTEM: 1 new file recovered from archived storage.','warn');
      }
      ln('');ln(' Directory of '+S.cwd);ln('');
      for(const name of node.children){
        const fp=S.cwd+'\\'+name;const ch=FS[fp];
        const cls=name==='COMBS.TXT'?'warn':name.endsWith('.MP3')||name.endsWith('.WAV')?'sys':'';
        if(ch?.type==='dir')ln(' <DIR>  '+name,'hi');
        else ln('        '+name,cls);
      }
      ln('');ln('  '+node.children.length+' item(s)');ln('');break;
    }
    case 'cd':{
      if(!arg){ln(S.cwd);break;}
      const t=resolvePath(arg);
      if(FS[t]?.type==='dir'){S.cwd=t;termPrompt.textContent=S.cwd+'> ';termLabelR.textContent=S.cwd;}
      else ln('Invalid directory or access denied.','err');
      break;
    }
    case 'read':
    case 'type':{
      if(!arg){ln('Usage: type (or read) [filename]','warn');break;}
      const fp=S.cwd+'\\'+arg;const f=FS[fp];
      if(!f){ln('File not found: '+arg,'err');break;}
      // ... the rest of the file reading logic stays exactly the same
      if(f.type==='dir'){ln('Is a directory.','warn');break;}
      if(f.type==='audio'){ln('');ln('[AUDIO FILE]  Use: play '+f.tape,'sys');ln('');break;}
      if(typeof SW!=='undefined')SW.find(arg);
      /* track reads + threat level */
      if(arg==='FOREMAN.LOG'){S.logReads++;TL.raise('l',1);}
      if(arg==='BADGE.LOG'){S.badgeLogRead=true;TL.raise('h',1);}
      if(arg.includes('INCIDENT.RPT')&&S.cwd.includes('SECWATCH')&&!S.cwd.includes('LKCO')){S.incidentRptRead=true;TL.raise('h',1);}
      if(arg==='COMBS.TXT'){TL.raise('l',2);TL.raise('s',1);}
      if(arg==='GEOL.RPT')TL.raise('l',1);
      if(arg==='EXCAVATION.LOG')TL.raise('l',1);
      ln('');
      for(const line of f.content.split('\n')){
        const c=line.startsWith('!!')?'err':line.includes('[REDACTED]')?'warn':line.match(/^;/)?'dim':line.match(/^\s*\[.*\]\s*$/)?'hi':(line.startsWith('it ')||line.startsWith('i ')||line.startsWith('the wall'))?'warn':'';
        ln(line,c);
      }
      ln('');break;
    }
    case 'scandisk':await runScandisk();break;
    case 'sec1.exe':case 'sec1':await runSec1();break;
    case 'sec2.exe':case 'sec2':await runSec2();break;
    default:ln('');ln("'"+parts[0]+"' is not recognized.",'err');ln('Type HELP for commands.','dim');ln('');
  }
  showInput();
  checkEndDay1();
}

/* ════════════════════════════════════════════════════════
   SEC1 / SEC2 / SCANDISK
════════════════════════════════════════════════════════ */
async function runSec1(){
  ln('');await lnSlow('Initializing HARGROVE camera node...','dim',10);await sleep(280);ln('');
  buildCamBar('hargrove');
  for(const k of SITE_CAMS.hargrove){
    const c=CAMS[k];
    await lnSlow('  '+c.label+' :: '+c.loc.padEnd(16)+' '+(c.online?'[ONLINE]':'[ERROR ]'),c.online?'dim':'err',7);
    await sleep(c.online?50:200);
  }
  await sleep(280);ln('');ln('  Type cam number to view: 1 2 3 4 5 6');ln('  (6 = FL3 offline)','dim');ln('');
  await runCamLoop('hargrove');
}
async function runSec2(){
  S.sec2Runs++;
  ln('');await lnSlow('Initializing LKCO-04 remote node...','dim',10);await sleep(240);
  ln('  SECWATCH v1.8c  (1981 hardware)','dim');await sleep(580);ln('');
  buildCamBar('lkco');
  for(const k of SITE_CAMS.lkco){
    const c=CAMS[k];
    const st=c.degraded?'[ONLINE]  signal degraded':'[ONLINE]';
    await lnSlow('  '+c.label+' :: '+c.loc.padEnd(18)+' '+st,c.degraded?'warn':'dim',7);
    await sleep(c.degraded?180:70);
  }
  S.cam9Viewed++;
  if(S.cam9Viewed===2){await sleep(380);ln('');ln('  NOTE: CAM9 dropout increasing. Do not approach east wall after dark.','warn');}
  await sleep(280);ln('');ln('  Type cam number to view: 7 8 9');ln('');
  await runCamLoop('lkco');
}
async function runCamLoop(site){
  const nums=SITE_CAMS[site].map(k=>k.replace('cam',''));
  while(true){
    const key=await new Promise(r=>{
      _res=r;S.inputMode='any';showInput('CAM > ');
      ghost.onkeydown=e=>{
        if(e.key==='Escape'||e.key==='q'||e.key==='Q'||e.key==='0'){
          const rr=_res;if(!rr)return;_res=null;S.inputMode='cmd';hideInput();rr('exit');
        }else if(nums.includes(e.key)){
          const rr=_res;if(!rr)return;_res=null;S.inputMode='cmd';hideInput();rr(e.key);
        }
      };
    });
    if(key==='exit'){ln('  Closing camera interface.','dim');ln('');break;}
    await showCam('cam'+key);
    showInput('CAM > ');
    ln('  ['+nums.join(' ')+'] or Q to exit','dim');
  }
}
async function runScandisk(){
  ln('');ln('Microsoft ScanDisk  v6.22');ln('');await sleep(220);
  const checks=[['Checking file allocation table......',280],['Checking directory structure........',280],['Checking file structure.............',280],['Checking for lost clusters..........',280],['Verifying remote node links.........',860]];
  for(const[t,ms]of checks){
    const d=document.createElement('div');d.className='ln dim';d.textContent='  '+t;
    termOutput.appendChild(d);termOutput.scrollTop=termOutput.scrollHeight;
    await sleep(ms);d.textContent='  '+t+' OK';termOutput.scrollTop=termOutput.scrollHeight;
  }
  await sleep(300);ln('');ln('  No critical errors on drive C:');await sleep(160);ln('');
  ln('  !! 2 anomalies flagged:','warn');
  ln('     BADGE.LOG    modified 01/14/94 02:17  (expected: no changes since 08/91)','warn');
  ln('     COMBS.TXT    creation date: UNREADABLE  not in directory index','err');ln('');
}

/* ════════════════════════════════════════════════════════
   INTRO SEQUENCE
════════════════════════════════════════════════════════ */
const INTRO_LINES = [
  {text:'The following is a transcript of a SECWATCH security terminal', cls:''},
  {text:'session recorded January 15-16, 1994.', cls:''},
  {text:'', cls:''},
  {text:'The session log was recovered during a routine audit of', cls:'dim'},
  {text:'Hargrove Properties LLC systems in March 1994.', cls:'dim'},
  {text:'', cls:''},
  {text:'No employee matching the badge number used during this session', cls:'warn'},
  {text:'has been identified.', cls:'warn'},
  {text:'', cls:''},
  {text:'The Hargrove Business Center has been vacant since', cls:'dim'},
  {text:'January 17, 1994.  No tenant ever occupied the building.', cls:'dim'},
  {text:'', cls:''},
  {text:'Earl Combs, site foreman, was reported missing March 1983.', cls:'dim'},
  {text:'His case remains open.', cls:'dim'},
  {text:'', cls:''},
  {text:'The following session contains the last recorded activity', cls:'warn'},
  {text:'on the SECWATCH network.', cls:'warn'},
  {text:'', cls:''},
  {text:'The system has been running continuously since this date.', cls:'err'},
  {text:'', cls:''},
  {text:'We do not know why it is still running.', cls:'err'},
  {text:'We have been advised not to turn it off.', cls:'err'},
];

async function runIntro(){
  const overlay = document.getElementById('introOverlay');
  const textEl  = document.getElementById('introText');
  const contEl  = document.getElementById('introContinue');

  for(const item of INTRO_LINES){
    const span = document.createElement('span');
    span.className = 'il' + (item.cls ? ' '+item.cls : '');
    span.textContent = item.text || '\u00a0';
    textEl.appendChild(span);
    await sleep(30);
    span.classList.add('vis');
    await sleep(item.text ? 120 : 60);
  }

  await sleep(600);
  contEl.classList.add('vis');

  // UPDATE THIS BLOCK: Add touch and click listeners
  await new Promise(r => {
    const handler = () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      r();
    };
    document.addEventListener('keydown', handler);
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler, {passive: true});
  });

  /* fade out */
  overlay.style.transition='opacity 0.6s';
  overlay.style.opacity='0';
  await sleep(620);
  overlay.classList.add('done');
}
/* ════════════════════════════════════════════════════════
   SYSTEM WHISPERS (TIMED HINTS)
════════════════════════════════════════════════════════ */
function startWhispers() {
  // 4 mins: Atmospheric
  setTimeout(() => {
    if (S.endDay1Triggered) return;
    ln(''); ln('  you are here still...', 'err'); ln('');
  }, 4 * 60 * 1000);

  // 7 mins: Hint to look at LKCO cameras
  setTimeout(() => {
    if (S.endDay1Triggered) return;
    if (S.sec2Runs === 0) {
      ln(''); ln('  they are waiting in the dark at letcher county. run sec2.exe.', 'warn'); ln('');
    }
  }, 7 * 60 * 1000);

  // 11 mins: Hint for the LKCO 'dir' ghost file injection
  setTimeout(() => {
    if (S.endDay1Triggered) return;
    if (!S.ghostFileIn) {
      ln(''); ln('  the files at LKCO hide things. check the directory again. and again.', 'dim'); ln('');
    }
  }, 11 * 60 * 1000);

  // 15 mins: Hint for the tapes
  setTimeout(() => {
    if (S.endDay1Triggered) return;
    if (S.tapePlayCount === 0) {
      ln(''); ln('  earl left his voice behind. play the tapes.', 'dim'); ln('');
    }
  }, 15 * 60 * 1000);

  // 20 mins: Final atmospheric push
  setTimeout(() => {
    if (S.endDay1Triggered) return;
    ln(''); ln('  the wall is warm. it knows you are watching.', 'err'); ln('');
  }, 20 * 60 * 1000);
}
/* ════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════ */
async function boot(){
  /* init TL bars */
  TL.init();

  /* intro first */
  await runIntro();

  await lnSlow('Award Modular BIOS v4.51PG','dim',6);await sleep(55);
  ln('Copyright (C) 1984-93, Award Software Inc.','dim');ln('','dim');await sleep(85);
  ln('CPU : Intel 486 DX2/66  66MHz','dim');await sleep(45);
  const ram=document.createElement('div');ram.className='ln dim';ram.textContent='Memory Test :      0K';termOutput.appendChild(ram);
  for(let k=0;k<=640;k+=64){await sleep(26);ram.textContent='Memory Test : '+String(k).padStart(5)+'K';}
  ram.textContent='Memory Test :   640K OK';await sleep(45);
  ln('Extended Memory : 3072K OK','dim');await sleep(65);ln('','dim');
  await lnSlow('Detecting Primary Master....... HDD [ST3655A 638MB]','dim',5);await sleep(75);
  ln('Detecting Secondary Master ..... CD-ROM [MITSUMI]','dim');await sleep(75);
  ln('','dim');ln('Press DEL to enter SETUP','dim');await sleep(440);ln('');
  await lnSlow('Loading MS-DOS 6.22...','dim',9);await sleep(320);
  ln('HIMEM is testing extended memory...done.','dim');await sleep(90);ln('');
  await lnSlow('Processing AUTOEXEC.BAT','dim',9);await sleep(150);
  ln('  C:\\DOS\\SMARTDRV.EXE /X','dim');await sleep(55);
  ln('  C:\\DOS\\MOUSE.COM /Y','dim');await sleep(55);
  ln('  C:\\SECWATCH\\SECWATCH.BAT','dim');await sleep(340);ln('');
  ln('+==========================================================+','hi');
  ln('|   S E C W A T C H   v 2 . 1 1 b                          |','hi');
  ln('|   Hargrove Properties LLC  --  Security Terminal         |','hi');
  ln('|   Last boot: 03/14/91  /  Offline: 1036 days             |','hi');
  ln('|   Date: '+DATE_STR+'  /  Time: '+TIME_STR+'                         |','hi');
  ln('|   Active sites: HARGROVE BIZ CTR  /  LKCO-04             |','hi');
  ln('+==========================================================+','hi');
  await sleep(280);ln('');
  ln('  NOTICE: System offline for 1036 days.','warn');
  ln('  Review all logs before resuming operations.','warn');
  ln('');await sleep(240);
  ln('  Enter Employee Badge Number to continue.');ln('');

  /* badge login with special badge support */
  S.employeeID=await new Promise(r=>{_res=r;S.inputMode='login';showInput('  BADGE #: ');});

  ln('');
  await lnSlow('  Verifying badge #'+S.employeeID+'...','',13);
  await sleep(400);

  const special = SPECIAL_BADGES[S.employeeID];
  if(special){
    await special.onLogin();
  } else {
    ln('  Access granted.','hi');
  }

  await sleep(200);
  ln(S.playerName?'  Welcome back, '+S.playerName+'.':'  Stay sharp tonight.');
  await sleep(240);ln('');
  ln('  HELP for commands.  SEC1.EXE / SEC2.EXE for cameras.','dim');
  ln('  DIAL 204 for Pellegrino.  CD SITES\\LKCO for the strip site.','dim');
  ln('');
  startWhispers();
  S.inputMode='cmd';showInput();
}
boot();