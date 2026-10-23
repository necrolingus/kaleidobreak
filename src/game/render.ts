import { audio } from "@/game/audio";
import type { Ball, Brick, Capsule, Particle, Popup, Power, Shot } from "@/game/types";
import { BALL_R, BPM, PADDLE_H, PADDLE_Y, POWER_LETTER, WORLD_H, WORLD_W } from "@/game/types";

export interface Scene {
  visTime: number;
  reduce: boolean;
  shake: boolean;
  trauma: number;
  phase: string;
  level: number;
  set: number;
  introT: number;
  flash: number;
  paddleX: number;
  paddleW: number;
  squash: number;
  beam: boolean;
  bricks: Brick[];
  balls: Ball[];
  capsules: Capsule[];
  shots: Shot[];
  particles: Particle[];
  popups: Popup[];
}

const MOTES = Array.from({ length: 42 }, (_, i) => {
  const h = (n: number) => {
    const x = Math.sin(n * 127.1 + i * 3.1) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: h(1), y: h(2), s: 0.6 + h(3) * 1.8, p: h(4) * Math.PI * 2 };
});

function hueOf(brick: Brick, t: number): number {
  if (brick.kind === "gold") return 46;
  if (brick.kind === "silver") return 200;
  if (brick.kind === "unbreak") return 168;
  if (brick.kind === "boom") return (t * 90 + brick.c * 20) % 360;
  return (brick.r * 26 + brick.c * 8 + t * 18) % 360;
}

function powerHue(kind: Power): number {
  switch (kind) {
    case "wide":
      return 172;
    case "beam":
      return 312;
    case "slow":
      return 48;
    case "phase":
      return 0;
    case "glue":
      return 130;
    case "multi":
      return 46;
    case "life":
      return 172;
  }
}

export function layout(cssW: number, cssH: number) {
  const scale = Math.min(cssW / WORLD_W, cssH / WORLD_H);
  const ox = (cssW - WORLD_W * scale) / 2;
  const oy = (cssH - WORLD_H * scale) / 2;
  return { scale, ox, oy };
}

export function worldX(clientX: number, rect: DOMRect): number {
  const { scale, ox } = layout(rect.width, rect.height);
  return (clientX - rect.left - ox) / scale;
}

export function render(ctx: CanvasRenderingContext2D, scene: Scene, cssW: number, cssH: number, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = scene.visTime;
  const spin = scene.reduce ? t * 0.02 : t * 0.18;
  const hue = (t * 16) % 360;
  const kick = scene.reduce ? 0.2 : audio.kickPulse() || Math.exp(-((t * BPM) / 60) % 1 * 6);

  const bg = ctx.createRadialGradient(cssW * 0.5, cssH * 0.42, 10, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.75);
  bg.addColorStop(0, `hsl(${hue} 45% 14%)`);
  bg.addColorStop(0.45, "#100814");
  bg.addColorStop(1, "#05020a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.translate(cssW * 0.5, cssH * 0.46);
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate(spin);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = `hsla(${(hue + i * 28) % 360} 90% 60% / ${0.035 + kick * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.max(cssW, cssH), 28);
    ctx.lineTo(Math.max(cssW, cssH), -28);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cssW * 0.5, cssH * 0.46);
  ctx.globalCompositeOperation = "lighter";
  const maxR = Math.max(cssW, cssH) * 0.72;
  for (let i = 0; i < 7; i++) {
    const phase = (t * 0.35 + i / 7) % 1;
    const r = 30 + phase * maxR;
    ctx.strokeStyle = `hsla(${(hue + i * 40) % 360} 100% 65% / ${0.12 * (1 - phase)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  const beatR = 20 + ((t * BPM) / 60) % 1 * maxR * 0.85;
  ctx.strokeStyle = `hsla(${hue} 100% 70% / ${0.18 + kick * 0.35})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, beatR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  for (const m of MOTES) {
    const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2 + m.p));
    ctx.fillStyle = `hsla(${(hue + m.p * 40) % 360} 90% 72% / ${0.25 * tw})`;
    ctx.fillRect(m.x * cssW, m.y * cssH, m.s, m.s);
  }

  const { scale, ox, oy } = layout(cssW, cssH);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  if (!scene.reduce && scene.shake) {
    const s = scene.trauma * scene.trauma;
    const mag = 8 * s;
    ctx.translate(Math.sin(t * 53) * mag, Math.cos(t * 47) * mag * 0.65);
    ctx.rotate(Math.sin(t * 41) * 0.01 * s);
  }

  ctx.beginPath();
  ctx.roundRect(8, 8, WORLD_W - 16, WORLD_H - 16, 18);
  ctx.fillStyle = "rgba(6, 3, 12, 0.62)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsla(${hue} 100% 64% / ${0.35 + kick * 0.5})`;
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
      ctx.strokeStyle = `hsla(${p.hue} 100% 68% / ${a * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = `hsla(${p.hue} 95% 64% / ${a})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  for (let i = 0; i < scene.balls.length; i++) {
    drawBall(ctx, scene.balls[i]!, (hue + i * 40) % 360);
  }

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
    ctx.fillText(`LEVEL ${scene.level}`, WORLD_W / 2, 430);
    if (scene.set > 1) {
      ctx.font = "500 16px Outfit, sans-serif";
      ctx.fillStyle = `hsla(172 100% 70% / ${a})`;
      ctx.fillText(`SET ${scene.set}`, WORLD_W / 2, 468);
    }
  }

  if (scene.flash > 0 && !scene.reduce) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.16, scene.flash)})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

  ctx.restore();

  const vig = ctx.createRadialGradient(cssW / 2, cssH / 2, cssH * 0.28, cssW / 2, cssH / 2, cssH * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawBrick(ctx: CanvasRenderingContext2D, b: Brick, t: number) {
  const h = hueOf(b, t);
  const x = b.x;
  const y = b.y;
  ctx.beginPath();
  ctx.roundRect(x, y, b.w, b.h, 4);
  if (b.kind === "unbreak") {
    ctx.fillStyle = "#120a18";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `hsla(168 80% 62% / ${0.45 + 0.25 * Math.sin(t * 3 + b.c)})`;
    ctx.stroke();
    return;
  }
  const light = b.kind === "silver" ? 72 : b.kind === "gold" ? 56 : 52;
  ctx.fillStyle = `hsl(${h} 88% ${light}%)`;
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
  if (b.maxHp > 1) {
    for (let i = 0; i < b.maxHp; i++) {
      ctx.fillStyle = i < b.hp ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.35)";
      ctx.fillRect(x + b.w - 6 - i * 5, y + b.h - 5, 3, 3);
    }
  }
}

function drawCapsule(ctx: CanvasRenderingContext2D, c: Capsule, t: number) {
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
  ctx.fillText(POWER_LETTER[c.kind], c.x, c.y + bob + 0.5);
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, hue: number) {
  const trail = ball.trail;
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i]!;
    const a = (i / trail.length) * 0.55;
    ctx.fillStyle = `hsla(${(hue + i * 8) % 360} 100% 64% / ${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, BALL_R * (0.35 + (i / trail.length) * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255, 43, 214, 0.85)";
  ctx.beginPath();
  ctx.arc(ball.x - 2.2, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(61, 255, 232, 0.75)";
  ctx.beginPath();
  ctx.arc(ball.x + 2.2, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#fffaf6";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaddle(ctx: CanvasRenderingContext2D, scene: Scene, hue: number, t: number) {
  const squash = scene.squash;
  const w = scene.paddleW * (1 + squash * 0.14);
  const h = PADDLE_H * (1 - squash * 0.28);
  const x = scene.paddleX - w / 2;
  const y = PADDLE_Y + (PADDLE_H - h) / 2;
  ctx.fillStyle = `hsla(${hue} 100% 60% / 0.28)`;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, h + 10, 12);
  ctx.fill();
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, `hsl(${(hue + 40) % 360} 100% 62%)`);
  g.addColorStop(0.5, "#f6f1ea");
  g.addColorStop(1, `hsl(${(hue + 200) % 360} 100% 60%)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.clip();
  const shine = ((t * 90) % (w + 30)) - 15;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x + shine, y, 10, h);
  ctx.restore();
  if (scene.beam) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 6, y + 3, 4, h - 6);
    ctx.fillRect(x + w - 10, y + 3, 4, h - 6);
  }
}
