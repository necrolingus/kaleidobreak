import { audio } from "@/game/audio";
import { buildLevel } from "@/game/levels";
import { render, worldX } from "@/game/render";
import type { Scene } from "@/game/render";
import { loadSettings, saveSettings } from "@/game/storage";
import type { Ball, Brick, Capsule, Hud, Particle, Phase, Popup, Power, Probe, Shot, TimedPower } from "@/game/types";
import {
  BALL_R,
  PADDLE_H,
  PADDLE_Y,
  POWER_LABEL,
  WALL,
  WORLD_H,
  WORLD_W,
} from "@/game/types";

const STEP = 1 / 60;
const PADDLE_SPEED = 880;
const DUR: Record<TimedPower, number> = { wide: 14, beam: 10, slow: 9, phase: 8, glue: 12 };
const DROP_TABLE: Power[] = ["wide", "beam", "slow", "multi", "glue", "phase", "wide", "beam", "life", "multi", "slow"];

export interface Session {
  frame: (dt: number) => void;
  resize: () => void;
  start: () => void;
  launch: () => void;
  togglePause: () => void;
  restart: () => void;
  toggleMute: () => void;
  toggleShake: () => void;
  setMusic: (v: number) => void;
  setSfx: (v: number) => void;
  press: (code: string, down: boolean) => void;
  probe: () => Probe;
  destroy: () => void;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function createSession(canvas: HTMLCanvasElement, onHud: (hud: Hud) => void): Session {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas unavailable");

  const settings = loadSettings();
  const keys = new Set<string>();
  let phase: Phase = "menu";
  let score = 0;
  let best = settings.best;
  let runBest = best;
  let levelIndex = 0;
  let lives = 3;
  let chain = 0;
  let bricks = buildLevel(0);
  let balls: Ball[] = [];
  let capsules: Capsule[] = [];
  let shots: Shot[] = [];
  const particles: Particle[] = Array.from({ length: 260 }, () => ({
    alive: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    size: 2,
    hue: 0,
    kind: "dot" as const,
  }));
  let popups: Popup[] = [];
  let paddleX = WORLD_W / 2;
  let paddleW = 96;
  let squash = 0;
  let pointerOn = false;
  let pointerWorld = paddleX;
  let downX = 0;
  let downAt = 0;
  let moved = false;
  const powers: Record<TimedPower, number> = { wide: 0, beam: 0, slow: 0, phase: 0, glue: 0 };
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
    return (levelIndex % 8) + 1;
  }
  function setNum() {
    return Math.floor(levelIndex / 8) + 1;
  }

  function persist() {
    saveSettings({ version: 1, best, music, sfx, muted, shake });
  }

  function say(text: string) {
    banner = text;
    bannerT = 1.25;
    hudDirty = true;
  }

  function emit(n: number, x: number, y: number, hue: number, speed: number, kind: Particle["kind"] = "dot") {
    let left = n;
    for (const p of particles) {
      if (p.alive) continue;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.75);
      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = kind === "ring" ? 0 : Math.cos(a) * s;
      p.vy = kind === "ring" ? 0 : Math.sin(a) * s;
      p.life = p.max = kind === "ring" ? 0.45 : 0.28 + Math.random() * 0.35;
      p.size = 1.6 + Math.random() * 2.2;
      p.hue = hue;
      p.kind = kind;
      if (--left <= 0) break;
    }
  }

  function popup(x: number, y: number, text: string, hue: number) {
    popups.push({ x, y, text, life: 0.7, max: 0.7, hue });
    if (popups.length > 18) popups.splice(0, popups.length - 18);
  }

  function desiredSpeed() {
    const sp = Math.min(620, 340 + (setNum() - 1) * 26 + Math.min(140, rally * 11));
    return powers.slow > 0 ? sp * 0.62 : sp;
  }

  function setSpeed(ball: Ball, sp: number) {
    const m = Math.hypot(ball.vx, ball.vy);
    if (m < 8) return;
    const k = sp / m;
    ball.vx *= k;
    ball.vy *= k;
    if (Math.abs(ball.vy) < sp * 0.2) {
      ball.vy = Math.sign(ball.vy || -1) * sp * 0.25;
      const m2 = Math.hypot(ball.vx, ball.vy) || 1;
      const k2 = sp / m2;
      ball.vx *= k2;
      ball.vy *= k2;
    }
  }

  function makeBall(stuck: boolean, x = paddleX): Ball {
    return { x, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, stuck, offset: x - paddleX, trail: [], ignore: new Map() };
  }

  function halfW() {
    return paddleW / 2;
  }

  function resetField() {
    bricks = buildLevel(levelIndex);
    capsules = [];
    shots = [];
    balls = [makeBall(true, WORLD_W / 2)];
    paddleX = WORLD_W / 2;
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

  function snapshot(): Hud {
    const chips = (Object.keys(DUR) as TimedPower[])
      .filter((k) => powers[k] > 0)
      .map((k) => ({ kind: k, left: powers[k], total: DUR[k] }));
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
      banner: bannerT > 0 ? banner : "",
    };
  }

  function emitHud(force = false) {
    if (!force && !hudDirty) return;
    hudDirty = false;
    onHud(snapshot());
  }

  function award(brick: Brick) {
    const base = brick.kind === "gold" ? 120 : brick.kind === "silver" ? 80 : brick.kind === "boom" ? 90 : 50;
    const mul = Math.min(8, 1 + Math.floor(chain / 2));
    const pts = base * mul;
    score += pts;
    chain += 1;
    if (score > best) {
      best = score;
      persist();
    }
    popup(brick.x + brick.w / 2, brick.y, `+${pts}`, 48 + brick.r * 18);
    if (chain > 0 && chain % 4 === 0) {
      popup(WORLD_W / 2, 360, `${chain} CHAIN`, 168);
      say(`${chain} chain`);
    }
    hudDirty = true;
  }

  function maybeDrop(x: number, y: number) {
    if (Math.random() > 0.26) return;
    const kind = DROP_TABLE[dropCursor % DROP_TABLE.length] ?? "wide";
    dropCursor++;
    capsules.push({ x, y, kind, vy: 165, dead: false });
  }

  function damage(brick: Brick, depth: number) {
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
      trauma = Math.min(1, trauma + 0.45);
      flash = Math.min(0.5, flash + 0.28);
      hitstop = Math.max(hitstop, 0.045);
      for (const other of bricks) {
        if (other.dead || other === brick) continue;
        if (Math.max(Math.abs(other.c - brick.c), Math.abs(other.r - brick.r)) === 1) damage(other, depth + 1);
      }
    } else {
      audio.blip(brick.r);
      trauma = Math.min(1, trauma + (brick.kind === "gold" ? 0.22 : 0.1));
      hitstop = Math.max(hitstop, brick.kind === "gold" ? 0.03 : 0.016);
    }
    maybeDrop(brick.x + brick.w / 2, brick.y + brick.h / 2);
  }

  function reflect(ball: Ball, nx: number, ny: number) {
    if (nx !== 0 && ball.vx * nx < 0) ball.vx *= -1;
    if (ny !== 0 && ball.vy * ny < 0) ball.vy *= -1;
  }

  function collideBricks(ball: Ball) {
    if (ball.stuck) return;
    let best: { b: Brick; dist: number; nx: number; ny: number; inside: boolean } | null = null;
    for (const b of bricks) {
      if (b.dead) continue;
      const cool = ball.ignore.get(b.id) ?? 0;
      if (cool > 0) continue;
      const cx = clamp(ball.x, b.x, b.x + b.w);
      const cy = clamp(ball.y, b.y, b.y + b.h);
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const inside = dx === 0 && dy === 0;
      const d2 = dx * dx + dy * dy;
      if (!inside && d2 > BALL_R * BALL_R) continue;
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
        const d = dist || 0.0001;
        nx = dx / d;
        ny = dy / d;
      }
      best = { b, dist, nx, ny, inside };
    }
    if (!best) return;
    const phased = powers.phase > 0 && best.b.kind !== "unbreak";
    ball.ignore.set(best.b.id, phased ? 0.28 : 0.07);
    damage(best.b, 0);
    if (phased) return;
    reflect(ball, best.nx, best.ny);
    if (best.inside) {
      if (best.nx < 0) ball.x = best.b.x - BALL_R - 0.4;
      else if (best.nx > 0) ball.x = best.b.x + best.b.w + BALL_R + 0.4;
      if (best.ny < 0) ball.y = best.b.y - BALL_R - 0.4;
      else if (best.ny > 0) ball.y = best.b.y + best.b.h + BALL_R + 0.4;
    } else {
      const pen = BALL_R - best.dist;
      ball.x += best.nx * (pen + 0.3);
      ball.y += best.ny * (pen + 0.3);
    }
  }

  function hitPaddle(ball: Ball, prevY: number) {
    if (ball.stuck || ball.vy <= 0) return;
    const top = PADDLE_Y;
    const bot = PADDLE_Y + PADDLE_H;
    const prevBottom = prevY + BALL_R;
    const bottom = ball.y + BALL_R;
    if (prevBottom > top + 4 && prevY > bot) return;
    if (!(prevBottom <= top + 6 && bottom >= top - 8)) return;
    const half = halfW();
    if (ball.x < paddleX - half - BALL_R * 0.45 || ball.x > paddleX + half + BALL_R * 0.45) return;
    if (powers.glue > 0) {
      ball.stuck = true;
      ball.offset = clamp(ball.x - paddleX, -half + 8, half - 8);
      ball.vx = 0;
      ball.vy = 0;
      audio.paddle(0.5);
      squash = 1;
      hudDirty = true;
      return;
    }
    const t = clamp((ball.x - paddleX) / half, -1, 1);
    const spin = clamp((paddleX - pointerWorld) * 0, -0.2, 0.2);
    const keySpin = (keys.has("ArrowRight") || keys.has("KeyD") ? 0.18 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 0.18 : 0);
    const angle = -Math.PI / 2 + t * 1.12 + spin + keySpin;
    const sp = desiredSpeed();
    ball.vx = Math.cos(angle) * sp;
    ball.vy = Math.sin(angle) * sp;
    ball.y = top - BALL_R - 0.2;
    if (chain >= 4) popup(paddleX, PADDLE_Y - 28, `CHAIN ${chain}`, 168);
    chain = 0;
    squash = 1;
    trauma = Math.min(1, trauma + 0.06);
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
      const dir = Math.sign(ball.offset) || (Math.random() < 0.5 ? -1 : 1);
      const angle = -Math.PI / 2 + t * 0.85 + dir * 0.12;
      ball.vx = Math.cos(angle) * sp;
      ball.vy = Math.sin(angle) * sp;
    }
    if (any) {
      audio.launch();
      hudDirty = true;
    }
  }

  function applyPower(kind: Power) {
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
      if (src) {
        for (const delta of [-0.42, 0.42]) {
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
              ignore: new Map(),
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
              ignore: new Map(),
            });
          }
        }
      }
      say("Split");
      hudDirty = true;
      return;
    }
    const timed = kind as TimedPower;
    powers[timed] = DUR[timed];
    say(POWER_LABEL[kind]);
    hudDirty = true;
  }

  function loseBall() {
    lives -= 1;
    chain = 0;
    rally = 0;
    trauma = Math.min(1, trauma + 0.7);
    flash = 0.35;
    emit(1, paddleX, PADDLE_Y, 320, 0, "ring");
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
    popup(WORLD_W / 2, 400, `+${bonus}`, 168);
    emit(1, WORLD_W / 2, 360, 300, 0, "ring");
    emit(1, WORLD_W / 2, 360, 168, 0, "ring");
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

  function step(dt: number) {
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
    const right = keys.has("ArrowRight") || keys.has("KeyD");
    const keyDir = (right ? 1 : 0) - (left ? 1 : 0);
    if (keyDir !== 0) {
      pointerOn = false;
      paddleX += keyDir * PADDLE_SPEED * dt;
    } else if (pointerOn) {
      paddleX = pointerWorld;
    }
    paddleX = clamp(paddleX, WALL + half, WORLD_W - WALL - half);

    for (const k of Object.keys(powers) as TimedPower[]) {
      if (powers[k] > 0) {
        powers[k] = Math.max(0, powers[k] - dt);
        if (powers[k] === 0) hudDirty = true;
      }
    }

    if (powers.beam > 0) {
      laserCd -= dt;
      if (laserCd <= 0) {
        laserCd = 0.24;
        shots.push({ x: paddleX - half + 10, y: PADDLE_Y, dead: false });
        shots.push({ x: paddleX + half - 10, y: PADDLE_Y, dead: false });
        audio.laser();
      }
    }

    const sp = desiredSpeed();
    let anyFlight = false;
    for (const ball of balls) {
      if (ball.stuck) {
        ball.x = clamp(paddleX + ball.offset, WALL + BALL_R, WORLD_W - WALL - BALL_R);
        ball.y = PADDLE_Y - BALL_R - 1;
        ball.trail.push({ x: ball.x, y: ball.y });
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
        if (ball.x < WALL + BALL_R) {
          ball.x = WALL + BALL_R;
          ball.vx = Math.abs(ball.vx);
          if (wallCd <= 0) {
            wallCd = 0.05;
            audio.wall();
          }
        } else if (ball.x > WORLD_W - WALL - BALL_R) {
          ball.x = WORLD_W - WALL - BALL_R;
          ball.vx = -Math.abs(ball.vx);
          if (wallCd <= 0) {
            wallCd = 0.05;
            audio.wall();
          }
        }
        if (ball.y < WALL + BALL_R) {
          ball.y = WALL + BALL_R;
          ball.vy = Math.abs(ball.vy);
          if (wallCd <= 0) {
            wallCd = 0.05;
            audio.wall();
          }
        }
        collideBricks(ball);
        hitPaddle(ball, prevY);
        if (ball.stuck) break;
      }
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 14) ball.trail.shift();
    }
    if (anyFlight) rally += dt;
    else rally = 0;
    wallCd = Math.max(0, wallCd - dt);

    balls = balls.filter((b) => b.stuck || b.y < WORLD_H - 6);
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
      if (c.y > WORLD_H) {
        c.dead = true;
        continue;
      }
      if (c.y >= PADDLE_Y - 8 && c.y <= PADDLE_Y + PADDLE_H + 8 && Math.abs(c.x - paddleX) < half + 18) {
        c.dead = true;
        applyPower(c.kind);
        emit(10, c.x, c.y, 168, 140);
      }
    }
    capsules = capsules.filter((c) => !c.dead);

    if (phase === "play") checkClear();
    introT = Math.max(0, introT - dt);
  }

  function scene(): Scene {
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
      popups,
    };
  }

  function paint() {
    render(ctx!, scene(), cssW, cssH, dpr);
  }

  function onKey(e: KeyboardEvent) {
    const target = e.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Space") {
      e.preventDefault();
    }
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

  function onPointerDown(e: PointerEvent) {
    audio.unlock();
    pointerOn = true;
    moved = false;
    downX = e.clientX;
    downAt = performance.now();
    const rect = canvas.getBoundingClientRect();
    pointerWorld = worldX(e.clientX, rect);
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (e.pointerType === "mouse" || pointerOn) {
      if (Math.abs(e.clientX - downX) > 12) moved = true;
      pointerWorld = worldX(e.clientX, rect);
      if (e.pointerType === "mouse") pointerOn = true;
    }
  }

  function onPointerUp(e: PointerEvent) {
    const quick = performance.now() - downAt < 280 && !moved;
    if (quick && phase === "play" && e.pointerType !== "mouse") launch();
    if (e.pointerType === "mouse") {
      const rect = canvas.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      pointerOn = inside;
      if (quick && phase === "play") launch();
    } else {
      pointerOn = false;
    }
  }

  function onPointerLeave(e: PointerEvent) {
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
  function onContext(e: Event) {
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
    frame(dt: number) {
      visTime += dt;
      acc += Math.min(0.05, Math.max(0, dt));
      let n = 0;
      while (acc >= STEP && n < 5) {
        step(STEP);
        acc -= STEP;
        n++;
      }
      paint();
      uiAcc += dt;
      if (hudDirty || uiAcc > 0.2) {
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
    setMusic(v: number) {
      audio.unlock();
      music = clamp(v, 0, 1);
      audio.setLevels(music, sfx, muted);
      persist();
      hudDirty = true;
    },
    setSfx(v: number) {
      audio.unlock();
      sfx = clamp(v, 0, 1);
      audio.setLevels(music, sfx, muted);
      persist();
      hudDirty = true;
    },
    press(code: string, down: boolean) {
      if (down) keys.add(code);
      else keys.delete(code);
    },
    probe(): Probe {
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
        stuck: balls.some((b) => b.stuck) || balls.length === 0,
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
    },
  };
}

