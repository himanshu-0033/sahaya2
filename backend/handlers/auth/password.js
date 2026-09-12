import bcrypt from 'bcryptjs';
import { getResidents, upsertRecord, removeRecords } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireGoogleUser } from '../../lib/auth.js';

// Changing a password you already know, from inside the account.
//
// Separate from auth/reset.js, which is for a password you have forgotten and
// is proved by a mailed token. Here the proof is the current password, asked
// for even though the request already carries a valid session: a session is
// evidence that this tab was signed in at some point, not that the person
// holding the laptop right now is the account's owner. On a shared hostel
// machine that difference is the whole point.
const MIN_PASSWORD = 8;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireGoogleUser(req, res);
  if (!user) return;

  const { currentPassword, password } = req.body || {};
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD} characters` });
  }

  const residents = await getResidents();
  const resident = residents.find((r) => r.id === user.sub);
  if (!resident) return res.status(404).json({ error: 'No account found' });

  // A Google account has no password to change, and setting one here would
  // quietly create a second way into the account from a session that never
  // proved anything beyond holding a Google token.
  if (!resident.passwordHash) {
    return res.status(400).json({
      error: 'This account signs in with Google, so it has no password to change.',
    });
  }

  const valid = typeof currentPassword === 'string' && (await bcrypt.compare(currentPassword, resident.passwordHash));
  if (!valid) {
    return res.status(401).json({ error: 'That is not your current password.' });
  }

  await upsertRecord(
    'residents',
    { id: resident.id },
    { ...resident, passwordHash: await bcrypt.hash(password, 10), updatedAt: new Date().toISOString() },
  );

  // Any reset link already in an inbox dies with the change — otherwise the
  // old password's mail is still a live key to the new one.
  await removeRecords('passwordResets', { residentId: resident.id });

  return res.status(200).json({ ok: true });
}
