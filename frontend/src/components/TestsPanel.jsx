import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SET_IDS, setHref, setStartHref } from '../lib/testSet.js';

// The Tests door, on Home.
//
// Twenty-one questionnaires is a good library and a bad first screen. Someone
// who has decided to take a test still has to pick one, and picking one means
// reading a filtered list of instrument acronyms — which is a research task,
// not a thirty-second decision. So this offers three, and a way past them.
//
// And it offers them as a set rather than as a choice of one. The question
// people actually arrive with is "where am I, roughly", and no single
// instrument answers it: a flat PHQ-9 with a bad GAD-7 under it is a common
// and completely different picture from either read alone. Twenty-one minutes
// of reading to work that out, or six of answering — so the button takes all
// three in one sitting, and each row is still there for anyone who only
// wanted the one.
//
// The three are the ones a person tends to arrive already half-knowing they
// want: low mood, anxiety, and — deliberately — one where a high score is the
// good news. Two negative screens and nothing else would make the panel itself
// an argument that something is wrong with you.
//
// Written out here rather than fetched from /api/assessments when it opens.
// The catalogue call needs a round trip and can fail, and a door that
// sometimes shows a spinner and sometimes an error is worse than one that
// always opens. The ids are the part that has to be right — the route loads
// the real instrument from the server, so a stale line of copy here is
// cosmetic, while a wrong id would 404.
const FEATURED = [
  {
    id: 'phq-9',
    name: 'PHQ-9',
    domain: 'Low mood',
    meta: '9 questions, about 3 minutes',
    line: 'How the last two weeks have actually been.',
  },
  {
    id: 'gad-7',
    name: 'GAD-7',
    domain: 'Anxiety',
    meta: '7 questions, about 2 minutes',
    line: 'Worry, and how much of the day it has been taking.',
  },
  {
    id: 'who-5',
    name: 'WHO-5',
    domain: 'Wellbeing',
    meta: '5 questions, about 1 minute',
    line: 'The short one, and the only one here where a high score is the good news.',
  },
];

export default function TestsPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function startSet() {
    setOpen(false);
    navigate(setStartHref(SET_IDS));
  }

  // Jumping into the middle of the set rather than out of it: someone who
  // taps GAD-7 gets GAD-7 first and is still offered the other two after,
  // which is what "I mainly want the anxiety one" usually means.
  function startAt(id) {
    setOpen(false);
    // Reordered, not truncated: the chosen one leads and the other two still
    // follow, so "I mainly want the anxiety one" costs nothing.
    navigate(setHref([id, ...SET_IDS.filter((other) => other !== id)], id));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--sec-tests)]/45 bg-[var(--sec-tests)]/10 px-3.5 py-1.5 text-xs font-medium text-[var(--sec-tests)] transition-colors hover:bg-[var(--sec-tests)]/20"
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Tests
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Take the three-test set"
        >
          {/* Header and the start button stay put; only the choices scroll, so
              the way out and the way on are both always on screen. */}
          <div
            className="glass flex max-h-[88vh] w-full max-w-md flex-col rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-3">
              <div>
                <p className="marginalia">Tests</p>
                <h3 className="font-display mt-2 text-2xl leading-snug">Three, in one sitting.</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="press -mr-1 -mt-1 shrink-0 rounded-full border border-[var(--line-2)] p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-3)]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                The same instruments used in clinics and research. These three take about six
                minutes together and cover low mood, worry and wellbeing — three things that do
                not move in step, which is why they are asked separately. Each gives a score and
                the range it falls in. A range is a description of a few weeks, not a diagnosis
                of you.
              </p>

              <ol className="mt-4 space-y-2 pb-2">
                {FEATURED.map((t, i) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => startAt(t.id)}
                      className="press block w-full rounded-2xl border border-[var(--line-1)] bg-[var(--surface-1)] p-4 text-left transition-colors hover:border-[var(--sec-tests)]/45 hover:bg-[var(--surface-3)]"
                    >
                      <span className="flex items-start gap-3">
                        {/* A position in a sequence, not a checkbox. This is a
                            running order now, and a tick or a radio dot would
                            both claim a choice is being made here. */}
                        <span
                          aria-hidden="true"
                          className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--line-3)] text-[11px] text-[var(--color-muted)]"
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {t.domain}
                            <span className="ml-2 text-[var(--color-muted)]">{t.name}</span>
                          </span>
                          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                            {t.line}
                          </span>
                          <span className="mt-1 block text-[11px] text-[var(--color-muted)]">
                            {t.meta} · tap to start here
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="shrink-0 space-y-3 p-6 pt-3">
              <button
                type="button"
                onClick={startSet}
                className="press w-full rounded-full bg-[var(--sec-tests)] py-3 text-sm font-medium text-[#07080a]"
              >
                Take all three — about 6 minutes
              </button>
              <Link
                to="/assessments"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]"
              >
                See all twenty-one
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
