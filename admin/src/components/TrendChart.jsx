import { useRef, useState } from 'react';
import { formatDate } from '../lib/moods.js';

// Cohort check-in volume per day, as a filled line with a point on every day.
// Days with no check-ins sit on the floor of the chart rather than closing up,
// so a gap in participation stays visible.
//
// These bars used to carry a `title` attribute, which is a tooltip you have to
// hover and then wait for, and one a keyboard never reaches at all. Hovering or
// arrowing now moves the readout above the chart, and clicking a day selects
// it — which filters the caseload below to what happened that day.
//
// One tab stop, not fourteen: the day targets share a roving tabindex the way a
// toolbar does, so tabbing past the chart stays a single keypress.
//
// The line and its fill are drawn in an SVG stretched to the container with
// preserveAspectRatio="none", which would squash a circle — so the points and
// the hit targets are positioned over it in percentages instead, and the stroke
// is marked non-scaling so it stays 1.5px at every width.
const RANGES = [7, 14];

export default function TrendChart({ trend, selected, onSelect, height = 150 }) {
  const [cursor, setCursor] = useState(null);
  const [days, setDays] = useState(RANGES[RANGES.length - 1]);
  const targets = useRef([]);

  const shown = trend.slice(-days);
  const max = Math.max(1, ...shown.map((d) => d.checkIns));
  const selectedIndex = shown.findIndex((d) => d.date === selected);
  const activeIndex = cursor ?? (selectedIndex === -1 ? null : selectedIndex);
  const active = activeIndex == null ? null : shown[activeIndex];
  const total = shown.reduce((sum, d) => sum + d.checkIns, 0);

  // A point sitting exactly on 0% or 100% is half outside the plot, clipped by
  // the card's own edge. The series is inset by a point's width instead.
  const PAD = 3.5;
  const x = (i) =>
    shown.length === 1 ? 50 : PAD + (i / (shown.length - 1)) * (100 - 2 * PAD);
  const y = (v) => 100 - (v / max) * 92;
  const line = shown
    .map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(d.checkIns).toFixed(2)}`)
    .join(' ');

  function move(to) {
    const next = Math.max(0, Math.min(shown.length - 1, to));
    setCursor(next);
    targets.current[next]?.focus();
  }

  function handleKey(e) {
    const from = activeIndex ?? 0;
    if (e.key === 'ArrowRight') move(from + 1);
    else if (e.key === 'ArrowLeft') move(from - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(shown.length - 1);
    else return;
    e.preventDefault();
  }

  function pickRange(r) {
    setDays(r);
    setCursor(null);
    // A day outside the new window would go on filtering the caseload by
    // something the chart no longer shows.
    if (selected && !trend.slice(-r).some((d) => d.date === selected)) onSelect(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        {/* Visual only. Every day target carries the same facts in its
            aria-label, and a live region here would read them out twice. */}
        <p
          aria-hidden="true"
          className="flex min-h-[1.5rem] flex-wrap items-baseline gap-x-3 text-sm"
        >
          {active ? (
            <>
              <span>{formatDate(active.date)}</span>
              <span className="tabular-nums text-[var(--color-muted)]">
                {active.checkIns} check-in{active.checkIns === 1 ? '' : 's'}
              </span>
              {active.avgMood != null && (
                <span className="tabular-nums text-[var(--color-muted)]">
                  avg mood {active.avgMood}
                </span>
              )}
              {active.flagged > 0 && (
                <span className="tabular-nums text-[var(--color-flag)]">
                  {active.flagged} flagged
                </span>
              )}
            </>
          ) : (
            <span className="text-[var(--color-muted)]">
              <span className="tabular-nums text-[var(--color-ink-soft)]">{total}</span> check-ins
              over {shown.length} days — point at one, or arrow across
            </span>
          )}
        </p>

        <div className="flex gap-1 rounded-full bg-white/5 p-0.5 text-[11px]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pickRange(r)}
              aria-pressed={days === r}
              className={`cursor-pointer rounded-full px-2.5 py-1 tabular-nums transition-colors ${
                days === r
                  ? 'bg-[var(--color-lavender)] text-[#14121f]'
                  : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative mt-4"
        style={{ height }}
        onMouseLeave={() => setCursor(null)}
        onKeyDown={handleKey}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-teal)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--color-teal)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${100 - PAD} 100 L${PAD} 100 Z`} fill="url(#trend-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {shown.map((day, i) => {
          const isSelected = day.date === selected;
          const isActive = i === activeIndex;
          return (
            <button
              key={day.date}
              ref={(el) => (targets.current[i] = el)}
              type="button"
              tabIndex={i === (activeIndex ?? 0) ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={`${formatDate(day.date)}, ${day.checkIns} check-in${
                day.checkIns === 1 ? '' : 's'
              }${day.avgMood != null ? `, average mood ${day.avgMood}` : ''}${
                day.flagged ? `, ${day.flagged} flagged` : ''
              }`}
              onMouseEnter={() => setCursor(i)}
              onFocus={() => setCursor(i)}
              onBlur={() => setCursor(null)}
              onClick={() => onSelect(isSelected ? null : day.date)}
              className="absolute top-0 bottom-0 cursor-pointer rounded"
              style={{
                left: `${x(i)}%`,
                width: `${100 / shown.length}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {(isActive || isSelected) && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                  style={{
                    background: isSelected ? 'var(--color-lavender)' : 'rgba(255,255,255,0.16)',
                  }}
                />
              )}
              <span
                aria-hidden="true"
                className="absolute left-1/2 rounded-full"
                style={{
                  top: `${y(day.checkIns)}%`,
                  width: isActive || isSelected ? 9 : 5,
                  height: isActive || isSelected ? 9 : 5,
                  transform: 'translate(-50%, -50%)',
                  background: day.flagged > 0 ? 'var(--color-flag)' : 'var(--color-teal)',
                  boxShadow: isSelected ? '0 0 0 3px var(--color-lavender-soft)' : 'none',
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-muted)]">
        <span>{formatDate(shown[0]?.date)}</span>
        <span>{formatDate(shown[shown.length - 1]?.date)}</span>
      </div>
    </div>
  );
}
