import { useState } from 'react';
import Button from './Button.jsx';

const DETAIL_FIELDS = [
  { key: 'rollNo', label: 'Roll number', placeholder: 'e.g. 21CS3045' },
  { key: 'room', label: 'Room / hostel block', placeholder: 'e.g. B-204', required: true },
  { key: 'address', label: 'Home address', placeholder: 'City, state' },
  { key: 'occupation', label: 'Occupation', placeholder: 'e.g. Student, B.Tech 2nd year' },
];

const inputClass =
  'input-soft mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white/70 px-4 py-3 outline-none transition-colors focus:border-[var(--color-teal)] focus:ring-2 focus:ring-[var(--color-teal-soft)]';

export default function AccountForm({ name, email, onDone, saving, error }) {
  const [values, setValues] = useState({
    name,
    email,
    phone: '',
    dob: '',
    rollNo: '',
    room: '',
    address: '',
    occupation: '',
  });
  const canSubmit = values.room.trim().length > 0;

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <div className="mt-8 animate-fade-up">
      <h2 className="font-display text-3xl md:text-4xl leading-tight text-center">
        Let's get to know you a bit better.
      </h2>

      <form
        className="card-soft mt-8 space-y-5 rounded-3xl p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onDone(values);
        }}
      >
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Full name</label>
          <input
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email address</label>
          <input
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Phone number</label>
          <input
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. 98765 43210"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Date of birth</label>
          <input
            type="date"
            value={values.dob}
            onChange={(e) => set('dob', e.target.value)}
            className={`input-soft ${inputClass}`}
          />
        </div>

        <div className="border-t border-[var(--color-ink)]/8 pt-5">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-4">
            Hostel details
          </p>
          <div className="space-y-4">
            {DETAIL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  {field.label}
                  {field.required && ' *'}
                </label>
                <input
                  value={values[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

        <Button type="submit" disabled={!canSubmit || saving}>
          {saving ? 'Saving…' : 'Complete profile'}
        </Button>
      </form>
    </div>
  );
}
