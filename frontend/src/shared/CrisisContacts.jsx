import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useDialogFocus from './useDialogFocus.js';

// Numbers checked September 2026:
//   - KIRAN (1800-599-0019) was merged into Tele-MANAS, the national 24/7 line,
//     so Tele-MANAS leads. 14416 is its short code; 1-800-891-4416 the same
//     service on a toll-free number for phones that cannot dial short codes.
//   - iCall answers Monday to Saturday, 10am to 8pm. The old note said 8am to
//     10pm, which would have sent someone to a line that was closed.
//   - Vandrevala's national number is +91 9999 666 555 now.
//   - The "someone is hurting you" lines are new. A crisis is not always
//     thoughts of self-harm, and a student being hit at home or harassed on
//     campus needs a different number from a suicide line.
//
// Keep agent/lib/safety.js and backend/lib/safety.js in step when these change.

// The two a person in danger needs, as large buttons above everything else.
const URGENT = [
  { id: 'emergency', name: 'Emergency', number: '112', note: 'Police, ambulance, fire', tone: 'red' },
  { id: 'telemanas', name: 'Tele-MANAS', number: '14416', note: 'Mental health line, 24/7, free', tone: 'green' },
];

const GROUPS = [
  {
    id: 'talk',
    label: 'Talk to someone now',
    entries: [
      { id: 'telemanas-tollfree', name: 'Tele-MANAS (toll-free)', number: '1-800-891-4416', note: 'Govt. of India, 24/7' },
      { id: 'vandrevala', name: 'Vandrevala Foundation', number: '+91 9999 666 555', note: '24/7, call or text' },
      { id: 'aasra', name: 'AASRA', number: '+91 98204 66726', note: '24/7' },
      { id: 'icall', name: 'iCall (TISS)', number: '9152987821', note: 'Mon to Sat, 10am to 8pm' },
    ],
  },
  {
    id: 'hurt',
    label: 'If someone is hurting you',
    entries: [
      { id: 'women-181', name: 'Women Helpline', number: '181', note: '24/7, violence at home or outside' },
      { id: 'ncw', name: 'National Commission for Women', number: '7827170170', note: '24/7, call or WhatsApp' },
      { id: 'childline', name: 'Childline', number: '1098', note: '24/7, for anyone under 18' },
    ],
  },
  // IIT Kharagpur. Keyed by id rather than by number: the Security Control
  // Room's second line and the Quick Response Room are published as the same
  // number, so keying on the number would collide and drop one of the rows.
  {
    id: 'campus',
    label: 'On campus, IIT Kharagpur',
    entries: [
      { id: 'security-1', name: 'Security Control Room', number: '+91 3222282751', note: 'Campus security' },
      { id: 'security-2', name: 'Security Control Room (Alt 1)', number: '+91 3222281001', note: 'Campus security' },
      { id: 'security-3', name: 'Security Control Room (Alt 2)', number: '+91 3222281002', note: 'Campus security' },
      { id: 'qrr-1', name: 'Quick Response Room', number: '+91 3222281002', note: 'Emergency response' },
      { id: 'qrr-2', name: 'Quick Response Room (Alt)', number: '+91 3222281003', note: 'Emergency response' },
      { id: 'fire', name: 'Fire Emergency', number: '+91 3222255709', note: 'Fire safety' },
      { id: 'security-officer', name: 'IIT KGP Security Officer', number: '+91 9434386647', note: 'Campus security' },
      { id: 'gsw', name: 'Dnyaneshwari Ghare', number: '7499306778', note: "General Secretary, Students' Welfare" },
      { id: 'icc-1', name: 'ICC Chairperson', number: '03222-283312', note: 'Internal Complaints Committee' },
      { id: 'icc-2', name: 'ICC Chairperson (Alt)', number: '03222-281750', note: 'Internal Complaints Committee' },
    ],
  },
];

const tel = (number) => `tel:${number.replace(/[^\d+]/g, '')}`;

// Literal colours rather than theme tokens, on purpose. This dialog opens over
// the dark app, the light landing page and everything between, and it was
// inheriting whichever theme it landed in: over the app it rendered as grey
// text on near-black glass, which is the last thing a person in crisis should
// have to squint at. It is always a white sheet with dark text now. Every pair
// below clears 4.5:1: ink 16.8:1 and soft 7.6:1 on white, white on the red
// 6.6:1 and on the green 6.6:1.
// The printed form's inks. Literal rather than var() because the dialog is
// portalled to <body> and has to read the same wherever it is opened from.
const C = {
  ink: '#0f2419',
  soft: '#3d5045',
  line: 'rgba(10, 92, 50, 0.32)',
  row: '#ffffff',
  red: '#b3261e',
  green: '#0a5c32',
};

function Lifebuoy({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {/* A lifebuoy: a ring with four spokes. Reads as rescue at 16px, where
          a telephone reads as "call us about your account". */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
    </svg>
  );
}

// Some pages still pass `dark`. The trigger is a solid red now, which reads the
// same on either ground, so it is simply ignored.
// `compact` is for the phone header, where three controls share 360 pixels: under
// 400px wide the pill reads "Help", still solid red with the lifebuoy.
export default function CrisisContacts({ variant = 'button', compact = false }) {
  const [open, setOpen] = useState(false);
  const { dialogRef, triggerRef } = useDialogFocus(open);

  // Escape must always get you out. This dialog can appear at a bad moment and
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
      {/* The most important control in the product. Solid red, an icon, and
          a 44px target on every variant: at the edge of a screen it has to be
          unmistakable, or being at the edge just means being missed. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={compact ? 'Get help now' : undefined}
        className={`press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] border-[1.5px] border-[#b3261e] ${compact ? 'px-3' : 'px-4'} py-2.5 text-sm font-semibold text-white transition-[filter] hover:brightness-90 ${
          variant === 'button' ? 'w-full px-5 py-3' : 'shrink-0'
        }`}
        style={{ background: C.red }}
      >
        <Lifebuoy />
        {variant === 'button' ? (
          'Need help right now? Crisis contacts'
        ) : compact ? (
          <>
            <span className="min-[400px]:hidden">Help</span>
            <span className="hidden min-[400px]:inline">Get help now</span>
          </>
        ) : (
          'Get help now'
        )}
      </button>

      {/* Portalled to <body>. Any ancestor with a backdrop blur or a
          transform becomes the containing block for position: fixed, and both
          the sticky headers and the chat overlay have one, so rendered in place
          the dialog was clipped to the header with its call buttons off the top
          of the screen. */}
      {open && createPortal(
        <div
          className="backdrop-in fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-title"
        >
          {/* Column layout: the heading and the two urgent buttons stay put,
              only the lists scroll, so a way to call is always on screen. */}
          <div
            ref={dialogRef}
            className="dialog-in flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[3px] border-t-4 border-[#b3261e] bg-white text-left shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
            style={{ color: C.ink, colorScheme: 'light' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-6 pt-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="f-label" style={{ color: C.red }}>
                    You are not alone
                  </p>
                  <h3 id="crisis-title" className="f-title mt-1.5 text-[1.45rem] leading-tight">
                    Someone is ready to talk right now.
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="press -mt-1 -mr-1 shrink-0 rounded-[2px] border p-2 transition-colors hover:bg-[#eef4ef]"
                  style={{ borderColor: C.line, color: C.soft }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {URGENT.map((u) => (
                  <a
                    key={u.id}
                    href={tel(u.number)}
                    className="press flex flex-col rounded-[2px] px-4 py-3 text-white transition-[filter] hover:brightness-110"
                    style={{ background: u.tone === 'red' ? C.red : C.green }}
                  >
                    <span className="text-[0.75rem] font-semibold">Call {u.name}</span>
                    <span className="mt-0.5 text-[1.6rem] leading-none font-bold tabular-nums">{u.number}</span>
                    <span className="mt-1.5 text-[0.6875rem] leading-snug">{u.note}</span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-[0.8125rem] leading-snug" style={{ color: C.soft }}>
                If you might act on thoughts of hurting yourself, or someone is hurting you right
                now, call 112 or go to the nearest hospital emergency department.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border-t px-6 pb-4" style={{ borderColor: C.line }}>
              {GROUPS.map((group) => (
                <div key={group.id} className="mt-4">
                  <p className="f-label mb-2" style={{ color: C.soft }}>
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.entries.map((h) => (
                      <a
                        key={h.id}
                        href={tel(h.number)}
                        className="press flex items-center justify-between gap-3 rounded-[2px] border px-4 py-3 transition-colors hover:border-[#0a5c32] hover:bg-[#eef4ef]"
                        style={{ background: C.row, borderColor: C.line }}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{h.name}</span>
                          <span className="block text-xs" style={{ color: C.soft }}>{h.note}</span>
                        </span>
                        <span className="shrink-0 text-[0.9375rem] font-bold whitespace-nowrap tabular-nums" style={{ color: C.green }}>
                          {h.number}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              <p className="mt-4 text-xs leading-relaxed" style={{ color: C.soft }}>
                These lines are free and confidential. Tap a number to call it.
              </p>
            </div>

            <div className="shrink-0 border-t px-6 py-4" style={{ borderColor: C.line }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="press w-full rounded-[2px] border py-3 text-sm font-medium transition-colors hover:bg-[#eef4ef]"
                style={{ borderColor: C.line, color: C.soft }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
