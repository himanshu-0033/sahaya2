import { Component } from 'react';

// The console's screen of last resort.
//
// Same reasoning as the resident app's boundary, with one difference in what
// is at stake. A crash here does not leave a student staring at a black
// rectangle — it leaves a counsellor unsure whether the console is broken or
// whether the list of residents they were about to work through is genuinely
// empty. "Nothing to show" and "nothing rendered" look identical on a dark
// background, and only one of those is safe to act on.
//
// So the copy says which one it is, in as many words.
//
// Imports nothing but React, and links out with a plain href rather than the
// router: whatever broke may be the router, and a reload is the only recovery
// that actually clears the state that caused it.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center px-6 py-12"
        style={{ background: 'var(--color-cream)', color: 'var(--color-ink)' }}
      >
        <div className="w-full max-w-lg">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Console error
          </p>

          <h1 className="font-display mt-3 text-3xl leading-tight">This screen stopped working.</h1>

          <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            The console failed to render — this is a fault in the console, not a statement about
            your residents.{' '}
            <strong className="font-medium text-[var(--color-ink)]">
              Do not read an empty screen as an empty caseload.
            </strong>{' '}
            No resident data has been changed, and nothing has been sent to anyone.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-lavender)', color: '#14121f' }}
            >
              Reload the console
            </button>
            <a
              href="/"
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-white/30 hover:text-[var(--color-ink)]"
            >
              Back to the dashboard
            </a>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-8 overflow-x-auto rounded-2xl border border-white/8 bg-white/4 p-4 text-xs leading-relaxed text-[var(--color-muted)]">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
