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

function resolveOrigin(req) {
  const allowed = allowedOrigins();
  if (allowed.length === 0) return '*';

  const origin = req.headers.origin;
  if (origin && allowed.some((a) => matches(a, origin))) return origin;
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
