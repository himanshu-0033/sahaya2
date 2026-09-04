import { useEffect, useState } from 'react';
import ChatPanel from './ChatPanel.jsx';
import Logo from '../../shared/Logo.jsx';
import { getStatus } from '../../shared/api.js';
import useDialogFocus from '../../shared/useDialogFocus.js';

// DP — the companion, behind the app's own mark.
//
// It used to be a card on Home headed "Ask", with a text field, a send button
// and four starter chips. Three problems with that. It was a form, and a form
// asks to be filled in rather than talked to. It sat in the scroll, so it was
// only reachable from one screen and only after scrolling to it. And it was
// the third thing on Home competing to be tapped first.
//
// A single button, in the same place on every screen, carrying the logo and
// the name. Tapping it opens the conversation — no field to fill in first,
// because the assistant opens the conversation itself.
//
// Deliberately NOT shown during the check-in or a questionnaire. Those pages
// pass `tabs={false}` to PageShell, which is the app's existing signal for "a
// flow someone is inside", and a floating chat button over a form someone is
// halfway through is an invitation to abandon it.
export default function AskDP() {
  const [open, setOpen] = useState(false);
  const [checkin, setCheckin] = useState(null);
  const { dialogRef, triggerRef } = useDialogFocus(open);

  // Today's check-in, so the opener can be about today rather than generic.
  // Fetched on first open rather than on mount: every page carries this
  // button, and a request per page load to seed a conversation most people
  // will not start is a request nobody asked for.
  useEffect(() => {
    if (!open || checkin) return;
    getStatus()
      .then((data) => setCheckin(data.record || null))
      .catch(() => {
        // A generic opener is a fine opener. Nothing here is worth an error.
      });
  }, [open, checkin]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label="Chat with DP"
          className="press fab-anchor fixed right-5 z-40 flex items-center gap-2 rounded-full border border-[var(--color-teal)]/35 py-2.5 pr-4 pl-3 backdrop-blur-xl transition-colors hover:border-[var(--color-teal)]/70 md:right-7"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            boxShadow: '0 18px 44px -18px rgba(0,0,0,0.95), 0 0 0 1px rgba(47,184,124,0.08)',
          }}
        >
          <Logo size={26} />
          <span className="text-left leading-none">
            <span className="font-display block text-[1.05rem] leading-none">DP</span>
            <span className="marginalia mt-1 block">ASK</span>
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with DP"
        >
          <div ref={dialogRef} className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <ChatPanel variant="overlay" checkin={checkin} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
