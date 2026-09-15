import { useState } from 'react';
import { submitEnquiry } from '../../shared/api.js';

// For the person reading the landing page on behalf of a college, a hostel or
// an organisation rather than for themselves. They have no account and should
// not need one to ask a question, so this posts to an open endpoint and the
// counsellor console reads it back.
//
// The two lists match backend/handlers/enquiries.js, which refuses anything
// else and stores the words as they are.
const TYPES = ['Bring it to my campus', 'Partner with us', 'Other enquiries'];
const HEARD_FROM = [
  'Word of mouth',
  'News or press',
  'Conference or event',
  'Blog or article',
  'LinkedIn post',
  'Social media ad',
  'Instagram post',
  'Others',
];

const FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
  { name: 'organization', label: 'Your organisation', autoComplete: 'organization' },
  { name: 'role', label: 'Your role', autoComplete: 'organization-title' },
];

const EMPTY = {
  type: TYPES[0],
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  organization: '',
  role: '',
  message: '',
  heardFrom: [],
  website: '',
};

export default function PartnerForm() {
  const [values, setValues] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const toggleHeard = (option) =>
    set(
      'heardFrom',
      values.heardFrom.includes(option)
        ? values.heardFrom.filter((h) => h !== option)
        : [...values.heardFrom, option],
    );

  function send(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    submitEnquiry(values)
      .then(() => setSent(true))
      .catch((err) => setError(err.message))
      .finally(() => setSending(false));
  }

  if (sent) {
    return (
      <div className="w-card p-8 text-center sm:p-10" role="status">
        <h3 className="font-display text-[1.6rem]">Thank you, {values.firstName}.</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
          We have your details, and someone from the team will write to you at {values.email}.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setSent(false);
          }}
          className="mt-6 text-[0.8125rem] underline underline-offset-4"
          style={{ color: 'var(--w-ink-soft)' }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="w-card p-6 sm:p-9">
      <fieldset>
        <legend className="text-[0.9375rem] font-medium">What is this about? *</legend>
        <div className="mt-3 flex flex-col gap-2.5">
          {TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-3 text-sm" style={{ color: 'var(--w-ink-soft)' }}>
              <input
                type="radio"
                name="type"
                className="w-choice"
                checked={values.type === t}
                onChange={() => set('type', t)}
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="block">
            <span className="text-[0.8125rem]" style={{ color: 'var(--w-ink-soft)' }}>
              {f.label} *
            </span>
            <input
              type={f.type || 'text'}
              name={f.name}
              autoComplete={f.autoComplete}
              required
              maxLength={120}
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              className="w-field"
            />
          </label>
        ))}
      </div>

      <label className="mt-9 block">
        <span className="text-[0.9375rem] font-medium">How can we help? (optional)</span>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          className="w-field mt-3"
        />
      </label>

      <fieldset className="mt-8">
        <legend className="text-[0.9375rem] font-medium">How did you hear about us? (optional)</legend>
        <div className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {HEARD_FROM.map((h) => (
            <label key={h} className="flex cursor-pointer items-center gap-3 text-sm" style={{ color: 'var(--w-ink-soft)' }}>
              <input
                type="checkbox"
                className="w-choice"
                checked={values.heardFrom.includes(h)}
                onChange={() => toggleHeard(h)}
              />
              {h}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Hidden from people, and from the tab order. A bot that fills in
          every field fills this one, and the server quietly drops it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p className="mt-6 text-sm text-[#a2332b]" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="press mt-8 w-full rounded-full py-3.5 text-[0.9375rem] font-semibold tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--w-accent-deep)' }}
      >
        {sending ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
}
