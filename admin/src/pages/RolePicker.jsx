import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import { setRole } from '../lib/api.js';

// Asked once, on someone's first sign-in to the admin panel: are they a
// counsellor or a manager? It decides what they see. A counsellor gets their own
// students; a manager gets counsellor performance and no individual student. The
// super admin is never asked.
const CHOICES = [
  {
    role: 'counsellor',
    title: 'Counsellor',
    body: 'I follow up with students. I will see the students assigned to me or who invited me: their check-ins, flags and risk screens.',
    icon: (
      <>
        <path d="M4 5h16v11H9l-5 4Z" />
        <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth="2.6" />
      </>
    ),
  },
  {
    role: 'manager',
    title: 'Manager',
    body: "I oversee the counsellors. I will see how each counsellor's caseload is doing, and not individual students.",
    icon: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
  },
];

export default function RolePicker({ admin, onChosen, onSignOut }) {
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  function choose(role) {
    setSaving(role);
    setError(null);
    setRole(role)
      .then((res) => onChosen(res.role))
      .catch((err) => {
        setError(err.message);
        setSaving(null);
      });
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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-16">
        <p className="inline-block self-start rounded-full border border-[var(--line-3)] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
          One question before your dashboard
        </p>
        <h1 className="font-display mt-6 text-[2.4rem] leading-[1.1] sm:text-[3rem]" style={{ textWrap: 'balance' }}>
          Welcome{admin?.name && admin.name !== admin.email ? `, ${admin.name.split(' ')[0]}` : ''}. What is your role?
        </h1>
        <p className="mt-3 text-[0.9375rem] text-[var(--color-ink-soft)]">
          This decides what your dashboard shows, and how the super admin sees you on the team.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CHOICES.map((c) => (
            <button
              key={c.role}
              type="button"
              onClick={() => choose(c.role)}
              disabled={Boolean(saving)}
              className="group flex flex-col rounded-3xl border border-[var(--line-2)] bg-white p-6 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#1f4d47] hover:shadow-[0_18px_40px_-24px_rgba(31,77,71,0.55)] disabled:opacity-60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3efeb] text-[#1f4d47]">
                <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
              </span>
              <span className="font-display mt-5 text-2xl">{c.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{c.body}</span>
              <span className="mt-5 text-sm font-semibold text-[#1f4d47]">
                {saving === c.role ? 'Saving…' : `I am a ${c.title.toLowerCase()} →`}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm text-[var(--color-flag-deep)]">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
