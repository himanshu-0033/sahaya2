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
// Any screen can open the conversation, optionally with a question already
// typed, by dispatching this event. Home's "Ask DP anything" bar does; the
// question is handed to ChatPanel, which sends it once the opener has landed.
export const ASK_DP_EVENT = 'sahay:ask-dp';

export default function AskDP() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const onAsk = (e) => {
      setQuestion(e.detail?.question || null);
      setOpen(true);
    };
    window.addEventListener(ASK_DP_EVENT, onAsk);
    return () => window.removeEventListener(ASK_DP_EVENT, onAsk);
  }, []);
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
          className="press fab-anchor fixed right-5 z-40 flex items-center gap-2 border-[1.5px] border-[var(--spot)] bg-[var(--paper)] py-2 pr-4 pl-2.5 transition-colors hover:bg-[var(--paper-tint)] md:right-7"
          style={{ boxShadow: '0 10px 24px -14px rgba(7, 63, 34, 0.55)' }}
        >
          <Logo size={26} glow={false} />
          <span className="text-left leading-none">
            <span className="f-title block text-[1.05rem] leading-none text-[var(--spot)]">DP</span>
            <span className="marginalia mt-1 block">ASK</span>
          </span>
        </button>
      )}

      {open && (
        <div
          className="backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with DP"
        >
          <div ref={dialogRef} className="dialog-in w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <ChatPanel
              variant="overlay"
              checkin={checkin}
              initialQuestion={question}
              onClose={() => {
                setOpen(false);
                setQuestion(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
