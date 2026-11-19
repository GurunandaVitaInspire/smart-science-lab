// Music, sound effects and voice cheers, all made live with the Web Audio API
// (no audio files to download, works offline).

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const store = {
  get(k, d) { try { const v = localStorage.getItem('ssl.' + k); return v === null ? d : v === '1'; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ssl.' + k, v ? '1' : '0'); } catch { /* private mode */ } },
};

const BPM = 116;
const STEP = 60 / BPM / 4; // one 16th note
// C - G - Am - F, kid-friendly and bright
const CHORDS = [[60, 64, 67], [59, 62, 67], [60, 64, 69], [60, 65, 69]];
const BASS = [36, 43, 45, 41];
const ARP = [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 3, 2, 1];
const _ = null;
const LEAD = [
  76, _, 79, _, 81, _, 79, _, 76, _, 74, _, 72, _, _, _,
  74, _, 76, _, 79, _, _, _, 76, _, 74, _, _, _, _, _,
  76, _, 81, _, 84, _, 81, _, 79, _, 76, _, 81, _, _, _,
  77, _, 76, _, 74, _, 72, _, 74, _, 76, _, 72, _, _, _,
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicOn = store.get('music', true);
    this.sfxOn = store.get('sfx', true);
    this.voiceOn = store.get('voice', true);
    this.intensity = 0;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.voice = null;
    this.lastHover = 0;
  }

  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(comp); comp.connect(ctx.destination);
      this.music = ctx.createGain(); this.music.gain.value = 0.0001; this.music.connect(this.master);
      this.sfx = ctx.createGain(); this.sfx.gain.value = 0.75; this.sfx.connect(this.master);
      // echo for the sparkly arpeggio
      this.delay = ctx.createDelay(1); this.delay.delayTime.value = STEP * 3;
      const fb = ctx.createGain(); fb.gain.value = 0.28;
      const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
      this.delay.connect(dlp); dlp.connect(fb); fb.connect(this.delay); dlp.connect(this.music);
      // white noise for drums and whooshes
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.pickVoice();
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => this.pickVoice();
    } catch (e) { this.ctx = null; return false; }
    return true;
  }

  start() {
    if (!this.init()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicOn) this.startMusic();
  }

  /* ---------- music ---------- */
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    const g = this.music.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(0.34, this.ctx.currentTime, 0.6);
    this.timer = setInterval(() => this.schedule(), 25);
  }
  stopMusic() {
    clearInterval(this.timer); this.timer = null;
    if (this.ctx) { const g = this.music.gain; g.cancelScheduledValues(this.ctx.currentTime); g.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15); }
  }
  setIntensity(n) { this.intensity = Math.max(0, Math.min(2, n)); }

  schedule() {
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 0.15) {
      const s = this.step % 64, bar = (s / 16) | 0, k = s % 16, t = this.nextTime;
      const ch = CHORDS[bar];
      // drums
      if (k % 4 === 0) this.kick(t, k === 0 ? 0.9 : 0.7);
      if (k === 4 || k === 12) this.clap(t);
      if (k % 4 === 2) this.hat(t, 0.13);
      else if (this.intensity >= 1 && k % 2 === 1) this.hat(t, 0.05);
      // bass on 8ths with an octave bounce
      if (k % 2 === 0) this.bass(t, BASS[bar] + (k % 8 === 6 ? 12 : 0));
      // arpeggio
      const ai = ARP[k], note = ai === 3 ? ch[0] + 24 : ch[ai] + 12;
      this.pluck(t, note, k % 4 === 0 ? 0.075 : 0.05);
      // pad at the start of each bar
      if (k === 0) ch.forEach(n => this.pad(t, n, STEP * 16));
      // lead tune when the class is on a streak
      if (this.intensity >= 1 && LEAD[s] != null) this.lead(t, LEAD[s]);
      this.nextTime += STEP;
      this.step++;
    }
  }

  env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  osc(type, freq, t, dur, peak, dest, attack = 0.005) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    this.env(g, t, attack, peak, dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  noiseHit(t, dur, peak, filterType, freq, dest, q = 1) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); this.env(g, t, 0.002, peak, dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
    return f;
  }
  kick(t, v) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    this.env(g, t, 0.003, 0.55 * v, 0.28);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.3);
  }
  clap(t) { this.noiseHit(t, 0.16, 0.22, 'bandpass', 1600, this.music, 0.8); }
  hat(t, v) { this.noiseHit(t, 0.045, v, 'highpass', 7500, this.music); }
  bass(t, m) {
    const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + 0.18);
    this.env(g, t, 0.005, 0.2, 0.22);
    o.connect(f); f.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.3);
  }
  pluck(t, m, v) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'triangle'; o.frequency.value = mtof(m);
    this.env(g, t, 0.004, v, 0.16);
    o.connect(g); g.connect(this.music); g.connect(this.delay); o.start(t); o.stop(t + 0.2);
  }
  pad(t, m, dur) {
    for (const det of [-7, 7]) {
      const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 800;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  lead(t, m) {
    const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = 'square'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.value = 2400;
    this.env(g, t, 0.01, 0.06, STEP * 2.6);
    o.connect(f); f.connect(g); g.connect(this.music); g.connect(this.delay); o.start(t); o.stop(t + STEP * 3);
  }

  /* ---------- sound effects ---------- */
  ok() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; }
  tap() { if (!this.ok()) return; this.osc('sine', 880, this.ctx.currentTime, 0.06, 0.12, this.sfx); }
  hover() {
    if (!this.ok()) return;
    const now = performance.now(); if (now - this.lastHover < 70) return; this.lastHover = now;
    this.osc('sine', 1320, this.ctx.currentTime, 0.035, 0.03, this.sfx);
  }
  key() { if (!this.ok()) return; this.osc('square', 1500, this.ctx.currentTime, 0.03, 0.04, this.sfx); }
  whoosh() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const f = this.noiseHit(t, 0.4, 0.16, 'bandpass', 300, this.sfx, 1.2);
    f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
  }
  correct() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    [72, 76, 79, 84].forEach((m, i) => this.osc('triangle', mtof(m), t + i * 0.065, 0.35, 0.22, this.sfx));
    this.osc('sine', mtof(96), t + 0.26, 0.5, 0.1, this.sfx);
    for (let i = 0; i < 6; i++) this.osc('sine', mtof(96 + ((Math.random() * 12) | 0)), t + 0.3 + i * 0.05, 0.15, 0.04, this.sfx);
    const f = this.noiseHit(t, 0.3, 0.06, 'bandpass', 2000, this.sfx, 2);
    f.frequency.exponentialRampToValueAtTime(8000, t + 0.3);
  }
  wrong() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const a = this.osc('triangle', mtof(57), t, 0.22, 0.22, this.sfx, 0.01);
    a.frequency.linearRampToValueAtTime(mtof(55), t + 0.2);
    const b = this.osc('triangle', mtof(52), t + 0.2, 0.4, 0.22, this.sfx, 0.01);
    b.frequency.linearRampToValueAtTime(mtof(50), t + 0.55);
  }
  learn() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.osc('sine', mtof(79), t, 0.4, 0.18, this.sfx);
    this.osc('sine', mtof(84), t + 0.12, 0.6, 0.18, this.sfx);
  }
  pop() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const o = this.osc('sine', 380, t, 0.12, 0.25, this.sfx);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
  }
  brass(t, notes, dur, peak = 0.07) {
    for (const m of notes) {
      const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(m);
      f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(4200, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.03); g.gain.setValueAtTime(peak, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  streak() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.brass(t, [60, 64, 67], 0.14);
    this.brass(t + 0.15, [60, 64, 67], 0.14);
    this.brass(t + 0.3, [65, 69, 72], 0.14);
    this.brass(t + 0.45, [67, 72, 76, 84], 0.7, 0.08);
    for (let i = 0; i < 10; i++) this.osc('sine', mtof(96 + ((Math.random() * 14) | 0)), t + 0.5 + i * 0.04, 0.2, 0.05, this.sfx);
  }
  win() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const seq = [[60, 64, 67], [62, 65, 69], [64, 67, 72], [65, 69, 72], [67, 71, 74]];
    seq.forEach((c, i) => this.brass(t + i * 0.16, c, 0.15));
    this.brass(t + 0.85, [60, 64, 67, 72, 76], 1.6, 0.085);
    [84, 88, 91, 96].forEach((m, i) => this.osc('triangle', mtof(m), t + 0.9 + i * 0.09, 0.6, 0.08, this.sfx));
    for (let i = 0; i < 18; i++) this.osc('sine', mtof(96 + ((Math.random() * 16) | 0)), t + 1 + i * 0.05, 0.2, 0.04, this.sfx);
  }

  /* ---------- voice cheers ---------- */
  pickVoice() {
    const ss = window.speechSynthesis; if (!ss) return;
    const vs = ss.getVoices(); if (!vs.length) return;
    const score = v => (/en-IN/i.test(v.lang) ? 4 : 0) + (/en-(GB|US)/i.test(v.lang) ? 2 : 0) + (/female|zira|heera|samantha|google/i.test(v.name) ? 1 : 0) + (/^en/i.test(v.lang) ? 1 : 0);
    this.voice = vs.slice().sort((a, b) => score(b) - score(a))[0];
  }
  say(text) {
    const ss = window.speechSynthesis;
    if (!this.voiceOn || !ss || !this.ctx) return;
    try {
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) u.voice = this.voice;
      u.rate = 1.02; u.pitch = 1.25; u.volume = 1;
      const g = this.music.gain, now = this.ctx.currentTime;
      if (this.timer) { g.cancelScheduledValues(now); g.setTargetAtTime(0.14, now, 0.1); }
      u.onend = u.onerror = () => { if (this.timer && this.ctx) { g.cancelScheduledValues(this.ctx.currentTime); g.setTargetAtTime(0.34, this.ctx.currentTime, 0.4); } };
      ss.speak(u);
    } catch { /* no voice on this device */ }
  }

  /* ---------- toggles ---------- */
  toggleMusic() {
    this.musicOn = !this.musicOn; store.set('music', this.musicOn);
    if (this.musicOn) { this.init(); if (this.ctx.state === 'suspended') this.ctx.resume(); this.startMusic(); } else this.stopMusic();
    return this.musicOn;
  }
  toggleSfx() { this.sfxOn = !this.sfxOn; store.set('sfx', this.sfxOn); return this.sfxOn; }
  toggleVoice() {
    this.voiceOn = !this.voiceOn; store.set('voice', this.voiceOn);
    if (!this.voiceOn && window.speechSynthesis) window.speechSynthesis.cancel();
    return this.voiceOn;
  }
  pause() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
}

export const audio = new AudioEngine();

const pick = a => a[(Math.random() * a.length) | 0];
export const CHEERS = ['Awesome!', 'Brilliant!', 'Super!', 'Excellent!', 'You got it!', 'Fantastic!', 'Great job!', 'Wow, correct!', 'Perfect!', 'Superb!'];
export const STREAK_CHEERS = ['You are on fire!', 'Unstoppable!', 'Chemistry champion!', 'Amazing streak!', 'Super scientist!'];
export const WRONG_LINES = ['Oops! Look, this is the correct answer. Tap it!', 'Not quite! See the glowing answer? Tap it!', 'Almost! Here is the right one. Tap it to learn it.'];
export const LEARN_LINES = ['Now you know it!', 'That\'s it! Remember it.', 'Good! Now you have learnt it.'];
export const cheer = () => pick(CHEERS);
export const streakCheer = () => pick(STREAK_CHEERS);
export const wrongLine = () => pick(WRONG_LINES);
export const learnLine = () => pick(LEARN_LINES);
