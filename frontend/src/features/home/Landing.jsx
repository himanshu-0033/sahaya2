import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import VoiceInputButton from '../../shared/VoiceInputButton.jsx';
import StreakBadge from '../../shared/StreakBadge.jsx';
import { MOOD_HUE, MOOD_OPTIONS } from '../../shared/moods.js';
import { ASK_DP_EVENT } from '../companion/AskDP.jsx';
import DarkAccountHero from '../auth/DarkAccountHero.jsx';
import { useSession } from '../auth/useSession.js';
import { getStatus, getProfile, saveProfile, getGroundingCatalog, getPaths } from '../../shared/api.js';
import { pathPhoto } from '../../shared/photos.js';
import { accent } from '../../shared/accents.js';
import { ARTICLES } from '../read/articles.js';
import { TEST_INDEX } from '../read/testIndex.js';

// Home.
//
// Opens on one card that is the day: a greeting and the streak, "How is today,
// really?", the five moods as one row you tap, and a bar to ask DP anything.
// Four quick actions sit beside it on a laptop and under it on a phone. The
// same screen is drawn on the landing page, so the picture a stranger sees
// before signing in is the screen they get after.
//
// The two top blocks share a row on a laptop and stretch to one height. The
// layout before this put a short check-in card beside a tall column of
// shortcuts, and the difference was a screen-wide gap of nothing.

// ─── Quick shortcuts for a bad moment ───────────────────────────────────────
const QUICK = [
  {
    mood: 'panic', label: 'Panicking', to: '/grounding/temperature', hue: 'var(--color-flag)', ink: 'var(--color-flag-deep)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-5.33-4-8 4-5.33 8 0 4 8m0 0c2 2.67 4 5.33 4 8-4 5.33-8 0-4-8Z" /><path d="M12 12c-2.67 2-5.33 4-8 4-5.33-4 0-8 8-4m0 0c2.67-2 5.33-4 8-4 5.33 4 0 8-8 4Z" /></svg>,
  },
  {
    mood: 'anxious', label: 'Anxious', to: '/grounding/cyclic-sighing', hue: 'var(--sec-home)', ink: 'var(--sec-home-deep)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7A7.1 7.1 0 0 0 6.3 7.7" /><path d="M9.9 12.6a2.8 2.8 0 0 1 4.2 0" /><path d="M2 12h2M20 12h2M12 2v2M12 20v2" /></svg>,
  },
  {
    mood: 'spiralling', label: 'Spiralling', to: '/grounding/mental-grounding', hue: 'var(--color-amber)', ink: 'var(--color-amber-deep)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0" /><path d="M12 8a4 4 0 0 1 4 4" /><path d="M12 4a8 8 0 0 1 8 8" /><path d="M12 16a4 4 0 0 1-4-4" /><path d="M12 20a8 8 0 0 1-8-8" /></svg>,
  },
  {
    mood: 'sad', label: 'Low', to: '/grounding/self-compassion-break', hue: 'var(--color-rose)', ink: 'var(--color-rose-deep)',
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6M8 4v4M16 4v4" /><path d="M4 10a16 16 0 0 0 16 0" /><path d="M12 14v4M8 16v2M16 16v2" /></svg>,
  },
];

// ─── Quick-action destinations (GPay-style grid) ────────────────────────────
const ACTIONS = [
  {
    to: '/grounding',
    label: 'Grounding',
    sub: (c) => (c.streak ? `${c.streak}-day streak` : c.practices ? `${c.practices} practices` : 'For a bad ten minutes'),
    hue: 'var(--sec-calm)',
    bg: 'rgba(167, 156, 240, 0.14)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c2.5 3 4 5.4 4 7.8A4 4 0 0 1 12 15a4 4 0 0 1-4-4.2C8 8.4 9.5 6 12 3Z" />
        <path d="M5 15.5c2 0 3.5 1 3.5 2.5S7 21 5 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Zm14 0c2 0 3.5 1 3.5 2.5S21 21 19 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Z" />
      </svg>
    ),
  },
  {
    to: '/assessments',
    label: 'Questionnaires',
    sub: (c) => `${c.questionnaires} published screens`,
    hue: 'var(--sec-tests)',
    bg: 'rgba(88, 182, 245, 0.14)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    to: '/paths',
    label: 'Guided paths',
    sub: (c) => (c.paths ? `${c.paths} multi-day paths` : 'A little each day'),
    hue: 'var(--sec-paths)',
    bg: 'rgba(224, 163, 213, 0.14)',
    // A route with a start and a finish, not two chevrons meeting in the
    // middle. The old pair drew a v over a caret, which renders as an X, so
    // the one tile you tap to walk a multi-day path wore the universal symbol
    // for close.
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="19" r="2" />
        <path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" />
        <circle cx="18" cy="3" r="2" />
      </svg>
    ),
  },
  {
    to: '/read',
    label: 'Reading',
    sub: (c) => `${c.essays} short essays`,
    hue: 'var(--sec-read)',
    bg: 'rgba(143, 214, 180, 0.14)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late one';
}

// ─── The fortnight behind today ────────────────────────────────────────────
//
// Fourteen days, one mark each, coloured by the mood that was logged. The data
// was already arriving: /api/checkins returns the last fourteen check-ins and
// this screen dropped them on the floor, so the home page of a daily habit
// showed nothing at all about the habit.
//
// A missed day is a faint mark, never a red one. The app tells people on the
// paths page that missing a day loses nothing, and a wall of red would be the
// same product saying the opposite in the same week.
//
// Dates are keyed in UTC because that is how the backend keys them
// (logic.js todayISO). Building these in local time would put a student in
// India who checks in at 1am on the wrong square, and disagree with the streak
// counted beside it.
const DAY_MS = 86400000;
const utcKey = (ms) => new Date(ms).toISOString().slice(0, 10);

function Fortnight({ history, loading, checkedIn }) {
  if (loading) return null;

  const logged = new Map((history || []).map((c) => [c.date, c]));
  const today = utcKey(Date.now());
  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const key = utcKey(Date.now() - i * DAY_MS);
    days.push({ key, record: logged.get(key), isToday: key === today });
  }

  const count = days.filter((d) => d.record).length;
  if (count === 0 && !checkedIn) return null;

  return (
    <div className="mt-5 border-t border-[var(--line-1)] pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="marginalia">Last 14 days</p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          {count} {count === 1 ? 'day' : 'days'} checked in
        </p>
      </div>

      {/* One sentence for a screen reader. Fourteen separate announcements of
          "Tuesday, Steady" would be noise, and the shape is the point. */}
      <p className="sr-only">
        You have checked in on {count} of the last 14 days.
      </p>

      <ul aria-hidden="true" className="mt-2.5 flex items-end gap-[3px]">
        {days.map((d) => {
          const mood = Number(d.record?.mood ?? d.record?.moodScore) || null;
          return (
            <li
              key={d.key}
              title={d.record ? `${d.key}: ${MOOD_OPTIONS.find((m) => m.value === mood)?.label || 'checked in'}` : d.key}
              className="h-7 flex-1 rounded-[3px] transition-colors"
              style={{
                background: mood ? MOOD_HUE[mood - 1] : 'var(--surface-3)',
                opacity: mood ? 1 : 0.55,
                // Today, still open, is outlined rather than filled: it is the
                // one square the person can still change.
                boxShadow: d.isToday && !d.record ? 'inset 0 0 0 1.5px var(--color-ink-soft)' : 'none',
              }}
            />
          );
        })}
      </ul>
    </div>
  );
}

// ─── Today: the card the page is for ───────────────────────────────────────
//
// Not checked in: each mood is a link to the check-in with that mood already
// chosen. Nothing is saved from here, because the check-in screen is where the
// "who sees this" disclosure sits and a stray tap on Home should not log a day.
// Checked in: the row has nothing left to do, so today's thought takes its
// place in the same box, and the mood is named in the line under it.
function TodayCard({ name, status }) {
  const [question, setQuestion] = useState('');
  const done = Boolean(status.checkedIn);
  const todayMood = Number(status.record?.mood ?? status.record?.moodScore) || null;
  const moodLabel = MOOD_OPTIONS.find((m) => m.value === todayMood)?.label;

  const ask = (text) => {
    window.dispatchEvent(new CustomEvent(ASK_DP_EVENT, { detail: { question: text } }));
  };

  function submit(e) {
    e.preventDefault();
    ask(question.trim());
    setQuestion('');
  }

  return (
    <section className="animate-slide-up card flex flex-col p-5 sm:p-6" aria-labelledby="today-heading">
      <div className="flex items-center justify-between gap-3">
        <p className="marginalia">
          {greeting()}, {name}
        </p>
        {/* The same badge as the header on every other screen, so the streak
            looks like one thing wherever it appears. The header leaves it off
            here, so it is shown once. */}
        <StreakBadge label />
      </div>

      <h1 id="today-heading" className="font-display mt-2 text-[1.6rem] leading-tight sm:text-[2rem]">
        {done ? "That's today done." : 'How is today, really?'}
      </h1>

      {done ? (
        <>
          {status.record?.thought && (
            <div className="mt-4 rounded-2xl border border-[var(--line-1)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,27,45,0.05)] sm:px-5 sm:py-4">
              <p className="marginalia">Thought for today</p>
              <blockquote className="font-display mt-2 text-[1.1rem] leading-snug sm:text-[1.3rem]">
                <span aria-hidden="true" className="mr-1 text-[var(--color-amber)]">
                  &ldquo;
                </span>
                {status.record.thought}
              </blockquote>
            </div>
          )}
          <Link
            to="/results"
            state={{ record: status.record }}
            className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[var(--color-teal-dark)] underline-offset-4 hover:underline"
          >
            {moodLabel ? `Checked in as ${moodLabel}.` : 'Checked in.'} See the rest of today
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </>
      ) : (
        <>
          <div
            className="mt-4 grid grid-cols-5 gap-1 rounded-2xl border border-[var(--line-1)] bg-white p-2 shadow-[0_1px_2px_rgba(20,27,45,0.05)] sm:p-3"
            role="group"
            aria-label="Pick how today feels to start your check-in"
          >
            {MOOD_OPTIONS.map((m, i) => {
              const dot = (
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded-full transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10"
                  style={{ background: status.loading ? 'var(--surface-3)' : MOOD_HUE[i] }}
                />
              );
              const label = <span className="text-[0.6875rem] text-[var(--color-ink-soft)]">{m.label}</span>;
              return status.loading ? (
                <span key={m.value} className="flex flex-col items-center gap-1.5 py-1.5">
                  {dot}
                  {label}
                </span>
              ) : (
                <Link
                  key={m.value}
                  to={`/checkin?mood=${m.value}`}
                  aria-label={`${m.label}. Start today's check-in`}
                  className="press group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-[var(--surface-2)]"
                >
                  {dot}
                  {label}
                </Link>
              );
            })}
          </div>
          {status.error ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              We couldn&apos;t reach the server, so we can&apos;t tell whether today is already done.
              Opening it again is safe.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <strong className="font-semibold text-[var(--color-ink)]">Tap a mood to start your check-in.</strong>{' '}
              After that, begin the test or skip it.
            </p>
          )}
        </>
      )}

      {/* Above the spacer, so the ask bar keeps the card's bottom edge. */}
      <Fortnight history={status.history} loading={status.loading} checkedIn={done} />

      {/* Sends the question into the DP conversation rather than answering it
          here, so there is one chat with one history, not two. */}
      {/* Grows when the card is stretched beside the quick actions, so the ask
          bar sits on the card's bottom edge instead of floating mid-card. */}
      <div className="min-h-4 flex-1" aria-hidden="true" />
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-full border border-[var(--line-2)] bg-white py-1.5 pr-1.5 pl-4 transition-colors focus-within:border-[var(--color-teal)]"
      >
        <label htmlFor="home-ask" className="sr-only">
          Ask DP anything
        </label>
        <input
          id="home-ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask DP anything…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
        <VoiceInputButton size="sm" onTranscript={ask} />
        <button
          type="submit"
          aria-label="Open DP"
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal-dark)] text-white"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
  );
}

// ─── Carry on: the path already in progress ─────────────────────────────────
//
// A path is the only thing in this app that knows Tuesday followed Monday,
// and until now the only place that showed it was the Paths tab. Someone
// three days into a seven-day path had no reminder of it on the screen they
// open first, which is most of why a seven-day anything gets abandoned on
// day three.
//
// Only ever one card: the least-recently-started unfinished path. A list of
// half-finished things on the home screen is a list of ways you have already
// let yourself down.
function CarryOn({ path, progress }) {
  const { bright, deep } = accent(path.accent);
  const total = path.dayCount;
  const done = progress.completedDays.length;

  return (
    <Link
      to={`/paths/${path.id}`}
      // card-photo-side, the same shape the More page uses: this is a
      // secondary card in a wide column, and a full-width band put a 165px
      // photograph above three lines of text.
      className="press card card-photo card-photo-side mt-4 block overflow-hidden"
      style={{ '--ph-hue': bright }}
    >
      <span className="photo-head">
        <img src={pathPhoto(path.id)} alt="" loading="lazy" decoding="async" />
      </span>
      <div className="card-photo-body min-w-0 flex-1">
        <span className="marginalia" style={{ color: deep }}>Carry on</span>
        <p className="font-display mt-1.5 text-lg leading-snug">{path.name}</p>

        {/* The same pip row the Paths tab uses, so the two screens agree on
            what progress looks like. */}
        <div className="mt-3 flex flex-wrap items-center gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => i + 1).map((day) => (
            <span
              key={day}
              className="h-1.5 rounded-full"
              style={{
                width: progress.completedDays.includes(day) ? 18 : 8,
                background: progress.completedDays.includes(day) ? bright : 'var(--surface-3)',
              }}
            />
          ))}
        </div>

        <p className="mt-2.5 text-xs" style={{ color: deep }}>
          Day <span className="num">{progress.nextDay}</span> next
          <span className="text-[var(--color-muted)]">
            {' '}· <span className="num">{done}</span> of <span className="num">{total}</span> done
          </span>
        </p>
      </div>
    </Link>
  );
}

// ─── Landing page ───────────────────────────────────────────────────────────
export default function Landing() {
  const session = useSession();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState({ loading: true, checkedIn: null, record: null, streak: 0, history: [], error: null });
  // The one unfinished path, or null. Its own state rather than the whole
  // catalogue, so nothing else on this page has to know the paths exist.
  const [carryOn, setCarryOn] = useState(null);
  // Practice and path counts, and the grounding streak, for the quick actions.
  // They come off the two catalogue requests this page already makes.
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!session) return;
    setProfileLoading(true);
    setLoadError(null);
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch((err) => setLoadError(err))
      .finally(() => setProfileLoading(false));
  }, [session, reloadKey]);

  useEffect(() => {
    if (!session || !profile?.onboarded) return;
    setStatus((s) => ({ ...s, loading: true }));
    getStatus()
      .then((data) =>
        setStatus({
          loading: false,
          checkedIn: data.checkedIn,
          record: data.record,
          streak: data.streak || 0,
          // Already on the wire: /api/checkins has always returned the last
          // fourteen days and this screen threw them away.
          history: data.history || [],
          error: null,
        }),
      )
      .catch((err) => setStatus({ loading: false, checkedIn: null, record: null, streak: 0, error: err }));
    getGroundingCatalog()
      .then((data) => {
        setCounts((c) => ({ ...c, streak: data.streak || 0, practices: (data.techniques || []).length }));
      })
      .catch(() => {});
    getPaths()
      .then((data) => {
        const started = (data.progress || [])
          .filter((p) => p.startedAt && !p.finished && p.nextDay)
          .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
        const first = started[0];
        const path = first && (data.paths || []).find((p) => p.id === first.pathId);
        setCarryOn(path ? { path, progress: first } : null);
        setCounts((c) => ({ ...c, paths: (data.paths || []).length }));
      })
      .catch(() => {});
  }, [session, profile]);

  function handleCreateAccount(values) {
    setSavingProfile(true);
    setProfileError(null);
    saveProfile(values)
      .then((data) => setProfile(data.profile))
      .catch((err) => setProfileError(err.message))
      .finally(() => setSavingProfile(false));
  }

  // Signed out is its own page at its own URL, not a branch of the home
  // screen. It used to render here, which meant the sign-in screen and the
  // dashboard shared the address `/`: you could not link anyone to it, the
  // back button could not leave it, and a signed-out visit looked to the
  // browser like the same page as a signed-in one.
  if (!session) return <Navigate to="/welcome" replace />;

  if (profileLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-cream)] text-[var(--color-muted)]">
        <span className="animate-pulse">Loading your account…</span>
      </div>
    );
  }

  if (loadError && !profile) {
    return (
      <PageShell section="home">
        <Header eyebrow="Home" />
        <LoadError
          error={loadError}
          retrying={profileLoading}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </PageShell>
    );
  }

  if (!profile?.onboarded) {
    return (
      <DarkAccountHero
        name={profile?.name || session.profile.name}
        email={profile?.email || session.profile.email}
        onDone={handleCreateAccount}
        saving={savingProfile}
        error={profileError}
      />
    );
  }

  const first = profile.name.split(' ')[0];
  const questionnaires = TEST_INDEX.filter((t) => t.available).length;

  return (
    <PageShell section="home" fit>
      <Header eyebrow="Home" streak={false} />

      {/* ═══════════════════════════════════════════ Today and quick actions
          One row from the laptop breakpoint up, stretched to one height, so
          neither column ends early and leaves a hole beside the other. */}
      <div className="stack-block grid gap-3 lg:grid-cols-[1.45fr_1fr] lg:items-stretch lg:gap-5">
        <TodayCard name={first} status={status} />

        <nav aria-label="Quick actions" className="grid grid-cols-2 gap-2.5 lg:grid-rows-2 lg:gap-3">
          {ACTIONS.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className="press card animate-slide-up flex flex-col justify-between gap-4 p-4 sm:p-5"
              style={{ animationDelay: `${60 + i * 40}ms` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: a.bg, color: a.hue }}>
                {a.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                  {a.sub({ ...counts, questionnaires, essays: ARTICLES.length })}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════ Where you left off */}
      {carryOn && (
        <section className="animate-slide-up stack-block" style={{ animationDelay: '180ms' }}>
          <h2 className="home-section-title">Where you left off</h2>
          <CarryOn path={carryOn.path} progress={carryOn.progress} />
        </section>
      )}

      {/* ═══════════════════════════════════════════ Right now
          For a bad moment rather than a day: straight to the practice that
          fits. Four across on a laptop, where the row has the width. */}
      <section className="animate-slide-up stack-block" style={{ animationDelay: '220ms' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="home-section-title">Right now, I feel…</h2>
          <Link to="/grounding" className="text-xs text-[var(--sec-calm-deep)] underline underline-offset-4">
            See all
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
          {QUICK.map((q, i) => (
            <Link
              key={q.mood}
              to={q.to}
              className="feeling-card animate-pop press"
              style={{ '--fc-hue': q.hue, animationDelay: `${i * 70}ms` }}
            >
              <span className="feeling-card-wave" aria-hidden="true">
                <svg viewBox="0 0 120 48" preserveAspectRatio="none" width="100%" height="100%">
                  <path d="M0 30 C 22 10, 40 40, 62 24 S 100 8, 120 22 L120 48 L0 48 Z" fill={q.hue} opacity="0.22" />
                  <path d="M0 38 C 24 22, 44 46, 66 33 S 102 20, 120 31 L120 48 L0 48 Z" fill={q.hue} opacity="0.14" />
                </svg>
              </span>
              <span className="feeling-card-icon" aria-hidden="true" style={{ color: q.hue }}>
                {q.icon}
              </span>
              <span className="feeling-card-label" style={{ color: q.ink }}>
                {q.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule-fade stack-block" />

      {/* ═══════════════════════════════════════════ Footer */}
      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 pb-1">
        <p className="max-w-md text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
          DP Sahay AI is a reflective prototype, not a medical device. Nothing here is a diagnosis.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/account" className="text-[0.6875rem] text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]">
            Who can see this
          </Link>
          <Link to="/caregiver" className="text-[0.6875rem] text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]">
            Caregiver access
          </Link>
        </div>
      </footer>
    </PageShell>
  );
}
