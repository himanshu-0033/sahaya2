export const MOOD_OPTIONS = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Bright' },
];

export function moodLabel(score) {
  return MOOD_OPTIONS.find((m) => m.value === score)?.label || '—';
}

// Warm for low mood, teal for steady-and-up — matches the resident app's
// flag colour so "orange means look closer" reads the same in both windows.
export function moodColor(score) {
  if (score <= 2) return 'var(--color-flag)';
  if (score === 3) return 'var(--color-amber)';
  return 'var(--color-teal)';
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then) / (24 * 60 * 60 * 1000));
}
