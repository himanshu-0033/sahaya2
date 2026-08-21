import { useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import { phoneLogin } from '../lib/api.js';
import { decodeJwt, saveSession } from '../lib/session.js';
import { COUNTRY_CODES } from '../lib/countryCodes.js';
import { loadPhoneAuth, phoneAuthConfigured, toE164 } from '../lib/firebase.js';

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// Firebase's error codes are aimed at developers; these are the ones a person
// signing in can actually do something about.
const MESSAGES = {
  'auth/invalid-phone-number': 'That does not look like a valid phone number.',
  'auth/missing-phone-number': 'Enter a phone number first.',
  'auth/quota-exceeded': 'Too many codes sent from this project today. Try again tomorrow.',
  'auth/too-many-requests': 'Too many attempts from this device. Wait a few minutes and try again.',
  'auth/invalid-verification-code': 'That code is not right. Check the SMS and try again.',
  'auth/code-expired': 'That code has expired. Send a new one.',
  'auth/captcha-check-failed': 'The robot check failed. Reload the page and try again.',
  'auth/operation-not-allowed': 'Phone sign-in is not switched on for this Firebase project yet.',
  'auth/unauthorized-domain': 'This domain is not on the Firebase authorized-domains list.',
};

function readableError(err) {
  return MESSAGES[err?.code] || err?.message || 'Something went wrong. Try again.';
}

export default function PhoneSignInButton({ onSignedIn, dark = false }) {
  // 'closed' -> 'number' -> 'code'
  const [step, setStep] = useState('closed');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [unconfigured, setUnconfigured] = useState(false);

  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);
  const confirmationRef = useRef(null);

  // The reCAPTCHA widget attaches to a real DOM node and refuses to render
  // into one it has already used, so it is torn down whenever this component
  // goes away or a send fails and has to be retried.
  function resetVerifier() {
    try {
      verifierRef.current?.clear();
    } catch {
      // Already cleared, or the node is gone — nothing to recover.
    }
    verifierRef.current = null;
  }

  useEffect(() => resetVerifier, []);

  function ensureVerifier(RecaptchaVerifier, auth) {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
    }
    return verifierRef.current;
  }

  async function sendCode(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { auth, RecaptchaVerifier, signInWithPhoneNumber } = await loadPhoneAuth();
      const verifier = ensureVerifier(RecaptchaVerifier, auth);
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        toE164(countryCode, phoneLocal),
        verifier,
      );
      setCode('');
      setStep('code');
    } catch (err) {
      // A spent challenge cannot be reused, so the next attempt needs a fresh one.
      resetVerifier();
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const credential = await confirmationRef.current.confirm(code.trim());
      // Firebase has proven the number; our backend turns that into a Sahay
      // session so the rest of the app keeps seeing one kind of token.
      const firebaseToken = await credential.user.getIdToken();
      const { token } = await phoneLogin({ firebaseToken });
      onSignedIn(saveSession({ idToken: token, profile: decodeJwt(token) }));
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  function leave(nextStep) {
    resetVerifier();
    setError(null);
    setStep(nextStep);
  }

  const inputClass = dark
    ? 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/40 focus:ring-2 focus:ring-white/10'
    : 'w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const selectClass = dark
    ? 'rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-sm text-white outline-none focus:border-white/40'
    : 'rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-[var(--color-teal)]';
  const labelClass = `text-[10px] uppercase tracking-wider ${dark ? 'text-white/40' : 'text-[var(--color-muted)]'}`;
  const quietClass = dark ? 'text-white/45 hover:text-white/75' : 'text-[var(--color-muted)]';

  if (step === 'closed') {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => (phoneAuthConfigured ? setStep('number') : setUnconfigured(true))}
          className={
            dark
              ? 'flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10'
              : 'flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-ink)]/15 bg-white py-3 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-colors hover:bg-[var(--color-cream-soft)]'
          }
        >
          <PhoneIcon />
          Continue with phone number
        </button>
        {unconfigured && (
          <p
            className={`mt-2 text-center text-xs ${dark ? 'text-white/50' : 'text-[var(--color-muted)]'}`}
          >
            Phone sign-in is being set up — use Google for now.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {step === 'number' ? (
        <form onSubmit={sendCode} className="space-y-2.5">
          <div>
            <label className={labelClass}>Phone number</label>
            <div className="mt-1 flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={selectClass}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="text-black">
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                autoFocus
                type="tel"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value)}
                placeholder="98765 43210"
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}
          <Button
            type="submit"
            size="compact"
            disabled={busy || phoneLocal.replace(/\D/g, '').length < 6}
          >
            {busy ? 'Sending code…' : 'Send code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={confirmCode} className="space-y-2.5">
          <div>
            <label className={labelClass}>Enter the 6-digit code</label>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`mt-1 tracking-[0.4em] ${inputClass}`}
            />
            <p className={`mt-1.5 text-xs ${dark ? 'text-white/35' : 'text-[var(--color-muted)]'}`}>
              Sent to {toE164(countryCode, phoneLocal)}
            </p>
          </div>
          {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}
          <Button type="submit" size="compact" disabled={busy || code.replace(/\D/g, '').length < 6}>
            {busy ? 'Verifying…' : 'Verify and continue'}
          </Button>
          <button
            type="button"
            onClick={() => leave('number')}
            className={`w-full text-center text-xs underline underline-offset-4 ${quietClass}`}
          >
            Use a different number
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => leave('closed')}
        className={`mt-2 w-full text-center text-xs ${quietClass}`}
      >
        Cancel
      </button>

      {/* The invisible reCAPTCHA needs a stable node to mount into. */}
      <div ref={recaptchaRef} />
    </div>
  );
}
