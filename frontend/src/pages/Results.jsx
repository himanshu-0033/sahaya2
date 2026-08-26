import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import { useSession } from '../lib/useSession.js';
import { getStatus } from '../lib/api.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// What used to sit here was the dinner pass — a ticket with an SH-MMDD-XXXX
// code, drawn with a perforation and everything, to be shown at a hostel
// dining hall.
//
// The streak replaces it, and the swap is not cosmetic. A meal attached to a
// mental-health log makes the log a thing you complete in order to be fed;
// this is a count of days you chose to come back. One is a receipt, the other
// is the point.
//
// It is written to survive a broken streak without punishing anybody: day one
// is worth saying out loud, and there is no "you lost it" state, because the
// people most likely to miss a week are the ones who most need day nine to
// feel like a fresh start rather than a failure.
function StreakCard({ streak }) {
  const days = Number.isFinite(streak) ? streak : 0;

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border border-[var(--color-lavender)]/22 p-6"
      style={{ background: 'rgba(167,156,240,0.07)' }}
    >
      <span className="marginalia">Check-in streak</span>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="num text-[2.6rem] leading-none text-[var(--color-lavender)]">{days}</span>
        <span className="font-display text-xl text-[var(--color-ink-soft)]">
          day{days === 1 ? '' : 's'} in a row
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {days <= 1
          ? 'That is the hard one done. Tomorrow is easier.'
          : 'Nothing is riding on this — it is just a count of the days you came back.'}
      </p>
    </div>
  );
}


export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const [record, setRecord] = useState(location.state?.record || null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(!location.state?.record);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    if (record) return;
    getStatus()
      .then((data) => {
        if (data.record) setRecord(data.record);
        else navigate('/');
      })
      .finally(() => setLoading(false));
  }, [session, record, navigate]);

  if (!session) return null;

  return (
    <PageShell section="home">
      <Header eyebrow="Today" />

      {loading || !record ? (
        <p className="stack-block animate-pulse text-[var(--color-ink-soft)]">Loading today's check-in…</p>
      ) : (
        <>
          {/* The thought is the emotional payload, so it gets the largest type
              on the page and no competing chrome. */}
          <section className="animate-slide-up mt-8">
            <p className="marginalia">Thought for today</p>
            <blockquote className="font-display mt-4 text-[1.75rem] leading-[1.28] sm:text-[2.3rem]">
              <span
                aria-hidden="true"
                className="mr-1 align-top text-[var(--color-amber)] opacity-70"
              >
                “
              </span>
              {record.thought}
            </blockquote>
          </section>

          <div className="rule-fade mt-8" />

          <div className="animate-slide-up mt-8" style={{ animationDelay: '90ms' }}>
            <StreakCard streak={record.streak} />
          </div>

          {/* Talking to the companion is a bigger step than tapping a card, so
              it gets its own row rather than being buried in a grid. */}
          <div className="animate-slide-up mt-6" style={{ animationDelay: '150ms' }}>
            {chatOpen ? (
              <ChatPanel
                checkin={{ mood: record.mood, words: record.words }}
                onClose={() => setChatOpen(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="card press flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span>
                  <span className="font-display block text-xl">Want to talk about it?</span>
                  <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                    A short conversation, not a form.
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-2)]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          <section className="animate-slide-up stack-block" style={{ animationDelay: '210ms' }}>
            <p className="marginalia">When you have longer</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/inkblot-test"
                className="card press p-5"
              >
                <p className="font-display text-xl">The ten-plate inkblot</p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                  In your own words, typed or spoken. About ten minutes.
                </p>
              </Link>
              <Link
                to="/grounding"
                className="card press p-5"
              >
                <p className="font-display text-xl">Something to calm down</p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                  Thirteen practices. Most under three minutes.
                </p>
              </Link>
            </div>
          </section>

          <div className="rule-fade stack-section" />

          <p className="mt-6 pb-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
            Sahaya is a reflective prototype, not a medical device. If you feel unsafe, contact a
            local helpline or a professional.
          </p>
        </>
      )}
    </PageShell>
  );
}
