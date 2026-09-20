import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getResidents, appendRecord, removeRecords } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';
import { phonesMatch } from '../../lib/phone.js';
import { isValidEmail, isValidPhone } from '../../lib/contact.js';
import { invitedPlaceholders } from '../../lib/residents.js';
import { clientKey, limiter } from '../../lib/rate-limit.js';

function makeId() {
  return 'local_' + randomUUID();
}

// Account creation is the other unauthenticated write in the app. Unmetered it
// is a way to fill the residents collection, and every row in there is a name
// the counsellor console has to show somebody.
//
// Looser than the sign-in limit: a person signing up genuinely does it once,
// but a shared campus network puts a whole hall behind one address, so this is
// set to stop a script rather than to ration a corridor.
const perClient = limiter({ windowMs: 60 * 60_000, max: 15 });

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (perClient(clientKey(req))) {
    return res.status(429).json({ error: 'Too many accounts created from here. Try again later.' });
  }

  const { name, email, phone, password } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address, like name@college.edu.' });
  }
  if (phone && phone.trim() && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid mobile number: 10 digits for India, starting with 6, 7, 8 or 9.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const residents = await getResidents();
  const existing = residents.find((r) => (r.email || '').toLowerCase() === normalizedEmail);
  if (existing && !existing.invited) {
    return res.status(409).json({
      error: existing.passwordHash
        ? 'An account with this email already exists. Try logging in instead.'
        : 'This email is already signed up via Google. Use "Continue with Google" instead.',
    });
  }

  if (phone && phone.trim()) {
    const phoneTaken = residents.some((r) => phonesMatch(r.phone, phone));
    if (phoneTaken) {
      return res.status(409).json({ error: 'This phone number is already in use by another account.' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = makeId();
  const now = new Date().toISOString();
  const resident = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    phone: (phone || '').trim(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  for (const stale of invitedPlaceholders(residents, normalizedEmail)) {
    await removeRecords('residents', { id: stale.id });
  }
  await appendRecord('residents', resident);

  const token = signSessionToken({ sub: id, email: normalizedEmail, name: name.trim() });
  return res.status(201).json({ token });
}
