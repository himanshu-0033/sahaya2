import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InkblotPlate from '../components/InkblotPlate.jsx';
import Button from '../components/Button.jsx';
import { INKBLOTS } from '../lib/inkblots.js';
import { MOOD_OPTIONS } from '../lib/moods.js';
import { getSession } from '../lib/session.js';
import { submitCheckin } from '../lib/api.js';

const TOTAL_PLATE_STEPS = INKBLOTS.length;

export default function CheckIn() {
  const navigate = useNavigate();
  const session = getSession();
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
    if (step >= TOTAL_PLATE_STEPS) return;
    setCountdown(10);
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  if (!session) return null;

  const isPlateStep = step < TOTAL_PLATE_STEPS;
  const progress = `${Math.min(step + 1, TOTAL_PLATE_STEPS + 1)} / ${TOTAL_PLATE_STEPS + 1}`;

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
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase">{progress}</p>

        {isPlateStep ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="rounded-3xl bg-[var(--color-cream-soft)] p-8 shadow-sm">
              <InkblotPlate path={INKBLOTS[step].path} />
            </div>
            <p className="mt-6 text-sm text-[var(--color-muted)]">
              {countdown > 0 ? `Take about ${countdown}s, then type the first word` : 'Type the first word that came to mind'}
            </p>
            <input
              autoFocus
              value={words[step]}
              onChange={(e) => updateWord(e.target.value)}
              placeholder="One word…"
              className="mt-4 w-full rounded-xl border border-[var(--color-ink)]/10 bg-white px-4 py-3 text-center text-lg outline-none focus:border-[var(--color-teal)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && words[step].trim()) setStep((s) => s + 1);
              }}
            />
            <Button
              className="mt-6"
              disabled={!words[step].trim()}
              onClick={() => setStep((s) => s + 1)}
            >
              {step === TOTAL_PLATE_STEPS - 1 ? 'Continue to mood' : 'Next plate'}
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="font-display text-3xl">How does today feel, in one tap?</h2>
            <div className="mt-6 grid grid-cols-1 gap-3">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    mood === m.value
                      ? 'border-[var(--color-teal)] bg-[var(--color-teal-soft)]'
                      : 'border-[var(--color-ink)]/10 bg-white hover:border-[var(--color-teal)]/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {error && <p className="mt-4 text-sm text-[var(--color-flag)]">{error}</p>}
            <Button className="mt-8" disabled={!mood || submitting} onClick={handleFinish}>
              {submitting ? 'Saving…' : 'Finish check-in'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
