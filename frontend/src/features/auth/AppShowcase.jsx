// The app, shown before anyone signs in: four of its screens, each on a card
// that says what the screen is for.
//
// Drawn in markup rather than screenshotted. A screenshot is a picture of one
// resident's account on one day, goes stale the moment a screen changes, and
// weighs more than all four of these together. These are simplified on
// purpose, and aria-hidden: the heading and sentence on each card are the
// content; the phone is illustration.
import { MOOD_HUE, MOOD_OPTIONS } from '../../shared/moods.js';
import useReveal from '../../shared/useReveal.js';

const INK = '#14201a';
const SOFT = '#5b6a62';
const GREEN = '#0b6b3a';
const WASH = '#e3f1e8';

function Phone({ dark = false, children }) {
  return (
    <div
      className="mx-auto mt-auto w-[82%] max-w-[13.5rem] translate-y-8 rounded-t-[2rem] border-[6px] border-b-0 border-[#0b0f0d] shadow-[0_28px_50px_-18px_rgba(0,0,0,0.6)]"
      style={{ background: dark ? '#0f1512' : '#f6f8f6' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-2 text-[0.5rem] font-semibold"
        style={{ color: dark ? '#e8efe9' : INK }}
      >
        <span>9:41</span>
        <span className="h-3.5 w-14 rounded-full bg-[#0b0f0d]" />
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="h-1.5 w-2.5 rounded-sm bg-current" />
        </span>
      </div>
      <div className="h-[17rem] overflow-hidden px-3 pt-3 text-left">{children}</div>
    </div>
  );
}

// The app's own scale and colours, so this picture and the real Home match.
const MOODS = MOOD_OPTIONS.map((m, i) => [m.label, MOOD_HUE[i]]);

function CheckInScreen() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.14em]" style={{ color: SOFT }}>
          Good evening
        </p>
        <span className="rounded-full px-2 py-0.5 text-[0.5rem] font-semibold" style={{ background: WASH, color: GREEN }}>
          4 days
        </span>
      </div>
      <p className="mt-1.5 text-[0.8rem] font-bold leading-tight" style={{ color: INK }}>
        How is today, really?
      </p>
      <div className="mt-3 flex justify-between rounded-xl bg-white p-2 shadow-sm">
        {MOODS.map(([label, color], i) => (
          <span key={label} className="flex flex-col items-center gap-1">
            <span
              className="h-5 w-5 rounded-full"
              style={{ background: color, boxShadow: i === 3 ? `0 0 0 2px #fff, 0 0 0 3.5px ${color}` : 'none' }}
            />
            <span className="text-[0.4375rem]" style={{ color: SOFT }}>{label}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between rounded-full border bg-white px-3 py-1.5" style={{ borderColor: '#dfe7e2' }}>
        <span className="text-[0.5rem]" style={{ color: SOFT }}>Ask DP anything…</span>
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: WASH }} />
      </div>
      <p className="mt-3 text-[0.5625rem] font-bold" style={{ color: INK }}>Quick actions</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {['Grounding', 'Questionnaires', 'Guided paths', 'Reading'].map((t) => (
          <span key={t} className="rounded-lg bg-white p-2 shadow-sm">
            <span className="block h-3.5 w-3.5 rounded-md" style={{ background: WASH }} />
            <span className="mt-1.5 block text-[0.5rem] font-semibold" style={{ color: INK }}>{t}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function PathsScreen() {
  return (
    <>
      <p className="text-[0.8rem] font-bold" style={{ color: INK }}>Paths</p>
      <div className="mt-2 rounded-xl p-2.5 text-white" style={{ background: 'linear-gradient(150deg, #1f7a78, #134e4a)' }}>
        <p className="text-[0.4375rem] font-semibold uppercase tracking-[0.14em]">In progress</p>
        <p className="mt-1 text-[0.6875rem] font-bold leading-tight">Seven days of breathwork</p>
        <div className="mt-2 h-1 rounded-full bg-white/30">
          <div className="h-1 w-[43%] rounded-full bg-white" />
        </div>
        <p className="mt-1 text-[0.4375rem]">Day 3 of 7</p>
      </div>
      <div className="mt-2.5 flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <span
            key={d}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[0.5rem] font-semibold"
            style={
              d < 3
                ? { background: GREEN, color: '#fff' }
                : d === 3
                  ? { border: `1.5px solid ${GREEN}`, color: GREEN }
                  : { background: '#e6ece8', color: SOFT }
            }
          >
            {d}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[0.5625rem] font-bold" style={{ color: INK }}>More paths</p>
      {['Five nights of winding down', 'Out of a spinning head', 'Five days before an exam'].map((t) => (
        <div key={t} className="mt-1.5 flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
          <span className="h-5 w-5 shrink-0 rounded-md" style={{ background: WASH }} />
          <span className="text-[0.5rem] font-semibold" style={{ color: INK }}>{t}</span>
        </div>
      ))}
    </>
  );
}

function ChatScreen() {
  const bubble = 'max-w-[85%] rounded-xl px-2.5 py-1.5 text-[0.5625rem] leading-snug';
  return (
    <>
      <div className="flex items-center gap-1.5 border-b pb-2" style={{ borderColor: '#e1e8e3' }}>
        <span className="h-4 w-4 rounded-full" style={{ background: GREEN }} />
        <span className="text-[0.6875rem] font-bold" style={{ color: INK }}>DP</span>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        <span className={`${bubble} self-start`} style={{ background: WASH, color: INK }}>
          You wrote &lsquo;tired&rsquo; and &lsquo;flat&rsquo; today. What is sitting heaviest?
        </span>
        <div className="flex flex-wrap gap-1">
          {['Study pressure', 'Placements', 'Family'].map((t) => (
            <span key={t} className="rounded-full border px-2 py-0.5 text-[0.4375rem]" style={{ borderColor: '#cfdcd4', color: SOFT }}>
              {t}
            </span>
          ))}
        </div>
        <span className={`${bubble} self-end text-white`} style={{ background: GREEN }}>
          exams mostly. and i am not sleeping
        </span>
        <span className={`${bubble} self-start`} style={{ background: WASH, color: INK }}>
          That is a lot to hold at once. How long has the sleep been like this?
        </span>
        <span className={`${bubble} self-end text-white`} style={{ background: GREEN }}>
          about two weeks
        </span>
      </div>
    </>
  );
}

function GroundingScreen() {
  return (
    <div className="flex h-full flex-col items-center text-center" style={{ color: '#e8efe9' }}>
      <p className="text-[0.4375rem] font-semibold uppercase tracking-[0.16em] opacity-80">Grounding</p>
      <p className="mt-1 text-[0.75rem] font-bold">Cyclic sighing</p>
      <div className="relative mt-5 flex h-28 w-28 items-center justify-center rounded-full" style={{ border: '1.5px solid rgba(167,215,186,0.35)' }}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'radial-gradient(circle, rgba(167,215,186,0.55), rgba(167,215,186,0.12))' }}>
          <span className="text-[0.625rem] font-semibold">Breathe in</span>
        </div>
      </div>
      <p className="mt-5 text-[1.1rem] font-bold tabular-nums">1:24</p>
      <div className="mt-2 h-1 w-3/4 rounded-full bg-white/15">
        <div className="h-1 w-[45%] rounded-full" style={{ background: '#a7d7ba' }} />
      </div>
      <p className="mt-3 text-[0.5rem] opacity-80">Two short breaths in, one long breath out.</p>
    </div>
  );
}

const SCREENS = [
  {
    eyebrow: 'Daily check-in',
    title: 'How is today, really?',
    body: 'One tap, about thirty seconds, and a streak that counts the days you showed up.',
    tags: ['Mood', 'Streak', '30 seconds'],
    bg: 'linear-gradient(165deg, #0f7a45 0%, #0a4f2c 100%)',
    screen: <CheckInScreen />,
  },
  {
    eyebrow: 'Guided paths',
    title: 'Walk it, day by day.',
    body: 'Five short paths for background anxiety, sleep, a spinning head, self-compassion and exams.',
    tags: ['Anxiety', 'Sleep', 'Exams'],
    bg: 'linear-gradient(165deg, #1f7a78 0%, #134e4a 100%)',
    screen: <PathsScreen />,
  },
  {
    eyebrow: 'DP, the companion',
    title: 'Say what is going on.',
    body: 'A short conversation that knows how today felt. Not a therapist, and it says so.',
    tags: ['Voice', 'Private', 'Crisis contacts'],
    bg: 'linear-gradient(165deg, #b45309 0%, #7c2d12 100%)',
    screen: <ChatScreen />,
  },
  {
    eyebrow: 'Grounding',
    title: 'Breathe it down.',
    body: 'Thirteen practices for a bad ten minutes. Most take under three.',
    tags: ['Box breathing', '5-4-3-2-1', 'Body scan'],
    bg: 'linear-gradient(165deg, #1f2937 0%, #0b1220 100%)',
    screen: <GroundingScreen />,
    dark: true,
  },
];

export default function AppShowcase({ onStart }) {
  // The row rises into view once; the phones then slide up out of their cards
  // one after another (see "Motion" in index.css).
  const [ref, shown] = useReveal();
  return (
    <section id="inside" ref={ref} data-reveal={shown ? 'shown' : 'pending'} className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="reveal-item mx-auto max-w-3xl text-center">
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem]" style={{ textWrap: 'balance' }}>
            Check-ins, questionnaires, grounding and a companion, in one app.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-relaxed" style={{ color: 'var(--w-ink-soft)' }}>
            21 published questionnaires. 13 grounding practices. 5 guided paths. Free, and seen
            only by your counsellor and your institution&apos;s administrator.
          </p>
        </div>

        {/* A row you swipe on a phone, a grid from tablet up. The scroll lives
            on this container, never on the page. */}
        {/* Focusable so the row can be scrolled from a keyboard on a phone,
            where nothing inside it takes focus. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Inside the app"
          className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        >
          {SCREENS.map((s, i) => (
            <article
              key={s.title}
              className="reveal-item group flex h-[36rem] w-[80%] shrink-0 snap-center flex-col overflow-hidden rounded-[1.75rem] px-6 pt-7 text-white shadow-[0_30px_60px_-34px_rgba(10,40,25,0.55)] sm:w-auto"
              style={{ background: s.bg, '--i': i + 1 }}
            >
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em]">{s.eyebrow}</p>
              <h3 className="mt-2.5 text-[1.5rem] font-bold leading-[1.1] tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed">{s.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/50 px-2.5 py-0.5 text-[0.6875rem] font-medium">
                    {t}
                  </span>
                ))}
              </div>
              {/* The phone is clipped by the card's overflow-hidden, so hover
                  raises it and shows more of the screen. Deliberately NOT the
                  lift that a.w-card and button.w-card get: these cards are
                  articles, nothing happens when you click one, and a card that
                  rises under the cursor is a promise of a click target. This
                  moves the picture instead, which reads as the card being
                  alive rather than as an invitation.

                  hover: in Tailwind v4 already carries @media (hover: hover),
                  so a touch device never gets a stuck hover state. */}
              <div aria-hidden="true" className="reveal-phone mt-6 flex flex-1" style={{ '--i': i }}>
                <div className="flex flex-1 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-3 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                  <Phone dark={s.dark}>{s.screen}</Phone>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="reveal-item mt-12 flex justify-center" style={{ '--i': 5 }}>
          <button
            type="button"
            onClick={onStart}
            className="press inline-flex items-center gap-2 rounded-full px-8 py-4 text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--w-accent-deep)' }}
          >
            Get started, it is free
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Arrow({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
