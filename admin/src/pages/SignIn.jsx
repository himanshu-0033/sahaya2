import { useState } from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import Logo from '../components/Logo.jsx';
import { login } from '../lib/api.js';
import { decodeJwt, saveSession } from '../lib/session.js';

// The door to the admin panel.
//
// Built to the same shape as the resident app's landing page, a name set large
// beside a photograph, but for the other side of the app: it says what the
// console is for and who can see what, and the sign-in form sits on the picture
// from the first frame rather than behind a button, because signing in is the
// only thing anyone arrives here to do. On a phone the form comes first.

const DEEP = '#1f4d47';

const PREVIEW = [
  { label: 'Needs a conversation', value: '3', tone: { background: DEEP, color: '#fff' } },
  { label: 'Risk screens', value: '1', tone: { background: '#fff', color: '#c2410c' } },
  { label: 'Checked in today', value: '11', tone: { background: '#fff', color: 'var(--color-ink)' } },
];

export default function SignIn({ onSignedIn, notice }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token } = await login({ identifier, password });
      onSignedIn(saveSession({ idToken: token, profile: decodeJwt(token) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        <Logo size={34} glow={false} />
        <div>
          <p className="font-display text-xl leading-none">DP Sahay AI</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Admin panel
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-4 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-10">
        {/* ─────────────────────────────── what the console is for */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-3">
            <Logo size={52} glow={false} />
            <p className="inline-block rounded-full border border-[var(--line-3)] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
              Staff only
            </p>
          </div>
          <h1 className="font-display mt-6 text-[3.4rem] leading-[0.95] tracking-[-0.02em] sm:text-[4.75rem]" style={{ color: DEEP }}>
            DP Sahay
            <span className="ml-2 align-top font-sans text-[0.22em] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-lavender-deep)' }}>
              Admin panel
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-[1.25rem] leading-snug text-[var(--color-ink)]">
            Know who needs a conversation today, before they have to ask for one.
          </p>
          <p className="mt-4 flex max-w-lg gap-2.5 text-[0.9375rem] leading-relaxed text-[var(--color-ink-soft)]">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={DEEP} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.6 7.5 9.5 4.3-.9 7.5-4.9 7.5-9.5V6Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>
              <strong className="font-semibold" style={{ color: DEEP }}>
                Everyone sees their own students
              </strong>
              : the ones assigned to them or who invited them, and the super admin sees all of them.
              Risk screens come first, and every export is logged.
            </span>
          </p>

          {/* A picture of the first screen after signing in, so the page says
              what it opens onto. aria-hidden: these are not anyone's figures. */}
          <div aria-hidden="true" className="mt-9 grid max-w-lg grid-cols-3 gap-2.5">
            {PREVIEW.map((p) => (
              <div
                key={p.label}
                className="rounded-2xl border border-[var(--line-1)] px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.4)]"
                style={{ background: p.tone.background }}
              >
                <p className="text-[9px] font-semibold uppercase leading-snug tracking-[0.12em]" style={{ color: p.tone.color, opacity: 0.8 }}>
                  {p.label}
                </p>
                <p className="font-display mt-2 text-2xl leading-none" style={{ color: p.tone.color }}>
                  {p.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-[var(--color-muted)]">
            <span>Allowlisted accounts only</span>
            <span aria-hidden="true">·</span>
            <span>Every export logged</span>
            <span aria-hidden="true">·</span>
            <span>Flags are a nudge, not a diagnosis</span>
          </p>
        </section>

        {/* ─────────────────────────────── the photograph, with the door on it */}
        <section className="animate-fade-up relative order-first lg:order-none">
          <div className="absolute inset-0 hidden overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgba(31,77,71,0.6)] lg:block">
            <img src="/photos/hero.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,77,71,0.45)] to-transparent" />
          </div>

          <div className="relative mx-auto w-full max-w-md py-0 lg:py-14">
            <div className="rounded-3xl border border-[var(--line-1)] bg-white/95 p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
              <h2 className="font-display text-[1.75rem] leading-tight">Sign in to the admin panel</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Use the account your admin panel access is registered under.
              </p>

              {notice && (
                <p role="alert" className="mt-5 rounded-xl bg-[var(--color-flag-soft)] px-4 py-3 text-sm text-[var(--color-flag-deep)]">
                  {notice}
                </p>
              )}

              <div className="mt-6">
                <GoogleSignInButton onSignedIn={onSignedIn} />
              </div>

              <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                <span className="h-px flex-1 bg-[var(--surface-3)]" />
                or
                <span className="h-px flex-1 bg-[var(--surface-3)]" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Email or phone</span>
                  <input
                    className="input-soft w-full"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Password</span>
                  <input
                    className="input-soft w-full"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>

                {error && (
                  <p role="alert" className="text-sm text-[var(--color-flag-deep)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !identifier.trim() || !password}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: DEEP }}
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                  {!submitting && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </form>

              <p className="mt-5 text-xs leading-relaxed text-[var(--color-muted)]">
                Being on the allowlist opens the admin panel. On your first sign-in you choose
                counsellor or manager. You see the students assigned to you or who invited you;
                the super admin sees everyone.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
