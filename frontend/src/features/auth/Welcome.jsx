import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import AppShowcase, { Arrow } from './AppShowcase.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import Logo from '../../shared/Logo.jsx';
import Odometer from '../../shared/Odometer.jsx';
import Tick from '../../shared/Tick.jsx';
import useReveal from '../../shared/useReveal.js';
import { getQuickCheck } from '../../shared/api.js';
import { PHOTO } from '../../shared/photos.js';
import { getSession } from './session.js';

// The page a stranger lands on.
//
// Rebuilt to the structure of a working Indian mental-health service's site:
// a green announcement strip, a white header with one pill, a hero that leads
// with the name beside a large photograph, the app's screens on coloured
// cards, a grid of the free tools, one "not sure where to begin" card, the
// numbers, the approach, and a dark green footer that carries the helplines.
//
// Three things from that reference were left out on purpose. Its user counts
// ("1,80,000+ people"): this app cannot measure that and should not claim it,
// so the numbers here count what is in the box. Its star-rated testimonials:
// inventing reviews for a mental-health tool is not a thing worth doing. And
// its clinical-network claims, which are theirs and not this app's.
//
// One ask per screen. The 1-minute check is the primary action because it
// needs nothing from the visitor; signing in is always the secondary one, and
// the header pill keeps it one tap away from anywhere on the page.
//
// Sign-in is unchanged. GoogleSignInButton and PasswordAuthForm still own the
// whole flow; every "sign in" on this page swaps them into the hero.
//
// The hero's second card is the free check's first real question, loaded from
// the same endpoint /check uses, laid over the lower edge of the photograph.
// Ticking an answer is the first answer of the check: /check opens on question
// two with it kept.

// Six tools, six cells, two of them carrying a photograph: a grid of six
// identical white cards is the shape every landing page of this kind has, and
// it flattens the two that people actually arrive for.
const TOOLS = [
  {
    title: 'Questionnaires',
    body: 'PHQ-9, GAD-7, WHO-5 and eighteen more published screens, each with its citation and licence on the page.',
    to: '/read/which-test-and-what-for',
    photo: PHOTO.tests,
    span: 'sm:col-span-2 lg:row-span-2',
    feature: true,
  },
  {
    title: 'Grounding practices',
    body: 'Thirteen for a bad ten minutes: cyclic sighing, box breathing, 5-4-3-2-1, a body scan.',
    to: '/read/which-technique-when',
    photo: PHOTO.calm,
    span: 'sm:col-span-2',
    feature: true,
  },
  {
    title: 'Guided paths',
    body: 'Five multi-day paths for background anxiety, sleep, a spinning head, self-compassion and exams.',
    signIn: true,
  },
  {
    title: 'Daily check-in',
    body: 'One tap says how today feels. About thirty seconds, and it keeps your streak.',
    signIn: true,
  },
  {
    title: 'DP, the companion',
    body: 'A short conversation, typed or spoken, with crisis contacts built in. Not a therapist.',
    signIn: true,
    span: 'sm:col-span-2',
  },
  {
    title: 'Reading',
    body: 'Plain essays on what a score means, what it does not, and where your answers go.',
    to: '/read',
    span: 'sm:col-span-4',
  },
];

const STARTING_POINTS = [
  ['What the PHQ-9 measures', '/read/tests/phq-9'],
  ['What the GAD-7 measures', '/read/tests/gad-7'],
  ['Which test, and what for', '/read/which-test-and-what-for'],
  ['Why a long exhale works', '/read/why-a-long-exhale-works'],
  ['Sleep is not only a symptom', '/read/sleep-is-not-only-a-symptom'],
];

// Counts of what is in the box, never of people. See the note at the top.
const STATS = [
  { n: '21', label: 'published questionnaires' },
  { n: '13', label: 'grounding practices' },
  { n: '5', label: 'guided paths' },
  { n: '0', label: 'ads, ever' },
];

const SIGN_IN = 'sign-in';

const FOOTER = [
  {
    head: 'Free tools',
    links: [
      ['1-minute check', '/check'],
      ['Reading', '/read'],
      ['Which test, and what for', '/read/which-test-and-what-for'],
      ['Which technique, when', '/read/which-technique-when'],
      ['Why a long exhale works', '/read/why-a-long-exhale-works'],
    ],
  },
  {
    head: 'Questionnaires',
    links: [
      ['PHQ-9 depression screen', '/read/tests/phq-9'],
      ['GAD-7 anxiety screen', '/read/tests/gad-7'],
      ['WHO-5 wellbeing index', '/read/tests/who-5'],
      ['K10 distress scale', '/read/tests/k10'],
      ['PSS-10 stress scale', '/read/tests/pss-10'],
    ],
  },
  {
    head: 'Read',
    links: [
      ['What a score means', '/read/what-a-score-means'],
      ['A positive screen is not a diagnosis', '/read/a-positive-screen-is-not-a-diagnosis'],
      ['Where your answers go', '/read/where-your-answers-go'],
      ['Sleep is not only a symptom', '/read/sleep-is-not-only-a-symptom'],
      ['Your phone, and the numbers', '/read/your-phone-and-the-numbers'],
      ['The inkblots, honestly', '/read/the-inkblots-honestly'],
    ],
  },
  {
    head: 'About',
    links: [
      // Not a link: the reader is signed out, so /account would only bounce
      // them back to this page. Opens the sign-in panel instead.
      ['Your account', SIGN_IN],
      ['Caregiver access', '/caregiver'],
    ],
  },
];

// Written out here rather than taken from CrisisContacts, because the footer
// reads as a sentence with the numbers inline, not as the dialog's list.
// Verified September 2026: KIRAN was merged into Tele-MANAS, iCall keeps
// 10am to 8pm, and Vandrevala's number changed.
const FOOTER_LINES = [
  ['Emergency', '112', null],
  ['Vandrevala Foundation', '+91 9999 666 555', '24/7'],
  ['AASRA', '022-27546669', '24/7'],
  ['iCall (TISS)', '022-25521111', 'Mon to Sat, 8am to 9pm'],
];

const FOOTER_HURT = [
  ['Women Helpline', '181'],
  ['National Commission for Women', '7827170170'],
  ['Childline, under 18', '1098'],
];

const tel = (n) => `tel:${n.replace(/[^\d+]/g, '')}`;

const PRIMARY =
  'press inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-90';
const GREEN_FILL = { background: 'var(--w-accent-deep)' };
const SOFT = { color: 'var(--w-ink-soft)' };

function Pill({ children }) {
  return (
    <p
      className="inline-block rounded-full border px-4 py-1.5 text-[0.6875rem] font-medium tracking-[0.18em] uppercase"
      style={{ borderColor: 'var(--w-line-2)' }}
    >
      {children}
    </p>
  );
}

function Heading({ children, className = '' }) {
  return (
    <h2
      className={`text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[2.75rem] ${className}`}
      style={{ textWrap: 'balance' }}
    >
      {children}
    </h2>
  );
}

// How long the tick gets to land before the page moves on: the box fills in
// 140ms and the stroke finishes drawing at 300ms.
const TICK_HOLD_MS = 340;

// The free check's first question, on a card of its own. While it loads the
// card keeps its shape with blank answers rather than showing a spinner; if it
// cannot load, the card offers the check by its own name.
function FirstQuestion({ instrument, failed, onSignIn }) {
  const navigate = useNavigate();
  const [ticked, setTicked] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const item = instrument?.items?.[0];
  const options = item?.options || Array.from({ length: 6 }, (_, i) => ({ value: i, label: '' }));

  function tick(value) {
    if (ticked !== null) return;
    setTicked(value);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(
      () => navigate('/check', { state: { first: value } }),
      still ? 0 : TICK_HOLD_MS,
    );
  }

  return (
    <div
      className="w-card hero-rise p-5 shadow-[0_24px_60px_-28px_rgba(20,27,45,0.35)] sm:p-6"
      style={{ '--d': '260ms' }}
      aria-busy={!item}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.9375rem] font-semibold" style={{ color: 'var(--w-accent-deep)' }}>
          Start with the free check
        </p>
        {instrument && (
          <span className="text-[0.8125rem] font-medium tabular-nums" style={SOFT}>
            1 of {instrument.items.length}
          </span>
        )}
      </div>

      {failed ? (
        <div className="pt-5">
          <Link to="/check" className={PRIMARY} style={GREEN_FILL}>
            Take the 1-minute check
            <Arrow />
          </Link>
        </div>
      ) : (
        <div role="group" aria-labelledby="first-question">
          <p className="mt-4 text-[0.8125rem]" style={SOFT}>
            {instrument ? instrument.prompt : ' '}
          </p>
          <p id="first-question" className="mt-1 text-[1.25rem] leading-snug font-bold tracking-[-0.015em]" style={{ textWrap: 'balance' }}>
            {item ? item.text : ' '}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-hidden={!item || undefined}>
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => tick(option.value)}
                  disabled={!item || ticked !== null}
                  data-ticked={ticked === option.value}
                  className="soft-option flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.8125rem] font-medium whitespace-nowrap disabled:cursor-default"
                >
                  <Tick />
                  <span className="min-w-0 flex-1">{option.label || ' '}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t pt-3 text-[0.8125rem] leading-relaxed" style={{ ...SOFT, borderColor: 'var(--w-line)' }}>
            Five questions, no account, nothing saved.{' '}
            <button
              type="button"
              onClick={onSignIn}
              className="cursor-pointer font-semibold underline underline-offset-4 hover:opacity-80"
              style={{ color: 'var(--w-accent-deep)' }}
            >
              Sign in
            </button>{' '}
            for the daily check-in and the questionnaires a clinic uses.
          </p>
        </div>
      )}
    </div>
  );
}

// A section that rises into view once, the first time it is scrolled to.
// `children` may be a function of `shown` for a section with a moment of its
// own, like the counts rolling in "Why trust it".
function Reveal({ children, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <section ref={ref} data-reveal={shown ? 'shown' : 'pending'} {...rest}>
      {typeof children === 'function' ? children(shown) : children}
    </section>
  );
}

export default function Welcome({ onSignedIn }) {
  const [signingIn, setSigningIn] = useState(false);
  const [instrument, setInstrument] = useState(null);
  const [failed, setFailed] = useState(false);
  const navigate = useNavigate();
  const signedIn = !onSignedIn && getSession();

  useEffect(() => {
    if (signedIn) return;
    getQuickCheck()
      .then((data) => setInstrument(data.instrument))
      .catch(() => setFailed(true));
  }, [signedIn]);

  // This page owns the `/welcome` URL, so it also owns what happens after a
  // successful sign-in: go to the dashboard. The `onSignedIn` prop is kept for
  // any caller that still wants to handle it itself.
  const handleSignedIn = (next) => {
    if (onSignedIn) onSignedIn(next);
    else navigate('/', { replace: true });
  };

  // Someone who is already signed in has no business on the sign-in page.
  if (signedIn) return <Navigate to="/" replace />;

  // The sign-in panel replaces the hero photograph, at the top of a long page,
  // and most of the buttons that open it are further down. Without the scroll,
  // signing in from lower down swaps in a form a screen away and looks like
  // nothing happened.
  const go = () => {
    setSigningIn(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="welcome min-h-screen">
      {/* ------------------------------------------------------------- strip */}
      <div className="text-white" style={{ background: 'var(--w-forest)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-5 py-2 sm:justify-between sm:px-8">
          <p className="hidden text-[0.8125rem] sm:block">
            Free, with no ads: 21 questionnaires, 13 grounding practices and a companion one tap
            away.
          </p>
          <Link
            to="/check"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] whitespace-nowrap uppercase transition-[filter] hover:brightness-95"
            style={{ background: 'var(--w-accent)', color: 'var(--w-ink)' }}
          >
            Take the 1-minute check
            <Arrow size={12} />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------ header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--w-line)', background: 'rgba(255,255,255,0.92)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href="#top" className="flex items-center gap-2 transition-opacity hover:opacity-70" aria-label="DP Sahay AI, back to top">
            <Logo size={30} glow={false} />
            <span className="text-[1.25rem] leading-none font-bold tracking-[-0.02em] whitespace-nowrap" style={{ color: 'var(--w-accent-deep)' }}>
              DP Sahay
            </span>
          </a>

          <nav aria-label="On this page" className="hidden items-center gap-7 text-[0.9375rem] lg:flex">
            {[
              ['#inside', 'Inside the app'],
              ['#tools', 'Free tools'],
              ['#trust', 'Why trust it'],
              ['#approach', 'Our approach'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="transition-colors hover:text-[var(--w-accent-deep)]">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <CrisisContacts variant="link" />
            <span className="hidden sm:block">
              <button type="button" onClick={go} className={`${PRIMARY} px-5 py-2.5`} style={GREEN_FILL}>
                Sign in
                <Arrow size={14} />
              </button>
            </span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section id="top" className="mx-auto max-w-6xl scroll-mt-40 px-5 pt-12 pb-20 sm:px-8 sm:pt-16 lg:pb-24">
        <div className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            <div className="hero-rise" style={{ '--d': '0ms' }}>
              <Pill>You matter to us</Pill>
            </div>
            <h1
              className="hero-rise mt-5 text-[3.25rem] leading-[0.95] font-bold tracking-[-0.035em] sm:text-[4.25rem]"
              style={{ color: 'var(--w-accent-deep)', '--d': '80ms' }}
            >
              DP Sahay
              <span className="ml-2 align-top text-[0.34em] tracking-normal">AI</span>
            </h1>
            <p className="hero-rise mt-4 max-w-lg text-[1.25rem] leading-snug" style={{ '--d': '160ms' }}>
              A minute a day, and a real look at how you are.
            </p>

            {/* The check itself is the hero's action: the real first question of
                the WHO-5, answerable here. A button that says "take the check"
                is a promise; the question is the thing. */}
            {!signingIn && (
              <div className="mt-8">
                <FirstQuestion instrument={instrument} failed={failed} onSignIn={go} />
              </div>
            )}
          </div>

          {/* The photograph stands on its own, at the height of the column
              beside it. Nothing is laid over it. The sign-in form takes its
              place, so signing in changes a panel that was already there
              rather than pushing the page around. */}
          <div className="flex">
            {signingIn ? (
              <div className="w-card dialog-in mx-auto w-full max-w-md self-center p-6 sm:p-7">
                <GoogleSignInButton onSignedIn={handleSignedIn} />
                <div className="my-4 flex items-center gap-3 text-[0.6875rem] tracking-wide" style={SOFT}>
                  <span className="h-px flex-1" style={{ background: 'var(--w-line)' }} />
                  or use email
                  <span className="h-px flex-1" style={{ background: 'var(--w-line)' }} />
                </div>
                <PasswordAuthForm onSignedIn={handleSignedIn} />
                <button
                  type="button"
                  onClick={() => setSigningIn(false)}
                  className="mt-4 w-full cursor-pointer text-center text-[0.8125rem] underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={SOFT}
                >
                  Back
                </button>
              </div>
            ) : (
              <div className="photo-reveal mx-auto w-full overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgba(20,27,45,0.45)]">
                <img
                  src={PHOTO.hero}
                  alt=""
                  width="900"
                  height="1200"
                  decoding="async"
                  fetchPriority="high"
                  className="h-full min-h-[22rem] w-full object-cover lg:min-h-[30rem]"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--w-band)' }}>
        <AppShowcase onStart={go} />
      </div>

      {/* ------------------------------------------------------------- tools */}
      <Reveal id="tools" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="reveal-item mx-auto max-w-3xl text-center">
            <Heading>
              Free tools for a hard day,{' '}
              <span style={{ color: 'var(--w-accent-deep)' }}>built on published instruments</span>
            </Heading>
            <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-relaxed" style={SOFT}>
              The questionnaires a clinic uses, practices for the next ten minutes, and paths for
              the next week. All free, and every one says what it is and what it is not.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-4">
            {TOOLS.map((t, i) => {
              const inner = (
                <>
                  {t.photo && (
                    <span className="-mx-6 -mt-6 mb-5 block overflow-hidden sm:-mx-7 sm:-mt-7">
                      <img
                        src={t.photo}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                          t.feature && t.span.includes('row-span-2') ? 'h-56 lg:h-72' : 'h-40'
                        }`}
                      />
                    </span>
                  )}
                  <h3 className={t.feature ? 'text-[1.5rem] font-bold tracking-[-0.02em]' : 'text-[1.25rem] font-semibold'}>
                    {t.title}
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed" style={SOFT}>
                    {t.body}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.875rem] font-semibold" style={{ color: 'var(--w-accent-deep)' }}>
                    {t.signIn ? 'Sign in to start' : 'Explore'}
                    <Arrow size={14} />
                  </span>
                </>
              );
              const cls = `reveal-item w-card group flex flex-col overflow-hidden p-6 text-left sm:p-7 ${t.span || 'sm:col-span-2'}`;
              const order = { '--i': i + 1 };
              return t.signIn ? (
                <button key={t.title} type="button" onClick={go} className={`${cls} cursor-pointer`} style={order}>
                  {inner}
                </button>
              ) : (
                <Link key={t.title} to={t.to} className={cls} style={order}>
                  {inner}
                </Link>
              );
            })}
          </div>

          <p className="reveal-item mt-12 text-center text-[0.8125rem]" style={{ ...SOFT, '--i': 7 }}>
            Popular starting points:
          </p>
          <div className="reveal-item mt-3 flex flex-wrap justify-center gap-2.5" style={{ '--i': 7 }}>
            {STARTING_POINTS.map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-[filter] hover:brightness-95"
                style={{ background: 'var(--w-accent-wash)', color: 'var(--w-accent-deep)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ------------------------------------------------------------- begin */}
      <Reveal className="border-t px-5 py-20 sm:px-8 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        <div className="reveal-item w-card mx-auto max-w-2xl px-6 py-11 text-center sm:px-12">
          <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] sm:text-[2rem]">Not sure where to begin?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.9375rem] leading-relaxed" style={SOFT}>
            Answer five quick questions about the last two weeks. You get a score and what it
            means, with no sign-up, and nothing is saved.
          </p>
          <Link to="/check" className={`${PRIMARY} mt-7`} style={GREEN_FILL}>
            Take the 1-minute check
          </Link>
          <p className="mt-5 text-[0.8125rem]" style={SOFT}>
            Based on the WHO-5 Well-Being Index · a screen, not a diagnosis
          </p>
        </div>
      </Reveal>

      {/* ------------------------------------------------------------- trust */}
      <Reveal id="trust" className="scroll-mt-20 border-t py-20 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        {(shown) => (
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
            <div className="reveal-item">
              <Pill>Why trust it</Pill>
              <Heading className="mt-6">The real instruments, not our quiz</Heading>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={s.label} className="reveal-item w-card px-4 py-7" style={{ '--i': i + 1 }}>
                  <p className="text-[2rem] leading-none font-bold tracking-[-0.02em] sm:text-[2.75rem]" style={{ color: 'var(--w-accent-deep)' }}>
                    <Odometer value={s.n} go={shown} />
                  </p>
                  <p className="mt-2 text-[0.875rem]">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="reveal-item mx-auto mt-10 max-w-3xl text-[0.9375rem] leading-relaxed" style={{ ...SOFT, '--i': 5 }}>
              PHQ-9 · GAD-7 · WHO-5 · K10 · PSS-10 · UCLA-3 · MSPSS and more, each carrying its full
              name, citation and licence on the page where you take it. A score places you in a range
              the instrument&apos;s authors defined. It describes a few weeks, not you.
            </p>
          </div>
        )}
      </Reveal>

      {/* ---------------------------------------------------------- approach */}
      <Reveal id="approach" className="scroll-mt-20 border-t py-20 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        <div className="reveal-item mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Pill>Our approach</Pill>
          <Heading className="mt-6">A prompt for reflection, never a verdict</Heading>
          <div className="mt-8 flex flex-col gap-5 text-[1.0625rem] leading-relaxed" style={SOFT}>
            <p>
              A bad ten minutes is not the same problem as a bad fortnight, and they do not want the
              same tool. So this is a check-in for today, a questionnaire when you want a straighter
              answer, and something to do with your breath when a night gets bad.
            </p>
            <p>
              None of it is a diagnosis. What you record is seen by your counsellor, who is
              assigned by your institution, and by your institution&apos;s administrator. Nobody
              else sees it unless you invite them from your account.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center gap-5">
            <button type="button" onClick={go} className={`${PRIMARY} px-8 py-4`} style={GREEN_FILL}>
              Sign in to start
              <Arrow />
            </button>
            <CrisisContacts variant="link" />
          </div>
        </div>
      </Reveal>

      {/* The "bring it to your campus" enquiry form sat here. It is off the
          page for now; PartnerForm.jsx, /api/enquiries and the console's
          Enquiries page are all still in place, so putting it back is this
          one section. */}

      {/* ------------------------------------------------------------ footer */}
      <footer className="text-white" style={{ background: 'var(--w-forest)' }}>
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
          <p className="max-w-2xl text-[1.25rem] leading-snug font-medium sm:text-[1.75rem]">
            A quiet minute a day, the real questionnaires when you want a straighter answer, and a
            companion to talk it through. Free, in one app.
          </p>

          {/* The helplines on every visit, with the numbers written out and
              tappable rather than behind a button. */}
          <div className="mt-10 max-w-3xl rounded-2xl px-6 py-5 text-[0.875rem] leading-relaxed" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <p>
              In crisis or thinking about suicide? You are not alone. Call{' '}
              <a href={tel('14416')} className="font-semibold underline-offset-4 hover:underline">
                Tele-MANAS 14416
              </a>{' '}
              <span style={{ color: 'var(--w-forest-soft)' }}>(Govt. of India, 24/7, free)</span>.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {FOOTER_LINES.map(([name, number, note]) => (
                <span key={number}>
                  <a href={tel(number)} className="font-semibold underline-offset-4 hover:underline">
                    {name} {number}
                  </a>
                  {note && <span role="status" style={{ color: 'var(--w-forest-soft)' }}> ({note})</span>}
                </span>
              ))}
            </p>
            <p className="mt-3">
              Someone hurting you?{' '}
              {FOOTER_HURT.map(([name, number], i) => (
                <span key={number}>
                  {i > 0 && <span style={{ color: 'var(--w-forest-soft)' }}> · </span>}
                  <a href={tel(number)} className="font-semibold underline-offset-4 hover:underline">
                    {name} {number}
                  </a>
                </span>
              ))}
            </p>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER.map((col) => (
              <div key={col.head}>
                <p className="text-[1rem] font-semibold">{col.head}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map(([label, to]) => {
                    const cls = 'text-[0.875rem] transition-colors hover:text-white';
                    const style = { color: 'var(--w-forest-soft)' };
                    return (
                      <li key={to}>
                        {to === SIGN_IN ? (
                          <button type="button" onClick={go} className={`${cls} cursor-pointer`} style={style}>{label}</button>
                        ) : to.startsWith('#') ? (
                          <a href={to} className={cls} style={style}>{label}</a>
                        ) : (
                          <Link to={to} className={cls} style={style}>{label}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mt-16 flex flex-col items-start gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <span className="inline-flex items-center gap-2.5 rounded-md border border-white/40 px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <Logo size={20} glow={false} />
              </span>
              <span className="text-[1.0625rem] font-semibold">DP Sahay AI</span>
            </span>
            <p className="text-[0.8125rem]" style={{ color: 'var(--w-forest-soft)' }}>
              A reflective prototype, not a medical device.
            </p>
            <p className="text-[0.6875rem] tracking-[0.14em] uppercase" style={{ color: 'var(--w-forest-soft)' }}>
              © {new Date().getFullYear()} DP Sahay AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
