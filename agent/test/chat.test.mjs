// The agent had no tests. Nothing checked that the endpoint still refused
// anonymous callers, still answered a crisis message without consulting a
// model, or still rejected oversized input — all of which are the kind of
// thing a refactor quietly removes.
//
// Runs against AGENT_PROVIDER=mock, so it needs no key and makes no network
// call. It exercises the real handler through a stand-in for Vercel's
// (req, res), the same contract dev-server.js implements.
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.AGENT_PROVIDER = 'mock';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
process.env.ALLOWED_ORIGIN = 'https://example.test';

const { default: handler } = await import('../api/chat.js');

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

function tokenFor(sub) {
  return jwt.sign({ sub, email: `${sub}@example.test`, name: sub, iss: 'sahay-ai' }, process.env.JWT_SECRET);
}

async function post(body, { sub = 'user-1', auth = true } = {}) {
  const req = {
    method: 'POST',
    headers: auth ? { authorization: `Bearer ${tokenFor(sub)}` } : {},
    body,
  };
  const res = fakeRes();
  await handler(req, res);
  return res;
}

// --- authentication ----------------------------------------------------
let res = await post({ messages: [] }, { auth: false });
assert.equal(res.statusCode, 401, 'an anonymous caller is refused');

res = await post({ messages: [] }, { sub: 'auth-ok' });
assert.equal(res.statusCode, 200, 'a signed session is accepted');
assert.ok(res.body.reply, 'the opener carries a reply');

// --- input validation --------------------------------------------------
res = await post({ messages: 'not-an-array' }, { sub: 'validate' });
assert.equal(res.statusCode, 400, 'messages must be an array');

res = await post({ messages: [{ role: 'wizard', content: 'hi' }] }, { sub: 'validate-2' });
assert.equal(res.statusCode, 400, 'an unknown role is refused');

res = await post({ messages: [{ role: 'user', content: 'x'.repeat(2001) }] }, { sub: 'validate-3' });
assert.equal(res.statusCode, 400, 'an oversized message is refused');

res = await post(
  { messages: Array.from({ length: 25 }, () => ({ role: 'user', content: 'hi' })) },
  { sub: 'validate-4' },
);
assert.equal(res.statusCode, 400, 'too many turns is refused');

// --- crisis screening --------------------------------------------------
// The important property: this answers without reaching a provider at all, so
// it keeps working when the model is unreachable, misconfigured or removed.
res = await post({ messages: [{ role: 'user', content: 'i want to die' }] }, { sub: 'crisis' });
assert.equal(res.statusCode, 200, 'a crisis message is answered');
assert.equal(res.body.flagged, true, 'a crisis message is flagged');
assert.ok(res.body.helplines?.length, 'a crisis reply carries helplines');
assert.ok(/112/.test(JSON.stringify(res.body.helplines)), 'the emergency number is present');

// --- rate limiting -----------------------------------------------------
// A fresh subject, so earlier assertions do not spend its allowance.
const burst = [];
for (let i = 0; i < 12; i += 1) burst.push((await post({ messages: [] }, { sub: 'burst' })).statusCode);

assert.ok(burst.includes(429), 'a burst is eventually rate limited');
assert.equal(burst[0], 200, 'the first request is allowed');
assert.equal(burst.at(-1), 429, 'the last of a burst is refused');
assert.equal(
  burst.filter((c) => c === 200).length,
  8,
  'exactly the configured allowance gets through',
);

// One user's burst must not spend another user's allowance.
res = await post({ messages: [] }, { sub: 'bystander' });
assert.equal(res.statusCode, 200, 'the limit is per user, not global');

console.log('agent checks passed — auth, validation, crisis screen and rate limit all hold');
