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

// The pass is drawn as an actual ticket — two panels with a notched
// perforation between them — rather than as another rounded card with a code
// in it. It is the one thing in the app a student physically shows to another
// person, and looking like a ticket is what makes it read as valid at a
// counter. The notches are two circles in the page background colour sitting
// on the left and right edges of the seam.
function DinnerPass({ record }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[var(--color-amber)]/25"
      style={{ background: 'linear-gradient(155deg, rgba(217,165,92,0.16), rgba(21,23,27,0.92) 58%)' }}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="marginalia">Dinner pass</span>
          <span className="rounded-full border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-2.5 py-1 text-[10px] text-[var(--color-teal-dark)]">
            Valid
          </span>
        </div>
        <p className="num mt-4 text-[2.1rem] leading-none tracking-wide sm:text-[2.6rem]">
          {record.dinnerPassCode}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{formatDate(record.date)}</p>
      </div>

      {/* the seam */}
      <div className="relative h-6">
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--color-cream)]"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--color-cream)]"
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-4 left-4 border-t border-dashed border-white/15"
        />
      </div>

      <div className="px-6 pt-1 pb-6">
        <p className="text-sm text-[var(--color-ink-soft)]">
          Show this at the dining hall. Today's check-in is complete.
        </p>
      </div>
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
        <p className="mt-10 animate-pulse text-[var(--color-ink-soft)]">Loading today's pass…</p>
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

          <div className="rule-fade mt-9" />

          <div className="animate-slide-up mt-9" style={{ animationDelay: '90ms' }}>
            <DinnerPass record={record} />
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
                className="glass press lift flex w-full items-center justify-between gap-4 rounded-3xl p-5 text-left"
              >
                <span>
                  <span className="font-display block text-xl">Want to talk about it?</span>
                  <span className="mt-1 block text-sm text-[var(--color-ink-soft)]">
                    A short conversation, not a form.
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          <section className="animate-slide-up mt-10" style={{ animationDelay: '210ms' }}>
            <p className="marginalia">When you have longer</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/inkblot-test"
                className="glass lift press rounded-3xl p-5"
                style={{ borderColor: 'rgba(217,165,92,0.24)' }}
              >
                <p className="font-display text-xl">The ten-plate inkblot</p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                  In your own words, typed or spoken. About ten minutes.
                </p>
              </Link>
              <Link
                to="/grounding"
                className="glass lift press rounded-3xl p-5"
                style={{ borderColor: 'rgba(167,156,240,0.24)' }}
              >
                <p className="font-display text-xl">Something to calm down</p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                  Thirteen practices. Most under three minutes.
                </p>
              </Link>
            </div>
          </section>

          <div className="rule-fade mt-12" />

          <p className="mt-6 pb-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
            Sahaya is a reflective prototype, not a medical device. If you feel unsafe, contact a
            local helpline, your warden or a professional.
          </p>
        </>
      )}
    </PageShell>
  );
}
