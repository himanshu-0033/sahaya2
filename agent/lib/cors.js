// Same allowlist rules as the backend's lib/cors.js, and for the same reason:
// ALLOWED_ORIGIN names more than one origin.
//
// This module used to send the variable through untouched —
// `res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN)`.
// With a single origin that works. With the comma-separated value the backend
// has always wanted, it emits one header containing two origins, which is not
// a legal value: browsers match it against neither, block every response, and
// the app reports the chat as unreachable rather than as misconfigured.
//
// Duplicated rather than imported because the agent deploys as its own Vercel
// project from its own directory and cannot reach backend/lib at build time.
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
  // Not on the list: send no Access-Control-Allow-Origin at all, rather than
  // echoing a different allowed origin — which the browser blocks with an
  // opaque "Failed to fetch" that reads like the service being down.
  return null;
}

export function applyCors(req, res) {
  const origin = resolveOrigin(req);
  res.setHeader('Vary', 'Origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
