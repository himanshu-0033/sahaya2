import { bandColor } from '../lib/bands.js';

// The score as a drawn arc. The ring is the instrument's own range, so a 12
// on the GAD-7 (of 21) and a 12 on the AUDIT-C (of 12) read differently at a
// glance — which is the point.
export default function ScoreRing({ score, maxScore, band, size = 190, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = maxScore > 0 ? Math.min(Math.max(score / maxScore, 0), 1) : 0;
  const color = bandColor(band);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[var(--color-ink)]/8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="animate-draw-ring"
          style={{ '--ring-circumference': circumference }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl leading-none" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-xs text-[var(--color-muted)]">of {maxScore}</span>
      </div>
    </div>
  );
}
