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
    hue: 'var(--sec-home)',
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
    hue: 'var(--sec-calm)',
    icon: <path d="M12 3c2.5 3 4 5.4 4 7.8A4 4 0 0 1 12 15a4 4 0 0 1-4-4.2C8 8.4 9.5 6 12 3ZM5 15.5c2 0 3.5 1 3.5 2.5S7 21 5 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Zm14 0c2 0 3.5 1 3.5 2.5S21 21 19 21s-3.5-1-3.5-3 1.5-2.5 3.5-2.5Z" />,
  },
  {
    to: '/more',
    label: 'More',
    hue: 'var(--sec-read)',
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
    hue: 'var(--sec-paths)',
    // A route with a start and a finish. The old pair of chevrons met in the
    // middle and drew an ✕, which is the symbol for closing something.
    icon: (
      <>
        <circle cx="6" cy="19" r="2" />
        <path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" />
        <circle cx="18" cy="3" r="2" />
      </>
    ),
  },
  {
    to: '/assessments',
    label: 'Tests',
    hue: 'var(--sec-tests)',
    icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
  },
  {
    to: '/read',
    label: 'Read',
    hue: 'var(--sec-read)',
    icon: <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
  },
  {
    to: '/inkblot-test',
    label: 'Inkblot',
    hue: 'var(--color-amber)',
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
      className="transition-all duration-300"
    >
      {tab.icon}
    </svg>
  );
}

// One row in the sidebar. The active row is a filled pill in the section's own
// hue — the same signal the bottom bar gives with a glow and a dot.
function SideLink({ tab, active }) {
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      className="press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-300"
      style={{
        color: active ? tab.hue : 'var(--color-ink-soft)',
        background: active ? `color-mix(in srgb, ${tab.hue} 14%, transparent)` : 'transparent',
      }}
    >
      <TabIcon tab={tab} active={active} />
      {tab.label}
    </Link>
  );
}

export default function TabBar() {
  const { pathname } = useLocation();
  const session = useSession();
  const profile = session?.profile;
  const onHome = pathname === '/';

  return (
    <>
      {/* ---------------------------- mobile: fixed bottom bar ------------ */}
      {/* Lifted off the bottom edge and rounded, rather than a full-width
          slab welded to it, the phone shape the reference for this is built
          around. The padding below it is the safe-area inset plus a little, so
          it clears the home indicator instead of sitting under it. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.6rem)' }}
      >
        {/* A gradient scrim above the bar so content scrolling underneath
            fades out rather than colliding with the icons. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-[var(--color-cream)] to-transparent"
        />
        <div
          className="flex items-stretch justify-around rounded-[1.6rem] border border-[var(--line-2)] px-2"
          style={{
            height: 'var(--tabbar-h)',
            background: 'rgba(250, 251, 252, 0.92)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 14px 34px -16px rgba(20, 27, 45, 0.4)',
          }}
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className="press relative m-1.5 flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.15rem] pt-1 transition-colors"
                style={{
                  color: active ? tab.hue : 'var(--color-muted)',
                  background: active
                    ? `color-mix(in srgb, ${tab.hue} 13%, transparent)`
                    : 'transparent',
                }}
              >
                {/* Glow behind the active icon — the thing that makes the bar
                    feel like an app rather than a row of links. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1 h-9 w-9 rounded-full opacity-70 blur-md"
                    style={{ background: tab.hue }}
                  />
                )}
                <span className="relative">
                  <TabIcon tab={tab} active={active} />
                </span>
                <span
                  className="relative text-[0.625rem] tracking-wide transition-opacity duration-300"
                  style={{ opacity: active ? 1 : 0.75 }}
                >
                  {tab.label}
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="animate-tab-in absolute bottom-1.5 h-1 w-1 rounded-full"
                    style={{ background: tab.hue }}
                  />
                )}
              </Link>
            );
          })}
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
        className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--line-1)] px-4 py-5 md:flex"
        style={{ background: 'rgba(250, 251, 252, 0.8)', backdropFilter: 'blur(18px)' }}
      >
        <Link to="/" className="press group flex shrink-0 items-center gap-2.5 px-2">
          <Logo size={24} />
          <span className="font-display text-[1.15rem] leading-none">
            DP Sahay<span className="ml-1.5 text-[0.78em] text-[var(--color-teal-dark)]">AI</span>
          </span>
        </Link>

        <div className="mt-7 flex flex-1 flex-col gap-1 overflow-y-auto">
          {TABS.map((tab) => (
            <SideLink key={tab.to} tab={tab} active={isActive(pathname, tab)} />
          ))}

          <p className="marginalia mt-6 mb-1 px-3">Explore</p>
          {EXPLORE.map((tab) => (
            <SideLink key={tab.to} tab={tab} active={isActive(pathname, tab)} />
          ))}
        </div>

        {/* Pinned to the bottom: who you are, and the one link that has to be
            reachable from anywhere without hunting for it. */}
        <div className="shrink-0 border-t border-[var(--line-1)] pt-4">
          <div className="mb-3 px-1">
            <CrisisContacts variant="link" />
          </div>
          {/* The streak badge is a link of its own, so it sits beside the
              account link rather than inside it: an <a> inside an <a> is
              invalid HTML, and React reported it on every page. */}
          {profile && (
            <div className="flex items-center gap-2 rounded-2xl px-2 py-2 transition-colors hover:bg-[var(--surface-2)]">
            <Link to="/account" className="press flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line-3)] bg-[var(--surface-2)] text-sm font-medium">
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
            </Link>
            {/* Not on Home. The Today card there carries the streak with its
                label, and showing it twice on one screen also squeezed the
                account name to "Himanshu ..." to make room for the second
                copy. Every other screen still gets it here. */}
            {!onHome && <StreakBadge />}
            </div>
          )}
        </div>
      </nav>

    </>
  );
}

