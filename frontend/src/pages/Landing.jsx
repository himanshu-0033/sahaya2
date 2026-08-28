import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import LoadError from '../components/LoadError.jsx';
import DarkSignInHero from '../components/DarkSignInHero.jsx';
import DarkAccountHero from '../components/DarkAccountHero.jsx';
import { getSession } from '../lib/session.js';
import { getStatus, getProfile, saveProfile, getGroundingCatalog } from '../lib/api.js';

// Home.
//
// One thing is bigger than everything else, and everything else lines up.
//
// The check-in keeps the full width because it is genuinely the largest
// decision on the page, and sizing it like the rest would be a lie about
// priority. Below it, the pieces that really are peers — Tests, Inkblot — are
// equal columns on one grid. The earlier version graded almost every block by
// importance, and a page where six things are all slightly different sizes
// does not read as a hierarchy, it reads as something assembled.
//
// The "right now" strip is the part that earns its place. A student in a bad
// moment should not have to navigate to a section and browse a library; one
// tap from here goes straight into a practice.

const QUICK = [
  { mood: 'panic', label: 'Panicking', to: '/grounding/temperature', hue: 'var(--color-flag)' },
  { mood: 'anxious', label: 'Anxious', to: '/grounding/cyclic-sighing', hue: 'var(--sec-home)' },
  { mood: 'spiralling', label: 'Spiralling', to: '/grounding/mental-grounding', hue: 'var(--color-amber)' },
  { mood: 'sad', label: 'Low', to: '/grounding/self-compassion-break', hue: 'var(--color-rose)' },
];

// Three of the ten plates, for the card that says today is done.
//
// Seeded from the date rather than picked with Math.random on every render.
// Truly random would reshuffle on every state change on this page — the
// profile arriving, the streak arriving, a retry — so the images would swap
// while someone was reading, and each swap is three fresh network requests
// for pictures they had already been shown. Seeded by the day it is the same
// card all day and a different one tomorrow, which is the only sense of
// "random" that survives contact with a component that re-renders.
const PLATE_COUNT = 10;

function platesForDay(seedSource) {
  const seed = String(seedSource || 'today');
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // xorshift32, and the index comes off the TOP bits. The first version of
  // this was a textbook LCG indexed with `n % pool.length`, which is the
  // textbook way to get it wrong: an LCG's low-order bits have a very short
  // period, and a modulo reads only those. It looked random and wasn't —
  // plate 1 came out third on six days in seven.
  let n = hash >>> 0 || 1;
  const next = () => {
    n ^= n << 13;
    n >>>= 0;
    n ^= n >>> 17;
    n ^= n << 5;
    n >>>= 0;
    return n / 4294967296;
  };

  const pool = Array.from({ length: PLATE_COUNT }, (_, i) => i + 1);
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    picked.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
  }
  return picked.map((i) => `/plates/rorschach-${String(i).padStart(2, '0')}-thumb.jpg`);
}

// The plates are photographs of ink on cream paper, and three of the ten are
// in colour. Neither survives being dropped straight onto a near-black card:
// unaltered they are three bright rectangles, and the usual dark-mode trick of
// inverting them turns plate VIII's pinks and oranges into greens and blues.
//
// So each one keeps its own paper. Small light tiles, the way the real cards
// sit on a table — which is also closer to what they are than a full-bleed
// graphic would be.
function PlateStrip({ seed }) {
  const plates = useMemo(() => platesForDay(seed), [seed]);

  // Decorative. The card already says everything in words, and three
  // "an inkblot" announcements in a row is noise to a screen reader.
  return (
    <div className="mt-5 flex gap-2" aria-hidden="true">
      {plates.map((src) => (
        <span
          key={src}
          className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--line-1)] sm:h-16 sm:w-16"
          style={{ background: '#efece5' }}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        </span>
      ))}
    </div>
  );
}

// The signpost to the inkblot reflection, on the card that offers it.
//
// Fixed plates, not the seeded daily ones. This card is a door, not a moment:
// it should look the same every time you pass it, the way a sign does. The
// check-in card above is the opposite — that one marks a particular day, so
// it changes with the day.
//
// I, III and VIII specifically, and in that order. The deck genuinely runs
// from black ink (I), through black with red (III), to full colour (VIII) —
// so these three show the range rather than three versions of the same thing.
// Plate I alone would promise ten monochrome bats.
//
// They overlap because the flow contains ten of them, and a neatly spaced row
// of exactly three quietly contradicts that; a stack reads as "more behind
// these".
//
// It used to sit on an inkblot card of its own, beside the check-in. The
// plates are the last stage of the check-in now, so the fan moved onto that
// card: same picture, doing the honest job of showing what is inside the one
// door rather than advertising a second one.
const FAN = ['01', '03', '08'];

function PlateFan() {
  return (
    <span className="flex shrink-0 items-center" aria-hidden="true">
      {FAN.map((n, i) => (
        <span
          key={n}
          className="block h-14 w-14 overflow-hidden rounded-xl border border-[var(--line-2)] sm:h-16 sm:w-16"
          style={{
            background: '#efece5',
            marginLeft: i === 0 ? 0 : '-1.15rem',
            // Later plates sit on top, so the stack reads front-to-back in
            // one direction instead of interleaving.
            zIndex: i,
            boxShadow: '0 6px 18px -8px rgba(0,0,0,0.9)',
          }}
        >
          <img
            src={`/plates/rorschach-${n}-thumb.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        </span>
      ))}
    </span>
  );
}

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
      <Header eyebrow="Home" />

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

      {/* ------------------------------------------------------- today panel */}
      {/* Check-in, the right-now shortcuts and the inkblot were three separate
          cards with three separate borders and three gaps between them. They
          are one thing — what you might do on this screen, today — and reading
          them as three made the page feel like a list of unrelated products.
          One panel, hairline rules instead of gaps, ordered by how much of a
          decision each is: the check-in first, a shortcut out of a bad moment
          second, the longer exercise last. */}
      <section className="animate-slide-up card stack-block overflow-hidden p-0">
        {/* --------------------------------------------------- primary action */}
        <div style={{ animationDelay: '80ms' }}>
        {status.loading ? (
          <PrimarySkeleton />
        ) : status.checkedIn ? (
          <Link
            to="/results"
            state={{ record: status.record }}
            className="press block p-6 sm:p-7"
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

              <PlateStrip seed={status.record?.date} />

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
            className="press block p-6 sm:p-8"
            style={{ background: 'rgba(31,174,149,0.08)' }}
          >
            <div>
              <span className="marginalia">Today</span>
              {/* Was "Three shapes, three words." — an instruction, and one
                  that framed the check-in as a task with a correct way to
                  complete it. It is not a test and there is nothing to get
                  right. A question in the same voice the companion opens
                  with asks for the same thing without grading it. */}
              <p className="font-display mt-3 text-[1.9rem] leading-[1.15] sm:text-[2.5rem]">
                How is today
                <br />
                sitting?
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-ink-soft)]">
                One tap saves the day and the streak. Everything after it is optional and runs
                straight through, without coming back here.
              </p>

              {/* The whole sitting, on the one card that starts it.

                  The tests and the plates used to be two more doors on this
                  screen — a Tests button in the header and an inkblot card
                  below — which made three separate offers out of what is
                  actually one flow, and left a person choosing between them
                  before doing any of it. There is one door now, and it says
                  what is behind it: the stages, their real cost in minutes,
                  and the plates themselves, so nothing is hidden by being
                  merged. Both sections are still reachable on their own under
                  More, for a day when only one of them is wanted. */}
              <div className="mt-5 flex items-end justify-between gap-4">
                <ul className="min-w-0 space-y-1.5 text-xs text-[var(--color-ink-soft)]">
                  <li className="flex gap-2.5">
                    <span className="num shrink-0 text-[var(--color-muted)]">1</span>
                    <span>How today feels — one tap</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="num shrink-0 text-[var(--color-muted)]">2</span>
                    <span>PHQ-9, GAD-7, WHO-5 — about 6 min</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="num shrink-0 text-[var(--color-muted)]">3</span>
                    <span>Ten Rorschach plates — about 10 min</span>
                  </li>
                </ul>
                <PlateFan />
              </div>

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
        <div className="border-t border-[var(--line-1)] px-6 py-5">
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
        </div>

        {/* ------------------------------------------------------------ streak */}
        {/* Sits with the shortcuts above it rather than in a card of its own —
            it is a fact about those practices, not a separate feature. */}
        {streak > 0 && (
          <div className="border-t border-[var(--line-1)] px-6 py-3.5">
            <p className="text-sm">
              <span className="num text-2xl text-[var(--color-lavender)]">{streak}</span>
              <span className="ml-2 text-[var(--color-ink-soft)]">
                day{streak === 1 ? '' : 's'} of grounding in a row.
              </span>
            </p>
          </div>
        )}

      </section>

      <div className="rule-fade stack-section" />

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-4">
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
