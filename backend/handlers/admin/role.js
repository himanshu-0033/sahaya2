import { getStaff, upsertRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { normalizeEmail } from '../../lib/sharing.js';

// What someone does in the admin panel: counsellor or manager.
//
// Everyone who opens the panel, apart from the super admin, is asked once on
// their first sign-in and the answer is kept here, on a record keyed by their
// email. It is a designation shown on their dashboard and on the Team page; it
// does not change which students they can see, which is still decided by
// assignment and sharing (lib/sharing.js).
export const ROLES = ['counsellor', 'manager'];

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdminUser(req, res);
  if (!admin) return;
  if (admin.superAdmin) {
    return res.status(400).json({ error: 'The super admin keeps the super admin role.' });
  }

  const role = (req.body || {}).role;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Choose counsellor or manager.' });
  }

  const email = normalizeEmail(admin.email);
  const existing = (await getStaff()).find((s) => s.id === email);
  const now = new Date().toISOString();
  await upsertRecord('staff', { id: email }, {
    id: email,
    email,
    name: admin.name || existing?.name || '',
    role,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });

  return res.status(200).json({ role });
}
