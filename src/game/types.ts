export const WORLD_W = 480;
export const WORLD_H = 800;
export const BPM = 126;
export const BALL_R = 7;
export const PADDLE_H = 16;
export const PADDLE_Y = WORLD_H - 64;
export const WALL = 14;

export type Phase = "menu" | "play" | "pause" | "clear" | "over";

export type Power = "wide" | "beam" | "slow" | "phase" | "glue" | "multi" | "life";

export type TimedPower = "wide" | "beam" | "slow" | "phase" | "glue";

export type BrickKind = "normal" | "silver" | "gold" | "unbreak" | "boom";

export interface Brick {
  id: number;
  c: number;
  r: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BrickKind;
  hp: number;
  maxHp: number;
  dead: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  offset: number;
  trail: { x: number; y: number }[];
  ignore: Map<number, number>;
}

export interface Capsule {
  x: number;
  y: number;
  kind: Power;
  vy: number;
  dead: boolean;
}

export interface Shot {
  x: number;
  y: number;
  dead: boolean;
}

export interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number;
  kind: "dot" | "ring";
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  hue: number;
}

export interface PowerChip {
  kind: TimedPower;
  left: number;
  total: number;
}

export interface Hud {
  phase: Phase;
  score: number;
  best: number;
  level: number;
  set: number;
  lives: number;
  chain: number;
  bricksLeft: number;
  stuck: boolean;
  powers: PowerChip[];
  shake: boolean;
  music: number;
  sfx: number;
  muted: boolean;
  newBest: boolean;
  banner: string;
}

export interface Probe {
  phase: Phase;
  score: number;
  paddleX: number;
  paddleW: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  bricksLeft: number;
  lives: number;
  stuck: boolean;
}

export const INITIAL_HUD: Hud = {
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
  music: 0.7,
  sfx: 0.85,
  muted: false,
  newBest: false,
  banner: "",
};

export const POWER_LABEL: Record<Power, string> = {
  wide: "Wide",
  beam: "Beam",
  slow: "Slow",
  phase: "Phase",
  glue: "Glue",
  multi: "Split",
  life: "Life",
};

export const POWER_LETTER: Record<Power, string> = {
  wide: "W",
  beam: "B",
  slow: "S",
  phase: "P",
  glue: "G",
  multi: "M",
  life: "+",
};
