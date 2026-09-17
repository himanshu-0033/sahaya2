import { useEffect, useRef, useState } from 'react';
import { sendChat, saveChatLog, getChatHistory } from '../../shared/api.js';
import Logo from '../../shared/Logo.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import VoiceInputButton from '../../shared/VoiceInputButton.jsx';
import { speak, stopSpeaking } from '../../shared/speech.js';
import { when, firstLine, TOPICS } from './talks.js';

// The agent and the chat log both stop a conversation at 24 turns. A reply
// adds two, so from 23 on there is no room for one that would still be saved.
const MAX_TURNS = 24;

function Bubble({ role, children }) {
  const mine = role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          mine
            ? 'bg-[var(--color-teal-dark)] text-white'
            : 'border border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--color-ink)]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Under a crisis reply. Literal light colours, for the same reason as
// CrisisContacts: it has to be legible in whatever theme the chat opens in.
// The agent always lists 112 first and the line that fits what was said
// second, so those two are large buttons and the rest are rows beneath.
const telHref = (number) => `tel:${number.replace(/[^\d+]/g, '')}`;

function Helplines({ items }) {
  const [first, second, ...rest] = items;
  return (
    <div
      role="region"
      aria-label="Crisis contacts"
      className="mt-2 rounded-2xl border-2 bg-white p-3"
      style={{ borderColor: '#b42318', color: '#141b2d', colorScheme: 'light' }}
    >
      <p className="text-[0.8125rem] font-bold" style={{ color: '#b42318' }}>
        Talk to a person now
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[first, second].filter(Boolean).map((h, i) => (
          <a
            key={h.number}
            href={telHref(h.number)}
            className="press rounded-xl px-3 py-2 text-white"
            style={{ background: i === 0 ? '#b42318' : '#1f2d52' }}
          >
            <span className="block text-[0.6875rem] leading-tight font-semibold">
              Call {h.name.split(/[,(]/)[0].trim()}
            </span>
            <span className="mt-1 block text-lg leading-none font-bold tabular-nums">{h.number}</span>
          </a>
        ))}
      </div>
      {rest.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {rest.map((h) => (
            <a
              key={h.number}
              href={telHref(h.number)}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-[#f5f7f6]"
            >
              <span className="min-w-0" style={{ color: '#4b5566' }}>{h.name}</span>
              <span className="shrink-0 font-bold whitespace-nowrap tabular-nums" style={{ color: '#1f2d52' }}>
                {h.number}
              </span>
            </a>
          ))}
        </div>
      )}
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
  // Stamped once, when this panel opens. It is what makes every save of this
  // conversation an update of one record rather than a new one.
  const startedAt = useRef(new Date().toISOString());
  const flaggedRef = useRef(false);
  // The topic the student tapped, if they tapped one. Kept for the life of the
  // conversation so every save files it under the same one.
  const topicRef = useRef(null);
  // Whether the turn being answered arrived by voice. A ref rather than state
  // because it is read after an await, by which point state from the closure is
  // a render behind. It is what decides whether the reply is spoken: talk to
  // this and it talks back, type to it and it stays quiet.
  const spokenTurnRef = useRef(false);
  const [listenSignal, setListenSignal] = useState(0);
  // 'chat' or 'history'. History swaps the transcript for a list of past
  // conversations; picking one loads it back into this panel to carry on.
  const [view, setView] = useState('chat');
  const [past, setPast] = useState(null);
  const [pastError, setPastError] = useState(null);

  // Ask the agent for its opening line, seeded with today's check-in.
  //
  // Extracted from the effect so it can be run again. It used to live inside
  // one, guarded by a ref that was set before the request went out — so when
  // the opener failed there was no way back: an empty panel, an error line,
  // and a person left looking at a dead box until they thought to close the
  // dialog and open it again.
  function openConversation() {
    setBusy(true);
    setError(null);
    sendChat({ messages: [], checkin })
      .then((data) => {
        setIsMock(Boolean(data.isMock));
        setMessages([{ role: 'assistant', content: data.reply }]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    openConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkin]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, view]);

  // Fetched fresh every time, since the conversation open right now may have
  // grown since the last look. The old list stays up while the new one loads.
  function openHistory() {
    stopSpeaking();
    setView('history');
    setPastError(null);
    getChatHistory()
      .then((data) => setPast(data.sessions || []))
      .catch((err) => setPastError(err.message));
  }

  // Carrying on under the old startedAt is what makes the next save update
  // that conversation instead of filing a second copy of it. The flag carries
  // over too: a conversation that showed crisis contacts once stays marked.
  function resume(session) {
    startedAt.current = session.startedAt;
    flaggedRef.current = Boolean(session.flagged);
    topicRef.current = session.topic || null;
    setMessages(session.turns.map((t) => ({ role: t.role, content: t.content })));
    setError(null);
    setView('chat');
  }

  function startNew() {
    startedAt.current = new Date().toISOString();
    flaggedRef.current = false;
    topicRef.current = null;
    setMessages([]);
    setView('chat');
    openConversation();
  }

  const full = messages.length + 2 > MAX_TURNS;

  async function ask(raw) {
    const text = (raw || '').trim();
    if (!text || busy) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setBusy(true);
    setError(null);

    try {
      const data = await sendChat({ messages: next, checkin });
      const full = [...next, { role: 'assistant', content: data.reply, helplines: data.helplines }];
      setMessages(full);
      if (data.flagged) flaggedRef.current = true;

      // Said out loud, so it answers out loud, and the mic reopens once the
      // voice stops — a voice conversation takes no tapping between turns. The
      // mic is never opened *while* it is speaking, or it would hear itself and
      // answer its own reply. Saying nothing ends the loop; so does the stop
      // button on the mic.
      if (spokenTurnRef.current) {
        speak(data.reply, () => setListenSignal((n) => n + 1));
      }

      // Filed after the reply is on screen, and never awaited: this is a
      // record of the conversation, not part of it, and a storage problem must
      // not become the person's problem mid-sentence.
      saveChatLog({
        startedAt: startedAt.current,
        messages: full.map((m) => ({ role: m.role, content: m.content })),
        flagged: flaggedRef.current,
        topic: topicRef.current,
      }).catch(() => {});
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
    // Typing is a request for quiet: it stops any reply still being read out,
    // and this answer is not spoken.
    stopSpeaking();
    spokenTurnRef.current = false;
    setDraft('');
    void ask(text);
  }

  function pickTopic(topic) {
    stopSpeaking();
    spokenTurnRef.current = false;
    topicRef.current = topic.id;
    void ask(topic.says);
  }

  function hear(transcript) {
    if (busy) return;
    spokenTurnRef.current = true;
    void ask(transcript);
  }

  // Nothing should still be talking once this panel is gone.
  useEffect(() => stopSpeaking, []);

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
    // --surface-2 is a five-percent ink tint: a faint lift when this sits on the
    // page's cream ground, and nearly transparent when it does not. As a modal
    // it sits on a dimmed backdrop instead, so the same tint rendered the whole
    // conversation dark — the one place in the app where the ground was not the
    // colour every token in it was measured against. The overlay gets an opaque
    // ground of its own, and the tokens land where they were meant to.
    <div
      className={`rounded-3xl border border-[var(--line-2)] p-5 ${
        variant === 'overlay'
          ? 'bg-[var(--color-cream)] shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)]'
          : 'bg-[var(--surface-2)] shadow-[0_30px_80px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] tracking-[0.22em] text-[var(--color-muted)] uppercase">
            {variant === 'overlay' ? 'DP' : 'Talk it through'}
          </p>
          <h3 className="mt-1 font-display text-xl">
            {view === 'history'
              ? 'Your past talks.'
              : variant === 'overlay' ? 'Say what is going on.' : 'A moment to reflect'}
          </h3>
        </div>
        <div className="-mr-1 -mt-1 flex shrink-0 items-center gap-1.5">
          {/* Off while a reply is on its way: it would land in whichever
              conversation was open by then. */}
          <button
            type="button"
            onClick={view === 'history' ? () => setView('chat') : openHistory}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line-2)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
          >
            {view === 'history' ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5M12 7v5l3 2" />
              </svg>
            )}
            {view === 'history' ? 'Back' : 'History'}
          </button>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="shrink-0 rounded-full border border-[var(--line-2)] p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {view === 'history' ? (
        <div
          className={`mt-4 overflow-y-auto pr-1 ${
            variant === 'overlay' ? 'max-h-[52vh] min-h-[9rem]' : 'max-h-72'
          }`}
        >
          <button
            type="button"
            onClick={startNew}
            className="press flex w-full items-center gap-2 rounded-2xl border border-dashed border-[var(--line-4)] px-4 py-3 text-sm text-[var(--color-teal-dark)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Start a new conversation
          </button>

          {!past && !pastError && (
            <p className="mt-3 animate-pulse text-xs text-[var(--color-muted)]">Loading…</p>
          )}
          {pastError && (
            <p className="mt-3 text-xs text-[var(--color-flag-deep)]" role="alert">
              {pastError}
            </p>
          )}
          {past && past.length === 0 && (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              Nothing here yet. A conversation shows up once you have said something in it.
            </p>
          )}

          {past && past.length > 0 && (
            <ul className="mt-2.5 space-y-2">
              {past.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => resume(c)}
                    className="press card block w-full px-4 py-3 text-left"
                  >
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                      <span className="font-medium">{when(c.startedAt)}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        <span className="num">{c.turns.length}</span>{' '}
                        {c.turns.length === 1 ? 'message' : 'messages'}
                      </span>
                      {c.startedAt === startedAt.current && (
                        <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-ink-soft)]">
                          Open now
                        </span>
                      )}
                      {c.flagged && (
                        <span className="rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[0.6875rem] text-[var(--color-flag-deep)]">
                          Crisis contacts were shown
                        </span>
                      )}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted)]">
                      {firstLine(c)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
      <>
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
            <span className="flex items-center gap-2">
              <Logo size={24} thinking />
              {/* The animation is the whole message for anyone who can see it,
                  and no message at all for anyone who cannot. */}
              <span className="sr-only">DP is thinking</span>
            </span>
          </Bubble>
        )}
      </div>

      {/* Only under the opener, before anything has been said. A way in for
          someone who does not know how to start, never a form to fill in: the
          box below still works, and typing skips these entirely. */}
      {messages.length === 1 && !busy && !initialQuestion && (
        <div className="mt-3">
          <p className="text-xs text-[var(--color-muted)]">Pick one if it helps, or just type.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTopic(t)}
                className="press rounded-full border border-[var(--line-2)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-xs text-[var(--color-flag-deep)]" role="alert">
            {error}
          </p>
          {messages.length === 0 && (
            <button
              type="button"
              onClick={openConversation}
              disabled={busy}
              className="press rounded-full border border-[var(--color-flag-deep)]/40 px-3 py-1 text-xs font-medium text-[var(--color-flag-deep)] transition-colors hover:bg-[var(--color-flag-soft)] disabled:opacity-40"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {full ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
            This conversation is as long as one can get.
          </p>
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-full bg-[var(--color-teal-dark)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-ink)]"
          >
            Start a new one
          </button>
        </div>
      ) : (
      <form onSubmit={send} className="mt-4 flex items-center gap-2">
        <input
          data-autofocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say as much or as little as you like…"
          className="min-w-0 flex-1 rounded-full border border-[var(--line-2)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-teal)]"
        />
        {/* Draws nothing in a browser without speech recognition, so the typed
            box is never left sitting next to a control that cannot work. */}
        <VoiceInputButton
          size="sm"
          onTranscript={hear}
          onError={setError}
          listenSignal={listenSignal}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          className="shrink-0 rounded-full bg-[var(--color-teal-dark)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-ink)] disabled:opacity-40"
        >
          Send
        </button>
      </form>
      )}
      </>
      )}

      {/* Always on screen under the conversation, not only after a crisis
          reply: the moment someone needs it is not always a moment the
          pattern screen recognised. */}
      <div className="mt-3 flex justify-start">
        <CrisisContacts variant="link" />
      </div>

      <p className="mt-3 text-[0.6875rem] leading-relaxed text-[var(--color-ink-soft)]">
        {isMock
          ? 'Scripted preview. No AI model is connected yet. Not a therapist, and not a crisis service.'
          : 'DP Sahay AI is not a therapist and not a crisis service. If you need urgent help, tap Get help now. This conversation is saved to your account. Your counsellor and your institution\'s administrator can read it and see what it is about.'}
      </p>
    </div>
  );
}
