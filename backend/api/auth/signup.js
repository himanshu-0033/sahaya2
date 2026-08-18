import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getResidents, saveResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';

function makeId() {
  return 'local_' + randomUUID();
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const residents = await getResidents();
  const existing = residents.find((r) => (r.email || '').toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({
      error: existing.passwordHash
        ? 'An account with this email already exists. Try logging in instead.'
        : 'This email is already signed up via Google. Use "Continue with Google" instead.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = makeId();
  const now = new Date().toISOString();
  const resident = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  await saveResidents([...residents, resident]);

  const token = signSessionToken({ sub: id, email: normalizedEmail, name: name.trim() });
  return res.status(201).json({ token });
}
