import { useId } from 'react';

// The mark: a wave breaking under an arch.
//
// Inline SVG rather than an <img> to /favicon.svg, for two reasons. It paints
// in the same frame as the rest of the masthead — an <img> logo arrives a beat
// late and the header visibly reflows around it — and the glow can be dropped
// for anyone who has asked for reduced motion or is on a low-power screen
// without shipping a second file.
//
// `useId` for the gradient and filter ids: two of these on one page (the
// header and the sign-in hero) would otherwise both define `#arch`, and the
// second definition wins in every browser, so one of them silently loses its
// gradient.
export default function Logo({ size = 30, glow = true, className }) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `sahay-arch-${uid}`;
  const glowId = `sahay-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 124 96"
      width={size * (124 / 96)}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label="Sahay"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7f9d8" />
          <stop offset="100%" stopColor="#5cbe8c" />
        </linearGradient>
        {glow && (
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* The arch. Its left leg stops where the wave crosses it and the right
            runs to the baseline — the asymmetry is what keeps it from reading
            as a plain croquet hoop. */}
        <path
          d="M56 70 V44 a22 22 0 0 1 44 0 V86"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          filter={glow ? `url(#${glowId})` : undefined}
        />
        {/* The wave, in front: two low swells, then a crest that breaks right
            and hooks back under itself inside the arch. The hook stays open —
            a tighter spiral silts up into a dot at favicon size. */}
        <path
          d="M8 70 C16 56, 30 52, 40 63 C47 71, 55 71, 62 61 C70 49, 74 37, 85 41 C97 45, 95 63, 80 60 C72 58, 69 51, 73 46"
          stroke="#4fa37d"
          strokeWidth="8"
        />
      </g>
    </svg>
  );
}
