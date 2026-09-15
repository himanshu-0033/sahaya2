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
const { default: roleHandler } = await import('../handlers/admin/role.js');
const { default: staffHandler } = await import('../handlers/admin/staff.js');
const { default: overviewHandler } = await import('../handlers/admin/overview.js');

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
// Not on the allowlist: only the super admin can let this one in.
const STAFFER = { sub: 's1', email: 'himanshumalikiitkgp28@gmail.com' };

const now = new Date().toISOString();
await appendRecord('residents', { id: 'student-1', name: 'Asha', email: STUDENT.email, onboarded: true, sharedWith: [], createdAt: now });
await appendRecord('residents', { id: 'student-2', name: 'Bilal', email: 'bilal@example.test', onboarded: true, sharedWith: [OTHER.email], createdAt: now });

// --- who is the super admin ---------------------------------------------
let res = await call(meHandler, { as: SUPER });
assert.equal(res.statusCode, 200, 'the owner opens the console without being on the allowlist');
assert.equal(res.body.admin.superAdmin, true);
assert.equal(res.body.admin.role, 'super_admin');
res = await call(meHandler, { as: COUNSELLOR });
assert.equal(res.body.admin.superAdmin, false, 'an allowlisted counsellor is not a super admin');
assert.equal(res.body.admin.role, null, 'and is asked their role on first sign-in');

// --- who gets in: the allowlist, or the super admin adding them ---------
res = await call(meHandler, { as: STAFFER });
assert.equal(res.statusCode, 403, 'an address nobody added cannot open the panel');
res = await call(staffHandler, { method: 'POST', as: COUNSELLOR, body: { email: STAFFER.email } });
assert.equal(res.statusCode, 403, 'only the super admin adds staff');
res = await call(staffHandler, { method: 'POST', as: SUPER, body: { email: STAFFER.email } });
assert.equal(res.statusCode, 201);
res = await call(meHandler, { as: STAFFER });
assert.equal(res.statusCode, 200, 'once added, they are in');
assert.equal(res.body.admin.role, null, 'and are asked their role');

// --- counsellor or manager ----------------------------------------------
res = await call(roleHandler, { method: 'POST', as: STAFFER, body: { role: 'wizard' } });
assert.equal(res.statusCode, 400, 'only counsellor or manager');
res = await call(roleHandler, { method: 'POST', as: STAFFER, body: { role: 'manager' } });
assert.equal(res.statusCode, 200);
res = await call(meHandler, { as: STAFFER });
assert.equal(res.body.admin.role, 'manager', 'the answer is kept');
res = await call(roleHandler, { method: 'POST', as: SUPER, body: { role: 'counsellor' } });
assert.equal(res.statusCode, 400, 'the super admin keeps the super admin role');

// A manager sees counsellor performance and never a student.
res = await call(teamHandler, { as: STAFFER });
assert.equal(res.statusCode, 200, 'a manager reads the team');
assert.equal(res.body.students, undefined, 'without the list of students');
assert.equal(res.body.unassigned, undefined, 'or the names of students without a counsellor');
assert.equal(typeof res.body.unassignedCount, 'number', 'only how many there are');
for (const handler of [residentsHandler, overviewHandler]) {
  res = await call(handler, { as: STAFFER });
  assert.equal(res.statusCode, 403, 'a manager cannot open student records');
}
res = await call(residentHandler, { as: STAFFER, query: { residentId: 'student-2' } });
assert.equal(res.statusCode, 403);

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
assert.equal(res.statusCode, 403, 'nor read the team page, which is for managers');

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

// Taking staff access away closes the panel to them again.
res = await call(staffHandler, { method: 'DELETE', as: SUPER, body: { email: STAFFER.email } });
assert.equal(res.statusCode, 200);
res = await call(meHandler, { as: STAFFER });
assert.equal(res.statusCode, 403, 'removed staff are out');

fs.rmSync(DATA_DIR, { recursive: true, force: true });
console.log('super admin checks passed: sees everyone, assigns, and nobody else can');
