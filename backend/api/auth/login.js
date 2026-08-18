import bcrypt from 'bcryptjs';
import { getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';
import { phonesMatch } from '../../lib/phone.js';

function findByIdentifier(residents, identifier) {
  const trimmed = identifier.trim();

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    return residents.find((r) => (r.email || '').toLowerCase() === email);
  }

  return residents.find((r) => phonesMatch(r.phone, trimmed));
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/phone and password are required' });
  }

  const residents = await getResidents();
  const resident = findByIdentifier(residents, identifier);

  if (!resident || !resident.passwordHash) {
    return res.status(401).json({
      error: 'No password account found for that email or phone number. Try "Continue with Google" instead.',
    });
  }

  const valid = await bcrypt.compare(password, resident.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email/phone or password' });
  }

  const token = signSessionToken({ sub: resident.id, email: resident.email, name: resident.name });
  return res.status(200).json({ token });
}
