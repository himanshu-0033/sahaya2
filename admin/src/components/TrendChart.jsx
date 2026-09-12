import { useRef, useState } from 'react';
import { formatDate } from '../lib/moods.js';

// Cohort check-in volume per day, tinted by whether that day flagged anyone.
// Days with no check-ins keep their slot, so a gap in participation stays
// visible rather than closing up.
//
// These bars used to carry a `title` attribute, which is a tooltip you have to
// hover and then wait for, and one a keyboard never reaches at all. Hovering or
// arrowing now moves the readout above the chart, and clicking a day selects
// it — which filters the caseload below to what happened that day.
//
// One tab stop, not fourteen: the bars share a roving tabindex the way a
// toolbar does, so tabbing past the chart stays one keypress.
export default function TrendChart({ trend, selected, onSelect, height = 132 }) {
  const [cursor, setCursor] = useState(null);
  const bars = useRef([]);

  const max = Math.max(1, ...trend.map((d) => d.checkIns));
  const selectedIndex = trend.findIndex((d) => d.date === selected);
  const activeIndex = cursor ?? (selectedIndex === -1 ? null : selectedIndex);
  const active = activeIndex == null ? null : trend[activeIndex];
  const total = trend.reduce((sum, d) => sum + d.checkIns, 0);

  function move(to) {
    const next = Math.max(0, Math.min(trend.length - 1, to));
    setCursor(next);
    bars.current[next]?.focus();
  }

  function handleKey(e) {
    const from = activeIndex ?? 0;
    if (e.key === 'ArrowRight') move(from + 1);
    else if (e.key === 'ArrowLeft') move(from - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(trend.length - 1);
    else return;
    e.preventDefault();
  }

  return (
    <div>
      {/* Visual only. Every bar carries the same facts in its aria-label, and
          a live region here would read them out a second time. */}
      <p aria-hidden="true" className="flex min-h-[1.5rem] flex-wrap items-baseline gap-x-3 text-sm">
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
            over {trend.length} days — point at a day, or arrow across
          </span>
        )}
      </p>

      <div
        className="mt-4 flex items-end gap-1.5"
        style={{ height }}
        onMouseLeave={() => setCursor(null)}
        onKeyDown={handleKey}
      >
        {trend.map((day, i) => {
          const isSelected = day.date === selected;
          const barHeight = day.checkIns === 0 ? 3 : Math.max(6, (day.checkIns / max) * height);
          return (
            <button
              key={day.date}
              ref={(el) => (bars.current[i] = el)}
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
              className="flex flex-1 cursor-pointer flex-col justify-end self-stretch rounded-md"
            >
              <span
                className="w-full rounded-t-md transition-opacity"
                style={{
                  height: barHeight,
                  // Dim the rest once a day is picked, so the filtered day is
                  // legible as the reason the list below changed.
                  opacity: selected && !isSelected ? 0.35 : 1,
                  background:
                    day.checkIns === 0
                      ? 'rgba(255,255,255,0.08)'
                      : day.flagged > 0
                        ? 'var(--color-flag)'
                        : 'var(--color-teal)',
                }}
              />
              <span
                aria-hidden="true"
                className="mt-1 h-[2px] w-full rounded-full"
                style={{ background: isSelected ? 'var(--color-lavender)' : 'transparent' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
