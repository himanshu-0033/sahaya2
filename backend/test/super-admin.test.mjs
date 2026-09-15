// The super admin sees every student and assigns counsellors to them. That is a
// deliberate exception to the sharing rule, so this checks its edges: only the
// super admin gets it, an assignment really does open the student to that
// counsellor, the student cannot quietly undo an assignment, and a counsellor
// the student invited themselves is still theirs to remove.
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

const { appendRecord, getResidents } = await import('../lib/store.js');
const { default: residentsHandler } = await import('../handlers/admin/residents.js');
const { default: residentHandler } = await import('../handlers/admin/resident.js');
const { default: assignHandler } = await import('../handlers/admin/assign.js');
const { default: teamHandler } = await import('../handlers/admin/team.js');
const { default: meHandler } = await import('../handlers/admin/me.js');
const { default: sharingHandler } = await import('../handlers/sharing.js');

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
const STUDENT = { sub: 'student-1', email: 'student@example.test' };

const now = new Date().toISOString();
await appendRecord('residents', { id: 'student-1', name: 'Asha', email: STUDENT.email, onboarded: true, sharedWith: [], createdAt: now });
await appendRecord('residents', { id: 'student-2', name: 'Bilal', email: 'bilal@example.test', onboarded: true, sharedWith: [OTHER.email], createdAt: now });

// --- who is the super admin ---------------------------------------------
let res = await call(meHandler, { as: SUPER });
assert.equal(res.statusCode, 200, 'the owner opens the console without being on the allowlist');
assert.equal(res.body.admin.superAdmin, true);
res = await call(meHandler, { as: COUNSELLOR });
assert.equal(res.body.admin.superAdmin, false, 'an allowlisted counsellor is not a super admin');

// --- what each sees -------------------------------------------------------
res = await call(residentsHandler, { as: SUPER });
assert.equal(res.body.residents.length, 2, 'the super admin sees every student');
assert.deepEqual(res.body.residents.find((r) => r.id === 'student-2').counsellors, [OTHER.email]);
res = await call(residentsHandler, { as: COUNSELLOR });
assert.equal(res.body.residents.length, 0, 'a counsellor still sees only the students who share with them');
assert.equal(res.body.residents[0]?.counsellors, undefined);

// --- only the super admin assigns -----------------------------------------
res = await call(assignHandler, { method: 'POST', as: COUNSELLOR, body: { residentId: 'student-1', email: COUNSELLOR.email } });
assert.equal(res.statusCode, 403, 'a counsellor cannot assign themselves a student');
res = await call(teamHandler, { as: COUNSELLOR });
assert.equal(res.statusCode, 403, 'nor read the team page');

res = await call(assignHandler, { method: 'POST', as: SUPER, body: { residentId: 'student-1', email: 'Counsellor@Example.test' } });
assert.equal(res.statusCode, 200);
assert.deepEqual(res.body.counsellors.map((c) => [c.email, c.assigned]), [[COUNSELLOR.email, true]]);

res = await call(residentHandler, { as: COUNSELLOR, query: { residentId: 'student-1' } });
assert.equal(res.statusCode, 200, 'the assigned counsellor can open the student straight away');
res = await call(residentHandler, { as: OTHER, query: { residentId: 'student-1' } });
assert.equal(res.statusCode, 404, 'and nobody else was let in with them');

res = await call(teamHandler, { as: SUPER });
const c1 = res.body.counsellors.find((c) => c.email === COUNSELLOR.email);
assert.equal(c1.students, 1);
assert.equal(c1.assigned, 1);
assert.equal(res.body.unassigned.length, 0, 'both students now have a counsellor');

// --- the student's side ----------------------------------------------------
res = await call(sharingHandler, { as: STUDENT });
assert.deepEqual(res.body.assigned, [COUNSELLOR.email], 'the student can see who was assigned');
res = await call(sharingHandler, { method: 'DELETE', as: STUDENT, body: { email: COUNSELLOR.email } });
assert.equal(res.statusCode, 403, 'the student cannot remove an assigned counsellor');

res = await call(sharingHandler, { method: 'POST', as: STUDENT, body: { email: 'friend@example.test' } });
res = await call(sharingHandler, { method: 'DELETE', as: STUDENT, body: { email: 'friend@example.test' } });
assert.equal(res.statusCode, 200, 'but can still remove someone they invited themselves');

res = await call(assignHandler, { method: 'DELETE', as: SUPER, body: { residentId: 'student-2', email: OTHER.email } });
assert.equal(res.statusCode, 400, "the super admin does not remove a share the student made");

res = await call(assignHandler, { method: 'DELETE', as: SUPER, body: { residentId: 'student-1', email: COUNSELLOR.email } });
assert.equal(res.statusCode, 200);
const stored = (await getResidents()).find((r) => r.id === 'student-1');
assert.deepEqual(stored.sharedWith, [], 'unassigning takes the access away');
assert.deepEqual(stored.assignedBy, {});

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('super admin checks passed: sees everyone, assigns, and nobody else can');
