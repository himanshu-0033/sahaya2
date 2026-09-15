import { randomUUID } from 'node:crypto';
import { getCheckins, getResidents, getAssessments, appendRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireStudentAccess } from '../../lib/auth.js';
import { summarizeResidents } from '../../lib/analytics.js';
import { isValidEmail } from '../../lib/contact.js';
import { normalizeEmail, residentsForAdmin, sharedWithList } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const admin = await requireStudentAccess(req, res);
  if (!admin) return;

  if (req.method === 'POST') {
    const { name, email } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address, like name@college.edu.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const residents = await getResidents();
    if (residents.some((r) => (r.email || '').toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ error: 'Someone with this email is already on the list.' });
    }

    const now = new Date().toISOString();
    const resident = {
      id: 'invited_' + randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      invited: true,
      invitedBy: admin.email,
      onboarded: false,
      // The placeholder holds only the name and address this counsellor just
      // typed, so they can see it back. It carries no consent forward: when
      // the real person signs in, invitedPlaceholders marks this record
      // and profile.js writes a fresh one with nothing shared. Being invited
      // is not the same as having agreed.
      sharedWith: [normalizeEmail(admin.email)],
      createdAt: now,
      updatedAt: now,
    };
    await appendRecord('residents', resident);
    return res.status(201).json({ resident });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [residents, checkins, assessments] = await Promise.all([
    getResidents(),
    getCheckins(),
    getAssessments(),
  ]);
  // Being on the allowlist got you through the door. It does not decide who
  // is in the room — only residents who have shared with this counsellor are.
  const visible = residentsForAdmin(residents, admin);
  const rows = summarizeResidents(visible, checkins, { detailed: true, assessments });
  // Only the super admin is shown who else can see each person; a counsellor
  // has no business with a colleague's caseload.
  if (admin.superAdmin) {
    const byId = new Map(visible.map((r) => [r.id, r]));
    for (const row of rows) row.counsellors = sharedWithList(byId.get(row.id));
  }
  return res.status(200).json({ residents: rows });
}
