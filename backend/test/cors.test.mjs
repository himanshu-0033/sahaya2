// The deploy instructions end with "set ALLOWED_ORIGIN, then redeploy so CORS
// is locked down instead of *". This checks that sentence is true, because it
// was not: the fallback list was added to the configured one rather than used
// instead of it, so https://*.vercel.app was allowed on every deployment
// whatever the allowlist said, and anybody can put a site on a vercel.app
// subdomain in a couple of minutes.
import assert from 'node:assert/strict';

function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
    end() { return this; },
  };
}

// Each case re-imports the module, because the allowlist is read from the
// environment and the module is where that reading happens.
async function allowFor(origin, allowedOrigin) {
  if (allowedOrigin === undefined) delete process.env.ALLOWED_ORIGIN;
  else process.env.ALLOWED_ORIGIN = allowedOrigin;
  const { applyCors } = await import(`../lib/cors.js?case=${encodeURIComponent(`${allowedOrigin}|${origin}`)}`);
  const res = fakeRes();
  applyCors({ method: 'GET', headers: { origin } }, res);
  return res.headers['access-control-allow-origin'];
}

const PROD = 'https://sahay.example.app';

// --- with an allowlist, only the allowlist ---------------------------------
assert.equal(await allowFor(PROD, PROD), PROD, 'the configured origin is allowed');

assert.equal(
  await allowFor('https://anyone-at-all.vercel.app', PROD),
  undefined,
  'a vercel.app subdomain is NOT allowed once an allowlist is configured',
);
assert.equal(
  await allowFor('http://localhost:5173', PROD),
  undefined,
  'and neither is localhost, which is somebody else\'s machine as far as this is concerned',
);
assert.equal(
  await allowFor('https://evil.test', PROD),
  undefined,
  'an unlisted origin gets no header at all, rather than a different allowed one',
);

// --- several origins, because the two apps deploy separately ---------------
const ADMIN = 'https://sahay-admin.example.app';
assert.equal(await allowFor(ADMIN, `${PROD},${ADMIN}`), ADMIN, 'a comma-separated list works');
assert.equal(await allowFor(PROD, `${PROD}, ${ADMIN}`), PROD, 'and tolerates spaces around entries');

// --- an operator can still opt into previews, on purpose -------------------
assert.equal(
  await allowFor('https://sahay-git-branch.vercel.app', `${PROD},https://*.vercel.app`),
  'https://sahay-git-branch.vercel.app',
  'the wildcard still works when it is asked for explicitly',
);

// --- with no allowlist, the fallback covers dev and previews ---------------
assert.equal(
  await allowFor('http://localhost:5173', undefined),
  'http://localhost:5173',
  'local dev works with nothing configured',
);
assert.equal(
  await allowFor('https://sahay-git-branch.vercel.app', undefined),
  'https://sahay-git-branch.vercel.app',
  'and so do preview deployments',
);
assert.equal(
  await allowFor('https://evil.test', undefined),
  undefined,
  'but the fallback is a list, not a wildcard: an arbitrary origin is still refused',
);

// The same machine under its other names.
//
// The fallback knew the word "localhost" and not the number, so a tab opened
// at 127.0.0.1 had every request refused while the backend answered fine, and
// what the app showed for that was "Can't reach the server". `vite --host
// 127.0.0.1` prints exactly that URL, and on Windows people switch to it
// precisely because localhost resolves to ::1 first.
for (const origin of ['http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://[::1]:5173']) {
  assert.equal(
    await allowFor(origin, undefined),
    origin,
    `${origin} is this machine and must work in dev, like localhost does`,
  );
}

// --- the wildcard stands in for one label, not for a path ------------------
assert.equal(
  await allowFor('https://evil.test/x.vercel.app', undefined),
  undefined,
  'a path cannot be smuggled past the wildcard',
);

console.log('cors checks passed: the allowlist is the whole list, and the fallback only covers an unset one');
