// A symmetrical glass sculpture. Every path draws the LEFT half only and is
// mirrored to complete the form, the way a folded ink blot is made.
//
// The wing masses are hollow: each path pairs an outer contour with an inner
// one and fills with `evenodd`, so the middle punches out into negative space.
// That ring structure — rather than solid lobes — is what reads as blown glass.
const RIBBONS = [
  // upper wing, hollow
  {
    d:
      'M-8,-20 C-40,-58 -86,-79 -106,-62 C-120,-50 -109,-19 -81,-1 C-52,15 -20,9 -8,-8 Z ' +
      'M-17,-18 C-43,-46 -77,-62 -93,-52 C-101,-44 -93,-23 -70,-9 C-48,4 -25,1 -17,-10 Z',
    fill: 'url(#g-glass)',
    o: 0.62,
  },
  // inner upper wing, hollow, warmer
  {
    d:
      'M-10,-14 C-32,-40 -62,-56 -76,-45 C-85,-37 -77,-18 -57,-6 C-38,5 -18,3 -10,-6 Z ' +
      'M-17,-13 C-35,-32 -57,-44 -67,-37 C-73,-31 -66,-18 -50,-9 C-36,-1 -22,-2 -17,-8 Z',
    fill: 'url(#g-warm)',
    o: 0.55,
  },
  // lower wing, hollow
  {
    d:
      'M-8,6 C-34,20 -68,45 -76,70 C-82,88 -63,92 -44,75 C-23,56 -9,30 -6,11 Z ' +
      'M-13,17 C-33,31 -57,51 -63,67 C-67,79 -57,81 -44,66 C-30,50 -17,29 -13,17 Z',
    fill: 'url(#g-cool)',
    o: 0.6,
  },
  // small hollow ring nested deep in the upper wing
  {
    d:
      'M-14,-12 C-28,-30 -48,-42 -58,-34 C-65,-28 -58,-14 -43,-5 C-30,3 -17,1 -14,-5 Z ' +
      'M-20,-12 C-31,-25 -45,-33 -51,-28 C-56,-24 -50,-14 -39,-8 C-30,-3 -22,-4 -20,-8 Z',
    fill: 'url(#g-cool)',
    o: 0.5,
  },
  // small hollow ring in the lower wing
  {
    d:
      'M-10,14 C-26,26 -45,45 -50,61 C-54,74 -42,76 -30,62 C-17,47 -8,28 -7,17 Z ' +
      'M-14,24 C-27,34 -41,50 -44,60 C-47,68 -40,69 -32,59 C-23,48 -15,32 -14,24 Z',
    fill: 'url(#g-warm)',
    o: 0.5,
  },
  // outer hook curling off the wing tip
  {
    d: 'M-96,-56 C-110,-64 -118,-52 -112,-40 C-107,-30 -96,-28 -92,-36 C-96,-38 -102,-44 -100,-50 C-99,-54 -97,-55 -96,-56 Z',
    fill: 'url(#g-cool)',
    o: 0.7,
  },
  // top spike
  {
    d: 'M-4,-40 C-10,-62 -19,-84 -31,-104 C-26,-79 -16,-56 -10,-40 C-8,-34 -6,-34 -4,-40 Z',
    fill: 'url(#g-cool)',
    o: 0.8,
  },
  // thin strand crossing the wing
  {
    d: 'M-12,-24 C-40,-40 -70,-52 -92,-56 C-72,-46 -44,-30 -20,-16 C-14,-13 -11,-19 -12,-24 Z',
    fill: 'url(#g-glass)',
    o: 0.5,
  },
];

const CORE = 'M0,-52 C-8,-30 -12,-4 -10,22 C-8,48 -3,66 0,80 Z';
const TAIL = 'M0,66 C-7,76 -11,90 -7,101 C-3,108 0,109 0,111 Z';

function Sculpture() {
  return (
    <g>
      <ellipse cx="0" cy="-8" rx="86" ry="52" fill="url(#g-bloom)" opacity="0.6" />

      {RIBBONS.map((r, i) => (
        <g key={i}>
          {[1, -1].map((s) => (
            <g key={s} transform={s === -1 ? 'scale(-1,1)' : undefined}>
              <path d={r.d} fill={r.fill} fillRule="evenodd" opacity={r.o} />
              <path d={r.d} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.75" />
            </g>
          ))}
        </g>
      ))}

      <g style={{ mixBlendMode: 'screen' }}>
        {[1, -1].map((s) => (
          <g key={s} transform={s === -1 ? 'scale(-1,1)' : undefined}>
            <path d={CORE} fill="url(#g-core)" />
            <path d={TAIL} fill="url(#g-core)" opacity="0.85" />
          </g>
        ))}
      </g>

      {[1, -1].map((s) => (
        <path
          key={s}
          d={CORE}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="0.8"
          transform={s === -1 ? 'scale(-1,1)' : undefined}
        />
      ))}
    </g>
  );
}

// The viewBox reserves space below the sculpture for its reflection, so the
// rendered box is taller than it is wide.
const VB = { x: -124, y: -112, w: 248, h: 300 };

export default function Inkblot3D({ size = 240 }) {
  const height = (size * VB.h) / VB.w;

  return (
    <div className="relative mx-auto" style={{ width: size, height }}>
      <div
        className="animate-glow-pulse absolute inset-x-0 mx-auto -translate-y-1/2 rounded-full"
        style={{
          top: '37%',
          width: size,
          height: size * 0.62,
          background:
            'radial-gradient(closest-side, rgba(80,210,200,0.3), rgba(255,138,61,0.16), transparent)',
          filter: 'blur(36px)',
        }}
        aria-hidden="true"
      />

      <div style={{ perspective: '1400px', width: size, height }}>
        <div
          className="animate-spin-3d"
          style={{ width: size, height, transformStyle: 'preserve-3d' }}
          role="img"
          aria-label="A slowly turning glass sculpture with mirrored, ink-blot-like symmetry"
        >
          <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} width="100%" height="100%">
            <defs>
              <linearGradient id="g-glass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eafcfa" stopOpacity="0.72" />
                <stop offset="50%" stopColor="#6fd3cc" stopOpacity="0.36" />
                <stop offset="100%" stopColor="#07222a" stopOpacity="0.68" />
              </linearGradient>
              <linearGradient id="g-cool" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f7ee" stopOpacity="0.88" />
                <stop offset="60%" stopColor="#2aa39c" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#06222b" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="g-warm" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffb070" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#e0452a" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1d0a0e" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="g-core" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c8faff" />
                <stop offset="32%" stopColor="#3fd7c9" />
                <stop offset="66%" stopColor="#ff8a3d" />
                <stop offset="100%" stopColor="#c9310f" />
              </linearGradient>
              <radialGradient id="g-bloom" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.45" />
                <stop offset="45%" stopColor="#2fb7ae" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="g-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id="m-reflect">
                <rect x={VB.x} y="116" width={VB.w} height="74" fill="url(#g-fade)" />
              </mask>
            </defs>

            <g style={{ filter: 'drop-shadow(0 0 30px rgba(63,215,201,0.4))' }}>
              <Sculpture />
            </g>

            {/* Mirrored about y=115 and vertically compressed, the way a
                reflection foreshortens on a glossy floor. The mask sits on an
                outer group so its coordinates stay in untransformed user
                space — SVG resolves mask after an element's own transform. */}
            <g mask="url(#m-reflect)">
              <g transform="translate(0,161) scale(1,-0.4)" opacity="0.5">
                <Sculpture />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
