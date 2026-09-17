import { useEffect, useState } from 'react';

const RUN = Array.from({ length: 20 }, (_, i) => i % 10);

// A count that rolls to its value like a mechanical counter.
//
// `go` starts the roll; until then every figure shows 0. Each column is 0 to 9
// twice over and stops in the second run, so every figure turns at least once,
// and the figures start 90ms apart, left to right. Under reduced motion the
// CSS drops the transition and the figures are simply there.
//
// The value is read out once, from the label; the columns are aria-hidden,
// because a screen reader walking twenty stacked digits is not a number.
export default function Odometer({ value, go = true, className = '', style }) {
  const [rolled, setRolled] = useState(false);

  // One frame at 0 before rolling, so a count that mounts already visible
  // (a result screen) still has a first state to roll from.
  useEffect(() => {
    if (!go) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRolled(true)));
    return () => cancelAnimationFrame(id);
  }, [go]);

  return (
    <span className={`inline-flex tabular-nums ${className}`} style={style} role="img" aria-label={String(value)}>
      {String(value)
        .split('')
        .map((f, i) => {
          const n = Number(f);
          if (!Number.isInteger(n)) {
            return (
              <span key={i} aria-hidden="true">
                {f}
              </span>
            );
          }
          return (
            <span key={i} className="odo" aria-hidden="true">
              <span
                className="odo-strip"
                style={{
                  transform: `translateY(-${(rolled ? 10 + n : 0) * 5}%)`,
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                {RUN.map((d, j) => (
                  <span key={j}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
    </span>
  );
}
