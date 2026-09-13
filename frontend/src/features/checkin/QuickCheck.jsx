import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../shared/Logo.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import LoadError from '../../shared/LoadError.jsx';
import { getQuickCheck, submitQuickCheck } from '../../shared/api.js';

// The door that asks for nothing.
//
// Every other scored screen in this app sits behind a Google account, which was
// the right default for anything that gets stored and the wrong one for a first
// visit. A stranger wondering whether what they are feeling is worth taking
// seriously had to hand over an identity to find out. This is five questions
// and about a minute, with no account, and nothing kept at either end.
//
// It lives in the landing page's visual world rather than the app's, because
// that is where it is reached from and a stranger has not crossed into the app
// yet. The `.welcome` wrapper is what carries those tokens.
//
// One question on screen at a time. Five items with six options each is thirty
// tap targets, and a wall of them on a phone is the kind of thing someone in a
// bad ten minutes closes rather than finishes.

function Progress({ index, total }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === index ? 22 : 8,
            background: i <= index ? 'var(--w-accent-deep)' : 'var(--w-line-2)',
          }}
        />
      ))}
    </div>
  );
}

export default function QuickCheck() {
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getQuickCheck()
      .then((data) => setInstrument(data.instrument))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [reloadKey]);

  function choose(value) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);

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
      <header className="border-b" style={{ borderColor: 'var(--w-line)' }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <Logo size={28} glow={false} />
            <span className="font-display text-[1.15rem] leading-none">
              DP Sahay
              <span className="ml-1.5 text-[0.78em]" style={{ color: 'var(--w-accent-deep)' }}>
                AI
              </span>
            </span>
          </Link>
          <span
            className="rounded-full px-3 py-1.5 text-[0.6875rem]"
            style={{ background: 'var(--w-accent-wash)', color: 'var(--w-accent-deep)' }}
          >
            No sign-up. Nothing saved.
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        {loading && (
          <p className="animate-pulse" style={{ color: 'var(--w-ink-soft)' }}>
            Loading the questions…
          </p>
        )}

        {error && !instrument && (
          <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {/* ------------------------------------------------------ questions */}
        {instrument && !result && (
          <div>
            <p className="w-eyebrow">{instrument.fullName}</p>
            <h1
              className="font-display mt-4 text-[2rem] leading-[1.1] sm:text-[2.6rem]"
              style={{ textWrap: 'balance' }}
            >
              A minute, and no account.
            </h1>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
              Five questions about the last two weeks. Your answers are scored and shown to you,
              and then they are gone: nothing is stored here or on our server.
            </p>

            <div className="w-card mt-8 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <Progress index={index} total={instrument.items.length} />
                <span className="num text-xs" style={{ color: 'var(--w-ink-soft)' }}>
                  {index + 1} of {instrument.items.length}
                </span>
              </div>

              <p className="mt-6 text-xs" style={{ color: 'var(--w-ink-soft)' }}>
                {instrument.prompt}
              </p>
              <p
                className="font-display mt-2 text-[1.4rem] leading-snug sm:text-[1.7rem]"
                style={{ textWrap: 'pretty' }}
              >
                {item.text}
              </p>

              <div className="mt-6 grid gap-2">
                {item.options.map((option) => {
                  const selected = answers[index] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => choose(option.value)}
                      disabled={saving}
                      className="press rounded-2xl border px-4 py-3.5 text-left text-[0.9375rem] transition-colors disabled:opacity-50"
                      style={{
                        borderColor: selected ? 'var(--w-accent-deep)' : 'var(--w-line-2)',
                        background: selected ? 'var(--w-accent-wash)' : 'transparent',
                        color: selected ? 'var(--w-accent-deep)' : 'var(--w-ink)',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex(index - 1)}
                  disabled={saving}
                  className="press mt-5 text-xs underline underline-offset-4 disabled:opacity-40"
                  style={{ color: 'var(--w-ink-soft)' }}
                >
                  Back a question
                </button>
              )}

              {saving && (
                <p className="mt-5 animate-pulse text-xs" style={{ color: 'var(--w-ink-soft)' }}>
                  Scoring…
                </p>
              )}
              {error && instrument && (
                <p className="mt-5 text-xs" role="alert" style={{ color: 'var(--w-lav)' }}>
                  {error.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- result */}
        {result && (
          <div>
            <p className="w-eyebrow">{result.fullName}</p>
            <h1
              className="font-display mt-4 text-[2rem] leading-[1.1] sm:text-[2.6rem]"
              style={{ textWrap: 'balance' }}
            >
              {result.band?.label || 'Your score'}
            </h1>

            <div className="w-card mt-7 p-6 sm:p-8">
              <div className="flex items-baseline gap-3">
                <span
                  className="num text-[3.5rem] leading-none"
                  style={{ color: 'var(--w-accent-deep)' }}
                >
                  {result.score}
                </span>
                <span className="num text-lg" style={{ color: 'var(--w-ink-soft)' }}>
                  / {result.maxScore}
                </span>
              </div>

              {result.band?.note && (
                <p className="mt-5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                  {result.band.note}
                </p>
              )}

              {/* The same sentence the app says behind the login. A number
                  handed to a stranger with no context is the thing this whole
                  app is built to avoid. */}
              <p className="mt-4 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                This is a screening questionnaire, not a diagnosis. It describes the last two
                weeks rather than you, and a single sitting of it cannot tell the difference
                between a hard fortnight and something longer running.
              </p>

              <p className="mt-4 text-[0.6875rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                {result.citation}
                {result.license ? ` · ${result.license}` : ''}
              </p>
            </div>

            {/* The ask comes after the value, not before it. */}
            <div className="w-card mt-4 p-6 sm:p-8">
              <h2 className="font-display text-[1.35rem] leading-snug">Keep this, or go further</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                Nothing you just answered was saved. An account keeps your scores so you can see
                which way they move, and opens the other twenty questionnaires, the grounding
                practices and the daily check-in. Free, and you can delete all of it.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/welcome')}
                  className="press rounded-full px-7 py-3.5 text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--w-accent-deep)' }}
                >
                  Make an account
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="press rounded-full border px-7 py-3.5 text-[0.9375rem] font-medium transition-colors"
                  style={{ borderColor: 'var(--w-line-2)', color: 'var(--w-ink)' }}
                >
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
