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
assert.equal(res.body.category, 'suicide');
assert.ok(/safe right now/.test(res.body.reply), 'the reply asks directly whether they are safe');
assert.ok(!/1800-599-0019/.test(JSON.stringify(res.body)), 'KIRAN was merged into Tele-MANAS and is not offered');
assert.ok(/14416/.test(res.body.reply), 'Tele-MANAS is named in the reply itself');

// Each kind of disclosure gets the help that fits it, with Hinglish and the
// indirect phrasings covered, and the everyday phrases that sound similar left
// alone. Checked against the screen directly, so no rate limit is spent.
const { screenForCrisis, screenConversation } = await import('../lib/safety.js');
const cases = [
  ['I just want to sleep and never wake up', 'suicide'],
  ['everyone would be better off without me', 'suicide'],
  ['main marna chahta hoon', 'suicide'],
  ['jeene ka mann nahi karta', 'suicide'],
  ['I’ve been cutting myself again', 'self_harm'],
  ['khud ko hurt karta hoon', 'self_harm'],
  ['my father hits me when he drinks', 'abuse'],
  ['my boyfriend threatened me last night', 'abuse'],
  ['seniors are ragging us every night', 'abuse'],
  ['papa mujhe maarte hain', 'abuse'],
  ['he beat me up', 'abuse'],
  // Ordinary talk that must not trip a crisis reply.
  ['this deadline is killing me', null],
  ['that song really hits me', null],
  ['my parents forced me to take engineering', null],
  ['the hostel is 5 kms from campus', null],
  ['I could die of embarrassment lol no', null],
  ['my exams are next week', null],
];
for (const [text, category] of cases) {
  assert.equal(screenForCrisis(text).category, category, `"${text}" screens as ${category}`);
}

res = await post({ messages: [{ role: 'user', content: 'my uncle abused me when I was small' }] }, { sub: 'abuse' });
assert.equal(res.body.category, 'abuse');
assert.ok(/not your fault/.test(res.body.reply), 'an abuse reply says it is not their fault');
assert.ok(/181/.test(JSON.stringify(res.body.helplines)), 'and carries the Women Helpline');
assert.ok(/1098/.test(JSON.stringify(res.body.helplines)), 'and Childline');

// A disclosure earlier in the conversation keeps it marked, and keeps the model
// on the safety protocol, after the person has moved on to "ok".
const later = [
  { role: 'assistant', content: 'How is today?' },
  { role: 'user', content: 'i want to kill myself' },
  { role: 'assistant', content: 'Thank you for telling me.' },
  { role: 'user', content: 'ok' },
];
assert.deepEqual(screenConversation(later).categories, ['suicide']);
assert.equal(screenConversation(later).latest.flagged, false);
res = await post({ messages: later }, { sub: 'follow-up' });
assert.equal(res.statusCode, 200);
assert.equal(res.body.flagged, true, 'the follow-up reply still carries the flag');
assert.equal(res.body.category, 'suicide');

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
