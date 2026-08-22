import { useEffect, useMemo, useRef, useState } from 'react';
import { accent, alpha } from '../lib/accents.js';

// The animated orb that paces a breath (or a tap) cycle.
//
// Why the scaling is not a CSS animation: a cycle's phases have different
// lengths — 4-7-8 holds for seven seconds and exhales for eight — so a single
// keyframe track would need regenerating per instrument. Instead each phase
// sets a transform and a matching transition-duration, and the browser does
// the interpolation. That also means one timer drives both the visuals and the
// phase label, so they can never drift apart.
//
// The timer is wall-clock based rather than an accumulating interval: a
// backgrounded tab throttles setInterval to once a second or worse, and a
// breath pacer that silently loses ten seconds is worse than one that pauses.

const SCALE = { grow: 1, shrink: 0.55, hold: null, left: 0.82, right: 0.82 };
const SHIFT = { left: -52, right: 52 };

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function BreathPacer({ pacer, accent: accentName, running, onFinish }) {
  const { base, bright } = accent(accentName);
  const reduced = useMemo(prefersReducedMotion, []);

  // Flatten the rounds into one list of phases so the runner only ever has to
  // track a single index — round boundaries fall out of the arithmetic.
  const timeline = useMemo(() => {
    const phases = [];
    for (let round = 0; round < pacer.rounds; round += 1) {
      for (const phase of pacer.phases) phases.push({ ...phase, round });
    }
    return phases;
  }, [pacer]);

  const totalSeconds = pacer.cycleSeconds * pacer.rounds;

  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Kept in a ref so the ticker can read the latest callback without being
  // torn down and restarted on every parent re-render.
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!running) return undefined;

    // Where we already were, so pausing and resuming does not restart the run.
    const startedAt = Date.now() - elapsed * 1000;
    let frame;

    const tick = () => {
      const seconds = (Date.now() - startedAt) / 1000;

      if (seconds >= totalSeconds) {
        setElapsed(totalSeconds);
        setIndex(timeline.length - 1);
        finishRef.current?.();
        return;
      }

      setElapsed(seconds);

      // Which phase that lands in — walked rather than divided, because the
      // phases within a cycle are not equal lengths.
      let remaining = seconds % pacer.cycleSeconds;
      const round = Math.floor(seconds / pacer.cycleSeconds);
      let phaseInCycle = 0;
      for (const phase of pacer.phases) {
        if (remaining < phase.seconds) break;
        remaining -= phase.seconds;
        phaseInCycle += 1;
      }
      setIndex(Math.min(round * pacer.phases.length + phaseInCycle, timeline.length - 1));

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `elapsed` is deliberately not a dependency: it is read once to resume
    // from, then owned by the ticker until the run pauses again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeline, totalSeconds, pacer]);

  const phase = timeline[index] || timeline[0];
  const round = (phase?.round ?? 0) + 1;

  // A hold keeps whatever size the phase before it left behind, so the orb
  // does not twitch when the breath is meant to be still.
  const scale = useMemo(() => {
    for (let i = index; i >= 0; i -= 1) {
      const value = SCALE[timeline[i].action];
      if (value !== null && value !== undefined) return value;
    }
    return 0.55;
  }, [index, timeline]);

  const shift = SHIFT[phase?.action] ?? 0;
  const secondsLeft = Math.max(0, Math.ceil(totalSeconds - elapsed));

  // Count down within the phase, which is the number people actually breathe
  // to. Ceil so it reads 4-3-2-1 rather than 3-2-1-0.
  const phaseStart = useMemo(
    () => timeline.slice(0, index).reduce((total, p) => total + p.seconds, 0),
    [index, timeline],
  );
  const phaseLeft = Math.max(1, Math.ceil(phase.seconds - (elapsed - phaseStart)));

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
        {/* Rings leaving on each phase change. Keyed on the index so React
            remounts them and the animation replays from the start. */}
        {!reduced &&
          running &&
          [0, 1].map((i) => (
            <span
              key={`${index}-${i}`}
              aria-hidden="true"
              className="animate-ripple absolute rounded-full"
              style={{
                width: '58%',
                height: '58%',
                border: `1px solid ${alpha(bright, 0.4)}`,
                animationDelay: `${i * 420}ms`,
              }}
            />
          ))}

        {/* The orb. Everything about its motion comes from these two inline
            properties, both derived from the phase we are on. */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: '62%',
            height: '62%',
            background: `radial-gradient(circle at 34% 30%, ${alpha(bright, 0.95)}, ${alpha(base, 0.55)} 58%, ${alpha(base, 0.12)} 100%)`,
            boxShadow: `0 0 90px ${alpha(base, 0.45)}, inset 0 0 60px ${alpha(bright, 0.28)}`,
            transform: `translateX(${shift}px) scale(${scale})`,
            transition: reduced
              ? 'none'
              : `transform ${phase.seconds}s cubic-bezier(0.37, 0, 0.63, 1)`,
          }}
        >
          <span
            className="font-display select-none text-5xl text-white/90 tabular-nums"
            aria-hidden="true"
          >
            {phaseLeft}
          </span>
        </div>
      </div>

      {/* The instruction. aria-live so a screen reader announces each phase —
          this is the whole practice for anyone not watching the orb. */}
      <p
        className="font-display mt-8 min-h-[2.5rem] text-center text-2xl leading-snug sm:text-3xl"
        style={{ color: bright }}
        aria-live="polite"
      >
        {phase.label}
      </p>

      <p className="mt-3 text-xs text-[var(--color-muted)] tabular-nums">
        Round {Math.min(round, pacer.rounds)} of {pacer.rounds} · {secondsLeft}s left
      </p>
    </div>
  );
}
