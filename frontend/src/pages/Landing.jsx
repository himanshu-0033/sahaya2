import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import LoadError from '../components/LoadError.jsx';
import DarkSignInHero from '../components/DarkSignInHero.jsx';
import DarkAccountHero from '../components/DarkAccountHero.jsx';
import HomeAssistant from '../components/HomeAssistant.jsx';
import TestsPanel from '../components/TestsPanel.jsx';
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

// The primary card while we do not yet know whether today has been checked in.
// Rendering the "Start check-in" card during the request and flipping it a
// moment later is the flicker that reads as a broken screen — and on a slow
// connection it is long enough to tap the wrong thing. Same footprint as the
// real card, so nothing moves when the answer arrives.
function PrimarySkeleton() {
  return (
    <div className="card p-6 sm:p-8" role="status">
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

export default function Landing() {
  const [session, setSession] = useState(() => getSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  // The profile *load* failing and the profile *save* failing are different
  // things: one is "we could not reach the server", the other is a message the
  // server sent back about the form. They were sharing one string, which is why
  // a network drop rendered as raw red text where the account form should be.
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  // `checkedIn: null` means NOT KNOWN YET — distinct from `false`, which is a
  // real answer from the server. Collapsing the two is what made a failed
  // request tell someone who had checked in that they had not.
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
      // Not `checkedIn: false` — we do not know. The card renders an unknown
      // state rather than asserting something that may be wrong.
      .catch((err) => setStatus({ loading: false, checkedIn: null, record: null, error: err }));
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
      <div className="grid min-h-screen place-items-center bg-[#07080a] text-[var(--color-muted)]">
        <span className="animate-pulse">Loading your account…</span>
      </div>
    );
  }

  // Home is the one screen that used to render a raw error string in bare red
  // on an otherwise empty page — the app's front door, and the only place not
  // using the component that every other page uses. LoadError knows the
  // difference between offline and refused, retries the offline case on its
  // own, and says so in words a student can act on.
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

  return (
    <PageShell section="home">
      <Header eyebrow="Home" leading={<TestsPanel />} />

      {/* ---------------------------------------------------------- hero */}
      {/* One line, not two. The greeting and the name used to stack into a
          48px eyebrow over a 3.2rem display name, and between them they ate
          the top third of a phone screen to say "Morning, Ana". */}
      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.75rem] leading-tight sm:text-[2.25rem]">
          {greeting()}, {first}
          <span className="text-[var(--color-teal)]">.</span>
        </h1>
      </div>

      {/* --------------------------------------------------- primary action */}
      <div className="animate-slide-up stack-block" style={{ animationDelay: '80ms' }}>
        {status.loading ? (
          <PrimarySkeleton />
        ) : status.checkedIn ? (
          <Link
            to="/results"
            state={{ record: status.record }}
            className="card press block p-6 sm:p-7"
          >
            <div>
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
                Your thought for the day is still here whenever you want it.
              </p>

              {/* The streak, in the slot the dinner pass used to justify. It
                  is the reason to come back tomorrow, so it belongs on the
                  card that says today is finished — not three sections down. */}
              {status.record?.streak > 0 && (
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="num text-2xl text-[var(--color-lavender)]">
                    {status.record.streak}
                  </span>
                  <span className="text-sm text-[var(--color-ink-soft)]">
                    day{status.record.streak === 1 ? '' : 's'} checked in, in a row
                  </span>
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--color-teal-dark)]">
                See today's thought
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        ) : (
          <Link
            to="/checkin"
            className="press block rounded-[18px] border border-[var(--color-teal)]/25 p-6 sm:p-8"
            style={{ background: 'rgba(31,174,149,0.08)' }}
          >
            <div>
              <span className="marginalia">Today</span>
              <p className="font-display mt-3 text-[1.9rem] leading-[1.15] sm:text-[2.5rem]">
                Three shapes,
                <br />
                three words.
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-soft)]">
                Thirty seconds. Then a thought for the day, and one more day on your streak.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-teal)] px-5 py-2.5 text-sm font-medium text-[#07080a]">
                Start check-in
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>

              {/* The honest version of the unknown case. The offer still
                  stands — you can always check in — but the card no longer
                  implies you have not already done it. Starting again costs
                  nothing: the API returns today's existing record rather than
                  writing a second one. */}
              {status.error && (
                <p className="mt-4 max-w-sm text-xs leading-relaxed text-[var(--color-muted)]">
                  We couldn&apos;t reach the server, so we can&apos;t tell whether today is already
                  done. Opening it again is safe — if you have checked in, you&apos;ll just get
                  today&apos;s thought back.
                </p>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* --------------------------------------------------------- right now */}
      <section className="animate-slide-up stack-section" style={{ animationDelay: '150ms' }}>
        {/* This used to be headed "Right now, I feel…", which promised a mood
            picker and delivered a triage menu — four negative states and no
            way to say you were fine. Four separate reviewers read it as a
            broken mood tracker and told us it was harmful; the real mood scale
            (Heavy → Bright) is in the check-in and always was.

            The fix is the label, not the options. Tapping "Good" here would
            have to launch a panic practice, which is nonsense. Named for what
            it does — a shortcut into help — it stops pretending to be a
            feelings picker and starts reading as an offer. */}
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Need something right now?</h2>
          <Link to="/grounding" className="text-xs text-[var(--color-lavender)] underline underline-offset-4">
            all 13
          </Link>
        </div>
        {/* One scrolling row of pills, not a 2x2 grid of cards.
            Four cards with a title, a colour stripe and a "tap to start"
            subtitle each occupied about a fifth of a phone screen to offer
            four one-word choices. The colour is what did the work, so the
            colour is what was kept: it moves from a stripe to the label and
            the border, and the row scrolls rather than wraps, which also
            means a fifth state can be added later without reflowing the
            page. The whole strip is now shorter than one of the old cards. */}
        <div className="row-scroll mt-3.5 flex gap-2">
          {QUICK.map((q, i) => (
            <Link
              key={q.mood}
              to={q.to}
              className="press shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                animationDelay: `${180 + i * 40}ms`,
                color: q.hue,
                borderColor: q.hue,
                background: 'color-mix(in srgb, currentColor 10%, transparent)',
              }}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ streak */}
      {streak > 0 && (
        <div
          className="animate-slide-up card stack-block px-5 py-4"
          style={{ animationDelay: '230ms' }}
        >
          <p className="text-sm">
            <span className="num text-2xl text-[var(--color-lavender)]">{streak}</span>
            <span className="ml-2 text-[var(--color-ink-soft)]">
              day{streak === 1 ? '' : 's'} of grounding in a row.
            </span>
          </p>
        </div>
      )}

      {/* ------------------------------------------------------ the even row */}
      {/* Two equal columns, matched heights, one grid.
          This was a 2/1 split on the argument that a 21-questionnaire library
          is a bigger destination than ten inkblot plates. That is true of the
          content and false of the decision: from here both are "an exercise I
          might do next", and sizing one at double the other mostly produced
          two cards whose text baselines did not line up. Equal cards, equal
          weight, and the grid finally reads as a grid. */}
      <div className="animate-slide-up stack-section grid grid-cols-2 gap-3" style={{ animationDelay: '280ms' }}>
        <Link to="/assessments" className="card press flex flex-col p-5">
          <span className="marginalia">Tests</span>
          <p className="font-display mt-2.5 text-xl leading-snug sm:text-2xl">
            Twenty-one questionnaires
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            PHQ-9, GAD-7 and eighteen more. A range, never a diagnosis.
          </p>
        </Link>

        <Link to="/inkblot-test" className="card press flex flex-col p-5">
          <span className="marginalia">Inkblot</span>
          <p className="font-display mt-2.5 text-xl leading-snug sm:text-2xl">Ten plates</p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Longer, in your own words. Typed or spoken.
          </p>
        </Link>
      </div>

      {/* --------------------------------------------------------- assistant */}
      <div className="animate-slide-up stack-section" style={{ animationDelay: '330ms' }}>
        <HomeAssistant checkin={status.record} />
      </div>

      <div className="rule-fade stack-section" />

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
          Sahaya is a reflective prototype, not a medical device. Nothing here is a diagnosis.
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
