import { getStaff, removeRecords, upsertRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { isSuperAdmin, requireSuperAdmin } from '../../lib/auth.js';
import { isValidEmail } from '../../lib/contact.js';
import { normalizeEmail } from '../../lib/sharing.js';

// Who may sign in to the admin panel, managed by the super admin from the Team
// page rather than by editing ADMIN_EMAILS on the server.
//
// Adding an address lets that person in; on their first sign-in they choose
// counsellor or manager. Removing it takes the panel away again. Addresses on
// the ADMIN_EMAILS allowlist cannot be removed from here, since the server's
// environment is not something the panel can edit.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  const email = normalizeEmail((req.body || {}).email || req.query.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address, like name@college.edu.' });
  }
  if (isSuperAdmin(email)) {
    return res.status(400).json({ error: 'That is the super admin, who always has access.' });
  }

  const existing = (await getStaff()).find((s) => s.id === email);

  if (req.method === 'DELETE') {
    if (!existing) return res.status(404).json({ error: 'That address was not added from the Team page.' });
    await removeRecords('staff', { id: email });
    return res.status(200).json({ removed: email });
  }

  const now = new Date().toISOString();
  const record = {
    ...existing,
    id: email,
    email,
    role: existing?.role || null,
    name: existing?.name || '',
    addedBy: existing?.addedBy || normalizeEmail(admin.email),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await upsertRecord('staff', { id: email }, record);
  return res.status(existing ? 200 : 201).json({ staff: record });
}
