import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { getChatHistory } from '../../shared/api.js';

// What you already said.
//
// These transcripts were being kept from the moment the companion shipped, and
// a counsellor the resident invited could read all of them. The resident could
// not. Their own words, filed under their own account, and the one person
// without a way back to them was the person who wrote them.
//
// Folded shut by default, same as the counsellor console does it. A screen that
// opens with old conversations already unrolled invites rereading them because
// they are there rather than because you came looking, and some of these were
// written on bad nights.

function when(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function firstLine(session) {
  const said = session.turns.find((t) => t.role === 'user');
  if (!said) return 'You opened this one and did not say anything.';
  return said.content;
}

export default function ChatHistory() {
  const navigate = useNavigate();
  const session = useSession();

  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getChatHistory()
      .then((data) => setSessions(data.sessions || []))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, navigate, reloadKey]);

  if (!session) return null;

  return (
    <PageShell section="home" width="wide">
      <Header eyebrow="Talks" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          What you said
          <span className="text-[var(--sec-home-deep)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Every conversation you have had with DP, newest first.
        </p>
      </div>

      {loading && (
        <p className="stack-section animate-pulse text-[var(--color-ink-soft)]">Loading…</p>
      )}

      {error && (
        <div className="stack-section">
          <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="card stack-section p-6">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Nothing here yet. Conversations show up once you have talked to DP, and only you and
            anyone you have invited to your account can read them.
          </p>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="stack-section grid gap-2.5">
          {sessions.map((c) => (
            <details key={c.id} className="card px-5 py-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <span className="font-medium">{when(c.startedAt)}</span>
                <span className="text-xs text-[var(--color-muted)]">
                  <span className="num">{c.turns.length}</span>{' '}
                  {c.turns.length === 1 ? 'message' : 'messages'}
                </span>
                {c.flagged && (
                  <span className="rounded-full bg-[var(--color-flag-soft)] px-2.5 py-0.5 text-[0.6875rem] text-[var(--color-flag-deep)]">
                    Crisis contacts were shown
                  </span>
                )}
              </summary>

              <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">
                {firstLine(c)}
              </p>

              <div className="mt-4 space-y-2.5">
                {c.turns.map((t, i) => (
                  <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        t.role === 'user'
                          ? 'bg-[var(--color-teal-dark)] text-white'
                          : 'border border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--color-ink)]'
                      }`}
                    >
                      {t.content}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="card stack-section p-6">
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
          These are kept on your account so you can come back to them, and so a counsellor you
          have invited can see how things have been between check-ins. Nobody else can read them.
          You can take back an invitation, or delete the whole account, from your account page.
        </p>
        <div className="mt-5">
          <CrisisContacts variant="button" />
        </div>
      </div>
    </PageShell>
  );
}
