export default function StatCard({ label, value, hint, tone = 'default' }) {
  const toneClass =
    tone === 'flag'
      ? 'text-[var(--color-flag)]'
      : tone === 'teal'
        ? 'text-[var(--color-teal)]'
        : tone === 'lavender'
          ? 'text-[var(--color-lavender)]'
          : 'text-[var(--color-ink)]';

  return (
    <div className="card-soft rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</p>
      <p className={`font-display mt-2 text-3xl ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}
