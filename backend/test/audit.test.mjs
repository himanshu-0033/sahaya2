// The access log answers "who has been looking at this person", so the parts
// worth testing are the ones where it could quietly stop answering it: a view
// that never got written, a refresh that wrote ten rows, a 404 that wrote one
// anyway, and the log itself handing a counsellor the names of students they
// cannot open.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test-secret-not-a-real-one';
process.env.ADMIN_EMAILS = 'counsellor@example.test,other@example.test';
delete process.env.SUPER_ADMIN_EMAILS;
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_DIR = path.join(os.tmpdir(), 'sahay-data');
fs.rmSync(DATA_DIR, { recursive: true, force: true });

const { appendRecord, getAccessLog, recordView } = await import('../lib/store.js');
const { default: residentHandler } = await import('../handlers/admin/resident.js');
const { default: auditHandler } = await import('../handlers/admin/audit.js');

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

const token = (sub, email) => jwt.sign({ sub, email, name: sub, iss: 'sahay-ai' }, process.env.JWT_SECRET);
async function call(handler, { method = 'GET', as, body, query = {} }) {
  const req = { method, headers: { authorization: `Bearer ${token(as.sub, as.email)}` }, body, query };
  const res = fakeRes();
  await handler(req, res);
  return res;
}

const SUPER = { sub: 'owner', email: 'himanshumalik0033@gmail.com' };
const COUNSELLOR = { sub: 'c1', email: 'counsellor@example.test' };
const OTHER = { sub: 'c2', email: 'other@example.test' };

const now = new Date().toISOString();
// Asha shared with COUNSELLOR. Bilal shared with OTHER. Neither can see the
// other's student, which is what makes the read scoping testable.
await appendRecord('residents', { id: 'student-1', name: 'Asha', email: 'asha@example.test', onboarded: true, sharedWith: [COUNSELLOR.email], createdAt: now });
await appendRecord('residents', { id: 'student-2', name: 'Bilal', email: 'bilal@example.test', onboarded: true, sharedWith: [OTHER.email], createdAt: now });

// --- a view is written, by the server, without the client being asked ------
let res = await call(residentHandler, { as: COUNSELLOR, query: { residentId: 'student-1' } });
assert.equal(res.statusCode, 200, 'the counsellor Asha shared with can open her record');

let log = await getAccessLog(200);
assert.equal(log.length, 1, 'opening a record logs exactly one view');
assert.equal(log[0].kind, 'view');
assert.equal(log[0].actor, COUNSELLOR.email);
assert.equal(log[0].residentId, 'student-1');
assert.equal(log[0].subjectName, 'Asha', 'the log names who was looked at, not what was in the record');
assert.equal(log[0].rowCount, null, 'a view has no row count; that is an export idea');

// --- a refresh is the same visit, not a second one -------------------------
await call(residentHandler, { as: COUNSELLOR, query: { residentId: 'student-1' } });
await call(residentHandler, { as: COUNSELLOR, query: { residentId: 'student-1' } });
log = await getAccessLog(200);
assert.equal(log.length, 1, 'three opens inside the window collapse to one row');

// --- a later window is a second visit --------------------------------------
// Reaching past the handler on purpose: the point is the bucketing rule, and
// the only other way to test it is to wait a quarter of an hour.
const WINDOW = 15 * 60 * 1000;
await recordView({
  actor: COUNSELLOR.email,
  residentId: 'student-1',
  subjectName: 'Asha',
  at: new Date(Date.now() + WINDOW * 2).toISOString(),
  windowMs: WINDOW,
});
log = await getAccessLog(200);
assert.equal(log.length, 2, 'a visit in a later window is its own row');

// --- a refused view leaves no trace ----------------------------------------
res = await call(residentHandler, { as: OTHER, query: { residentId: 'student-1' } });
assert.equal(res.statusCode, 404, 'a counsellor Asha did not share with gets nothing');
log = await getAccessLog(200);
assert.equal(log.length, 2, 'and a refused view writes no row, so the log cannot confirm she exists');

// --- the log does not become the leak it exists to catch --------------------
await call(residentHandler, { as: OTHER, query: { residentId: 'student-2' } });

res = await call(auditHandler, { as: COUNSELLOR });
assert.equal(res.body.scope, 'self');
assert.ok(res.body.entries.length > 0, 'a counsellor sees their own actions');
assert.ok(
  res.body.entries.every((e) => e.actor === COUNSELLOR.email),
  'and nobody else, so the audit log never names a student outside their caseload',
);
assert.ok(
  !res.body.entries.some((e) => e.subjectName === 'Bilal'),
  'Bilal is not in this counsellor\'s caseload and must not surface through the log',
);

res = await call(auditHandler, { as: SUPER });
assert.equal(res.body.scope, 'all');
assert.equal(res.body.entries.length, 3, 'the super admin sees every access, which is the job');

// --- exports still log, and are still distinguishable from views ------------
res = await call(auditHandler, {
  method: 'POST',
  as: COUNSELLOR,
  body: { scope: 'resident', residentId: 'student-1', rowCount: 42 },
});
assert.equal(res.statusCode, 201);
assert.equal(res.body.entry.kind, 'export');
assert.equal(res.body.entry.rowCount, 42);

// An export of someone you cannot open is refused, or the log becomes a way to
// write arbitrary names into an append-only store.
res = await call(auditHandler, {
  method: 'POST',
  as: COUNSELLOR,
  body: { scope: 'resident', residentId: 'student-2' },
});
assert.equal(res.statusCode, 404, 'you cannot log an export of a student you cannot see');

// --- newest first, because that is the question it is read to answer --------
res = await call(auditHandler, { as: SUPER });
const times = res.body.entries.map((e) => e.at);
assert.deepEqual(times, [...times].sort().reverse(), 'the log reads newest first');
// Not "the export is on top": the second-visit row above is deliberately
// dated into a later window, so it outranks an export written just now. Both
// kinds land in one log and both come back, which is the thing that matters.
assert.deepEqual(
  new Set(res.body.entries.map((e) => e.kind)),
  new Set(['view', 'export']),
  'views and exports share one log',
);

// --- there is no way to delete from it --------------------------------------
res = await call(auditHandler, { method: 'DELETE', as: SUPER });
assert.equal(res.statusCode, 405, 'not even the super admin can delete an entry');
assert.equal(res.headers.allow, 'GET, POST, OPTIONS');

console.log('audit checks passed: views logged server-side, refreshes collapse, refusals leave no trace, the log does not leak');
