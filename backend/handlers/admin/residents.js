import { randomUUID } from 'node:crypto';
import { getCheckins, getResidents, getAssessments, appendRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { summarizeResidents } from '../../lib/analytics.js';
import { normalizeEmail, visibleResidents } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  if (req.method === 'POST') {
    const { name, email } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
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
  const visible = visibleResidents(residents, admin.email);
  return res.status(200).json({
    residents: summarizeResidents(visible, checkins, { detailed: true, assessments }),
  });
}
