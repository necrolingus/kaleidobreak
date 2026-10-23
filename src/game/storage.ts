export interface Settings {
  version: 1;
  best: number;
  music: number;
  sfx: number;
  muted: boolean;
  shake: boolean;
}

const KEY = "kaleido-break-v1";

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  best: 0,
  music: 0.7,
  sfx: 0.85,
  muted: false,
  shake: true,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function loadSettings(): Settings {
  try {
    if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const reduce =
        typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      return { ...DEFAULT_SETTINGS, shake: !reduce };
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      version: 1,
      best: Number.isFinite(parsed.best) ? Math.max(0, Number(parsed.best)) : 0,
      music: clamp01(parsed.music ?? DEFAULT_SETTINGS.music),
      sfx: clamp01(parsed.sfx ?? DEFAULT_SETTINGS.sfx),
      muted: !!parsed.muted,
      shake: parsed.shake !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify({ ...settings, version: 1 }));
  } catch {
    /* private mode / quota — keep playing */
  }
}
