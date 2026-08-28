// Which end of a scale is the good end differs per instrument — 100 on the
// WHO-5 is a good fortnight, 27 on the PHQ-9 is not — so the backend sends
// `band.index`, `band.count` and `band.higherIsBetter` and the UI never tries
// to infer tone from the number itself.

// 0 = the reassuring end of this instrument's ladder, 1 = the concerning end.
export function bandSeverity(band) {
  if (!band || !band.count || band.count < 2) return 0;
  const position = band.index / (band.count - 1);
  return band.higherIsBetter ? 1 - position : position;
}

// Three steps rather than a continuous ramp: a questionnaire result does not
// have the precision to justify a gradient, and three colours stay legible.
export function bandColor(band) {
  const severity = bandSeverity(band);
  if (severity < 0.34) return 'var(--color-teal-dark)';
  if (severity < 0.67) return 'var(--color-amber)';
  return 'var(--color-flag)';
}

export function bandTint(band) {
  const severity = bandSeverity(band);
  if (severity < 0.34) return 'var(--color-teal-soft)';
  if (severity < 0.67) return 'rgba(217, 165, 92, 0.14)';
  return 'var(--color-flag-soft)';
}

// A change is only worth showing if it moved. Direction is reported in the
// instrument's own terms: "better" means toward that scale's good end.
export function describeChange(current, previous, higherIsBetter) {
  if (!previous || typeof previous.score !== 'number') return null;
  const delta = Math.round((current - previous.score) * 100) / 100;
  if (delta === 0) return { delta: 0, label: 'No change', tone: 'flat' };
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return {
    delta,
    label: `${delta > 0 ? '+' : ''}${delta}`,
    tone: improved ? 'better' : 'worse',
  };
}

export function formatWhen(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
