import { getResidents, upsertRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireSuperAdmin } from '../../lib/auth.js';
import { addShare, assignedList, normalizeEmail, removeShare, sharedWithList } from '../../lib/sharing.js';

// Assign a counsellor to a student, or take the assignment away. Super admin
// only.
//
// An assignment is a share the student did not make: the counsellor can see
// the student from the moment this returns. It is recorded with who made it and
// when, on the student's own record, so the account page can say "Assigned by
// your institution" and the student cannot mistake it for an invitation they
// sent. See the note on isSuperAdmin in lib/auth.js.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const residentId = body.residentId || req.query.residentId;
  const email = normalizeEmail(body.email || req.query.email);
  if (!residentId) return res.status(400).json({ error: 'residentId is required' });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid counsellor email is required' });
  }

  const residents = await getResidents();
  const resident = residents.find((r) => r.id === residentId);
  if (!resident) return res.status(404).json({ error: 'Student not found' });
  if (email === normalizeEmail(resident.email)) {
    return res.status(400).json({ error: 'A student cannot be their own counsellor.' });
  }

  const assignedBy = { ...(resident.assignedBy || {}) };
  let sharedWith;
  if (req.method === 'POST') {
    sharedWith = addShare(resident, email);
    assignedBy[email] = { by: normalizeEmail(admin.email), at: new Date().toISOString() };
  } else {
    // Only an assignment is taken away here. A counsellor the student invited
    // themselves stays; that share is theirs to remove.
    if (!assignedBy[email]) {
      return res.status(400).json({ error: 'That counsellor was invited by the student, not assigned.' });
    }
    sharedWith = removeShare(resident, email);
    delete assignedBy[email];
  }

  const next = { ...resident, sharedWith, assignedBy, updatedAt: new Date().toISOString() };
  await upsertRecord('residents', { id: resident.id }, next);

  return res.status(200).json({
    counsellors: sharedWithList(next).map((e) => ({
      email: e,
      assigned: assignedList(next).includes(e),
      assignedAt: next.assignedBy?.[e]?.at || null,
    })),
  });
}
