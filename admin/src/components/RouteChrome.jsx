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

const SITE = 'Counsellor console';

const TITLES = [
  ['/', 'Dashboard'],
  ['/residents', 'Residents'],
  ['/residents/:residentId', 'Resident'],
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
