import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import AppShowcase, { Arrow } from './AppShowcase.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import Logo from '../../shared/Logo.jsx';
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

const PRIMARY =
  'press inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-90';
const SECONDARY =
  'press inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] px-7 py-3.5 text-[0.9375rem] font-semibold transition-colors hover:bg-[var(--w-accent-wash)]';
const GREEN_FILL = { background: 'var(--w-accent-deep)' };
const GREEN_LINE = { borderColor: 'var(--w-accent-deep)', color: 'var(--w-accent-deep)' };
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

// A corner of the product under the photograph, so the hero shows what the app
// is as well as how it should feel. aria-hidden: it is illustration, and read
// aloud it would sound like somebody's real conversation.
function ChatPeek() {
  const bubble = 'max-w-[88%] rounded-2xl px-3.5 py-2 text-[0.8125rem] leading-snug';
  return (
    <div className="w-card w-full p-4 sm:p-5" aria-hidden="true">
      <div className="flex items-center gap-2">
        <Logo size={22} glow={false} />
        <span className="text-[0.9375rem] font-semibold">DP</span>
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
          style={{ background: 'var(--w-accent-wash)', color: 'var(--w-accent-deep)' }}
        >
          4-day streak
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <span className={`${bubble} self-start`} style={{ background: 'var(--w-accent-wash)' }}>
          What is sitting heaviest today?
        </span>
        <span className={`${bubble} self-end text-white`} style={GREEN_FILL}>
          exams mostly. and i am not sleeping
        </span>
      </div>
    </div>
  );
}

export default function Welcome({ onSignedIn }) {
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  // This page owns the `/welcome` URL, so it also owns what happens after a
  // successful sign-in: go to the dashboard. The `onSignedIn` prop is kept for
  // any caller that still wants to handle it itself.
  const handleSignedIn = (next) => {
    if (onSignedIn) onSignedIn(next);
    else navigate('/', { replace: true });
  };

  // Someone who is already signed in has no business on the sign-in page.
  if (!onSignedIn && getSession()) return <Navigate to="/" replace />;

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
            className="inline-flex items-center gap-1.5 rounded-full border border-white/60 px-3.5 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] whitespace-nowrap uppercase transition-colors hover:bg-white/10"
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
          <a href="#top" className="flex items-center gap-2" aria-label="DP Sahay AI, back to top">
            <Logo size={30} glow={false} />
            <span className="text-[1.3rem] leading-none font-bold tracking-[-0.02em] whitespace-nowrap" style={{ color: 'var(--w-accent-deep)' }}>
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
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <Pill>You matter to us</Pill>
            <h1
              className="mt-6 text-[3.5rem] leading-[0.95] font-bold tracking-[-0.035em] sm:text-[5.25rem]"
              style={{ color: 'var(--w-accent-deep)' }}
            >
              DP Sahay
              <span className="ml-2 align-top text-[0.34em] tracking-normal">AI</span>
            </h1>
            <p className="mt-6 max-w-lg text-[1.25rem] leading-snug">
              A minute a day, and a real look at how you are.
            </p>
            <p className="mt-4 flex max-w-lg gap-2.5 text-[0.9375rem] leading-relaxed" style={SOFT}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--w-accent-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
              <span>
                <strong className="font-semibold" style={{ color: 'var(--w-accent-deep)' }}>
                  Start with the free check
                </strong>
                : five questions, no account, nothing saved. The app adds a 30-second daily
                check-in and the questionnaires a clinic uses.
              </span>
            </p>

            {!signingIn && (
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/check" className={PRIMARY} style={GREEN_FILL}>
                  Take the 1-minute check
                  <Arrow />
                </Link>
                <button type="button" onClick={go} className={SECONDARY} style={GREEN_LINE}>
                  Sign in
                  <Arrow />
                </button>
              </div>
            )}

            <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem]" style={SOFT}>
              <span>No account for the check</span>
              <span aria-hidden="true">·</span>
              <a href="#trust" className="underline-offset-4 hover:underline" style={{ color: 'var(--w-accent-deep)' }}>
                Built on PHQ-9, GAD-7 and WHO-5
              </a>
              <span aria-hidden="true">·</span>
              <span>Seen only by your counsellor and administrator</span>
            </p>
          </div>

          {/* The photograph, and the moment it is asked for, the door. The
              form takes the picture's place, so signing in changes a panel
              that was already there rather than pushing the page around. */}
          <div>
            {signingIn ? (
              <div className="w-card mx-auto max-w-md p-6 sm:p-7">
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
                  className="mt-4 w-full text-center text-[0.75rem] underline underline-offset-4"
                  style={SOFT}
                >
                  Back
                </button>
              </div>
            ) : (
              <div className="mx-auto flex max-w-md flex-col gap-4 lg:max-w-none">
                <img
                  src={PHOTO.hero}
                  alt=""
                  width="900"
                  height="1200"
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-[4/3] w-full rounded-[1.75rem] object-cover shadow-[0_40px_80px_-40px_rgba(10,79,44,0.55)]"
                />
                <ChatPeek />
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--w-band)' }}>
        <AppShowcase onStart={go} />
      </div>

      {/* ------------------------------------------------------------- tools */}
      <section id="tools" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Heading>
              Free tools for a hard day,{' '}
              <span style={{ color: 'var(--w-accent-deep)' }}>built on published instruments</span>
            </Heading>
            <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-relaxed" style={SOFT}>
              The questionnaires a clinic uses, practices for the next ten minutes, and paths for
              the next week. All free, and every one says what it is and what it is not.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => {
              const inner = (
                <>
                  <h3 className="text-[1.2rem] font-semibold">{t.title}</h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed" style={SOFT}>
                    {t.body}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[0.875rem] font-semibold" style={{ color: 'var(--w-accent-deep)' }}>
                    {t.signIn ? 'Sign in to start' : 'Explore'}
                    <Arrow size={14} />
                  </span>
                </>
              );
              const cls = 'w-card flex flex-col p-6 text-left sm:p-7';
              return t.signIn ? (
                <button key={t.title} type="button" onClick={go} className={`${cls} cursor-pointer`}>
                  {inner}
                </button>
              ) : (
                <Link key={t.title} to={t.to} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>

          <p className="mt-12 text-center text-[0.8125rem]" style={SOFT}>
            Popular starting points:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
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
      </section>

      {/* ------------------------------------------------------------- begin */}
      <section className="border-t px-5 py-20 sm:px-8 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        <div className="w-card mx-auto max-w-2xl px-6 py-11 text-center sm:px-12">
          <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] sm:text-[2rem]">Not sure where to begin?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.9375rem] leading-relaxed" style={SOFT}>
            Answer five quick questions about the last two weeks. You get a score and what it
            means, with no sign-up, and nothing is saved.
          </p>
          <Link to="/check" className={`${PRIMARY} mt-7`} style={GREEN_FILL}>
            Start the 1-minute check
          </Link>
          <p className="mt-5 text-[0.75rem]" style={SOFT}>
            Based on the WHO-5 Well-Being Index · a screen, not a diagnosis
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- trust */}
      <section id="trust" className="scroll-mt-20 border-t py-20 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
          <Pill>Why trust it</Pill>
          <Heading className="mt-6">The real instruments, not our quiz</Heading>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="w-card px-4 py-7">
                <p className="text-[2.4rem] leading-none font-bold tracking-[-0.02em] sm:text-[2.75rem]" style={{ color: 'var(--w-accent-deep)' }}>
                  {s.n}
                </p>
                <p className="mt-2 text-[0.875rem]">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-[0.875rem] leading-relaxed" style={SOFT}>
            PHQ-9 · GAD-7 · WHO-5 · K10 · PSS-10 · UCLA-3 · MSPSS and more, each carrying its full
            name, citation and licence on the page where you take it. A score places you in a range
            the instrument&apos;s authors defined. It describes a few weeks, not you.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- approach */}
      <section id="approach" className="scroll-mt-20 border-t py-20 sm:py-24" style={{ borderColor: 'var(--w-line)' }}>
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
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
      </section>

      {/* The "bring it to your campus" enquiry form sat here. It is off the
          page for now; PartnerForm.jsx, /api/enquiries and the console's
          Enquiries page are all still in place, so putting it back is this
          one section. */}

      {/* ------------------------------------------------------------ footer */}
      <footer className="text-white" style={{ background: 'var(--w-forest)' }}>
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-10 sm:px-8">
          <p className="max-w-2xl text-[1.35rem] leading-snug font-medium sm:text-[1.6rem]">
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
                  {note && <span style={{ color: 'var(--w-forest-soft)' }}> ({note})</span>}
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
              <span className="text-[1.05rem] font-semibold">DP Sahay AI</span>
            </span>
            <p className="text-[0.8125rem]" style={{ color: 'var(--w-forest-soft)' }}>
              A reflective prototype, not a medical device.
            </p>
            <p className="text-[0.75rem] tracking-[0.14em] uppercase" style={{ color: 'var(--w-forest-soft)' }}>
              © {new Date().getFullYear()} DP Sahay AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
