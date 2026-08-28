import { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import PasswordAuthForm from '../components/PasswordAuthForm.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import Logo from '../components/Logo.jsx';

// The page a stranger lands on.
//
// Before this, sahaya2.vercel.app served the sign-in screen. It is a
// good-looking door and it was the whole site: it never said what the app
// does, never showed a feature, and asked for a Google account before it had
// earned one. Everything a landing page is for had nowhere to go.
//
// Built to the structure of the wedding-planner reference — sticky header with
// one pill CTA, a hero with a stat row under it, centred section headers over
// card grids, alternating cream and band backgrounds, a four-column footer.
// That template is selling a service to someone who is happy; this is offering
// a screening tool to someone who may not be. So the structure is copied and
// the tone is not: no stock smiles, no five-star rows, no urgency.
//
// Sign-in is unchanged and untouched. DarkSignInHero still owns the whole auth
// flow; this page simply stands in front of it, and every call to action swaps
// it in. Nothing about a working login was risked to add a landing page.

const SERVICES = [
  {
    title: 'The daily check-in',
    body: 'One tap says how today feels, and that is the whole obligation. It takes about thirty seconds and it keeps your streak.',
    meta: 'About 30 seconds',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2.5" />
      </>
    ),
  },
  {
    title: 'The real questionnaires',
    body: 'PHQ-9, GAD-7, WHO-5 and eighteen more — the published instruments a clinic uses, each with its citation and licence on the page.',
    meta: 'Twenty-one, about 6 minutes for the core three',
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
      </>
    ),
  },
  {
    title: 'The ten plates',
    body: 'The original Rorschach plates, in your own words, typed or spoken. Nothing is scored — you get your own words counted back, never interpreted.',
    meta: 'About 10 minutes',
    icon: (
      <>
        <path d="M12 3c-4 3-6.5 6-6.5 9.5A6.5 6.5 0 0 0 12 19a6.5 6.5 0 0 0 6.5-6.5C18.5 9 16 6 12 3Z" />
      </>
    ),
  },
];

const TOOLS = [
  {
    title: 'Grounding, not meditation',
    body: 'Thirteen practices for a bad ten minutes — cyclic sighing, temperature, body scan. Most are under three minutes.',
    tags: ['Panicking', 'Anxious', 'Spiralling', 'Low'],
    tone: 'rose',
  },
  {
    title: 'DP, the companion',
    body: 'A short conversation, not a form. It knows how you said today felt, and it says plainly that it is not a therapist.',
    tags: ['Always one tap away', 'Crisis contacts built in'],
  },
  {
    title: 'Seven-day paths',
    body: 'A small thing to do each day for a week, when one exercise is not the shape of the problem.',
    tags: ['Sleep', 'Worry', 'Low mood'],
    tone: 'rose',
  },
  {
    title: 'A counsellor, if you want one',
    body: 'You can invite someone to follow along, and you can undo it from your account at any time. Nobody sees anything until you do.',
    tags: ['Off by default', 'Reversible'],
  },
];

const STATS = [
  { n: '21', label: 'Published instruments' },
  { n: '13', label: 'Grounding practices' },
  { n: '10', label: 'Rorschach plates' },
  { n: '0', label: 'Ads, ever' },
];

const FOOTER = [
  {
    head: 'The app',
    links: [
      ['Daily check-in', '/checkin'],
      ['Questionnaires', '/assessments'],
      ['The ten plates', '/inkblot-test'],
      ['Grounding', '/grounding'],
    ],
  },
  {
    head: 'Read',
    links: [
      ['Which test, and what for', '/read/which-test-and-what-for'],
      ['A positive screen is not a diagnosis', '/read/a-positive-screen-is-not-a-diagnosis'],
      ['Where your answers go', '/read/where-your-answers-go'],
      ['The inkblots, honestly', '/read/the-inkblots-honestly'],
    ],
  },
  {
    head: 'Who can see it',
    links: [
      ['Your account', '/account'],
      ['Caregiver access', '/caregiver'],
    ],
  },
];

// The plates, overlapped rather than spaced. Three neatly separated thumbnails
// would quietly contradict a page that says there are ten.
const FAN = ['01', '03', '08'];

function Ornament() {
  return (
    <div className="w-ornament" aria-hidden="true">
      <svg viewBox="-14 -14 28 28" width="15" height="15" fill="var(--w-accent)">
        <path d="M0,-11 C-5,-11 -8,-6 -6,-2 C-4,2 -9,4 -7,8 C-5,11 -2,10 0,12 Z" />
        <path d="M0,-11 C-5,-11 -8,-6 -6,-2 C-4,2 -9,4 -7,8 C-5,11 -2,10 0,12 Z" transform="scale(-1,1)" />
      </svg>
    </div>
  );
}

function Icon({ children }) {
  return (
    <span
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{ background: 'var(--w-accent-wash)', color: 'var(--w-accent-deep)' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

function SectionHead({ eyebrow, title, sub }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="w-eyebrow">{eyebrow}</p>
      <h2
        className="font-display text-[2rem] leading-[1.14] sm:text-[2.6rem]"
        style={{ textWrap: 'balance' }}
      >
        {title}
      </h2>
      <Ornament />
      {sub && (
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function Welcome({ onSignedIn }) {
  const [signingIn, setSigningIn] = useState(false);

  // The panel replaces the hero's button row, which is near the top of a long
  // page — and two of the three buttons that open it are the sticky header and
  // the closing CTA at the very bottom. Without this, signing in from either
  // one swaps in a form a full screen away and looks like nothing happened.
  const go = () => {
    setSigningIn(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="welcome min-h-screen">
      {/* ------------------------------------------------------------ header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--w-line)', background: 'rgba(253,242,248,0.88)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <span className="flex items-center gap-2.5">
            <Logo size={30} glow={false} from="#ec4899" to="#9d174d" />
            <span className="font-display text-[1.2rem] leading-none">
              DP Sahay
              <span className="ml-1.5 text-[0.78em]" style={{ color: 'var(--w-accent-deep)' }}>
                AI
              </span>
            </span>
          </span>

          <nav className="hidden items-center gap-7 text-sm md:flex" style={{ color: 'var(--w-ink-soft)' }}>
            <a href="#inside" className="transition-colors hover:text-[var(--w-ink)]">What&apos;s inside</a>
            <a href="#tools" className="transition-colors hover:text-[var(--w-ink)]">Tools</a>
            <a href="#trust" className="transition-colors hover:text-[var(--w-ink)]">Why trust it</a>
            <a href="#privacy" className="transition-colors hover:text-[var(--w-ink)]">Privacy</a>
          </nav>

          <button
            type="button"
            onClick={go}
            className="press shrink-0 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--w-accent-deep)' }}
          >
            Sign in
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="w-full lg:w-[56%]">
            <p className="w-eyebrow">You matter to us</p>
            <h1
              className="font-display mt-5 text-[2.6rem] leading-[1.08] sm:text-[3.6rem]"
              style={{ textWrap: 'balance' }}
            >
              A minute a day, and a real look at how you are.
            </h1>
            <p
              className="mt-6 max-w-lg text-[17px] leading-relaxed"
              style={{ color: 'var(--w-ink-soft)' }}
            >
              A daily check-in that takes thirty seconds, the same questionnaires a clinic uses,
              and something to do when a night gets bad. Free, and nobody sees any of it unless
              you ask them to.
            </p>

            {signingIn ? (
              <div className="w-card mt-9 max-w-sm p-6">
                <GoogleSignInButton onSignedIn={onSignedIn} />
                <div
                  className="my-4 flex items-center gap-3 text-[11px] tracking-wide"
                  style={{ color: 'var(--w-ink-soft)' }}
                >
                  <span className="h-px flex-1" style={{ background: 'var(--w-line)' }} />
                  or use email
                  <span className="h-px flex-1" style={{ background: 'var(--w-line)' }} />
                </div>
                <PasswordAuthForm onSignedIn={onSignedIn} />
                <button
                  type="button"
                  onClick={() => setSigningIn(false)}
                  className="mt-4 w-full text-center text-[12px] underline underline-offset-4"
                  style={{ color: 'var(--w-ink-soft)' }}
                >
                  Back
                </button>
              </div>
            ) : (
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={go}
                className="press rounded-full px-7 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--w-accent-deep)' }}
              >
                Sign in to start
              </button>
              <a
                href="#inside"
                className="press rounded-full border px-7 py-3.5 text-[15px] font-medium transition-colors"
                style={{ borderColor: 'var(--w-line-2)', color: 'var(--w-ink)' }}
              >
                See what is inside
              </a>
            </div>

            )}

            <p className="mt-4 text-[13px]" style={{ color: 'var(--w-ink-soft)' }}>
              Free. No card. You can delete everything from your account page.
            </p>
          </div>

          {/* The plates themselves, because they are the most distinctive thing
              the product owns and they photograph well on a warm ground. */}
          <div className="flex w-full justify-center lg:w-[44%]">
            <div className="flex items-center">
              {FAN.map((n, i) => (
                <span
                  key={n}
                  className="block overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: 'var(--w-line)',
                    background: '#f7e6ef',
                    height: '14rem',
                    width: '10.5rem',
                    marginLeft: i === 0 ? 0 : '-3rem',
                    zIndex: i,
                    transform: `rotate(${(i - 1) * 5}deg)`,
                    boxShadow: '0 26px 50px -28px rgba(51,57,58,0.6)',
                  }}
                >
                  <img
                    src={`/plates/rorschach-${n}.jpg`}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* The stat row, in the reference's position under the hero. Counts of
            what is in the box — not "10,000 users helped", which this cannot
            measure and should not claim. */}
        <div
          className="mt-16 grid grid-cols-2 gap-8 border-t pt-10 sm:grid-cols-4"
          style={{ borderColor: 'var(--w-line)' }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-[2.4rem] leading-none" style={{ color: 'var(--w-accent-deep)' }}>
                {s.n}
              </p>
              <p className="mt-2 text-[13px]" style={{ color: 'var(--w-ink-soft)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ inside */}
      <section id="inside" className="scroll-mt-20 py-20 sm:py-25" style={{ background: 'var(--w-band)' }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionHead
            eyebrow="What's inside"
            title="One sitting, three parts."
            sub="You can stop after the first. The check-in is saved the moment you tap, and everything after it is optional."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="w-card flex flex-col items-center gap-4 p-8 text-center">
                <Icon>{s.icon}</Icon>
                <h3 className="font-display text-[1.4rem] leading-snug">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                  {s.body}
                </p>
                <p className="mt-auto pt-2 text-[13px] font-medium" style={{ color: 'var(--w-lav)' }}>
                  {s.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- tools */}
      <section id="tools" className="scroll-mt-20 py-20 sm:py-25">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionHead
            eyebrow="Everything else"
            title="For the days that are not a check-in."
            sub="A bad ten minutes is not the same problem as a bad fortnight, and they do not want the same tool."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {TOOLS.map((t) => (
              <div key={t.title} className="w-card flex flex-col gap-3 p-7">
                <h3 className="font-display text-[1.35rem] leading-snug">{t.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                  {t.body}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-[12px]"
                      // Warm where the tag is a feeling, cool where it is a
                      // property of the product. Two kinds of thing, two tints.
                      style={
                        t.tone === 'rose'
                          ? { background: 'var(--w-lav-wash)', color: 'var(--w-lav)' }
                          : { background: 'var(--w-accent-wash)', color: 'var(--w-accent-deep)' }
                      }
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- trust */}
      {/* The reference puts an "As featured in" logo row here. This has no
          press, and inventing testimonials for a mental-health tool is not a
          thing worth doing — so the social proof is the provenance of the
          instruments, which is a stronger claim and needs nobody's consent. */}
      <section id="trust" className="scroll-mt-20 py-20 sm:py-25" style={{ background: 'var(--w-band)' }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionHead
            eyebrow="Why trust the numbers"
            title="These are the published instruments, not our quiz."
            sub="Each one carries its full name, its citation and its licence on the page where you take it. A score places you in a range that the instrument's authors defined — it is never a diagnosis, and it describes a few weeks rather than you."
          />

          <div className="mt-11 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
            {['PHQ-9', 'GAD-7', 'WHO-5', 'C-SSRS', 'PSS-10', 'UCLA-3', 'MSPSS'].map((n) => (
              <span key={n} className="font-display text-[1.35rem]" style={{ color: 'var(--w-ink-soft)' }}>
                {n}
              </span>
            ))}
          </div>

          <p
            className="mx-auto mt-10 max-w-2xl text-center text-[13px] leading-relaxed"
            style={{ color: 'var(--w-ink-soft)' }}
          >
            DP Sahay AI is a reflective prototype, not a medical device, and nothing in it is a
            diagnosis. If you are in danger right now, please use the crisis contacts rather than
            the app.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- privacy */}
      {/* Answering the objection that actually stops sign-ups, before the ask
          rather than after it. */}
      <section id="privacy" className="scroll-mt-20 py-20 sm:py-25">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <SectionHead eyebrow="Privacy" title="Who can see this." />

          <div className="mt-11 flex flex-col gap-5">
            {[
              ['Nobody, by default.', 'Your words, your mood and your scores are yours. No counsellor, no warden, no parent — until you invite one.'],
              ['Invitations are yours to undo.', 'If you have invited someone to follow along, you can take it back from your account page, and it takes effect immediately.'],
              ['You can delete everything.', 'The whole account, from inside the app. Not a support ticket.'],
            ].map(([head, body]) => (
              <div key={head} className="w-card p-6">
                <h3 className="font-display text-[1.25rem]">{head}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- cta */}
      <section className="px-5 pb-20 sm:px-8">
        <div
          className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center"
          style={{ background: 'var(--w-accent-wash)', border: '1px solid var(--w-line)' }}
        >
          <p className="w-eyebrow">Start here</p>
          <h2 className="font-display text-[2rem] leading-tight sm:text-[2.5rem]" style={{ textWrap: 'balance' }}>
            How is today sitting?
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
            Thirty seconds, and you will have a thought for the day and one day on your streak.
          </p>
          <button
            type="button"
            onClick={go}
            className="press mt-2 rounded-full px-8 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--w-accent-deep)' }}
          >
            Sign in to start
          </button>
          <div className="mt-1">
            <CrisisContacts variant="link" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t py-14" style={{ borderColor: 'var(--w-line)', background: 'var(--w-band)' }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-4">
              <span className="flex items-center gap-2.5">
                <Logo size={28} glow={false} from="#ec4899" to="#9d174d" />
                <span className="font-display text-[1.15rem] leading-none">DP Sahay AI</span>
              </span>
              <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
                A quiet minute, once a day, and the real instruments when you want a straighter
                answer.
              </p>
            </div>

            {FOOTER.map((col) => (
              <div key={col.head} className="flex flex-col gap-3">
                <p className="font-display text-[1.05rem]">{col.head}</p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map(([label, to]) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="text-sm transition-colors hover:text-[var(--w-ink)]"
                        style={{ color: 'var(--w-ink-soft)' }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mt-12 flex flex-col gap-3 border-t pt-7 text-[12px] sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--w-line)', color: 'var(--w-ink-soft)' }}
          >
            <p>DP Sahay AI — a reflective prototype, not a medical device.</p>
            <p>
              In danger right now? Call KIRAN <span className="whitespace-nowrap">1800-599-0019</span>,
              free and open around the clock. Emergency: 112.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
