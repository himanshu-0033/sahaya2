import { useState } from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { login } from '../lib/api.js';
import { decodeJwt, saveSession } from '../lib/session.js';

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
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card-soft animate-fade-up w-full max-w-md rounded-3xl p-8">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl">DP Sahay AI</h1>
          <span className="rounded-full bg-[var(--color-lavender-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--color-lavender)]">
            Counsellor
          </span>
        </div>
        <h2 className="font-display mt-6 text-3xl">Admin console</h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Sign in with the account your counsellor access is registered under. Residents'
          check-in data is only visible to accounts on the allowlist.
        </p>

        {notice && (
          <p className="mt-5 rounded-xl bg-[var(--color-flag-soft)] px-4 py-3 text-sm text-[var(--color-flag)]">
            {notice}
          </p>
        )}

        <div className="mt-6">
          <GoogleSignInButton onSignedIn={onSignedIn} />
        </div>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Email or phone
            </span>
            <input
              className="input-soft w-full"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Password
            </span>
            <input
              className="input-soft w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !identifier.trim() || !password}
            className="mt-2 rounded-xl bg-[var(--color-lavender)] px-4 py-2.5 text-sm font-medium text-[#14121f] transition-opacity disabled:opacity-40"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
