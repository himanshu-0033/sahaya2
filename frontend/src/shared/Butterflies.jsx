import { useMemo } from 'react';

// The butterflies on the sign-in screen.
//
// This is the first thing anyone sees, and the screen it decorates is one
// people arrive at while not feeling good. So the brief was calm, not cute:
// slow enough that nothing pulls your eye off the sign-in button, faint enough
// to read as atmosphere rather than as animation, and never crossing the copy
// at full strength.
//
// How each one is built, outward from the middle:
//
//   drift  — an outer element carrying the butterfly across the screen, 26 to
//            52 seconds for a full pass. Anything faster reads as busy.
//   bob    — an inner element doing the vertical wander and tilt, on a
//            different period from the drift so the two never sync up into an
//            obvious loop.
//   flap   — the wings themselves, scaled about the body axis.
//
// Three nested elements rather than one, because each stage needs its own
// `transform` and they would otherwise overwrite each other.
//
// Everything animates transform and opacity only, so it stays on the
// compositor and costs no layout. The field is `aria-hidden` and
// `pointer-events-none`: it is decoration, and it must never eat a click meant
// for the form behind it.
//
// Reduced motion is handled in index.css, where the whole field is hidden
// rather than frozen — a scatter of butterflies stopped mid-air looks like a
// bug, and the screen reads perfectly well without them.

// Deliberately desaturated versions of the section hues. At full saturation
// against a near-black ground these looked like confetti.
const WING_HUES = [
  'rgba(143, 214, 180, 0.55)', // green, the reading hue
  'rgba(167, 156, 240, 0.50)', // lilac, calm
  'rgba(224, 163, 213, 0.42)', // pink, paths
  'rgba(217, 165, 92, 0.40)', // amber, inkblot
  'rgba(255, 255, 255, 0.34)', // plain light, for depth
];

// One butterfly. `scale` is applied to the SVG rather than to a wrapper so the
// stroke weight of the antennae scales with it and the small ones do not end
// up with disproportionately heavy wire.
function Butterfly({ hue, size, flapSeconds }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-26 -24 52 48"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Right pair. The upper wing carries most of the silhouette; the
          lower one is smaller and set back, which is what stops the shape
          reading as a bow tie. */}
      <g className="bf-wing bf-wing-r" style={{ animationDuration: `${flapSeconds}s` }}>
        <path d="M0,-7 C6,-19 19,-21 22,-14 C24,-7 14,-3 0,-1 Z" fill={hue} />
        <path d="M0,0 C11,-1 18,4 16,10 C14,16 5,13 0,5 Z" fill={hue} opacity="0.8" />
      </g>

      <g className="bf-wing bf-wing-l" style={{ animationDuration: `${flapSeconds}s` }}>
        <path d="M0,-7 C6,-19 19,-21 22,-14 C24,-7 14,-3 0,-1 Z" fill={hue} />
        <path d="M0,0 C11,-1 18,4 16,10 C14,16 5,13 0,5 Z" fill={hue} opacity="0.8" />
      </g>

      {/* Body and antennae last, so they sit over the wings at the fold. */}
      <ellipse cx="0" cy="-1" rx="1.5" ry="9" fill={hue} opacity="0.9" />
      <path
        d="M-0.8,-9 C-2.5,-14 -5,-16.5 -7.5,-17.5 M0.8,-9 C2.5,-14 5,-16.5 7.5,-17.5"
        stroke={hue}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

// A deterministic scatter.
//
// Math.random() here would re-roll on every render and make the butterflies
// jump; seeding from the index gives an arrangement that looks unplanned but
// is stable for the life of the page. The multipliers are just co-prime-ish
// numbers chosen so the four properties do not fall into step with each other.
function fieldOf(count) {
  return Array.from({ length: count }, (_, i) => {
    const spread = (n, mod) => ((i * n) % mod) / mod;
    const depth = spread(7, 11); // 0 = far away, 1 = near

    return {
      key: i,
      hue: WING_HUES[i % WING_HUES.length],
      // Far ones are smaller, fainter and slower. Depth used to include a
      // real `filter: blur()` on the distant ones, which looked slightly
      // better and cost about a third of the frame budget on a throttled
      // CPU — a blurred element has to be re-rastered on every frame it
      // moves, where a plain transform does not. Size and opacity carry the
      // depth on their own for free.
      size: 17 + depth * 20,
      opacity: 0.26 + depth * 0.46,
      top: 6 + spread(23, 29) * 82, // vh
      driftSeconds: 52 - depth * 26,
      bobSeconds: 5 + spread(13, 17) * 5,
      flapSeconds: 0.62 + spread(11, 13) * 0.5,
      // Negative delays start each one part-way through its pass, so the
      // screen is already populated on arrival instead of filling up.
      delay: -spread(19, 23) * 52,
    };
  });
}

export default function Butterflies({ count = 10 }) {
  const field = useMemo(() => fieldOf(count), [count]);

  return (
    <div className="bf-field pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {field.map((b) => (
        <div
          key={b.key}
          className="bf-drift"
          style={{
            top: `${b.top}vh`,
            opacity: b.opacity,
            animationDuration: `${b.driftSeconds}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <div
            className="bf-bob"
            style={{ animationDuration: `${b.bobSeconds}s`, animationDelay: `${b.delay / 3}s` }}
          >
            <Butterfly hue={b.hue} size={b.size} flapSeconds={b.flapSeconds} />
          </div>
        </div>
      ))}
    </div>
  );
}

// The single large one.
//
// The ambient field is texture — you notice it without looking at it. This is
// the one that is actually a butterfly: big enough to read as a shape, slow
// enough to follow, and on a long path so it is a thing that happens rather
// than a thing that loops.
export function FeatureButterfly({ className = '' }) {
  return (
    <div
      className={`bf-field pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="bf-drift bf-drift-feature" style={{ top: '26vh' }}>
        <div className="bf-bob" style={{ animationDuration: '9s' }}>
          <Butterfly hue="rgba(143, 214, 180, 0.66)" size={78} flapSeconds={1.25} />
        </div>
      </div>
    </div>
  );
}
