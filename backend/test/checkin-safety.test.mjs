// The daily check-in was the one piece of free text nobody screened.
//
// The chat screened every turn, the inkblot screened every response, and a
// positive PHQ-9 item 9 routed into the crisis path. Three words a day, typed
// by every student every day, went only through computeFlag, which matches a
// list of ordinary heavy words and needs two hits. That list has nothing about
// dying in it, so the app flagged "tired sad lonely" for a counsellor and did
// nothing whatsoever for "kill myself tonight".
//
// These are the cases that gap was made of.
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

const { appendRecord, getCheckins } = await import('../lib/store.js');
const { default: checkinsHandler } = await import('../handlers/checkins.js');
const { summarizeResident } = await import('../lib/analytics.js');
const { computeFlag } = await import('../lib/logic.js');

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

const token = (sub) => jwt.sign({ sub, email: `${sub}@example.test`, name: sub, iss: 'sahay-ai' }, process.env.JWT_SECRET);
async function checkIn(sub, words, mood) {
  const req = {
    method: 'POST',
    headers: { authorization: `Bearer ${token(sub)}` },
    body: { words, mood },
    query: {},
  };
  const res = fakeRes();
  await checkinsHandler(req, res);
  return res;
}

const now = new Date().toISOString();
for (const id of ['s1', 's2', 's3', 's4']) {
  await appendRecord('residents', {
    id, name: id.toUpperCase(), email: `${id}@example.test`,
    onboarded: true, sharedWith: [], createdAt: now,
  });
}

// --- the case the old code missed ------------------------------------------
// No history at all, so none of the mood rules can fire. This is a student's
// first ever check-in, which is exactly when the old code was blindest.
let res = await checkIn('s1', ['want', 'to', 'die'], 3);
assert.equal(res.statusCode, 201);
assert.equal(res.body.flagged, true, 'a disclosure flags the check-in on its own');
assert.deepEqual(res.body.safety, ['suicide'], 'and is recorded in the same field a chat disclosure uses');
assert.ok(
  res.body.flagReasons.some((r) => /safety/i.test(r)),
  'with a reason that says what it is, not just "words lean heavy"',
);

// The old rule genuinely does not catch this. If this ever starts passing,
// the lexicon has changed and this test is no longer testing the gap.
assert.equal(
  computeFlag([], ['want', 'to', 'die']).flagged,
  false,
  'the mild-word heuristic still misses it, which is why the screen exists',
);

// --- the student is handed help, not a thought for the day -----------------
assert.ok(res.body.crisis, 'the response carries crisis help');
assert.equal(res.body.crisis.category, 'suicide');
assert.ok(res.body.crisis.helplines.length > 0, 'with real numbers on it');
assert.ok(
  res.body.crisis.helplines.some((h) => h.number === '14416'),
  'including Tele-MANAS, from the same table every other screen reads',
);
assert.ok(/112/.test(res.body.crisis.message), 'and the emergency number');

// --- a disclosure split across the three plates still reads as one ---------
res = await checkIn('s2', ['kill', 'myself', 'tonight'], 2);
assert.deepEqual(res.body.safety, ['suicide'], 'the three boxes are screened as one line');
assert.ok(res.body.crisis, 'and the student is given help');

// --- an ordinary heavy day is NOT escalated --------------------------------
// The whole point is that this stays a nudge. Turning every low day into a
// crisis screen would bury the real ones.
res = await checkIn('s3', ['tired', 'sad', 'lonely'], 2);
assert.equal(res.body.flagged, true, 'heavy words still flag for a counsellor');
assert.deepEqual(res.body.safety, [], 'but are not a safety disclosure');
assert.equal(res.body.crisis, undefined, 'and the student is not shown a crisis screen');
assert.ok(res.body.thought, 'they get the thought for the day, as before');

// --- an ordinary good day is untouched -------------------------------------
res = await checkIn('s4', ['sunny', 'calm', 'ready'], 5);
assert.equal(res.body.flagged, false);
assert.deepEqual(res.body.safety, []);
assert.equal(res.body.crisis, undefined);

// --- it reaches the counsellor through the existing risk surface -----------
const checkins = await getCheckins();
const resident = { id: 's1', name: 'S1', email: 's1@example.test', onboarded: true, sharedWith: [], createdAt: now };
const summary = summarizeResident(resident, checkins, { detailed: true, assessments: [], chatSessions: [] });

assert.ok(summary.checkinSafety, 'the console sees a check-in disclosure');
assert.deepEqual(summary.checkinSafety.categories, ['suicide']);
assert.deepEqual(summary.checkinSafety.words, ['want', 'to', 'die'], 'with the words themselves, so it can be read');
assert.equal(summary.flaggedRecently, true, 'and it counts as needing a conversation');

const calm = summarizeResident(
  { id: 's4', name: 'S4', email: 's4@example.test', onboarded: true, sharedWith: [], createdAt: now },
  checkins,
  { detailed: true, assessments: [], chatSessions: [] },
);
assert.equal(calm.checkinSafety, null, 'and an ordinary week raises nothing');

console.log('check-in safety checks passed: three words are screened, the student gets help, the counsellor gets told');
