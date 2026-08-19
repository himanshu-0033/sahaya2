import { useState } from 'react';

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function PhoneSignInButton({ dark = false }) {
  const [showNotice, setShowNotice] = useState(false);
  const enabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

  return (
    <div className="w-full">
      <button
        onClick={() => setShowNotice(true)}
        className={
          dark
            ? 'flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10'
            : 'flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-ink)]/15 bg-white py-3 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-colors hover:bg-[var(--color-cream-soft)]'
        }
      >
        <PhoneIcon />
        Continue with phone number
      </button>
      {showNotice && !enabled && (
        <p className={`mt-2 text-center text-xs ${dark ? 'text-white/50' : 'text-[var(--color-muted)]'}`}>
          Phone sign-in is being set up — use Google for now.
        </p>
      )}
    </div>
  );
}
