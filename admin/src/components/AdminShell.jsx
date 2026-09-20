import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import ProfileMenu from './ProfileMenu.jsx';

// What each role's navigation holds. A manager has one page: counsellor
// performance. A counsellor has their dashboard and their students. The super
// admin has everything.
function navFor(admin) {
  if (admin?.role === 'manager') return [{ to: '/', label: 'Counsellor performance', end: true }];
  const items = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/residents', label: 'Students' },
  ];
  if (admin?.superAdmin) {
    items.push({ to: '/enquiries', label: 'Enquiries' }, { to: '/team', label: 'Team', badge: admin.pendingRequests });
  }
  return items;
}

export default function AdminShell({ admin, onSignOut, children }) {
  const items = navFor(admin);
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
                Admin panel
              </p>
            </div>
          </div>

          {/* Scrolls sideways when it does not fit rather than pushing the
              page wider than the screen. Four tabs at this size come to 379px
              and the header's content box on a 390px phone is 342, so the
              console opened with a horizontal scrollbar and every page under
              it 28px too wide. The header already wraps; it was the pill
              itself that could not give. */}
          <nav
            aria-label="Console"
            className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--line-1)] bg-[var(--surface-1)] p-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-[#fde4d6] font-medium text-[var(--color-ink)] shadow-[inset_0_0_0_1px_rgba(214,120,78,0.35)]'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                  }`
                }
              >
                {item.label}
                {/* Access requests waiting, so they are seen from any page. */}
                {item.badge > 0 && (
                  <>
                    <span aria-hidden="true" className="ml-1.5 inline-flex min-w-5 justify-center rounded-full bg-[#c2410c] px-1.5 text-[11px] font-semibold leading-5 text-white">
                      {item.badge}
                    </span>
                    <span className="sr-only">, {item.badge} waiting for approval</span>
                  </>
                )}
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
