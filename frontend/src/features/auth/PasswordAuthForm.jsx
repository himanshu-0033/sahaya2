import { useId, useState } from 'react';
import Button from '../../shared/Button.jsx';
import { signup, login, requestPasswordReset } from '../../shared/api.js';
import { decodeJwt, saveSession } from './session.js';
import { COUNTRY_CODES } from '../../shared/countryCodes.js';
import { EMAIL_MESSAGE, PHONE_MESSAGE, digitsOnly, isValidEmail, isValidPhone } from '../../shared/contact.js';

export default function PasswordAuthForm({ onSignedIn }) {
  // A <label> that only sits above an input is a caption, not a label: a
  // screen reader announces the field as blank, and tapping the words does not
  // focus it. useId rather than fixed strings because this form is rendered in
  // more than one place on the landing page, and duplicate ids would point
  // every label at whichever field mounted first.
  const fieldId = useId();
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

  const inputClass =
    'mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const labelClass = 'text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)]';
  const tabClass = (active) =>
    `flex-1 rounded-full py-1.5 transition-colors ${active ? 'bg-white shadow-sm font-medium' : 'text-[var(--color-muted)]'}`;

  function switchMode(next) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    // Caught here, before anything is sent. The server checks the same rules.
    if (isSignup && !isValidEmail(email)) return setError(EMAIL_MESSAGE);
    if (isSignup && phoneLocal.trim() && !isValidPhone(`${countryCode} ${phoneLocal}`)) return setError(PHONE_MESSAGE);
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
      <div className="mb-3 flex rounded-full bg-[var(--color-cream-soft)] p-1 text-sm">
        <button type="button" onClick={() => switchMode('login')} aria-pressed={mode === 'login'} className={tabClass(mode === 'login')}>
          Log in
        </button>
        <button type="button" onClick={() => switchMode('signup')} aria-pressed={isSignup} className={tabClass(isSignup)}>
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {isSignup ? (
          <>
            <div>
              <label className={labelClass} htmlFor={`${fieldId}-name`}>Name</label>
              <input id={`${fieldId}-name`} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${fieldId}-email`}>Email</label>
              <input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            {/* Optional, so it stays collapsed until asked for — keeps the
                signup form short enough to fit without scrolling. */}
            {showPhone ? (
              <div>
                <label className={labelClass} htmlFor={`${fieldId}-phone`}>Phone number (optional)</label>
                <div className="mt-1 flex gap-2">
                  <select
                    aria-label="Country calling code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-[var(--color-teal)]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id={`${fieldId}-phone`}
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(digitsOnly(e.target.value, countryCode === '+91' ? 10 : 15))}
                    placeholder="9876543210"
                    className={`${inputClass} mt-0`}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhone(true)}
                className="text-xs text-[var(--color-muted)] underline underline-offset-4"
              >
                + Add phone number (optional)
              </button>
            )}
          </>
        ) : (
          <div>
            <label className={labelClass} htmlFor={`${fieldId}-identifier`}>Email</label>
            <input
              id={`${fieldId}-identifier`}
              type="email"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        )}

        {!isForgot && (
          <div>
            <label className={labelClass} htmlFor={`${fieldId}-password`}>Password</label>
            <input
              id={`${fieldId}-password`}
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : undefined}
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-[var(--color-flag-deep)]">
            {error}
          </p>
        )}

        {/* The server will not say whether the address has an account, so this
            is the whole of the answer either way. */}
        {sent && (
          <p className="text-sm text-[var(--color-ink-soft)]" role="status">
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
            className="block text-xs text-[var(--color-muted)] underline underline-offset-2 hover:text-[var(--color-ink)]"
          >
            {isForgot ? 'Back to log in' : 'Forgot your password?'}
          </button>
        )}
      </form>
    </div>
  );
}
