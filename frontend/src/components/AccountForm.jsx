import { useState } from 'react';
import Button from './Button.jsx';

const FIELDS = [
  { key: 'rollNo', label: 'Roll number', placeholder: 'e.g. 21CS3045' },
  { key: 'phone', label: 'Phone number', placeholder: 'e.g. 98765 43210' },
  { key: 'room', label: 'Room / hostel block', placeholder: 'e.g. B-204' },
  { key: 'address', label: 'Home address', placeholder: 'City, state' },
  { key: 'occupation', label: 'Occupation', placeholder: 'e.g. Student, B.Tech 2nd year' },
];

export default function AccountForm({ name, email, onDone, saving, error }) {
  const [values, setValues] = useState({ rollNo: '', phone: '', room: '', address: '', occupation: '' });
  const canSubmit = values.room.trim().length > 0;

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onDone(values);
      }}
    >
      <p className="text-sm text-[var(--color-ink-soft)]">
        Welcome, {name.split(' ')[0]}. Let's set up your account ({email}).
      </p>

      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {field.label}
            {field.key === 'room' && ' *'}
          </label>
          <input
            value={values[field.key]}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] px-4 py-3 outline-none focus:border-[var(--color-teal)]"
          />
        </div>
      ))}

      {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

      <Button type="submit" disabled={!canSubmit || saving}>
        {saving ? 'Saving…' : 'Create account'}
      </Button>
    </form>
  );
}
