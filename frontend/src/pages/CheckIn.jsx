import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InkblotPlate from '../components/InkblotPlate.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import { INKBLOTS } from '../lib/inkblots.js';
import { MOOD_OPTIONS } from '../lib/moods.js';
import { useSession } from '../lib/useSession.js';
import { submitCheckin } from '../lib/api.js';

const TOTAL_PLATE_STEPS = INKBLOTS.length;

// The mood scale runs cool-to-warm rather than red-to-green. Green/red is the
// grammar of pass and fail, and a low mood is not a failed check-in — the
// point of the whole exercise is that any answer is a fine answer.
const MOOD_HUE = ['#8fa3b8', '#a79cf0', '#58b6f5', '#5fd6bf', '#d9a55c'];

function Rail({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--surface-4)]"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-[var(--color-teal)] transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${i < step ? 1 : i === step ? 0.45 : 0})`, transformOrigin: 'left' }}
          />
        </span>
      ))}
    </div>
  );
}

export default function CheckIn() {
  const navigate = useNavigate();
  const session = useSession();
  const [step, setStep] = useState(0); // 0..2 plates, 3 = mood
  const [words, setWords] = useState(['', '', '']);
  const [mood, setMood] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  useEffect(() => {
    if (step >= TOTAL_PLATE_STEPS) return undefined;
    setCountdown(10);
    const id = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  if (!session) return null;

  const isPlateStep = step < TOTAL_PLATE_STEPS;

  function updateWord(value) {
    setWords((w) => w.map((word, i) => (i === step ? value : word)));
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const record = await submitCheckin({ words, mood });
      navigate('/results', { state: { record } });
    } catch (err) {
      if (err.message.includes('Create your account')) {
        navigate('/');
        return;
      }
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    // No tab bar during the check-in: it is a three-step flow, and an escape
    // hatch on every tap turns a thirty-second task into an abandoned one.
    // The back arrow and the crisis link are the two ways out.
    <PageShell section="home" width="narrow" tabs={false}>
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate('/') : setStep((s) => s - 1))}
          className="press flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {step === 0 ? 'Home' : 'Back'}
        </button>
        <CrisisContacts variant="link" />
      </div>

      <div className="mt-5">
        <Rail step={step} total={TOTAL_PLATE_STEPS + 1} />
        <p className="marginalia mt-3">
          {isPlateStep ? `Plate ${step + 1} of ${TOTAL_PLATE_STEPS}` : 'Last step'}
        </p>
      </div>

      {isPlateStep ? (
        // Keyed on step so the whole block re-enters — a new plate should
        // arrive, not swap silently under a cursor that has not moved.
        <div key={step} className="mt-8 flex flex-col items-center">
          <div className="animate-slide-up card p-7 sm:p-9">
            <InkblotPlate path={INKBLOTS[step].path} />
          </div>

          <p
            className="animate-slide-up mt-6 text-center text-sm text-[var(--color-muted)]"
            style={{ animationDelay: '90ms' }}
            aria-live="polite"
          >
            {countdown > 0
              ? `Sit with it — ${countdown}s`
              : 'Now: the first word that came to mind'}
          </p>

          <input
            autoFocus
            value={words[step]}
            onChange={(e) => updateWord(e.target.value)}
            placeholder="one word…"
            aria-label={`Your word for plate ${step + 1}`}
            className="animate-slide-up font-display mt-4 w-full rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] px-5 py-4 text-center text-2xl outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--color-teal)]/60 focus:bg-[var(--surface-2)]"
            style={{ animationDelay: '140ms' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && words[step].trim()) setStep((s) => s + 1);
            }}
          />

          <button
            type="button"
            disabled={!words[step].trim()}
            onClick={() => setStep((s) => s + 1)}
            className="press animate-slide-up mt-6 w-full rounded-full bg-[var(--color-teal)] py-4 font-medium text-[#07080a] transition-all duration-200 hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]"
            style={{ animationDelay: '190ms' }}
          >
            {step === TOTAL_PLATE_STEPS - 1 ? 'Last bit — how you feel' : 'Next plate'}
          </button>

          {/* The way past a plate that brought nothing to mind.

              Without this the only exit was to type something, and what people
              actually type is keyboard mash — which is not a non-answer, it is
              a fake answer, and it goes into the same field the negative-word
              rule reads. An explicit blank is better data and a kinder screen:
              "I have got nothing today" is a real thing to be able to say.

              Deliberately NOT a row of suggested words. Handing someone a list
              of things they might be seeing decides what they see, and the
              whole premise of the plate is that the response is theirs. The
              junk came from a field that would not let you past, not from a
              shortage of vocabulary — so the fix is the exit, not a prompt. */}
          <button
            type="button"
            onClick={() => {
              updateWord('');
              setStep((s) => s + 1);
            }}
            className="press animate-slide-up mt-3 w-full rounded-full border border-[var(--line-2)] py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
            style={{ animationDelay: '220ms' }}
          >
            Nothing comes to mind
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
            There is no right answer, and a blank is a real one. Press Enter to move on.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <h1 className="font-display animate-slide-up text-[2rem] leading-tight sm:text-4xl">
            How does today
            <br />
            actually feel?
          </h1>
          <p
            className="animate-slide-up mt-3 text-sm text-[var(--color-ink-soft)]"
            style={{ animationDelay: '70ms' }}
          >
            One tap. Nobody is grading this.
          </p>

          {/* A five-stop scale rather than five stacked buttons: mood is a
              continuum, and a vertical list makes it look like five unrelated
              options. */}
          <div className="animate-slide-up mt-6 grid grid-cols-5 gap-2" style={{ animationDelay: '120ms' }}>
            {MOOD_OPTIONS.map((m, i) => {
              const selected = mood === m.value;
              const hue = MOOD_HUE[i];
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  aria-pressed={selected}
                  className="press group relative flex flex-col items-center gap-2.5 rounded-2xl border px-1 py-4 transition-all duration-300"
                  style={{
                    borderColor: selected ? hue : 'rgba(255,255,255,0.08)',
                    background: selected ? `color-mix(in srgb, ${hue} 15%, transparent)` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: selected ? 15 : 9,
                      height: selected ? 15 : 9,
                      background: hue,
                      opacity: selected ? 1 : 0.45,
                      boxShadow: selected ? `0 0 18px ${hue}` : 'none',
                    }}
                  />
                  <span
                    className="text-[11px] transition-colors duration-300"
                    style={{ color: selected ? hue : 'var(--color-muted)' }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* What they typed, played back. It makes the three plates feel like
              they added up to something rather than vanishing. */}
          <div className="mt-8">
            <p className="marginalia">You said</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {words.map((w, i) => (
                <span
                  key={i}
                  className="font-display rounded-full border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-1.5 text-lg"
                >
                  {w || '—'}
                </span>
              ))}
            </div>
          </div>

          {error && <p className="mt-5 text-sm text-[var(--color-flag)]">{error}</p>}

          <button
            type="button"
            disabled={!mood || submitting}
            onClick={handleFinish}
            className="press mt-8 w-full rounded-full bg-[var(--color-teal)] py-4 font-medium text-[#07080a] transition-all duration-200 hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]"
          >
            {submitting ? 'Saving…' : 'Finish check-in'}
          </button>

          {/* The check-in had no disclosure at all, which made it the only
              data-collecting flow in the app that did not have one — and the
              only one that feeds the flagging rule in backend/lib/logic.js.
              "Nobody is grading this" was true about tone and misleading about
              mechanism. This says what actually happens. */}
          <p className="mt-5 text-[11px] leading-relaxed text-[var(--color-muted)]">
            Saved to your account. Nobody else sees your words or your mood unless you have invited
            a counsellor to follow along — you can do that, and undo it, from your account.
          </p>
        </div>
      )}
    </PageShell>
  );
}
