// Placeholders that hold the shape of what is coming.
//
// Every async page used to render the word "Loading…" and then drop a full
// screen of cards into place. Two problems with that. The layout jumps, which
// on a phone means the thing you were about to tap moves out from under your
// thumb; and a bare line of text on an empty screen reads as "nothing here"
// rather than "not yet", which is the specific thing that made the app look
// broken in a screen recording on a slow connection.
//
// These match the real content's footprint, so the arrival is a fill rather
// than a jolt.
//
// One accessibility note: the bars themselves are aria-hidden and the wrapper
// carries a single sr-only sentence. A screen reader should hear "loading the
// questionnaires", not a description of nine grey rectangles.

function Bar({ className = '', style }) {
  return <div aria-hidden="true" className={`rounded-lg bg-[var(--surface-2)] ${className}`} style={style} />;
}

export function SkeletonText({ label = 'Loading…', lines = 3 }) {
  const widths = ['85%', '70%', '55%', '78%', '62%'];
  return (
    <div role="status" className="stack-block">
      <span className="sr-only">{label}</span>
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Bar key={i} className="h-4" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>
    </div>
  );
}

// The list-of-cards shape that most of these pages resolve into.
export function SkeletonCards({ label = 'Loading…', count = 4, columns = 2 }) {
  return (
    <div role="status" className="stack-block">
      <span className="sr-only">{label}</span>
      <div className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="card p-5"
            // A shallow stagger in opacity rather than an animation: it keeps
            // the block from reading as one flat slab without adding motion to
            // a screen somebody may be looking at while upset.
            style={{ opacity: 1 - i * 0.09 }}
          >
            <Bar className="h-5 w-3/4" />
            <Bar className="mt-3 h-3.5 w-full" />
            <Bar className="mt-2 h-3.5 w-2/3" />
            <Bar className="mt-5 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// One tall block — a plate, a practice screen, a question card.
export function SkeletonPanel({ label = 'Loading…', height = '18rem' }) {
  return (
    <div role="status" className="stack-block">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="card grid place-items-center p-6" style={{ minHeight: height }}>
        <Bar className="h-full w-full rounded-2xl" style={{ minHeight: `calc(${height} - 3rem)` }} />
      </div>
    </div>
  );
}
