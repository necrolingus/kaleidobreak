import type { Brick, BrickKind } from "@/game/types";
import { WORLD_W } from "@/game/types";

const COLS = 10;

export const LEVELS: readonly (readonly string[])[] = [
  ["##########", "##########", "##########", "##########"],
  ["....##....", "...####...", "..######..", ".########.", "##########", ".########."],
  ["#S#S#S#S#S", "S#S#S#S#S#", "#S#S#S#S#S", "S#S#S#S#S#", "#S#S#S#S#S"],
  ["###....###", "###....###", "###.XX.###", "###....###", "SSS....SSS", "##########"],
  ["....GG....", "...G##G...", "..G#EE#G..", ".G##EE##G.", "..G#EE#G..", "...G##G...", "....GG...."],
  ["E.#.#.#.#E", ".#.#.#.#.#", "S#S#S#S#S#", "#S#S#S#S#S", ".#.#.#.#.#", "##########"],
  ["XXXXXXXXXX", "X##....##X", "X#.E##E.#X", "X#......#X", "X#.E##E.#X", "X##S##S##X", "##########"],
  [
    "GGGGGGGGGG",
    "GXSXSXSXSG",
    "G..E..E..G",
    "GS######SG",
    "G..E..E..G",
    "GXSXSXSXSG",
    "##########",
    "###X##X###",
  ],
];

function kindOf(ch: string): BrickKind | null {
  switch (ch) {
    case "#":
      return "normal";
    case "S":
      return "silver";
    case "G":
      return "gold";
    case "X":
      return "unbreak";
    case "E":
      return "boom";
    default:
      return null;
  }
}

function hpOf(kind: BrickKind): number {
  if (kind === "silver") return 2;
  if (kind === "gold") return 3;
  return 1;
}

export function buildLevel(index: number): Brick[] {
  const map = LEVELS[index % LEVELS.length] ?? LEVELS[0]!;
  const gap = 5;
  const marginX = 22;
  const marginY = 26;
  const bw = (WORLD_W - marginX * 2 - gap * (COLS - 1)) / COLS;
  const bh = 20;
  const bricks: Brick[] = [];
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
        y: marginY + r * (bh + gap),
        w: bw,
        h: bh,
        kind,
        hp,
        maxHp: hp,
        dead: false,
      });
    }
  }
  return bricks;
}
