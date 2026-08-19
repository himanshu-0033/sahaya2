import { useState } from 'react';
import Button from './Button.jsx';
import { COUNTRY_CODES } from '../lib/countryCodes.js';

export default function AccountForm({ name, email, onDone, saving, error, dark = false }) {
  const [values, setValues] = useState({
    name,
    email,
    countryCode: '+91',
    phoneLocal: '',
    dob: '',
    address: '',
    occupation: '',
  });

  const inputClass = dark
    ? 'input-soft mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/40 focus:ring-2 focus:ring-white/10'
    : 'input-soft mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-3 outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';
  const labelClass = `text-xs uppercase tracking-wide ${dark ? 'text-white/40' : 'text-[var(--color-muted)]'}`;

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
          dark ? 'border border-white/10 bg-white/5 backdrop-blur' : 'card-soft'
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
                  ? 'input-soft rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-sm text-white outline-none focus:border-white/40'
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
        </div>

        <div>
          <label className={labelClass}>Date of birth</label>
          <input
            type="date"
            value={values.dob}
            onChange={(e) => set('dob', e.target.value)}
            className={`input-soft ${inputClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>Address</label>
          <input
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="City, state"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Occupation</label>
          <input
            value={values.occupation}
            onChange={(e) => set('occupation', e.target.value)}
            placeholder="e.g. Software engineer"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Complete profile'}
        </Button>
      </form>
    </div>
  );
}
