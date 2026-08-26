import { resolveRoute } from '../lib/routes.js';

// Every /api/* request enters here.
//
// One function serving all routes, rather than one file per route. The
// file-per-route layout is the more idiomatic Vercel shape and it is what
// this was, until 19 routes met the Hobby plan's ceiling of 12 functions per
// deployment: builds kept succeeding, deploys kept failing at the very last
// step, and production quietly stayed on a months-old build while the repo
// moved on. A catch-all has no such ceiling.
//
// Requests arrive by the rewrite in vercel.json, which hands the original
// path over in ?path=. The first attempt at this relied on the filesystem
// catch-all `api/[...path].js` instead, and that deployed as if it were a
// single-segment `[param]`: /api/checkins resolved, /api/auth/login returned
// the platform's own 404. A plain rewrite has no such ambiguity.
//
// The handlers are unchanged and still take Vercel's (req, res) — they simply
// live under handlers/ now, where the platform will not turn each one into a
// function of its own.
function pathnameOf(req) {
  // The rewrite's capture, when that is how the request arrived.
  const captured = req.query?.path;
  if (typeof captured === 'string' && captured) return `/api/${captured}`;
  if (Array.isArray(captured) && captured.length) return `/api/${captured.join('/')}`;

  // Direct hit, or local dev: req.url carries the path, and the query string
  // with it.
  return new URL(req.url, `https://${req.headers.host || 'localhost'}`).pathname;
}

export default async function handler(req, res) {
  const pathname = pathnameOf(req);
  const route = resolveRoute(pathname);

  if (!route) {
    // Answered here rather than by the platform's own 404, which carries no
    // CORS headers — the browser then blocks it and the app reports an
    // unreachable server instead of a missing route.
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(404).json({ error: `No such route: ${pathname}` });
  }

  return route(req, res);
}
