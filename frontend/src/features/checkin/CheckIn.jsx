import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InkblotPlate from '../../shared/InkblotPlate.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import VoiceInputButton from '../../shared/VoiceInputButton.jsx';
import { SkeletonPanel } from '../../shared/Skeleton.jsx';
import { MOOD_HUE, MOOD_OPTIONS } from '../../shared/moods.js';
import { hasRealWord } from '../../shared/words.js';
import { useSession } from '../auth/useSession.js';
import { getInkblotTest, getStatus, submitCheckin, submitInkblotTest } from '../../shared/api.js';
import { CHECKIN_EVENT } from '../../shared/StreakBadge.jsx';
import { AFTER_CHECKIN, SET_IDS, clearSetResults, setStartHref } from '../assessments/testSet.js';

// The check-in, end to end.
//
// It used to open with three abstract blobs and a one-word box each, then ask
// for a mood. Those blobs were invented shapes, not Rorschach plates, and they
// were asking a smaller version of the question the ten real plates ask
// properly at the end of this same flow, so the sitting posed the same
// exercise twice, badly first. They are gone. What is left runs in one line:
//
//   1. mood        one tap, and the check-in is saved (day logged, streak
//                  counted) before anything longer is offered
//   2. three tests  PHQ-9, GAD-7, WHO-5, back to back (AssessmentRun owns the
//                  running of them; this page hands off and is handed back)
//   3. ten plates   the real Rorschach plates, in your own words
//   4. /results     the thought for the day, the three ranges, the plate
//                   counts, on one screen at the end
//
// Stages 2 and 3 are the test, and it is asked about once, at the mood: "Check
// in and begin the test", or "Just check in", which skips it and goes to the
// thought for the day. Past that nothing between stages asks again, because
// that is what makes it one sitting rather than four. Every stage has an exit
// that lands on the results, and stage 1 is complete and saved on its own, so
// leaving at any point costs only what has not been done.
//
// The stage lives in the query string (`?stage=plates`) rather than in state:
// the middle of the flow is a different route entirely, so coming back has to
// be addressable.

// The plates half runs on a continuous bar. Ten segments at phone width are
// hairlines, and the bar is measuring a length you work along rather than a
// short list of steps you finish.
function Rail({ value, total, hue }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--surface-4)]">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: hue }}
      />
    </div>
  );
}

// Where you are in the whole sitting. Named stages rather than a percentage,
// because "60% of a check-in" is not a thing anyone can picture and "then the
// plates" is.
function Stages({ current }) {
  const stages = ['Mood', 'Three tests', 'Ten plates'];
  return (
    <div className="mt-5">
      <div className="flex items-center gap-1.5">
        {stages.map((name, i) => (
          <span
            key={name}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i < current
                ? 'bg-[var(--color-teal)]'
                : i === current
                  ? 'bg-[var(--color-teal)]/55'
                  : 'bg-[var(--surface-4)]'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="marginalia mt-3">
        {stages[current]} · step {current + 1} of {stages.length}
      </p>
    </div>
  );
}

// The plate step no longer collects three words, and the API still wants the
// field. Three blanks is the shape it already accepts: it is exactly what
// tapping "Nothing comes to mind" three times used to send.
const NO_WORDS = ['', '', ''];

export default function CheckIn() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const onPlates = searchParams.get('stage') === 'plates';

  // Home's mood row links here as /checkin?mood=4, so the tap made there is
  // already selected. It is not saved until the button below is pressed, which
  // is where the disclosure about who sees it sits.
  const [mood, setMood] = useState(() => {
    const picked = Number(searchParams.get('mood'));
    return MOOD_OPTIONS.some((m) => m.value === picked) ? picked : null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Today's saved check-in. Held so /results can be handed it directly, and
  // re-fetched rather than threaded through the questionnaires: the sitting
  // leaves this route in the middle, and the server already knows.
  const [record, setRecord] = useState(null);
  const [plates, setPlates] = useState([]);
  const [platesError, setPlatesError] = useState(null);
  const [plateStep, setPlateStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [latencies, setLatencies] = useState({});

  // When the current plate first appeared, so we can record how long it took
  // to put anything down. Descriptive only, nothing scores off it.
  const shownAtRef = useRef(null);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  // Fetched up front on the mood step, not when the plates are needed. There
  // are three questionnaires between the two, so by the time anyone reaches a
  // plate this has long since landed, and if it never does, the mood step
  // says so before promising anything.
  useEffect(() => {
    if (!session || plates.length > 0) return;
    getInkblotTest()
      .then((data) => {
        setPlates(data.plates || []);
        setPlatesError(null);
      })
      .catch(setPlatesError);
  }, [session, plates.length]);

  // Coming back from the questionnaires is a fresh mount, so today's record
  // has to be picked back up from the server.
  useEffect(() => {
    if (!session || !onPlates || record) return;
    getStatus()
      .then((data) => {
        if (data.record) setRecord(data.record);
      })
      .catch(() => {
        // The plates stand on their own. A record we could not re-read only
        // costs the thought-for-the-day handoff, and /results re-fetches.
      });
  }, [session, onPlates, record]);

  useEffect(() => {
    if (onPlates) shownAtRef.current = Date.now();
  }, [onPlates, plateStep]);

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

  // withTest: on into the questionnaires, and the plates after them. Without
  // it the check-in is the whole sitting, and today's thought is the end of it.
  async function handleMood(withTest) {
    setSubmitting(withTest ? 'test' : 'skip');
    setError(null);
    try {
      const saved = await submitCheckin({ words: NO_WORDS, mood });
      // The streak in the top bar is the only thing outside this screen that
      // this changes, and it is mounted on every route.
      window.dispatchEvent(new Event(CHECKIN_EVENT));
      setRecord(saved);
      // The day is already saved, so what follows is time someone is
      // spending, not a form they are completing.
      // A fresh sitting, so nothing an earlier unfinished one stored can reach
      // today's results.
      clearSetResults(SET_IDS);
      if (withTest) navigate(setStartHref(SET_IDS, AFTER_CHECKIN));
      else navigate('/results', { state: { record: saved } });
    } catch (err) {
      if (err.message.includes('Create your account')) {
        navigate('/');
        return;
      }
      setError(err.message);
      setSubmitting(false);
    }
  }

  function goToThought() {
    navigate('/results', { state: { record } });
  }

  async function handlePlatesFinish() {
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
  // What is in the box for the plate on screen, and whether it is something
  // the summary can read. Typed-but-unreadable is its own state: the way on is
  // to write a word or to clear the box, never to send mash through.
  const plateText = plate ? answers[plate.id] || '' : '';
  const plateTyped = plateText.trim().length > 0;
  const plateUsable = hasRealWord(plateText);

  return (
    // No tab bar during the check-in. A row of exits along the bottom of every
    // screen is an invitation to abandon a flow halfway; the back arrow, the
    // crisis link and the explicit stop button are the ways out.
    <PageShell section="home" width="narrow" tabs={false}>
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => (onPlates ? goToThought() : navigate('/'))}
          className="press flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {onPlates ? 'Skip the plates' : 'Home'}
        </button>
        <CrisisContacts variant="link" />
      </div>

      <Stages current={onPlates ? 2 : 0} />

      {onPlates ? (
        /* ------------------------------------------------------- ten plates */
        <>
          {plates.length === 0 && !platesError && (
            <SkeletonPanel label="Preparing the plates…" height="20rem" />
          )}

          {platesError && plates.length === 0 && (
            <div className="mt-8">
              <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                The plates did not load. Today is saved and your three ranges are recorded,
                only this last part is missing.
              </p>
              <button
                type="button"
                onClick={goToThought}
                className="press mt-6 w-full rounded-[2px] bg-[var(--color-teal)] py-4 font-semibold text-white"
              >
                See today&apos;s thought
              </button>
            </div>
          )}

          {plate && (
            <div className="mt-6">
              <Rail value={plateStep + 1} total={plates.length} hue="var(--sec-inkblot)" />
              <div className="mt-3 flex items-center justify-between">
                <p className="marginalia">
                  Plate {plateStep + 1} of {plates.length}
                </p>
                <p className="marginalia">{answeredPlates} answered</p>
              </div>

              {/* The handoff, once, on the first plate. Arriving at a wall of
                  free text straight off a multiple-choice questionnaire, with
                  nothing said in between, would read as the app changing its
                  mind about what it wanted. */}
              {plateStep === 0 && (
                <div className="animate-slide-up mt-6 rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] p-5">
                  <p className="marginalia">Last part</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    The ten original Rorschach plates, in your own words, typed or spoken. No
                    options this time and nothing scored, the questionnaires asked you to pick
                    from a list, and this is the part where you get to say something they had no
                    box for. Skip any plate, and stop whenever you like.
                  </p>
                </div>
              )}

              {/* Keyed so each plate arrives rather than swapping in place. */}
              <div key={plate.id} className="mt-8 flex flex-col items-center">
                <div className="animate-slide-up card p-7 sm:p-9">
                  <InkblotPlate path={plate.path} image={plate.image} size={210} />
                </div>

                {/* Two questions, not one: what the shape looks like, and what it stirs.
                    Written out above the box, because a placeholder vanishes at the first
                    keystroke, exactly when someone wants to check what was asked. */}
                <div className="animate-slide-up mt-6 text-center" style={{ animationDelay: '80ms' }}>
                  <p className="font-display text-lg leading-snug text-[var(--color-ink)]">
                    What do you see, and what do you feel about it?
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--color-muted)]">Take your time. There are no wrong answers.</p>
                </div>

                <div
                  className="animate-slide-up mt-4 flex w-full items-start gap-2.5"
                  style={{ animationDelay: '130ms' }}
                >
                  <textarea
                    autoFocus
                    rows={3}
                    value={answers[plate.id] || ''}
                    onChange={(e) => recordText(plate.id, e.target.value)}
                    placeholder="I see… and it makes me feel…"
                    maxLength={800}
                    aria-label={`What you see and feel in plate ${plateStep + 1}`}
                    className="min-h-[3.75rem] flex-1 resize-y rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-3.5 text-base outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--sec-inkblot)]/60 focus:bg-[var(--surface-2)]"
                  />
                  <VoiceInputButton onTranscript={appendTranscript} />
                </div>

                {plateTyped && !plateUsable && (
                  <p className="mt-3 w-full text-sm text-[var(--color-ink-soft)]">
                    Use a few real words: what you see, and how it makes you feel. What is
                    written now cannot be read back to you. Clearing the box skips this plate.
                  </p>
                )}

                {error && <p className="mt-4 text-sm text-[var(--color-flag-deep)]">{error}</p>}

                <div className="mt-6 w-full">
                  {plateStep < plates.length - 1 ? (
                    <button
                      type="button"
                      disabled={plateTyped && !plateUsable}
                      onClick={() => setPlateStep((s) => s + 1)}
                      className="press w-full rounded-[2px] py-3.5 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45"
                      style={
                        plateUsable
                          ? { background: 'var(--sec-inkblot)', color: '#ffffff' }
                          : { background: 'var(--surface-2)', color: 'var(--color-ink-soft)' }
                      }
                    >
                      {plateTyped ? 'Next plate' : 'Skip this one'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePlatesFinish}
                      disabled={submitting || (plateTyped && !plateUsable)}
                      className="press w-full rounded-[2px] py-3.5 font-semibold text-white transition-colors duration-150 disabled:opacity-50"
                      style={{ background: 'var(--sec-inkblot)' }}
                    >
                      {submitting ? 'Saving…' : 'Finish'}
                    </button>
                  )}
                </div>

                {plateStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setPlateStep((s) => s - 1)}
                    className="press mt-3 w-full rounded-[2px] border border-[var(--line-2)] py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Back a plate
                  </button>
                )}

                {/* The exit. Everything before this is already saved, so
                    leaving costs nothing and pretending otherwise would be the
                    only dishonest thing on the screen. What has been typed so
                    far is dropped rather than half-filed, a three-plate
                    Rorschach is not a shorter Rorschach, it is a different
                    thing. */}
                <button
                  type="button"
                  onClick={goToThought}
                  className="press mt-3 w-full rounded-[2px] py-3 text-sm text-[var(--color-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-ink-soft)]"
                >
                  Stop here and take me to my thought for the day
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* -------------------------------------------------------------- mood */
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
          <div className="animate-slide-up mt-6 grid grid-cols-5 border border-[var(--rule)]" style={{ animationDelay: '120ms' }}>
            {MOOD_OPTIONS.map((m, i) => {
              const selected = mood === m.value;
              const hue = MOOD_HUE[i];
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  aria-pressed={selected}
                  className="press group relative flex flex-col items-center gap-2.5 border-l border-[var(--rule)] px-1 py-4 transition-colors duration-150 first:border-l-0"
                  style={{ background: selected ? `color-mix(in srgb, ${hue} 18%, white)` : 'transparent' }}
                >
                  {/* Grows by transform, not by width and height, so choosing
                      a mood never reflows the row it sits in. */}
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{
                      background: hue,
                      transform: selected ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: selected ? '0 0 0 2px #ffffff, 0 0 0 3.5px var(--spot)' : 'none',
                    }}
                  />
                  <span
                    className="text-[0.8125rem] transition-colors duration-150"
                    style={{ color: selected ? 'var(--spot)' : 'var(--color-ink-soft)', fontWeight: selected ? 600 : 400 }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* What the test is, laid out before the choice rather than
              discovered one screen at a time. Three questionnaires and ten
              plates is sixteen minutes or so, and people are entitled to know
              that while they can still decide, and to decide not to. */}
          <div className="animate-slide-up mt-8 rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] p-5" style={{ animationDelay: '180ms' }}>
            <p className="marginalia">The test, if you have the time</p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--color-ink-soft)]">
              <li className="flex gap-3">
                <span className="num shrink-0 text-[var(--color-muted)]">1</span>
                <span>
                  PHQ-9, GAD-7 and WHO-5, one after another: low mood, worry and wellbeing.
                  About six minutes.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-[var(--color-muted)]">2</span>
                <span>
                  {platesError
                    ? 'The ten inkblot plates are not available right now.'
                    : 'The ten Rorschach plates, in your own words. About ten minutes.'}
                </span>
              </li>
            </ul>
            <p className="mt-3.5 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
              Either button below saves today and counts your streak. The test is up to you: skip
              all of it here, or one test or one plate at a time, and you land on today&apos;s
              thought either way.
            </p>
          </div>

          {error && <p className="mt-5 text-sm text-[var(--color-flag-deep)]">{error}</p>}

          {/* Two ways on from the same tap: the check-in and the test, or the
              check-in alone. */}
          <div className="mt-6 grid gap-2.5">
            <button
              type="button"
              disabled={!mood || submitting}
              onClick={() => handleMood(true)}
              className="press w-full rounded-[2px] bg-[var(--color-teal)] py-4 font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]"
            >
              {submitting === 'test' ? 'Saving…' : 'Check in and begin the test'}
            </button>
            <button
              type="button"
              disabled={!mood || submitting}
              onClick={() => handleMood(false)}
              className="press w-full rounded-[2px] border border-[var(--line-3)] py-3.5 font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:text-[var(--ink-faint)]"
            >
              {submitting === 'skip' ? 'Saving…' : 'Just check in, skip the test'}
            </button>
          </div>

          {/* The check-in had no disclosure at all, which made it the only
              data-collecting flow in the app that did not have one, and the
              only one that feeds the flagging rule in backend/lib/logic.js.
              "Nobody is grading this" was true about tone and misleading about
              mechanism. This says what actually happens. */}
          <p className="mt-5 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
            Saved to your account. Your counsellor and your institution&apos;s administrator can see
            your mood, your answers and your words. Your account page shows exactly who can.
          </p>
        </div>
      )}
    </PageShell>
  );
}
