// Password reset is the endpoint attackers reach for first, so these checks
// are about what it refuses, and what it refuses to reveal.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';

process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
process.env.RESET_DELIVERY = 'log';
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_DIR = path.join(os.tmpdir(), 'sahay-data');
fs.rmSync(DATA_DIR, { recursive: true, force: true });

const store = await import('../lib/store.js');
const { default: forgot } = await import('../handlers/auth/forgot.js');
const { default: reset } = await import('../handlers/auth/reset.js');

function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(d) {
      this.body = d;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function call(handler, body) {
  const res = fakeRes();
  await handler({ method: 'POST', headers: {}, body }, res);
  return res;
}

// The link goes to the log deliverer, which is the seam's whole point: the
// flow runs end to end with no mail provider. Reading the token back out of
// the log is exactly what a developer does locally.
async function forgotAndCaptureToken(email) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    await call(forgot, { email });
  } finally {
    console.log = original;
  }
  const match = lines.join('\n').match(/reset-password\?token=([A-Za-z0-9_-]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// --- one resident with a password, one who signed up with Google --------
await store.appendRecord('residents', {
  id: 'r-pass',
  name: 'Asha',
  email: 'asha@example.test',
  passwordHash: await bcrypt.hash('original-password', 10),
});
await store.appendRecord('residents', {
  id: 'r-google',
  name: 'Ravi',
  email: 'ravi@example.test',
});

// --- it never reveals whether an account exists -------------------------
const known = await call(forgot, { email: 'asha@example.test' });
const google = await call(forgot, { email: 'ravi@example.test' });
const unknown = await call(forgot, { email: 'nobody@example.test' });

assert.equal(known.statusCode, 200);
assert.deepEqual(google.body, known.body, 'a Google account answers identically to a password account');
assert.deepEqual(unknown.body, known.body, 'an unknown address answers identically to a known one');

let pending = await store.readAll('passwordResets');
assert.equal(pending.length, 1, 'only the account that has a password got a token');
assert.equal(pending[0].residentId, 'r-pass');
assert.ok(!('token' in pending[0]), 'no raw token field is stored');
assert.equal(pending[0].id.length, 64, 'the id is a sha-256 hex digest');

// --- a wrong token, or a weak new password, is refused ------------------
let r = await call(reset, { token: 'not-a-real-token', password: 'new-password-1' });
assert.equal(r.statusCode, 400, 'an unknown token is refused');

r = await call(reset, { token: 'anything', password: 'short' });
assert.equal(r.statusCode, 400, 'a password under eight characters is refused');

// --- the happy path -----------------------------------------------------
const realToken = await forgotAndCaptureToken('asha@example.test');
assert.ok(realToken, 'the log deliverer produced a link');

pending = await store.readAll('passwordResets');
assert.equal(pending.length, 1, 'asking again replaces the earlier link rather than adding one');

// The decisive property: what is stored is the hash OF THIS TOKEN and only
// the hash, so a database leak yields nothing that can be presented to reset.
assert.equal(
  crypto.createHash('sha256').update(realToken).digest('hex'),
  pending[0].id,
  'the stored id is the hash of the issued token',
);
assert.ok(!JSON.stringify(pending[0]).includes(realToken), 'the token itself is nowhere in the record');

r = await call(reset, { token: realToken, password: 'a-brand-new-password' });
assert.equal(r.statusCode, 200, 'a valid token sets the password');
assert.ok(r.body.token, 'and signs the person in');

// --- single use ---------------------------------------------------------
const second = await call(reset, { token: realToken, password: 'another-password' });
assert.equal(second.statusCode, 400, 'the same link cannot be used twice');
assert.equal((await store.readAll('passwordResets')).length, 0, 'the pending reset is gone');

// --- the password really changed, and nothing else did ------------------
let after = (await store.readAll('residents')).find((x) => x.id === 'r-pass');
assert.ok(await bcrypt.compare('a-brand-new-password', after.passwordHash), 'the new password works');
assert.ok(!(await bcrypt.compare('original-password', after.passwordHash)), 'the old password does not');
assert.equal(after.email, 'asha@example.test', 'the rest of the record survived');
assert.equal(after.name, 'Asha', 'the rest of the record survived');

// --- an expired link is refused, and changes nothing --------------------
const staleToken = await forgotAndCaptureToken('asha@example.test');
const issued = (await store.readAll('passwordResets'))[0];
await store.upsertRecord(
  'passwordResets',
  { id: issued.id },
  { ...issued, expiresAt: new Date(Date.now() - 1000).toISOString() },
);

const stale = await call(reset, { token: staleToken, password: 'yet-another-password' });
assert.equal(stale.statusCode, 400, 'an expired link is refused');
assert.equal((await store.readAll('passwordResets')).length, 0, 'and the dead row is cleared away');

after = (await store.readAll('residents')).find((x) => x.id === 'r-pass');
assert.ok(
  await bcrypt.compare('a-brand-new-password', after.passwordHash),
  'an expired link did not change the password',
);

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('password reset checks passed — no enumeration, no stored token, single use, expiry holds');
