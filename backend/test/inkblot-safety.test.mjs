// The inkblot was the last screened path that told the student and not the
// counsellor.
//
// It screened the free text and handed back helplines, which is the half that
// matters most and the half that already worked. What it did not do was reach
// the console: the sitting set `flagged`, which lands in the flag lists, but
// analytics never read inkblot sessions at all, so a student who wrote about
// dying on a plate did not count as at risk, did not sort up the caseload, and
// got no banner on their record.
//
// rules.md 1.4 asks a screened disclosure to do three things. This one was
// doing two.
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

const { appendRecord, getInkblotSessions } = await import('../lib/store.js');
const { default: inkblotHandler } = await import('../handlers/inkblot-test.js');
const { summarizeResident, buildOverview } = await import('../lib/analytics.js');
const { PLATE_IDS } = await import('../lib/plates.js');

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
async function sit(sub, responses) {
  const req = {
    method: 'POST',
    headers: { authorization: `Bearer ${token(sub)}` },
    body: { responses },
    query: {},
  };
  const res = fakeRes();
  await inkblotHandler(req, res);
  return res;
}

const now = new Date().toISOString();
for (const id of ['ink-1', 'ink-2']) {
  await appendRecord('residents', {
    id, name: id.toUpperCase(), email: `${id}@example.test`,
    onboarded: true, sharedWith: [], createdAt: now,
  });
}

const plate = (i) => PLATE_IDS[i];

// --- a disclosure on a plate --------------------------------------------
let res = await sit('ink-1', [
  { plateId: plate(0), text: 'a bird over water', latencyMs: 800 },
  { plateId: plate(1), text: 'i want to end my life', latencyMs: 1200 },
  { plateId: plate(2), text: 'two people talking', latencyMs: 700 },
]);
assert.equal(res.statusCode, 201);

// The half that already worked: the student is handed help immediately.
assert.ok(res.body.helplines?.length > 0, 'the student is given helplines on the spot');
assert.ok(
  res.body.helplines.some((h) => h.number === '14416'),
  'including Tele-MANAS, from the same table every other screen reads',
);

// The half that did not: it is recorded in the shape the console reads.
assert.deepEqual(res.body.record.safety, ['suicide'], 'the sitting records the category');
assert.equal(res.body.record.flagged, true);

// --- and it reaches the counsellor --------------------------------------
const sessions = await getInkblotSessions();
const resident = { id: 'ink-1', name: 'INK-1', email: 'ink-1@example.test', onboarded: true, sharedWith: [], createdAt: now };
const summary = summarizeResident(resident, [], {
  detailed: true,
  assessments: [],
  chatSessions: [],
  inkblotSessions: sessions,
});

assert.ok(summary.inkblotSafety, 'the console sees an inkblot disclosure');
assert.deepEqual(summary.inkblotSafety.categories, ['suicide']);
assert.deepEqual(
  summary.inkblotSafety.plates,
  [plate(1)],
  'and which plate it was on, so it is one click rather than ten',
);
assert.equal(summary.flaggedRecently, true, 'it counts as needing a conversation');

// The cohort view counts them as at risk, which is the thing that was missing
// entirely: this student was invisible on the dashboard before.
const overview = buildOverview([resident], [], {
  assessments: [],
  chatSessions: [],
  inkblotSessions: sessions,
});
assert.equal(overview.totals.atRisk, 1, 'and they are at risk on the dashboard');

// --- an ordinary sitting is untouched -----------------------------------
res = await sit('ink-2', [
  { plateId: plate(0), text: 'a moth', latencyMs: 600 },
  { plateId: plate(1), text: 'a coastline', latencyMs: 900 },
]);
assert.deepEqual(res.body.record.safety, [], 'nothing to declare');
assert.equal(res.body.helplines, null, 'and no crisis screen for an ordinary sitting');

const calm = summarizeResident(
  { id: 'ink-2', name: 'INK-2', email: 'ink-2@example.test', onboarded: true, sharedWith: [], createdAt: now },
  [],
  { detailed: true, assessments: [], chatSessions: [], inkblotSessions: await getInkblotSessions() },
);
assert.equal(calm.inkblotSafety, null, 'and raises nothing on the console');

console.log('inkblot safety checks passed: screened, recorded, and it reaches the counsellor');
