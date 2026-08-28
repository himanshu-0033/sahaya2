import { useEffect, useRef, useState } from 'react';
import { BOUNDS, CORE, RIBBONS, TAIL } from '../../shared/sculpturePaths.js';

// The SVG rendering of the sculpture: flat, but crisp at any size and free
// of a WebGL context. GlassSculpture uses it as its fallback, and the paths
// themselves live in lib/sculpturePaths.js so both stay the same shape.
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


// Follows the cursor with a little lag. The tilt is applied to a wrapper
// *around* the spinning layer: a JS transform on the animated element itself
// would be clobbered by the CSS keyframes, whereas nesting lets the two
// transforms compose.
function usePointerTilt(enabled) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Coarse pointers (touch) have no hover position to follow.
    if (window.matchMedia?.('(pointer: coarse)').matches) return;

    function onMove(e) {
      // rAF-throttled: mousemove fires far more often than we can paint.
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 .. 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        setTilt({ x: nx, y: ny });
      });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame.current);
    };
  }, [enabled]);

  return tilt;
}

// The viewBox reserves space below the sculpture for its reflection, so the
// rendered box is taller than it is wide.
const VB = BOUNDS;
const VIEW_BOX = `${VB.x} ${VB.y} ${VB.w} ${VB.h}`;

// Gradients live in one hidden SVG so both rotation planes can reference them
// without duplicating ids into the document.
function Defs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
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
    </svg>
  );
}

function Plane({ rotateY = 0 }) {
  return (
    <div
      className="absolute inset-0"
      style={{ transform: rotateY ? `rotateY(${rotateY}deg)` : undefined }}
    >
      <svg viewBox={VIEW_BOX} width="100%" height="100%">
        <g style={{ filter: 'drop-shadow(0 0 30px rgba(63,215,201,0.4))' }}>
          <Sculpture />
        </g>

        {/* Mirrored about y=115 and vertically compressed, the way a
            reflection foreshortens on a glossy floor. The mask sits on an
            outer group so its coordinates stay in untransformed user space —
            SVG resolves mask after an element's own transform. */}
        <g mask="url(#m-reflect)">
          <g transform="translate(0,161) scale(1,-0.4)" opacity="0.5">
            <Sculpture />
          </g>
        </g>
      </svg>
    </div>
  );
}

// `spin` turns continuously through a full circle; without it the piece just
// sways. Width comes from the parent — the box keeps the viewBox aspect.
export default function Inkblot3D({ className = '', spin = false, interactive = false }) {
  const tilt = usePointerTilt(interactive);

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <Defs />

      <div
        className="animate-glow-pulse absolute left-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          top: '37%',
          height: '62%',
          background:
            'radial-gradient(closest-side, rgba(80,210,200,0.3), rgba(255,138,61,0.16), transparent)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0" style={{ perspective: '1600px' }}>
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translate3d(${tilt.x * -14}px, ${tilt.y * -10}px, 0) rotateY(${
              tilt.x * 16
            }deg) rotateX(${tilt.y * -12}deg)`,
            // Long ease so the piece drifts after the cursor instead of snapping.
            transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div
            className={`absolute inset-0 ${spin ? 'animate-spin-3d-full' : 'animate-spin-3d'}`}
            style={{ transformStyle: 'preserve-3d' }}
            role="img"
            aria-label="A slowly turning glass sculpture with mirrored, ink-blot-like symmetry"
          >
            <Plane />
            {spin && <Plane rotateY={90} />}
          </div>
        </div>
      </div>
    </div>
  );
}
