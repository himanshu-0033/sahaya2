import { useId, useState } from 'react';
import Button from '../../shared/Button.jsx';
import { COUNTRY_CODES } from '../../shared/countryCodes.js';
import { EMAIL_MESSAGE, PHONE_MESSAGE, digitsOnly, isValidEmail, isValidPhone } from '../../shared/contact.js';

// The account form asks for four things, and each one has to earn its place.
//
// It used to ask for six: home address and occupation were in here too. Both
// were write-only — collected at signup, never used by anything, and shown
// back only in the counsellor console and the CSV export. Asking a person in
// a bad week where they live, before they have seen the app do anything, is
// the kind of thing that gets an app closed and not reopened. They are gone.
//
// What survives, and why it is here rather than on the same list:
//   name  — what the app calls you
//   email — the account itself
//   phone — the login identity for a phone-verified account
//   dob   — age changes what should be shown to someone (a suicide-risk
//           screen is not the right thing to hand a fourteen-year-old)
//
// Every remaining field says why it is being asked, on screen, next to the
// field. If a field cannot carry that sentence, it should not be here.
export default function AccountForm({ name, email, onDone, saving, error, dark = false }) {
  // A <label> sitting above an input is a caption, not a label: a screen reader
  // announces the field as blank and tapping the words does not focus it.
  // useId rather than fixed strings, so a second copy of this form on the same
  // page does not point both labels at the first field.
  const fieldId = useId();
  const [values, setValues] = useState({
    name,
    email,
    countryCode: '+91',
    phoneLocal: '',
    dob: '',
  });
  // Caught here, before anything is sent. The server checks the same rules.
  const [localError, setLocalError] = useState(null);

  const inputClass = dark
    ? 'input-soft mt-1 w-full rounded-xl border border-[var(--line-3)] bg-[var(--surface-2)] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/50 focus:border-[var(--line-6)] focus:ring-2 focus:ring-white/10'
    : 'input-soft mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-3 outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const labelClass = `text-xs uppercase tracking-wide ${dark ? 'text-white/55' : 'text-[var(--color-muted)]'}`;
  const hintClass = `mt-1.5 text-xs leading-relaxed ${dark ? 'text-white/50' : 'text-[var(--color-muted)]'}`;

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { countryCode, phoneLocal, ...rest } = values;
    const phone = phoneLocal.trim() ? `${countryCode} ${phoneLocal.trim()}` : '';
    if (!isValidEmail(rest.email)) return setLocalError(EMAIL_MESSAGE);
    if (phone && !isValidPhone(phone)) return setLocalError(PHONE_MESSAGE);
    setLocalError(null);
    onDone({ ...rest, phone });
  }

  return (
    <div className="mt-8 animate-fade-up">
      <h2 className={`font-display text-3xl md:text-4xl leading-tight text-center ${dark ? 'text-white' : ''}`}>
        Let's get to know you a bit better.
      </h2>

      <form
        className={`mt-8 space-y-5 rounded-3xl p-6 md:p-8 ${
          dark ? 'border border-[var(--line-2)] bg-[var(--surface-2)] backdrop-blur' : 'card-soft'
        }`}
        onSubmit={handleSubmit}
      >
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-name`}>Full name</label>
          <input
            id={`${fieldId}-name`}
            autoComplete="name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${fieldId}-email`}>Email address</label>
          <input
            id={`${fieldId}-email`}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value.trim())}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`${fieldId}-phone`}>Phone number</label>
          <div className="mt-1 flex gap-2">
            <select
              aria-label="Country calling code"
              value={values.countryCode}
              onChange={(e) => set('countryCode', e.target.value)}
              className={
                dark
                  ? 'input-soft rounded-xl border border-[var(--line-3)] bg-[var(--surface-2)] px-2 py-3 text-sm text-white outline-none focus:border-[var(--line-6)]'
                  : 'input-soft rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-2 py-3 text-sm outline-none focus:border-[var(--color-teal)]'
              }
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code} className="text-black">
                  {c.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={values.phoneLocal}
              onChange={(e) => set('phoneLocal', digitsOnly(e.target.value, values.countryCode === '+91' ? 10 : 15))}
              placeholder="9876543210"
              className={`${inputClass} mt-0`}
            />
          </div>
          <p className={hintClass}>
            Only used to sign you in if you ever lose access to this account.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor={`${fieldId}-dob`}>Date of birth</label>
          <input
            id={`${fieldId}-dob`}
            type="date"
            value={values.dob}
            onChange={(e) => set('dob', e.target.value)}
            className={`input-soft ${inputClass}`}
          />
          <p className={hintClass}>
            So the app knows which questionnaires are appropriate to offer you.
          </p>
        </div>

        <p className={`text-xs leading-relaxed ${dark ? 'text-white/55' : 'text-[var(--color-muted)]'}`}>
          Your institution&apos;s administrator can see your check-ins and assign
          you a counsellor, who can see them too. Anyone else sees them only if
          you invite them from your account.
        </p>

        {(localError || error) && (
          <p role="alert" className={`text-sm ${dark ? 'text-[var(--color-flag)]' : 'text-[var(--color-flag-deep)]'}`}>
            {localError || error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Complete profile'}
        </Button>
      </form>
    </div>
  );
}
