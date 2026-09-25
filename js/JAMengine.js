// ==========================================
// SECWATCH // ADAPTIVE AUDIO ENGINE (JAMengine)
// ==========================================
const JAMengine = {
  ctx: null,
  actionGain: null,
  baseGain: null,
  buffers: {},
  
  // Your exact math!
  barLength: 6.7105, 

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Helper function to fetch and decode audio files
    const load = async (name, path) => {
      try {
        const resp = await fetch(path);
        const buf = await resp.arrayBuffer();
        this.buffers[name] = await this.ctx.decodeAudioData(buf);
      } catch(e) { 
        console.warn(`[JAMengine] Could not load: ${path}`); 
      }
    };

    // 1. LOAD ALL YOUR 13 TRACKS
    await Promise.all([
      // Loops
      load('tempo', 'audio/jam/jam_tempo.mp3'),
      load('drone_base', 'audio/jam/jam_drone1-d4x.mp3'),
      load('bass_action', 'audio/jam/jam_bassline2x.mp3'),
      load('drone_fx', 'audio/jam/jam_drone1-fx4x.mp3'),
      load('wot_action', 'audio/jam/jam_wot_4x.mp3'),
      load('zelda_action', 'audio/jam/jam_zelda2x.mp3'),
      // SFX
      load('tapp', 'audio/jam/jam_tapp.mp3'),
      load('atk', 'audio/jam/jam_atk.mp3'),
      load('dmg1', 'audio/jam/jam_dmg1.mp3'),
      load('dmg2', 'audio/jam/jam_dmg2.mp3'),
      load('dmg3', 'audio/jam/jam_dmg3.mp3'),
      load('won', 'audio/jam/jam_won.mp3'),
      load('death', 'audio/jam/jam_sucks_org.mp3')
    ]);

    this.baseGain = this.ctx.createGain();
    this.baseGain.connect(this.ctx.destination);
    
    this.actionGain = this.ctx.createGain();
    this.actionGain.gain.value = 0; // Action tracks start muted!
    this.actionGain.connect(this.ctx.destination);

    // 2. START THE LOOPS
    // playLoop(bufferName, multiplier, targetGainNode)
    this.playLoop('tempo', 4, this.baseGain); // Assuming tempo is 4 bars long
    this.playLoop('drone_base', 4, this.baseGain);
    
    this.playLoop('bass_action', 2, this.actionGain);
    this.playLoop('drone_fx', 4, this.actionGain);
    this.playLoop('wot_action', 4, this.actionGain);
    this.playLoop('zelda_action', 2, this.actionGain);
  },

  // Helper to start perfectly cut loops based on your 2x/4x names
  playLoop(name, bars, destination) {
    if(!this.buffers[name]) return;
    const node = this.ctx.createBufferSource();
    node.buffer = this.buffers[name];
    node.loop = true;
    node.loopEnd = this.barLength * bars; // Mathematically crops the file!
    node.connect(destination);
    node.start(0);
  },

  // 3. SFX TRIGGERS
  playSFX(name, volume = 1.0) {
    if(!this.ctx || !this.buffers[name]) return;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.ctx.destination);
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[name];
    source.connect(gain);
    source.start(0);
  },

  // 4. DYNAMIC DAMAGE (Picks a random hit sound!)
  playDamage() {
    const hits = ['dmg1', 'dmg2', 'dmg3'];
    const randomHit = hits[Math.floor(Math.random() * hits.length)];
    this.playSFX(randomHit, 0.8);
  },

  // 5. CROSSFADES
  fadeActionIn() {
    if(!this.ctx || !this.actionGain) return;
    this.actionGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.5); 
  },

  fadeActionOut() {
    if(!this.ctx || !this.actionGain) return;
    this.actionGain.gain.setTargetAtTime(0, this.ctx.currentTime, 1.0); 
  },
  
  // Cut all looping music (for Death/Win screens)
  stopMusic() {
    if(this.baseGain) this.baseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    if(this.actionGain) this.actionGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
  }
};