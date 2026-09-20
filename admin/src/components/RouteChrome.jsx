import { useEffect, useRef } from 'react';
import { matchPath, useLocation, useNavigationType } from 'react-router-dom';

// Title, scroll position and focus on navigation — the three things a
// single-page app has to do by hand. See the resident app's copy of this for
// the long version of why; the console had the same three gaps.
//
// The one that bites hardest here is the scroll. A counsellor works down a
// long resident list, opens someone at the bottom of it, and the detail page
// used to open already scrolled past its own header — including the flag
// banner, which is the single thing that page exists to show.

// The console is the Admin panel. That is what the masthead has said all
// along and what the institution calls it; only the browser tab still said
// "Counsellor console", which is also the one word the badge is never
// supposed to be, since a manager and a super admin are not counsellors.
const SITE = 'Admin panel';

// Every route the console has. /enquiries and /team were missing, so both
// fell through to "Not found": the tab said it and the marker below announced
// it to a screen reader on arrival, on two pages that work perfectly well.
// The resident app had exactly this bug on five routes.
const TITLES = [
  ['/', 'Dashboard'],
  ['/residents', 'Students'],
  ['/residents/:residentId', 'Student'],
  ['/enquiries', 'Enquiries'],
  ['/team', 'Team'],
];

function pageName(pathname) {
  for (const [pattern, name] of TITLES) {
    if (matchPath({ path: pattern, end: true }, pathname)) return name;
  }
  return 'Not found';
}

export default function RouteChrome() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const markerRef = useRef(null);
  const firstRender = useRef(true);

  const name = pageName(pathname);

  useEffect(() => {
    document.title = `${name} · ${SITE}`;
  }, [name]);

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, search, navigationType]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    markerRef.current?.focus({ preventScroll: true });
  }, [pathname, search]);

  return (
    <div ref={markerRef} tabIndex={-1} className="sr-only focus:outline-none">
      {name}
    </div>
  );
}
