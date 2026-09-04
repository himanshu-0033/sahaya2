import { getResidents, appendRecord, upsertRecord, removeRecords } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';
import { publicResident } from '../lib/sanitize.js';
import { invitedPlaceholders } from '../lib/residents.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const googleUser = await requireGoogleUser(req, res);
  if (!googleUser) return;
  const residentId = googleUser.sub;

  if (req.method === 'GET') {
    const residents = await getResidents();
    const profile = residents.find((r) => r.id === residentId) || null;
    return res.status(200).json({ profile: publicResident(profile) });
  }

  if (req.method === 'POST') {
    // address and occupation used to be collected here. They were never read
    // by anything — only displayed back in the console and the CSV export —
    // so they are no longer accepted. See components/AccountForm.jsx.
    const { name, email, dob, phone } = req.body || {};

    const residents = await getResidents();
    const idx = residents.findIndex((r) => r.id === residentId);
    const existing = idx === -1 ? null : residents[idx];
    const now = new Date().toISOString();
    const profile = {
      id: residentId,
      name: (name || '').trim() || googleUser.name,
      email: (email || '').trim() || googleUser.email || '',
      dob: (dob || '').trim(),
      // A blank field here means "unchanged", not "delete it" — the number is
      // contact detail the console relies on, and it is easy to wipe by
      // saving a form that never loaded it.
      phone: (phone || '').trim() || existing?.phone || '',
      onboarded: true,
      updatedAt: now,
    };

    if (idx === -1) {
      for (const stale of invitedPlaceholders(residents, profile.email)) {
        await removeRecords('residents', { id: stale.id });
      }
      await appendRecord('residents', { ...profile, createdAt: now });
    } else {
      await upsertRecord('residents', { id: residentId }, { ...residents[idx], ...profile });
    }

    return res.status(200).json({ profile });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
