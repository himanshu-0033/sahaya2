import { randomUUID } from 'node:crypto';
import { getCheckins, getResidents, appendRecord } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireCaregiverUser } from '../../lib/auth.js';
import { normalizeEmail, visibleResidents } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  const caregiver = await requireCaregiverUser(req, res);
  if (!caregiver) return;

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
      return res.status(409).json({ error: 'A resident with this email already exists.' });
    }

    const now = new Date().toISOString();
    const resident = {
      id: 'invited_' + randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      invited: true,
      invitedBy: caregiver.email,
      onboarded: false,
      // Only the details this caregiver just typed. Replaced by a fresh,
      // unshared record once the real person signs in — see lib/sharing.js.
      sharedWith: [normalizeEmail(caregiver.email)],
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

  const [allResidents, checkins] = await Promise.all([getResidents(), getCheckins()]);
  // Same rule as the counsellor console: the allowlist opens the door, the
  // resident decides who is in the room.
  const residents = visibleResidents(allResidents, caregiver.email);

  const summaries = residents.map((resident) => {
    const history = checkins
      .filter((c) => c.residentId === resident.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    const last = history[history.length - 1] || null;

    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const expected = new Date();
      expected.setDate(expected.getDate() - (history.length - 1 - i));
      if (history[i].date === expected.toISOString().slice(0, 10)) streak++;
      else break;
    }

    const flaggedRecently = history.slice(-3).some((c) => c.flagged);

    return {
      id: resident.id,
      name: resident.name,
      email: resident.email,
      invited: Boolean(resident.invited),
      lastCheckIn: last ? { date: last.date, mood: last.mood, flagged: last.flagged } : null,
      totalCheckIns: history.length,
      streak,
      flaggedRecently,
    };
  });

  summaries.sort((a, b) => {
    if (a.flaggedRecently !== b.flaggedRecently) return a.flaggedRecently ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return res.status(200).json({ residents: summaries });
}
