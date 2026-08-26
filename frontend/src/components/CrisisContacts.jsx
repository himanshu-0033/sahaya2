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
        /* The most important control in the product, and until now the one with
           the least weight on the page: a small underlined text link, the same
           treatment as a footnote.

           It is now a filled pill with an icon and a 44px target. It still sits
           at the edge of the screen rather than in the tab bar, because it is an
           interruption and not a destination — but at the edge it has to be
           unmistakable, or being at the edge just means being missed. Every
           screen that used variant="link" gets this without changing. */
        <button
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`press inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
            dark
              ? 'border border-red-400/45 bg-red-500/15 text-red-200 hover:bg-red-500/25'
              : 'border border-[var(--color-flag)]/45 bg-[var(--color-flag-soft)] text-[var(--color-flag)] hover:bg-[var(--color-flag)]/22'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            {/* A lifebuoy: a ring with four spokes. Reads as rescue at 16px,
                where a telephone reads as "call us about your account". */}
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.6" />
            <path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
          </svg>
          Need help now
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
                className="press -mr-1 -mt-1 shrink-0 rounded-full border border-[var(--line-2)] p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-3)]"
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
                    className="press flex items-center justify-between gap-3 rounded-2xl border border-[var(--line-1)] bg-[var(--surface-1)] px-4 py-3 transition-colors hover:border-[var(--color-teal)]/40 hover:bg-[var(--surface-3)]"
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
                className="press w-full rounded-full border border-[var(--line-2)] py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-3)]"
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
