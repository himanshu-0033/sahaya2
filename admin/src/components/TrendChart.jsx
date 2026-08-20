// Cohort check-in volume per day, tinted by that day's average mood. Days with
// no check-ins show as an empty slot so gaps in participation stay visible.
export default function TrendChart({ trend, height = 120 }) {
  const max = Math.max(1, ...trend.map((d) => d.checkIns));

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {trend.map((day) => {
        const barHeight = day.checkIns === 0 ? 3 : Math.max(6, (day.checkIns / max) * height);
        const label = `${day.date} — ${day.checkIns} check-in${day.checkIns === 1 ? '' : 's'}${
          day.avgMood ? `, avg mood ${day.avgMood}` : ''
        }${day.flagged ? `, ${day.flagged} flagged` : ''}`;
        return (
          <div key={day.date} className="group relative flex-1" title={label}>
            <div
              className="w-full rounded-t-md transition-opacity group-hover:opacity-80"
              style={{
                height: barHeight,
                background:
                  day.checkIns === 0
                    ? 'rgba(255,255,255,0.08)'
                    : day.flagged > 0
                      ? 'var(--color-flag)'
                      : 'var(--color-teal)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
