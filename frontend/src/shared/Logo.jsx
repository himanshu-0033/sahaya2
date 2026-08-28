import { useId } from 'react';

// The mark: a head in profile, drawn as a circuit.
//
// A face and a network in the same lines, which is the whole claim of the
// product — the app is a machine, and the thing it is pointed at is a person.
//
// Drawn to the reference artwork rather than to a simplified version of it:
// the hair sweep and the inner contour both present, the spiral wound properly
// inward, the tail off the chin, and nine nodes on the lines instead of four.
// An earlier pass dropped that filigree so the mark would survive a 16px
// browser tab. It survives, but it stopped being the logo.
//
// The favicon carries the same geometry at a heavier stroke, which is the
// right place to make that trade — a tab icon is seen at one size and this is
// seen at five.
//
// Inline SVG rather than an <img> to /favicon.svg, for two reasons. It paints
// in the same frame as the rest of the masthead — an <img> logo arrives a beat
// late and the header visibly reflows around it — and the glow can be dropped
// for anyone who has asked for reduced motion or is on a low-power screen
// without shipping a second file.
//
// `useId` for the gradient and filter ids: two of these on one page (the
// header and the sign-in hero) would otherwise both define `#head`, and the
// second definition wins in every browser, so one of them silently loses its
// gradient.
//
// `from`/`to` default to the green the mark has always been, so every existing
// caller is untouched. The landing page overrides them: the mark is otherwise
// the only green object on a pink page, which reads as a foreign object rather
// than a logo.

// The lines, in draw order. Kept out of the component so the favicon and any
// future still can be generated from the same source rather than a copy that
// drifts.
const STROKES = [
  // The hair: forehead, over the crown, down the back of the head.
  'M40 15 C59 5, 80 16, 83 38 C86 58, 77 72, 66 78',
  // The inner contour, running parallel inside it.
  'M45 21 C61 15, 75 25, 77 43 C78 57, 72 66, 64 71',
  // The face: forehead, brow, the nose out to the left, mouth, chin.
  'M40 15 C30 24, 25 35, 28 43 C29 46, 21 52, 19 58 C18 61, 24 62, 27 62 C28 66, 25 68, 29 70 C32 72, 36 72, 38 77',
  // Jaw, and the tail that runs off it to the right.
  'M38 77 C43 83, 52 85, 60 82',
  // The drop line off the back of the head.
  'M75 63 C80 73, 77 84, 70 87',
  // The mind: a spiral wound inward, two turns.
  'M79 34 C79 22, 62 17, 54 28 C46 39, 55 53, 66 49 C74 46, 75 37, 68 35 C63 34, 60 39, 63 43',
];

const NODES = [
  [40, 15, 3.4],
  [83, 38, 3.2],
  [54, 28, 3.0],
  [66, 49, 3.0],
  [77, 43, 2.6],
  [27, 62, 2.8],
  [38, 77, 3.0],
  [60, 82, 3.2],
  [70, 87, 2.8],
];

export default function Logo({ size = 30, glow = true, className, from = '#7df3b4', to = '#2fb87c' }) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `sahay-head-${uid}`;
  const glowId = `sahay-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label="DP Sahay AI"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        {glow && (
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? `url(#${glowId})` : undefined}>
        <g
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {STROKES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Nodes filled rather than stroked: a ring this small closes into a
            blob anyway, and a filled dot is the same shape done deliberately. */}
        <g fill={`url(#${gradientId})`}>
          {NODES.map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </g>
    </svg>
  );
}
