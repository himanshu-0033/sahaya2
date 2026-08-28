import { Component } from 'react';

// The screen of last resort.
//
// Until now a render error anywhere in the tree unmounted the whole app and
// left a black rectangle. No message, no way back, no reload button — and,
// worse than any of that, no crisis numbers. The `noscript` block in
// index.html already makes the argument for why that matters: someone can be
// at a bad moment and looking at a blank screen, and the one thing the blank
// screen owes them is a phone number. A crash deserves the same courtesy a
// missing script tag already gets.
//
// Three deliberate choices about what this component is allowed to touch:
//
//   No router.       The error may BE the router, or a route module that
//                    failed to resolve. Both links here are plain `href`s, so
//                    they work by leaving the broken document entirely.
//   No shared UI.    Not Button, not CrisisContacts, not PageShell. Anything
//                    imported here is code that could itself be what broke.
//                    The markup is inline and the styling is inline, and the
//                    only outside dependency is the CSS variables — which are
//                    a stylesheet, and a stylesheet does not throw.
//   No retry button. "Try again" re-renders the same subtree with the same
//                    props and the same bug, so it fails again and reads as
//                    the app refusing to work. A full reload actually clears
//                    the bad state, so that is what the button does.
//
// Nothing is reported anywhere: there is no error service wired up, and
// pretending otherwise with a "we've been notified" line would be a lie told
// to a person having a bad time.

// Same two numbers as the noscript fallback, and for the same reason: the
// national line that answers around the clock, and the emergency number. The
// full list lives in CrisisContacts, which this screen cannot safely import.
const LINES = [
  { name: 'KIRAN mental health helpline', number: '1800-599-0019', tel: '18005990019', note: 'Free, confidential, 24/7' },
  { name: 'Emergency', number: '112', tel: '112', note: 'If you or someone else is in immediate danger' },
];

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // The console is the only place this goes. It is enough for a developer
    // reproducing the crash, and it costs a user nothing.
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center px-5 py-12"
        style={{ background: 'var(--color-cream)', color: 'var(--color-ink)' }}
      >
        <div className="w-full max-w-md">
          <p className="marginalia">Something broke</p>

          <h1 className="font-display mt-3 text-3xl leading-tight">
            This screen stopped working.
          </h1>

          <p className="stack-block text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            That is a fault on our side, not anything you did. Your check-ins are saved on the
            server as you make them, so nothing you have already written is lost.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="press stack-block w-full rounded-full py-4 font-medium"
            style={{ background: 'var(--color-teal)', color: '#07080a' }}
          >
            Reload the page
          </button>

          <a
            href="/"
            className="press stack-item block w-full rounded-full border py-4 text-center"
            style={{ borderColor: 'var(--line-2)', background: 'var(--surface-1)' }}
          >
            Back to the start
          </a>

          <div className="rule-fade stack-section" />

          <p className="marginalia stack-block">If you need someone now</p>

          <div className="stack-item space-y-2">
            {LINES.map((line) => (
              <a
                key={line.tel}
                href={`tel:${line.tel}`}
                className="press flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                style={{ borderColor: 'var(--line-1)', background: 'var(--surface-1)' }}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{line.name}</span>
                  <span className="block text-xs text-[var(--color-muted)]">{line.note}</span>
                </span>
                <span className="num shrink-0 whitespace-nowrap text-[var(--color-teal-dark)]">
                  {line.number}
                </span>
              </a>
            ))}
          </div>

          {/* Development only. In production this is noise a student cannot
              act on; in development it is the first thing you want to see. */}
          {import.meta.env.DEV && (
            <pre className="stack-block overflow-x-auto rounded-2xl border p-4 text-xs leading-relaxed text-[var(--color-muted)]"
                 style={{ borderColor: 'var(--line-1)', background: 'var(--surface-1)' }}>
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
