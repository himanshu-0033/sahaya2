import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// The Tests door, on Home.
//
// Twenty-one questionnaires is a good library and a bad first screen. Someone
// who has decided to take a test still has to pick one, and picking one means
// reading a filtered list of instrument acronyms — which is a research task,
// not a thirty-second decision. So this offers three, and a way past them.
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
  const [chosen, setChosen] = useState(FEATURED[0].id);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function start() {
    setOpen(false);
    navigate('/assessments/' + chosen);
  }

  const cardClass = (active) =>
    active
      ? 'press block w-full rounded-2xl border p-4 text-left transition-colors border-[var(--sec-tests)] bg-[var(--sec-tests)]/10'
      : 'press block w-full rounded-2xl border p-4 text-left transition-colors border-[var(--line-1)] bg-[var(--surface-1)] hover:bg-[var(--surface-3)]';

  const dotClass = (active) =>
    active
      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors border-[var(--sec-tests)]'
      : 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors border-[var(--line-3)]';

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
          aria-label="Choose a test"
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
                <h3 className="font-display mt-2 text-2xl leading-snug">Pick one to start.</h3>
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
                The same instruments used in clinics and research — PHQ-9, GAD-7 and nineteen
                more. Each gives a score and the range it falls in. A range is a description of a
                few weeks, not a diagnosis of you.
              </p>

              <div className="mt-4 space-y-2 pb-2" role="radiogroup" aria-label="Available tests">
                {FEATURED.map((t) => {
                  const active = t.id === chosen;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setChosen(t.id)}
                      onDoubleClick={start}
                      className={cardClass(active)}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {t.domain}
                            <span className="ml-2 text-[var(--color-muted)]">{t.name}</span>
                          </span>
                          <span className="mt-1 block text-xs text-[var(--color-ink-soft)]">
                            {t.line}
                          </span>
                          <span className="mt-1 block text-[11px] text-[var(--color-muted)]">
                            {t.meta}
                          </span>
                        </span>
                        {/* A radio dot, not a tick. A tick reads as "already
                            done", which for a list of questionnaires nobody
                            has taken yet is exactly the wrong thing to say. */}
                        <span aria-hidden="true" className={dotClass(active)}>
                          {active && <span className="h-2.5 w-2.5 rounded-full bg-[var(--sec-tests)]" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 space-y-3 p-6 pt-3">
              <button
                type="button"
                onClick={start}
                className="press w-full rounded-full bg-[var(--sec-tests)] py-3 text-sm font-medium text-[#07080a]"
              >
                Start
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
