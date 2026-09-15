// Two small visuals for the figures at the top of the dashboard.
//
// Both are decoration for a number that is already written next to them, so
// both are aria-hidden: a screen reader gets the figure and its hint, not a
// description of a shape. And both are drawn only where the series behind them
// is complete and means what the label says — a sparkline over a capped or
// partial list reads as a trend when it is really an artefact of the cap, which
// on this console would be a clinician misreading "risk is easing".

export function Spark({ values, tone = 'var(--color-teal)', width = 60, height = 26 }) {
  if (!values || values.length < 2) return null;

  const max = Math.max(1, ...values);
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - (v / max) * (height - 2) - 1,
  ]);
  const line = points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={tone} opacity="0.16" />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Ring({ value, max, tone = 'var(--color-lavender)', size = 34 }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <svg aria-hidden="true" width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-4)"
        strokeWidth="3"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={tone}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - share)}
      />
    </svg>
  );
}

// An identity mark for a row. The reference this came from used stock
// photographs; there is no avatar on a resident record, and a wall of faces on
// a triage list is not something a counsellor wants over their shoulder on a
// shared screen. Initials carry the same rhythm out of data that actually
// exists, and the tint is derived from the name so a person keeps the same one.
export function Monogram({ name, size = 36 }) {
  // String(), not a default parameter: a default covers undefined, and MongoDB
  // hands back a missing name as null. That crashed the whole dashboard the
  // first time a super admin could see accounts created without one.
  name = String(name || '');
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const hues = ['var(--color-teal)', 'var(--color-lavender)', 'var(--color-amber)'];
  const tone = hues[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % hues.length];

  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full text-xs font-medium"
      style={{
        width: size,
        height: size,
        color: tone,
        background: 'var(--surface-1)',
        border: `1px solid ${tone}`,
        borderColor: 'color-mix(in srgb, currentColor 35%, transparent)',
      }}
    >
      {initials || '·'}
    </span>
  );
}
