import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InkblotPlate from '../components/InkblotPlate.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import VoiceInputButton from '../components/VoiceInputButton.jsx';
import { INKBLOTS } from '../lib/inkblots.js';
import { MOOD_OPTIONS } from '../lib/moods.js';
import { useSession } from '../lib/useSession.js';
import { getInkblotTest, submitCheckin, submitInkblotTest } from '../lib/api.js';

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

// The Rorschach half runs on its own continuous bar rather than the check-in's
// segmented rail. Ten segments at phone width are hairlines, and more to the
// point the two halves are different kinds of thing: the check-in is three
// short steps you finish, this is a length you work along.
function InkRail({ value, total }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--surface-4)]">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: 'var(--sec-inkblot)' }}
      />
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

  // The check-in and the ten plates are one sitting now: three words and a
  // mood, saved, and then the full Rorschach on the same screen without a
  // trip back to the home page in between.
  //
  // The order matters and is not arbitrary. The check-in is submitted the
  // moment the mood is confirmed, before a single plate is shown — so the day
  // is logged and the streak counted whatever happens next. Ten plates is ten
  // minutes, and a flow that only saved at the end would quietly lose the
  // thirty seconds someone had actually finished.
  const [phase, setPhase] = useState('checkin'); // 'checkin' | 'inkblot'
  const [record, setRecord] = useState(null);
  const [plates, setPlates] = useState([]);
  const [platesError, setPlatesError] = useState(null);
  const [plateStep, setPlateStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [latencies, setLatencies] = useState({});

  // When the current plate first appeared, so we can record how long it took
  // to put anything down. Descriptive only — nothing scores off it.
  const shownAtRef = useRef(null);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  useEffect(() => {
    if (step >= TOTAL_PLATE_STEPS || phase !== 'checkin') return undefined;
    setCountdown(10);
    const id = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step, phase]);

  // Fetched while the mood scale is on screen, not when the plates are needed.
  // It is the one moment in the flow with a guaranteed pause in it, and a
  // spinner between "Finish check-in" and the first plate would read as the
  // app hesitating over what it had just been told.
  useEffect(() => {
    if (!session || step < TOTAL_PLATE_STEPS || plates.length > 0) return;
    getInkblotTest()
      .then((data) => {
        setPlates(data.plates || []);
        setPlatesError(null);
      })
      .catch(setPlatesError);
  }, [session, step, plates.length]);

  useEffect(() => {
    if (phase === 'inkblot') shownAtRef.current = Date.now();
  }, [phase, plateStep]);

  const plate = plates[plateStep];

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

  const isPlateStep = step < TOTAL_PLATE_STEPS;

  function updateWord(value) {
    setWords((w) => w.map((word, i) => (i === step ? value : word)));
  }

  function goToThought(saved) {
    navigate('/results', { state: { record: saved } });
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await submitCheckin({ words, mood });
      setRecord(saved);
      // Straight on to the plates. If the catalogue never arrived, the day is
      // still saved — take them to the thought rather than to an error.
      if (plates.length > 0) {
        setPhase('inkblot');
        setSubmitting(false);
      } else {
        goToThought(saved);
      }
    } catch (err) {
      if (err.message.includes('Create your account')) {
        navigate('/');
        return;
      }
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function handleInkblotFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const responses = plates.map((p) => ({
        plateId: p.id,
        text: answers[p.id] || '',
        latencyMs: latencies[p.id] ?? null,
      }));
      const data = await submitInkblotTest({ responses });
      navigate('/results', {
        state: { record, inkblot: data.record, inkblotHelplines: data.helplines },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const answeredPlates = plates.filter((p) => (answers[p.id] || '').trim()).length;

  return (
    // No tab bar during the check-in: it is a three-step flow, and an escape
    // hatch on every tap turns a thirty-second task into an abandoned one.
    // The back arrow and the crisis link are the two ways out.
    <PageShell section="home" width="narrow" tabs={false}>
      {phase === 'inkblot' ? (
        /* ------------------------------------------------------- ten plates */
        <div className="mt-2">
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => (plateStep === 0 ? goToThought(record) : setPlateStep((s) => s - 1))}
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
            <InkRail value={plateStep + 1} total={plates.length} />
            <div className="mt-3 flex items-center justify-between">
              <p className="marginalia">
                Plate {plateStep + 1} of {plates.length}
              </p>
              <p className="marginalia">{answeredPlates} answered</p>
            </div>
          </div>

          {/* The handoff, once, on the first plate. Going from "one word" to
              ten plates of free text with nothing said in between would read
              as the app changing its mind about what it wanted. */}
          {plateStep === 0 && (
            <div className="animate-slide-up mt-6 rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] p-5">
              <p className="marginalia">Today is saved</p>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                That was the thirty seconds. What follows is the long version — the ten original
                Rorschach plates, in your own words, typed or spoken. Ten minutes if you have
                them. Skip any plate, and stop whenever you like; your thought for the day is
                waiting either way.
              </p>
            </div>
          )}

          {plate && (
            /* Keyed so each plate arrives rather than swapping in place. */
            <div key={plate.id} className="mt-8 flex flex-col items-center">
              <div className="animate-slide-up card p-7 sm:p-9">
                <InkblotPlate path={plate.path} image={plate.image} size={210} />
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
                  aria-label={`What you see in plate ${plateStep + 1}`}
                  className="min-h-[3.75rem] flex-1 resize-y rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-3.5 text-base outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--sec-inkblot)]/60 focus:bg-[var(--surface-2)]"
                />
                <VoiceInputButton onTranscript={appendTranscript} />
              </div>

              {error && <p className="mt-4 text-sm text-[var(--color-flag)]">{error}</p>}

              <div className="mt-6 w-full">
                {plateStep < plates.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setPlateStep((s) => s + 1)}
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
                    onClick={handleInkblotFinish}
                    disabled={submitting}
                    className="press w-full rounded-full py-3.5 font-medium text-[#07080a] transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'var(--sec-inkblot)' }}
                  >
                    {submitting ? 'Saving…' : 'Finish'}
                  </button>
                )}
              </div>

              {/* The exit. The check-in is already saved, so leaving here
                  costs nothing, and pretending otherwise would be the only
                  dishonest thing on the screen. What has been typed so far is
                  dropped rather than half-filed — a two-plate Rorschach is not
                  a shorter Rorschach, it is a different thing. */}
              <button
                type="button"
                onClick={() => goToThought(record)}
                className="press mt-3 w-full rounded-full border border-[var(--line-2)] py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Stop here — take me to my thought for the day
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
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

              {/* Said before the button rather than after it. "And then there
                  are ten more plates" is the kind of thing people are entitled
                  to know while they can still decide, and the check-in is
                  complete and saved at the tap above whatever happens next —
                  so the plates are genuinely optional and the screen has to
                  say so before it shows them. */}
              <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
                {platesError
                  ? 'Then your thought for the day.'
                  : 'Today is saved when you tap this. Then the ten-plate inkblot, if you have ten minutes — you can stop at any plate.'}
              </p>

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
        </>
      )}
    </PageShell>
  );
}
