import { useState } from 'react';
import Button from './Button.jsx';
import { COUNTRY_CODES } from '../lib/countryCodes.js';

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
  const [values, setValues] = useState({
    name,
    email,
    countryCode: '+91',
    phoneLocal: '',
    dob: '',
  });

  const inputClass = dark
    ? 'input-soft mt-1 w-full rounded-xl border border-[var(--line-3)] bg-[var(--surface-2)] px-4 py-3 text-white outline-none transition-colors placeholder:text-[var(--ink-placeholder)] focus:border-[var(--line-6)] focus:ring-2 focus:ring-white/10'
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
          <label className={labelClass}>Full name</label>
          <input
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email address</label>
          <input
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone number</label>
          <div className="mt-1 flex gap-2">
            <select
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
              value={values.phoneLocal}
              onChange={(e) => set('phoneLocal', e.target.value)}
              placeholder="98765 43210"
              className={`${inputClass} mt-0`}
            />
          </div>
          <p className={hintClass}>
            Only used to sign you in if you ever lose access to this account.
          </p>
        </div>

        <div>
          <label className={labelClass}>Date of birth</label>
          <input
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
          Nobody sees your check-ins but you. If you later want a counsellor to
          follow along, you invite them yourself from your account — and you can
          stop sharing at any time.
        </p>

        {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Complete profile'}
        </Button>
      </form>
    </div>
  );
}
