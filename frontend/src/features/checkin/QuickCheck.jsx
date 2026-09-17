import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../shared/Logo.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import LoadError from '../../shared/LoadError.jsx';
import Odometer from '../../shared/Odometer.jsx';
import Tick from '../../shared/Tick.jsx';
import { getQuickCheck, submitQuickCheck } from '../../shared/api.js';

// The door that asks for nothing.
//
// Every other scored screen in this app sits behind a Google account, which was
// the right default for anything that gets stored and the wrong one for a first
// visit. A stranger wondering whether what they are feeling is worth taking
// seriously had to hand over an identity to find out. This is five questions
// and about a minute, with no account, and nothing kept at either end.
//
// It is printed on the same sheet as the landing page, which prints this
// check's first question in its first screen. Ticking an answer there arrives
// here with that answer in router state, so the check opens on question two
// with question one already ticked, and "Back a question" still reaches it.
//
// One question on screen at a time. Five items with six options each is thirty
// tap targets, and a wall of them on a phone is the kind of thing someone in a
// bad ten minutes closes rather than finishes.

// Long enough to see the tick land before the next question replaces it.
const TICK_HOLD_MS = 240;

// One box per question: filled once answered, outlined for the one on screen.
function Progress({ index, total, answered }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 border-[1.5px] transition-colors duration-150"
          style={{
            borderColor: i === index || answered[i] !== undefined ? 'var(--spot)' : 'var(--rule)',
            background: answered[i] !== undefined && i !== index ? 'var(--spot)' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

export default function QuickCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const first = location.state?.first;
  const [instrument, setInstrument] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [holding, setHolding] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getQuickCheck()
      .then((data) => {
        setInstrument(data.instrument);
        const options = data.instrument.items[0]?.options || [];
        if (options.some((o) => o.value === first) && data.instrument.items.length > 1) {
          setAnswers([first]);
          setIndex(1);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [reloadKey, first]);

  function choose(value) {
    if (holding) return;
    const next = [...answers];
    next[index] = value;
    setAnswers(next);

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      if (index < instrument.items.length - 1) {
        setIndex(index + 1);
        return;
      }
      setSaving(true);
      setError(null);
      submitQuickCheck(next)
        .then(setResult)
        .catch(setError)
        .finally(() => setSaving(false));
    }, still ? 0 : TICK_HOLD_MS);
  }

  function restart() {
    setAnswers([]);
    setIndex(0);
    setResult(null);
    setError(null);
  }

  const item = instrument?.items?.[index];

  return (
    <div className="welcome min-h-screen">
      <header className="border-b-2 border-[var(--spot)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/welcome" className="flex items-center gap-2">
            <Logo size={28} glow={false} />
            <span className="f-title text-[1.15rem] leading-none text-[var(--spot)]">
              DP Sahay
              <span className="ml-1.5 text-[0.78em]">AI</span>
            </span>
          </Link>
          <span className="border border-[var(--rule)] px-2.5 py-1 text-[0.8125rem] text-[var(--spot)]">
            No sign-up. Nothing saved.
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        {loading && (
          <p className="animate-pulse" style={{ color: 'var(--key-soft)' }}>
            Loading the questions…
          </p>
        )}

        {error && !instrument && (
          <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {/* ------------------------------------------------------ questions */}
        {instrument && !result && (
          <div>
            <h1 className="f-title text-[2rem] leading-[1.05] text-[var(--spot)] sm:text-[2.6rem]" style={{ textWrap: 'balance' }}>
              A minute, and no account.
            </h1>
            <p className="mt-4 max-w-xl text-[1rem] leading-relaxed" style={{ color: 'var(--key-soft)' }}>
              Five questions about the last two weeks. Your answers are scored and shown to you,
              and then they are gone: nothing is stored here or on our server.
            </p>

            <div className="mt-8 border-[1.5px] border-[var(--spot)]">
              <div className="f-shade flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[1.5px] border-[var(--spot)] px-4 py-2.5 sm:px-6">
                <span className="f-label">{instrument.fullName}</span>
                <span className="flex items-center gap-3">
                  <Progress index={index} total={instrument.items.length} answered={answers} />
                  <span className="f-label tnum">
                    {index + 1} of {instrument.items.length}
                  </span>
                </span>
              </div>

              {/* Keyed on the question, so a new question is a new element and
                  arrives rather than having its words swapped under the reader. */}
              <div key={index} className="q-enter px-4 pt-6 pb-5 sm:px-6">
                <p className="text-[0.9375rem]" style={{ color: 'var(--key-soft)' }}>
                  {instrument.prompt}
                </p>
                <p
                  id="quick-question"
                  className="f-title mt-2 text-[1.5rem] leading-[1.15] sm:text-[1.9rem]"
                  style={{ textWrap: 'pretty' }}
                >
                  {item.text}
                </p>
              </div>

              <ul key={`options-${index}`} role="group" aria-labelledby="quick-question" className="f-rows border-t border-[var(--rule)]">
                {item.options.map((option, j) => {
                  const selected = answers[index] === option.value;
                  return (
                    <li key={option.value} className="q-enter" style={{ '--d': `${40 + j * 30}ms` }}>
                      <button
                        type="button"
                        onClick={() => choose(option.value)}
                        disabled={saving}
                        aria-pressed={selected}
                        data-ticked={selected}
                        className="f-option flex w-full items-center gap-3.5 px-4 py-3.5 text-left text-[1rem] disabled:opacity-50 sm:px-6"
                        style={selected ? { color: 'var(--spot)' } : undefined}
                      >
                        <Tick />
                        <span className="min-w-0 flex-1">{option.label}</span>
                        <span className="tnum text-[0.8125rem]" style={{ color: 'var(--key-soft)' }} aria-hidden="true">
                          {option.value}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {(index > 0 || saving || (error && instrument)) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--rule)] px-4 py-3 sm:px-6">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => setIndex(index - 1)}
                      disabled={saving || holding}
                      className="press text-[0.875rem] underline underline-offset-4 transition-colors hover:text-[var(--spot)] disabled:opacity-40"
                      style={{ color: 'var(--key-soft)' }}
                    >
                      Back a question
                    </button>
                  )}
                  {saving && (
                    <p className="animate-pulse text-[0.875rem]" style={{ color: 'var(--key-soft)' }}>
                      Scoring…
                    </p>
                  )}
                  {error && instrument && (
                    <p className="text-[0.875rem]" role="alert" style={{ color: 'var(--alarm)' }}>
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- result */}
        {result && (
          <div>
            <p className="f-label">{result.fullName}</p>
            <h1
              className="f-title mt-3 text-[2rem] leading-[1.05] text-[var(--spot)] sm:text-[2.6rem]"
              style={{ textWrap: 'balance' }}
            >
              {result.band?.label || 'Your score'}
            </h1>

            <div className="print-feed mt-7 border-[1.5px] border-[var(--spot)]">
              <div className="flex items-end gap-3 px-5 pt-6 sm:px-7">
                <Odometer value={result.score} className="f-title text-[3rem] text-[var(--spot)]" />
                <span className="tnum pb-1 text-lg" style={{ color: 'var(--key-soft)' }}>
                  / {result.maxScore}
                </span>
              </div>

              <div className="px-5 pt-5 pb-6 sm:px-7">
                {result.band?.note && (
                  <p className="text-[1rem] leading-relaxed" style={{ color: 'var(--key)' }}>
                    {result.band.note}
                  </p>
                )}

                {/* The same sentence the app says behind the login. A number
                    handed to a stranger with no context is the thing this whole
                    app is built to avoid. */}
                <p className="mt-4 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--key-soft)' }}>
                  This is a screening questionnaire, not a diagnosis. It describes the last two
                  weeks rather than you, and a single sitting of it cannot tell the difference
                  between a hard fortnight and something longer running.
                </p>
              </div>

              <p className="border-t border-[var(--rule)] px-5 py-3 text-[0.8125rem] leading-relaxed sm:px-7" style={{ color: 'var(--key-soft)' }}>
                {result.citation}
                {result.license ? ` · ${result.license}` : ''}
              </p>
            </div>

            {/* The ask comes after the value, not before it. */}
            <div className="f-slip mt-5 p-6 sm:p-8">
              <h2 className="f-title text-[1.35rem] leading-snug">Keep this, or go further</h2>
              <p className="mt-2 text-[1rem] leading-relaxed" style={{ color: 'var(--key-soft)' }}>
                Nothing you just answered was saved. An account keeps your scores so you can see
                which way they move, and opens the other twenty questionnaires, the grounding
                practices and the daily check-in. Free, and you can delete all of it.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => navigate('/welcome')} className="f-btn">
                  Make an account
                </button>
                <button type="button" onClick={restart} className="f-btn f-btn-line">
                  Take it again
                </button>
              </div>
            </div>

            {/* Always, and not only on a low score: someone can be in trouble
                at any number on this scale, and a crisis contact that appears
                only when an algorithm decides it should is a crisis contact
                somebody had to score badly enough to earn. */}
            <div className="mt-6">
              <CrisisContacts variant="button" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
