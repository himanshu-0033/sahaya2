import bcrypt from 'bcryptjs';
import { getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';

// Email only. A phone number used to work here too, as the other half of
// phone sign-in; that is gone, and matching on a number nobody can sign in
// with would only produce a password prompt that never succeeds. The field
// itself stays on the record — the console still calls people.
function findByEmail(residents, identifier) {
  const email = identifier.trim().toLowerCase();
  if (!email) return undefined;
  return residents.find((r) => (r.email || '').toLowerCase() === email);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const residents = await getResidents();
  const resident = findByEmail(residents, identifier);

  if (!resident || !resident.passwordHash) {
    return res.status(401).json({
      error: 'No password account found for that email. Try "Continue with Google" instead.',
    });
  }

  const valid = await bcrypt.compare(password, resident.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const token = signSessionToken({ sub: resident.id, email: resident.email, name: resident.name });
  return res.status(200).json({ token });
}
