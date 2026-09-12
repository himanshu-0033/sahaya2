// Changing a password from inside the account. The reset flow next door is
// about a password you have forgotten; this is the one you still know, so the
// checks here are about what the session alone is NOT allowed to buy you.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';

process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_DIR = path.join(os.tmpdir(), 'sahay-data');
fs.rmSync(DATA_DIR, { recursive: true, force: true });

const store = await import('../lib/store.js');
const { signSessionToken } = await import('../lib/auth.js');
const { default: changePassword } = await import('../handlers/auth/password.js');
const { default: profile } = await import('../handlers/profile.js');

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

async function call(handler, { method = 'POST', token = null, body = undefined }) {
  const res = fakeRes();
  await handler(
    { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body, query: {} },
    res,
  );
  return res;
}

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

const ashaToken = signSessionToken({ sub: 'r-pass', email: 'asha@example.test', name: 'Asha' });
const raviToken = signSessionToken({ sub: 'r-google', email: 'ravi@example.test', name: 'Ravi' });

// --- a session on its own buys nothing ---------------------------------
let r = await call(changePassword, { body: { currentPassword: 'x', password: 'a-new-password' } });
assert.equal(r.statusCode, 401, 'no session is refused');

r = await call(changePassword, {
  token: ashaToken,
  body: { currentPassword: 'not-the-password', password: 'a-new-password' },
});
assert.equal(r.statusCode, 401, 'a valid session with the wrong current password is refused');

r = await call(changePassword, { token: ashaToken, body: { password: 'a-new-password' } });
assert.equal(r.statusCode, 401, 'a missing current password is refused, not treated as blank');

let after = (await store.readAll('residents')).find((x) => x.id === 'r-pass');
assert.ok(await bcrypt.compare('original-password', after.passwordHash), 'none of that changed it');

// --- the weak-password floor is the same one signup and reset use -------
r = await call(changePassword, {
  token: ashaToken,
  body: { currentPassword: 'original-password', password: 'short' },
});
assert.equal(r.statusCode, 400, 'a password under eight characters is refused');

// --- a Google account has nothing to change ----------------------------
r = await call(changePassword, {
  token: raviToken,
  body: { currentPassword: 'anything', password: 'a-new-password' },
});
assert.equal(r.statusCode, 400, 'a Google account cannot have a password set through this route');
assert.ok(
  !(await store.readAll('residents')).find((x) => x.id === 'r-google').passwordHash,
  'and no hash was written to it',
);

// --- the happy path, and what it clears away ---------------------------
await store.appendRecord('passwordResets', {
  id: 'a'.repeat(64),
  residentId: 'r-pass',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
});

r = await call(changePassword, {
  token: ashaToken,
  body: { currentPassword: 'original-password', password: 'a-brand-new-password' },
});
assert.equal(r.statusCode, 200, 'the right current password changes it');

after = (await store.readAll('residents')).find((x) => x.id === 'r-pass');
assert.ok(await bcrypt.compare('a-brand-new-password', after.passwordHash), 'the new password works');
assert.ok(!(await bcrypt.compare('original-password', after.passwordHash)), 'the old one does not');
assert.equal(after.email, 'asha@example.test', 'the rest of the record survived');
assert.equal(after.name, 'Asha', 'the rest of the record survived');
assert.equal(
  (await store.readAll('passwordResets')).length,
  0,
  'a reset link already sitting in an inbox is dead now',
);

// --- the profile tells the account page which form to show, and no more -
r = await call(profile, { method: 'GET', token: ashaToken });
assert.equal(r.body.profile.hasPassword, true, 'a password account is told it has one');
assert.ok(!('passwordHash' in r.body.profile), 'and the hash itself never leaves the server');

r = await call(profile, { method: 'GET', token: raviToken });
assert.equal(r.body.profile.hasPassword, false, 'a Google account is told it has none');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('password change checks passed: current password required, Google refused, reset links cleared');
