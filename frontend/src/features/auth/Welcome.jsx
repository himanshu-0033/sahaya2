import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import AppShowcase, { Arrow, Heading, Part } from './AppShowcase.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import Logo from '../../shared/Logo.jsx';
import Odometer from '../../shared/Odometer.jsx';
import Tick from '../../shared/Tick.jsx';
import useReveal from '../../shared/useReveal.js';
import { getQuickCheck } from '../../shared/api.js';
import { getSession } from './session.js';

// The page a stranger lands on.
//
// Set as a printed instrument sheet: one green ink on white paper, ruled parts
// with their names in a column beside them, square tick boxes, counts in boxed
// digits. The claim this app makes over every wellness site is that it uses
// the real published questionnaires rather than a quiz of its own, and a form
// is the one shape that shows that instead of saying it. So the first viewport
// prints the first real WHO-5 question, from the same endpoint the free check
// uses, and ticking an answer is already the first answer of the check.
//
// Three things from the reference this page was first built on were left out
// on purpose, and stay out. User counts ("1,80,000+ people"): this app cannot
// measure that and should not claim it, so the numbers here count what is in
// the box. Star-rated testimonials: inventing reviews for a mental-health tool
// is not a thing worth doing. And clinical-network claims, which were theirs.
//
// One ask per screen. The 1-minute check is the primary action because it
// needs nothing from the visitor; signing in is always the secondary one, and
// the header keeps it one tap away from anywhere on the page.
//
// Sign-in is unchanged. GoogleSignInButton and PasswordAuthForm still own the
// whole flow; every "sign in" on this page swaps them in where the question was.

const TOOLS = [
  {
    title: 'Questionnaires',
    body: 'PHQ-9, GAD-7, WHO-5 and eighteen more published screens, each with its citation and licence on the page.',
    to: '/read/which-test-and-what-for',
  },
  {
    title: 'Grounding practices',
    body: 'Thirteen for a bad ten minutes: cyclic sighing, box breathing, 5-4-3-2-1, a body scan.',
    to: '/read/which-technique-when',
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
  },
  {
    title: 'Reading',
    body: 'Plain essays on what a score means, what it does not, and where your answers go.',
    to: '/read',
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

const NAV = [
  ['#inside', 'Inside the app'],
  ['#tools', 'Free tools'],
  ['#trust', 'Why trust it'],
  ['#approach', 'Our approach'],
];

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
  ['AASRA', '+91 98204 66726', '24/7'],
  ['iCall (TISS)', '9152987821', 'Mon to Sat, 10am to 8pm'],
];

const FOOTER_HURT = [
  ['Women Helpline', '181'],
  ['National Commission for Women', '7827170170'],
  ['Childline, under 18', '1098'],
];

const tel = (n) => `tel:${n.replace(/[^\d+]/g, '')}`;

const SOFT = { color: 'var(--key-soft)' };
const SPOT = { color: 'var(--spot)' };

// How long the ink gets before the page moves on: the box fills in 120ms and the
// tick finishes drawing at 280ms, so the visitor sees their mark land.
const TICK_HOLD_MS = 320;

// The first question of the free check, printed. Ticking an answer inks the box
// and carries that answer into /check, where the check opens on question two.
// While the questionnaire loads the form is blank rather than a spinner: an
// empty ruled form is what a form looks like before it is filled in. If it
// cannot load, the box still offers the check by its own name.
function FirstQuestion({ instrument, failed }) {
  const navigate = useNavigate();
  const [ticked, setTicked] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const item = instrument?.items?.[0];

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
    <div className="print-feed border-[1.5px] border-[var(--spot)] bg-[var(--paper)]" style={{ '--d': '220ms' }}>
      <div className="f-shade flex min-h-11 items-center justify-between gap-4 border-b-[1.5px] border-[var(--spot)] px-4 py-2 sm:px-5">
        {instrument ? (
          <>
            <span className="f-label">{instrument.fullName}</span>
            <span className="f-label tnum shrink-0">1 of {instrument.items.length}</span>
          </>
        ) : (
          <span className="h-3 w-44 bg-[var(--rule-soft)]" aria-hidden="true" />
        )}
      </div>

      {failed ? (
        <div className="px-4 py-8 sm:px-6">
          <Link to="/check" className="f-btn">
            Take the 1-minute check
            <Arrow />
          </Link>
        </div>
      ) : (
        <div role="group" aria-labelledby="first-question" aria-busy={!item} className="min-w-0">
          <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
            <p className="text-[0.9375rem]" style={SOFT}>
              {instrument ? instrument.prompt : ' '}
            </p>
            <p id="first-question" className="f-title mt-1.5 text-[1.75rem] leading-[1.1] sm:text-[2rem]" style={{ textWrap: 'balance' }}>
              {item ? item.text : ' '}
            </p>
          </div>

          {/* Blank rows while the questionnaire loads are the shape of the form,
              not controls, so assistive tech is not handed six empty buttons. */}
          <ul className="f-rows border-t border-[var(--rule)]" aria-hidden={!item || undefined}>
            {(item?.options || Array.from({ length: 6 }, (_, i) => ({ value: i, label: '' }))).map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => tick(option.value)}
                  disabled={!item || ticked !== null}
                  data-ticked={ticked === option.value}
                  className="f-option flex w-full items-center gap-3.5 px-4 py-3 text-left text-[1rem] sm:px-6"
                >
                  <Tick />
                  <span className="min-w-0 flex-1">{option.label || ' '}</span>
                  {item && (
                    <span className="tnum text-[0.8125rem]" style={SOFT} aria-hidden="true">
                      {option.value}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {instrument?.citation && (
        <p className="border-t border-[var(--rule)] px-4 py-2.5 text-[0.8125rem] leading-snug sm:px-6" style={SOFT}>
          {instrument.citation}
          {instrument.license ? ` · ${instrument.license}` : ''}
        </p>
      )}

      {/* What the check does and does not do, printed in the form's own
          footer cells rather than as a strip of small print under the hero's
          buttons: they are facts about this form, so they sit on it. */}
      <ul className="grid border-t-[1.5px] border-[var(--spot)] text-[0.8125rem] leading-snug sm:grid-cols-3" style={SOFT}>
        <li className="px-4 py-2.5 sm:px-5">No account for the check</li>
        <li className="border-t border-[var(--rule)] px-4 py-2.5 sm:border-t-0 sm:border-l sm:px-5">
          <a href="#trust" className="underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--spot)]" style={SPOT}>
            Built on PHQ-9, GAD-7 and WHO-5
          </a>
        </li>
        <li className="border-t border-[var(--rule)] px-4 py-2.5 sm:border-t-0 sm:border-l sm:px-5">
          Seen only by your counsellor and administrator
        </li>
      </ul>
    </div>
  );
}

export default function Welcome({ onSignedIn }) {
  const [signingIn, setSigningIn] = useState(false);
  const [instrument, setInstrument] = useState(null);
  const [failed, setFailed] = useState(false);
  const navigate = useNavigate();
  const [slipRef, slipShown] = useReveal();
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

  // The sign-in panel takes the question's place, at the top of a long page,
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
      <div className="bg-[var(--spot)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-5 py-2 sm:justify-between sm:px-8">
          <p className="hidden text-[0.8125rem] sm:block">
            Free, with no ads: 21 questionnaires, 13 grounding practices and a companion one tap
            away.
          </p>
          <Link
            to="/check"
            className="inline-flex items-center gap-1.5 border border-white/70 px-3 py-1 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors hover:bg-white hover:text-[var(--spot)]"
          >
            Take the 1-minute check
            <Arrow size={12} />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------ header */}
      <header className="sticky top-0 z-40 border-b-2 border-[var(--spot)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5 sm:px-8">
          <a href="#top" className="flex items-center gap-2" aria-label="DP Sahay AI, back to top">
            <Logo size={30} glow={false} />
            <span className="f-title text-[1.25rem] leading-none whitespace-nowrap" style={SPOT}>
              DP Sahay
            </span>
          </a>

          <nav aria-label="On this page" className="hidden items-stretch self-stretch lg:flex">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex items-center border-l border-[var(--rule)] px-4 text-[0.9375rem] transition-colors last:border-r hover:bg-[var(--paper-tint)] hover:text-[var(--spot)]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <CrisisContacts variant="link" />
            <span className="hidden sm:block">
              <button type="button" onClick={go} className="f-btn min-h-[44px] px-4">
                Sign in
                <Arrow size={14} />
              </button>
            </span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section id="top" className="mx-auto max-w-6xl scroll-mt-40 px-5 pt-10 pb-16 sm:px-8 sm:pt-14 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
          <div className="flex flex-col">
            <h1 className="print-roll f-title text-[3.5rem] leading-[0.92] sm:text-[5.25rem]" style={SPOT}>
              DP Sahay
              <span className="ml-2 align-top text-[0.34em] tracking-normal">AI</span>
            </h1>
            <p className="print-rise f-title mt-3 text-[1.5rem] leading-tight" style={{ ...SPOT, '--d': '380ms' }}>
              You matter to us
            </p>

            <div className="print-rise mt-7 border-t-2 border-[var(--spot)] pt-6" style={{ '--d': '460ms' }}>
              <p className="max-w-lg text-[1.25rem] leading-snug">
                A minute a day, and a real look at how you are.
              </p>
              <p className="mt-4 flex max-w-lg gap-2.5 text-[0.9375rem] leading-relaxed" style={SOFT}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--spot)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                  <rect x="6" y="2.5" width="12" height="19" rx="1.5" />
                  <path d="M11 18.5h2" />
                </svg>
                <span>
                  <strong className="font-semibold" style={SPOT}>
                    Start with the free check
                  </strong>
                  : five questions, no account, nothing saved. The app adds a 30-second daily
                  check-in and the questionnaires a clinic uses.
                </span>
              </p>
            </div>

            {!signingIn && (
              <div className="print-rise mt-8 flex flex-wrap gap-3" style={{ '--d': '540ms' }}>
                <Link to="/check" className="f-btn">
                  Take the 1-minute check
                  <Arrow />
                </Link>
                <button type="button" onClick={go} className="f-btn f-btn-line">
                  Sign in
                  <Arrow />
                </button>
              </div>
            )}


          </div>

          {/* The question, and the moment it is asked for, the door. The
              sign-in form takes the question's place, so signing in changes a
              panel that was already there rather than pushing the page around. */}
          <div>
            {signingIn ? (
              <div className="print-feed border-[1.5px] border-[var(--spot)] bg-[var(--paper)]">
                <p className="f-shade f-label border-b-[1.5px] border-[var(--spot)] px-5 py-3">Sign in</p>
                <div className="p-5 sm:p-7">
                  <GoogleSignInButton onSignedIn={handleSignedIn} />
                  <div className="my-4 flex items-center gap-3 text-[0.8125rem]" style={SOFT}>
                    <span className="h-px flex-1 bg-[var(--rule)]" />
                    or use email
                    <span className="h-px flex-1 bg-[var(--rule)]" />
                  </div>
                  <PasswordAuthForm onSignedIn={handleSignedIn} />
                  <button
                    type="button"
                    onClick={() => setSigningIn(false)}
                    className="mt-4 w-full cursor-pointer text-center text-[0.8125rem] underline underline-offset-4 transition-colors hover:text-[var(--spot)]"
                    style={SOFT}
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <FirstQuestion instrument={instrument} failed={failed} />
            )}
          </div>
        </div>
      </section>

      <AppShowcase onStart={go} />

      {/* ------------------------------------------------------------- tools */}
      <Part id="tools" label="Free tools" className="pt-16 sm:pt-20">
        <Heading>
          Free tools for a hard day,{' '}
          <span style={SPOT}>built on published instruments</span>
        </Heading>
        <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed" style={SOFT}>
          The questionnaires a clinic uses, practices for the next ten minutes, and paths for
          the next week. All free, and every one says what it is and what it is not.
        </p>

        <ul className="reveal-rows f-rows mt-10 border-y-[1.5px] border-[var(--spot)]">
          {TOOLS.map((t, i) => {
            const inner = (
              <>
                <span className="f-title block text-[1.25rem] leading-tight sm:col-span-4">{t.title}</span>
                <span className="mt-1.5 block text-[0.9375rem] leading-relaxed sm:col-span-6 sm:mt-0" style={SOFT}>
                  {t.body}
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold whitespace-nowrap sm:col-span-2 sm:mt-0 sm:justify-self-end" style={SPOT}>
                  {t.signIn ? 'Sign in to start' : 'Explore'}
                  <Arrow size={14} />
                </span>
              </>
            );
            const cls = 'f-option block w-full px-1 py-5 text-left sm:grid sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:px-3';
            return (
              <li key={t.title} style={{ '--i': i }}>
                {t.signIn ? (
                  <button type="button" onClick={go} className={cls}>
                    {inner}
                  </button>
                ) : (
                  <Link to={t.to} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-[0.8125rem]" style={SOFT}>
          Popular starting points:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTING_POINTS.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className="border border-[var(--rule)] px-3 py-1.5 text-[0.875rem] transition-colors hover:border-[var(--spot)] hover:bg-[var(--paper-tint)]"
              style={SPOT}
            >
              {label}
            </Link>
          ))}
        </div>
      </Part>

      {/* ------------------------------------------------------------- begin */}
      {/* A slip to tear off: the one part of the page you can take away and
          act on without reading the rest. */}
      <section ref={slipRef} data-reveal={slipShown ? 'shown' : 'pending'} className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="reveal-slip f-slip mx-auto max-w-2xl px-6 py-10 sm:px-12">
          <h2 className="f-title text-[1.75rem] leading-tight sm:text-[2rem]">Not sure where to begin?</h2>
          <p className="mt-3 max-w-lg text-[1rem] leading-relaxed" style={SOFT}>
            Answer five quick questions about the last two weeks. You get a score and what it
            means, with no sign-up, and nothing is saved.
          </p>
          <Link to="/check" className="f-btn mt-7">
            Start the 1-minute check
            <Arrow />
          </Link>
          <p className="mt-5 border-t border-[var(--rule)] pt-3 text-[0.8125rem]" style={SOFT}>
            Based on the WHO-5 Well-Being Index · a screen, not a diagnosis
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- trust */}
      <Part id="trust" label="Why trust it" className="pb-16 sm:pb-20">
        {(shown) => (
          <>
            <Heading>The real instruments, not our quiz</Heading>

            <dl className="mt-10 grid grid-cols-2 border-t-[1.5px] border-l-[1.5px] border-[var(--spot)] lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-4 border-r-[1.5px] border-b-[1.5px] border-[var(--spot)] px-4 py-5 sm:px-5">
                  <dt className="order-2 text-[0.875rem] leading-snug">{s.label}</dt>
                  <dd className="order-1 self-start">
                    <Odometer value={s.n} go={shown} className="text-[2rem] font-semibold sm:text-[2.75rem]" style={SPOT} />
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 max-w-3xl text-[1rem] leading-relaxed" style={SOFT}>
              PHQ-9 · GAD-7 · WHO-5 · K10 · PSS-10 · UCLA-3 · MSPSS and more, each carrying its full
              name, citation and licence on the page where you take it. A score places you in a range
              the instrument&apos;s authors defined. It describes a few weeks, not you.
            </p>
          </>
        )}
      </Part>

      {/* ---------------------------------------------------------- approach */}
      <Part id="approach" label="Our approach" className="pb-20 sm:pb-24">
        <Heading>A prompt for reflection, never a verdict</Heading>
        <div className="mt-6 flex max-w-3xl flex-col gap-5 text-[1.0625rem] leading-relaxed" style={SOFT}>
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
        <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-[var(--rule)] pt-6">
          <button type="button" onClick={go} className="f-btn">
            Sign in to start
            <Arrow />
          </button>
          <CrisisContacts variant="link" />
        </div>
      </Part>

      {/* The "bring it to your campus" enquiry form sat here. It is off the
          page for now; PartnerForm.jsx, /api/enquiries and the console's
          Enquiries page are all still in place, so putting it back is this
          one section. */}

      {/* ------------------------------------------------------------ footer */}
      <footer className="bg-[var(--spot-deep)] text-white">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-10 sm:px-8">
          <p className="max-w-3xl text-[1.25rem] leading-snug font-medium sm:text-[1.75rem]">
            A quiet minute a day, the real questionnaires when you want a straighter answer, and a
            companion to talk it through. Free, in one app.
          </p>

          {/* The helplines on every visit, printed on a white slip in red ink
              so they are the most legible thing in the footer, with every
              number written out and tappable rather than behind a button. */}
          <div className="mt-10 max-w-3xl border-t-4 border-[var(--alarm)] bg-[var(--paper)] px-5 py-5 text-[0.9375rem] leading-relaxed text-[var(--key)] sm:px-6">
            <p>
              In crisis or thinking about suicide? You are not alone. Call{' '}
              <a href={tel('14416')} className="font-semibold text-[var(--alarm)] underline underline-offset-4">
                Tele-MANAS 14416
              </a>{' '}
              <span style={SOFT}>(Govt. of India, 24/7, free)</span>.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {FOOTER_LINES.map(([name, number, note]) => (
                <span key={number}>
                  <a href={tel(number)} className="font-semibold text-[var(--alarm)] underline-offset-4 hover:underline">
                    {name} {number}
                  </a>
                  {note && <span style={SOFT}> ({note})</span>}
                </span>
              ))}
            </p>
            <p className="mt-3 border-t border-[var(--rule)] pt-3">
              Someone hurting you?{' '}
              {FOOTER_HURT.map(([name, number], i) => (
                <span key={number}>
                  {i > 0 && <span style={SOFT}> · </span>}
                  <a href={tel(number)} className="font-semibold text-[var(--alarm)] underline-offset-4 hover:underline">
                    {name} {number}
                  </a>
                </span>
              ))}
            </p>
          </div>

          <div className="mt-14 grid gap-10 border-t border-white/25 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER.map((col) => (
              <div key={col.head}>
                <p className="f-label text-white">{col.head}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map(([label, to]) => {
                    const cls = 'text-[0.9375rem] underline-offset-4 transition-colors hover:text-white hover:underline';
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

          <div className="mt-14 flex flex-col items-start gap-6 border-t border-white/25 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2.5 border border-white/50 px-3.5 py-2">
              <span className="flex h-7 w-7 items-center justify-center bg-white">
                <Logo size={20} glow={false} />
              </span>
              <span className="f-title text-[1.0625rem]">DP Sahay AI</span>
            </span>
            <p className="text-[0.8125rem]" style={{ color: 'var(--w-forest-soft)' }}>
              A reflective prototype, not a medical device.
            </p>
            <p className="f-label" style={{ color: 'var(--w-forest-soft)' }}>
              © {new Date().getFullYear()} DP Sahay AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
