/* ════════════════════════════════════════════════════════
   THE NIGHT SHIFT  --  data  (js/dreamData.js)

   Everything card-, enemy- and night-shaped lives here.
   js/dreamEngine.js never hard-codes a specific card, Terror,
   or night. Add an entry with an existing effect / intent and
   it just works. Plain JS (not JSON) so it loads from file://.

   Built on the Nightmare Wood engine (bwp/lts), reskinned for
   SECWATCH. See DESIGN_NIGHTSHIFT.md for the why.
════════════════════════════════════════════════════════ */

const NS_CONFIG = {
  handSize: 5,
  focus: 3,               // energy per turn
  lucidity: 20,           // max; East Wall shaves this down (see engine)
  maxDeck: 24,
  mercyHeal: 3,           // lucidity regained between feeds
  loseEastWall: 2,        // East Wall raised if the night takes you
  winEastWall: -1,        // ...lowered if you hold
  clarityPerFeed: 3,      // currency (old nightmares.html) per cleared feed
  clarityElite: 6,
  archivePrice: 4,        // Clarity per card at an ARCHIVE node
  restHeal: 7,            // TAPE DECK heal
  tiredFocus: -1,         // 'stay up all night' costs this much Focus next night
  wallPulseAt: 7,         // East Wall >= this: the wall pulses...
  wallPulseEvery: 3       // ...every N turns for 1 unblockable damage
};

/* ── CARDS ────────────────────────────────────────────────
   effect   handler in EFFECTS (dreamEngine.js)
   target   'enemy' drag onto a feed, 'lane' drag onto an anchor
            slot, 'self'/'all' click to play
   kind     'basic' | 'evidence' | 'reward' | 'curse'  (styling)
   exhaust  removed for the rest of the night once played
   file     evidence cards show this as their header filename
─────────────────────────────────────────────────────────── */
const NS_CARDS = {
  /* starter deck ------------------------------------------ */
  deny:      { name:'DENY',         cost:1, effect:'damage',  value:5, target:'enemy', kind:'basic', icon:'x',
               desc:'Refuse it. 5 to one feed.', flavor:'It is not there. Say it again.' },
  document:  { name:'DOCUMENT',     cost:1, effect:'ward',    value:5, target:'lane',  kind:'basic', icon:'doc',
               desc:'Anchor 5 on a lane.', flavor:'Write down what you saw. Paper holds.' },
  breathe:   { name:'BREATHE',      cost:1, effect:'heal',    value:3, target:'self',  kind:'basic', icon:'o',
               desc:'Regain 3 Lucidity.', flavor:'In for four. Hold for four.' },
  flashlight:{ name:'FLASHLIGHT',   cost:1, effect:'expose',  value:3, target:'enemy', kind:'basic', icon:'beam',
               desc:'Expose a feed: it takes +3 from every hit this turn.', flavor:'Batteries are low. Point it anyway.' },
  lookaway:  { name:'LOOK AWAY',    cost:0, effect:'swap',    value:0, target:'enemy', kind:'basic', icon:'arrow',
               desc:'Push a Terror to an empty feed.', flavor:'If you are not looking it has to move.' },

  /* curse -- WHISPER intents shuffle these into your discard */
  static:    { name:'STATIC',       cost:1, effect:'purge',   value:0, target:'self',  kind:'curse', icon:'noise', exhaust:true,
               desc:'Does nothing. Costs 1 to clear. Gone for the night.', flavor:'three slow beats, below 80hz' },

  /* evidence -- unlocked by SW.find() in the day pages ---- */
  badge_log: { name:'DEAD BADGE',   cost:1, effect:'damage',  value:8, target:'enemy', kind:'evidence', icon:'badge', file:'BADGE.LOG',
               desc:'8 to one feed.', flavor:'#0047. Deactivated 03/15/91. Access granted.' },
  foreman:   { name:"FOREMAN'S LOG",cost:1, effect:'ward',    value:8, target:'lane',  kind:'evidence', icon:'doc', file:'FOREMAN.LOG',
               desc:'Anchor 8 on a lane.', flavor:'Crew of 14. East seam thin.' },
  combs_txt: { name:'COMBS.TXT',    cost:2, effect:'drain',   value:8, target:'enemy', kind:'evidence', icon:'o', file:'COMBS.TXT',
               desc:'8 to one feed, regain half.', flavor:'You stop being afraid.' },
  tape_01:   { name:'TAPE 01',      cost:1, effect:'recall',  value:2, target:'self',  kind:'evidence', icon:'tape', file:'TAPE_01.MP3',
               desc:'Regain 2 Lucidity, draw 1.', flavor:'"It wasn\'t nothing."' },
  tape_02:   { name:'TAPE 02',      cost:1, effect:'draw',    value:2, target:'self',  kind:'evidence', icon:'tape', file:'TAPE_02.MP3',
               desc:'Draw 2.', flavor:'"The wall is warm."' },
  tape_03:   { name:'TAPE 03',      cost:2, effect:'silence', value:0, target:'enemy', kind:'evidence', icon:'tape', file:'TAPE_03.MP3',
               desc:'That Terror skips its next action.', flavor:'"I need you to let that be enough."' },
  tape_05:   { name:'TAPE 05',      cost:2, effect:'heal',    value:6, target:'self',  kind:'evidence', icon:'tape', file:'TAPE_05.MP3',
               desc:'Regain 6 Lucidity.', flavor:'"Should be a good winter."' },
  geol:      { name:'GEOL. SURVEY', cost:1, effect:'expose',  value:5, target:'enemy', kind:'evidence', icon:'beam', file:'GEOL.RPT',
               desc:'Expose a feed: +5 from every hit this turn.', flavor:'Survey team declined to probe directly.' },
  witness:   { name:'WITNESS.TXT',  cost:1, effect:'damage_all', value:3, target:'all', kind:'evidence', icon:'noise', file:'WITNESS.TXT',
               desc:'3 to every feed.', flavor:'leave the system running.' },
  ext_099:   { name:"DON'T DIG",    cost:0, effect:'energy',  value:2, target:'self',  kind:'evidence', icon:'phone', file:'EXT 099', exhaust:true,
               desc:'+2 Focus this turn. Exhaust.', flavor:'"We have a Combs on file. And a Hargrove."' },
  ext_107:   { name:'MAINTENANCE',  cost:1, effect:'ward_all',value:3, target:'all',   kind:'evidence', icon:'phone', file:'EXT 107',
               desc:'Anchor 3 on every lane.', flavor:'"...site\'s been closed since \'83."' },
  deed:      { name:'THE DEED',     cost:2, effect:'ward_all',value:7, target:'all',   kind:'evidence', icon:'doc', file:'LKCO-04 DEED', exhaust:true,
               desc:'Anchor 7 on every lane. Exhaust.', flavor:'GRANTEE: you. Recorded 11/03/1987.' },
  death_cert:{ name:'DEATH CERT.',  cost:1, effect:'damage',  value:6, target:'enemy', kind:'evidence', icon:'doc', file:'CERT 03/16/91',
               desc:'6 to one feed.', flavor:'Witness: illegible. Might say E. Combs.' },
  chat_earl: { name:"RICKY'S CHAT", cost:1, effect:'silence', value:0, target:'enemy', kind:'evidence', icon:'phone', file:'CHAT_EARL.LOG',
               desc:'That Terror skips its next action.', flavor:"don't come here Earl. I'm fine." },
  letter_mom:{ name:'LETTER_MOM',   cost:0, effect:'heal',    value:3, target:'self',  kind:'evidence', icon:'doc', file:'LETTER_MOM.TXT',
               desc:'Regain 3 Lucidity.', flavor:"I'll be home for Easter." },
  tape_04:   { name:'TAPE 04',      cost:1, effect:'damage',  value:7, target:'enemy', kind:'evidence', icon:'tape', file:'TAPE_04.MP3',
               desc:'7 to one feed.', flavor:'"I\'m going to come back with a--"' },
  floor3:    { name:'FLOOR3.DAT',   cost:1, effect:'ward',    value:6, target:'lane',  kind:'evidence', icon:'screen', file:'FLOOR3.DAT',
               desc:'Anchor 6 on a lane.', flavor:'Suite 3-C. Door: CLOSED.' },
  missing:   { name:'MISSING INDEX',cost:0, effect:'damage_all', value:2, target:'all', kind:'evidence', icon:'doc', file:'1923-1991',
               desc:'2 to every feed.', flavor:'Twelve names. None of the sellers appear again.' },
  sealed:    { name:'SEALED FILE',  cost:0, effect:'expose',  value:4, target:'enemy', kind:'evidence', icon:'doc', file:'LC-1991-CV-0447',
               desc:'Expose a feed: +4 from every hit this turn.', flavor:'Organized ritual activity. Twelve persons of interest.' },
  notes_83:  { name:'NOTES_1983',   cost:1, effect:'silence', value:0, target:'enemy', kind:'evidence', icon:'doc', file:'NOTES_1983.TXT',
               desc:'That Terror skips its next action.', flavor:'I am leaving this here for whoever logs in next.' },
  arrangement:{name:'THE ARRANGEMENT',cost:3,effect:'ward_all',value:12,target:'all',  kind:'evidence', icon:'ward', file:'1887', exhaust:true,
               desc:'Anchor 12 on every lane. Exhaust.', flavor:'Two families. Leave it alone. Let it know.' },

  /* rewards -- offered 3-at-random after each cleared feed */
  sec2_exe:  { name:'SEC2.EXE',     cost:0, effect:'draw',    value:2, target:'self',  kind:'reward', icon:'screen',
               desc:'Draw 2.', flavor:'Initializing remote nodes...' },
  scandisk:  { name:'SCANDISK',     cost:1, effect:'damage_all', value:4, target:'all', kind:'reward', icon:'noise',
               desc:'4 to every feed.', flavor:'Checking for lost clusters...' },
  coffee:    { name:'COFFEE',       cost:0, effect:'energy',  value:1, target:'self',  kind:'reward', icon:'o',
               desc:'+1 Focus this turn.', flavor:'The mug is back on the desk. You put it there. Right?' },
  fire_door: { name:'FIRE DOOR',    cost:2, effect:'ward',    value:14, target:'lane', kind:'reward', icon:'ward',
               desc:'Anchor 14 on a lane.', flavor:'Push bar. Alarm will sound.' },
  rewind:    { name:'REWIND',       cost:1, effect:'recall',  value:4, target:'self',  kind:'reward', icon:'tape',
               desc:'Regain 4 Lucidity, draw 1.', flavor:'Play it back. Listen for the pause.' },
  incident:  { name:'INCIDENT.RPT', cost:2, effect:'damage',  value:12, target:'enemy', kind:'reward', icon:'doc',
               desc:'12 to one feed.', flavor:'Filed by R. Pellegrino.' },
  night_desk:{ name:'NIGHT DESK',   cost:1, effect:'drain',   value:6, target:'enemy', kind:'reward', icon:'screen',
               desc:'6 to one feed, regain half.', flavor:'Badge, fob, parking space. Printout of commands.' },
  hard_hat:  { name:'HARD HAT',     cost:1, effect:'ward_all',value:4, target:'all',   kind:'reward', icon:'ward',
               desc:'Anchor 4 on every lane.', flavor:'KELLY BRANCH #2 stenciled on the back.' },
  logout:    { name:'LOGOUT',       cost:2, effect:'silence', value:0, target:'enemy', kind:'reward', icon:'x',
               desc:'That Terror skips its next action.', flavor:'SESSION LOGGED.' },
  redact:    { name:'[REDACTED]',   cost:1, effect:'expose',  value:6, target:'enemy', kind:'reward', icon:'beam',
               desc:'Expose a feed: +6 from every hit this turn.', flavor:'Credentials: extensive field experience.' }
};

const NS_STARTER = ['deny','deny','deny','document','document','breathe','flashlight','lookaway'];
const NS_REWARDS = ['sec2_exe','scandisk','coffee','fire_door','rewind','incident','night_desk','hard_hat','logout','redact'];

/* ── EVIDENCE -> CARD ─────────────────────────────────────
   Keys are what the day pages pass to SW.find() (upper-cased).
   Reading/playing/dialing it in the day adds the card to your
   deck for every night after. This is the core loop:
   digging makes you stronger AND raises the threat bars that
   feed the nightmares. Knowledge is armor and exposure.
─────────────────────────────────────────────────────────── */
const NS_EVIDENCE = {
  'BADGE.LOG':'badge_log',   'FOREMAN.LOG':'foreman',    'COMBS.TXT':'combs_txt',
  'TAPE_01':'tape_01',       'TAPE_02':'tape_02',        'TAPE_03':'tape_03',
  'TAPE_05':'tape_05',       'GEOL.RPT':'geol',          'WITNESS.TXT':'witness',
  'EXT_099':'ext_099',       'EXT_107':'ext_107',        'DEED':'deed',
  'DEATH_CERT':'death_cert', 'CHAT_EARL.LOG':'chat_earl','LETTER_MOM.TXT':'letter_mom',
  'TAPE_04':'tape_04',       'FLOOR3.DAT':'floor3',      'MISSING_PERSONS':'missing',
  'COURT_FILE':'sealed',     'NOTES_1983.TXT':'notes_83',
  'CUSTODIAN':'arrangement'
};

/* ── TERRORS ──────────────────────────────────────────────
   bar       which threat bar feeds it: every 4 points in that
             bar = +1 to all its attacks (h/l/s/e)
   pattern   intents cycled one per turn:
     ['attack',n]  hit its lane for n (anchor absorbs first)
     ['guard',n]   gain n shield until its next action
     ['extend',n]  permanently +n to its attacks
     ['whisper',n] shuffle n STATIC into your discard
     ['watch']     nothing. It is aware of you.
─────────────────────────────────────────────────────────── */
const NS_ENEMIES = {
  intrusion: { name:'THE INTRUSION', hp:14, bar:'e', glyph:'◇',
               pattern:[['attack',3],['attack',3],['whisper',1]],
               flavor:'Not malice. Attention.' },
  warmth:    { name:'THE WARMTH',    hp:10, bar:'l', glyph:'≋',
               pattern:[['guard',4],['attack',2],['extend',1]],
               flavor:'It is January. The wall is warm.' },
  shape:     { name:'THE SHAPE',     hp:16, bar:'h', glyph:'▮',
               pattern:[['watch'],['attack',7]],
               flavor:'Work clothes. Facing away. Not moving.' },
  badge47:   { name:'BADGE #0047',   hp:11, bar:'h', glyph:'◆',
               pattern:[['attack',2],['attack',2],['whisper',1]],
               flavor:'Floor 3 stairwell. 04:23. Exited 04:24.' },
  phantom:   { name:'EXT. 311',      hp:9,  bar:'s', glyph:'☏',
               pattern:[['attack',1],['attack',1],['attack',5]],
               flavor:'One ring. Then the earth moving.' },
  cable:     { name:'THE CABLE REEL',hp:13, bar:'l', glyph:'◎',
               pattern:[['guard',5],['attack',4]],
               flavor:'Gone. No drag marks.' },
  witness_t: { name:'WITNESS.TXT',   hp:12, bar:'s', glyph:'⟨⟩',
               pattern:[['whisper',2],['attack',3]],
               flavor:'Author: unknown. 04:47.' },
  threshold: { name:'THRESHOLD SOCIETY', hp:18, bar:'h', glyph:'Ψ',
               pattern:[['guard',6],['guard',6],['attack',6]],
               flavor:'Twelve people with the wrong frameworks.' },
  ricky:     { name:"RICKY'S KNOWING", hp:12, bar:'l', glyph:'◌',
               pattern:[['watch'],['whisper',1],['attack',4]],
               flavor:'I know what it has been waiting for.' },
  earl:      { name:'EARL -- THE ELEVENTH', hp:34, bar:'e', glyph:'▣', boss:true,
               pattern:[['watch'],['attack',6],['extend',1],['whisper',2],['attack',8]],
               flavor:'Or something that knows the shape of Earl.' }
};

/* ── NIGHTS ───────────────────────────────────────────────
   dream.html?night=N plays NS_NIGHTS[N-1].
   map  = the descent (from the old nightmares.html map). Each
          depth is a list of 1-3 nodes; you pick ONE per depth.
     {type:'feed',    enemies:[...]}           a fight
     {type:'elite',   enemies:[...]}           harder, +Clarity, 2 rewards
     {type:'rest'}                             TAPE DECK: heal or shred a card
     {type:'archive'}                          spend Clarity on cards
   The last depth should be the night's boss feed.
   next = where you wake up. Days route here:
     day2 -> night 1 -> day3,  day4 -> night 2 -> day5,
     day5 -> night 3 -> day6
   video = optional videos/<video>.mp4 played on waking.
─────────────────────────────────────────────────────────── */
const NS_NIGHTS = [
  {
    id:'night_1', title:'FIRST CONTACT', clock:'01/16/94  02:14', video:'night_1',
    where:'Motel room. County Road 15. You went to sleep.',
    map:[
      [ {type:'feed', enemies:['intrusion']}, {type:'feed', enemies:['badge47']} ],
      [ {type:'feed', enemies:['warmth','phantom']}, {type:'rest'} ],
      [ {type:'feed', enemies:['intrusion','warmth']} ],
      [ {type:'feed', enemies:['shape']} ]
    ],
    next:'day3.html',
    win :'The intrusion passes. Not repelled -- withdrawn, the way a very large thing withdraws a limb.\n\nGray Kentucky dawn. You kept your head. That is the arrangement.',
    lose:'Lucidity: 0. The wall has your full attention now.\n\nYou wake up. You always wake up. The question is what comes back with you.'
  },
  {
    id:'night_2', title:'THE CORRIDOR', clock:'01/17/94  03:41', video:'night_2',
    where:'Floor 3. All the doors are open.',
    map:[
      [ {type:'feed', enemies:['badge47','phantom']}, {type:'feed', enemies:['cable']} ],
      [ {type:'archive'}, {type:'elite', enemies:['threshold','witness_t']} ],
      [ {type:'feed', enemies:['cable','witness_t']}, {type:'rest'} ],
      [ {type:'feed', enemies:['intrusion','shape','warmth']} ]
    ],
    next:'day5.html',
    win :"The corridor is empty again. Open doors, dead cameras, and whatever uses David Hargrove's badge.\n\nYou held the boundary. Earl would recognize what you did here.",
    lose:"The shape at the end of the corridor turns around.\n\nYou don't see its face. You won't remember its face. That's the mercy of it."
  },
  {
    id:'night_3', title:'THE BOUNDARY', clock:'01/18/94  04:52', video:'night_3',
    where:'You went down. You chose. Now it is choosing.',
    map:[
      [ {type:'feed', enemies:['threshold','ricky']}, {type:'elite', enemies:['shape','badge47','phantom']} ],
      [ {type:'rest'}, {type:'archive'} ],
      [ {type:'feed', enemies:['witness_t','intrusion','cable']}, {type:'feed', enemies:['ricky','warmth']} ],
      [ {type:'rest'} ],
      [ {type:'feed', enemies:['earl']} ]
    ],
    next:'day6.html',
    win :'It does not understand defeat. It simply withdraws its awareness to whatever it was attending to before it noticed you.\n\nCold air. January. The crack is gone.\n\nYou understand something now.',
    lose:'You have been perceived completely. Every memory, every fear, every thought you have had or will have.\n\nYou understand now.\n\nSame thing they all say.'
  }
];
