import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RotateCcw, c as Pause, l as MoveHorizontal, n as VolumeX, o as Pointer, r as Volume2, s as Play, t as Zap } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DvY-33Ef.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var INITIAL_HUD = {
	phase: "menu",
	score: 0,
	best: 0,
	level: 1,
	set: 1,
	lives: 3,
	chain: 0,
	bricksLeft: 0,
	stuck: true,
	powers: [],
	shake: true,
	music: .7,
	sfx: .85,
	muted: false,
	newBest: false,
	banner: ""
};
var POWER_LABEL = {
	wide: "Wide",
	beam: "Beam",
	slow: "Slow",
	phase: "Phase",
	glue: "Glue",
	multi: "Split",
	life: "Life"
};
var POWER_LETTER = {
	wide: "W",
	beam: "B",
	slow: "S",
	phase: "P",
	glue: "G",
	multi: "M",
	life: "+"
};
var STEP$1 = 60 / 126 / 4;
var ctx = null;
var master = null;
var musicBus = null;
var sfxBus = null;
var noiseBuf = null;
var musicOn = false;
var origin = 0;
var nextTime = 0;
var stepIndex = 0;
var voices = 0;
var musicLevel = .7;
var sfxLevel = .85;
var muted = false;
var duckUntil = 0;
var built = false;
function curve(v) {
	return v * v;
}
function ensure() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC({ latencyHint: "interactive" });
		master = ctx.createGain();
		musicBus = ctx.createGain();
		sfxBus = ctx.createGain();
		const comp = ctx.createDynamicsCompressor();
		comp.threshold.value = -14;
		comp.knee.value = 16;
		comp.ratio.value = 3.2;
		comp.attack.value = .004;
		comp.release.value = .18;
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
		window.setInterval(schedule, 25);
	}
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}
function applyGains() {
	if (!ctx || !master || !musicBus || !sfxBus) return;
	const now = ctx.currentTime;
	const duck = now < duckUntil ? .35 : 1;
	const m = muted ? 0 : curve(musicLevel) * .42 * duck;
	const s = muted ? 0 : curve(sfxLevel) * .9;
	musicBus.gain.setTargetAtTime(Math.max(1e-4, m), now, .03);
	sfxBus.gain.setTargetAtTime(Math.max(1e-4, s), now, .02);
	master.gain.setTargetAtTime(.9, now, .03);
}
function env(bus, t, peak, dur) {
	const g = ctx.createGain();
	g.connect(bus);
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(Math.max(.001, peak), t + .008);
	g.gain.exponentialRampToValueAtTime(1e-4, t + Math.max(.02, dur));
	return g;
}
function done(node, ...extra) {
	voices++;
	const anyNode = node;
	anyNode.onended = () => {
		voices = Math.max(0, voices - 1);
		try {
			node.disconnect();
			for (const e of extra) e.disconnect();
		} catch {}
	};
}
function tone(bus, t, freq, dur, type, peak) {
	if (!ctx || voices > 28) return;
	const o = ctx.createOscillator();
	o.type = type;
	o.frequency.setValueAtTime(Math.max(40, freq), t);
	const g = env(bus, t, peak, dur);
	o.connect(g);
	o.start(t);
	o.stop(t + dur + .02);
	done(o, g);
}
function noiseHit(bus, t, dur, peak, hp = 0) {
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
		src.stop(t + dur + .02);
		done(src, f, g);
		return;
	}
	src.connect(g);
	src.start(t);
	src.stop(t + dur + .02);
	done(src, g);
}
function kick(t) {
	if (!ctx || !musicBus) return;
	const o = ctx.createOscillator();
	o.type = "sine";
	o.frequency.setValueAtTime(148, t);
	o.frequency.exponentialRampToValueAtTime(46, t + .09);
	const g = env(musicBus, t, .95, .22);
	o.connect(g);
	o.start(t);
	o.stop(t + .24);
	done(o, g);
}
function hat(t, peak) {
	if (!musicBus) return;
	noiseHit(musicBus, t, .04, peak, 7e3);
}
function clap(t) {
	if (!ctx || !musicBus || !noiseBuf) return;
	const src = ctx.createBufferSource();
	src.buffer = noiseBuf;
	const f = ctx.createBiquadFilter();
	f.type = "bandpass";
	f.frequency.value = 1800;
	f.Q.value = .7;
	const g = env(musicBus, t, .28, .12);
	src.connect(f);
	f.connect(g);
	src.start(t);
	src.stop(t + .14);
	done(src, f, g);
}
var BASS = [
	0,
	-1,
	0,
	4,
	-1,
	0,
	4,
	-1,
	2,
	-1,
	2,
	0,
	-1,
	4,
	0,
	-1
];
var SCALE = [
	110,
	130.81,
	146.83,
	164.81,
	196
];
function bass(t, degree, root) {
	if (!ctx || !musicBus) return;
	const freq = (SCALE[degree % SCALE.length] ?? 110) * (root / 110);
	const o = ctx.createOscillator();
	o.type = "sawtooth";
	o.frequency.setValueAtTime(freq, t);
	const f = ctx.createBiquadFilter();
	f.type = "lowpass";
	f.frequency.setValueAtTime(420, t);
	f.frequency.exponentialRampToValueAtTime(140, t + .16);
	const g = env(musicBus, t, .22, .18);
	o.connect(f);
	f.connect(g);
	o.start(t);
	o.stop(t + .2);
	done(o, f, g);
}
function schedule() {
	if (!ctx || !built || !musicOn || muted) return;
	if (nextTime < ctx.currentTime - .08) {
		origin = ctx.currentTime + .03;
		nextTime = origin;
		stepIndex = 0;
	}
	const horizon = ctx.currentTime + .16;
	const root = [
		110,
		98,
		87.31,
		130.81
	][Math.floor(stepIndex / 64) % 4] ?? 110;
	let guard = 0;
	while (nextTime < horizon && guard < 32) {
		const s = stepIndex % 16;
		if (s % 4 === 0 || s === 10) kick(nextTime);
		hat(nextTime, s % 2 === 0 ? .09 : .035);
		if (s === 4 || s === 12) clap(nextTime);
		const deg = BASS[s] ?? -1;
		if (deg >= 0) bass(nextTime, deg, root);
		nextTime += STEP$1;
		stepIndex++;
		guard++;
	}
	if (ctx.currentTime >= duckUntil && duckUntil !== 0) {
		duckUntil = 0;
		applyGains();
	}
}
function sfxReady() {
	if (!ensure() || !sfxBus || muted) return null;
	return sfxBus;
}
var audio = {
	unlock() {
		ensure();
	},
	setLevels(music, sfx, isMuted) {
		musicLevel = music;
		sfxLevel = sfx;
		muted = isMuted;
		applyGains();
	},
	startMusic() {
		if (!ensure() || musicOn) return;
		musicOn = true;
		origin = ctx.currentTime + .04;
		nextTime = origin;
		stepIndex = 0;
	},
	stopMusic() {
		musicOn = false;
	},
	duck() {
		if (!ctx) return;
		duckUntil = ctx.currentTime + .18;
		applyGains();
	},
	kickPulse() {
		if (!ctx || !musicOn) return 0;
		const beat = 60 / 126;
		const elapsed = ctx.currentTime - origin;
		if (elapsed < 0) return 0;
		const phase = elapsed % beat / beat;
		return Math.exp(-phase * 7);
	},
	launch() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 220, .12, "square", .2);
		tone(bus, t, 660, .1, "sine", .12);
	},
	paddle(pos) {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 160 + pos * 80, .07, "square", .18);
		noiseHit(bus, t, .04, .08, 1200);
	},
	blip(row) {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const wobble = 1 + (Math.random() * 2 - 1) * .07;
		tone(bus, ctx.currentTime, (480 + row * 70) * wobble, .08, "sine", .16);
	},
	chip() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		tone(bus, ctx.currentTime, 240 + Math.random() * 30, .05, "triangle", .12);
	},
	thud() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		tone(bus, ctx.currentTime, 90, .07, "sine", .2);
	},
	wall() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		noiseHit(bus, ctx.currentTime, .03, .05, 900);
	},
	boom() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 90, .22, "sine", .4);
		noiseHit(bus, t, .16, .22, 400);
		this.duck();
	},
	laser() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		tone(bus, ctx.currentTime, 1400 + Math.random() * 200, .04, "square", .07);
	},
	power() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 523, .1, "square", .14);
		tone(bus, t + .08, 659, .1, "square", .14);
		tone(bus, t + .16, 784, .14, "square", .16);
	},
	life() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 880, .12, "sine", .16);
		tone(bus, t + .1, 1175, .16, "sine", .14);
	},
	death() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		const o = ctx.createOscillator();
		o.type = "sawtooth";
		o.frequency.setValueAtTime(320, t);
		o.frequency.exponentialRampToValueAtTime(48, t + .38);
		const g = env(bus, t, .28, .4);
		o.connect(g);
		o.start(t);
		o.stop(t + .42);
		done(o, g);
		this.duck();
	},
	win() {
		const bus = sfxReady();
		if (!bus || !ctx) return;
		const t = ctx.currentTime;
		tone(bus, t, 523, .2, "sine", .16);
		tone(bus, t + .1, 659, .22, "sine", .16);
		tone(bus, t + .2, 784, .28, "sine", .18);
		tone(bus, t + .28, 1046, .32, "triangle", .12);
	}
};
var COLS = 10;
var LEVELS = [
	[
		"##########",
		"##########",
		"##########",
		"##########"
	],
	[
		"....##....",
		"...####...",
		"..######..",
		".########.",
		"##########",
		".########."
	],
	[
		"#S#S#S#S#S",
		"S#S#S#S#S#",
		"#S#S#S#S#S",
		"S#S#S#S#S#",
		"#S#S#S#S#S"
	],
	[
		"###....###",
		"###....###",
		"###.XX.###",
		"###....###",
		"SSS....SSS",
		"##########"
	],
	[
		"....GG....",
		"...G##G...",
		"..G#EE#G..",
		".G##EE##G.",
		"..G#EE#G..",
		"...G##G...",
		"....GG...."
	],
	[
		"E.#.#.#.#E",
		".#.#.#.#.#",
		"S#S#S#S#S#",
		"#S#S#S#S#S",
		".#.#.#.#.#",
		"##########"
	],
	[
		"XXXXXXXXXX",
		"X##....##X",
		"X#.E##E.#X",
		"X#......#X",
		"X#.E##E.#X",
		"X##S##S##X",
		"##########"
	],
	[
		"GGGGGGGGGG",
		"GXSXSXSXSG",
		"G..E..E..G",
		"GS######SG",
		"G..E..E..G",
		"GXSXSXSXSG",
		"##########",
		"###X##X###"
	]
];
function kindOf(ch) {
	switch (ch) {
		case "#": return "normal";
		case "S": return "silver";
		case "G": return "gold";
		case "X": return "unbreak";
		case "E": return "boom";
		default: return null;
	}
}
function hpOf(kind) {
	if (kind === "silver") return 2;
	if (kind === "gold") return 3;
	return 1;
}
function buildLevel(index) {
	const map = LEVELS[index % LEVELS.length] ?? LEVELS[0];
	const gap = 5;
	const marginX = 22;
	const marginY = 26;
	const bw = 391 / COLS;
	const bh = 20;
	const bricks = [];
	let id = 1;
	for (let r = 0; r < map.length; r++) {
		const row = (map[r] + "..........").slice(0, COLS);
		for (let c = 0; c < COLS; c++) {
			const kind = kindOf(row[c] ?? ".");
			if (!kind) continue;
			const hp = hpOf(kind);
			bricks.push({
				id: id++,
				c,
				r,
				x: marginX + c * (bw + gap),
				y: marginY + r * 25,
				w: bw,
				h: bh,
				kind,
				hp,
				maxHp: hp,
				dead: false
			});
		}
	}
	return bricks;
}
var MOTES = Array.from({ length: 42 }, (_, i) => {
	const h = (n) => {
		const x = Math.sin(n * 127.1 + i * 3.1) * 43758.5453;
		return x - Math.floor(x);
	};
	return {
		x: h(1),
		y: h(2),
		s: .6 + h(3) * 1.8,
		p: h(4) * Math.PI * 2
	};
});
function hueOf(brick, t) {
	if (brick.kind === "gold") return 46;
	if (brick.kind === "silver") return 200;
	if (brick.kind === "unbreak") return 168;
	if (brick.kind === "boom") return (t * 90 + brick.c * 20) % 360;
	return (brick.r * 26 + brick.c * 8 + t * 18) % 360;
}
function powerHue(kind) {
	switch (kind) {
		case "wide": return 172;
		case "beam": return 312;
		case "slow": return 48;
		case "phase": return 0;
		case "glue": return 130;
		case "multi": return 46;
		case "life": return 172;
	}
}
function layout(cssW, cssH) {
	const scale = Math.min(cssW / 480, cssH / 800);
	return {
		scale,
		ox: (cssW - 480 * scale) / 2,
		oy: (cssH - 800 * scale) / 2
	};
}
function worldX(clientX, rect) {
	const { scale, ox } = layout(rect.width, rect.height);
	return (clientX - rect.left - ox) / scale;
}
function render(ctx, scene, cssW, cssH, dpr) {
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	const t = scene.visTime;
	const spin = scene.reduce ? t * .02 : t * .18;
	const hue = t * 16 % 360;
	const kick = scene.reduce ? .2 : audio.kickPulse() || Math.exp(-(t * 126 / 60) % 1 * 6);
	const bg = ctx.createRadialGradient(cssW * .5, cssH * .42, 10, cssW * .5, cssH * .5, Math.max(cssW, cssH) * .75);
	bg.addColorStop(0, `hsl(${hue} 45% 14%)`);
	bg.addColorStop(.45, "#100814");
	bg.addColorStop(1, "#05020a");
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, cssW, cssH);
	ctx.save();
	ctx.translate(cssW * .5, cssH * .46);
	ctx.globalCompositeOperation = "lighter";
	ctx.rotate(spin);
	for (let i = 0; i < 12; i++) {
		ctx.rotate(Math.PI / 6);
		ctx.fillStyle = `hsla(${(hue + i * 28) % 360} 90% 60% / ${.035 + kick * .04})`;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.max(cssW, cssH), 28);
		ctx.lineTo(Math.max(cssW, cssH), -28);
		ctx.fill();
	}
	ctx.restore();
	ctx.save();
	ctx.translate(cssW * .5, cssH * .46);
	ctx.globalCompositeOperation = "lighter";
	const maxR = Math.max(cssW, cssH) * .72;
	for (let i = 0; i < 7; i++) {
		const phase = (t * .35 + i / 7) % 1;
		const r = 30 + phase * maxR;
		ctx.strokeStyle = `hsla(${(hue + i * 40) % 360} 100% 65% / ${.12 * (1 - phase)})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.stroke();
	}
	const beatR = 20 + t * 126 / 60 % 1 * maxR * .85;
	ctx.strokeStyle = `hsla(${hue} 100% 70% / ${.18 + kick * .35})`;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(0, 0, beatR, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
	for (const m of MOTES) {
		const tw = .25 + .75 * (.5 + .5 * Math.sin(t * 2 + m.p));
		ctx.fillStyle = `hsla(${(hue + m.p * 40) % 360} 90% 72% / ${.25 * tw})`;
		ctx.fillRect(m.x * cssW, m.y * cssH, m.s, m.s);
	}
	const { scale, ox, oy } = layout(cssW, cssH);
	ctx.save();
	ctx.translate(ox, oy);
	ctx.scale(scale, scale);
	if (!scene.reduce && scene.shake) {
		const s = scene.trauma * scene.trauma;
		const mag = 8 * s;
		ctx.translate(Math.sin(t * 53) * mag, Math.cos(t * 47) * mag * .65);
		ctx.rotate(Math.sin(t * 41) * .01 * s);
	}
	ctx.beginPath();
	ctx.roundRect(8, 8, 464, 784, 18);
	ctx.fillStyle = "rgba(6, 3, 12, 0.62)";
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = `hsla(${hue} 100% 64% / ${.35 + kick * .5})`;
	ctx.stroke();
	for (const b of scene.bricks) {
		if (b.dead) continue;
		drawBrick(ctx, b, t);
	}
	for (const c of scene.capsules) {
		if (c.dead) continue;
		drawCapsule(ctx, c, t);
	}
	ctx.fillStyle = `hsla(${hue} 100% 70% / 0.9)`;
	for (const s of scene.shots) {
		if (s.dead) continue;
		ctx.fillRect(s.x - 1.5, s.y - 16, 3, 18);
	}
	for (const p of scene.particles) {
		if (!p.alive) continue;
		const a = Math.max(0, p.life / p.max);
		if (p.kind === "ring") {
			const rad = (1 - a) * 90 + 6;
			ctx.strokeStyle = `hsla(${p.hue} 100% 68% / ${a * .7})`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
			ctx.stroke();
		} else {
			ctx.fillStyle = `hsla(${p.hue} 95% 64% / ${a})`;
			ctx.fillRect(p.x, p.y, p.size, p.size);
		}
	}
	for (let i = 0; i < scene.balls.length; i++) drawBall(ctx, scene.balls[i], (hue + i * 40) % 360);
	drawPaddle(ctx, scene, hue, t);
	ctx.font = "700 15px Unbounded, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	for (const pop of scene.popups) {
		const a = Math.max(0, pop.life / pop.max);
		ctx.fillStyle = `hsla(${pop.hue} 100% 72% / ${a})`;
		ctx.fillText(pop.text, pop.x, pop.y);
	}
	if (scene.introT > 0 && (scene.phase === "play" || scene.phase === "clear")) {
		const a = Math.min(1, scene.introT);
		ctx.fillStyle = `hsla(${hue} 100% 96% / ${a})`;
		ctx.font = "700 40px Unbounded, sans-serif";
		ctx.fillText(`LEVEL ${scene.level}`, 240, 430);
		if (scene.set > 1) {
			ctx.font = "500 16px Outfit, sans-serif";
			ctx.fillStyle = `hsla(172 100% 70% / ${a})`;
			ctx.fillText(`SET ${scene.set}`, 240, 468);
		}
	}
	if (scene.flash > 0 && !scene.reduce) {
		ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(.16, scene.flash)})`;
		ctx.fillRect(0, 0, 480, 800);
	}
	ctx.restore();
	const vig = ctx.createRadialGradient(cssW / 2, cssH / 2, cssH * .28, cssW / 2, cssH / 2, cssH * .72);
	vig.addColorStop(0, "rgba(0,0,0,0)");
	vig.addColorStop(1, "rgba(0,0,0,0.48)");
	ctx.fillStyle = vig;
	ctx.fillRect(0, 0, cssW, cssH);
}
function drawBrick(ctx, b, t) {
	const h = hueOf(b, t);
	const x = b.x;
	const y = b.y;
	ctx.beginPath();
	ctx.roundRect(x, y, b.w, b.h, 4);
	if (b.kind === "unbreak") {
		ctx.fillStyle = "#120a18";
		ctx.fill();
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = `hsla(168 80% 62% / ${.45 + .25 * Math.sin(t * 3 + b.c)})`;
		ctx.stroke();
		return;
	}
	ctx.fillStyle = `hsl(${h} 88% ${b.kind === "silver" ? 72 : b.kind === "gold" ? 56 : 52}%)`;
	ctx.fill();
	ctx.fillStyle = `hsla(${h} 100% 82% / 0.55)`;
	ctx.fillRect(x + 2, y + 2, b.w - 4, 3);
	if (b.kind === "boom") {
		ctx.strokeStyle = "rgba(255,255,255,0.85)";
		ctx.lineWidth = 1.4;
		ctx.beginPath();
		ctx.arc(x + b.w / 2, y + b.h / 2, 4.5, 0, Math.PI * 2);
		ctx.stroke();
	}
	if (b.maxHp > 1) for (let i = 0; i < b.maxHp; i++) {
		ctx.fillStyle = i < b.hp ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.35)";
		ctx.fillRect(x + b.w - 6 - i * 5, y + b.h - 5, 3, 3);
	}
}
function drawCapsule(ctx, c, t) {
	const h = powerHue(c.kind);
	const w = 34;
	const hh = 16;
	const bob = Math.sin(t * 6 + c.x) * 1.5;
	ctx.beginPath();
	ctx.roundRect(c.x - w / 2, c.y - hh / 2 + bob, w, hh, 8);
	ctx.fillStyle = `hsla(${h} 90% 52% / 0.95)`;
	ctx.fill();
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = "rgba(255,255,255,0.75)";
	ctx.stroke();
	ctx.fillStyle = "#07040f";
	ctx.font = "700 12px Unbounded, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(POWER_LETTER[c.kind], c.x, c.y + bob + .5);
}
function drawBall(ctx, ball, hue) {
	const trail = ball.trail;
	for (let i = 0; i < trail.length; i++) {
		const p = trail[i];
		const a = i / trail.length * .55;
		ctx.fillStyle = `hsla(${(hue + i * 8) % 360} 100% 64% / ${a})`;
		ctx.beginPath();
		ctx.arc(p.x, p.y, 7 * (.35 + i / trail.length * .6), 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalCompositeOperation = "lighter";
	ctx.fillStyle = "rgba(255, 43, 214, 0.85)";
	ctx.beginPath();
	ctx.arc(ball.x - 2.2, ball.y, 7, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "rgba(61, 255, 232, 0.75)";
	ctx.beginPath();
	ctx.arc(ball.x + 2.2, ball.y, 7, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = "#fffaf6";
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, 3.36, 0, Math.PI * 2);
	ctx.fill();
}
function drawPaddle(ctx, scene, hue, t) {
	const squash = scene.squash;
	const w = scene.paddleW * (1 + squash * .14);
	const h = 16 * (1 - squash * .28);
	const x = scene.paddleX - w / 2;
	const y = 736 + (16 - h) / 2;
	ctx.fillStyle = `hsla(${hue} 100% 60% / 0.28)`;
	ctx.beginPath();
	ctx.roundRect(x - 6, y - 4, w + 12, h + 10, 12);
	ctx.fill();
	const g = ctx.createLinearGradient(x, y, x + w, y);
	g.addColorStop(0, `hsl(${(hue + 40) % 360} 100% 62%)`);
	g.addColorStop(.5, "#f6f1ea");
	g.addColorStop(1, `hsl(${(hue + 200) % 360} 100% 60%)`);
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, h / 2);
	ctx.fill();
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, h / 2);
	ctx.clip();
	const shine = t * 90 % (w + 30) - 15;
	ctx.fillStyle = "rgba(255,255,255,0.45)";
	ctx.fillRect(x + shine, y, 10, h);
	ctx.restore();
	if (scene.beam) {
		ctx.fillStyle = "#fff";
		ctx.fillRect(x + 6, y + 3, 4, h - 6);
		ctx.fillRect(x + w - 10, y + 3, 4, h - 6);
	}
}
var KEY = "kaleido-break-v1";
var DEFAULT_SETTINGS = {
	version: 1,
	best: 0,
	music: .7,
	sfx: .85,
	muted: false,
	shake: true
};
function clamp01(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.min(1, Math.max(0, n));
}
function loadSettings() {
	try {
		if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
		const raw = localStorage.getItem(KEY);
		if (!raw) {
			const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
			return {
				...DEFAULT_SETTINGS,
				shake: !reduce
			};
		}
		const parsed = JSON.parse(raw);
		return {
			version: 1,
			best: Number.isFinite(parsed.best) ? Math.max(0, Number(parsed.best)) : 0,
			music: clamp01(parsed.music ?? DEFAULT_SETTINGS.music),
			sfx: clamp01(parsed.sfx ?? DEFAULT_SETTINGS.sfx),
			muted: !!parsed.muted,
			shake: parsed.shake !== false
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}
function saveSettings(settings) {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(KEY, JSON.stringify({
			...settings,
			version: 1
		}));
	} catch {}
}
var STEP = 1 / 60;
var PADDLE_SPEED = 880;
var DUR = {
	wide: 14,
	beam: 10,
	slow: 9,
	phase: 8,
	glue: 12
};
var DROP_TABLE = [
	"wide",
	"beam",
	"slow",
	"multi",
	"glue",
	"phase",
	"wide",
	"beam",
	"life",
	"multi",
	"slow"
];
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function createSession(canvas, onHud) {
	const ctx = canvas.getContext("2d", { alpha: false });
	if (!ctx) throw new Error("Canvas unavailable");
	const settings = loadSettings();
	const keys = /* @__PURE__ */ new Set();
	let phase = "menu";
	let score = 0;
	let best = settings.best;
	let runBest = best;
	let levelIndex = 0;
	let lives = 3;
	let chain = 0;
	let bricks = buildLevel(0);
	let balls = [];
	let capsules = [];
	let shots = [];
	const particles = Array.from({ length: 260 }, () => ({
		alive: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		max: 1,
		size: 2,
		hue: 0,
		kind: "dot"
	}));
	let popups = [];
	let paddleX = 240;
	let paddleW = 96;
	let squash = 0;
	let pointerOn = false;
	let pointerWorld = paddleX;
	let downX = 0;
	let downAt = 0;
	let moved = false;
	const powers = {
		wide: 0,
		beam: 0,
		slow: 0,
		phase: 0,
		glue: 0
	};
	let laserCd = 0;
	let rally = 0;
	let trauma = 0;
	let flash = 0;
	let hitstop = 0;
	let introT = 0;
	let clearT = 0;
	let banner = "";
	let bannerT = 0;
	let dropCursor = 0;
	let acc = 0;
	let uiAcc = 0;
	let hudDirty = true;
	let cssW = 1;
	let cssH = 1;
	let dpr = 1;
	let reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let music = settings.music;
	let sfx = settings.sfx;
	let muted = settings.muted;
	let shake = settings.shake;
	let wallCd = 0;
	let visTime = 0;
	audio.setLevels(music, sfx, muted);
	function levelNum() {
		return levelIndex % 8 + 1;
	}
	function setNum() {
		return Math.floor(levelIndex / 8) + 1;
	}
	function persist() {
		saveSettings({
			version: 1,
			best,
			music,
			sfx,
			muted,
			shake
		});
	}
	function say(text) {
		banner = text;
		bannerT = 1.25;
		hudDirty = true;
	}
	function emit(n, x, y, hue, speed, kind = "dot") {
		let left = n;
		for (const p of particles) {
			if (p.alive) continue;
			const a = Math.random() * Math.PI * 2;
			const s = speed * (.35 + Math.random() * .75);
			p.alive = true;
			p.x = x;
			p.y = y;
			p.vx = kind === "ring" ? 0 : Math.cos(a) * s;
			p.vy = kind === "ring" ? 0 : Math.sin(a) * s;
			p.life = p.max = kind === "ring" ? .45 : .28 + Math.random() * .35;
			p.size = 1.6 + Math.random() * 2.2;
			p.hue = hue;
			p.kind = kind;
			if (--left <= 0) break;
		}
	}
	function popup(x, y, text, hue) {
		popups.push({
			x,
			y,
			text,
			life: .7,
			max: .7,
			hue
		});
		if (popups.length > 18) popups.splice(0, popups.length - 18);
	}
	function desiredSpeed() {
		const sp = Math.min(620, 340 + (setNum() - 1) * 26 + Math.min(140, rally * 11));
		return powers.slow > 0 ? sp * .62 : sp;
	}
	function setSpeed(ball, sp) {
		const m = Math.hypot(ball.vx, ball.vy);
		if (m < 8) return;
		const k = sp / m;
		ball.vx *= k;
		ball.vy *= k;
		if (Math.abs(ball.vy) < sp * .2) {
			ball.vy = Math.sign(ball.vy || -1) * sp * .25;
			const k2 = sp / (Math.hypot(ball.vx, ball.vy) || 1);
			ball.vx *= k2;
			ball.vy *= k2;
		}
	}
	function makeBall(stuck, x = paddleX) {
		return {
			x,
			y: 728,
			vx: 0,
			vy: 0,
			stuck,
			offset: x - paddleX,
			trail: [],
			ignore: /* @__PURE__ */ new Map()
		};
	}
	function halfW() {
		return paddleW / 2;
	}
	function resetField() {
		bricks = buildLevel(levelIndex);
		capsules = [];
		shots = [];
		balls = [makeBall(true, 240)];
		paddleX = 240;
		powers.wide = powers.beam = powers.slow = powers.phase = powers.glue = 0;
		laserCd = 0;
		rally = 0;
		chain = 0;
		introT = 1.35;
		clearT = 0;
	}
	function bricksLeft() {
		let n = 0;
		for (const b of bricks) if (!b.dead && b.kind !== "unbreak") n++;
		return n;
	}
	function snapshot() {
		const chips = Object.keys(DUR).filter((k) => powers[k] > 0).map((k) => ({
			kind: k,
			left: powers[k],
			total: DUR[k]
		}));
		return {
			phase,
			score,
			best,
			level: levelNum(),
			set: setNum(),
			lives,
			chain,
			bricksLeft: bricksLeft(),
			stuck: balls.some((b) => b.stuck) || balls.length === 0,
			powers: chips,
			shake,
			music,
			sfx,
			muted,
			newBest: phase === "over" && score > runBest && score > 0,
			banner: bannerT > 0 ? banner : ""
		};
	}
	function emitHud(force = false) {
		if (!force && !hudDirty) return;
		hudDirty = false;
		onHud(snapshot());
	}
	function award(brick) {
		const pts = (brick.kind === "gold" ? 120 : brick.kind === "silver" ? 80 : brick.kind === "boom" ? 90 : 50) * Math.min(8, 1 + Math.floor(chain / 2));
		score += pts;
		chain += 1;
		if (score > best) {
			best = score;
			persist();
		}
		popup(brick.x + brick.w / 2, brick.y, `+${pts}`, 48 + brick.r * 18);
		if (chain > 0 && chain % 4 === 0) {
			popup(240, 360, `${chain} CHAIN`, 168);
			say(`${chain} chain`);
		}
		hudDirty = true;
	}
	function maybeDrop(x, y) {
		if (Math.random() > .26) return;
		const kind = DROP_TABLE[dropCursor % DROP_TABLE.length] ?? "wide";
		dropCursor++;
		capsules.push({
			x,
			y,
			kind,
			vy: 165,
			dead: false
		});
	}
	function damage(brick, depth) {
		if (brick.dead || depth > 8) return;
		if (brick.kind === "unbreak") {
			audio.thud();
			emit(4, brick.x + brick.w / 2, brick.y + brick.h / 2, 168, 80);
			return;
		}
		brick.hp -= 1;
		if (brick.hp > 0) {
			audio.chip();
			emit(5, brick.x + brick.w / 2, brick.y + brick.h / 2, 200, 90);
			return;
		}
		brick.dead = true;
		award(brick);
		const hx = brick.kind === "gold" ? 46 : brick.kind === "boom" ? 320 : 300;
		emit(12, brick.x + brick.w / 2, brick.y + brick.h / 2, hx, 160);
		if (brick.kind === "boom") {
			audio.boom();
			emit(1, brick.x + brick.w / 2, brick.y + brick.h / 2, 320, 0, "ring");
			trauma = Math.min(1, trauma + .45);
			flash = Math.min(.5, flash + .28);
			hitstop = Math.max(hitstop, .045);
			for (const other of bricks) {
				if (other.dead || other === brick) continue;
				if (Math.max(Math.abs(other.c - brick.c), Math.abs(other.r - brick.r)) === 1) damage(other, depth + 1);
			}
		} else {
			audio.blip(brick.r);
			trauma = Math.min(1, trauma + (brick.kind === "gold" ? .22 : .1));
			hitstop = Math.max(hitstop, brick.kind === "gold" ? .03 : .016);
		}
		maybeDrop(brick.x + brick.w / 2, brick.y + brick.h / 2);
	}
	function reflect(ball, nx, ny) {
		if (nx !== 0 && ball.vx * nx < 0) ball.vx *= -1;
		if (ny !== 0 && ball.vy * ny < 0) ball.vy *= -1;
	}
	function collideBricks(ball) {
		if (ball.stuck) return;
		let best = null;
		for (const b of bricks) {
			if (b.dead) continue;
			if ((ball.ignore.get(b.id) ?? 0) > 0) continue;
			const cx = clamp(ball.x, b.x, b.x + b.w);
			const cy = clamp(ball.y, b.y, b.y + b.h);
			const dx = ball.x - cx;
			const dy = ball.y - cy;
			const inside = dx === 0 && dy === 0;
			const d2 = dx * dx + dy * dy;
			if (!inside && d2 > 49) continue;
			const dist = inside ? -1 : Math.sqrt(d2);
			if (best && dist >= best.dist) continue;
			let nx = 0;
			let ny = 0;
			if (inside) {
				const left = ball.x - b.x;
				const right = b.x + b.w - ball.x;
				const top = ball.y - b.y;
				const bot = b.y + b.h - ball.y;
				const m = Math.min(left, right, top, bot);
				if (m === left) nx = -1;
				else if (m === right) nx = 1;
				else if (m === top) ny = -1;
				else ny = 1;
			} else {
				const d = dist || 1e-4;
				nx = dx / d;
				ny = dy / d;
			}
			best = {
				b,
				dist,
				nx,
				ny,
				inside
			};
		}
		if (!best) return;
		const phased = powers.phase > 0 && best.b.kind !== "unbreak";
		ball.ignore.set(best.b.id, phased ? .28 : .07);
		damage(best.b, 0);
		if (phased) return;
		reflect(ball, best.nx, best.ny);
		if (best.inside) {
			if (best.nx < 0) ball.x = best.b.x - 7 - .4;
			else if (best.nx > 0) ball.x = best.b.x + best.b.w + 7 + .4;
			if (best.ny < 0) ball.y = best.b.y - 7 - .4;
			else if (best.ny > 0) ball.y = best.b.y + best.b.h + 7 + .4;
		} else {
			const pen = 7 - best.dist;
			ball.x += best.nx * (pen + .3);
			ball.y += best.ny * (pen + .3);
		}
	}
	function hitPaddle(ball, prevY) {
		if (ball.stuck || ball.vy <= 0) return;
		const top = 736;
		const bot = 752;
		const prevBottom = prevY + 7;
		const bottom = ball.y + 7;
		if (prevBottom > 740 && prevY > bot) return;
		if (!(prevBottom <= 742 && bottom >= 728)) return;
		const half = halfW();
		if (ball.x < paddleX - half - 3.15 || ball.x > paddleX + half + 3.15) return;
		if (powers.glue > 0) {
			ball.stuck = true;
			ball.offset = clamp(ball.x - paddleX, -half + 8, half - 8);
			ball.vx = 0;
			ball.vy = 0;
			audio.paddle(.5);
			squash = 1;
			hudDirty = true;
			return;
		}
		const t = clamp((ball.x - paddleX) / half, -1, 1);
		const spin = clamp((paddleX - pointerWorld) * 0, -.2, .2);
		const keySpin = (keys.has("ArrowRight") || keys.has("KeyD") ? .18 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? .18 : 0);
		const angle = -Math.PI / 2 + t * 1.12 + spin + keySpin;
		const sp = desiredSpeed();
		ball.vx = Math.cos(angle) * sp;
		ball.vy = Math.sin(angle) * sp;
		ball.y = 728.8;
		if (chain >= 4) popup(paddleX, 708, `CHAIN ${chain}`, 168);
		chain = 0;
		squash = 1;
		trauma = Math.min(1, trauma + .06);
		emit(7, ball.x, top, 168, 120);
		audio.paddle((t + 1) / 2);
		hudDirty = true;
	}
	function launch() {
		audio.unlock();
		if (phase !== "play") return;
		let any = false;
		const sp = desiredSpeed();
		for (const ball of balls) {
			if (!ball.stuck) continue;
			any = true;
			ball.stuck = false;
			const half = halfW();
			const t = clamp(ball.offset / half, -1, 1);
			const dir = Math.sign(ball.offset) || (Math.random() < .5 ? -1 : 1);
			const angle = -Math.PI / 2 + t * .85 + dir * .12;
			ball.vx = Math.cos(angle) * sp;
			ball.vy = Math.sin(angle) * sp;
		}
		if (any) {
			audio.launch();
			hudDirty = true;
		}
	}
	function applyPower(kind) {
		audio.power();
		if (kind === "life") {
			lives = Math.min(6, lives + 1);
			audio.life();
			say("Extra life");
			hudDirty = true;
			return;
		}
		if (kind === "multi") {
			const src = balls.find((b) => !b.stuck) ?? balls[0];
			if (src) for (const delta of [-.42, .42]) {
				if (balls.length >= 5) break;
				if (src.stuck) {
					const sp = desiredSpeed();
					const angle = -Math.PI / 2 + delta;
					balls.push({
						x: src.x,
						y: src.y,
						vx: Math.cos(angle) * sp,
						vy: Math.sin(angle) * sp,
						stuck: false,
						offset: 0,
						trail: [],
						ignore: /* @__PURE__ */ new Map()
					});
				} else {
					const a = Math.atan2(src.vy, src.vx) + delta;
					const sp = Math.hypot(src.vx, src.vy) || desiredSpeed();
					balls.push({
						x: src.x,
						y: src.y,
						vx: Math.cos(a) * sp,
						vy: Math.sin(a) * sp,
						stuck: false,
						offset: 0,
						trail: [],
						ignore: /* @__PURE__ */ new Map()
					});
				}
			}
			say("Split");
			hudDirty = true;
			return;
		}
		const timed = kind;
		powers[timed] = DUR[timed];
		say(POWER_LABEL[kind]);
		hudDirty = true;
	}
	function loseBall() {
		lives -= 1;
		chain = 0;
		rally = 0;
		trauma = Math.min(1, trauma + .7);
		flash = .35;
		emit(1, paddleX, 736, 320, 0, "ring");
		audio.death();
		if (lives <= 0) {
			phase = "over";
			audio.stopMusic();
			if (score > runBest) best = Math.max(best, score);
			persist();
			say("");
		} else {
			balls = [makeBall(true)];
			say("Ball lost");
		}
		hudDirty = true;
	}
	function checkClear() {
		if (bricksLeft() > 0) return;
		phase = "clear";
		clearT = 1.7;
		const bonus = 800 * levelNum();
		score += bonus;
		if (score > best) {
			best = score;
			persist();
		}
		popup(240, 400, `+${bonus}`, 168);
		emit(1, 240, 360, 300, 0, "ring");
		emit(1, 240, 360, 168, 0, "ring");
		audio.win();
		say("Level clear");
		hudDirty = true;
	}
	function nextLevel() {
		levelIndex += 1;
		resetField();
		phase = "play";
		if (levelNum() === 1) say(`Set ${setNum()}`);
		hudDirty = true;
	}
	function step(dt) {
		trauma = Math.max(0, trauma - dt * 1.7);
		flash = Math.max(0, flash - dt * 1.4);
		squash = Math.max(0, squash - dt * 3.4);
		if (bannerT > 0) {
			bannerT -= dt;
			if (bannerT <= 0) hudDirty = true;
		}
		for (const p of particles) {
			if (!p.alive) continue;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += 30 * dt;
			p.life -= dt;
			if (p.life <= 0) p.alive = false;
		}
		for (const pop of popups) {
			pop.y -= 36 * dt;
			pop.life -= dt;
		}
		if (popups.length) popups = popups.filter((p) => p.life > 0);
		if (phase === "clear") {
			clearT -= dt;
			if (clearT <= 0) nextLevel();
			return;
		}
		if (phase !== "play") return;
		if (hitstop > 0) {
			hitstop -= dt;
			return;
		}
		const targetW = powers.wide > 0 ? 150 : 96;
		paddleW += (targetW - paddleW) * Math.min(1, dt * 8);
		const half = halfW();
		const left = keys.has("ArrowLeft") || keys.has("KeyA");
		const keyDir = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (left ? 1 : 0);
		if (keyDir !== 0) {
			pointerOn = false;
			paddleX += keyDir * PADDLE_SPEED * dt;
		} else if (pointerOn) paddleX = pointerWorld;
		paddleX = clamp(paddleX, 14 + half, 466 - half);
		for (const k of Object.keys(powers)) if (powers[k] > 0) {
			powers[k] = Math.max(0, powers[k] - dt);
			if (powers[k] === 0) hudDirty = true;
		}
		if (powers.beam > 0) {
			laserCd -= dt;
			if (laserCd <= 0) {
				laserCd = .24;
				shots.push({
					x: paddleX - half + 10,
					y: 736,
					dead: false
				});
				shots.push({
					x: paddleX + half - 10,
					y: 736,
					dead: false
				});
				audio.laser();
			}
		}
		const sp = desiredSpeed();
		let anyFlight = false;
		for (const ball of balls) {
			if (ball.stuck) {
				ball.x = clamp(paddleX + ball.offset, 21, 459);
				ball.y = 728;
				ball.trail.push({
					x: ball.x,
					y: ball.y
				});
				if (ball.trail.length > 10) ball.trail.shift();
				continue;
			}
			anyFlight = true;
			setSpeed(ball, sp);
			for (const [id, ttl] of ball.ignore) {
				const n = ttl - dt;
				if (n <= 0) ball.ignore.delete(id);
				else ball.ignore.set(id, n);
			}
			const sub = 4;
			const sdt = dt / sub;
			for (let i = 0; i < sub; i++) {
				const prevY = ball.y;
				ball.x += ball.vx * sdt;
				ball.y += ball.vy * sdt;
				if (ball.x < 21) {
					ball.x = 21;
					ball.vx = Math.abs(ball.vx);
					if (wallCd <= 0) {
						wallCd = .05;
						audio.wall();
					}
				} else if (ball.x > 459) {
					ball.x = 459;
					ball.vx = -Math.abs(ball.vx);
					if (wallCd <= 0) {
						wallCd = .05;
						audio.wall();
					}
				}
				if (ball.y < 21) {
					ball.y = 21;
					ball.vy = Math.abs(ball.vy);
					if (wallCd <= 0) {
						wallCd = .05;
						audio.wall();
					}
				}
				collideBricks(ball);
				hitPaddle(ball, prevY);
				if (ball.stuck) break;
			}
			ball.trail.push({
				x: ball.x,
				y: ball.y
			});
			if (ball.trail.length > 14) ball.trail.shift();
		}
		if (anyFlight) rally += dt;
		else rally = 0;
		wallCd = Math.max(0, wallCd - dt);
		balls = balls.filter((b) => b.stuck || b.y < 794);
		if (phase === "play" && balls.length === 0) loseBall();
		for (const shot of shots) {
			if (shot.dead) continue;
			shot.y -= 860 * dt;
			if (shot.y < 0) {
				shot.dead = true;
				continue;
			}
			for (const b of bricks) {
				if (b.dead) continue;
				if (shot.x >= b.x && shot.x <= b.x + b.w && shot.y >= b.y && shot.y <= b.y + b.h) {
					shot.dead = true;
					damage(b, 0);
					break;
				}
			}
		}
		if (shots.length > 24) shots = shots.filter((s) => !s.dead);
		for (const c of capsules) {
			if (c.dead) continue;
			c.y += c.vy * dt;
			if (c.y > 800) {
				c.dead = true;
				continue;
			}
			if (c.y >= 728 && c.y <= 760 && Math.abs(c.x - paddleX) < half + 18) {
				c.dead = true;
				applyPower(c.kind);
				emit(10, c.x, c.y, 168, 140);
			}
		}
		capsules = capsules.filter((c) => !c.dead);
		if (phase === "play") checkClear();
		introT = Math.max(0, introT - dt);
	}
	function scene() {
		return {
			visTime,
			reduce,
			shake,
			trauma,
			phase,
			level: levelNum(),
			set: setNum(),
			introT,
			flash,
			paddleX,
			paddleW,
			squash,
			beam: powers.beam > 0,
			bricks,
			balls,
			capsules,
			shots,
			particles,
			popups
		};
	}
	function paint() {
		render(ctx, scene(), cssW, cssH, dpr);
	}
	function onKey(e) {
		const target = e.target;
		if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
		if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Space") e.preventDefault();
		if (e.type === "keydown") keys.add(e.code);
		else keys.delete(e.code);
		if (e.type !== "keydown" || e.repeat) return;
		audio.unlock();
		if (e.code === "Space" || e.code === "Enter") {
			if (phase === "menu" || phase === "over") start();
			else if (phase === "pause") togglePause();
			else launch();
		} else if (e.code === "Escape" || e.code === "KeyP") {
			if (phase === "play" || phase === "pause" || phase === "clear") togglePause();
		}
	}
	function onPointerDown(e) {
		audio.unlock();
		pointerOn = true;
		moved = false;
		downX = e.clientX;
		downAt = performance.now();
		const rect = canvas.getBoundingClientRect();
		pointerWorld = worldX(e.clientX, rect);
		try {
			canvas.setPointerCapture(e.pointerId);
		} catch {}
	}
	function onPointerMove(e) {
		const rect = canvas.getBoundingClientRect();
		if (e.pointerType === "mouse" || pointerOn) {
			if (Math.abs(e.clientX - downX) > 12) moved = true;
			pointerWorld = worldX(e.clientX, rect);
			if (e.pointerType === "mouse") pointerOn = true;
		}
	}
	function onPointerUp(e) {
		const quick = performance.now() - downAt < 280 && !moved;
		if (quick && phase === "play" && e.pointerType !== "mouse") launch();
		if (e.pointerType === "mouse") {
			const rect = canvas.getBoundingClientRect();
			pointerOn = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
			if (quick && phase === "play") launch();
		} else pointerOn = false;
	}
	function onPointerLeave(e) {
		if (e.buttons === 0 && e.pointerType === "mouse") pointerOn = false;
	}
	function onVis() {
		if (document.visibilityState === "visible") audio.unlock();
		else if (phase === "play" || phase === "clear") {
			phase = "pause";
			hudDirty = true;
			emitHud(true);
		}
		persist();
	}
	const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
	const onMq = () => {
		reduce = mq.matches;
	};
	window.addEventListener("keydown", onKey);
	window.addEventListener("keyup", onKey);
	canvas.addEventListener("pointerdown", onPointerDown);
	canvas.addEventListener("pointermove", onPointerMove);
	canvas.addEventListener("pointerup", onPointerUp);
	canvas.addEventListener("pointercancel", onPointerUp);
	canvas.addEventListener("pointerleave", onPointerLeave);
	function onContext(e) {
		e.preventDefault();
	}
	canvas.addEventListener("contextmenu", onContext);
	document.addEventListener("visibilitychange", onVis);
	mq.addEventListener("change", onMq);
	function start() {
		audio.unlock();
		score = 0;
		lives = 3;
		levelIndex = 0;
		runBest = best;
		chain = 0;
		resetField();
		phase = "play";
		audio.startMusic();
		say("Drop the ball");
		hudDirty = true;
		emitHud(true);
	}
	function togglePause() {
		audio.unlock();
		if (phase === "play" || phase === "clear") phase = "pause";
		else if (phase === "pause") {
			phase = clearT > 0 ? "clear" : "play";
			audio.startMusic();
		}
		hudDirty = true;
		emitHud(true);
	}
	function resize() {
		const rect = canvas.getBoundingClientRect();
		cssW = Math.max(1, rect.width);
		cssH = Math.max(1, rect.height);
		dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.max(1, Math.floor(cssW * dpr));
		canvas.height = Math.max(1, Math.floor(cssH * dpr));
		paint();
	}
	emitHud(true);
	return {
		frame(dt) {
			visTime += dt;
			acc += Math.min(.05, Math.max(0, dt));
			let n = 0;
			while (acc >= STEP && n < 5) {
				step(STEP);
				acc -= STEP;
				n++;
			}
			paint();
			uiAcc += dt;
			if (hudDirty || uiAcc > .2) {
				uiAcc = 0;
				emitHud(true);
			}
		},
		resize,
		start,
		launch() {
			if (phase === "menu" || phase === "over") start();
			else if (phase === "pause") togglePause();
			else launch();
		},
		togglePause,
		restart() {
			start();
		},
		toggleMute() {
			audio.unlock();
			muted = !muted;
			audio.setLevels(music, sfx, muted);
			persist();
			hudDirty = true;
			emitHud(true);
		},
		toggleShake() {
			shake = !shake;
			persist();
			hudDirty = true;
			emitHud(true);
		},
		setMusic(v) {
			audio.unlock();
			music = clamp(v, 0, 1);
			audio.setLevels(music, sfx, muted);
			persist();
			hudDirty = true;
		},
		setSfx(v) {
			audio.unlock();
			sfx = clamp(v, 0, 1);
			audio.setLevels(music, sfx, muted);
			persist();
			hudDirty = true;
		},
		press(code, down) {
			if (down) keys.add(code);
			else keys.delete(code);
		},
		probe() {
			const ball = balls.find((b) => !b.stuck) ?? balls[0];
			return {
				phase,
				score,
				paddleX,
				paddleW,
				ballX: ball?.x ?? 0,
				ballY: ball?.y ?? 0,
				ballVx: ball?.vx ?? 0,
				ballVy: ball?.vy ?? 0,
				bricksLeft: bricksLeft(),
				lives,
				stuck: balls.some((b) => b.stuck) || balls.length === 0
			};
		},
		destroy() {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("keyup", onKey);
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointercancel", onPointerUp);
			canvas.removeEventListener("pointerleave", onPointerLeave);
			canvas.removeEventListener("contextmenu", onContext);
			document.removeEventListener("visibilitychange", onVis);
			mq.removeEventListener("change", onMq);
			audio.stopMusic();
			persist();
		}
	};
}
function KaleidoBreak() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(INITIAL_HUD);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let dead = false;
		const session = createSession(canvas, (next) => {
			if (!dead) setHud(next);
		});
		gameRef.current = session;
		window.__kaleido = {
			probe: () => session.probe(),
			start: () => session.start(),
			launch: () => session.launch(),
			press: (code, down) => session.press(code, down)
		};
		const ro = new ResizeObserver(() => session.resize());
		ro.observe(canvas);
		session.resize();
		let last = performance.now();
		let raf = 0;
		const loop = (now) => {
			if (dead) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			session.frame(dt);
			raf = requestAnimationFrame(loop);
		};
		session.frame(0);
		raf = requestAnimationFrame(loop);
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			ro.disconnect();
			session.destroy();
			gameRef.current = null;
			delete window.__kaleido;
		};
	}, []);
	const game = gameRef;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "game-root",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "hud",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-side",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: hud.phase === "menu" ? "Best" : "Score"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "stat",
							children: hud.phase === "menu" ? hud.best : hud.score
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-center",
						children: hud.phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "128 BPM"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "eyebrow",
								children: [
									"Set ",
									hud.set,
									" · Lv ",
									hud.level
								]
							}),
							hud.phase === "play" && hud.stuck ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-primary btn-compact",
								onClick: () => game.current?.launch(),
								children: "Drop"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pips",
								"aria-label": `${hud.lives} lives`,
								children: Array.from({ length: Math.max(0, hud.lives) }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pip" }, i))
							}),
							hud.chain >= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "chain",
								children: [
									"x",
									hud.chain,
									" chain"
								]
							}) : null
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-side end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							"aria-pressed": hud.muted,
							"aria-label": hud.muted ? "Unmute" : "Mute",
							onClick: () => game.current?.toggleMute(),
							children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 18 })
						}), hud.phase !== "menu" && hud.phase !== "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "icon-btn",
							"aria-label": hud.phase === "pause" ? "Resume" : "Pause",
							onClick: () => game.current?.togglePause(),
							children: hud.phase === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 18 })
						}) : null]
					})
				]
			}),
			hud.powers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "powers",
				children: hud.powers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "power",
					children: [POWER_LABEL[p.kind], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "power-bar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "power-fill",
							style: { transform: `scaleX(${Math.max(0, p.left / p.total)})` }
						})
					})]
				}, p.kind))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stage",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "playfield",
						role: "application",
						"aria-label": "Kaleido Break playfield"
					}),
					hud.banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "toast",
						children: hud.banner
					}) : null,
					hud.phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "Brick rave"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "title",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Kaleido" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "title-accent",
										children: "Break"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede",
									children: "Smash the wall in time with the drop. Catch the capsules before the floor does."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "btn-primary",
									onClick: () => game.current?.start(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 }), "Enter the rave"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "help",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveHorizontal, { size: 18 }), "Drag, or A and D, to move"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pointer, { size: 18 }), "Tap Drop or press space to launch"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 18 }), "Capsules widen, split, beam, and phase"] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mixer, {
									hud,
									game
								})
							]
						})
					}) : null,
					hud.phase === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "Hold"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paused" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "row-btns",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-primary",
										onClick: () => game.current?.togglePause(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 18 }), "Resume"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "btn-ghost",
										onClick: () => game.current?.restart(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 18 }), "Restart"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mixer, {
									hud,
									game
								})
							]
						})
					}) : null,
					hud.phase === "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "Cleared"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "title",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "title-accent",
										children: ["Level ", hud.level]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "lede",
									children: "The next drop is already loading."
								})
							]
						})
					}) : null,
					hud.phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overlay",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "card",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "eyebrow",
									children: "Lights up"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "title",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Floor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "title-accent",
										children: "broke"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "stat",
									children: hud.score
								}),
								hud.newBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "new-best",
									children: "New best"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "fine-print",
									children: ["Best ", hud.best]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "btn-primary",
									onClick: () => game.current?.restart(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 18 }), "Run it back"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mixer, {
									hud,
									game
								})
							]
						})
					}) : null
				]
			})
		]
	});
}
function Mixer({ hud, game }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "sliders",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "row-btns",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "btn-ghost",
					"aria-pressed": hud.shake,
					onClick: () => game.current?.toggleShake(),
					children: ["Shake ", hud.shake ? "on" : "off"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "slider",
				children: ["Music", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 0,
					max: 1,
					step: .01,
					value: hud.music,
					"aria-label": "Music volume",
					onChange: (e) => game.current?.setMusic(Number(e.target.value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "slider",
				children: ["Hits", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 0,
					max: 1,
					step: .01,
					value: hud.sfx,
					"aria-label": "Hit volume",
					onChange: (e) => game.current?.setSfx(Number(e.target.value))
				})]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KaleidoBreak, {});
}
//#endregion
export { Home as component };
