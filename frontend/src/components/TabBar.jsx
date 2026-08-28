import { Link, useLocation } from 'react-router-dom';

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

export default function TabBar() {
  const { pathname } = useLocation();

  return (
    <>
      {/* ---------------------------- mobile: fixed bottom bar ------------ */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* A gradient scrim above the bar so content scrolling underneath
            fades out rather than colliding with the icons. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-[var(--color-cream)] to-transparent"
        />
        <div
          className="flex items-stretch justify-around border-t border-[var(--line-1)] px-2"
          style={{
            height: 'var(--tabbar-h)',
            background: 'rgba(253, 242, 248, 0.9)',
            backdropFilter: 'blur(18px)',
          }}
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className="press relative flex flex-1 flex-col items-center justify-center gap-1.5 pt-1"
                style={{ color: active ? tab.hue : 'var(--color-muted)' }}
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
                  className="relative text-[10px] tracking-wide transition-opacity duration-300"
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

      {/* ---------------------------- desktop: floating pill -------------- */}
      <nav
        aria-label="Main"
        className="sticky top-5 z-40 mx-auto mb-10 hidden w-fit md:block"
      >
        <div
          className="flex items-center gap-1 rounded-full border border-[var(--line-2)] p-1.5"
          style={{ background: 'rgba(253, 242, 248, 0.78)', backdropFilter: 'blur(18px)' }}
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className="press relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-300"
                style={{
                  color: active ? tab.hue : 'var(--color-ink-soft)',
                  background: active ? `color-mix(in srgb, ${tab.hue} 14%, transparent)` : 'transparent',
                }}
              >
                <TabIcon tab={tab} active={active} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
