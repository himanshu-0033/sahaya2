import { useState } from 'react';
import Button from './Button.jsx';

export default function OnboardingForm({ onDone }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const canSubmit = name.trim().length > 0 && room.trim().length > 0;

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onDone({ name, room });
      }}
    >
      <p className="text-sm text-[var(--color-ink-soft)]">
        First time here — tell us who you are so your caregiver knows whose check-in this is.
      </p>
      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] px-4 py-3 outline-none focus:border-[var(--color-teal)]"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Room / ID</label>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. B-204"
          className="mt-1 w-full rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] px-4 py-3 outline-none focus:border-[var(--color-teal)]"
        />
      </div>
      <Button type="submit" disabled={!canSubmit}>
        Continue
      </Button>
    </form>
  );
}
