import { useEffect, useRef } from 'react';
import { matchPath, useLocation, useNavigationType } from 'react-router-dom';

// The three things a single-page app has to do by hand on every navigation,
// because the browser stops doing them for you the moment you take over the
// address bar. All three were missing, and each one is invisible until it is
// the thing going wrong.
//
//   1. THE TITLE. Every screen in the app shared one <title>, so a phone's
//      tab switcher, the back-button long-press menu and the browser history
//      were seventeen identical rows. History is a navigation surface; ours
//      was unreadable.
//
//   2. THE SCROLL. React Router does not reset scroll on navigation. Reading
//      an article to the bottom and tapping Calm landed you 2,000px down a
//      short page — usually past its end, so the screen appeared blank. Only
//      forward navigations reset: on Back and Forward the browser restores a
//      position, and stamping it out is the other half of the same bug.
//
//   3. THE FOCUS. Following a link moved the pixels but left the keyboard
//      and the screen reader where they were, on a page that no longer
//      exists. Nothing was announced, and Tab resumed from a stale position.
//      The fix is the standard one: put focus on a heading-shaped element at
//      the top of the new page. Reading its label out loud IS the
//      announcement, so no separate live region is needed — one would only
//      say everything twice.
//
// Mounted once inside the router, above the routes.

const SITE = 'DP Sahay AI';

// Ordered — first match wins, so the more specific pattern comes first.
// `/read/tests/:id` has to be tested before `/read/:articleId`, which would
// otherwise swallow it.
const TITLES = [
  ['/', 'Home'],
  ['/account', 'Your account'],
  ['/more', 'More'],
  ['/checkin', 'Daily check-in'],
  ['/results', 'Your results'],
  ['/inkblot-test', 'Inkblot plates'],
  ['/assessments', 'Questionnaires'],
  ['/assessments/:instrumentId', 'Questionnaire'],
  ['/paths', 'Paths'],
  ['/paths/:pathId', 'Path'],
  ['/read', 'Reading'],
  ['/read/tests/:instrumentId', 'About this questionnaire'],
  ['/read/:articleId', 'Reading'],
  ['/grounding', 'Calm'],
  ['/grounding/:techniqueId', 'Practice'],
  ['/caregiver', 'Caregiver'],
  ['/caregiver/:residentId', 'Resident'],
];

function pageName(pathname) {
  for (const [pattern, name] of TITLES) {
    if (matchPath({ path: pattern, end: true }, pathname)) return name;
  }
  return 'Page not found';
}

export default function RouteChrome() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const markerRef = useRef(null);

  // The first render is the browser's own page load: it has already put the
  // scroll at the top and focus in the document, and stealing focus from a
  // cold start is how a page ends up announcing itself over the top of the
  // user's screen reader still reading the URL.
  const firstRender = useRef(true);

  const name = pageName(pathname);

  useEffect(() => {
    // Home keeps the fuller line, because that is the one that gets shared,
    // bookmarked and shown in a link preview.
    document.title = pathname === '/' ? `${SITE} — you matter to us` : `${name} · ${SITE}`;
  }, [name, pathname]);

  // `search` is in the dependencies because the check-in's stages live in the
  // query string (`?stage=plates`) — a genuinely different screen at the same
  // path. Nothing in this app puts live input into the URL, so this cannot
  // fire on a keystroke.
  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, search, navigationType]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // preventScroll, so that on a Back the browser's restored position
    // survives being focused — otherwise this would undo the exception the
    // scroll effect above just made.
    markerRef.current?.focus({ preventScroll: true });
  }, [pathname, search]);

  return (
    <div
      ref={markerRef}
      tabIndex={-1}
      // Announced on arrival and then out of the way: it takes no space, and
      // it is not in the tab order, so nobody lands on it twice.
      className="sr-only focus:outline-none"
    >
      {name}
    </div>
  );
}
