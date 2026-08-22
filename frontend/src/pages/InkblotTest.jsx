import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import InkblotPlate from '../components/InkblotPlate.jsx';
import VoiceInputButton from '../components/VoiceInputButton.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import LoadError from '../components/LoadError.jsx';
import { useSession } from '../lib/useSession.js';
import { getInkblotTest, submitInkblotTest } from '../lib/api.js';

// Ten plates of free text.
//
// The presentation problem here is different from the rest of the app: this
// screen has to feel unhurried. Every other flow nudges toward completion —
// timers, progress rails, auto-advance. Here the whole value is in someone
// sitting with an image long enough to say something true about it, so the
// chrome is deliberately quiet and nothing counts down.

function Rail({ value, total }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: 'var(--sec-inkblot)' }}
      />
    </div>
  );
}

// The plate sits on its own pedestal with a warm bloom behind it. Without the
// bloom a black shape on a black page has no presence at all.
function Pedestal({ path, size }) {
  return (
    <div className="card p-7 sm:p-9">
      <InkblotPlate path={path} size={size} />
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div className="card p-5">
      <p className="marginalia">{label}</p>
      <p className="num mt-2.5 text-[2.2rem] leading-none">
        {value}
        {suffix && <span className="text-lg text-[var(--color-muted)]">{suffix}</span>}
      </p>
    </div>
  );
}

export default function InkblotTest() {
  const navigate = useNavigate();
  const session = useSession();

  const [phase, setPhase] = useState('intro');
  const [plates, setPlates] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [latencies, setLatencies] = useState({});
  const [result, setResult] = useState(null);
  const [helplines, setHelplines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // When the current plate first appeared, so we can record how long it took
  // to put anything down. Descriptive only — nothing scores off it.
  const shownAtRef = useRef(null);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getInkblotTest()
      .then((data) => setPlates(data.plates || []))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, navigate, reloadKey]);

  useEffect(() => {
    if (phase === 'test') shownAtRef.current = Date.now();
  }, [phase, step]);

  const plate = plates[step];

  const recordText = useCallback((plateId, text) => {
    setAnswers((prev) => ({ ...prev, [plateId]: text }));
    setLatencies((prev) => {
      if (prev[plateId] != null || !shownAtRef.current) return prev;
      return { ...prev, [plateId]: Date.now() - shownAtRef.current };
    });
  }, []);

  const appendTranscript = useCallback(
    (transcript) => {
      if (!plate) return;
      const existing = answers[plate.id] || '';
      recordText(plate.id, existing ? `${existing} ${transcript}` : transcript);
    },
    [plate, answers, recordText],
  );

  if (!session) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const responses = plates.map((p) => ({
        plateId: p.id,
        text: answers[p.id] || '',
        latencyMs: latencies[p.id] ?? null,
      }));
      const data = await submitInkblotTest({ responses });
      setResult(data.record);
      setHelplines(data.helplines);
      setPhase('done');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const answered = plates.filter((p) => (answers[p.id] || '').trim()).length;

  return (
    // The tab bar disappears once the sitting starts. Ten plates is a
    // commitment, and a row of exits along the bottom of every plate is an
    // invitation to abandon it halfway.
    <PageShell section="inkblot" tabs={phase !== 'test'}>
      {phase !== 'test' && <Header eyebrow="Inkblot" />}

      {loading && plates.length === 0 && (
        <p className="stack-block animate-pulse text-[var(--color-ink-soft)]">Preparing the plates…</p>
      )}
      {error && plates.length === 0 && (
        <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {/* ------------------------------------------------------------ intro */}
      {!loading && phase === 'intro' && (
        <div className="animate-slide-up mt-8">
          <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
            Ten plates. Say whatever you see
            <span className="text-[var(--sec-inkblot)]">.</span>
          </h1>

          <div className="mt-6 flex justify-center py-4 sm:justify-start">
            {plates[0] && <Pedestal path={plates[0].path} size={150} />}
          </div>

          <div className="mt-6 max-w-lg space-y-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            <p>
              Ten abstract inkblots, one at a time. For each, write or say what it looks like to
              you. There is no right answer and nothing to get through quickly — most people take
              ten to fifteen minutes.
            </p>
            <p>You can skip any plate, and you can say more than one thing about a plate.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="marginalia">What this is not</p>
            <p className="mt-2.5 text-xs leading-relaxed text-[var(--color-muted)]">
              Sahaya keeps what you write and shows it to your counsellor alongside your check-ins.
              It does <span className="text-[var(--color-ink-soft)]">not</span> score your answers:
              a real Rorschach is administered and coded by a trained clinician, and this is a
              reflective exercise, not a clinical assessment or a diagnosis.
            </p>
          </div>

          {error && plates.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-flag)]">{error.message}</p>
          )}

          <button
            type="button"
            onClick={() => setPhase('test')}
            disabled={!plates.length}
            className="press mt-8 w-full rounded-full py-4 font-medium text-[#07080a] transition-all duration-200 disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/30"
            style={plates.length ? { background: 'var(--sec-inkblot)' } : undefined}
          >
            Begin — ten plates
          </button>

          <div className="mt-6 text-center">
            <CrisisContacts variant="link" />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- test */}
      {!loading && phase === 'test' && plate && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => (step === 0 ? setPhase('intro') : setStep((s) => s - 1))}
              className="press flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <CrisisContacts variant="link" />
          </div>

          <div className="mt-5">
            <Rail value={step + 1} total={plates.length} />
            <div className="mt-3 flex items-center justify-between">
              <p className="marginalia">
                Plate {step + 1} of {plates.length}
              </p>
              <p className="marginalia">{answered} answered</p>
            </div>
          </div>

          {/* Keyed so each plate arrives rather than swapping in place. */}
          <div key={plate.id} className="mt-8 flex flex-col items-center">
            <div className="animate-slide-up">
              <Pedestal path={plate.path} size={230} />
            </div>

            <p
              className="animate-slide-up mt-6 text-center text-sm text-[var(--color-muted)]"
              style={{ animationDelay: '80ms' }}
            >
              Take your time. There are no wrong answers.
            </p>

            <div
              className="animate-slide-up mt-4 flex w-full items-start gap-2.5"
              style={{ animationDelay: '130ms' }}
            >
              <textarea
                autoFocus
                rows={3}
                value={answers[plate.id] || ''}
                onChange={(e) => recordText(plate.id, e.target.value)}
                placeholder="What do you see?"
                maxLength={800}
                aria-label={`What you see in plate ${step + 1}`}
                className="min-h-[3.75rem] flex-1 resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base outline-none transition-colors placeholder:text-white/25 focus:border-[var(--sec-inkblot)]/60 focus:bg-white/[0.05]"
              />
              <VoiceInputButton onTranscript={appendTranscript} />
            </div>

            {error && <p className="mt-4 text-sm text-[var(--color-flag)]">{error.message}</p>}

            <div className="mt-6 w-full">
              {step < plates.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="press w-full rounded-full py-3.5 font-medium transition-all duration-200"
                  style={
                    answers[plate.id]?.trim()
                      ? { background: 'var(--sec-inkblot)', color: '#07080a' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'var(--color-ink-soft)' }
                  }
                >
                  {answers[plate.id]?.trim() ? 'Next plate' : 'Skip this one'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="press w-full rounded-full py-3.5 font-medium text-[#07080a] transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'var(--sec-inkblot)' }}
                >
                  {submitting ? 'Saving…' : 'Finish'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- done */}
      {!loading && phase === 'done' && result && (
        <div className="animate-slide-up mt-8">
          {helplines && (
            <div className="rounded-3xl border border-[var(--color-flag)]/30 bg-[var(--color-flag-soft)] p-6">
              <p className="text-sm leading-relaxed">
                Something you wrote sounded heavy, and we would rather say so than let it pass. If
                any of it is happening right now, please talk to someone who can be with you.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm">
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

          <h1 className="font-display mt-8 text-[2.2rem] leading-tight sm:text-4xl">
            What you noticed
          </h1>
          <p className="mt-3 max-w-md text-sm text-[var(--color-ink-soft)]">
            Counts, not conclusions. Nothing here is an interpretation of what you wrote.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat
              label="Plates answered"
              value={result.summary.respondedCount}
              suffix={`/${result.summary.plateCount}`}
            />
            <Stat label="Words written" value={result.summary.wordCount} />
          </div>

          {result.summary.recurring.length > 0 && (
            <div className="card mt-3 p-6">
              <p className="marginalia">Came up on more than one plate</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.summary.recurring.map((r) => (
                  <span
                    key={r.word}
                    className="font-display rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-lg"
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

          <button
            type="button"
            onClick={() => navigate('/')}
            className="press mt-8 w-full rounded-full py-4 font-medium text-[#07080a]"
            style={{ background: 'var(--sec-inkblot)' }}
          >
            Done
          </button>
        </div>
      )}
    </PageShell>
  );
}
