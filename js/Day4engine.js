// ============================================================
// STATE
// ============================================================
const playerName = localStorage.getItem('sw_name') || 'UNKNOWN';
let eastWallLevel = parseFloat(localStorage.getItem('sw_east_wall') || '0');
let terminalOpened = false;
let dirEAccessed = false;
let horrorBeatFired = false;
let itemsFound = new Set();
let narrativeBeat = 0;
let leaveLocked = true;
let leaveSequenceStarted = false;
let chatLogRickyAppended = false;

// ============================================================
// FILE SYSTEM DATA
// ============================================================
const DIR_LISTING = [
  ` Volume in drive C is LKCO_RELAY`,
  ` Volume Serial Number is 1983-0213`,
  ``,
  ` Directory of C:\\LKCO_RELAY`,
  ``,
  `02-10-83  07:14a  <DIR>          .`,
  `01-14-83  09:12a  <DIR>          ..`,
  `02-10-83  07:14a           2,847  LETTER_MOM.TXT`,
  `02-14-83  08:28a           1,204  CHAT_EARL.LOG`,
  `02-16-83  06:33a             892  SITE_STATUS.TXT`,
  `02-10-83  07:43a  <DIR>          DIR_E`,
  ``,
  `        3 File(s)         4,943 bytes`,
  `        1 Dir(s)          [relay running]`,
];

const DIR_E_LISTING = [
  ` Directory of C:\\LKCO_RELAY\\DIR_E`,
  ``,
  `02-10-83  07:44a  <DIR>          .`,
  `02-10-83  07:43a  <DIR>          ..`,
].concat(
  Array.from({length:50}, (_,i) =>
    `02-10-83  07:44a           4,891  READING_${String(i+1).padStart(2,'0')}.LOG`
  )
).concat([
  ``,
  `       50 File(s)       244,550 bytes`,
  ``,
  `       [all files: same size. same timestamp. 02-10-83 07:44a]`,
]);

const FILES = {
  'LETTER_MOM.TXT': {
    icon: '✉',
    shortName: `LETTER_MOM.TXT`,
    tag: `Ricky Meade — Feb 10, 1983`,
    note: `Never sent. File never closed. He wrote it four days before the last chat log.`,
    lines: [
      `February 10, 1983`,
      ``,
      `Hey Ma,`,
      ``,
      `Just wanted to write and let you know things are going real good`,
      `out here. The job pays better than anything I could have found back`,
      `home and the county is real pretty this time of year. Reminds me`,
      `of where you grew up before you all moved to Pikeville.`,
      ``,
      `Earl Combs is the foreman and he is a real straight shooter Ma.`,
      `Doesn't put on airs, knows the work, treats everybody fair. I feel`,
      `like I can learn a lot from a man like that. The crew is small`,
      `right now — just seven of us on the east bench — but everybody`,
      `pulls their weight.`,
      ``,
      `I'll be home for Easter for sure. I already put in for the time.`,
      ``,
      `I love you.`,
      `— Ricky`,
      ``,
      `[THIS FILE HAS NOT BEEN CLOSED]`,
    ]
  },
  'CHAT_EARL.LOG': {
    icon: '💬',
    shortName: `CHAT_EARL.LOG`,
    tag: `LKCO Relay Chat — Feb 14, 1983`,
    note: `Last contact. "dont come here earl. im fine. i understand now."`,
    lines: [
      `02/14/83  08:14   [RICKY_M]  earl you there`,
      `02/14/83  08:16   [EARL_C]   here. what is it`,
      `02/14/83  08:17   [RICKY_M]  i went down again last night. after shift`,
      `02/14/83  08:17   [EARL_C]   ricky`,
      `02/14/83  08:18   [RICKY_M]  i know what you said`,
      `02/14/83  08:18   [EARL_C]   i said dont go alone`,
      `02/14/83  08:19   [RICKY_M]  i wasnt scared this time earl`,
      `02/14/83  08:19   [EARL_C]   thats when you should be scared`,
      `02/14/83  08:21   [RICKY_M]  i know what it has been waiting for`,
      `02/14/83  08:22   [EARL_C]   ricky what do you mean`,
      `02/14/83  08:23   [RICKY_M]  i cant explain it. its not like explaining something.`,
      `                             its like knowing how to breathe. you just know.`,
      `02/14/83  08:25   [EARL_C]   come in. come in right now.`,
      `02/14/83  08:26   [RICKY_M]  im not going back there earl`,
      `02/14/83  08:26   [EARL_C]   good`,
      `02/14/83  08:27   [RICKY_M]  im not going back to the site i mean`,
      `02/14/83  08:27   [EARL_C]   ricky`,
      `02/14/83  08:28   [RICKY_M]  dont come here earl. im fine. i understand now.`,
      `02/14/83           [CONNECTION TERMINATED BY REMOTE HOST]`,
    ]
  },
  'SITE_STATUS.TXT': {
    icon: '📋',
    shortName: `SITE_STATUS.TXT`,
    tag: `LKCO-04 — Feb 16, 1983 — E. Combs`,
    note: `Earl wrote this two days after Ricky stopped responding. "Leave the system running."`,
    lines: [
      `LKCO-04 SITE STATUS REPORT`,
      `DATE: 02/16/83`,
      `RELAY TERMINAL: ACTIVE (RUNNING SINCE 01/14/83)`,
      `EAST BENCH CREW: 0  [STOOD DOWN 02/13]`,
      `SHAFT 4: SEALED — DO NOT OPEN`,
      `EAST WALL STATUS: STABLE  [LAST READING: 02/10/83]`,
      `SECURITY: PERIMETER ONLY`,
      ``,
      `FOREMAN NOTE (E.COMBS 02/16):`,
      `East bench crew stood down effective 02/13. I am handling`,
      `site observation alone until further notice. Nobody goes`,
      `to the east bench. That includes contractors.`,
      `That includes Ricky.`,
      ``,
      `The readings in DIR_E are from the last probe. All fifty.`,
      `Do not try to open them. They are not for reading.`,
      `They are for record. There is a difference.`,
      ``,
      `If you are reading this and you are not me:`,
      `Leave the system running.`,
      `Do not come here.`,
      ``,
      `— E. Combs`,
    ]
  }
};

// ============================================================
// HOTSPOT EXAMINATION TEXT
// ============================================================
const examineText = {
  door: `The front door is unlocked. Has been unlocked since February 1983. The lock is not broken. It wasn't forced. It was simply left this way — left the way you leave a door when you expect to come back in a few minutes.\n\nRicky has been gone for eleven years. The door is still unlocked. You got in easily. That is the point. You were supposed to get in easily.`,

  window: `Through the window: his truck. A 1979 Ford F-100, dark green. The left rear tire is flat.\n\nNot slow-leaking flat. Not recently flat. Flat in the way that something has been this way for a very long time and no one has touched it. The other three tires look fine. Properly inflated.\n\nThe truck hasn't moved since he parked it. It will not need to.`,

  calendar: `A Harlan County Coal Cooperative calendar. The page is still on February 1983. Someone has circled the 14th in red ink.\n\nFebruary 14th. In the circle, in handwriting: east bench.\n\nHe went down February 14th. The chat log with Earl is dated February 14th.\n\nThe calendar was never turned.`,

  bills: `A stack of paper near the door. Utility bills — electric, gas, water — each one marked PAID.\n\nThe account is in Ricky Meade's name. The statements come from 1983 through this month. The most recent is January 1994.\n\nRicky Meade's bank account has been making automatic payments for eleven years. The account was never frozen. Nobody at the utility company has noticed. Nobody has asked why the account of a missing twenty-three-year-old is still active.\n\nThe house is not haunted. The house is kept.`,

  envelope: `An envelope on the counter. Addressed to Helen Meade, Pikeville KY. In Ricky's handwriting.\n\nUnsealed. Never mailed.\n\nHe wrote the letter on February 10th. He didn't know, on February 10th, that there was nowhere he needed to go anymore. The file is still open on the terminal.\n\nOpen the terminal. Read it.`,

  mug: `A ceramic mug on the kitchen shelf. HARLAN COUNTY COAL printed on the side.\n\nSomething dried inside it. Not recently dried. Long-dried, the way things dry when nobody tends to them. But the outside is clean. Recently wiped.\n\nYou set it back down without making a sound.`,

  terminal: `An IBM-compatible with a green phosphor monitor. The relay software is running. The cursor is blinking.\n\nIt has been blinking since January 14th, 1983.\n\nThe last entry in the system log is dated 02/16/83. Earl's note. He was the last person to type anything on this machine.\n\nDouble-click to open the terminal.`,
};

// ============================================================
// NARRATIVE BEATS
// ============================================================
const narratives = [
  // 0 — arrival
  `The address was in the county records. You drove out Cornett Branch Road and found it without difficulty — a small house set back from the road, power lines connected, a mailbox with MEADE on it in stick-on letters.\n\nThe door was unlocked. It is sixty-eight degrees inside. The heat is on.`,
  // 1 — after first examine
  `The place looks like someone planned to come back after the weekend. Every object exactly where it was left. Nothing missing. Nothing moved. Except everything is eleven years old.`,
  // 2 — after terminal opened
  `The terminal is running LKCO relay software. It has been running since January 1983. Three files on the drive. A subdirectory.\n\nEarl Combs wrote the last thing in this machine two days after Ricky stopped responding. Then he drove to the LKCO site and went underground and didn't come up.`,
  // 3 — after reading chat log
  `"I know what it has been waiting for."\n\nHe doesn't say what. He just says he knows. And then he tells Earl not to come, and says he's fine, and says he understands now.\n\nThe connection terminated. Earl's side shows no reply after that.`,
  // 4 — after DIR_E accessed
  `Fifty files. All the same size. All the same timestamp. February 10th, 07:44 in the morning.\n\nEarl wrote: they are not for reading. They are for record. There is a difference.\n\nYou do not know what the difference is. You think about it.`,
  // 5 — after horror beat
  `Nobody typed that.\n\nYou checked. Your hands were on the desk, not on the keyboard. The terminal typed it on its own. Slowly. One character at a time.`,
];

// ============================================================
// INIT
// ============================================================
window.addEventListener('load', () => {
  document.getElementById('term-input').addEventListener('keydown', onTermInput);
  typeWriter(narratives[0], document.getElementById('narr-text'));

  // Initialize East Wall display
  if (eastWallLevel > 0) {
    updateEastWall(eastWallLevel, false);
  }
});

// ============================================================
// EXAMINE HOTSPOTS
// ============================================================
function examine(id) {
  const text = examineText[id];
  if (!text) return;
  typeWriter(text, document.getElementById('narr-text'), () => {
    if (narrativeBeat === 0) {
      narrativeBeat = 1;
    }
  });
  if (id === 'terminal' && narrativeBeat < 2) {
    // Encourage them to open
  }
}

// ============================================================
// TERMINAL
// ============================================================
function openTerminal() {
  document.getElementById('term-overlay').classList.add('open');
  document.getElementById('term-input').focus();

  if (!terminalOpened) {
    terminalOpened = true;
    // Boot sequence
    printLines([
      {cls:'out', text:`LKCO RELAY TERMINAL v2.1`},
      {cls:'out', text:`Copyright (c) 1981 Relay Systems Corp.`},
      {cls:'gap', text:''},
      {cls:'amb', text:`RELAY STATUS: ACTIVE`},
      {cls:'amb', text:`UPTIME: 4,020 days, 7 hrs, 16 min`},
      {cls:'gap', text:''},
      {cls:'out', text:`Type HELP for available commands.`},
      {cls:'gap', text:''},
    ]);
    if (narrativeBeat < 2) {
      narrativeBeat = 2;
      setTimeout(() => typeWriter(narratives[2], document.getElementById('narr-text')), 500);
    }
    updateLeaveButton();
  }
}

function closeTerminal() {
  document.getElementById('term-overlay').classList.remove('open');
}

function printLine(text, cls) {
  const out = document.getElementById('term-output');
  const el = document.createElement('span');
  el.className = `term-line ${cls || 'out'}`;
  el.textContent = text;
  out.appendChild(el);
  out.appendChild(document.createElement('br'));
  out.scrollTop = out.scrollHeight;
}

function printLines(lines) {
  lines.forEach(({text, cls}) => printLine(text, cls));
}

function printPromptEcho(cmd) {
  printLine(`C:\\LKCO_RELAY> ${cmd}`, 'cmd');
}

// ============================================================
// TERMINAL INPUT
// ============================================================
function onTermInput(e) {
  if (e.key !== 'Enter') return;
  const raw = document.getElementById('term-input').value.trim();
  document.getElementById('term-input').value = '';
  if (!raw) { printLine('', 'out'); return; }

  printPromptEcho(raw);
  printLine('', 'gap');

  const parts = raw.toUpperCase().split(/\s+/);
  const cmd = parts[0];
  const arg = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'HELP':   doHelp(); break;
    case 'DIR':    doDir(arg); break;
    case 'TYPE':   doType(arg); break;
    case 'CD':     doCd(arg); break;
    case 'CLS':    document.getElementById('term-output').innerHTML = ''; break;
    case 'EXIT':
    case 'QUIT':   closeTerminal(); break;
    default:
      printLine(`Bad command or file name: ${raw}`, 'err');
      printLine('', 'gap');
  }
}

function doHelp() {
  printLines([
    {cls:'out', text:`Available commands:`},
    {cls:'out', text:`  DIR [path]      — list directory`},
    {cls:'out', text:`  TYPE [file]     — display file contents`},
    {cls:'out', text:`  CD [dir]        — change directory`},
    {cls:'out', text:`  CLS             — clear screen`},
    {cls:'out', text:`  EXIT            — close terminal`},
    {cls:'gap', text:''},
  ]);
}

function doDir(arg) {
  if (!arg || arg === '.') {
    DIR_LISTING.forEach(l => printLine(l, l.includes('<DIR>') ? 'out bright' : 'out'));
  } else if (arg === 'DIR_E' || arg === 'DIR_E\\' || arg === 'DIR_E/') {
    triggerDirE();
  } else {
    printLine(`File not found - ${arg}`, 'err');
  }
  printLine('', 'gap');
}

function doCd(arg) {
  if (arg === 'DIR_E' || arg === 'DIR_E\\' || arg === 'DIR_E/') {
    triggerDirE();
  } else if (arg === '..' || arg === '') {
    printLine(`C:\\LKCO_RELAY`, 'out');
  } else {
    printLine(`Invalid directory`, 'err');
  }
  printLine('', 'gap');
}

function doType(arg) {
  if (!arg) { printLine(`Required parameter missing`, 'err'); printLine('', 'gap'); return; }

  const upper = arg.toUpperCase();
  const fileKey = Object.keys(FILES).find(k => k.toUpperCase() === upper);

  if (fileKey) {
    const f = FILES[fileKey];
    if(typeof SW!=='undefined')SW.find(fileKey);
    printLine(`--- ${fileKey} ---`, 'amb');
    printLine('', 'gap');

    // Special case: append Ricky's message to chat log after leave triggered
    if (fileKey === 'CHAT_EARL.LOG' && chatLogRickyAppended) {
      f.lines.forEach(l => {
        const isChatLine = l.startsWith('02/14') || l.includes('[CONNECTION');
        printLine(l, isChatLine ? 'out' : 'out');
      });
      printLine('', 'gap');
      printLine(`01/16/94  16:47   [RICKY_M]  tell them i said it was worth it`, 'ricky');
      printLine('', 'gap');
    } else {
      f.lines.forEach(l => printLine(l, 'out'));
      printLine('', 'gap');
    }

    // Add item to inventory
    if (!itemsFound.has(fileKey)) {
      itemsFound.add(fileKey);
      addInventoryItem(f.icon, f.shortName, f.tag);
      addNote(`${f.shortName.split('.')[0]}: ${f.note.split('.')[0]}.`);
      document.getElementById('item-count').textContent = itemsFound.size;
      document.getElementById('no-items-msg') &&
        document.getElementById('no-items-msg').remove();
    }

    // Narrative triggers
    if (fileKey === 'CHAT_EARL.LOG' && narrativeBeat < 3) {
      narrativeBeat = 3;
      setTimeout(() => typeWriter(narratives[3], document.getElementById('narr-text')), 600);
    }
    updateLeaveButton();

  } else if (upper.startsWith('READING_') && upper.endsWith('.LOG')) {
    printLine(`--- ${arg} ---`, 'amb');
    printLine(``, 'gap');
    printLine(`4,891 bytes — reading...`, 'out');
    printLine(``, 'gap');
    setTimeout(() => {
      printLine(`NO RECOGNIZED ENCODING.`, 'err');
      printLine(`CONTENT CANNOT BE DISPLAYED.`, 'err');
      printLine(``, 'gap');
      printLine(`Origin:    UNKNOWN`, 'out');
      printLine(`Modified:  02-10-83  07:44a`, 'out');
      printLine(``, 'gap');
    }, 800);
  } else {
    printLine(`File not found - ${arg}`, 'err');
    printLine('', 'gap');
  }
}

// ============================================================
// DIR_E — HORROR TRIGGER
// ============================================================
function triggerDirE() {
  if (dirEAccessed) {
    // Already been here — show it again but quieter
    DIR_E_LISTING.forEach(l => printLine(l, l.includes('<DIR>') ? 'out bright' : 'out'));
    printLine('', 'gap');
    return;
  }
  dirEAccessed = true;

  // Show the listing
  DIR_E_LISTING.forEach((l, i) => {
    setTimeout(() => printLine(l, l.includes('<DIR>') ? 'out bright' : 'out'), i * 18);
  });

  const afterListing = DIR_E_LISTING.length * 18 + 400;

  // East Wall bar ticks up
  setTimeout(() => {
    updateEastWall(2.1, true);
    printLine('', 'gap');
    printLine(`[EAST WALL PROXIMITY: ELEVATED]`, 'amb');
    printLine('', 'gap');
    addInventoryItem('📡', 'DIR_E\\  [50 files]', 'All same size — all same timestamp');
    addNote(`DIR_E: 50 files. Same size. Same timestamp. Earl said: "they are not for reading."`);
    itemsFound.add('DIR_E');
    document.getElementById('item-count').textContent = itemsFound.size;
    document.getElementById('no-items-msg') &&
      document.getElementById('no-items-msg').remove();

    if (narrativeBeat < 4) {
      narrativeBeat = 4;
      setTimeout(() => typeWriter(narratives[4], document.getElementById('narr-text')), 500);
    }
    updateLeaveButton();
  }, afterListing);
}

// ============================================================
// EAST WALL UPDATE
// ============================================================
function updateEastWall(level, animate) {
  eastWallLevel = level;
  localStorage.setItem('sw_east_wall', eastWallLevel.toString());

  const pct = Math.min((level / 8) * 100, 100);
  document.getElementById('ew-bar').style.width = pct + '%';
  document.getElementById('ew-val').textContent = level.toFixed(1);

  const statusEl = document.getElementById('ew-status');
  if (level >= 2) {
    statusEl.textContent = 'STATUS: ELEVATED';
    statusEl.className = 'ew-status elevated';
  } else {
    statusEl.textContent = 'STATUS: BASELINE';
    statusEl.className = 'ew-status';
  }
}

// ============================================================
// LEAVE MECHANIC
// ============================================================
function updateLeaveButton() {
  // Unlock LEAVE once: terminal opened + DIR_E accessed
  if (terminalOpened && dirEAccessed && leaveLocked) {
    leaveLocked = false;
    document.getElementById('leave-btn').classList.add('active');
    document.getElementById('leave-note').textContent =
      `Ready to leave. Check the terminal first?`;
  }
}

function initLeave() {
  if (leaveLocked || leaveSequenceStarted) return;
  leaveSequenceStarted = true;

  // Self-type in terminal (reopen if closed)
  openTerminal();
  // Disable close button during horror sequence
  document.getElementById('term-close-btn').disabled = true;
  document.getElementById('term-close-btn').style.opacity = '0.3';

  // Pause, then terminal types by itself
  setTimeout(() => {
    printLine(``, 'gap');
    selfType(`> you should have listened to ricky`, () => {
      printLine(``, 'gap');

      // Append Ricky's message to chat log for later reading
      chatLogRickyAppended = true;

      if (narrativeBeat < 5) {
        narrativeBeat = 5;
        setTimeout(() => {
          typeWriter(narratives[5], document.getElementById('narr-text'));
        }, 1000);
      }

      // Re-enable close, then show leave overlay after delay
      setTimeout(() => {
        document.getElementById('term-close-btn').disabled = false;
        document.getElementById('term-close-btn').style.opacity = '';
      }, 1500);

      setTimeout(showLeaveOverlay, 4000);
    });
  }, 2200);
}

// ============================================================
// SELF-TYPING (the horror beat — irregular timing)
// ============================================================
function selfType(text, onComplete) {
  const out = document.getElementById('term-output');
  const line = document.createElement('span');
  line.className = 'term-line self';
  out.appendChild(line);
  out.appendChild(document.createElement('br'));
  out.scrollTop = out.scrollHeight;

  let i = 0;
  function nextChar() {
    if (i < text.length) {
      line.textContent += text[i];
      i++;
      out.scrollTop = out.scrollHeight;
      // Irregular timing — like someone who is not in a hurry
      const base = text[i-1] === ' ' ? 220 : 110;
      const jitter = Math.random() * 140;
      setTimeout(nextChar, base + jitter);
    } else {
      if (onComplete) setTimeout(onComplete, 600);
    }
  }
  // Pause before first character
  setTimeout(nextChar, 800);
}

// ============================================================
// LEAVE OVERLAY
// ============================================================
function showLeaveOverlay() {
  closeTerminal();
  const overlay = document.getElementById('leave-overlay');
  overlay.classList.add('open');
  const textEl = document.getElementById('lo-text');

  typeWriterEl(
    `You turn toward the door.\n\nBehind you, the terminal is still running. The cursor is still blinking.\n\nThe relay has been active for 4,020 days. It will keep running after you leave. That is what Earl said to do.\n\nLeave the system running.`,
    textEl,
    () => {
      setTimeout(() => {
        document.getElementById('lo-ricky').style.display = 'block';
        setTimeout(() => {
          document.getElementById('lo-meta').style.display = 'block';
          setTimeout(() => {
            document.getElementById('lo-continue').style.display = 'inline-block';
          }, 1200);
        }, 2000);
      }, 1500);
    }
  );
}

// ============================================================
// INVENTORY HELPERS
// ============================================================
function addInventoryItem(icon, name, tag) {
  const list = document.getElementById('item-list');
  const item = document.createElement('div');
  item.className = 'item-row';
  item.innerHTML = `<span class="item-icon">${icon}</span>
    <span class="item-name">${name}<span class="item-tag">${tag}</span></span>`;
  list.appendChild(item);
}

function addNote(text) {
  const na = document.getElementById('notes-area');
  const ln = document.createElement('span');
  ln.className = 'note-ln';
  ln.textContent = `— ${text}`;
  na.appendChild(ln);
}

// ============================================================
// TYPEWRITER
// ============================================================
function typeWriter(text, el, callback) {
  el.textContent = '';
  let i = 0;
  function tick() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      const ch = text[i-1];
      const delay = ch === '\n' ? 200 : ch === '.' || ch === ',' ? 60 : 20;
      setTimeout(tick, delay);
    } else {
      if (callback) callback();
    }
  }
  tick();
}

function typeWriterEl(text, el, callback) {
  el.textContent = '';
  let i = 0;
  function tick() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      const ch = text[i-1];
      const delay = ch === '\n' ? 220 : 18;
      setTimeout(tick, delay);
    } else {
      if (callback) callback();
    }
  }
  tick();
}
