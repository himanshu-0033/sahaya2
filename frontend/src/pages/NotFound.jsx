import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';

// What an address that does not resolve used to show: nothing at all. The
// router had no `path="*"`, so an unmatched URL rendered an empty <Routes>
// inside an empty body — a black screen with no masthead, no tab bar and no
// crisis link. The app was still running perfectly; it just had no opinion
// about where you were.
//
// That is the worst possible failure for this product specifically, because
// the addresses most likely to be mistyped or to go stale are the ones people
// share with each other — a link to a practice, a link to a questionnaire —
// and the person following one is not in a mood to debug a URL.
//
// So this is inside the normal page shell rather than being a standalone
// error screen: the tab bar is the way out, and it is already the way out
// everywhere else in the app. Nothing new to learn at the exact moment
// something has gone wrong.

// Not a list of every section — that is what More is for, and offering six
// choices to someone who followed a broken link is answering a question they
// did not ask. Two doors: the daily loop, and the thing you might have been
// reaching for at a bad moment.
const WAYS_OUT = [
  {
    to: '/',
    title: 'Go home',
    body: "Today's check-in, and where your streak is.",
    hue: 'var(--sec-home)',
  },
  {
    to: '/grounding',
    title: 'Calm',
    body: 'Breathing and grounding practices, a few minutes each.',
    hue: 'var(--sec-calm)',
  },
];

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <PageShell section="home">
      <Header eyebrow="Not found" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[2rem] leading-tight sm:text-[2.6rem]">
          That page isn&apos;t here.
        </h1>
        <p className="stack-item max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The link may be an old one, or the address may have a typo in it. Nothing has happened
          to your account, and your check-ins are where you left them.
        </p>

        {/* The address itself, quietly. Someone who typed it can see the typo,
            and someone who followed a link has something to send back to
            whoever sent it. `break-all` because a long path with no spaces
            will otherwise push the page sideways on a phone. */}
        <p className="stack-item font-mono text-xs break-all text-[var(--color-muted)]">
          {pathname}
        </p>
      </div>

      <div className="stack-section flex flex-col gap-3">
        {WAYS_OUT.map((way, i) => (
          <Link
            key={way.to}
            to={way.to}
            className="card press animate-slide-up relative overflow-hidden p-5 sm:p-6"
            style={{ animationDelay: `${60 + i * 55}ms` }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ background: way.hue }}
            />
            <p className="font-display text-[1.45rem] leading-snug">{way.title}</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {way.body}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
