import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import { useSession } from '../lib/useSession.js';
import { getStatus } from '../lib/api.js';
import { bandColor, bandTint } from '../lib/bands.js';
import { SET_IDS, clearSetResults, readSetResults } from '../lib/testSet.js';

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
  // Set only when the ten plates were taken as part of this sitting — the
  // check-in now runs straight on into them. Read once from navigation state
  // rather than fetched: this screen is about today, and a Rorschach from
  // last Tuesday is not news.
  const inkblot = location.state?.inkblot || null;
  const inkblotHelplines = location.state?.inkblotHelplines || null;

  // The three questionnaires, if they were part of this sitting. Read out of
  // sessionStorage once on mount and cleared in the same breath: this screen
  // is the end of the sitting, so the moment it has them nothing else should
  // be able to find them again and show a stale set tomorrow.
  const [testSet] = useState(() => {
    const stored = readSetResults(SET_IDS);
    const rows = SET_IDS.map((id) => stored[id]).filter(Boolean);
    if (rows.length > 0) clearSetResults(SET_IDS);
    return rows;
  });
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

          {/* The three ranges, when the questionnaires were part of this
              sitting. Side by side and never summed: low mood, worry and
              wellbeing are three separate readings, and an average of them
              would be a number no instrument defines. */}
          {testSet.length > 0 && (
            <section className="animate-slide-up stack-block" style={{ animationDelay: '190ms' }}>
              <p className="marginalia">And the three questionnaires</p>
              <div className="mt-4 space-y-3">
                {testSet.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm text-[var(--color-ink-soft)]">{r.name}</p>
                      {!r.reportsBandOnly && (
                        <p className="num text-2xl leading-none">
                          {r.score}
                          <span className="text-sm text-[var(--color-muted)]">/{r.maxScore}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className="mt-3 inline-block rounded-full px-3.5 py-1.5 text-xs"
                      style={{ background: bandTint(r.band), color: bandColor(r.band) }}
                    >
                      {r.band.label}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {r.band.note}
                    </p>
                    <Link
                      to={`/read/tests/${r.id}`}
                      className="press mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--sec-tests)]"
                    >
                      What the {r.name} can and cannot tell you
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-muted)]">
                Each score places you in a range that a published questionnaire defines. None of
                them is a diagnosis, they describe the last few weeks rather than today, and they
                can move a lot with sleep, exams and illness.
              </p>
            </section>
          )}

          {/* What the ten plates came to, when they were part of this
              sitting. Counts, not conclusions — the same line the inkblot
              screen holds, and the reason it is a card of tallies rather than
              a reading. */}
          {inkblot && (
            <section className="animate-slide-up stack-block" style={{ animationDelay: '200ms' }}>
              <p className="marginalia">And the ten plates</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card p-5">
                  <p className="marginalia">Plates answered</p>
                  <p className="num mt-2.5 text-[2.2rem] leading-none">
                    {inkblot.summary.respondedCount}
                    <span className="text-lg text-[var(--color-muted)]">
                      /{inkblot.summary.plateCount}
                    </span>
                  </p>
                </div>
                <div className="card p-5">
                  <p className="marginalia">Words written</p>
                  <p className="num mt-2.5 text-[2.2rem] leading-none">
                    {inkblot.summary.wordCount}
                  </p>
                </div>
              </div>

              {inkblot.summary.recurring.length > 0 && (
                <div className="card mt-3 p-6">
                  <p className="marginalia">Came up on more than one plate</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {inkblot.summary.recurring.map((r) => (
                      <span
                        key={r.word}
                        className="font-display rounded-full border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-1.5 text-lg"
                      >
                        {r.word}
                        <span className="tnum ml-2 font-sans text-xs text-[var(--color-muted)]">
                          ×{r.plates}
                        </span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                    These are your own words, counted — not an interpretation of them.
                  </p>
                </div>
              )}

              {inkblotHelplines && (
                <div className="mt-3 rounded-3xl border border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)] p-6">
                  <p className="text-sm leading-relaxed">
                    Something you wrote sounded heavy, and we would rather say so than let it
                    pass. If any of it is happening right now, please talk to someone who can be
                    with you.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {inkblotHelplines.map((h) => (
                      <li key={h.number} className="flex justify-between gap-4">
                        <span className="text-[var(--color-ink-soft)]">{h.name}</span>
                        <a className="text-[var(--color-teal-dark)]" href={`tel:${h.number}`}>
                          {h.number}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section className="animate-slide-up stack-block" style={{ animationDelay: '210ms' }}>
            <p className="marginalia">When you have longer</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* The inkblot tile stands down once the plates have been done
                  today. Offering "the ten-plate inkblot, about ten minutes"
                  directly under someone's own ten-plate results reads as the
                  app not having noticed. */}
              {!inkblot && (
                <Link
                  to="/inkblot-test"
                  className="card press p-5"
                >
                  <p className="font-display text-xl">The ten-plate inkblot</p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                    In your own words, typed or spoken. About ten minutes.
                  </p>
                </Link>
              )}
              {inkblot && testSet.length === 0 && (
                <Link to="/assessments" className="card press p-5">
                  <p className="font-display text-xl">The three questionnaires</p>
                  <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
                    PHQ-9, GAD-7 and WHO-5, in one sitting. About six minutes.
                  </p>
                </Link>
              )}
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
            DP Sahay AI is a reflective prototype, not a medical device. If you feel unsafe, contact a
            local helpline or a professional.
          </p>
        </>
      )}
    </PageShell>
  );
}
