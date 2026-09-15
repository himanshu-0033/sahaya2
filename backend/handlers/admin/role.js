import { getStaff, upsertRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { adminStanding, requireGoogleUser } from '../../lib/auth.js';
import { normalizeEmail } from '../../lib/sharing.js';

// Counsellor or manager, chosen on someone's first sign-in to the admin panel.
//
// For someone nobody has approved yet this is also the request to join: it
// saves them as pending, and the super admin approves or declines them from the
// Team page. Someone already approved (on ADMIN_EMAILS, or added by the super
// admin) keeps their approval and just records the role.
//
// The role decides what they see once approved: a counsellor, the students
// assigned to them or who invited them; a manager, counsellor performance and
// no individual student (requireStudentAccess and requireTeamAccess in
// lib/auth.js).
export const ROLES = ['counsellor', 'manager'];

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const standing = await adminStanding(user);
  if (standing.superAdmin) {
    return res.status(400).json({ error: 'The super admin keeps the super admin role.' });
  }

  const role = (req.body || {}).role;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Choose counsellor or manager.' });
  }

  const email = normalizeEmail(user.email);
  const existing = (await getStaff()).find((s) => s.id === email);
  const now = new Date().toISOString();
  const status = standing.status === 'new' ? 'pending' : standing.status;
  await upsertRecord('staff', { id: email }, {
    ...existing,
    id: email,
    email,
    name: user.name || existing?.name || '',
    role,
    status,
    requestedAt: existing?.requestedAt || (status === 'pending' ? now : null),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  return res.status(200).json({ role, status });
}
