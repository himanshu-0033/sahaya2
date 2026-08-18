import { useState } from 'react';
import Button from './Button.jsx';

export default function RoomForm({ name, onDone }) {
  const [room, setRoom] = useState('');
  const canSubmit = room.trim().length > 0;

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onDone(room);
      }}
    >
      <p className="text-sm text-[var(--color-ink-soft)]">
        Thanks, {name.split(' ')[0]}. What's your room or resident ID?
      </p>
      <input
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="e.g. B-204"
        className="w-full rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] px-4 py-3 outline-none focus:border-[var(--color-teal)]"
      />
      <Button type="submit" disabled={!canSubmit}>
        Continue
      </Button>
    </form>
  );
}
