import { useState } from 'react';
import Button from './Button.jsx';
import { signup, login } from '../lib/api.js';
import { decodeJwt, saveSession } from '../lib/session.js';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-3 outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';

export default function PasswordAuthForm({ onSignedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSignup = mode === 'signup';
  const canSubmit = email.trim() && password.length >= (isSignup ? 8 : 1) && (!isSignup || name.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token } = isSignup
        ? await signup({ name, email, password })
        : await login({ email, password });
      onSignedIn(saveSession({ idToken: token, profile: decodeJwt(token) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-[320px]">
      <div className="mb-4 flex rounded-full bg-[var(--color-cream-soft)] p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === 'login' ? 'bg-white shadow-sm font-medium' : 'text-[var(--color-muted)]'
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === 'signup' ? 'bg-white shadow-sm font-medium' : 'text-[var(--color-muted)]'
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isSignup && (
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? 'At least 8 characters' : undefined}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}
