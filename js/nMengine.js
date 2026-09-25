// ==========================================
// SECWATCH // NIGHTMARE ENGINE (nMengine.js)
// ==========================================

const GRID_SIZE = 7;
const TILE_W = 82; // 78px width + 4px gap

// Advanced Actions Schema
const ACTIONS = {
  'MOVE_L':   { id: 'MOVE_L', name: '< PULL', desc: 'Retreat 1', type: 'move', val: -1, cd: 0 },
  'MOVE_R':   { id: 'MOVE_R', name: 'PUSH >', desc: 'Advance 1', type: 'move', val: 1, cd: 0 },
  'LUCID':    { id: 'LUCID', name: 'LUCID', desc: 'Dmg 1 (Rng 2)', type: 'atk', rng: 2, dmg: 1, cd: 1 },
  'LASH_OUT': { id: 'LASH_OUT', name: 'LASH OUT', desc: 'Dmg 2 (Adj)', type: 'atk', rng: 1, dmg: 2, cd: 2 },
  'BRACE':    { id: 'BRACE', name: 'BRACE', desc: 'Block 1 Hit', type: 'def', cd: 3 },
  'SURGE':    { id: 'SURGE', name: 'SURGE', desc: 'Move 2 Spaces', type: 'move', val: 2, cd: 2 },
  'SCREAM':   { id: 'SCREAM', name: 'SCREAM', desc: 'Push Foe (Rng 2)', type: 'push', rng: 2, cd: 3 },
  'BREATHE':  { id: 'BREATHE', name: 'BREATHE', desc: 'Heal 1 MIND', type: 'heal', cd: 4 }
};

// --- STATE ---
let state = {
  player: { pos: 1, hp: 3, maxHp: 3, shield: false },
  enemies: [],
  deck: ['MOVE_L', 'MOVE_R', 'LUCID', 'LASH_OUT'],
  cooldowns: {},
  queue: [],
  cycle: 1,
  animating: false
};

const gridEl = document.getElementById('grid');
const arenaEl = document.getElementById('arena');
const queueEl = document.getElementById('queue-area');
const handEl = document.getElementById('hand');
const execBtn = document.getElementById('btn-exec');
const wrapperEl = document.getElementById('game-wrapper');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==========================================
// FMV INTRO HOOKS
// ==========================================
const vid = document.getElementById('intro-video');
const fmvOverlay = document.getElementById('fmv-overlay');

document.addEventListener('keydown', function startVid(e) {
  if (e.key === 'Enter' && fmvOverlay.style.display !== 'none') {
    endFMV(); 
  }
});

if(vid) {
  vid.onended = () => { endFMV(); };
  vid.play().catch(e => { console.log("Waiting for interaction to play FMV."); });
}

function endFMV() {
  if(vid) vid.pause();
  fmvOverlay.style.display = 'none';
  wrapperEl.style.display = 'flex';
  
  // INITIALIZE THE AUDIO ENGINE
  if (typeof JAMengine !== 'undefined') {
    JAMengine.init(); 
  }
  
  initGame();
}

// ==========================================
// CORE ENGINE
// ==========================================
function initGame() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('draft-overlay').style.display = 'none';
  document.body.classList.remove('glitch-anim');
  
  gridEl.innerHTML = '';
  for(let i=0; i<GRID_SIZE; i++) gridEl.appendChild(Object.assign(document.createElement('div'), {className: 'tile', id: 'tile-'+i}));

  state = {
    player: { pos: 1, hp: 3, maxHp: 3, shield: false },
    enemies: [{ pos: 6, hp: 2, maxHp: 2, intent: 'move' }], 
    deck: ['MOVE_L', 'MOVE_R', 'LUCID', 'LASH_OUT'],
    cooldowns: {},
    queue: [],
    cycle: 1,
    animating: false
  };

  document.getElementById('wave-counter').innerText = `STAGE: ${state.cycle}`;
  render();
}

function restartFromDeath() {
  state.player.hp = state.player.maxHp;
  state.player.pos = 1;
  state.player.shield = false;
  state.cycle = 1;
  state.queue = [];
  state.cooldowns = {};
  state.enemies = [{ pos: 6, hp: 2, maxHp: 2, intent: 'move' }];
  
  document.getElementById('overlay').style.display = 'none';
  document.body.classList.remove('glitch-anim');
  document.getElementById('wave-counter').innerText = `STAGE: ${state.cycle}`;
  
  // Restart audio if they try again
  if (typeof JAMengine !== 'undefined') JAMengine.init();
  
  render();
}

function stayUpAllNight() {
  localStorage.setItem('sw_tired', 'true');
  window.location.href = 'day5.html'; 
}

// --- RENDERING ---
function render() {
  document.querySelectorAll('.entity').forEach(e => e.remove());
  document.querySelectorAll('.tile').forEach(t => t.classList.remove('target'));

  // The Mind (Player)
  let pEl = document.createElement('div');
  pEl.className = `entity player ${state.player.shield ? 'shielded' : ''}`;
  pEl.innerText = '@';
  pEl.style.left = `calc(50% - ${(GRID_SIZE/2)*TILE_W}px + ${state.player.pos * TILE_W + 9}px)`;
  pEl.innerHTML += `<div class="hp-bar">MIND:${state.player.hp}/${state.player.maxHp}</div>`;
  arenaEl.appendChild(pEl);

  // The Terrors (Enemies)
  state.enemies.forEach(e => {
    let eEl = document.createElement('div');
    eEl.className = 'entity enemy';
    eEl.innerText = '⏣';
    eEl.style.left = `calc(50% - ${(GRID_SIZE/2)*TILE_W}px + ${e.pos * TILE_W + 9}px)`;
    eEl.innerHTML += `<div class="hp-bar">ERR:${e.hp}</div>`;
    eEl.innerHTML += `<div class="intent-icon">${e.intent === 'atk' ? '[ STRIKING ]' : '[ LURKING ]'}</div>`;
    
    if(e.intent === 'atk' && e.pos - 1 >= 0) document.getElementById('tile-'+(e.pos-1)).classList.add('target');
    arenaEl.appendChild(eEl);
  });

  // Intent Queue
  queueEl.innerHTML = '<div class="queue-label">SYNAPSE QUEUE (MAX 3)</div>';
  state.queue.forEach((actKey, idx) => {
    let c = createCardEl(ACTIONS[actKey]);
    c.onclick = () => { if(!state.animating) { state.queue.splice(idx,1); render(); } };
    queueEl.appendChild(c);
  });

  drawHand();
  execBtn.disabled = state.queue.length === 0 || state.animating;
}

function drawHand() {
  handEl.innerHTML = '';
  state.deck.forEach(k => {
    let c = createCardEl(ACTIONS[k]);
    let isOnCD = state.cooldowns[k] > 0;
    let isQueued = state.queue.includes(k); 
    
    if(isOnCD || isQueued) {
      c.classList.add('disabled');
      if(isOnCD) c.innerHTML += `<div class="cd-overlay">WAIT ${state.cooldowns[k]}</div>`;
    } else {
      c.onclick = () => { 
        if(state.queue.length < 3 && !state.animating) { 
          // AUDIO: Play card tap sound
          if (typeof JAMengine !== 'undefined') JAMengine.playSFX('tapp', 0.6);
          
          state.queue.push(k); 
          render(); 
        } 
      };
    }
    handEl.appendChild(c);
  });
}

function createCardEl(act) {
  let d = document.createElement('div');
  d.className = 'card';
  d.innerHTML = `<span class="title">${act.name}</span><span class="desc">${act.desc}</span>`;
  return d;
}

function triggerShake(type = 'light') {
  wrapperEl.classList.remove('shake-light', 'shake-heavy');
  void wrapperEl.offsetWidth; 
  wrapperEl.classList.add(type === 'heavy' ? 'shake-heavy' : 'shake-light');
}

function triggerDamageVFX() {
  let flash = document.createElement('div');
  flash.className = 'blood-flash';
  document.body.appendChild(flash);
  document.body.classList.add('glitch-anim');
  setTimeout(() => {
    flash.remove();
    document.body.classList.remove('glitch-anim');
  }, 250);
}

// --- COMBAT EXECUTION ---
async function executeTurn() {
  // AUDIO: Fade in the heavy action chords!
  if (typeof JAMengine !== 'undefined') JAMengine.fadeActionIn();
  
  state.animating = true;
  execBtn.disabled = true;

  for(let k in state.cooldowns) { if(state.cooldowns[k] > 0) state.cooldowns[k]--; }

  // 1. Process Player Queue
  while(state.queue.length > 0) {
    let actKey = state.queue.shift();
    let act = ACTIONS[actKey];
    
    if(act.cd > 0) state.cooldowns[actKey] = act.cd;
    render(); 
    
    if(act.type === 'move') {
      let dir = act.val > 0 ? 1 : -1;
      let steps = Math.abs(act.val);
      for(let s=0; s<steps; s++) {
        let nPos = state.player.pos + dir;
        if(nPos >= 0 && nPos < GRID_SIZE && !state.enemies.find(e => e.pos === nPos)) state.player.pos = nPos;
      }
      triggerShake('light');
    } 
    else if (act.type === 'atk') {
      let tPos = state.player.pos + act.rng;
      let tEl = document.getElementById('tile-'+tPos);
      if(tEl) { tEl.classList.add('flash'); setTimeout(() => tEl.classList.remove('flash'), 150); }
      
      let hit = state.enemies.find(e => e.pos === tPos || (act.rng > 1 && e.pos > state.player.pos && e.pos <= tPos));
      if(hit) { 
        triggerShake('heavy'); 
        // AUDIO: Play attack sound
        if (typeof JAMengine !== 'undefined') JAMengine.playSFX('atk');
        hit.hp -= act.dmg; 
      }
    }
    else if (act.type === 'def') {
      state.player.shield = true;
    }
    else if (act.type === 'heal') {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
    }
    else if (act.type === 'push') {
      let tPos = state.player.pos + act.rng;
      let hit = state.enemies.find(e => e.pos === tPos || (act.rng > 1 && e.pos > state.player.pos && e.pos <= tPos));
      if(hit && hit.pos < GRID_SIZE - 1 && !state.enemies.find(o => o.pos === hit.pos + 1)) {
        hit.pos++; triggerShake('light');
      }
    }
    await sleep(400);
    state.enemies = state.enemies.filter(e => e.hp > 0);
    render();
  }

  await sleep(400);

  // 2. Process Enemy AI
  for(let i=0; i<state.enemies.length; i++) {
    let e = state.enemies[i];
    if(e.intent === 'atk') {
      if(e.pos - 1 === state.player.pos) {
        triggerShake('heavy');
        if(state.player.shield) {
          state.player.shield = false; // Block consumed
        } else {
          state.player.hp -= 1;
          
          // AUDIO: Play random dynamic damage sound
          if (typeof JAMengine !== 'undefined') JAMengine.playDamage();
          
          triggerDamageVFX();
        }
      }
    } else if (e.intent === 'move') {
      let nextPos = e.pos - 1;
      if(nextPos > state.player.pos && !state.enemies.find(o => o.pos === nextPos)) {
        e.pos = nextPos;
        triggerShake('light'); 
      }
    }
    
    e.intent = (e.pos - 1 === state.player.pos) ? 'atk' : 'move';
    await sleep(350);
    render();
  }

  // 3. Check Board State
  if(state.player.hp <= 0) {
    if (typeof JAMengine !== 'undefined') {
      JAMengine.stopMusic();
      JAMengine.playSFX('death', 0.9);
    }
    document.getElementById('overlay').style.display = 'flex';
    return;
  }

  if(state.enemies.length === 0) {
    if (typeof JAMengine !== 'undefined') {
      // Note: We leave the base music playing here so the draft screen stays creepy!
      JAMengine.playSFX('won', 0.8);
    }
    triggerDraft();
    return;
  }

  state.animating = false;
  
  // AUDIO: Fade out the heavy action chords
  if (typeof JAMengine !== 'undefined') JAMengine.fadeActionOut();
  
  render();
}

// --- DRAFTING PHASE ---
function triggerDraft() {
  // Fade out action music while picking a card
  if (typeof JAMengine !== 'undefined') JAMengine.fadeActionOut();
  
  let draftEl = document.getElementById('draft-cards');
  draftEl.innerHTML = '';
  
  let available = Object.keys(ACTIONS).filter(k => !state.deck.includes(k));
  available = available.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  if(available.length === 0) { startNextCycle(); return; }

  available.forEach(k => {
    let act = ACTIONS[k];
    let c = document.createElement('div');
    c.className = 'draft-card';
    c.innerHTML = `<span style="font-size:18px; font-weight:bold; color:var(--g);">${act.name}</span>
                   <span style="font-size:12px; color:var(--gdim);">${act.desc}</span>
                   <span style="font-size:11px; color:var(--amb); margin-top:10px;">CD: ${act.cd} TURNS</span>`;
    c.onclick = () => {
      state.deck.push(k);
      document.getElementById('draft-overlay').style.display = 'none';
      startNextCycle();
    };
    draftEl.appendChild(c);
  });

  document.getElementById('draft-overlay').style.display = 'flex';
}

function startNextCycle() {
  state.cycle++;
  document.getElementById('wave-counter').innerText = `STAGE: ${state.cycle}`;
  
  // Escalating difficulty
  state.enemies.push({ pos: 6, hp: 2 + Math.floor(state.cycle/2), maxHp: 2, intent: 'move' });
  if(state.cycle >= 2) state.enemies.push({ pos: 5, hp: Math.floor(state.cycle/1.5), maxHp: 1, intent: 'move' });
  if(state.cycle >= 4) state.enemies.push({ pos: 4, hp: 1, maxHp: 1, intent: 'move' });

  state.animating = false;
  render();
}