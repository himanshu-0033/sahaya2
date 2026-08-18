import { useState } from 'react';

const HELPLINES = [
  { name: 'Emergency (police / ambulance)', number: '112', note: 'If you or someone else is in immediate danger' },
  { name: 'KIRAN Mental Health Helpline', number: '1800-599-0019', note: 'Govt. of India, 24/7, toll-free' },
  { name: 'iCall (TISS)', number: '9152987821', note: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', note: '24/7' },
  { name: 'AASRA', number: '9820466726', note: '24/7' },
];

export default function CrisisContacts({ variant = 'button', dark = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          className={
            dark
              ? 'w-full rounded-full border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20'
              : 'w-full rounded-full border border-[var(--color-flag)]/25 bg-[var(--color-flag-soft)] px-5 py-3 text-sm font-medium text-[var(--color-flag)] transition-colors hover:bg-[var(--color-flag-soft)]/70'
          }
        >
          Need help right now? Crisis contacts
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={
            dark
              ? 'text-sm text-red-300/90 underline underline-offset-4 hover:text-red-300'
              : 'text-sm text-[var(--color-flag)] underline underline-offset-4 decoration-[var(--color-flag-soft)] hover:text-[var(--color-flag)]/80'
          }
        >
          Need help now?
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/55 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card-soft max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase">
              You're not alone
            </p>
            <h3 className="font-display text-2xl mt-2">Someone is ready to talk right now.</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              These lines are free and confidential. If you're in immediate danger, call 112.
            </p>

            <div className="mt-5 space-y-2">
              {HELPLINES.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number.replace(/[^\d+]/g, '')}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-ink)]/8 bg-[var(--color-cream-soft)] px-4 py-3 hover:border-[var(--color-teal)]/40"
                >
                  <span>
                    <span className="block text-sm font-medium">{h.name}</span>
                    <span className="block text-xs text-[var(--color-muted)]">{h.note}</span>
                  </span>
                  <span className="font-display text-lg text-[var(--color-teal-dark)]">{h.number}</span>
                </a>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full border border-[var(--color-ink)]/10 py-3 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-soft)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
