// The app, shown before anyone signs in: four of its screens, each in a column
// of one ruled table that says what the screen is for.
//
// Drawn in markup rather than screenshotted. A screenshot is a picture of one
// resident's account on one day, goes stale the moment a screen changes, and
// weighs more than all four of these together. These are simplified on
// purpose, and aria-hidden: the heading and sentence in each column are the
// content; the phone is illustration.
//
// This file also holds the pieces the landing page's parts are built from
// (Part, Heading, Arrow), because both files draw the same sheet and this one
// is imported by the other, not the other way round.
import { MOOD_HUE, MOOD_OPTIONS } from '../../shared/moods.js';
import useReveal from '../../shared/useReveal.js';

// The printed form's inks, as literals: the phones are pictures of the app and
// are drawn in exactly its colours.
const INK = '#0f2419';
const SOFT = '#3d5045';
const GREEN = '#0a5c32';
const DEEP = '#073f22';
const WASH = '#dcebe1';
const RULE = 'rgba(10, 92, 50, 0.32)';

// A part of the sheet: the full-ink rule, the part's name, and what it holds.
//
// Printed as it scrolls into view: the rule draws from its left end, then the
// name, then what the part holds (see "Motion" in index.css). `children` may
// be a function of `shown`, for a part whose content has its own moment, like
// the counts in "Why trust it".
export function Part({ id, label, children, className = '' }) {
  const [ref, shown] = useReveal();
  return (
    <section id={id} ref={ref} data-reveal={shown ? 'shown' : 'pending'} className={`scroll-mt-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="f-part f-part-grid">
          {/* Beside the part on a laptop, the way a form names a section in
              its margin. On a phone there is no margin to put it in, and a
              small capital label stacked over every heading is the rhythm of a
              template, so there the rule and the heading carry the part alone
              and the name is left for screen readers. */}
          <p className="reveal-label f-label pt-3 max-[899px]:sr-only">{label}</p>
          <div className="reveal-body min-w-0 min-[900px]:pt-8">
            {typeof children === 'function' ? children(shown) : children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Heading({ children, className = '' }) {
  return (
    <h2 className={`f-title text-[2rem] leading-[1.05] sm:text-[2.75rem] ${className}`} style={{ textWrap: 'balance' }}>
      {children}
    </h2>
  );
}

function Phone({ dark = false, children }) {
  return (
    <div
      className="mx-auto mt-auto w-[82%] max-w-[13.5rem] translate-y-8 rounded-t-[1.75rem] border-[5px] border-b-0"
      style={{ background: dark ? DEEP : '#ffffff', borderColor: INK }}
    >
      <div
        className="flex items-center justify-between px-4 pt-2 text-[0.5rem] font-semibold"
        style={{ color: dark ? '#e8f1eb' : INK }}
      >
        <span>9:41</span>
        <span className="h-3.5 w-14 rounded-full" style={{ background: INK }} />
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="h-1.5 w-2.5 bg-current" />
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
        <p className="text-[0.5rem] font-semibold uppercase tracking-[0.06em]" style={{ color: SOFT }}>
          Good evening
        </p>
        <span className="border px-1.5 py-0.5 text-[0.5rem] font-semibold" style={{ borderColor: GREEN, color: GREEN }}>
          4 days
        </span>
      </div>
      <p className="mt-1.5 text-[0.8rem] font-bold leading-tight" style={{ color: GREEN }}>
        How is today, really?
      </p>
      <div className="mt-3 flex justify-between border p-2" style={{ borderColor: RULE }}>
        {MOODS.map(([label, color], i) => (
          <span key={label} className="flex flex-col items-center gap-1">
            <span
              className="h-5 w-5 rounded-full"
              style={{ background: color, boxShadow: i === 3 ? `0 0 0 2px #fff, 0 0 0 3.5px ${GREEN}` : 'none' }}
            />
            <span className="text-[0.4375rem]" style={{ color: SOFT }}>{label}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between border px-3 py-1.5" style={{ borderColor: RULE }}>
        <span className="text-[0.5rem]" style={{ color: SOFT }}>Ask DP anything…</span>
        <span className="h-3.5 w-3.5" style={{ background: GREEN }} />
      </div>
      <p className="mt-3 text-[0.5625rem] font-bold" style={{ color: INK }}>Quick actions</p>
      <div className="mt-1.5 grid grid-cols-2 border-t border-l" style={{ borderColor: RULE }}>
        {['Grounding', 'Questionnaires', 'Guided paths', 'Reading'].map((t) => (
          <span key={t} className="border-r border-b p-2" style={{ borderColor: RULE }}>
            <span className="block h-3.5 w-3.5 border" style={{ borderColor: GREEN }} />
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
      <p className="text-[0.8rem] font-bold" style={{ color: GREEN }}>Paths</p>
      <div className="mt-2 p-2.5 text-white" style={{ background: GREEN }}>
        <p className="text-[0.4375rem] font-semibold uppercase tracking-[0.06em]">In progress</p>
        <p className="mt-1 text-[0.6875rem] font-bold leading-tight">Seven days of breathwork</p>
        <div className="mt-2 h-1 bg-white/30">
          <div className="h-1 w-[43%] bg-white" />
        </div>
        <p className="mt-1 text-[0.4375rem]">Day 3 of 7</p>
      </div>
      <div className="mt-2.5 flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <span
            key={d}
            className="flex h-5 w-5 items-center justify-center text-[0.5rem] font-semibold"
            style={
              d < 3
                ? { background: GREEN, color: '#fff', border: `1.5px solid ${GREEN}` }
                : d === 3
                  ? { border: `1.5px solid ${GREEN}`, color: GREEN }
                  : { border: `1px solid ${RULE}`, color: SOFT }
            }
          >
            {d}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[0.5625rem] font-bold" style={{ color: INK }}>More paths</p>
      <div className="mt-1.5 border-t" style={{ borderColor: RULE }}>
        {['Five nights of winding down', 'Out of a spinning head', 'Five days before an exam'].map((t) => (
          <div key={t} className="flex items-center gap-2 border-b py-2" style={{ borderColor: RULE }}>
            <span className="h-3.5 w-3.5 shrink-0 border" style={{ borderColor: GREEN }} />
            <span className="text-[0.5rem] font-semibold" style={{ color: INK }}>{t}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ChatScreen() {
  const bubble = 'max-w-[85%] px-2.5 py-1.5 text-[0.5625rem] leading-snug';
  return (
    <>
      <div className="flex items-center gap-1.5 border-b pb-2" style={{ borderColor: RULE }}>
        <span className="h-4 w-4 rounded-full" style={{ background: GREEN }} />
        <span className="text-[0.6875rem] font-bold" style={{ color: INK }}>DP</span>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        <span className={`${bubble} self-start`} style={{ background: WASH, color: INK }}>
          You wrote &lsquo;tired&rsquo; and &lsquo;flat&rsquo; today. What is sitting heaviest?
        </span>
        <div className="flex flex-wrap gap-1">
          {['Study pressure', 'Placements', 'Family'].map((t) => (
            <span key={t} className="border px-2 py-0.5 text-[0.4375rem]" style={{ borderColor: RULE, color: GREEN }}>
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
    <div className="flex h-full flex-col items-center text-center" style={{ color: '#e8f1eb' }}>
      <p className="text-[0.4375rem] font-semibold uppercase tracking-[0.06em] opacity-80">Grounding</p>
      <p className="mt-1 text-[0.75rem] font-bold">Cyclic sighing</p>
      <div className="relative mt-5 flex h-28 w-28 items-center justify-center rounded-full" style={{ border: '1.5px solid rgba(220,235,225,0.35)' }}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(220,235,225,0.22)' }}>
          <span className="text-[0.625rem] font-semibold">Breathe in</span>
        </div>
      </div>
      <p className="mt-5 text-[1.1rem] font-bold tabular-nums">1:24</p>
      <div className="mt-2 h-1 w-3/4 bg-white/15">
        <div className="h-1 w-[45%]" style={{ background: WASH }} />
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
    screen: <CheckInScreen />,
  },
  {
    eyebrow: 'Guided paths',
    title: 'Walk it, day by day.',
    body: 'Five short paths for background anxiety, sleep, a spinning head, self-compassion and exams.',
    tags: ['Anxiety', 'Sleep', 'Exams'],
    screen: <PathsScreen />,
  },
  {
    eyebrow: 'DP, the companion',
    title: 'Say what is going on.',
    body: 'A short conversation that knows how today felt. Not a therapist, and it says so.',
    tags: ['Voice', 'Private', 'Crisis contacts'],
    screen: <ChatScreen />,
  },
  {
    eyebrow: 'Grounding',
    title: 'Breathe it down.',
    body: 'Thirteen practices for a bad ten minutes. Most take under three.',
    tags: ['Box breathing', '5-4-3-2-1', 'Body scan'],
    screen: <GroundingScreen />,
    dark: true,
  },
];

export default function AppShowcase({ onStart }) {
  return (
    <Part id="inside" label="Inside the app" className="pb-4">
      <Heading>Check-ins, questionnaires, grounding and a companion, in one app.</Heading>
      <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed" style={{ color: 'var(--key-soft)' }}>
        21 published questionnaires. 13 grounding practices. 5 guided paths. Free, and seen
        only by your counsellor and your institution&apos;s administrator.
      </p>

      {/* One ruled table from tablet up, four columns on a laptop. On a phone
          the same columns are a row you swipe, and the scroll lives on this
          container, never on the page. */}
      {/* Focusable so the row can be scrolled from a keyboard on a phone,
          where nothing inside it takes focus. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Inside the app"
        className="-mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-0 sm:overflow-visible sm:border-t-[1.5px] sm:border-l-[1.5px] sm:border-[var(--spot)] sm:px-0 sm:pb-0 lg:grid-cols-4"
      >
        {SCREENS.map((s, i) => (
          <article
            key={s.title}
            className="group flex h-[35rem] w-[80%] shrink-0 snap-center flex-col overflow-hidden border-[1.5px] border-[var(--spot)] bg-[var(--paper)] sm:w-auto sm:border-t-0 sm:border-l-0"
          >
            <p className="f-label f-shade border-b-[1.5px] border-[var(--spot)] px-5 py-2.5">{s.eyebrow}</p>
            <div className="px-5 pt-5">
              <h3 className="f-title text-[1.5rem] leading-[1.1]">{s.title}</h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed" style={{ color: 'var(--key-soft)' }}>
                {s.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="border border-[var(--rule)] px-2 py-0.5 text-[0.8125rem]" style={{ color: 'var(--spot)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* The phone is clipped by the column's overflow-hidden, so hover
                raises it and shows more of the screen. Deliberately not a lift
                of the whole column: nothing happens when you click one, and a
                box that rises under the cursor is a promise of a click target.
                This moves the picture instead.

                hover: in Tailwind v4 already carries @media (hover: hover),
                so a touch device never gets a stuck hover state. */}
            <div aria-hidden="true" className="f-shade mt-6 flex flex-1 overflow-hidden border-t border-[var(--rule)] pt-6">
              <div className="reveal-phone flex flex-1" style={{ '--i': i }}>
                <div className="flex flex-1 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-3 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                  <Phone dark={s.dark}>{s.screen}</Phone>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <button type="button" onClick={onStart} className="f-btn">
          Get started, it is free
          <Arrow />
        </button>
      </div>
    </Part>
  );
}

export function Arrow({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
