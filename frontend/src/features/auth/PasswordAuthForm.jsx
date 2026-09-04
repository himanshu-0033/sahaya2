import { useState } from 'react';
import Button from '../../shared/Button.jsx';
import { signup, login, requestPasswordReset } from '../../shared/api.js';
import { decodeJwt, saveSession } from './session.js';
import { COUNTRY_CODES } from '../../shared/countryCodes.js';

export default function PasswordAuthForm({ onSignedIn, dark = false }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Set once the reset request has been answered. The server says the same
  // thing whatever the address was, so this is a message rather than a result.
  const [sent, setSent] = useState(null);

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const canSubmit = isSignup
    ? name.trim() && email.trim() && password.length >= 8
    : isForgot
      ? identifier.trim().length > 0
      : identifier.trim() && password.length > 0;

  const inputClass = dark
    ? 'mt-1 w-full rounded-xl border border-[var(--line-3)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[var(--ink-placeholder)] focus:border-[var(--line-6)] focus:ring-2 focus:ring-white/10'
    : 'mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const labelClass = `text-[0.6875rem] uppercase tracking-wider ${dark ? 'text-white/55' : 'text-[var(--color-muted)]'}`;

  function switchMode(next) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isForgot) {
        const { message } = await requestPasswordReset({ email: identifier });
        setSent(message);
        return;
      }

      const { token } = isSignup
        ? await signup({
            name,
            email,
            phone: phoneLocal.trim() ? `${countryCode} ${phoneLocal.trim()}` : '',
            password,
          })
        : await login({ identifier, password });
      onSignedIn(saveSession({ idToken: token, profile: decodeJwt(token) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div
        className={`mb-3 flex rounded-full p-1 text-sm ${dark ? 'bg-[var(--surface-2)]' : 'bg-[var(--color-cream-soft)]'}`}
      >
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-full py-1.5 transition-colors ${
            mode === 'login'
              ? dark
                ? 'bg-[var(--surface-5)] font-medium text-white'
                : 'bg-white shadow-sm font-medium'
              : dark
                ? 'text-white/55'
                : 'text-[var(--color-muted)]'
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`flex-1 rounded-full py-1.5 transition-colors ${
            mode === 'signup'
              ? dark
                ? 'bg-[var(--surface-5)] font-medium text-white'
                : 'bg-white shadow-sm font-medium'
              : dark
                ? 'text-white/55'
                : 'text-[var(--color-muted)]'
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {isSignup ? (
          <>
            <div>
              <label className={labelClass}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            {/* Optional, so it stays collapsed until asked for — keeps the
                signup form short enough to fit without scrolling. */}
            {showPhone ? (
              <div>
                <label className={labelClass}>Phone number (optional)</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className={
                      dark
                        ? 'rounded-xl border border-[var(--line-3)] bg-[var(--surface-2)] px-2 py-2.5 text-sm text-white outline-none focus:border-[var(--line-6)]'
                        : 'rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-[var(--color-teal)]'
                    }
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="text-black">
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    autoFocus
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder="98765 43210"
                    className={`${inputClass} mt-0`}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhone(true)}
                className={`text-xs underline underline-offset-4 ${
                  dark ? 'text-white/60 hover:text-white/70' : 'text-[var(--color-muted)]'
                }`}
              >
                + Add phone number (optional)
              </button>
            )}
          </>
        ) : (
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        )}

        {!isForgot && (
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : undefined}
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p className={`text-sm ${dark ? 'text-[var(--color-flag)]' : 'text-[var(--color-flag-deep)]'}`}>
            {error}
          </p>
        )}

        {/* The server will not say whether the address has an account, so this
            is the whole of the answer either way. */}
        {sent && (
          <p className={`text-sm ${dark ? 'text-white/70' : 'text-[var(--color-ink-soft)]'}`} role="status">
            {sent}
          </p>
        )}

        <Button type="submit" size="compact" disabled={!canSubmit || submitting}>
          {submitting
            ? 'Please wait…'
            : isSignup
              ? 'Create account'
              : isForgot
                ? 'Send reset link'
                : 'Log in'}
        </Button>

        {!isSignup && (
          <button
            type="button"
            onClick={() => {
              setMode(isForgot ? 'login' : 'forgot');
              setError(null);
              setSent(null);
            }}
            className={`block text-xs underline underline-offset-2 ${
              dark ? 'text-white/55 hover:text-white/80' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {isForgot ? 'Back to log in' : 'Forgot your password?'}
          </button>
        )}
      </form>
    </div>
  );
}
