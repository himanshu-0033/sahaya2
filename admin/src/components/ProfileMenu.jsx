import { useEffect, useRef, useState } from 'react';

// The signed-in counsellor, as an avatar in the top-right corner, with who they
// are and the way out behind it.
//
// The email and a sign-out button used to sit in the header in plain text. They
// took the width the navigation needed, and "Sign out" one careless click from
// the dashboard is a worse default than one menu away.
export default function ProfileMenu({ admin, onSignOut }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  // Closes on a click anywhere else, and on Escape, handing focus back to the
  // avatar so a keyboard user is not left stranded.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = admin?.name && admin.name !== admin.email ? admin.name : null;
  const initial = (name || admin?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${admin?.email || ''}`}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-[var(--surface-2)]"
      >
        <span className="relative">
          {admin?.picture ? (
            <img
              src={admin.picture}
              alt=""
              width={36}
              height={36}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-lavender-deep)] text-sm font-semibold text-white ring-2 ring-white">
              {initial}
            </span>
          )}
          {/* Signed in, and this console is live. */}
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#22a06b]" aria-hidden="true" />
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`text-[var(--color-ink-soft)] transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--line-2)] bg-white shadow-[0_24px_48px_-20px_rgba(0,0,0,0.35)]"
        >
          <div className="px-4 py-3.5">
            {name && <p className="truncate text-sm font-semibold">{name}</p>}
            <p className="truncate text-xs text-[var(--color-muted)]">{admin?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-[var(--color-lavender-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-lavender-deep)]">
              {admin?.superAdmin ? 'Super admin' : 'Counsellor'}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 border-t border-[var(--line-1)] px-4 py-3 text-left text-sm text-[var(--color-flag-deep)] transition-colors hover:bg-[var(--surface-1)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
