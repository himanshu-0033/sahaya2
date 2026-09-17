import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../shared/Logo.jsx';
import CrisisContacts from '../shared/CrisisContacts.jsx';
import StreakBadge from '../shared/StreakBadge.jsx';
import { useSession } from '../features/auth/useSession.js';

// The app's spine.
//
// Before this, getting from a check-in to the grounding practices meant
// finding a small text link in the corner of a header. Students live in apps
// with a bottom tab bar; anything else reads as a website, and a website is
// something you visit once.
//
// Two presentations of one list: a fixed bottom bar under 768px where a thumb
// can reach it, and a floating pill at the top on desktop where a bottom bar
// would look wrong. Both are the same destinations in the same order, so
// muscle memory survives switching device.
//
// Deliberately NOT in here: the caregiver and counsellor views. Those belong
// to a different person with a different job, and putting them in a resident's
// tab bar invites a resident to tap into a screen that will refuse them.

// Three tabs, down from six.
//
// It carried Home, Paths, Calm, Tests, Read and Inkblot — every section of the
// app given equal billing, which is the same as saying none of them is the
// point. Six tabs on a 360px phone is 57px each, and a person opening this at
// a bad moment had to choose between six things before doing anything.
//
// The product's job is one loop: check in, and calm down when you need to.
// Those get a tab each. Everything else — the seven-day paths, the twenty-one
// questionnaires, the reading, the ten-plate inkblot — is real work that is
// worth keeping and is not what someone needs in the first ten seconds, so it
// lives one tap deeper behind More. Every route still resolves; nothing was
// deleted, and no existing link breaks.
const TABS = [
  {
    to: '/',
    label: 'Home',
    // Two paths per icon: a filled body at low opacity plus a stroked
    // outline, so the active state can light the fill without swapping icons.
    icon: (
      <>
        <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </>
    ),
  },
  {
    to: '/grounding',
    label: 'Calm',
    icon: <path d="M12 3c2.5 3 4 5.4 4 7.8A4 4 0 0 1 12 15a4 4 0 0 1-4-4.2C8 8.4 9.5 6 12 3ZM5 15.5c2 0 3.5 1 3.5 2.5S7 21 5 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Zm14 0c2 0 3.5 1 3.5 2.5S21 21 19 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Z" />,
  },
  {
    to: '/more',
    label: 'More',
    // The sections this tab stands in for, so it lights up while you are
    // inside any of them rather than going dark the moment you arrive.
    owns: ['/paths', '/assessments', '/read', '/inkblot-test'],
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
];


// What More stands in for. Listed outright in the sidebar, where there is room
// for them, and left behind More on the phone, where there is not.
const EXPLORE = [
  {
    to: '/paths',
    label: 'Paths',
    icon: <path d="M18 6l-6 6-6-6M18 18l-6-6-6 6" />,
  },
  {
    to: '/assessments',
    label: 'Tests',
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  },
  {
    to: '/read',
    label: 'Read',
    icon: <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
  },
  {
    to: '/inkblot-test',
    label: 'Inkblot',
    icon: <path d="M12 3c3 3.5 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5.5 5-9Z" />,
  },
];

// `/` is only "Home" when it is exactly `/`; every other tab also owns its
// children, so /grounding/box-breathing keeps the Calm tab lit — and More
// stays lit across every section it stands in for.
function isActive(pathname, tab) {
  const { to, owns = [] } = tab;
  if (to === '/') return pathname === '/';
  const matches = (base) => pathname === base || pathname.startsWith(`${base}/`);
  return matches(to) || owns.some(matches);
}

function TabIcon({ tab, active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.9 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {tab.icon}
    </svg>
  );
}

// One row in the sidebar: a ruled entry in the form's index column. The
// active row is inked solid, white on the spot green, which is how a printed
// form marks the part you are on.
function SideLink({ tab, active }) {
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 border-b border-[var(--rule)] px-5 py-3 text-[0.9375rem] transition-colors duration-150 ${
        active ? 'bg-[var(--spot)] text-white' : 'text-[var(--color-ink-soft)] hover:bg-[var(--paper-tint)] hover:text-[var(--spot)]'
      }`}
    >
      <TabIcon tab={tab} active={active} />
      {tab.label}
    </Link>
  );
}

// Where the phone bar's ink was last drawn. Every page renders its own shell,
// so the bar is a new element after each navigation; remembering the last tab
// here is what lets the ink travel from the tab you left instead of appearing
// on the one you arrived at.
let lastInk = -1;

// The clip that shows only tab `i` of `n` from the solid copy of the row.
function inkClip(i, n) {
  if (i < 0) return 'inset(0 100% 0 0)';
  return `inset(0 ${((n - 1 - i) / n) * 100}% 0 ${(i / n) * 100}%)`;
}

export default function TabBar() {
  const { pathname } = useLocation();
  const session = useSession();
  const profile = session?.profile;
  const active = TABS.findIndex((tab) => isActive(pathname, tab));
  const [ink, setInk] = useState(lastInk < 0 ? active : lastInk);

  useEffect(() => {
    lastInk = active;
    const id = requestAnimationFrame(() => setInk(active));
    return () => cancelAnimationFrame(id);
  }, [active]);

  return (
    <>
      {/* ---------------------------- mobile: fixed bottom bar ------------ */}
      {/* A strip of tabs along the foot of the sheet, ruled off from the page
          with the full ink and flush with the edge. The padding below it is
          the safe-area inset, so it clears the home indicator. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--spot)] bg-[var(--paper)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="relative flex items-stretch" style={{ height: 'var(--tabbar-h)' }}>
          {TABS.map((tab, i) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={i === active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-1 border-l border-[var(--rule)] text-[var(--color-ink-soft)] transition-colors duration-150 first:border-l-0 active:bg-[var(--paper-tint)]"
            >
              <TabIcon tab={tab} active={false} />
              <span className="f-label text-[0.75rem]" style={{ color: 'inherit' }}>
                {tab.label}
              </span>
            </Link>
          ))}

          {/* The ink. A second copy of the row, printed solid and clipped to
              the active tab, so moving it is one clip-path transition and the
              green block and its white label travel together instead of three
              colour changes landing at slightly different moments. Never a
              target: the links underneath take every tap. */}
          <div
            aria-hidden="true"
            className="tab-ink pointer-events-none absolute inset-0 flex bg-[var(--spot)] text-white"
            style={{ clipPath: inkClip(ink, TABS.length) }}
          >
            {TABS.map((tab) => (
              <span key={tab.to} className="flex flex-1 flex-col items-center justify-center gap-1">
                <TabIcon tab={tab} active />
                <span className="f-label text-[0.75rem]" style={{ color: 'inherit' }}>
                  {tab.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* ---------------------------- desktop: left sidebar --------------- */}
      {/* The three tabs were a top pill. A sidebar gives the same destinations
          a column of their own, which is what buys the second group below:
          the phone hides Paths, Tests, Read and the inkblot behind More
          because six targets on a 360px bar is 57px each, and none of that is
          true of a column with room to spare. More still owns them on the
          phone; nothing moved, and no route changed. */}
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-[var(--spot)] bg-[var(--paper)] md:flex"
      >
        <Link to="/" className="flex shrink-0 items-center gap-2.5 border-b-2 border-[var(--spot)] px-5 py-4">
          <Logo size={26} glow={false} />
          <span className="f-title text-[1.15rem] leading-none text-[var(--spot)]">
            DP Sahay<span className="ml-1.5 text-[0.78em]">AI</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {TABS.map((tab) => (
            <SideLink key={tab.to} tab={tab} active={isActive(pathname, tab)} />
          ))}

          <p className="f-label f-shade border-b border-[var(--rule)] px-5 pt-5 pb-2">Explore</p>
          {EXPLORE.map((tab) => (
            <SideLink key={tab.to} tab={tab} active={isActive(pathname, tab)} />
          ))}
        </div>

        {/* Pinned to the bottom: who you are, and the one link that has to be
            reachable from anywhere without hunting for it. */}
        <div className="shrink-0 border-t-2 border-[var(--spot)] px-4 pt-4 pb-4">
          <div className="mb-3">
            <CrisisContacts variant="link" />
          </div>
          {profile && (
            <Link
              to="/account"
              className="flex items-center gap-3 border border-[var(--rule)] px-2 py-2 transition-colors hover:border-[var(--spot)] hover:bg-[var(--paper-tint)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--spot)] bg-[var(--paper-tint)] text-sm font-semibold text-[var(--spot)]">
                {profile.picture ? (
                  <img src={profile.picture} alt="" className="h-full w-full object-cover" />
                ) : (
                  (profile.name || '?').charAt(0).toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{profile.name || 'Your account'}</span>
                <span className="marginalia block">Account</span>
              </span>
              <StreakBadge />
            </Link>
          )}
        </div>
      </nav>

    </>
  );
}
