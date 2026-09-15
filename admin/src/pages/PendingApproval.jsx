import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import { ROLE_LABEL } from '../lib/roles.js';

// Shown after someone asks to join the admin panel, until the super admin
// approves them. Nothing with data behind it is reachable from here: the server
// refuses a pending account on every such endpoint, so this is the whole panel
// for them until the answer comes.
export default function PendingApproval({ admin, onRecheck, onChangeRole, onSignOut }) {
  const [checking, setChecking] = useState(false);
  const [stillWaiting, setStillWaiting] = useState(false);

  function recheck() {
    setChecking(true);
    setStillWaiting(false);
    Promise.resolve(onRecheck())
      .then((status) => setStillWaiting(status === 'pending'))
      .finally(() => setChecking(false));
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Logo size={34} glow={false} />
          <div>
            <p className="font-display text-xl leading-none">DP Sahay AI</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">Admin panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-[var(--line-4)] px-4 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e3efeb] text-[#1f4d47]">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h1 className="font-display mt-6 text-[2.2rem] leading-tight" role="status">
          Request sent
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--color-ink-soft)]">
          You asked to join the admin panel as a{' '}
          <strong className="font-semibold text-[var(--color-ink)]">{ROLE_LABEL[admin.role]?.toLowerCase() || 'member of staff'}</strong>. The super admin
          will review it. Once they approve you, your dashboard opens here.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Signed in as {admin.email}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={recheck}
            disabled={checking}
            className="rounded-full bg-[#1f4d47] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check again'}
          </button>
          <button
            type="button"
            onClick={onChangeRole}
            className="rounded-full border border-[var(--line-4)] px-6 py-2.5 text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--surface-2)]"
          >
            Change my role
          </button>
        </div>
        {stillWaiting && (
          <p className="mt-4 text-sm text-[var(--color-muted)]" role="status">
            Not approved yet. Try again in a little while.
          </p>
        )}
      </main>
    </div>
  );
}
