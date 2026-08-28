import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../shared/Button.jsx';
import BreathPacer from './BreathPacer.jsx';
import VideoShelf from '../../shared/VideoShelf.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import LoadError from '../../shared/LoadError.jsx';
import { useSession } from '../auth/useSession.js';
import { getGroundingTechnique, logGroundingPractice } from '../../shared/api.js';
import { accent, alpha, EVIDENCE_LABEL, formatDuration } from '../../shared/accents.js';

// One practice, start to finish.
//
// Three screens in sequence — read it, do it, close it off — kept in one route
// because leaving mid-practice should cost one tap, not a navigation. The
// settled-rating either side is optional at both ends: someone in the middle of
// a panic attack should be able to reach the orb in two taps from the index.

const SETTLED = [
  { value: 1, label: 'Awful' },
  { value: 2, label: 'Rough' },
  { value: 3, label: 'So-so' },
  { value: 4, label: 'Alright' },
  { value: 5, label: 'Settled' },
];

function SettledPicker({ value, onChange, accentName }) {
  const { base, bright } = accent(accentName);
  return (
    <div className="flex flex-wrap gap-2">
      {SETTLED.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(selected ? null : option.value)}
            aria-pressed={selected}
            className="press rounded-full border px-4 py-2.5 text-sm transition-colors duration-200"
            style={{
              borderColor: selected ? base : 'rgba(244, 242, 238, 0.12)',
              background: selected ? alpha(base, 0.16) : 'transparent',
              color: selected ? bright : 'var(--color-ink-soft)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// The ring that drains over a step's own length. Duration is inline because
// every step is a different number of seconds.
function StepRing({ seconds, stepKey, accentName, children }) {
  const { base, bright } = accent(accentName);
  const radius = 132;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="150" cy="150" r={radius} fill="none" stroke={alpha(base, 0.14)} strokeWidth="3" />
        <circle
          key={stepKey}
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke={bright}
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-deplete"
          style={{
            '--ring-circumference': circumference,
            strokeDasharray: circumference,
            animationDuration: `${seconds}s`,
          }}
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: '62%',
          height: '62%',
          background: `radial-gradient(circle at 36% 30%, ${alpha(bright, 0.28)}, transparent 70%)`,
          filter: 'blur(6px)',
        }}
      />
      <div className="relative px-8 text-center">{children}</div>
    </div>
  );
}

function StepRunner({ steps, accentName, running, onFinish }) {
  const { bright } = accent(accentName);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!running) return undefined;
    timerRef.current = setTimeout(() => {
      if (index < steps.length - 1) setIndex(index + 1);
      else finishRef.current?.();
    }, steps[index].seconds * 1000);
    return () => clearTimeout(timerRef.current);
  }, [index, running, steps]);

  const step = steps[index];

  return (
    <div className="flex flex-col items-center">
      <StepRing seconds={step.seconds} stepKey={index} accentName={accentName}>
        <p className="num text-6xl leading-none" style={{ color: bright }}>
          {step.label}
        </p>
        {step.count ? (
          <p className="mt-2 text-[11px] tracking-wide text-[var(--color-muted)]">
            {step.count} {step.count === 1 ? 'thing' : 'things'}
          </p>
        ) : null}
      </StepRing>

      <p
        className="font-display mt-8 max-w-md text-center text-2xl leading-snug sm:text-[1.75rem]"
        style={{ textWrap: 'pretty' }}
        aria-live="polite"
      >
        {step.prompt}
      </p>
      {step.hint && (
        <p className="mt-3 max-w-sm text-center text-sm text-[var(--color-muted)]">{step.hint}</p>
      )}

      <div className="mt-8 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 24 : 6,
              background: i <= index ? bright : 'rgba(244, 242, 238, 0.14)',
            }}
          />
        ))}
      </div>

      {/* Manual override. A timed prompt that has run out of things to say is
          annoying, and a prompt you are still working on should not vanish. */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="press rounded-full border border-[var(--line-2)] px-5 py-2 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)] disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() =>
            index < steps.length - 1 ? setIndex(index + 1) : finishRef.current?.()
          }
          className="press rounded-full border border-[var(--line-2)] px-5 py-2 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)]"
        >
          {index < steps.length - 1 ? 'Next' : 'Done'}
        </button>
      </div>
    </div>
  );
}

export default function GroundingPractice() {
  const { techniqueId } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  const [technique, setTechnique] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | running | done
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const startedAt = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getGroundingTechnique(techniqueId)
      .then((data) => setTechnique(data.technique))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [techniqueId, session, navigate, reloadKey]);

  const accentName = technique?.accent;
  const colors = accent(accentName);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    completedRef.current = false;
    setPhase('running');
  }, []);

  // Reached either by the pacer/steps running out or by someone stopping early.
  // Both are recorded; `completed` is what tells them apart.
  const stop = useCallback((completed) => {
    completedRef.current = completed;
    setPhase('done');
  }, []);

  const save = useCallback(async () => {
    if (!technique) return;
    setSaving(true);
    setError(null);
    try {
      const seconds = startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0;
      const data = await logGroundingPractice({
        techniqueId: technique.id,
        secondsPracticed: seconds,
        completed: completedRef.current,
        before,
        after,
      });
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }, [technique, before, after]);

  // Escape leaves a running practice. Same reasoning as the crisis dialog:
  // nothing in this app should feel like something you are trapped inside.
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') stop(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, stop]);

  const moved = useMemo(() => {
    if (before == null || after == null) return null;
    return after - before;
  }, [before, after]);

  if (!session) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambience in the practice's own accent, so the screen changes character
          between a breath exercise and a self-compassion break. */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-x-0 top-0 h-[26rem]"
          style={{
            background: `radial-gradient(120% 100% at 50% 0%, ${alpha(colors.base, 0.14)}, transparent 70%)`,
          }}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8 md:py-12">
        {loading && !technique && (
          <p className="stack-section animate-pulse text-[var(--color-ink-soft)]">Loading…</p>
        )}
        {error && !technique && (
          <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {technique && (
          <header className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => (phase === 'running' ? stop(false) : navigate('/grounding'))}
              className="press flex items-center gap-2 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {phase === 'running' ? 'Stop' : 'All practices'}
            </button>
            <p className="marginalia">{technique.name}</p>
          </header>
        )}

        {/* ---------------------------------------------------------- intro */}
        {technique && phase === 'intro' && (
          <div className="animate-fade-up mt-8">
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{technique.name}</h1>
            {technique.aka && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{technique.aka}</p>
            )}
            {/* The one place in the app where display-role text sat in the sans
                face: a coloured tagline at text-xl, directly under a serif
                headline. Everything else this size and this prominent is set in
                Cormorant. */}
            <p className="font-display mt-5 text-xl leading-snug" style={{ color: colors.bright }}>
              {technique.tagline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1.5 text-xs"
                style={{ background: alpha(colors.base, 0.18), color: colors.bright }}
              >
                {formatDuration(technique.seconds)}
              </span>
              {technique.bestFor.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--color-ink)]/12 px-3 py-1.5 text-xs text-[var(--color-ink-soft)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Cautions come before the start button, never after it. */}
            {technique.cautions && (
              <div className="mt-6 rounded-2xl border border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)] p-5">
                <p className="marginalia" style={{ color: 'var(--color-flag)' }}>Before you start</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {technique.cautions}
                </p>
              </div>
            )}

            <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {technique.why}
            </p>

            <div className="mt-8">
              <p className="marginalia">
                How settled do you feel right now?
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Optional. It only exists so you can see whether this helped.
              </p>
              <div className="mt-4">
                <SettledPicker value={before} onChange={setBefore} accentName={accentName} />
              </div>
            </div>

            <Button className="mt-8" onClick={start}>
              Start — {formatDuration(technique.seconds)}
            </Button>

            <div className="stack-section">
              <p className="marginalia">
                Why this is in here
              </p>
              <div
                className="mt-4 rounded-2xl border p-5"
                style={{ borderColor: alpha(colors.base, 0.2) }}
              >
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px]"
                  style={{ background: alpha(colors.base, 0.18), color: colors.bright }}
                >
                  {EVIDENCE_LABEL[technique.evidence.strength]}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {technique.evidence.claim}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-muted)]">
                  {technique.evidence.citation}
                  {' · '}
                  <a
                    href={technique.evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                    style={{ color: colors.bright }}
                  >
                    source
                  </a>
                </p>
              </div>
            </div>

            <div className="stack-section">
              <VideoShelf videos={technique.videos} accentName={accentName} />
            </div>

            <footer className="stack-section flex items-center justify-between gap-4 border-t border-[var(--color-ink)]/8 pt-5">
              <p className="text-[11px] text-[var(--color-muted)]">
                A practice, not a treatment.
              </p>
              <CrisisContacts variant="link" />
            </footer>
          </div>
        )}

        {/* -------------------------------------------------------- running */}
        {technique && phase === 'running' && (
          <div className="flex flex-1 flex-col items-center justify-center py-10">
            {technique.mode === 'pacer' ? (
              <BreathPacer
                pacer={technique.pacer}
                accent={accentName}
                running
                onFinish={() => stop(true)}
              />
            ) : (
              <StepRunner
                steps={technique.steps}
                accentName={accentName}
                running
                onFinish={() => stop(true)}
              />
            )}

            <button
              type="button"
              onClick={() => stop(false)}
              className="press stack-section text-xs text-[var(--color-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
            >
              Stop here — that still counts
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------- done */}
        {technique && phase === 'done' && (
          <div className="animate-fade-up stack-block">
            <div className="relative flex justify-center py-6">
              <span
                aria-hidden="true"
                className="animate-bloom absolute h-40 w-40 rounded-full"
                style={{ background: `radial-gradient(circle, ${alpha(colors.bright, 0.5)}, transparent 68%)` }}
              />
              <p className="font-display relative text-3xl" style={{ color: colors.bright }}>
                {completedRef.current ? 'Done.' : 'That counts.'}
              </p>
            </div>

            <p className="mt-2 text-center text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {completedRef.current
                ? 'You did the whole thing. Give it a few seconds before you decide whether it worked.'
                : 'Stopping early is still practising. The next one is easier to start.'}
            </p>

            {!result && (
              <>
                <div className="stack-block">
                  <p className="marginalia">
                    How settled do you feel now?
                  </p>
                  <div className="mt-4">
                    <SettledPicker value={after} onChange={setAfter} accentName={accentName} />
                  </div>
                  {moved != null && (
                    <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
                      {moved > 0
                        ? `Up ${moved} from before you started.`
                        : moved < 0
                          ? `Down ${Math.abs(moved)}. That happens — some of these surface a feeling before they settle it.`
                          : 'No change. Worth trying a different one, or the same one for longer.'}
                    </p>
                  )}
                </div>

                {error && <p className="mt-5 text-sm text-[var(--color-flag)]">{error.message}</p>}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button className="w-auto px-6" disabled={saving} onClick={save}>
                    {saving ? 'Saving…' : 'Save this practice'}
                  </Button>
                  <Button variant="secondary" className="w-auto px-6" onClick={start}>
                    Go again
                  </Button>
                </div>
              </>
            )}

            {result && (
              <div className="card stack-block p-6 text-center">
                <p className="font-display text-2xl">
                  <span className="num">{result.streak}</span> day{result.streak === 1 ? '' : 's'} in a row
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {result.totalPractices} practice{result.totalPractices === 1 ? '' : 's'} logged in
                  total.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button className="w-auto px-6" onClick={() => navigate('/grounding')}>
                    Back to all practices
                  </Button>
                  <Button variant="secondary" className="w-auto px-6" onClick={start}>
                    Go again
                  </Button>
                </div>
              </div>
            )}

            <div className="stack-section">
              <VideoShelf
                videos={technique.videos}
                accentName={accentName}
                title="If you want a voice next time"
              />
            </div>

            <footer className="stack-section flex items-center justify-between gap-4 border-t border-[var(--color-ink)]/8 pt-5">
              <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
                DP Sahay AI records that you practised and how settled you said you felt — never a score.
              </p>
              <CrisisContacts variant="link" />
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
