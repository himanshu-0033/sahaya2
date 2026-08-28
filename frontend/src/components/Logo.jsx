import { useId } from 'react';

// The mark: a head in profile, drawn as a circuit.
//
// A face and a network in the same lines, which is the whole claim of the
// product — the app is a machine, and the thing it is pointed at is a person.
// The spiral sits where a mind would be and stays open rather than winding to
// a point; a tight spiral silts into a dot below about 24px.
//
// Drawn to survive 16px. The reference artwork is much finer than this — many
// more nodes, a second inner contour, a longer tail off the chin — and at
// header size all of that collapses into a green smudge. So the parts that
// carry the idea are kept at full size (profile, skull, spiral, four nodes)
// and the filigree is dropped, rather than shrinking everything evenly until
// none of it reads.
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
// `from`/`to` default to the green the mark has always been, so every existing
// caller is untouched. The landing page overrides them: the mark is otherwise
// the only green object on a pink page, which reads as a foreign object rather
// than a logo.
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
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={glow ? `url(#${glowId})` : undefined}
      >
        {/* The skull: forehead, over the crown, down the back to the jaw. */}
        <path d="M36 20 C56 10, 79 22, 81 45 C83 64, 71 76, 62 80" />

        {/* The face, front edge, top down: forehead, brow, the nose out to
            the left, the mouth, then the chin turning back into the jaw. */}
        <path d="M36 20 C26 29, 22 41, 26 47 C28 51, 19 57, 17 62 C16 65, 22 66, 25 66 C26 70, 24 72, 27 74 C30 76, 35 76, 37 81 C44 85, 55 84, 62 80" />

        {/* The mind, an open spiral high in the skull. Ends short of closing —
            the gap is what stops it reading as a solid disc when it is small. */}
        <path d="M74 41 C74 32, 62 29, 57 37 C52 46, 60 55, 67 51 C71 49, 71 44, 68 43" />
      </g>

      {/* Nodes, on the lines rather than beside them. Filled, so they hold at
          sizes where a stroked ring closes up into a blob. */}
      <g fill={`url(#${gradientId})`} filter={glow ? `url(#${glowId})` : undefined}>
        <circle cx="36" cy="20" r="4.5" />
        <circle cx="81" cy="45" r="4" />
        <circle cx="57" cy="37" r="4" />
        <circle cx="25" cy="66" r="3.5" />
      </g>
    </svg>
  );
}
