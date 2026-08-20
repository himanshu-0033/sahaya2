import { useState } from 'react';
import Button from './Button.jsx';
import { signup, login } from '../lib/api.js';
import { decodeJwt, saveSession } from '../lib/session.js';
import { COUNTRY_CODES } from '../lib/countryCodes.js';

export default function PasswordAuthForm({ onSignedIn, dark = false }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSignup = mode === 'signup';
  const canSubmit = isSignup
    ? name.trim() && email.trim() && password.length >= 8
    : identifier.trim() && password.length > 0;

  const inputClass = dark
    ? 'mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/40 focus:ring-2 focus:ring-white/10'
    : 'mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const labelClass = `text-[10px] uppercase tracking-wider ${dark ? 'text-white/40' : 'text-[var(--color-muted)]'}`;

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
        className={`mb-3 flex rounded-full p-1 text-sm ${dark ? 'bg-white/5' : 'bg-[var(--color-cream-soft)]'}`}
      >
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-full py-1.5 transition-colors ${
            mode === 'login'
              ? dark
                ? 'bg-white/15 font-medium text-white'
                : 'bg-white shadow-sm font-medium'
              : dark
                ? 'text-white/40'
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
                ? 'bg-white/15 font-medium text-white'
                : 'bg-white shadow-sm font-medium'
              : dark
                ? 'text-white/40'
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
                        ? 'rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-sm text-white outline-none focus:border-white/40'
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
                  dark ? 'text-white/45 hover:text-white/70' : 'text-[var(--color-muted)]'
                }`}
              >
                + Add phone number (optional)
              </button>
            )}
          </>
        ) : (
          <div>
            <label className={labelClass}>Email or phone number</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or 98765 43210"
              className={inputClass}
            />
          </div>
        )}

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

        {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

        <Button type="submit" size="compact" disabled={!canSubmit || submitting}>
          {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}
