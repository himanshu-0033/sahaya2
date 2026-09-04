import bcrypt from 'bcryptjs';
import { getResidents, readAll, upsertRecord, removeRecords } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';
import { hashToken } from './forgot.js';

// Step two: spend the token, set the password.
//
// The token is looked up by its hash, which is also the record's id, so this
// is a direct read rather than a scan — there is no list of pending resets to
// walk and nothing that gets slower as more of them exist.
//
// Expiry is checked here rather than trusted to a cleanup job, because a
// cleanup job that has not run yet is not a security property.
const MIN_PASSWORD = 8;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password } = req.body || {};

  if (typeof token !== 'string' || !token) {
    return res.status(400).json({ error: 'This reset link is not valid.' });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
  }

  const id = hashToken(token);
  const pending = (await readAll('passwordResets')).find((r) => r.id === id);

  // One message for "never existed", "already used" and "too old". Which of
  // the three it is tells an attacker something and tells the person nothing
  // they can act on differently — they ask for a new link either way.
  const dead = () =>
    res.status(400).json({ error: 'This reset link has expired or has already been used. Ask for a new one.' });

  if (!pending) return dead();
  if (Date.parse(pending.expiresAt) <= Date.now()) {
    await removeRecords('passwordResets', { id });
    return dead();
  }

  const residents = await getResidents();
  const resident = residents.find((r) => r.id === pending.residentId);
  if (!resident) {
    await removeRecords('passwordResets', { id });
    return dead();
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await upsertRecord(
    'residents',
    { id: resident.id },
    { ...resident, passwordHash, updatedAt: new Date().toISOString() },
  );

  // Single use, and every other pending link for this account dies with it.
  await removeRecords('passwordResets', { residentId: resident.id });

  // Signed in on the spot. The alternative is bouncing someone who has just
  // proved they hold the address back to a login form to type the password
  // they set four seconds ago.
  const sessionToken = signSessionToken({
    sub: resident.id,
    email: resident.email,
    name: resident.name,
  });

  return res.status(200).json({ token: sessionToken });
}
