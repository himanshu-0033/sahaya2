import bcrypt from 'bcryptjs';
import { getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const residents = await getResidents();
  const resident = residents.find((r) => (r.email || '').toLowerCase() === normalizedEmail);

  if (!resident || !resident.passwordHash) {
    return res.status(401).json({
      error: 'No password account found for this email. Try "Continue with Google" instead.',
    });
  }

  const valid = await bcrypt.compare(password, resident.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const token = signSessionToken({ sub: resident.id, email: resident.email, name: resident.name });
  return res.status(200).json({ token });
}
