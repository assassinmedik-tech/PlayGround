/**
 * Tiny procedural sound engine — no audio assets required.
 * Everything is synthesized through Web Audio on demand.
 */
export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.muted = false;
    this.volume = 0.42;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);

    const len = Math.floor(this.ctx.sampleRate * 0.7);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  tone({ freq = 220, freq2 = null, type = "sine", dur = 0.15, vol = 0.2, delay = 0, attack = 0.004 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.t + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.15, vol = 0.2, freq = 1200, q = 0.9, type = "bandpass", freq2 = null, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.t + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, t0);
    filt.Q.value = q;
    if (freq2) filt.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  hitLight() {
    this.noise({ dur: 0.1, vol: 0.32, freq: 1900, q: 0.7 });
    this.tone({ freq: 180, freq2: 70, type: "triangle", dur: 0.11, vol: 0.28 });
  }

  hitHeavy() {
    this.noise({ dur: 0.2, vol: 0.4, freq: 900, q: 0.6, type: "lowpass" });
    this.tone({ freq: 120, freq2: 45, type: "sine", dur: 0.28, vol: 0.5 });
    this.tone({ freq: 260, freq2: 90, type: "square", dur: 0.1, vol: 0.12 });
  }

  block() {
    this.noise({ dur: 0.08, vol: 0.22, freq: 3200, q: 2.2 });
    this.tone({ freq: 620, freq2: 420, type: "square", dur: 0.07, vol: 0.08 });
  }

  whiff() {
    this.noise({ dur: 0.14, vol: 0.13, freq: 700, freq2: 2300, q: 0.8 });
  }

  jump() {
    this.tone({ freq: 260, freq2: 430, type: "triangle", dur: 0.14, vol: 0.09 });
  }

  land() {
    this.noise({ dur: 0.08, vol: 0.12, freq: 500, q: 0.7, type: "lowpass" });
  }

  fireball() {
    this.tone({ freq: 220, freq2: 880, type: "sawtooth", dur: 0.34, vol: 0.14 });
    this.noise({ dur: 0.3, vol: 0.16, freq: 500, freq2: 2600, q: 0.9 });
  }

  superMove() {
    this.tone({ freq: 90, freq2: 40, type: "sine", dur: 0.9, vol: 0.45 });
    this.tone({ freq: 440, freq2: 110, type: "sawtooth", dur: 0.7, vol: 0.13 });
    this.noise({ dur: 0.9, vol: 0.3, freq: 2000, freq2: 200, q: 0.6 });
    this.tone({ freq: 880, freq2: 1320, type: "triangle", dur: 0.5, vol: 0.1, delay: 0.1 });
  }

  ko() {
    this.tone({ freq: 70, freq2: 28, type: "sine", dur: 1.1, vol: 0.55 });
    this.noise({ dur: 0.8, vol: 0.35, freq: 1200, freq2: 120, type: "lowpass" });
    this.tone({ freq: 220, freq2: 55, type: "sawtooth", dur: 0.8, vol: 0.12 });
  }

  bell() {
    this.tone({ freq: 880, freq2: 878, type: "triangle", dur: 0.9, vol: 0.14 });
    this.tone({ freq: 1320, freq2: 1318, type: "sine", dur: 0.7, vol: 0.08, delay: 0.02 });
    this.tone({ freq: 1760, freq2: 1758, type: "sine", dur: 0.5, vol: 0.04, delay: 0.03 });
  }

  ui() {
    this.tone({ freq: 520, freq2: 660, type: "sine", dur: 0.07, vol: 0.07 });
  }

  select() {
    this.tone({ freq: 440, type: "triangle", dur: 0.1, vol: 0.1 });
    this.tone({ freq: 660, type: "triangle", dur: 0.14, vol: 0.08, delay: 0.06 });
  }

  fight() {
    this.bell();
    this.tone({ freq: 160, freq2: 320, type: "sawtooth", dur: 0.3, vol: 0.1 });
    this.noise({ dur: 0.25, vol: 0.2, freq: 800, freq2: 2400 });
  }

  timeUp() {
    this.tone({ freq: 440, freq2: 440, type: "square", dur: 0.16, vol: 0.1 });
    this.tone({ freq: 330, freq2: 330, type: "square", dur: 0.3, vol: 0.1, delay: 0.2 });
  }
}
