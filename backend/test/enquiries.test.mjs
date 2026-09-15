// The landing page's enquiry form writes to storage with no session behind it,
// so this checks what an open write has to get right: what it refuses, what it
// keeps, that a bot filling the hidden field stores nothing, and that only the
// console can read the results back.
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

const { default: handler } = await import('../handlers/enquiries.js');
const { getEnquiries } = await import('../lib/store.js');

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

// Each call is a different client unless told otherwise, so the rate limit
// only comes into play where it is being tested.
let ip = 0;
async function call(method, body, { sameClient = false } = {}) {
  if (!sameClient) ip += 1;
  const req = { method, headers: { 'x-forwarded-for': `10.0.0.${ip}` }, body };
  const res = fakeRes();
  await handler(req, res);
  return res;
}

const good = {
  type: 'Bring it to my campus',
  firstName: ' Asha ',
  lastName: 'Rao',
  phone: '+91 98765 43210',
  email: 'Asha@College.edu',
  organization: 'Hill College',
  role: 'Student welfare officer',
  message: 'We have 900 students in hostels.',
  heardFrom: ['LinkedIn post', 'LinkedIn post', 'made up'],
  residentId: 'somebody',
};

let res = await call('POST', good);
assert.equal(res.statusCode, 201, 'a complete enquiry is accepted');
const saved = await getEnquiries();
assert.equal(saved.length, 1);
assert.equal(saved[0].firstName, 'Asha', 'trimmed');
assert.equal(saved[0].email, 'asha@college.edu', 'email lower-cased');
assert.deepEqual(saved[0].heardFrom, ['LinkedIn post'], 'unknown and repeated sources dropped');
assert.equal(saved[0].residentId, undefined, 'fields the form does not have are not stored');

res = await call('POST', { ...good, website: 'http://spam.example' });
assert.equal(res.statusCode, 201, 'the hidden field looks like success to a bot');
assert.equal((await getEnquiries()).length, 1, 'and stores nothing');

const rejects = [
  [{ ...good, type: 'Sell me something' }, 'an enquiry type the form does not offer'],
  [{ ...good, firstName: '   ' }, 'a blank required field'],
  [{ ...good, role: undefined }, 'a missing required field'],
  [{ ...good, email: 'not-an-email' }, 'a bad email'],
  [{ ...good, phone: '12' }, 'a phone number too short to be one'],
  [{ ...good, organization: 'x'.repeat(121) }, 'an oversized field'],
  [{ ...good, message: 'x'.repeat(2001) }, 'an oversized message'],
];
for (const [body, what] of rejects) {
  assert.equal((await call('POST', body)).statusCode, 400, `refuses ${what}`);
}
assert.equal((await getEnquiries()).length, 1, 'nothing rejected was written');

await call('POST', good);
await call('POST', good, { sameClient: true });
await call('POST', good, { sameClient: true });
res = await call('POST', good, { sameClient: true });
assert.equal(res.statusCode, 429, 'a fourth send in a minute from one client is refused');

res = await call('GET');
assert.equal(res.statusCode, 401, 'reading enquiries back needs a console sign-in');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('enquiry checks passed: open to send, closed to read, bots store nothing');
