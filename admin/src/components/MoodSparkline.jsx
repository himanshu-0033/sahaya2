import { moodLabel } from '../lib/moods.js';

export default function MoodSparkline({ history, height = 40, barWidth = 8 }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-[var(--color-muted)]">No check-ins yet</p>;
  }

  return (
    <div
      className="flex items-end gap-[2px]"
      style={{ height }}
      role="img"
      aria-label="Mood trend, most recent check-ins"
    >
      {history.map((entry) => {
        const score = entry.moodScore ?? entry.mood;
        const barHeight = Math.max(4, (score / 5) * height);
        return (
          <div
            key={entry.date}
            title={`${entry.date} — ${moodLabel(score)}`}
            className={entry.flagged ? 'bg-[var(--color-flag)]' : 'bg-[var(--color-teal)]'}
            style={{ width: barWidth, height: barHeight, borderRadius: '4px 4px 0 0' }}
          />
        );
      })}
    </div>
  );
}
