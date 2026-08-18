const BLOT_PATH =
  'M0,-110 C-20,-112 -35,-95 -38,-75 C-42,-50 -60,-45 -70,-25 C-82,0 -65,10 -75,30 C-88,52 -70,65 -55,80 C-40,95 -45,105 -20,110 C-8,113 -3,112 0,112 Z';

function Face({ gradientId, stops, backfaceRotate = 0 }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backfaceVisibility: 'hidden',
        transform: backfaceRotate ? `rotateY(${backfaceRotate}deg)` : undefined,
      }}
    >
      <svg viewBox="-120 -120 240 240" width="100%" height="100%">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          <radialGradient id={`${gradientId}-sheen`} cx="35%" cy="30%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g style={{ filter: 'drop-shadow(0 18px 30px rgba(23,36,43,0.25))' }}>
          <path d={BLOT_PATH} fill={`url(#${gradientId})`} />
          <path d={BLOT_PATH} fill={`url(#${gradientId})`} transform="scale(-1,1)" />
        </g>
        <g style={{ mixBlendMode: 'screen' }}>
          <path d={BLOT_PATH} fill={`url(#${gradientId}-sheen)`} />
          <path d={BLOT_PATH} fill={`url(#${gradientId}-sheen)`} transform="scale(-1,1)" />
        </g>
      </svg>
    </div>
  );
}

export default function Inkblot3D({ size = 200 }) {
  return (
    <div className="relative mx-auto flex justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-x-0 bottom-2 mx-auto animate-glow-pulse rounded-full"
        style={{
          width: size * 0.8,
          height: size * 0.25,
          background: 'radial-gradient(closest-side, var(--color-teal-soft), transparent)',
          filter: 'blur(18px)',
        }}
        aria-hidden="true"
      />
      <div style={{ perspective: '1200px', width: size, height: size }}>
        <div
          className="animate-spin-3d relative"
          style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
          role="img"
          aria-label="A slowly turning, glass-like symmetrical ink blot"
        >
          <Face
            gradientId="blot-front"
            stops={[
              { offset: '0%', color: 'var(--color-teal)' },
              { offset: '55%', color: 'var(--color-lavender)' },
              { offset: '100%', color: 'var(--color-amber)' },
            ]}
          />
          <Face
            gradientId="blot-back"
            backfaceRotate={180}
            stops={[
              { offset: '0%', color: 'var(--color-amber)' },
              { offset: '55%', color: 'var(--color-flag)' },
              { offset: '100%', color: 'var(--color-lavender)' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
