import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../shared/Button.jsx';
import { resetPassword } from '../../shared/api.js';
import { decodeJwt, saveSession } from './session.js';

// Where a reset link lands.
//
// The token lives in the query string because that is what an email client can
// carry, and it is spent the moment this form is submitted — the server marks
// it used and invalidates every other pending link for the account.
//
// On success the server returns a session, so this signs the person straight
// in rather than sending them back to a login form to type the password they
// set four seconds ago. The redirect is a full navigation rather than a
// client-side one, because the session is read at boot and the whole app needs
// to come up knowing about it.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && confirm === password && Boolean(token);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token: sessionToken } = await resetPassword({ token, password });
      saveSession({ idToken: sessionToken, profile: decodeJwt(sessionToken) });
      window.location.assign('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <p className="marginalia">Your account</p>
      <h1 className="font-display mt-2 text-3xl leading-tight">Choose a new password.</h1>

      {!token ? (
        <p className="mt-6 text-sm text-[var(--color-flag-deep)]" role="alert">
          This link is missing its token. Ask for a new one from the sign-in screen.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <div>
            <label className="text-[0.6875rem] tracking-wider text-[var(--color-muted)] uppercase">
              New password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]"
            />
          </div>

          <div>
            <label className="text-[0.6875rem] tracking-wider text-[var(--color-muted)] uppercase">
              Repeat it
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]"
            />
          </div>

          {/* Said while they type rather than after they submit — a rule you
              find out about by failing is a rule stated too late. */}
          {tooShort && (
            <p className="text-sm text-[var(--color-flag-deep)]">Eight characters or more, please.</p>
          )}
          {mismatch && (
            <p className="text-sm text-[var(--color-flag-deep)]">These two do not match yet.</p>
          )}
          {error && (
            <p className="text-sm text-[var(--color-flag-deep)]" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="compact" disabled={!canSubmit || submitting}>
            {submitting ? 'Setting it…' : 'Set password and sign in'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-xs leading-relaxed text-[var(--color-muted)]">
        Reset links last thirty minutes and work once. If this one has expired, ask for another from
        the sign-in screen.
      </p>
    </main>
  );
}
