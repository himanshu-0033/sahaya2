// A per-client request counter for the routes that run with no session behind
// them, where there is no user id to count against and an IP has to do.
//
// ponytail: per-instance counters. Several serverless instances do not share
// the map, so the real ceiling is (instances x max). It stops a runaway client,
// which is the actual failure to defend against; a shared counter in Mongo is
// the upgrade if this ever needs a true global cap.
export function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function limiter({ windowMs = 60_000, max }) {
  const hits = new Map();
  return function overLimit(key) {
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || now > rec.reset) {
      if (hits.size > 5000) hits.clear();
      hits.set(key, { n: 1, reset: now + windowMs });
      return false;
    }
    rec.n += 1;
    return rec.n > max;
  };
}
