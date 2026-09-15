import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import ProfileMenu from './ProfileMenu.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/residents', label: 'Residents' },
  { to: '/enquiries', label: 'Enquiries' },
];

export default function AdminShell({ admin, onSignOut, children }) {
  const items = admin?.superAdmin ? [...navItems, { to: '/team', label: 'Team' }] : navItems;
  return (
    <div className="min-h-screen">
      {/* First stop for the keyboard, so a counsellor is not walked through
          the wordmark, the nav and the sign-out button on every page before
          reaching the thing they came to read. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-[var(--line-1)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5">
          {/* The mark and the name, the same as the resident app, so a
              counsellor moving between the two windows reads one product. */}
          <div className="mr-auto flex items-center gap-3">
            <Logo size={34} glow={false} />
            <div>
              <p className="font-display text-xl leading-none">DP Sahay AI</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Admin console
              </p>
            </div>
          </div>

          <nav aria-label="Console" className="flex items-center gap-1 rounded-full border border-[var(--line-1)] bg-[var(--surface-1)] p-1 text-sm">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[#fde4d6] font-medium text-[var(--color-ink)] shadow-[inset_0_0_0_1px_rgba(214,120,78,0.35)]'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Who is signed in lives behind the avatar, top right, and nowhere else. */}
          <ProfileMenu admin={admin} onSignOut={onSignOut} />
        </div>
      </header>

      {/* tabIndex={-1} so the skip link's hash can put focus here without
          adding another stop to the tab order. */}
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-6 py-8 focus:outline-none">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-[var(--color-muted)]">
        Flags are a rule-based nudge to start a conversation, not a diagnosis, and not a substitute
        for talking to the person.
      </footer>
    </div>
  );
}
