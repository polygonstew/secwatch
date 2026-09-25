'use strict';

/* ════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════ */
const S = {
  cwd:'C:\\SECWATCH', inputMode:'cmd', inputBuf:'',
  activeCamKey:null, activeSite:null,
  sec2Runs:0, tapePlayCount:0,
  pellegrinoAnswered:false,
  pellegrinoDone:false,
  witnessRead:false,
  overnightVisited:false,
  cam9d2Viewed:false,
  tape06Played:false,
  badgeLogRead:false,
  endDay2Triggered:false,
  dialogPath:[],
  observerLogged:false,
  _wrongTimestamp:false,
};

const DATE_STR='01/16/94', TIME_STR='06:22';
let _res=null;

/* ════════════════════════════════════════════════════════
   THREAT LEVEL  --  carries over from Day 1 via sessionStorage
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
    /* restore from day 1 */
    try{
      const saved=JSON.parse(sessionStorage.getItem('sw_tl')||'{}');
      if(saved.h)this.bars.h=saved.h;
      if(saved.l)this.bars.l=saved.l;
      if(saved.s)this.bars.s=saved.s;
      if(saved.e)this.bars.e=saved.e;
    }catch(e){}
    /* re-render all bars */
    ['h','l','s','e'].forEach(b=>this._render(b));
    if(this.bars.h>=5||this.bars.l>=5||this.bars.s>=5){
      if(this.ewRow)this.ewRow.classList.add('show');
      if(!this.ewTimer)this._startEWTimer();
    }
    /* carry over observer logged state */
    if(this.bars.h>=7||this.bars.l>=7||this.bars.s>=7){
      S.observerLogged=true;
    }
    /* if day1 reached tl9, witness.txt will have extra content */
    if(this.bars.s>=9) S._tl9carried=true;
  },

  _save(){
    try{sessionStorage.setItem('sw_tl',JSON.stringify(this.bars));}catch(e){}
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
    this._save();
    this._check(bar,prev);
  },

  _check(bar,prev){
    const v=this.bars[bar];
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
    if(v>=5&&prev<5&&bar==='h')S._wrongTimestamp=true;
    if(v>=5&&prev<5&&bar==='s'){
      setTimeout(()=>TL._phantomRing(),45000+Math.random()*60000);
    }
    if(v>=7&&prev<7){
      S.observerLogged=true;
      if(camHUD&&camHUD.classList.contains('active')){
        hudAlert.textContent='OBSERVER LOGGED';hudAlert.classList.add('show');
      }
    }
    if(v>=9&&prev<9&&bar==='s'){
      /* update witness.txt with player session data */
      _updateWitnessTxt();
    }
    if(this.bars.h>=5||this.bars.l>=5||this.bars.s>=5){
      if(this.ewRow)this.ewRow.classList.add('show');
      if(!this.ewTimer)this._startEWTimer();
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

function _updateWitnessTxt(){
  const f=FS['C:\\SECWATCH\\WITNESS.TXT'];
  if(!f||f._updated)return;
  f._updated=true;
  const badgeNum=sessionStorage.getItem('sw_badge')||'????';
  const now=new Date();
  const ts=now.toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'});
  f.content+=`
You've been here too long.

I can see your session in the access log.

Badge `+badgeNum+`.

`+DATE_STR+`  `+ts+`

You need to understand that reading this
is the same as being here.

You are here.
`;
}

/* ════════════════════════════════════════════════════════
   CAMERAS  --  Day 2 images show subtle overnight changes
   cam1_d2: mug moved to floor
   cam6_d2: Suite 3-C door now closed
   cam9_d2: cable reel gone from bench
════════════════════════════════════════════════════════ */
const CAMS={
  cam1:{label:'CAM1',loc:'LOBBY',         img:'img/cam1_d2.png', /*anim:'img/cam1_d2.gif',*/ online:true},
  cam2:{label:'CAM2',loc:'FL1-EAST',      img:'img/cam2.png',                                online:true},
  cam3:{label:'CAM3',loc:'FL2-WEST',      img:'img/cam3.png',                                online:true},
  cam4:{label:'CAM4',loc:'FL4-LOBBY',     img:'img/cam4.png',                                online:true},
  cam5:{label:'CAM5',loc:'PARKING-STRUCT',img:'img/cam5.jpg',                                online:true},
  cam6:{label:'CAM6',loc:'FL3-CORRIDOR',  img:'img/cam6_d2.png',                             online:false},
  cam7:{label:'CAM7',loc:'TRAILER-EXT',   img:'img/cam7.png',    /*anim:'img/cam7.gif',*/    online:true},
  cam8:{label:'CAM8',loc:'PERIMETER-ROAD',img:'img/cam8.png',                                online:true},
  cam9:{label:'CAM9',loc:'EAST-WALL-80FT',img:'img/cam9_d2.png',                             online:true,degraded:true},
};
const SITE_CAMS={hargrove:['cam1','cam2','cam3','cam4','cam5','cam6'],lkco:['cam7','cam8','cam9']};

/* ════════════════════════════════════════════════════════
   TAPE REGISTRY
════════════════════════════════════════════════════════ */
const TAPES={
  'TAPE_06':{
    label:'[origin unknown -- not previously in system]',
    audio:'audio/tape_06.mp3',
    transcript:[
      "I don't know when this is.",
      "I don't have a watch anymore.",
      "",
      "The wall is -- it's different now.",
      "Since we backfilled.",
      "It's not warm anymore.",
      "",
      "It's hot.",
      "",
      "I keep thinking about Ricky Meade's truck.",
      "Still in his driveway.",
      "Nobody went to get it.",
      "",
      "[very long pause]",
      "",
      "I shouldn't be this far down.",
      "",
      "I can see light.",
      "",
      "[tape cuts]",
    ]
  }
};

/* ════════════════════════════════════════════════════════
   DIALOG TREE  --  Pellegrino calls you at boot
   Player chooses responses. Path is stored in S.dialogPath.
   Pellegrino reveals more or less depending on what you admit.
════════════════════════════════════════════════════════ */
const DIALOG={
  'open':{
    speaker:'PELLEGRINO',
    text:"Thank God. Listen -- did you file your incident report yet?",
    audio:'audio/pellegrino_d2_open.mp3',
    choices:[
      {id:1,text:"Not yet. I was just about to.",      next:'q_cam6'},
      {id:2,text:"I filed it an hour ago.",            next:'q_cam6'},
      {id:3,text:"There were things I didn't log.",    next:'q_cam6_direct'},
    ]
  },
  'q_cam6':{
    speaker:'PELLEGRINO',
    text:"The Floor 3 camera. Shows a brief reconnection at 02:19. Did you see a feed?",
    audio:'audio/pellegrino_d2_cam6.mp3',
    choices:[
      {id:1,text:"Yes. Six seconds of footage.",      next:'q_figure', effect:s=>{s.dialogPath.push('admitted_feed');TL.raise('h',1);}},
      {id:2,text:"There was interference. Static.",   next:'q_badge',  effect:s=>{s.dialogPath.push('denied_feed');}},
      {id:3,text:"I'm not sure what I saw.",          next:'q_figure', effect:s=>{s.dialogPath.push('uncertain');}},
    ]
  },
  'q_cam6_direct':{
    speaker:'PELLEGRINO',
    text:"[very quiet] Like what.",
    audio:'audio/pellegrino_d2_cam6_direct.mp3',
    choices:[
      {id:1,text:"The Floor 3 camera came back on.",     next:'q_figure', effect:s=>{s.dialogPath.push('admitted_feed');TL.raise('h',1);}},
      {id:2,text:"Badge 0047. It accessed the building.",next:'q_badge',  effect:s=>{s.dialogPath.push('badge_focus');TL.raise('h',1);}},
    ]
  },
  'q_figure':{
    speaker:'PELLEGRINO',
    text:"Was it -- did you see anyone in the corridor?",
    audio:'audio/pellegrino_d2_figure.mp3',
    choices:[
      {id:1,text:"Yes. Far end. Standing still.",      next:'q_badge', effect:s=>{s.dialogPath.push('confirmed_figure');TL.raise('h',1);}},
      {id:2,text:"The feed cut before I could tell.",  next:'q_badge', effect:s=>{s.dialogPath.push('uncertain_figure');}},
    ]
  },
  'q_badge':{
    speaker:'PELLEGRINO',
    text:"David Hargrove has been dead since March of 1991.",
    audio:'audio/pellegrino_d2_badgeA.mp3',
    choices:[
      {id:1,text:"His badge worked. I saw the log.",       next:'q_wall', effect:s=>{TL.raise('h',1);}},
      {id:2,text:"How did his badge access the system?",   next:'q_wall'},
      {id:3,text:"Then who was in the building?",          next:'q_wall'},
    ]
  },
  'q_wall':{
    speaker:'PELLEGRINO',
    text:"I need to ask you something. Did you look at the LKCO site?",
    audio:'audio/pellegrino_d2_wall.mp3',
    choices:[
      {id:1,text:"Yes. I looked at all the files.",              next:'q_wall_b', effect:s=>{s.dialogPath.push('read_lkco');TL.raise('l',1);}},
      {id:2,text:"I ran the cameras. Didn't read the files.",    next:'close',    effect:s=>{s.dialogPath.push('skipped_lkco');}},
      {id:3,text:"I found Earl Combs' recordings.",              next:'q_wall_b', effect:s=>{s.dialogPath.push('found_earl');TL.raise('l',1);}},
    ]
  },
  'q_wall_b':{
    speaker:'PELLEGRINO',
    text:"[long pause] Did you read what he wrote? At the end?",
    audio:'audio/pellegrino_d2_wall_b.mp3',
    choices:[
      {id:1,text:"COMBS.TXT. Yes. I read it.",              next:'close', effect:s=>{s.dialogPath.push('read_combs');TL.raise('l',1);TL.raise('s',1);}},
      {id:2,text:"I found a file but didn't open it.",      next:'close', effect:s=>{s.dialogPath.push('avoided_combs');}},
    ]
  },
  'close':{
    speaker:'PELLEGRINO',
    text:"Don't go back in that building. If Aldridge and Carr asks -- tell them the system needs another week. Just don't go back in.",
    audio:'audio/pellegrino_d2_close.mp3',
    choices:[
      {id:1,text:"What happened in 1991?",       next:'close_b'},
      {id:2,text:"What is in the east wall?",    next:'close_c'},
      {id:3,text:"[say nothing]",                next:'END'},
    ]
  },
  'close_b':{
    speaker:'PELLEGRINO',
    text:"[very long silence] David found the geology report. He went to see for himself. We found him on Floor 3. Physically fine. But he had been writing on the walls. Same thing over and over. Earl's name.",
    audio:'audio/pellegrino_d2_close_b.mp3',
    choices:[
      {id:1,text:"What was he writing exactly?",  next:'close_final', effect:s=>{TL.raise('h',1);}},
      {id:2,text:"[say nothing]",                 next:'END'},
    ]
  },
  'close_c':{
    speaker:'PELLEGRINO',
    text:"[long pause] Earl thought it was something old. Before the coal. Before the mountain. He said it had been there before. That it knew how to wait. [very quiet] I don't know what that means. I don't want to know.",
    audio:'audio/pellegrino_d2_close_c.mp3',
    choices:[
      {id:1,text:"It's still there.",    next:'close_final', effect:s=>{TL.raise('l',1);TL.raise('e',1);}},
      {id:2,text:"[say nothing]",        next:'END'},
    ]
  },
  'close_final':{
    speaker:'PELLEGRINO',
    text:"[barely audible] Yes. [click]",
    audio:'audio/pellegrino_d2_close_final.mp3',
    choices:[
      {id:1,text:"[line is dead]",  next:'END'},
    ]
  },
};

/* ════════════════════════════════════════════════════════
   VIRTUAL FILESYSTEM  --  Day 2
════════════════════════════════════════════════════════ */
const FS={
  'C:\\SECWATCH':{type:'dir',
    children:['README.TXT','SEC1.EXE','SEC2.EXE','WITNESS.TXT',
              'BADGE.LOG','OVERNIGHT','FLOORS','SITES']},

  'C:\\SECWATCH\\README.TXT':{type:'file',content:
`SECWATCH v2.11b -- Day 2 -- 01/16/94

System resumed 06:22.
New files detected since last session.
See WITNESS.TXT and OVERNIGHT directory.

COMMANDS
  sec1.exe / sec2.exe   Cameras
  answer                Answer incoming call
  type / dir / cd
  dial / play / stop
  help
`},

  'C:\\SECWATCH\\WITNESS.TXT':{type:'file',content:
`[This file was not present at end of previous session]
[Creation timestamp: 01/16/94  04:47]
[Author: UNKNOWN]

I know someone accessed this terminal last night.

The system logs it.
I can see you in the access record.

You read the files.

You need to understand something:

It doesn't stay below the bench anymore.
Not since the equipment left.
Earl thought leaving would be enough.

He was wrong.

The wall is not the problem.
The wall is just where it comes through.

David Hargrove found that out on Floor 3.

There is nothing you can do for the building.
There is nothing you can do for the site.

Leave the system logged in.
Leave it running.

That is the only thing that helps.
We don't know why.
We just know it does.

Don't come back.
`},

  'C:\\SECWATCH\\BADGE.LOG':{type:'file',content:
`BADGE LOG -- HARGROVE BUSINESS CENTER

[Previous entries -- see Day 1 log]

01/16/94  04:22  Badge #0047  MAIN ENTRANCE   GRANTED
01/16/94  04:23  Badge #0047  FL3 STAIRWELL   GRANTED
01/16/94  04:24  Badge #0047  FL3 STAIRWELL   EXIT
01/16/94  04:24  Badge #0047  MAIN ENTRANCE   EXIT

!! Badge #0047 DEACTIVATED 03/15/91
!! Employee: D. HARGROVE  --  DECEASED 03/1991

TOTAL OVERNIGHT ACCESSES: 2 entries
`},

  'C:\\SECWATCH\\OVERNIGHT':{type:'dir',
    children:['MOTION.LOG','TAPE_06.MP3','NOTES.TXT']},

  'C:\\SECWATCH\\OVERNIGHT\\MOTION.LOG':{type:'file',content:
`MOTION LOG -- OVERNIGHT 01/15 TO 01/16

01/16/94  04:22  CAM1  LOBBY           MOTION: YES
01/16/94  04:22  CAM3  FL2-WEST        MOTION: YES
01/16/94  04:23  CAM6  FL3-CORRIDOR    SIGNAL ACTIVE
01/16/94  04:24  CAM6  FL3-CORRIDOR    SIGNAL LOST
01/16/94  04:24  CAM1  LOBBY           MOTION: YES
  [no further events]

NOTE: CAM5 PARKING -- no vehicles recorded
      during any of the above timestamps.
`},

  'C:\\SECWATCH\\OVERNIGHT\\TAPE_06.MP3':{type:'audio',tape:'TAPE_06',content:
`[AUDIO FILE]
[This file was not present at end of previous session]
[Origin: UNKNOWN]
Type: play TAPE_06 to listen
`},

  'C:\\SECWATCH\\OVERNIGHT\\NOTES.TXT':{type:'file',content:
`handwritten note -- found under keyboard at shift start
01/16/94

If you're reading this the system is still running.
Good.

Keep it running.

Don't ask why.

Don't go to Floor 3.
Don't go to the east wall.

Don't dig.
`},

  'C:\\SECWATCH\\FLOORS':{type:'dir',children:['CAMS.TXT','FLOOR3.DAT']},
  'C:\\SECWATCH\\FLOORS\\CAMS.TXT':{type:'file',content:
`CAM1 LOBBY           [ONLINE -- see overnight motion log]
CAM2 FL1-EAST        [ONLINE]
CAM3 FL2-WEST        [ONLINE -- see overnight motion log]
CAM4 FL4-LOBBY       [ONLINE]
CAM5 PARKING-STRUCT  [ONLINE -- 0 vehicles overnight]
CAM6 FL3-CORRIDOR    [SIGNAL ACTIVE 04:23 -- LOST 04:24]

NOTE: CAM1 feed shows anomaly vs previous session.
      CAM6 corridor configuration has changed.
`},
  'C:\\SECWATCH\\FLOORS\\FLOOR3.DAT':{type:'file',content:
`!! ACCESS RESTRICTED BY COURT ORDER
!! FLOOR 3 HAS BEEN ACCESSED SINCE YOUR LAST SESSION
!! Badge #0047 -- 04:23 -- 04:24
!! See OVERNIGHT/MOTION.LOG
!! See BADGE.LOG
`},

  'C:\\SECWATCH\\SITES':{type:'dir',children:['LKCO']},
  'C:\\SECWATCH\\SITES\\LKCO':{type:'dir',children:['SITE94.CFG','CAMS.TXT']},
  'C:\\SECWATCH\\SITES\\LKCO\\SITE94.CFG':{type:'file',content:
`; LKCO SITE CONFIG -- OVERNIGHT REPORT
[OVERNIGHT]
CAM9 EAST-WALL-80FT: MOTION EVENT 04:31
DURATION: 14 seconds
NOTE: the cable reel is gone from the bench level
      it was present in all previous footage since 1983
      no drag marks visible on camera
      no explanation
`},
  'C:\\SECWATCH\\SITES\\LKCO\\CAMS.TXT':{type:'file',content:
`CAM7 TRAILER-EXT-EAST  [ONLINE]
CAM8 PERIMETER-ROAD    [ONLINE -- nothing on road overnight]
CAM9 EAST-WALL-80FT    [ONLINE -- see SITE94.CFG for overnight event]

NOTE: CAM9 signal quality unchanged.
      The cable reel has been at the base of the east wall
      since at least March 1983.
      It is not there now.
`},
};

/* ════════════════════════════════════════════════════════
   END OF DAY 2 CHECK
════════════════════════════════════════════════════════ */
function checkEndDay2(){
  if(S.endDay2Triggered)return;
  if(S.pellegrinoDone && S.witnessRead &&
     S.tape06Played  && S.badgeLogRead){
    S.endDay2Triggered=true;
    setTimeout(runEndDay2,2000);
  }
}

async function runEndDay2(){
  hideInput();
  stopAudio();
  await sleep(1200);
  await signalLossClose(600);
  await sleep(800);
  termOutput.innerHTML='';
  await sleep(300);
  ln('');ln('');
  await lnSlow('  SECWATCH -- DAY 2 COMPLETE','hi',20);
  await sleep(400);
  ln('  01/16/94  --  Morning shift closing','hi');
  await sleep(800);
  ln('');
  ln('  Pellegrino has been notified.','dim');
  await sleep(500);
  ln('  Aldridge and Carr LLP has not been notified.','warn');
  await sleep(500);
  ln('  No official incident report filed for overnight events.','warn');
  await sleep(800);
  ln('');
  ln('  -----------------------------------------------','dim');
  await sleep(600);
  await lnSlow('  The system is still running.','dim',20);
  await sleep(500);
  await lnSlow("  That's what matters.",'dim',20);
  await sleep(1600);
  ln('');
  /* show what path the player took through dialog */
  if(S.dialogPath.includes('confirmed_figure')){
    await lnSlow("  You told him about the figure.",'warn',22);
    await sleep(400);
    await lnSlow("  He wasn't surprised.",'warn',22);
    await sleep(800);
  }
  if(S.dialogPath.includes('read_combs')){
    await lnSlow("  You told him you read COMBS.TXT.",'err',22);
    await sleep(400);
    await lnSlow("  There was a long silence after that.",'err',22);
    await sleep(800);
  }
  ln('');
  await sleep(1000);

  const card=document.createElement('div');
  card.className='ln hi';
  Object.assign(card.style,{fontSize:'1.3em',letterSpacing:'0.2em',textAlign:'center',textShadow:'0 0 14px var(--g),0 0 32px rgba(51,255,51,0.5)'});
  card.textContent='END OF DAY 2';
  termOutput.appendChild(card);
  termOutput.scrollTop=termOutput.scrollHeight;
  await sleep(2200);

  const sub=document.createElement('div');
  sub.className='ln dim';
  Object.assign(sub.style,{textAlign:'center',letterSpacing:'0.1em',marginTop:'8px'});
  sub.textContent='LOADING DAY 3...';
  termOutput.appendChild(sub);
  termOutput.scrollTop=termOutput.scrollHeight;
  await sleep(2800);
  /* save TL before moving on */
  try{sessionStorage.setItem('sw_tl',JSON.stringify(TL.bars));}catch(e){}
  if(typeof SW!=='undefined')SW.setBars(TL.bars);
  window.location.href='dream.html?night=1';
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
const incomingDisplay=document.getElementById('incomingDisplay');
const dialogDisplay=document.getElementById('dialogDisplay');
const dialogSpeaker=document.getElementById('dialogSpeaker');
const dialogText=document.getElementById('dialogText');
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
   AUDIO
════════════════════════════════════════════════════════ */
let currentAudio=null,tapeInterval=null,phoneTimeout=null;
function playAudio(src,loop=false){
  stopAudio();
  currentAudio=new Audio(src);currentAudio.loop=loop;currentAudio.volume=0.85;
  currentAudio.play().catch(()=>{});return currentAudio;
}
function stopAudio(){
  if(currentAudio){currentAudio.pause();currentAudio.src='';currentAudio=null;}
  clearInterval(tapeInterval);clearTimeout(phoneTimeout);
  tapeBar.style.width='0%';
}
function setTranscript(lines,cls=''){
  transcript.innerHTML='';transcript.className=cls||'';
  lines.forEach(l=>{
    const d=document.createElement('div');
    d.textContent=l||'\u00a0';d.style.lineHeight='1.6';d.style.fontSize='0.88em';
    transcript.appendChild(d);
  });
  transcript.scrollTop=0;
}
async function runPlayTape(key){
  const tape=TAPES[key];
  if(!tape){ln('  Tape not found: '+key,'err');return;}
  stopAudio();S.tapePlayCount++;
  if(key==='TAPE_06'){S.tape06Played=true;TL.raise('l',2);TL.raise('e',1);}
  tapeName.textContent=tape.label;tapeStatus.textContent='LOADING...';
  tapeBar.style.width='0%';setTranscript(['[LOADING...]']);await sleep(700);
  tapeStatus.textContent='> PLAYING';setTranscript(tape.transcript,'active');
  const a=playAudio(tape.audio);
  tapeInterval=setInterval(()=>{
    if(!currentAudio||!currentAudio.duration)return;
    tapeBar.style.width=(currentAudio.currentTime/currentAudio.duration*100)+'%';
  },500);
  if(a){await new Promise(r=>{a.onended=r;setTimeout(r,90000);});}
  clearInterval(tapeInterval);tapeStatus.textContent='STOPPED';tapeBar.style.width='100%';
}

/* ════════════════════════════════════════════════════════
   DIALOG ENGINE
════════════════════════════════════════════════════════ */
async function runDialog(nodeKey){
  const node=DIALOG[nodeKey];if(!node)return;

  dialogDisplay.classList.add('active');
  incomingDisplay.classList.remove('active');
  dialogSpeaker.textContent=node.speaker||'PELLEGRINO';
  dialogText.textContent='';

  for(const ch of (node.text||'')){
    dialogText.textContent+=ch;await sleep(16);
  }

  if(node.audio)playAudio(node.audio);

  /* auto-advance terminal node */
  if(node.choices.length===1&&node.choices[0].next==='END'){
    await sleep(2400);
    dialogDisplay.classList.remove('active');
    commsLabelR.textContent='LINE: DISCONNECTED';
    S.pellegrinoDone=true;
    ln('');ln('  [LINE DISCONNECTED]','dim');ln('');
    showInput();return;
  }

  ln('');
  node.choices.forEach(c=>ln('  ['+c.id+'] '+c.text,'dim'));
  ln('');

  const chosen=await new Promise(r=>{
    _res=r;S.inputMode='dialog';showInput('RESPOND > ');
  });

  const choice=node.choices[chosen];
  ln('  > '+choice.text,'echo');ln('');
  if(choice.effect)choice.effect(S);
  stopAudio();

  if(choice.next==='END'){
    dialogDisplay.classList.remove('active');
    commsLabelR.textContent='LINE: DISCONNECTED';
    S.pellegrinoDone=true;
    ln('  [LINE DISCONNECTED]','dim');ln('');
    showInput();return;
  }

  await sleep(800);
  await runDialog(choice.next);
}

/* ════════════════════════════════════════════════════════
   CAMERA ENGINE
════════════════════════════════════════════════════════ */
function buildCamBar(site){
  S.activeSite=site;camBar.innerHTML='';
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
  const hint=document.createElement('span');
  hint.style.color='var(--gdim)';
  hint.textContent='TYPE: '+SITE_CAMS[site].map(k=>CAMS[k].label.replace('CAM','')).join(' / ');
  camBar.appendChild(hint);
  camLabelR.textContent=site==='lkco'?'LKCO-04 LETCHER CO.':'HARGROVE BIZ CTR';
}
function setHUD(cl,loc,ts,sig,alert=''){
  hudCamID.textContent=cl;hudLoc.textContent=loc;
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
  camFeed.classList.remove('active','degraded');camFeed.src='';
  camNoFeed.classList.add('hidden');camAcquire.classList.add('active');
  camHUD.classList.remove('active');camFrame.classList.remove('signal-loss');
  const src=cam.anim||cam.img;
  await new Promise(r=>{const t=new Image();t.onload=t.onerror=r;t.src=src;});
  await sleep(cam.degraded?1500:800);
  camAcquire.classList.remove('active');
  camFeed.src=src;camFeed.classList.add('active');
  if(cam.degraded)camFeed.classList.add('degraded');
  setHUD(cam.label,cam.loc,TIME_STR,cam.degraded?'SIG: WEAK':'SIG: OK');
  camHUD.classList.add('active');
  TL.onCamOpen();
  /* cam9 day 2 -- cable reel missing reaction */
  if(cam===CAMS.cam9&&!S.cam9d2Viewed){
    S.cam9d2Viewed=true;
    TL.raise('l',1);TL.raise('e',1);
    await sleep(1200);
    hudAlert.textContent='CABLE REEL: ABSENT';hudAlert.classList.add('show');
    ln('  CAM9 -- cable reel absent from bench level.','warn');
    ln('  Present in all footage since site opened 1971.','warn');ln('');
  }
  /* cam1 day 2 -- mug moved reaction */
  if(cam===CAMS.cam1){
    TL.raise('h',1);
    await sleep(1000);
    ln('  CAM1 -- compare to previous session footage.','warn');
    ln('  Lobby objects show displacement overnight.','warn');
    ln('  No authorized access recorded on CAM5 parking.','err');ln('');
  }
}
async function signalLossClose(ms=750){
  camFrame.classList.add('signal-loss');await sleep(ms);
  camFeed.classList.remove('active','degraded');camFeed.src='';
  camNoFeed.classList.remove('hidden');camHUD.classList.remove('active');
  camFrame.classList.remove('signal-loss');setCamActive(null);stopAudio();
}
async function showCam(camKey){
  const cam=CAMS[camKey];if(!cam)return;
  setCamActive(camKey);
  if(!cam.online){
    ln('  CAM6 -- attempting reconnection...','warn');
    await sleep(1800);
    await acquireFeed(cam);
    TL.raise('h',1);
    await sleep(3000);
    await signalLossClose(600);
    ln('  CAM6 -- signal lost again.','err');
    ln('  Note: Suite 3-C door is now CLOSED.','warn');
    ln('  All other corridor doors remain open.','warn');ln('');
    return;
  }
  await acquireFeed(cam);
}

/* ════════════════════════════════════════════════════════
   TERMINAL ENGINE
════════════════════════════════════════════════════════ */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ln(text='',cls=''){
  const d=document.createElement('div');d.className='ln'+(cls?' '+cls:'');
  d.textContent=text;termOutput.appendChild(d);termOutput.scrollTop=termOutput.scrollHeight;
}
async function lnSlow(text,cls='',ms=12){
  const d=document.createElement('div');d.className='ln'+(cls?' '+cls:'');d.textContent='';
  termOutput.appendChild(d);
  for(const ch of text){d.textContent+=ch;termOutput.scrollTop=termOutput.scrollHeight;await sleep(ms);}
}
function showInput(p){
  termPrompt.textContent=p||S.cwd+'> ';termTyped.textContent=S.inputBuf='';
  termInputRow.classList.add('on');termLabelR.textContent=S.cwd;
  ghost.style.pointerEvents='auto';ghost.focus();
}
function hideInput(){termInputRow.classList.remove('on');ghost.style.pointerEvents='none';}
function resolvePath(n){
  if(!n)return S.cwd;const u=n.toUpperCase();
  if(u==='..'){const p=S.cwd.split('\\');return p.length<=2?S.cwd:p.slice(0,-1).join('\\');}
  return S.cwd+'\\'+u;
}
ghost.addEventListener('keydown',e=>{
  if(!termInputRow.classList.contains('on'))return;
  if(S.inputMode==='any'){const r=_res;_res=null;S.inputMode='cmd';hideInput();r();return;}
  if(S.inputMode==='dialog'){
    const n=parseInt(e.key);
    if(n>=1&&n<=9){
      const r=_res;if(!r)return;
      _res=null;S.inputMode='cmd';hideInput();r(n-1);
    }
    return;
  }
  if(S.inputMode==='cmd'){
    if(e.key==='Enter'){
      const cmd=S.inputBuf.trim();hideInput();
      if(cmd)ln(S.cwd+'> '+cmd,'echo');
      S.inputBuf='';if(cmd)handleCmd(cmd);else showInput();
    }else if(e.key==='Backspace'){S.inputBuf=S.inputBuf.slice(0,-1);termTyped.textContent=S.inputBuf;}
    else if(e.key.length===1){S.inputBuf+=e.key;termTyped.textContent=S.inputBuf;}
  }
});
document.addEventListener('click',()=>{if(termInputRow.classList.contains('on'))ghost.focus();});
document.addEventListener('keydown',()=>{const d=new Audio();d.volume=0;d.play().catch(()=>{});},{once:true});

/* ════════════════════════════════════════════════════════
   COMMANDS
════════════════════════════════════════════════════════ */
async function handleCmd(raw){
  const parts=raw.trim().split(/\s+/);
  const cmd=parts[0].toLowerCase();
  const arg=parts.slice(1).join(' ').toUpperCase();

  switch(cmd){
    case 'cls':termOutput.innerHTML='';break;
    case 'help':case'?':
      ln('');
      ln('  answer            Pick up incoming call');
      ln('  sec1.exe          Hargrove cameras');
      ln('  sec2.exe          LKCO site cameras');
      ln('  dir / cd / type   Browse filesystem');
      ln('  play [tape]       Play TAPE_06');
      ln('  stop              Stop audio');
      ln('  cls / help');
      ln('');break;
    case 'stop':
      stopAudio();tapeStatus.textContent='STOPPED';commsLabelR.textContent='LINE: IDLE';
      ln('  Stopped.','dim');break;

    case 'answer':
      if(!S.pellegrinoAnswered){
        S.pellegrinoAnswered=true;
        ln('');ln('  Picking up...','dim');
        incomingDisplay.classList.remove('active');
        commsLabelR.textContent='LINE: CONNECTED';
        stopAudio();
        hideInput();
        await sleep(600);
        await runDialog('open');
      }else if(!S.pellegrinoDone){
        ln('  Call still in progress.','dim');
      }else{
        ln('  No incoming call.','dim');
      }
      break;

    case 'play':{
      if(!arg){ln('Usage: play [TAPE_06]','warn');break;}
      const key=arg.replace('.MP3','');ln('');hideInput();
      if(typeof SW!=='undefined')SW.find(key);
      await runPlayTape(key);break;
    }

    case 'dir':{
      const node=FS[S.cwd];if(!node||node.type!=='dir'){ln('Path error.','err');break;}
      if(S.cwd==='C:\\SECWATCH\\OVERNIGHT')S.overnightVisited=true;
      ln('');ln(' Directory of '+S.cwd);ln('');
      for(const name of node.children){
        const fp=S.cwd+'\\'+name;const ch=FS[fp];
        const cls=name==='WITNESS.TXT'?'warn':name==='TAPE_06.MP3'?'sys':name==='NOTES.TXT'?'warn':'';
        if(ch?.type==='dir')ln(' <DIR>  '+name,'hi');else ln('        '+name,cls);
      }
      ln('');ln('  '+node.children.length+' item(s)');ln('');break;
    }

    case 'cd':{
      if(!arg){ln(S.cwd);break;}
      const t=resolvePath(arg);
      if(FS[t]?.type==='dir'){S.cwd=t;termPrompt.textContent=S.cwd+'> ';termLabelR.textContent=S.cwd;}
      else ln('Invalid directory.','err');break;
    }

    case 'type':{
      if(!arg){ln('Usage: type [filename]','warn');break;}
      const fp=S.cwd+'\\'+arg;const f=FS[fp];
      if(!f){ln('File not found: '+arg,'err');break;}
      if(f.type==='audio'){ln('');ln('[AUDIO FILE]  Use: play '+f.tape,'sys');ln('');break;}
      if(typeof SW!=='undefined')SW.find(arg);
      /* track reads and raise TL */
      if(arg==='WITNESS.TXT'){S.witnessRead=true;TL.raise('s',1);}
      if(arg==='BADGE.LOG'){S.badgeLogRead=true;TL.raise('h',1);}
      if(arg==='FLOOR3.DAT')TL.raise('h',1);
      if(arg.includes('SITE94.CFG')&&S.cwd.includes('LKCO')){TL.raise('l',1);TL.raise('e',1);}
      ln('');
      for(const line of f.content.split('\n')){
        const c=line.match(/^\[/)?'dim':line.match(/^!!/)?'err':line.startsWith("Don't")||line.startsWith("don't")?'warn':'';
        ln(line,c);
      }
      ln('');break;
    }

    case 'sec1.exe':case'sec1':await runSec1();break;
    case 'sec2.exe':case'sec2':await runSec2();break;

    default:
      ln('');ln("'"+parts[0]+"' is not recognized.",'err');
      ln('Type HELP.','dim');ln('');
  }
  showInput();
  checkEndDay2();
}

/* ════════════════════════════════════════════════════════
   SEC1 / SEC2
════════════════════════════════════════════════════════ */
async function runSec1(){
  ln('');await lnSlow('Initializing HARGROVE cameras -- Day 2...','dim',10);await sleep(260);ln('');
  buildCamBar('hargrove');
  for(const k of SITE_CAMS.hargrove){
    const c=CAMS[k];
    const note=k==='cam6'?'  [SEE OVERNIGHT LOG]':k==='cam1'?'  [SEE OVERNIGHT LOG]':'';
    await lnSlow('  '+c.label+' :: '+c.loc.padEnd(16)+' '+(c.online?'[ONLINE]':'[ERROR ]')+note,c.online?'dim':'err',7);
    await sleep(c.online?50:180);
  }
  await sleep(260);ln('');ln('  Type: 1 2 3 4 5 6  (6=FL3)');ln('');
  await runCamLoop('hargrove');
}
async function runSec2(){
  S.sec2Runs++;
  ln('');await lnSlow('Initializing LKCO-04 -- Day 2...','dim',10);await sleep(240);
  buildCamBar('lkco');
  for(const k of SITE_CAMS.lkco){
    const c=CAMS[k];
    const st=c.degraded?'[ONLINE]  signal degraded':'[ONLINE]';
    await lnSlow('  '+c.label+' :: '+c.loc.padEnd(18)+' '+st,c.degraded?'warn':'dim',7);
    await sleep(c.degraded?160:65);
  }
  await sleep(260);
  ln('');ln('  NOTE: CAM9 overnight event logged. See SITES/LKCO/SITE94.CFG','warn');
  await sleep(200);ln('');ln('  Type: 7 8 9');ln('');
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
    if(key==='exit'){ln('  Closing.','dim');ln('');break;}
    await showCam('cam'+key);
    showInput('CAM > ');ln('  ['+nums.join(' ')+'] or Q','dim');
  }
}

/* ════════════════════════════════════════════════════════
   BOOT  --  Day 2
════════════════════════════════════════════════════════ */
async function boot(){
  /* init TL -- restores from Day 1 sessionStorage */
  TL.init();

  /* save badge for witness.txt update */
  try{
    const b=sessionStorage.getItem('sw_badge');
    if(b){}
  }catch(e){}

  ln('+==========================================================+','hi');
  ln('|   S E C W A T C H   v 2 . 1 1 b                          |','hi');
  ln('|   Hargrove Properties LLC                                |','hi');
  ln('|   Date: '+DATE_STR+'  /  Time: '+TIME_STR+'                         |','hi');
  ln('+==========================================================+','hi');
  await sleep(280);ln('');
  ln('  SYSTEM NOTICE: 3 new events logged overnight.','warn');
  ln('  See WITNESS.TXT and OVERNIGHT directory.','warn');
  await sleep(220);ln('');
  ln('  Restoring last session state...','dim');await sleep(500);
  ln('  Session restored.  Day 2 active.','hi');

  /* show carried TL if not all zero */
  if(TL.bars.h>0||TL.bars.l>0||TL.bars.s>0){
    await sleep(300);ln('');
    ln('  Site integrity levels restored from previous session.','dim');
    if(TL.bars.e>0)ln('  East Wall level: '+TL.bars.e,'warn');
  }

  await sleep(340);ln('');

  /* incoming call */
  incomingDisplay.classList.add('active');
  document.getElementById('incomingStatus').textContent='TYPE: ANSWER to pick up';
  commsLabelR.textContent='LINE: INCOMING';
  playAudio('audio/phone_ring.mp3',true);

  ln('  !! INCOMING CALL -- EXT. 204 -- PELLEGRINO','warn');
  ln('  Type ANSWER to pick up.  Or explore first.','dim');
  ln('');

  /* if day1 tl9 was reached, witness.txt already has player data */
  if(S._tl9carried||TL.bars.s>=9){
    _updateWitnessTxt();
  }

  S.inputMode='cmd';showInput();
}

boot();
