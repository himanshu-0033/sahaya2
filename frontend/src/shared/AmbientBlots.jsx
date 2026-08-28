import { INKBLOTS } from '../lib/inkblots.js';

export default function AmbientBlots() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
      style={{ filter: 'blur(32px)' }}
      aria-hidden="true"
    >
      <svg
        viewBox="-100 -100 200 200"
        className="animate-drift-a absolute -top-16 -right-24 w-72 h-72 opacity-[0.18]"
        style={{ mixBlendMode: 'screen' }}
      >
        <path d={INKBLOTS[0].path} fill="var(--color-teal)" />
        <path d={INKBLOTS[0].path} fill="var(--color-teal)" transform="scale(-1,1)" />
      </svg>
      <svg
        viewBox="-100 -100 200 200"
        className="animate-drift-c absolute -top-10 left-1/3 w-64 h-64 opacity-[0.16]"
        style={{ mixBlendMode: 'screen' }}
      >
        <path d={INKBLOTS[1].path} fill="var(--color-lavender)" />
        <path d={INKBLOTS[1].path} fill="var(--color-lavender)" transform="scale(-1,1)" />
      </svg>
      <svg
        viewBox="-100 -100 200 200"
        className="animate-drift-b absolute top-1/2 -left-28 w-80 h-80 opacity-[0.14]"
        style={{ mixBlendMode: 'screen' }}
      >
        <path d={INKBLOTS[1].path} fill="var(--color-amber)" />
        <path d={INKBLOTS[1].path} fill="var(--color-amber)" transform="scale(-1,1)" />
      </svg>
      <svg
        viewBox="-100 -100 200 200"
        className="animate-drift-a absolute -bottom-24 right-1/4 w-64 h-64 opacity-[0.12]"
        style={{ animationDelay: '-6s', mixBlendMode: 'screen' }}
      >
        <path d={INKBLOTS[2].path} fill="var(--color-flag)" />
        <path d={INKBLOTS[2].path} fill="var(--color-flag)" transform="scale(-1,1)" />
      </svg>
    </div>
  );
}
