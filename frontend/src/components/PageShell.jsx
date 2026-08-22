import TabBar from './TabBar.jsx';

// The frame every signed-in page sits in.
//
// One shell rather than each page rolling its own background and padding, for
// a boring but important reason: before this, four pages each had their own
// slightly different max-width and vertical rhythm, and moving between them
// felt like moving between four websites. Consistency here is what lets the
// per-section colour do its job — if everything else shifts too, the colour
// stops reading as "where am I" and starts reading as noise.
//
// `section` drives the ambient wash and nothing else. The content decides its
// own accents.

const WASH = {
  home: ['rgba(31,174,149,0.42)', 'rgba(167,156,240,0.30)'],
  calm: ['rgba(167,156,240,0.44)', 'rgba(88,182,245,0.28)'],
  tests: ['rgba(88,182,245,0.40)', 'rgba(31,174,149,0.26)'],
  inkblot: ['rgba(217,165,92,0.36)', 'rgba(242,120,159,0.26)'],
};

const WIDTH = {
  default: 'max-w-2xl',
  wide: 'max-w-4xl',
  narrow: 'max-w-xl',
};

export default function PageShell({
  section = 'home',
  width = 'default',
  tabs = true,
  children,
}) {
  const [from, to] = WASH[section] || WASH.home;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Two blobs, different sizes on different periods, deliberately placed
          off-centre and partly off-screen. A symmetrical pair centred behind
          the content is the tell of a generated layout. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="animate-aurora-a absolute -top-52 -left-40 h-[42rem] w-[42rem] rounded-full"
          style={{ background: `radial-gradient(circle, ${from}, transparent 64%)`, filter: 'blur(80px)' }}
        />
        <div
          className="animate-aurora-b absolute -right-56 bottom-[-18rem] h-[38rem] w-[38rem] rounded-full"
          style={{ background: `radial-gradient(circle, ${to}, transparent 66%)`, filter: 'blur(90px)' }}
        />
      </div>

      {tabs && <TabBar />}

      <div className={`mx-auto px-5 sm:px-6 ${WIDTH[width]} ${tabs ? 'pad-tabbar' : 'pb-12'} pt-6 md:pt-0`}>
        {children}
      </div>
    </div>
  );
}
