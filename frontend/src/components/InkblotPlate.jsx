import { useId } from 'react';

// A plate.
//
// The shape is drawn once and mirrored across the vertical axis, which is what
// makes it read as an inkblot rather than as a blob — real Rorschach plates
// get their symmetry from folding wet paper in half.
//
// Two details do most of the work of making it look like ink rather than a
// flat sticker: a gradient so the fill has a light source, and a small blur
// pushed back out through a contrast curve, which bleeds the edge slightly the
// way ink bleeds into paper instead of cutting it with a vector edge. The
// filter is cheap — one blur on a shape with no children — and degrades to a
// plain hard-edged fill if a browser refuses it.
//
// `useId` rather than a module counter: two plates on one page (the intro
// screen shows a preview while the test shows the live one) must not share a
// gradient id, and React 18 guarantees these are unique and stable across
// hydration.
export default function InkblotPlate({ path, size = 220 }) {
  const id = useId().replace(/:/g, '');
  const gradientId = `blot-fill-${id}`;
  const filterId = `blot-ink-${id}`;

  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Abstract ink blot shape"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#e8e4dc" stopOpacity="0.86" />
          <stop offset="100%" stopColor="#b9b4ab" stopOpacity="0.8" />
        </linearGradient>

        {/* Blur, then steepen the alpha curve. Blurring alone would just make
            the whole shape hazy; pushing the result back through a steep
            transfer function keeps the body solid and leaves the softness at
            the boundary, which is where ink actually feathers. */}
        <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="1.4" result="soft" />
          <feComponentTransfer in="soft">
            <feFuncA type="linear" slope="2.6" intercept="-0.18" />
          </feComponentTransfer>
        </filter>
      </defs>

      <g filter={`url(#${filterId})`}>
        <path d={path} fill={`url(#${gradientId})`} />
        <path d={path} fill={`url(#${gradientId})`} transform="scale(-1,1)" />
      </g>
    </svg>
  );
}
