import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatPanel from './ChatPanel.jsx';

// The ask-anything panel on Home.
//
// It exists because finding things here used to mean knowing where they were.
// Twenty-one questionnaires live under Tests, thirteen practices under Calm,
// and a student in a bad ten minutes is the last person who should be reading
// a menu. Typing what is wrong is a better door than remembering our filing.
//
// Two kinds of starter, deliberately:
//
//   route  — a plain link. "I want to take a test" is not a question, it is a
//            destination, and sending it to a language model to be answered
//            with a sentence would be slower and worse than a link. These
//            work with the network down and the agent unreachable.
//   ask    — opens the conversation with that question already sent.
//
// The input takes anything and opens the conversation. That path needs the
// agent module to be reachable; when it is not, ChatPanel says so in its own
// error line rather than this card pretending nothing happened.

const STARTERS = [
  { id: 'test', kind: 'route', label: 'I want to take a test', to: '/assessments' },
  { id: 'anxious', kind: 'route', label: "I'm feeling anxious", to: '/grounding/cyclic-sighing' },
  { id: 'cant-sleep', kind: 'route', label: "I can't sleep", to: '/grounding/body-scan' },
  { id: 'talk', kind: 'ask', label: 'Just talk to me' },
];

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13M12 5l7 7-7 7" />
    </svg>
  );
}

const chipClass =
  'press shrink-0 whitespace-nowrap rounded-full border border-[var(--line-2)] bg-[var(--surface-1)] px-3.5 py-2 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-teal)]/40 hover:text-[var(--color-ink)]';

export default function HomeAssistant({ checkin = null }) {
  const [draft, setDraft] = useState('');
  const [question, setQuestion] = useState(null);
  const [open, setOpen] = useState(false);

  function start(text) {
    setQuestion(text || null);
    setOpen(true);
  }

  function submit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    start(text);
  }

  if (open) {
    return (
      <ChatPanel
        checkin={checkin}
        initialQuestion={question}
        onClose={() => {
          setOpen(false);
          setQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="card p-5">
      <p className="marginalia">Ask</p>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Say what is going on, or where you want to go.
      </p>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question or take a test..."
          aria-label="Ask a question or take a test"
          className="min-w-0 flex-1 rounded-full border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-teal)]/50"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal)] text-[#07080a] transition-opacity disabled:opacity-35"
        >
          <SendIcon />
        </button>
      </form>

      {/* One row, scrolled sideways rather than wrapped onto three lines.
          Wrapping is what turned four short phrases into a block tall enough
          to push the check-in card off a phone screen. */}
      <div className="row-scroll mt-3 flex gap-2">
        {STARTERS.map((s) =>
          s.kind === 'route' ? (
            <Link key={s.id} to={s.to} className={chipClass}>
              {s.label}
            </Link>
          ) : (
            <button key={s.id} type="button" onClick={() => start(null)} className={chipClass}>
              {s.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
