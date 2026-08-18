import { getResidents, saveResidents } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const googleUser = await requireGoogleUser(req, res);
  if (!googleUser) return;
  const residentId = googleUser.sub;

  if (req.method === 'GET') {
    const residents = await getResidents();
    const profile = residents.find((r) => r.id === residentId) || null;
    return res.status(200).json({ profile });
  }

  if (req.method === 'POST') {
    const { name, email, dob, rollNo, phone, address, occupation, room } = req.body || {};
    if (!room || !room.trim()) {
      return res.status(400).json({ error: 'room is required' });
    }

    const residents = await getResidents();
    const idx = residents.findIndex((r) => r.id === residentId);
    const now = new Date().toISOString();
    const profile = {
      id: residentId,
      name: (name || '').trim() || googleUser.name,
      email: (email || '').trim() || googleUser.email,
      dob: (dob || '').trim(),
      rollNo: (rollNo || '').trim(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      occupation: (occupation || '').trim(),
      room: room.trim(),
      updatedAt: now,
    };

    if (idx === -1) {
      await saveResidents([...residents, { ...profile, createdAt: now }]);
    } else {
      const updated = [...residents];
      updated[idx] = { ...updated[idx], ...profile };
      await saveResidents(updated);
    }

    return res.status(200).json({ profile });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
