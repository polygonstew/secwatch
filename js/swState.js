/* ════════════════════════════════════════════════════════
   SECWATCH  --  shared save  (js/swState.js)

   One save object for the whole game, in localStorage under
   'secwatch_save'. Load this BEFORE any day engine.

   The day pages were written at different times and each kept
   its own keys:
     localStorage   sw_name, sw_east_wall, sw_custodian, sw_tired
     sessionStorage sw_tl, sw_player, sw_badge, sw_tl9
   Instead of rewriting every page, SW keeps those legacy keys in
   sync with the save both ways:
     - on load:     adopt any legacy key that changed since we
                    last wrote it, then write the save back out
     - on pagehide: adopt again (catches TL bars, day5 choices)
   So old pages keep reading/writing their own keys and the save
   stays the single source of truth across days, tabs and reloads.

   API
     SW.save                     the save object (read freely)
     SW.find(id)                 log a piece of evidence (file, tape,
                                 extension...). Unlocks cards for the
                                 Night Shift -- see js/dreamData.js
     SW.has(id)                  evidence already found?
     SW.setBars({h,l,s,e})       overwrite threat bars
     SW.flag(key, value)         set a story flag
     SW.commit()                 write save + legacy keys now
     SW.reset()                  wipe everything (new game)
════════════════════════════════════════════════════════ */
(function(){
  const KEY = 'secwatch_save';
  const BLANK = () => ({
    v: 1,
    name: null,           // player name (name-game / Day 3 prompt)
    badge: null,          // badge # typed at Day 1 login
    bars: { h:0, l:0, s:0, e:0 },
    ewRaw: null,          // Day 4/5 float east-wall value (-1 = '--')
    flags: {},            // custodian, tired, tl9, night_1 ...
    evidence: [],         // ids passed to SW.find()
    deck: [],             // Night Shift cards earned (card ids)
    _pushed: {}           // last value we wrote to each legacy key
  });

  const ls = safeStore(() => window.localStorage);
  const ss = safeStore(() => window.sessionStorage);

  function safeStore(get){
    let s = null;
    try{ s = get(); s.getItem('x'); }catch(e){ s = null; }
    return {
      get(k){ try{ return s ? s.getItem(k) : null; }catch(e){ return null; } },
      set(k,v){ try{ if(s) s.setItem(k, v); }catch(e){} },
      del(k){ try{ if(s) s.removeItem(k); }catch(e){} }
    };
  }

  function load(){
    try{
      const raw = ls.get(KEY);
      if(raw){
        const o = JSON.parse(raw);
        const b = BLANK();
        return Object.assign(b, o, { bars: Object.assign(b.bars, o.bars || {}),
                                     flags: o.flags || {}, _pushed: o._pushed || {} });
      }
    }catch(e){}
    return BLANK();
  }

  const save = load();

  function clampBar(n){ n = Number(n); return isNaN(n) ? 0 : Math.max(0, Math.min(10, n)); }

  /* legacy key -> how to read it into the save */
  const LEGACY = [
    { store: ss, key: 'sw_tl', read(v){
        try{ const b = JSON.parse(v || '{}');
             ['h','l','s','e'].forEach(k => { if(k in b) save.bars[k] = clampBar(b[k]); }); }catch(e){} },
      write(){ return JSON.stringify(save.bars); } },
    { store: ls, key: 'sw_name',   read(v){ if(v) save.name = v; },  write(){ return save.name; } },
    { store: ss, key: 'sw_player', read(v){ if(v) save.name = v; },  write(){ return save.name; } },
    { store: ss, key: 'sw_badge',  read(v){ if(v) save.badge = v; }, write(){ return save.badge; } },
    { store: ls, key: 'sw_east_wall', read(v){
        const f = parseFloat(v);
        if(isNaN(f)) return;
        save.ewRaw = f;
        save.bars.e = f < 0 ? 10 : clampBar(Math.round(f)); },
      /* keep Day 4's float (2.1 etc.) while it still matches the bar;
         once a night or another day moves the bar, write the bar */
      write(){
        const r = save.ewRaw, e = save.bars.e;
        if(r !== null && (r < 0 ? e >= 10 : Math.round(r) === e)) return String(r);
        return String(e);
      } },
    { store: ls, key: 'sw_custodian', read(v){ if(v) save.flags.custodian = v === 'true'; },
      write(){ return 'custodian' in save.flags ? String(save.flags.custodian) : null; } },
    { store: ls, key: 'sw_tired', read(v){ if(v) save.flags.tired = v === 'true'; },
      write(){ return 'tired' in save.flags ? String(save.flags.tired) : null; } },
    { store: ss, key: 'sw_tl9', read(v){ if(v) save.flags.tl9 = true; },
      write(){ return save.flags.tl9 ? '1' : null; } }
  ];

  /* adopt only legacy values that changed since we pushed them --
     otherwise a stale key would stomp a newer value from elsewhere */
  function pull(){
    LEGACY.forEach(L => {
      const v = L.store.get(L.key);
      if(v === null || v === save._pushed[L.key]) return;
      L.read(v);
    });
    /* live TL on the current page wins over everything (Day 1 never
       wrote its bars anywhere; this is what carries them to Day 2) */
    try{
      if(typeof TL !== 'undefined' && TL && TL.bars){
        ['h','l','s','e'].forEach(k => { save.bars[k] = clampBar(TL.bars[k]); });
      }
    }catch(e){}
    /* Day 1 keeps the name/badge on its own state object */
    try{
      if(typeof S !== 'undefined' && S){
        if(S.playerName) save.name = S.playerName;
        if(S.employeeID) save.badge = S.employeeID;
      }
    }catch(e){}
  }

  function push(){
    LEGACY.forEach(L => {
      const v = L.write();
      if(v === null || v === undefined) return;
      L.store.set(L.key, v);
      save._pushed[L.key] = v;
    });
    ls.set(KEY, JSON.stringify(save));
  }

  function commit(){ pull(); push(); }

  pull(); push();
  window.addEventListener('pagehide', commit);
  window.addEventListener('beforeunload', commit);

  window.SW = {
    save,
    commit,
    find(id){
      id = String(id || '').toUpperCase().trim();
      if(!id || save.evidence.includes(id)) return false;
      save.evidence.push(id);
      push();
      return true;
    },
    has(id){ return save.evidence.includes(String(id).toUpperCase()); },
    setBars(b){ ['h','l','s','e'].forEach(k => { if(b && k in b) save.bars[k] = clampBar(b[k]); }); push(); },
    flag(k, v){ save.flags[k] = v; push(); },
    /* Day 1 calls this: a fresh shift. Keeps the name (the wall
       remembers it), clears everything the last run earned. */
    newRun(){
      const name = save.name;
      Object.assign(save, BLANK(), { name });
      LEGACY.forEach(L => { if(L.key !== 'sw_name' && L.key !== 'sw_player') L.store.del(L.key); });
      push();
    },
    reset(){
      ls.del(KEY);
      LEGACY.forEach(L => L.store.del(L.key));
      location.reload();
    }
  };
})();
