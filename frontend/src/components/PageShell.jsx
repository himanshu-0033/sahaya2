import AskDP from './AskDP.jsx';
import TabBar from './TabBar.jsx';

// The frame every signed-in page sits in.
//
// The background used to be two large, animated, heavily-saturated colour
// blobs — one top-left, one bottom-right — at 30% opacity behind every screen.
// They were the loudest element on pages whose actual job is to be read while
// someone is upset, and they made body text sit on an uneven ground, which is
// the main thing that reads as "unfinished" rather than "designed".
//
// What replaced them: a single, still, low-opacity wash anchored to the top of
// the page, where there is no body copy. It is enough to tell Calm from Tests
// at a glance — which is all the section colour was ever for — and it leaves
// the reading area a flat, even surface.
//
// `section` drives that wash and nothing else. Content decides its own accents.

const WASH = {
  home: 'rgba(31, 174, 149, 0.13)',
  paths: 'rgba(224, 163, 213, 0.13)',
  calm: 'rgba(167, 156, 240, 0.14)',
  tests: 'rgba(88, 182, 245, 0.12)',
  inkblot: 'rgba(217, 165, 92, 0.12)',
  read: 'rgba(143, 214, 180, 0.12)',
};

const WIDTH = {
  default: 'max-w-2xl',
  wide: 'max-w-3xl',
  narrow: 'max-w-xl',
};

export default function PageShell({
  section = 'home',
  width = 'default',
  tabs = true,
  children,
}) {
  const wash = WASH[section] || WASH.home;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        {/* Wide and shallow, fading out well above the fold. An ellipse rather
            than a circle so it reads as ambient light from off-screen instead
            of as a coloured object sitting behind the text. */}
        <div
          className="absolute inset-x-0 top-0 h-[26rem]"
          style={{ background: `radial-gradient(120% 100% at 50% 0%, ${wash}, transparent 70%)` }}
        />
      </div>

      {tabs && <TabBar />}
      {/* Same signal as the tab bar: shown where someone is browsing, hidden
          inside a flow they are partway through. */}
      {tabs && <AskDP />}

      <div
        className={`mx-auto px-5 sm:px-6 ${WIDTH[width]} ${tabs ? 'pad-tabbar' : 'pb-12'} pt-6 md:pt-0`}
      >
        {children}
      </div>
    </div>
  );
}
