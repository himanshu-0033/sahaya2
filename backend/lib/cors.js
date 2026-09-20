// ALLOWED_ORIGIN may list several origins (comma-separated) — the resident
// app and the counsellor console deploy separately, so both need access.
// An entry may use a single `*` wildcard (e.g. https://*.vercel.app) so
// Vercel preview deployments, which get a fresh URL on every push, keep
// working without editing the list each time.
function allowedOrigins() {
  return (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function matches(pattern, origin) {
  const star = pattern.indexOf('*');
  if (star === -1) return pattern === origin;

  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (origin.length < prefix.length + suffix.length) return false;
  if (!origin.startsWith(prefix) || !origin.endsWith(suffix)) return false;
  // The wildcard stands in for one label, not an arbitrary path — so
  // https://*.vercel.app must not match https://evil.com/x.vercel.app.
  return !origin.slice(prefix.length, origin.length - suffix.length).includes('/');
}

// The fallback list, used only while ALLOWED_ORIGIN is unset.
//
// These used to be added to the explicit list rather than used instead of it,
// which meant https://*.vercel.app was allowed on every deployment no matter
// what ALLOWED_ORIGIN said. Anybody can put a site on a vercel.app subdomain
// in a couple of minutes, so the allowlist the deploy instructions tell you to
// set, in the step that says CORS is now locked down instead of `*`, was not
// locking anything down: the open door was a second list this file kept to
// itself.
//
// It is not the catastrophe it first looks like, because nothing here is
// authorised by a cookie. Every route reads a bearer token, which another
// origin cannot read out of this one's storage, so the reachable surface was
// the unauthenticated routes. That is still sign-in, signup and password
// reset, called from any page any visitor happens to open, which is exactly
// the traffic the limiters in those handlers count per client: distributed
// across a site's visitors, the per-client count is one each.
//
// So: convenience while there is no allowlist, and nothing but the allowlist
// once there is one. An operator who wants preview deployments to keep working
// puts `https://*.vercel.app` in ALLOWED_ORIGIN themselves, which the wildcard
// matching above already supports. That is a decision worth making on purpose.
const FALLBACK_PATTERNS = [
  'https://*.vercel.app',
  'http://localhost:*',
  // The same machine under its other name. `vite --host 127.0.0.1` prints a
  // 127.0.0.1 URL, some editors open one, and Windows resolves localhost to
  // ::1 first often enough that people switch to the numeric form to get
  // around it. Every one of those tabs was refused by an allowlist that only
  // knew the word, and a refused preflight surfaces in the app as "Can't
  // reach the server" with the backend sitting there answering fine.
  'http://127.0.0.1:*',
  'http://[::1]:*',
];

function resolveOrigin(req) {
  const explicit = allowedOrigins();
  const all = explicit.length > 0 ? explicit : FALLBACK_PATTERNS;

  const origin = req.headers.origin;
  if (origin && all.some((a) => matches(a, origin))) return origin;
  // Not on the list: send no Access-Control-Allow-Origin at all. Echoing a
  // *different* allowed origin (what this used to do) makes the browser
  // block the response with an opaque "Failed to fetch", which reads like
  // the backend is down rather than like a misconfigured allowlist.
  return null;
}

export function applyCors(req, res) {
  const origin = resolveOrigin(req);
  res.setHeader('Vary', 'Origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // DELETE is here because /api/sharing uses it to revoke access. Omitting it
  // failed only in production: the dev proxy makes the app same-origin, so no
  // preflight is sent and the gap is invisible until deploy.
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
