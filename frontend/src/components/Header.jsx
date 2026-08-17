import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Sahay AI</h1>
        <p className="text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase mt-1">
          Daily Check-in
        </p>
      </div>
      <Link
        to="/caregiver"
        className="text-sm text-[var(--color-teal)] underline underline-offset-4 decoration-[var(--color-teal-soft)] hover:text-[var(--color-teal-dark)]"
      >
        Caregiver
      </Link>
    </div>
  );
}
