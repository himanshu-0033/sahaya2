import { useEffect, useState } from 'react';

const HELPLINES = [
  { name: 'Emergency (police / ambulance)', number: '112', note: 'If you or someone else is in immediate danger' },
  { name: 'KIRAN Mental Health Helpline', number: '1800-599-0019', note: 'Govt. of India, 24/7, toll-free' },
  { name: 'iCall (TISS)', number: '9152987821', note: 'Mon–Sat, 8am–10pm' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', note: '24/7' },
  { name: 'AASRA', number: '9820466726', note: '24/7' },
];

export default function CrisisContacts({ variant = 'button', dark = false }) {
  const [open, setOpen] = useState(false);

  // Escape must always get you out — this dialog can appear at a bad moment and
  // must never feel like a trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {variant === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          className={
            dark
              ? 'w-full rounded-full border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20'
              : 'press w-full rounded-full border border-[var(--color-flag)]/25 bg-[var(--color-flag-soft)] px-5 py-3 text-sm font-medium text-[var(--color-flag)] transition-colors hover:bg-[var(--color-flag)]/20'
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Crisis contacts"
        >
          {/* Column layout: header and footer stay put, only the list scrolls,
              so a way out is always on screen. */}
          <div
            className="glass flex max-h-[88vh] w-full max-w-md flex-col rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4">
              <div>
                <p className="marginalia">You're not alone</p>
                <h3 className="font-display text-2xl mt-2">Someone is ready to talk right now.</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="press -mr-1 -mt-1 shrink-0 rounded-full border border-white/12 p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-white/8"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <p className="text-sm text-[var(--color-ink-soft)]">
                These lines are free and confidential. If you're in immediate danger, call 112.
              </p>

              <div className="mt-4 space-y-2 pb-2">
                {HELPLINES.map((h) => (
                  <a
                    key={h.number}
                    href={`tel:${h.number.replace(/[^\d+]/g, '')}`}
                    className="press flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition-colors hover:border-[var(--color-teal)]/40 hover:bg-white/[0.07]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{h.name}</span>
                      <span className="block text-xs text-[var(--color-muted)]">{h.note}</span>
                    </span>
                    <span className="num shrink-0 text-lg whitespace-nowrap text-[var(--color-teal-dark)]">
                      {h.number}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="shrink-0 p-6 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="press w-full rounded-full border border-white/10 py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-white/8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
