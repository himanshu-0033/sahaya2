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
// would look wrong. Both are the same four destinations in the same order, so
// muscle memory survives switching device.
//
// Deliberately NOT in here: the caregiver and counsellor views. Those belong
// to a different person with a different job, and putting them in a resident's
// tab bar invites a resident to tap into a screen that will refuse them.

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
    to: '/assessments',
    label: 'Tests',
    hue: 'var(--sec-tests)',
    icon: <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1.5 5h5M9.5 12h5M9.5 16h3" />,
  },
  {
    to: '/inkblot-test',
    label: 'Inkblot',
    hue: 'var(--sec-inkblot)',
    icon: <path d="M12 3c3 0 5 2.2 5 5 0 1.6-.7 2.6-.7 4 0 1.7 1.7 2.4 1.7 4.2 0 2.2-2 3.8-6 3.8s-6-1.6-6-3.8c0-1.8 1.7-2.5 1.7-4.2 0-1.4-.7-2.4-.7-4 0-2.8 2-5 5-5Z" />,
  },
];

// `/` is only "Home" when it is exactly `/`; every other tab also owns its
// children, so /grounding/box-breathing keeps the Calm tab lit.
function isActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
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
          className="flex items-stretch justify-around border-t border-white/8 px-2"
          style={{
            height: 'var(--tabbar-h)',
            background: 'rgba(7, 8, 10, 0.86)',
            backdropFilter: 'blur(18px)',
          }}
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.to);
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
          className="flex items-center gap-1 rounded-full border border-white/10 p-1.5"
          style={{ background: 'rgba(7, 8, 10, 0.7)', backdropFilter: 'blur(18px)' }}
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.to);
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
