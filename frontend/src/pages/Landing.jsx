import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import DarkSignInHero from '../components/DarkSignInHero.jsx';
import DarkAccountHero from '../components/DarkAccountHero.jsx';
import { getSession } from '../lib/session.js';
import { getStatus, getProfile, saveProfile, getGroundingCatalog } from '../lib/api.js';

// Home.
//
// The layout is deliberately asymmetric. An even grid of equal cards is the
// fastest way to make a product look like it was assembled rather than
// designed, and it also lies about priority — checking in and reading a
// footnote are not the same size of decision. So: one full-width primary
// action, then a 2/1 split, then a quiet row.
//
// The "right now" strip is the part that earns its place. A student in a bad
// moment should not have to navigate to a section and browse a library; three
// taps from here go straight into a practice.

const QUICK = [
  { mood: 'panic', label: 'Panicking', to: '/grounding/temperature', hue: 'var(--color-flag)' },
  { mood: 'anxious', label: 'Anxious', to: '/grounding/cyclic-sighing', hue: 'var(--sec-home)' },
  { mood: 'spiralling', label: 'Spiralling', to: '/grounding/mental-grounding', hue: 'var(--color-amber)' },
  { mood: 'sad', label: 'Low', to: '/grounding/self-compassion-break', hue: 'var(--color-rose)' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Late one';
}

export default function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [status, setStatus] = useState({ loading: false, checkedIn: false, record: null, error: null });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!session) return;
    setProfileLoading(true);
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch((err) => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  }, [session]);

  useEffect(() => {
    if (!session || !profile?.onboarded) return;
    setStatus((s) => ({ ...s, loading: true }));
    getStatus()
      .then((data) => setStatus({ loading: false, checkedIn: data.checkedIn, record: data.record, error: null }))
      .catch((err) => setStatus({ loading: false, checkedIn: false, record: null, error: err.message }));
    // The grounding streak is the one number worth putting on the home screen.
    // A failure here is not worth surfacing — it just means no streak badge.
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

  if (!session) return <DarkSignInHero onSignedIn={setSession} />;

  if (profileLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07080a] text-white/60">
        <span className="animate-pulse">Loading your account…</span>
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07080a] px-6 text-center text-red-300">
        Couldn't reach the server: {profileError}
      </div>
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

  return (
    <PageShell section="home">
      <Header eyebrow="Home" />

      {/* ---------------------------------------------------------- hero */}
      <div className="animate-slide-up mt-8">
        <p className="marginalia">{greeting()}</p>
        <h1 className="font-display mt-2 text-[2.6rem] leading-[1.05] sm:text-6xl">
          {first}
          <span className="text-[var(--color-teal)]">.</span>
        </h1>
      </div>

      {/* --------------------------------------------------- primary action */}
      <div className="animate-slide-up mt-7" style={{ animationDelay: '80ms' }}>
        {status.checkedIn ? (
          <Link
            to="/results"
            state={{ record: status.record }}
            className="glass lift press relative block overflow-hidden rounded-[28px] p-6 sm:p-7"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle, rgba(31,174,149,0.32), transparent 68%)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-teal)]">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#07080a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="marginalia">Checked in today</span>
              </div>
              <p className="font-display mt-4 text-[1.7rem] leading-tight sm:text-3xl">
                That's today done.
              </p>
              <p className="mt-2 max-w-md text-sm text-[var(--color-ink-soft)]">
                Your thought and dinner pass are still here whenever you want them.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--color-teal-dark)]">
                View today's pass
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        ) : (
          <Link
            to="/checkin"
            className="lift press relative block overflow-hidden rounded-[28px] border border-[var(--color-teal)]/30 p-6 sm:p-8"
            style={{ background: 'linear-gradient(145deg, rgba(31,174,149,0.20), rgba(21,23,27,0.86) 64%)' }}
          >
            <span
              aria-hidden="true"
              className="animate-float pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(95,214,191,0.34), transparent 66%)' }}
            />
            <div className="relative">
              <span className="marginalia">Today</span>
              <p className="font-display mt-3 text-[1.9rem] leading-[1.15] sm:text-[2.5rem]">
                Three shapes,
                <br />
                three words.
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Thirty seconds. Then your thought for the day and a dinner pass.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-teal)] px-5 py-2.5 text-sm font-medium text-[#07080a]">
                Start check-in
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* --------------------------------------------------------- right now */}
      <section className="animate-slide-up mt-10" style={{ animationDelay: '150ms' }}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Right now, I feel…</h2>
          <Link to="/grounding" className="text-xs text-[var(--color-lavender)] underline underline-offset-4">
            all 13
          </Link>
        </div>
        {/* Two columns on a phone, four on a tablet up. Straight into the
            practice — no intermediate list to read while panicking. */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK.map((q, i) => (
            <Link
              key={q.mood}
              to={q.to}
              className="press lift group relative overflow-hidden rounded-2xl border p-4"
              style={{
                animationDelay: `${180 + i * 45}ms`,
                borderColor: `color-mix(in srgb, ${q.hue} 26%, transparent)`,
                background: `linear-gradient(150deg, color-mix(in srgb, ${q.hue} 14%, transparent), rgba(21,23,27,0.8) 70%)`,
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, color-mix(in srgb, ${q.hue} 40%, transparent), transparent 70%)` }}
              />
              <span className="relative block text-sm font-medium" style={{ color: q.hue }}>
                {q.label}
              </span>
              <span className="relative mt-1 block text-[10px] text-[var(--color-muted)]">
                tap to start
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ streak */}
      {streak > 0 && (
        <div
          className="animate-slide-up relative mt-8 overflow-hidden rounded-2xl border border-[var(--color-lavender)]/25 px-5 py-4"
          style={{ animationDelay: '230ms', background: 'rgba(167,156,240,0.09)' }}
        >
          <span
            aria-hidden="true"
            className="animate-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)' }}
          />
          <p className="relative text-sm">
            <span className="num text-2xl text-[var(--color-lavender)]">{streak}</span>
            <span className="ml-2 text-[var(--color-ink-soft)]">
              day{streak === 1 ? '' : 's'} of grounding in a row.
            </span>
          </p>
        </div>
      )}

      {/* ------------------------------------------------- the 2/1 split row */}
      <div className="animate-slide-up mt-10 grid gap-3 sm:grid-cols-3" style={{ animationDelay: '280ms' }}>
        <Link
          to="/assessments"
          className="glass lift press relative overflow-hidden rounded-3xl p-5 sm:col-span-2"
          style={{ borderColor: 'rgba(88,182,245,0.24)' }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -bottom-16 h-44 w-44 rounded-full opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(88,182,245,0.26), transparent 68%)' }}
          />
          <div className="relative">
            <span className="marginalia">Tests</span>
            <p className="font-display mt-2.5 text-2xl leading-snug">
              Twenty-one questionnaires
              <br className="hidden sm:block" /> that score themselves
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-soft)]">
              The real ones — PHQ-9, GAD-7, and eighteen more. A range, never a diagnosis.
            </p>
          </div>
        </Link>

        <Link
          to="/inkblot-test"
          className="glass lift press relative overflow-hidden rounded-3xl p-5"
          style={{ borderColor: 'rgba(217,165,92,0.24)' }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(217,165,92,0.28), transparent 68%)' }}
          />
          <div className="relative">
            <span className="marginalia">Inkblot</span>
            <p className="font-display mt-2.5 text-2xl leading-snug">Ten plates</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Longer, in your own words. Typed or spoken.
            </p>
          </div>
        </Link>
      </div>

      {status.error && (
        <p className="mt-6 text-sm text-[var(--color-flag)]">
          Couldn't reach the server — you can still check in, it will save once you're back online.
        </p>
      )}

      <div className="rule-fade mt-12" />

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
          Sahaya is a reflective prototype, not a medical device. Nothing here is a diagnosis.
        </p>
        <Link to="/caregiver" className="text-[11px] text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-ink-soft)]">
          Caregiver access
        </Link>
      </footer>
    </PageShell>
  );
}
