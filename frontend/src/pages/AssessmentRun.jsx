import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import LoadError from '../components/LoadError.jsx';
import { useSession } from '../lib/useSession.js';
import { getAssessmentInstrument, submitAssessment } from '../lib/api.js';
import { bandColor, bandTint, describeChange, formatWhen } from '../lib/bands.js';
import { allAnswered, clearOrphans, stepsFor } from '../lib/steps.js';

const draftKey = (id) => `sahay:assessment-draft:${id}`;

// A questionnaire is a chore. The only honest way to make it lighter is to
// say true things at the right moment, so these track position rather than
// congratulating anyone for answering a question.
function encouragement(step, total, followUpPending) {
  const left = total - step;
  if (step === 0) return 'Answer with your first instinct — it is usually the accurate one.';
  if (left === 1) {
    return followUpPending ? 'Last symptom — then one short question about your days.' : 'Last one.';
  }
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
  const session = useSession();

  const [instrument, setInstrument] = useState(null);
  const [answers, setAnswers] = useState([]);
  // The unscored trailing question, kept out of `answers` so nothing that
  // counts or sums that array can pick it up.
  const [followUpAnswer, setFollowUpAnswer] = useState(null);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [helplines, setHelplines] = useState(null);
  // { level, message } — the backend decides the wording, because which
  // instrument asked and how urgent the answer was both live there.
  const [crisis, setCrisis] = useState(null);
  const [resumed, setResumed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const advanceRef = useRef(null);
  useEffect(() => () => clearTimeout(advanceRef.current), []);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getAssessmentInstrument(instrumentId)
      .then((data) => {
        const count = data.instrument.items.length;
        setInstrument(data.instrument);

        // Pick up an unfinished sitting rather than making someone restart a
        // twelve-item scale because they closed the tab.
        let restored = null;
        let restoredFollowUp = null;
        try {
          const raw = window.localStorage.getItem(draftKey(instrumentId));
          const parsed = raw ? JSON.parse(raw) : null;
          // Drafts saved before instruments could carry a follow-up are a bare
          // array; both shapes still resume.
          const saved = Array.isArray(parsed) ? { answers: parsed, followUp: null } : parsed;
          if (saved && Array.isArray(saved.answers) && saved.answers.length === count) {
            restored = saved.answers;
            restoredFollowUp = typeof saved.followUp === 'number' ? saved.followUp : null;
          }
        } catch {
          // Unreadable or unavailable storage just means a fresh start.
        }

        const next = restored || new Array(count).fill(null);
        setAnswers(next);
        setFollowUpAnswer(restoredFollowUp);
        setResumed(Boolean(restored) && next.some((a) => a !== null));
        const openSteps = stepsFor(data.instrument, next).filter(
          (st) => (st === count ? restoredFollowUp : next[st]) === null,
        );
        setStep(openSteps.length > 0 ? openSteps[0] : 0);
        setResult(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [instrumentId, session, navigate, reloadKey]);

  const submit = useCallback(
    async (finalAnswers, finalFollowUp = null) => {
      setSubmitting(true);
      setError(null);
      try {
        const data = await submitAssessment({
          instrumentId,
          answers: finalAnswers,
          followUp: finalFollowUp,
        });
        setResult(data.record);
        setPrevious(data.previous);
        setHelplines(data.helplines);
        setCrisis(data.crisis || null);
        try {
          window.localStorage.removeItem(draftKey(instrumentId));
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
      } catch (err) {
        setError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [instrumentId],
  );

  const saveDraft = useCallback(
    (draftAnswers, draftFollowUp) => {
      try {
        window.localStorage.setItem(
          draftKey(instrumentId),
          JSON.stringify({ answers: draftAnswers, followUp: draftFollowUp }),
        );
      } catch {
        // A draft that cannot be saved is not worth failing the answer over.
      }
    },
    [instrumentId],
  );

  const choose = useCallback(
    (value) => {
      if (!instrument || result) return;
      setResumed(false);

      // The follow-up lives past the last question and ends the sitting.
      if (step === instrument.items.length) {
        setFollowUpAnswer(value);
        saveDraft(answers, value);
        clearTimeout(advanceRef.current);
        advanceRef.current = setTimeout(() => {
          if (allAnswered(instrument, answers)) submit(answers, value);
        }, 240);
        return;
      }

      setAnswers((prev) => {
        const withAnswer = [...prev];
        withAnswer[step] = value;
        // Changing this answer may have closed questions that were open, or
        // opened ones that were not.
        const next = clearOrphans(instrument, withAnswer);
        saveDraft(next, followUpAnswer);

        clearTimeout(advanceRef.current);
        advanceRef.current = setTimeout(() => {
          const steps = stepsFor(instrument, next);
          const onward = steps.find((candidate) => candidate > step);
          if (onward !== undefined) setStep(onward);
          else if (allAnswered(instrument, next)) submit(next, null);
        }, 240);

        return next;
      });
    },
    [instrument, result, step, answers, followUpAnswer, saveDraft, submit],
  );

  const followUp = instrument?.followUp || null;
  const itemCount = instrument ? instrument.items.length : 0;
  const steps = useMemo(() => stepsFor(instrument, answers), [instrument, answers]);
  const needsFollowUp = steps.includes(itemCount);
  const position = steps.indexOf(step);
  const onFollowUp = step === itemCount && needsFollowUp;
  const item = onFollowUp ? followUp : instrument?.items[step];

  // An answer can close the very step you are standing on — retracting a "yes"
  // takes its follow-on questions away. Move to the next one that still
  // exists rather than rendering a question that is no longer being asked.
  const stepKey = steps.join(',');
  useEffect(() => {
    if (!instrument || steps.includes(step)) return;
    const onward = steps.find((candidate) => candidate > step);
    setStep(onward ?? steps[steps.length - 1] ?? 0);
    // stepKey stands in for `steps`, which is a fresh array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument, step, stepKey]);

  // Number keys pick an option, arrows move. Anyone filling in ten of these
  // will want them, and they cost nothing to anyone who does not.
  useEffect(() => {
    if (!instrument || result) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const options = item.options;
      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
        e.preventDefault();
        choose(options[digit - 1].value);
        return;
      }
      if (e.key === 'ArrowRight' && position >= 0 && position < steps.length - 1) {
        setStep(steps[position + 1]);
      }
      if (e.key === 'ArrowLeft' && position > 0) setStep(steps[position - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [instrument, result, item, position, steps, choose]);

  // Counted over the questions being asked, not over the array: on a form
  // that skips, "3 of 6" would be a number nobody can ever reach.
  const askedItemSteps = steps.filter((st) => st !== itemCount);
  const answered = askedItemSteps.filter((st) => answers[st] !== null).length;
  const change =
    result && !result.reportsBandOnly
      ? describeChange(result.score, previous, result.band.higherIsBetter)
      : null;

  if (!session) return null;

  const complete = instrument && allAnswered(instrument, answers);
  // One dot per step on the board, follow-up included once it is being asked.
  const dots = steps.map((st) => (st === itemCount ? followUpAnswer : answers[st]));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-x-0 top-0 h-[26rem]"
          style={{ background: 'radial-gradient(120% 100% at 50% 0%, rgba(88,182,245,0.12), transparent 70%)' }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8 md:py-12">
        {loading && <p className="stack-section text-[var(--color-ink-soft)]">Loading…</p>}
        {error && !instrument && (
          <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

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
              <Dots answers={dots} current={position} onJump={(i) => setStep(steps[i])} />
              <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                {answered} of {askedItemSteps.length} answered
              </p>
            </div>

            {resumed && (
              <p className="mt-5 rounded-xl border border-[var(--sec-tests)]/25 bg-[var(--sec-tests)]/10 px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                Picked up where you left off.
              </p>
            )}

            {/* keyed on step so the whole block re-enters on each question */}
            <div key={step} className="stack-block flex flex-1 flex-col">
              {onFollowUp ? (
                <p className="animate-rise text-xs tracking-wide text-[var(--sec-tests)]">
                  One last question — it is not scored
                </p>
              ) : (
                instrument.prompt && (
                  <p className="animate-rise text-xs tracking-wide text-[var(--color-muted)]">
                    {instrument.prompt}
                  </p>
                )
              )}

              <h1
                className={`font-display animate-rise mt-4 leading-[1.22] ${
                  onFollowUp
                    ? 'text-[1.4rem] md:text-[1.7rem]'
                    : 'text-[1.8rem] md:text-[2.25rem]'
                }`}
                style={{ animationDelay: '40ms', textWrap: 'pretty' }}
              >
                {item.text}
              </h1>

              <div className="mt-8 grid gap-2.5">
                {item.options.map((option, i) => {
                  // The follow-up's answer is held apart from `answers`, so
                  // the tick has to be read from wherever this step stores it.
                  const chosen = onFollowUp ? followUpAnswer : answers[step];
                  const selected = chosen === option.value;
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

              {error && <p className="mt-5 text-sm text-[var(--color-flag)]">{error.message}</p>}

              <p className="mt-6 text-xs leading-relaxed text-[var(--color-muted)]">
                {onFollowUp
                  ? followUp.note
                  : encouragement(position, askedItemSteps.length, needsFollowUp)}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {position > 0 && (
                  <Button
                    variant="secondary"
                    size="compact"
                    className="w-auto px-5"
                    onClick={() => setStep(steps[position - 1])}
                  >
                    Back
                  </Button>
                )}
                {complete &&
                  (needsFollowUp && !onFollowUp ? (
                    <Button size="compact" className="w-auto px-6" onClick={() => setStep(itemCount)}>
                      One last question
                    </Button>
                  ) : (
                    <Button
                      size="compact"
                      className="w-auto px-6"
                      disabled={submitting}
                      onClick={() => submit(answers, onFollowUp ? followUpAnswer : null)}
                    >
                      {submitting ? 'Scoring…' : 'See result'}
                    </Button>
                  ))}
                {/* The form itself makes this one conditional, so leaving it
                    blank has to stay a real option rather than a dead end. */}
                {complete && onFollowUp && followUpAnswer === null && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submit(answers, null)}
                    className="press text-xs text-[var(--color-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
                  >
                    Skip this one
                  </button>
                )}
              </div>
            </div>

            <footer className="stack-block flex items-center justify-between gap-4 border-t border-[var(--color-ink)]/8 pt-5">
              <p className="hidden text-[11px] text-[var(--color-muted)] sm:block">
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
              <div
                className={`rounded-3xl border p-6 ${
                  crisis?.level === 'acute'
                    ? 'border-[var(--color-flag)] bg-[var(--color-flag-soft)] ring-1 ring-[var(--color-flag)]/40'
                    : 'border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)]'
                }`}
              >
                {crisis?.level === 'acute' && (
                  <p className="font-display text-xl leading-snug text-[var(--color-flag)]">
                    Please call someone now.
                  </p>
                )}
                <p className={`text-sm leading-relaxed ${crisis?.level === 'acute' ? 'mt-3' : ''}`}>
                  {crisis?.message ||
                    'Thank you for answering honestly. Please talk to someone about that — today if you can.'}
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
                <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                  Your counsellor can see this result.
                </p>
              </div>
            )}

            <p className="marginalia stack-block block">
              {result.instrumentName}
            </p>

            <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-9">
              {/* Some scales have no total worth showing. On the C-SSRS the
                  sum genuinely misleads — two yeses at the top of the scale
                  is a milder pattern than one yes near the bottom — so it
                  reports the level and nothing that looks like a quantity. */}
              {!result.reportsBandOnly && (
                <ScoreRing
                  score={result.score}
                  maxScore={result.maxScore}
                  band={result.band}
                />
              )}

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <span
                  className={`inline-block rounded-full ${
                    result.reportsBandOnly ? 'px-5 py-2.5 text-lg' : 'px-3.5 py-1.5 text-xs'
                  }`}
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
              <div className="card mt-8 p-6">
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

            {result.followUp && (
              <div className="card mt-8 p-6">
                <p className="marginalia">Day-to-day difficulty</p>
                <p className="mt-4 text-lg leading-snug">{result.followUp.label}</p>
                <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                  {result.followUp.text}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  Printed on the {result.instrumentName} form but kept out of the total on
                  purpose. Two people can reach the same score with one of them still
                  working and the other unable to leave a room — this is the part that
                  tells them apart.
                </p>
              </div>
            )}

            <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
              A score places you in a range that a published questionnaire defines. It is not
              a diagnosis, it describes the last few weeks rather than you, and it can move a
              lot with sleep, exams and illness. Your counsellor can see this result.
            </p>

            {/* Placed on the result rather than before the questions. Nobody
                wants a methodology essay standing between them and a form,
                but the moment a number appears is exactly when "how much
                should I believe this?" becomes a live question. */}
            <Link
              to={`/read/tests/${instrumentId}`}
              className="press mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--sec-tests)]"
            >
              What the {result.instrumentName} can and cannot tell you
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

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
                  setCrisis(null);
                  setAnswers(new Array(instrument.items.length).fill(null));
                  setFollowUpAnswer(null);
                  setStep(0);
                }}
              >
                Take it again
              </Button>
            </div>
          </div>
        )}

        {instrument && (
          <p className="stack-section text-[11px] leading-relaxed text-[var(--color-muted)]">
            {instrument.fullName}. {instrument.citation}. Licence: {instrument.license}.
          </p>
        )}
      </div>
    </div>
  );
}
