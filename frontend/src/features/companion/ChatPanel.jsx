import { useEffect, useRef, useState } from 'react';
import { sendChat } from '../../shared/api.js';

function Bubble({ role, children }) {
  const mine = role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          mine
            ? 'bg-[var(--color-teal)] text-white'
            : 'border border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--color-ink)]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Helplines({ items }) {
  return (
    <div className="mt-2 space-y-1.5">
      {items.map((h) => (
        <a
          key={h.number}
          href={`tel:${h.number.replace(/[^\d+]/g, '')}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)] px-3 py-2 text-xs"
        >
          <span className="min-w-0 text-[var(--color-ink-soft)]">{h.name}</span>
          <span className="shrink-0 font-display text-sm whitespace-nowrap text-[var(--color-flag)]">
            {h.number}
          </span>
        </a>
      ))}
    </div>
  );
}

// `initialQuestion` lets Home hand over a question the person already typed
// there, so they are not made to type it twice into a second box. It is sent
// once, and only after the opener has landed — the API requires the first
// message to be the assistant's, and firing both at once would race.
// `variant` is 'card' when this sits in a page's scroll and 'overlay' when it
// is the whole of a modal. The difference is how much room the transcript may
// take: in a card it must not push the rest of the page down, in a modal it
// should use the height it has been given.
export default function ChatPanel({
  checkin,
  onClose,
  initialQuestion = null,
  variant = 'card',
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const scrollRef = useRef(null);
  const started = useRef(false);
  const askedRef = useRef(false);

  // Ask the agent for its opening line once, seeded with today's check-in.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setBusy(true);
    sendChat({ messages: [], checkin })
      .then((data) => {
        setIsMock(Boolean(data.isMock));
        setMessages([{ role: 'assistant', content: data.reply }]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [checkin]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  async function ask(raw) {
    const text = (raw || '').trim();
    if (!text || busy) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setBusy(true);
    setError(null);

    try {
      const data = await sendChat({ messages: next, checkin });
      setMessages([
        ...next,
        { role: 'assistant', content: data.reply, helplines: data.helplines },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    void ask(text);
  }

  // Hand-off from Home. Waits for the opener so the history starts with the
  // assistant, and runs once even if this re-renders while the reply is in
  // flight.
  //
  // `error` is in the gate as well as the opener, and that is the whole point
  // of it: if the opener never arrives, waiting for it forever would swallow
  // the question the person had already typed on the previous screen. It goes
  // into the transcript either way. Sending it will probably fail too — but
  // failing visibly, under their own words, beats their words disappearing.
  useEffect(() => {
    if (!initialQuestion || askedRef.current) return;
    if (busy) return;
    if (messages.length === 0 && !error) return;
    askedRef.current = true;
    void ask(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, busy, messages.length, error]);

  return (
    <div className="rounded-3xl border border-[var(--line-2)] bg-[var(--surface-2)] p-5 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] tracking-[0.22em] text-[var(--color-muted)] uppercase">
            {variant === 'overlay' ? 'DP' : 'Talk it through'}
          </p>
          <h3 className="mt-1 font-display text-xl">
            {variant === 'overlay' ? 'Say what is going on.' : 'A moment to reflect'}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="-mr-1 -mt-1 shrink-0 rounded-full border border-[var(--line-2)] p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollRef}
        className={`mt-4 space-y-2.5 overflow-y-auto pr-1 ${
          variant === 'overlay' ? 'max-h-[52vh] min-h-[9rem]' : 'max-h-72'
        }`}
      >
        {messages.map((m, i) => (
          <div key={i}>
            <Bubble role={m.role}>{m.content}</Bubble>
            {m.helplines && <Helplines items={m.helplines} />}
          </div>
        ))}
        {busy && (
          <Bubble role="assistant">
            <span className="text-[var(--color-muted)]">…</span>
          </Bubble>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-[var(--color-flag)]">{error}</p>}

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say as much or as little as you like…"
          className="min-w-0 flex-1 rounded-full border border-[var(--line-2)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-teal)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          className="shrink-0 rounded-full bg-[var(--color-teal)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-teal-dark)] disabled:opacity-40"
        >
          Send
        </button>
      </form>

      <p className="mt-3 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
        {isMock
          ? 'Scripted preview — no AI model is connected yet. Not a therapist, and not a crisis service.'
          : 'DP Sahay AI is not a therapist and not a crisis service. If you need urgent help, use the crisis contacts above.'}
      </p>
    </div>
  );
}
