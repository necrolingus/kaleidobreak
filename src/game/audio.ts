import { BPM } from "@/game/types";

const STEP = 60 / BPM / 4;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let musicOn = false;
let origin = 0;
let nextTime = 0;
let stepIndex = 0;
let timer = 0;
let voices = 0;
let musicLevel = 0.7;
let sfxLevel = 0.85;
let muted = false;
let duckUntil = 0;
let built = false;

function curve(v: number): number {
  return v * v;
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 16;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    built = true;
    applyGains();
    timer = window.setInterval(schedule, 25);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function applyGains(): void {
  if (!ctx || !master || !musicBus || !sfxBus) return;
  const now = ctx.currentTime;
  const duck = now < duckUntil ? 0.35 : 1;
  const m = muted ? 0 : curve(musicLevel) * 0.42 * duck;
  const s = muted ? 0 : curve(sfxLevel) * 0.9;
  musicBus.gain.setTargetAtTime(Math.max(0.0001, m), now, 0.03);
  sfxBus.gain.setTargetAtTime(Math.max(0.0001, s), now, 0.02);
  master.gain.setTargetAtTime(0.9, now, 0.03);
}

function env(bus: GainNode, t: number, peak: number, dur: number): GainNode {
  const audio = ctx!;
  const g = audio.createGain();
  g.connect(bus);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, dur));
  return g;
}

function done(node: AudioNode, ...extra: AudioNode[]): void {
  voices++;
  const anyNode = node as AudioNode & { onended: (() => void) | null };
  anyNode.onended = () => {
    voices = Math.max(0, voices - 1);
    try {
      node.disconnect();
      for (const e of extra) e.disconnect();
    } catch {
      /* already disconnected */
    }
  };
}

function tone(bus: GainNode, t: number, freq: number, dur: number, type: OscillatorType, peak: number): void {
  if (!ctx || voices > 28) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(40, freq), t);
  const g = env(bus, t, peak, dur);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.02);
  done(o, g);
}

function noiseHit(bus: GainNode, t: number, dur: number, peak: number, hp = 0): void {
  if (!ctx || !noiseBuf || voices > 28) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const g = env(bus, t, peak, dur);
  if (hp > 0) {
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    src.connect(f);
    f.connect(g);
    src.start(t);
    src.stop(t + dur + 0.02);
    done(src, f, g);
    return;
  }
  src.connect(g);
  src.start(t);
  src.stop(t + dur + 0.02);
  done(src, g);
}

function kick(t: number): void {
  if (!ctx || !musicBus) return;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(148, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.09);
  const g = env(musicBus, t, 0.95, 0.22);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.24);
  done(o, g);
}

function hat(t: number, peak: number): void {
  if (!musicBus) return;
  noiseHit(musicBus, t, 0.04, peak, 7000);
}

function clap(t: number): void {
  if (!ctx || !musicBus || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1800;
  f.Q.value = 0.7;
  const g = env(musicBus, t, 0.28, 0.12);
  src.connect(f);
  f.connect(g);
  src.start(t);
  src.stop(t + 0.14);
  done(src, f, g);
}

const BASS = [0, -1, 0, 4, -1, 0, 4, -1, 2, -1, 2, 0, -1, 4, 0, -1];
const SCALE = [110, 130.81, 146.83, 164.81, 196];

function bass(t: number, degree: number, root: number): void {
  if (!ctx || !musicBus) return;
  const freq = (SCALE[degree % SCALE.length] ?? 110) * (root / 110);
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(freq, t);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(420, t);
  f.frequency.exponentialRampToValueAtTime(140, t + 0.16);
  const g = env(musicBus, t, 0.22, 0.18);
  o.connect(f);
  f.connect(g);
  o.start(t);
  o.stop(t + 0.2);
  done(o, f, g);
}

function schedule(): void {
  if (!ctx || !built || !musicOn || muted) return;
  if (nextTime < ctx.currentTime - 0.08) {
    origin = ctx.currentTime + 0.03;
    nextTime = origin;
    stepIndex = 0;
  }
  const horizon = ctx.currentTime + 0.16;
  const root = [110, 98, 87.31, 130.81][Math.floor(stepIndex / 64) % 4] ?? 110;
  let guard = 0;
  while (nextTime < horizon && guard < 32) {
    const s = stepIndex % 16;
    if (s % 4 === 0 || s === 10) kick(nextTime);
    hat(nextTime, s % 2 === 0 ? 0.09 : 0.035);
    if (s === 4 || s === 12) clap(nextTime);
    const deg = BASS[s] ?? -1;
    if (deg >= 0) bass(nextTime, deg, root);
    nextTime += STEP;
    stepIndex++;
    guard++;
  }
  if (ctx.currentTime >= duckUntil && duckUntil !== 0) {
    duckUntil = 0;
    applyGains();
  }
}

function sfxReady(): GainNode | null {
  const audio = ensure();
  if (!audio || !sfxBus || muted) return null;
  return sfxBus;
}

export const audio = {
  unlock(): void {
    ensure();
  },
  setLevels(music: number, sfx: number, isMuted: boolean): void {
    musicLevel = music;
    sfxLevel = sfx;
    muted = isMuted;
    applyGains();
  },
  startMusic(): void {
    if (!ensure() || musicOn) return;
    musicOn = true;
    origin = ctx!.currentTime + 0.04;
    nextTime = origin;
    stepIndex = 0;
  },
  stopMusic(): void {
    musicOn = false;
  },
  duck(): void {
    if (!ctx) return;
    duckUntil = ctx.currentTime + 0.18;
    applyGains();
  },
  kickPulse(): number {
    if (!ctx || !musicOn) return 0;
    const beat = 60 / BPM;
    const elapsed = ctx.currentTime - origin;
    if (elapsed < 0) return 0;
    const phase = (elapsed % beat) / beat;
    return Math.exp(-phase * 7);
  },
  launch(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 220, 0.12, "square", 0.2);
    tone(bus, t, 660, 0.1, "sine", 0.12);
  },
  paddle(pos: number): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 160 + pos * 80, 0.07, "square", 0.18);
    noiseHit(bus, t, 0.04, 0.08, 1200);
  },
  blip(row: number): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const wobble = 1 + (Math.random() * 2 - 1) * 0.07;
    tone(bus, ctx.currentTime, (480 + row * 70) * wobble, 0.08, "sine", 0.16);
  },
  chip(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    tone(bus, ctx.currentTime, 240 + Math.random() * 30, 0.05, "triangle", 0.12);
  },
  thud(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    tone(bus, ctx.currentTime, 90, 0.07, "sine", 0.2);
  },
  wall(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    noiseHit(bus, ctx.currentTime, 0.03, 0.05, 900);
  },
  boom(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 90, 0.22, "sine", 0.4);
    noiseHit(bus, t, 0.16, 0.22, 400);
    this.duck();
  },
  laser(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    tone(bus, ctx.currentTime, 1400 + Math.random() * 200, 0.04, "square", 0.07);
  },
  power(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 523, 0.1, "square", 0.14);
    tone(bus, t + 0.08, 659, 0.1, "square", 0.14);
    tone(bus, t + 0.16, 784, 0.14, "square", 0.16);
  },
  life(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 880, 0.12, "sine", 0.16);
    tone(bus, t + 0.1, 1175, 0.16, "sine", 0.14);
  },
  death(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.38);
    const g = env(bus, t, 0.28, 0.4);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.42);
    done(o, g);
    this.duck();
  },
  win(): void {
    const bus = sfxReady();
    if (!bus || !ctx) return;
    const t = ctx.currentTime;
    tone(bus, t, 523, 0.2, "sine", 0.16);
    tone(bus, t + 0.1, 659, 0.22, "sine", 0.16);
    tone(bus, t + 0.2, 784, 0.28, "sine", 0.18);
    tone(bus, t + 0.28, 1046, 0.32, "triangle", 0.12);
  },
};
