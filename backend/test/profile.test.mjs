// What the profile endpoint accepts from a body that did not come from the
// form. Every field here is shown back in the counsellor console, and two of
// them are how a person is identified, so the checks are about what one
// account is not allowed to claim about another.
import assert from 'node:assert/strict';
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

const store = await import('../lib/store.js');
const { signSessionToken } = await import('../lib/auth.js');
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

async function call({ method = 'POST', token, body = undefined }) {
  const res = fakeRes();
  await profile(
    { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body, query: {} },
    res,
  );
  return res;
}

const read = async (id) => (await store.readAll('residents')).find((r) => r.id === id);

await store.appendRecord('residents', {
  id: 'r-asha',
  name: 'Asha',
  email: 'asha@example.test',
  phone: '+91 98765 43210',
  dob: '2004-03-11',
  onboarded: true,
  createdAt: '2026-01-04T00:00:00.000Z',
});
await store.appendRecord('residents', {
  id: 'r-invited',
  name: 'Meera',
  email: 'meera@example.test',
  invited: true,
});

const asha = signSessionToken({ sub: 'r-asha', email: 'asha@example.test', name: 'Asha' });
const newcomer = signSessionToken({ sub: 'r-new', email: 'dev@example.test', name: 'Dev' });
const invitee = signSessionToken({ sub: 'r-meera', email: 'meera@example.test', name: 'Meera' });

// --- the address on an existing record cannot be reassigned -------------
let r = await call({ token: asha, body: { name: 'Asha', email: 'someone.else@example.test' } });
assert.equal(r.statusCode, 200, 'the save itself still succeeds');
assert.equal((await read('r-asha')).email, 'asha@example.test', 'the stored address did not move');
assert.equal(r.body.profile.email, 'asha@example.test', 'and the answer says so');

// --- nor claimed by a new account that never proved it holds it ---------
r = await call({ token: newcomer, body: { name: 'Dev', email: 'asha@example.test' } });
assert.equal(r.statusCode, 409, 'a new record cannot take an address already in use');
assert.equal(await read('r-new'), undefined, 'and nothing was written');

// --- an invited placeholder is not an account, so it is still claimable -
r = await call({ token: invitee, body: { name: 'Meera', email: 'meera@example.test' } });
assert.equal(r.statusCode, 200, 'the person who was invited can still sign up as themselves');
assert.equal(
  (await store.readAll('residents')).filter((x) => (x.email || '') === 'meera@example.test').length,
  1,
  'and the placeholder was replaced rather than duplicated',
);

// --- one phone number, one account -------------------------------------
r = await call({ token: invitee, body: { name: 'Meera', phone: '98765 43210' } });
assert.equal(r.statusCode, 409, "another account's number is refused however it is spelled");
assert.equal((await read('r-meera')).phone || '', '', 'and was not written');

r = await call({ token: asha, body: { name: 'Asha', phone: '+91 98765 43210' } });
assert.equal(r.statusCode, 200, 'saving your own number back is not a duplicate of yourself');

// --- a date of birth is a date ------------------------------------------
for (const bad of ['11/03/2004', '2004-13-45', '3004-01-01', 'yesterday']) {
  r = await call({ token: asha, body: { name: 'Asha', dob: bad } });
  assert.equal(r.statusCode, 400, `${bad} is refused`);
}
assert.equal((await read('r-asha')).dob, '2004-03-11', 'none of them landed');

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
r = await call({ token: asha, body: { name: 'Asha', dob: tomorrow } });
assert.equal(r.statusCode, 400, 'a date of birth in the future is refused');

// --- blank means unchanged, for the fields a half-loaded form can drop ---
r = await call({ token: asha, body: { name: '', dob: '', phone: '' } });
assert.equal(r.statusCode, 200);
let after = await read('r-asha');
assert.equal(after.name, 'Asha', 'a blank name keeps the stored one');
assert.equal(after.dob, '2004-03-11', 'a blank date of birth keeps the stored one');
assert.equal(after.phone, '+91 98765 43210', 'a blank phone keeps the stored one');
assert.equal(after.createdAt, '2026-01-04T00:00:00.000Z', 'and the day they joined never moves');

// --- a field is not storage ---------------------------------------------
r = await call({ token: asha, body: { name: 'A'.repeat(5000) } });
assert.equal(r.statusCode, 200);
after = await read('r-asha');
assert.ok(after.name.length <= 120, 'the name is capped');

// --- a phone number is a phone number -----------------------------------
for (const bad of ['9'.repeat(400), '12345', 'call me', '5876543210']) {
  r = await call({ token: asha, body: { name: 'Asha', phone: bad } });
  assert.equal(r.statusCode, 400, `"${bad.slice(0, 20)}" is refused as a phone number`);
}
assert.equal((await read('r-asha')).phone, '+91 98765 43210', 'none of them landed');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('profile checks passed: email and phone cannot be claimed, dates are dates, blanks keep');
