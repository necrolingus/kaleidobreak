import { useEffect, useRef, useState, type RefObject } from "react";
import { MoveHorizontal, Pause, Play, Pointer, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import type { Session } from "@/game/engine";
import { createSession } from "@/game/engine";
import type { Hud, Probe } from "@/game/types";
import { INITIAL_HUD, POWER_LABEL } from "@/game/types";

declare global {
  interface Window {
    __kaleido?: {
      probe: () => Probe;
      start: () => void;
      launch: () => void;
      press: (code: string, down: boolean) => void;
    };
  }
}

export function KaleidoBreak() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Session | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL_HUD);

  useEffect(() => {
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
      press: (code, down) => session.press(code, down),
    };
    const ro = new ResizeObserver(() => session.resize());
    ro.observe(canvas);
    session.resize();
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
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

  return (
    <main className="game-root">
      <header className="hud">
        <div className="hud-side">
          <div>
            <p className="eyebrow">{hud.phase === "menu" ? "Best" : "Score"}</p>
            <p className="stat">{hud.phase === "menu" ? hud.best : hud.score}</p>
          </div>
        </div>
        <div className="hud-center">
          {hud.phase === "menu" ? (
            <p className="eyebrow">128 BPM</p>
          ) : (
            <>
              <p className="eyebrow">
                Set {hud.set} · Lv {hud.level}
              </p>
              {hud.phase === "play" && hud.stuck ? (
                <button type="button" className="btn-primary btn-compact" onClick={() => game.current?.launch()}>
                  Drop
                </button>
              ) : null}
              <div className="pips" aria-label={`${hud.lives} lives`}>
                {Array.from({ length: Math.max(0, hud.lives) }, (_, i) => (
                  <span key={i} className="pip" />
                ))}
              </div>
              {hud.chain >= 2 ? <p className="chain">x{hud.chain} chain</p> : null}
            </>
          )}
        </div>
        <div className="hud-side end">
          <button
            type="button"
            className="icon-btn"
            aria-pressed={hud.muted}
            aria-label={hud.muted ? "Unmute" : "Mute"}
            onClick={() => game.current?.toggleMute()}
          >
            {hud.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {hud.phase !== "menu" && hud.phase !== "over" ? (
            <button
              type="button"
              className="icon-btn"
              aria-label={hud.phase === "pause" ? "Resume" : "Pause"}
              onClick={() => game.current?.togglePause()}
            >
              {hud.phase === "pause" ? <Play size={18} /> : <Pause size={18} />}
            </button>
          ) : null}
        </div>
      </header>

      {hud.powers.length > 0 ? (
        <div className="powers">
          {hud.powers.map((p) => (
            <span key={p.kind} className="power">
              {POWER_LABEL[p.kind]}
              <span className="power-bar">
                <span className="power-fill" style={{ transform: `scaleX(${Math.max(0, p.left / p.total)})` }} />
              </span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="stage">
        <canvas ref={canvasRef} className="playfield" role="application" aria-label="Kaleido Break playfield" />

        {hud.banner ? <p className="toast">{hud.banner}</p> : null}

        {hud.phase === "menu" ? (
          <div className="overlay">
            <section className="card">
              <p className="eyebrow">Brick rave</p>
              <h1 className="title">
                <span>Kaleido</span>
                <span className="title-accent">Break</span>
              </h1>
              <p className="lede">Smash the wall in time with the drop. Catch the capsules before the floor does.</p>
              <button type="button" className="btn-primary" onClick={() => game.current?.start()}>
                <Play size={18} />
                Enter the rave
              </button>
              <ul className="help">
                <li>
                  <MoveHorizontal size={18} />
                  Drag, or A and D, to move
                </li>
                <li>
                  <Pointer size={18} />
                  Tap Drop or press space to launch
                </li>
                <li>
                  <Zap size={18} />
                  Capsules widen, split, beam, and phase
                </li>
              </ul>
              <Mixer hud={hud} game={game} />
            </section>
          </div>
        ) : null}

        {hud.phase === "pause" ? (
          <div className="overlay">
            <section className="card">
              <p className="eyebrow">Hold</p>
              <h2 className="title">
                <span>Paused</span>
              </h2>
              <div className="row-btns">
                <button type="button" className="btn-primary" onClick={() => game.current?.togglePause()}>
                  <Play size={18} />
                  Resume
                </button>
                <button type="button" className="btn-ghost" onClick={() => game.current?.restart()}>
                  <RotateCcw size={18} />
                  Restart
                </button>
              </div>
              <Mixer hud={hud} game={game} />
            </section>
          </div>
        ) : null}

        {hud.phase === "clear" ? (
          <div className="overlay">
            <section className="card">
              <p className="eyebrow">Cleared</p>
              <h2 className="title">
                <span className="title-accent">Level {hud.level}</span>
              </h2>
              <p className="lede">The next drop is already loading.</p>
            </section>
          </div>
        ) : null}

        {hud.phase === "over" ? (
          <div className="overlay">
            <section className="card">
              <p className="eyebrow">Lights up</p>
              <h2 className="title">
                <span>Floor</span>
                <span className="title-accent">broke</span>
              </h2>
              <p className="stat">{hud.score}</p>
              {hud.newBest ? <p className="new-best">New best</p> : <p className="fine-print">Best {hud.best}</p>}
              <button type="button" className="btn-primary" onClick={() => game.current?.restart()}>
                <RotateCcw size={18} />
                Run it back
              </button>
              <Mixer hud={hud} game={game} />
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Mixer({ hud, game }: { hud: Hud; game: RefObject<Session | null> }) {
  return (
    <div className="sliders">
      <div className="row-btns">
        <button type="button" className="btn-ghost" aria-pressed={hud.shake} onClick={() => game.current?.toggleShake()}>
          Shake {hud.shake ? "on" : "off"}
        </button>
      </div>
      <label className="slider">
        Music
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={hud.music}
          aria-label="Music volume"
          onChange={(e) => game.current?.setMusic(Number(e.target.value))}
        />
      </label>
      <label className="slider">
        Hits
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={hud.sfx}
          aria-label="Hit volume"
          onChange={(e) => game.current?.setSfx(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
