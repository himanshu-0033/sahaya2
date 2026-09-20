// Sign-in used to accept an unlimited number of guesses and tell you, in the
// friendlier of its two errors, whether the address you guessed at had an
// account. This pins both doors shut and checks the ones next to them.
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_DIR = path.join(os.tmpdir(), 'sahay-data');
fs.rmSync(DATA_DIR, { recursive: true, force: true });

const { appendRecord, readAll } = await import('../lib/store.js');
const { default: loginHandler } = await import('../handlers/auth/login.js');
const { default: forgotHandler } = await import('../handlers/auth/forgot.js');
const { default: signupHandler } = await import('../handlers/auth/signup.js');

function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
    end() { return this; },
  };
}

async function call(handler, { body, ip = '203.0.113.1' }) {
  const req = { method: 'POST', headers: { 'x-forwarded-for': ip }, body, query: {} };
  const res = fakeRes();
  await handler(req, res);
  return res;
}

await appendRecord('residents', {
  id: 'local_asha',
  name: 'Asha',
  email: 'asha@example.test',
  passwordHash: await bcrypt.hash('correct horse battery', 10),
  onboarded: true,
  sharedWith: [],
  createdAt: new Date().toISOString(),
});
// Signed up with Google: a real account, but nothing to sign in to with a
// password. This is the one the old message singled out.
await appendRecord('residents', {
  id: 'google_bilal',
  name: 'Bilal',
  email: 'bilal@example.test',
  onboarded: true,
  sharedWith: [],
  createdAt: new Date().toISOString(),
});

// --- the refusal does not say whether the account exists -------------------
const wrongPassword = await call(loginHandler, {
  body: { identifier: 'asha@example.test', password: 'not it' },
  ip: '198.51.100.1',
});
const googleOnly = await call(loginHandler, {
  body: { identifier: 'bilal@example.test', password: 'not it' },
  ip: '198.51.100.2',
});
const noSuchAccount = await call(loginHandler, {
  body: { identifier: 'nobody@example.test', password: 'not it' },
  ip: '198.51.100.3',
});

assert.equal(wrongPassword.statusCode, 401);
assert.equal(googleOnly.statusCode, 401);
assert.equal(noSuchAccount.statusCode, 401);
assert.equal(
  new Set([wrongPassword.body.error, googleOnly.body.error, noSuchAccount.body.error]).size,
  1,
  'a registered address, a Google-only address and an unknown one get the same refusal',
);
assert.match(wrongPassword.body.error, /Continue with Google/, 'and the useful hint survives');

// --- the right password still works ----------------------------------------
const ok = await call(loginHandler, {
  body: { identifier: 'asha@example.test', password: 'correct horse battery' },
  ip: '198.51.100.4',
});
assert.equal(ok.statusCode, 200, 'the actual password still signs in');
assert.ok(ok.body.token, 'and comes back with a session');

// --- guessing runs out ------------------------------------------------------
// Ten attempts per account per quarter hour. Asha has had two above, so the
// eleventh overall is the one that should be refused as a rate limit rather
// than as a wrong password.
let limited = null;
for (let i = 0; i < 12; i += 1) {
  const res = await call(loginHandler, {
    body: { identifier: 'asha@example.test', password: `guess-${i}` },
    // Different IP each time: a botnet spreading the guesses must not help.
    ip: `192.0.2.${i + 1}`,
  });
  if (res.statusCode === 429) { limited = res; break; }
}
assert.ok(limited, 'guessing one account from many addresses still runs out of attempts');
assert.match(limited.body.error, /Too many sign-in attempts/);

// The limit is per account, so a different account is unaffected by Asha's.
const otherAccount = await call(loginHandler, {
  body: { identifier: 'bilal@example.test', password: 'not it' },
  ip: '192.0.2.99',
});
assert.equal(otherAccount.statusCode, 401, 'one account being hammered does not lock out another');

// --- a reset request over the limit is indistinguishable from one under -----
const first = await call(forgotHandler, { body: { email: 'asha@example.test' }, ip: '203.0.113.7' });
assert.equal(first.statusCode, 200);

// Every request that actually goes through issues a fresh token and discards
// the previous one, so the stored record's id changes each time. Once the
// limiter engages the id stops moving, which is the only way to tell from out
// here that a request was throttled: the response deliberately does not say.
//
// Five an hour per address, so the burst below spends what is left and the
// check is that the id has stopped moving by the end, not that it never moved.
const tokenId = async () => (await readAll('passwordResets'))[0]?.id;
assert.ok(await tokenId(), 'the first request really did issue a token');

let last = first;
for (let i = 0; i < 10; i += 1) {
  last = await call(forgotHandler, { body: { email: 'asha@example.test' }, ip: `203.0.113.${20 + i}` });
}

assert.equal(last.statusCode, 200, 'a throttled reset request still answers 200');
assert.deepEqual(
  last.body,
  first.body,
  'and answers exactly what an unthrottled one answers, or the limit becomes the membership check',
);

const exhausted = await tokenId();
await call(forgotHandler, { body: { email: 'asha@example.test' }, ip: '203.0.113.200' });
assert.equal(
  await tokenId(),
  exhausted,
  'once the address is out of attempts, asking again mails nothing and issues no new token',
);

// --- signup stops a script --------------------------------------------------
let signupLimited = null;
for (let i = 0; i < 20; i += 1) {
  const res = await call(signupHandler, {
    body: { name: `Bot ${i}`, email: `bot${i}@example.test`, password: 'a-long-enough-password' },
    ip: '198.18.0.1',
  });
  if (res.statusCode === 429) { signupLimited = res; break; }
}
assert.ok(signupLimited, 'accounts cannot be created from one address without limit');

console.log('auth limit checks passed: one refusal for every address, guessing runs out, resets stay silent');
