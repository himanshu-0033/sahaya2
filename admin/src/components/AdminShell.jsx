import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/residents', label: 'Residents' },
];

export default function AdminShell({ admin, onSignOut, children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/8 bg-[var(--color-cream)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="mr-auto">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl">Sahay</h1>
              <span className="rounded-full bg-[var(--color-lavender-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--color-lavender)]">
                Counsellor
              </span>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Admin console
            </p>
          </div>

          <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[var(--color-lavender)] text-[#14121f]'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--color-muted)] sm:inline">{admin?.email}</span>
            <button
              onClick={onSignOut}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-white/30 hover:text-[var(--color-ink)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-[var(--color-muted)]">
        Flags are a rule-based nudge to start a conversation — not a diagnosis, and not a
        substitute for talking to the person.
      </footer>
    </div>
  );
}
