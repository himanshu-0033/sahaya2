import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import Welcome from '../auth/Welcome.jsx';
import DarkAccountHero from '../auth/DarkAccountHero.jsx';
import { getSession } from '../auth/session.js';
import { getStatus, getProfile, saveProfile, getGroundingCatalog } from '../../shared/api.js';

// Home — redesigned with richer visual hierarchy.
//
// Inspired by Instagram (horizontal scrollers, visual cards, strong hierarchy)
// and Google Pay (quick-action icon grid, organized sections). The page now
// surfaces features that were buried in "More" and gives the daily check-in
// a more celebratory presence when completed.

// ─── Quick shortcuts for a bad moment ───────────────────────────────────────
const QUICK = [
  { mood: 'panic', label: 'Panicking', to: '/grounding/temperature', hue: 'var(--color-flag)', emoji: '🔥' },
  { mood: 'anxious', label: 'Anxious', to: '/grounding/cyclic-sighing', hue: 'var(--sec-home)', emoji: '💨' },
  { mood: 'spiralling', label: 'Spiralling', to: '/grounding/mental-grounding', hue: 'var(--color-amber)', emoji: '🌀' },
  { mood: 'sad', label: 'Low', to: '/grounding/self-compassion-break', hue: 'var(--color-rose)', emoji: '🌧️' },
];

// ─── Quick-action destinations (GPay-style grid) ────────────────────────────
const ACTIONS = [
  {
    to: '/grounding',
    label: 'Calm',
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
    label: 'Tests',
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
    label: 'Paths',
    hue: 'var(--sec-paths)',
    bg: 'rgba(224, 163, 213, 0.14)',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6l-6 6-6-6" />
        <path d="M18 18l-6-6-6 6" />
      </svg>
    ),
  },
  {
    to: '/read',
    label: 'Read',
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

// ─── Explore section — feature previews ──────────────────────────────────────
const EXPLORE = [
  {
    to: '/paths',
    title: 'Guided paths',
    sub: '5 paths · 5 min/day',
    hue: 'var(--sec-paths)',
    emoji: '🛤️',
  },
  {
    to: '/assessments',
    title: 'Questionnaires',
    sub: '21 clinical tools',
    hue: 'var(--sec-tests)',
    emoji: '📋',
  },
  {
    to: '/read',
    title: 'Reading',
    sub: 'Essays & research',
    hue: 'var(--sec-read)',
    emoji: '📖',
  },
  {
    to: '/inkblot-test',
    title: 'Inkblot test',
    sub: '10 plates · ~10 min',
    hue: 'var(--sec-inkblot)',
    emoji: '🎨',
  },
];

// ─── Daily sublines (rotated by date, like the plate picker) ────────────────
const SUBLINES = [
  'One quiet minute can shift the whole day.',
  "Checking in takes thirty seconds. That's it.",
  'You showed up. That matters.',
  'Small steps, steady ground.',
  'Today is its own thing.',
  'Nothing here is a test. Nothing is graded.',
  'The streak is yours. No one else sees it.',
];

function dailySubline() {
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return SUBLINES[dayOfYear % SUBLINES.length];
}

// ─── Plate thumbnails ────────────────────────────────────────────────────────
const PLATE_COUNT = 10;

function platesForDay(seedSource) {
  const seed = String(seedSource || 'today');
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let n = hash >>> 0 || 1;
  const next = () => {
    n ^= n << 13; n >>>= 0;
    n ^= n >>> 17;
    n ^= n << 5; n >>>= 0;
    return n / 4294967296;
  };
  const pool = Array.from({ length: PLATE_COUNT }, (_, i) => i + 1);
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    picked.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
  }
  return picked.map((i) => `/plates/rorschach-${String(i).padStart(2, '0')}-thumb.jpg`);
}

function PlateStrip({ seed }) {
  const plates = useMemo(() => platesForDay(seed), [seed]);
  return (
    <div className="mt-4 flex gap-2" aria-hidden="true">
      {plates.map((src) => (
        <span
          key={src}
          className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--line-1)]"
          style={{ background: '#efece5' }}
        >
          <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
        </span>
      ))}
    </div>
  );
}

// ─── Streak ring (SVG circular progress) ────────────────────────────────────
function StreakRing({ count, max = 7 }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(count / max, 1);
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center">
      <svg viewBox="0 0 64 64" width="72" height="72" className="absolute inset-0">
        <circle cx="32" cy="32" r={r} className="streak-ring-track" />
        <circle
          cx="32" cy="32" r={r}
          className="streak-ring-fill"
          stroke="var(--color-lavender)"
          strokeDasharray={circ}
          style={{
            '--ring-circ': circ,
            '--ring-offset': offset,
          }}
        />
      </svg>
      <span className="num relative text-xl font-semibold text-[var(--color-lavender)]">
        {count}
      </span>
    </div>
  );
}

// ─── Time of day helpers ────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: 'Still up', emoji: '🌙' };
  if (h < 12) return { text: 'Morning', emoji: '🌅' };
  if (h < 17) return { text: 'Afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Evening', emoji: '🌇' };
  return { text: 'Late one', emoji: '🌙' };
}

function todayDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Skeleton while loading ─────────────────────────────────────────────────
function PrimarySkeleton() {
  return (
    <div className="p-6 sm:p-8" role="status">
      <span className="sr-only">Checking whether you have checked in today…</span>
      <div aria-hidden="true">
        <div className="h-2.5 w-16 rounded-full bg-[var(--surface-4)]" />
        <div className="mt-5 h-7 w-3/4 rounded-lg bg-[var(--surface-3)]" />
        <div className="mt-3 h-7 w-1/2 rounded-lg bg-[var(--surface-3)]" />
        <div className="mt-6 h-9 w-36 rounded-full bg-[var(--surface-4)]" />
      </div>
    </div>
  );
}

// ─── Landing page ───────────────────────────────────────────────────────────
export default function Landing() {
  const [session, setSession] = useState(() => getSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState({ loading: true, checkedIn: null, record: null, error: null });
  const [streak, setStreak] = useState(0);

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
      .then((data) => setStatus({ loading: false, checkedIn: data.checkedIn, record: data.record, error: null }))
      .catch((err) => setStatus({ loading: false, checkedIn: null, record: null, error: err }));
    getGroundingCatalog()
      .then((data) => setStreak(data.streak || 0))
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

  if (!session) return <Welcome onSignedIn={setSession} />;

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
  const greet = greeting();
  const sub = dailySubline();

  return (
    <PageShell section="home">
      <Header eyebrow="Home" />

      {/* ═══════════════════════════════════════════ Hero greeting */}
      <div className="animate-slide-up stack-block">
        <p className="text-xs tracking-wide text-[var(--color-muted)]">
          {todayDate()}
        </p>
        <h1 className="font-display mt-1.5 text-[1.85rem] leading-tight sm:text-[2.4rem]">
          {greet.text}, {first}
          <span className="ml-2 inline-block" aria-hidden="true">{greet.emoji}</span>
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {sub}
        </p>
      </div>

      {/* ═══════════════════════════════════════════ Check-in card */}
      <section className="animate-slide-up card stack-block overflow-hidden p-0" style={{ animationDelay: '60ms' }}>
        {status.loading ? (
          <PrimarySkeleton />
        ) : status.checkedIn ? (
          /* ─── Done state ─── */
          <Link
            to="/results"
            state={{ record: status.record }}
            className="press block p-6 sm:p-7 checkin-card-done"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-teal)]">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="marginalia">Checked in today</span>
                </div>
                <p className="font-display mt-3 text-[1.6rem] leading-tight sm:text-[1.9rem]">
                  That's today done.
                </p>
                <p className="mt-2 max-w-md text-sm text-[var(--color-ink-soft)]">
                  Your thought for the day is still here whenever you want it.
                </p>
                <PlateStrip seed={status.record?.date} />
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-teal-dark)]">
                  See today's thought
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>

              {/* Streak ring */}
              {status.record?.streak > 0 && (
                <StreakRing count={status.record.streak} />
              )}
            </div>
          </Link>
        ) : (
          /* ─── Not checked in ─── */
          <Link
            to="/checkin"
            className="press block p-6 sm:p-8 checkin-card-active"
          >
            <span className="marginalia">Today</span>
            <p className="font-display mt-3 text-[1.9rem] leading-[1.15] sm:text-[2.5rem]">
              How is today
              <br />
              sitting?
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-soft)]">
              One tap saves the day and the streak. Everything after it is optional.
            </p>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-teal)] px-5 py-2.5 text-sm font-medium text-white">
              Start check-in
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>

            {status.error && (
              <p className="mt-4 max-w-sm text-xs leading-relaxed text-[var(--color-muted)]">
                We couldn&apos;t reach the server, so we can&apos;t tell whether today is already
                done. Opening it again is safe.
              </p>
            )}
          </Link>
        )}
      </section>

      {/* ═══════════════════════════════════════════ Quick Actions Grid */}
      <section className="animate-slide-up stack-block" style={{ animationDelay: '120ms' }}>
        <div className="quick-grid stagger">
          {ACTIONS.map((a) => (
            <Link key={a.to} to={a.to}>
              <span
                className="quick-icon"
                style={{ background: a.bg, color: a.hue }}
              >
                {a.icon}
              </span>
              <span className="text-[11px] font-medium text-[var(--color-ink-soft)]">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ Right Now — Feelings Row */}
      <section className="animate-slide-up stack-block" style={{ animationDelay: '180ms' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="home-section-title">How are you feeling?</h2>
          <Link to="/grounding" className="text-xs text-[var(--color-lavender)] underline underline-offset-4">
            See all
          </Link>
        </div>
        <div className="hscroll mt-3 flex gap-2.5 pb-1">
          {QUICK.map((q) => (
            <Link
              key={q.mood}
              to={q.to}
              className="feeling-card"
              style={{
                background: `color-mix(in srgb, ${q.hue} 8%, white)`,
                '--fc-hue': q.hue,
              }}
            >
              <span className="text-xl" aria-hidden="true">{q.emoji}</span>
              <span className="text-sm font-medium" style={{ color: q.hue }}>
                {q.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ Grounding streak badge */}
      {streak > 0 && (
        <div
          className="animate-slide-up card stack-block flex items-center gap-4 px-5 py-4"
          style={{ animationDelay: '240ms' }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-lavender-soft)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-lavender)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium">
              <span className="num text-xl text-[var(--color-lavender)]">{streak}</span>
              <span className="ml-2 text-[var(--color-ink-soft)]">
                day{streak === 1 ? '' : 's'} of grounding
              </span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">Keep it going — consistency matters most.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ Explore — Feature Cards */}
      <section className="animate-slide-up stack-section" style={{ animationDelay: '300ms' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="home-section-title">Explore</h2>
          <Link to="/more" className="text-xs text-[var(--color-lavender)] underline underline-offset-4">
            More
          </Link>
        </div>
        <div className="hscroll mt-3 flex gap-3 pb-1">
          {EXPLORE.map((e) => (
            <Link key={e.to} to={e.to} className="explore-card">
              <div className="explore-bar" style={{ background: e.hue }} />
              <div className="explore-body">
                <span className="text-2xl" aria-hidden="true">{e.emoji}</span>
                <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{e.title}</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">{e.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule-fade stack-section" />

      {/* ═══════════════════════════════════════════ Footer */}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
          DP Sahay AI is a reflective prototype, not a medical device. Nothing here is a diagnosis.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/account" className="text-[11px] text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]">
            Who can see this
          </Link>
          <Link to="/caregiver" className="text-[11px] text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]">
            Caregiver access
          </Link>
        </div>
      </footer>
    </PageShell>
  );
}
