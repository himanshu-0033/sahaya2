// ALLOWED_ORIGIN may list several origins (comma-separated) — the resident
// app and the counsellor console deploy separately, so both need access.
function allowedOrigins() {
  return (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function resolveOrigin(req) {
  const allowed = allowedOrigins();
  if (allowed.length === 0) return '*';

  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0];
}

export function applyCors(req, res) {
  const origin = resolveOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (origin !== '*') res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
