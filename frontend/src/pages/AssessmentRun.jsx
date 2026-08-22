import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import { getSession } from '../lib/session.js';
import { getAssessmentInstrument, submitAssessment } from '../lib/api.js';
import { bandColor, bandTint, describeChange, formatWhen } from '../lib/bands.js';

const draftKey = (id) => `sahay:assessment-draft:${id}`;

// A questionnaire is a chore. The only honest way to make it lighter is to
// say true things at the right moment, so these track position rather than
// congratulating anyone for answering a question.
function encouragement(step, total) {
  const left = total - step;
  if (step === 0) return 'Answer with your first instinct — it is usually the accurate one.';
  if (left === 1) return 'Last one.';
  if (left <= 3) return `${left} to go.`;
  if (step / total >= 0.5) return 'Past halfway.';
  return 'No rush. You can stop and come back.';
}

function Dots({ answers, current, onJump }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {answers.map((answer, i) => {
        const state = i === current ? 'current' : answer !== null ? 'done' : 'todo';
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}`}
            aria-current={i === current}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              state === 'current'
                ? 'w-6 bg-[var(--sec-tests)]'
                : state === 'done'
                  ? 'w-1.5 bg-[var(--sec-tests)]/45 hover:bg-[var(--sec-tests)]/70'
                  : 'w-1.5 bg-[var(--color-ink)]/12 hover:bg-[var(--color-ink)]/25'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function AssessmentRun() {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [instrument, setInstrument] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [helplines, setHelplines] = useState(null);
  const [resumed, setResumed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const advanceRef = useRef(null);
  useEffect(() => () => clearTimeout(advanceRef.current), []);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    getAssessmentInstrument(instrumentId)
      .then((data) => {
        const count = data.instrument.items.length;
        setInstrument(data.instrument);

        // Pick up an unfinished sitting rather than making someone restart a
        // twelve-item scale because they closed the tab.
        let restored = null;
        try {
          const raw = window.localStorage.getItem(draftKey(instrumentId));
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed) && parsed.length === count) restored = parsed;
        } catch {
          // Unreadable or unavailable storage just means a fresh start.
        }

        const next = restored || new Array(count).fill(null);
        setAnswers(next);
        setResumed(Boolean(restored) && next.some((a) => a !== null));
        const firstGap = next.findIndex((a) => a === null);
        setStep(firstGap === -1 ? 0 : firstGap);
        setResult(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [instrumentId, session, navigate]);

  const submit = useCallback(
    async (finalAnswers) => {
      setSubmitting(true);
      setError(null);
      try {
        const data = await submitAssessment({ instrumentId, answers: finalAnswers });
        setResult(data.record);
        setPrevious(data.previous);
        setHelplines(data.helplines);
        try {
          window.localStorage.removeItem(draftKey(instrumentId));
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
    [instrumentId],
  );

  const choose = useCallback(
    (value) => {
      if (!instrument || result) return;
      setResumed(false);
      setAnswers((prev) => {
        const next = [...prev];
        next[step] = value;
        try {
          window.localStorage.setItem(draftKey(instrumentId), JSON.stringify(next));
        } catch {
          // A draft that cannot be saved is not worth failing the answer over.
        }

        clearTimeout(advanceRef.current);
        advanceRef.current = setTimeout(() => {
          if (step < next.length - 1) setStep(step + 1);
          else if (next.every((a) => a !== null)) submit(next);
        }, 240);

        return next;
      });
    },
    [instrument, result, step, instrumentId, submit],
  );

  // Number keys pick an option, arrows move. Anyone filling in ten of these
  // will want them, and they cost nothing to anyone who does not.
  useEffect(() => {
    if (!instrument || result) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const options = instrument.items[step].options;
      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
        e.preventDefault();
        choose(options[digit - 1].value);
        return;
      }
      if (e.key === 'ArrowRight' && step < instrument.items.length - 1) setStep((s) => s + 1);
      if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [instrument, result, step, choose]);

  const answered = useMemo(() => answers.filter((a) => a !== null).length, [answers]);
  const change = result
    ? describeChange(result.score, previous, result.band.higherIsBetter)
    : null;

  if (!session) return null;

  const item = instrument?.items[step];
  const complete = instrument && answered === instrument.items.length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="animate-aurora-a absolute -top-52 -left-40 h-[42rem] w-[42rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(88,182,245,0.34), transparent 64%)', filter: 'blur(80px)' }}
        />
        <div
          className="animate-aurora-b absolute -right-56 bottom-[-18rem] h-[38rem] w-[38rem] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(31,174,149,0.24), transparent 66%)', filter: 'blur(90px)' }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8 md:py-12">
        {loading && <p className="mt-16 text-[var(--color-ink-soft)]">Loading…</p>}
        {error && !instrument && <p className="mt-16 text-sm text-[var(--color-flag)]">{error}</p>}

        {/* ---------- taking it ---------- */}
        {!loading && instrument && !result && (
          <>
            <header className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/assessments')}
                className="press flex items-center gap-2 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                All tests
              </button>
              <p className="marginalia">
                {instrument.name}
              </p>
            </header>

            <div className="mt-6">
              <Dots answers={answers} current={step} onJump={setStep} />
              <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                {answered} of {instrument.items.length} answered
              </p>
            </div>

            {resumed && (
              <p className="mt-5 rounded-xl border border-[var(--sec-tests)]/25 bg-[var(--sec-tests)]/10 px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                Picked up where you left off.
              </p>
            )}

            {/* keyed on step so the whole block re-enters on each question */}
            <div key={step} className="mt-10 flex flex-1 flex-col">
              {instrument.prompt && (
                <p className="animate-rise text-xs tracking-wide text-[var(--color-muted)]">
                  {instrument.prompt}
                </p>
              )}

              <h1
                className="font-display animate-rise mt-4 text-[1.8rem] leading-[1.22] md:text-[2.25rem]"
                style={{ animationDelay: '40ms', textWrap: 'pretty' }}
              >
                {item.text}
              </h1>

              <div className="mt-8 grid gap-2.5">
                {item.options.map((option, i) => {
                  const selected = answers[step] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(option.value)}
                      style={{ animationDelay: `${110 + i * 55}ms` }}
                      className={`animate-rise press group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-[var(--sec-tests)] bg-[var(--sec-tests)]/12'
                          : 'border-white/10 bg-white/[0.03] lift hover:border-[var(--sec-tests)]/45 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] transition-colors ${
                          selected
                            ? 'border-[var(--sec-tests)] bg-[var(--sec-tests)] text-[#07080a]'
                            : 'border-[var(--color-ink)]/15 text-[var(--color-muted)] group-hover:border-[var(--color-teal)]/40'
                        }`}
                      >
                        {selected ? (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="text-base leading-snug">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {error && <p className="mt-5 text-sm text-[var(--color-flag)]">{error}</p>}

              <p className="mt-7 text-xs text-[var(--color-muted)]">
                {encouragement(step, instrument.items.length)}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {step > 0 && (
                  <Button variant="secondary" size="compact" className="w-auto px-5" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                )}
                {complete && (
                  <Button size="compact" className="w-auto px-6" disabled={submitting} onClick={() => submit(answers)}>
                    {submitting ? 'Scoring…' : 'See result'}
                  </Button>
                )}
              </div>
            </div>

            <footer className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-ink)]/8 pt-5">
              <p className="hidden text-[10px] text-[var(--color-muted)] sm:block">
                Press 1–{item.options.length} to answer · ← → to move
              </p>
              <CrisisContacts variant="link" />
            </footer>
          </>
        )}

        {/* ---------- result ---------- */}
        {result && (
          <div className="animate-fade-up">
            {helplines && (
              <div className="rounded-3xl border border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)] p-6">
                <p className="text-sm leading-relaxed">
                  You said you have had thoughts of being better off dead or of hurting
                  yourself. Thank you for answering honestly. Please talk to someone about
                  that — today if you can.
                </p>
                <ul className="mt-4 space-y-1 text-sm">
                  {helplines.map((h) => (
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

            <p className="marginalia mt-10 block">
              {result.instrumentName}
            </p>

            <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-9">
              <ScoreRing
                score={result.score}
                maxScore={result.maxScore}
                band={result.band}
              />

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <span
                  className="inline-block rounded-full px-3.5 py-1.5 text-xs"
                  style={{ background: bandTint(result.band), color: bandColor(result.band) }}
                >
                  {result.band.label}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {result.band.note}
                </p>

                {change && (
                  <p className="mt-4 text-xs text-[var(--color-muted)]">
                    <span
                      className={
                        change.tone === 'better'
                          ? 'text-[var(--color-teal-dark)]'
                          : change.tone === 'worse'
                            ? 'text-[var(--color-flag)]'
                            : ''
                      }
                    >
                      {change.label}
                    </span>{' '}
                    since {formatWhen(previous.createdAt)} — you were {previous.band.label.toLowerCase()} then.
                  </p>
                )}
              </div>
            </div>

            {result.subscales && (
              <div className="glass mt-9 rounded-3xl p-6">
                <p className="marginalia">
                  Where the support comes from
                </p>
                <div className="mt-5 space-y-4">
                  {result.subscales.map((sub) => (
                    <div key={sub.label}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm">{sub.label}</span>
                        <span className="text-sm text-[var(--color-muted)]">
                          {sub.score}
                          <span className="text-xs">/{sub.maxScore}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[var(--sec-tests)] transition-[width] duration-700 ease-out"
                          style={{ width: `${Math.round((sub.score / sub.maxScore) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-[var(--color-muted)]">
                  A steady total can still hide one thin strand — that is what these three
                  are for.
                </p>
              </div>
            )}

            <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
              A score places you in a range that a published questionnaire defines. It is not
              a diagnosis, it describes the last few weeks rather than you, and it can move a
              lot with sleep, exams and illness. Your counsellor can see this result.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="w-auto px-6" onClick={() => navigate('/assessments')}>
                Back to all tests
              </Button>
              <Button
                variant="secondary"
                className="w-auto px-6"
                onClick={() => {
                  setResult(null);
                  setPrevious(null);
                  setHelplines(null);
                  setAnswers(new Array(instrument.items.length).fill(null));
                  setStep(0);
                }}
              >
                Take it again
              </Button>
            </div>
          </div>
        )}

        {instrument && (
          <p className="mt-12 text-[10px] leading-relaxed text-[var(--color-muted)]">
            {instrument.fullName}. {instrument.citation}. Licence: {instrument.license}.
          </p>
        )}
      </div>
    </div>
  );
}
