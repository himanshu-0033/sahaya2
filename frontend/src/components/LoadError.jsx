// What a page shows when its data did not arrive.
//
// This replaces rendering `err.message` directly, which produced the browser's
// own "Failed to fetch" — a string that tells a student nothing, blames
// nothing, and offers nothing to do. Worse, it looks identical whether the
// server is restarting for two seconds or genuinely broken.
//
// Two cases, deliberately worded differently:
//   offline  — the request never reached a server. Almost always temporary
//              (dev server restarting, wifi dropped, tunnel closed), so the
//              retry is the main affordance and the tone is unalarming.
//   anything else — the server answered and said no. That message came from
//              our own backend, so it is shown as written.
export default function LoadError({ error, onRetry, retrying = false }) {
  const offline = error?.offline;
  const message = error?.message || 'Something went wrong.';

  return (
    <div
      className="mt-8 rounded-3xl border p-6"
      style={{
        borderColor: offline ? 'rgba(255,255,255,0.12)' : 'var(--color-flag)',
        background: offline ? 'rgba(255,255,255,0.03)' : 'var(--color-flag-soft)',
      }}
      role="alert"
    >
      <p className="marginalia">{offline ? 'No connection' : 'Could not load'}</p>

      <p className="font-display mt-2.5 text-xl leading-snug">
        {offline ? "Can't reach the server." : message}
      </p>

      {offline && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          This is usually temporary. Nothing you have done is lost.
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="press mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm transition-colors hover:bg-white/[0.09] disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={retrying ? 'animate-spin' : undefined}
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
          {retrying ? 'Trying…' : 'Try again'}
        </button>
      )}
    </div>
  );
}
