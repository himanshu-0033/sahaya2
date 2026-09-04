// The companion's transcripts are the most sensitive thing this app stores, so
// the endpoint that writes them gets checked on the properties that matter:
// who may write, whose name it is filed under, and what it refuses.
//
// VERCEL=1 before the store is imported sends its data file to the OS temp
// directory rather than backend/.data, so this never touches real data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_DIR = path.join(os.tmpdir(), 'sahay-data');
fs.rmSync(DATA_DIR, { recursive: true, force: true });

const { default: handler } = await import('../handlers/chat-log.js');
const { getChatSessions } = await import('../lib/store.js');

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

function tokenFor(sub) {
  return jwt.sign({ sub, email: `${sub}@example.test`, name: sub, iss: 'sahay-ai' }, process.env.JWT_SECRET);
}

async function post(body, { sub = 'resident-1', auth = true } = {}) {
  const req = {
    method: 'POST',
    headers: auth ? { authorization: `Bearer ${tokenFor(sub)}` } : {},
    body,
  };
  const res = fakeRes();
  await handler(req, res);
  return res;
}

const TURN = [{ role: 'assistant', content: 'How is today sitting with you?' }, { role: 'user', content: 'heavy' }];

// --- who may write ------------------------------------------------------
let res = await post({ startedAt: new Date().toISOString(), messages: TURN }, { auth: false });
assert.equal(res.statusCode, 401, 'an anonymous caller cannot file a transcript');

res = await post({ method: 'GET' }, { sub: 'x' });
assert.equal(res.statusCode, 400, 'a signed-in caller still has to send a valid body');

// --- whose name it is filed under --------------------------------------
const startedAt = '2026-09-04T10:00:00.000Z';
res = await post(
  {
    startedAt,
    messages: TURN,
    // All three are attempts to file this under somebody else. None of them is
    // read: the record is built from the verified session and nothing else.
    residentId: 'somebody-else',
    id: 'somebody-else:2026-01-01T00:00:00.000Z',
    updatedAt: '1999-01-01T00:00:00.000Z',
  },
  { sub: 'resident-1' },
);
assert.equal(res.statusCode, 200, 'a valid transcript is accepted');

let saved = await getChatSessions();
assert.equal(saved.length, 1, 'one conversation stored');
assert.equal(saved[0].residentId, 'resident-1', 'filed under the session, not the body');
assert.equal(saved[0].id, `resident-1:${startedAt}`, 'the id is derived, not accepted');
assert.notEqual(saved[0].updatedAt, '1999-01-01T00:00:00.000Z', 'updatedAt is the server clock');
assert.equal(saved[0].turns.length, 2, 'both turns kept');
assert.equal(saved[0].flagged, false, 'absent flag reads as false');

// --- one conversation is one record ------------------------------------
res = await post(
  { startedAt, messages: [...TURN, { role: 'assistant', content: 'Say more?' }], flagged: true },
  { sub: 'resident-1' },
);
assert.equal(res.statusCode, 200);
saved = await getChatSessions();
assert.equal(saved.length, 1, 'the same conversation updates rather than duplicating');
assert.equal(saved[0].turns.length, 3, 'the longer transcript replaced the shorter one');
assert.equal(saved[0].flagged, true, 'the safety flag is recorded');

// A different opening moment is a different conversation.
await post({ startedAt: '2026-09-04T18:00:00.000Z', messages: TURN }, { sub: 'resident-1' });
saved = await getChatSessions();
assert.equal(saved.length, 2, 'a new session is a new record');

// Another person's conversation does not touch the first person's.
await post({ startedAt, messages: TURN }, { sub: 'resident-2' });
saved = await getChatSessions();
assert.equal(saved.length, 3, 'two residents can open a session at the same instant');
assert.equal(saved.filter((c) => c.residentId === 'resident-1').length, 2, 'records stay separated by resident');

// --- what it refuses ----------------------------------------------------
const rejects = [
  [{ startedAt: 'not-a-date', messages: TURN }, 'a startedAt that is not a timestamp'],
  [{ startedAt, messages: [] }, 'an empty conversation'],
  [{ startedAt, messages: 'nope' }, 'messages that are not an array'],
  [{ startedAt, messages: [{ role: 'wizard', content: 'hi' }] }, 'an unknown role'],
  [{ startedAt, messages: [{ role: 'user', content: 123 }] }, 'content that is not a string'],
  [{ startedAt, messages: [{ role: 'user', content: 'x'.repeat(2001) }] }, 'an oversized message'],
  [
    { startedAt, messages: Array.from({ length: 25 }, () => ({ role: 'user', content: 'hi' })) },
    'more turns than the agent allows',
  ],
];

for (const [body, what] of rejects) {
  const r = await post(body, { sub: 'validate' });
  assert.equal(r.statusCode, 400, `refuses ${what}`);
}

const countBefore = (await getChatSessions()).length;
assert.equal(countBefore, 3, 'nothing rejected was written');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('chat-log checks passed — the session names the record, and nothing else does');
