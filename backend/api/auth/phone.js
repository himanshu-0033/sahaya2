import { randomUUID } from 'node:crypto';
import { getResidents, saveResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';
import { verifyFirebasePhoneToken } from '../../lib/firebase.js';
import { phonesMatch } from '../../lib/phone.js';

// Phone sign-in is one door, not two: a number Firebase has verified either
// matches an existing resident (log in) or becomes a new one (sign up).
// There's no password to get wrong, so splitting it into two forms would only
// add a way to pick the wrong one.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firebaseToken, name } = req.body || {};
  if (!firebaseToken) {
    return res.status(400).json({ error: 'A verified phone token is required' });
  }

  let verified;
  try {
    verified = await verifyFirebasePhoneToken(firebaseToken);
  } catch (err) {
    return res.status(401).json({ error: 'Could not verify that phone number: ' + err.message });
  }
  if (!verified) {
    return res.status(400).json({ error: 'That sign-in has no phone number attached' });
  }

  const residents = await getResidents();
  const now = new Date().toISOString();
  const existing = residents.find((r) => phonesMatch(r.phone, verified.phone));

  if (existing) {
    // A caregiver-created placeholder becomes a real account the first time
    // the person it was made for actually signs in.
    if (existing.invited) {
      await saveResidents(
        residents.map((r) =>
          r.id === existing.id ? { ...r, invited: false, phone: verified.phone, updatedAt: now } : r,
        ),
      );
    }
    const token = signSessionToken({
      sub: existing.id,
      email: existing.email || '',
      name: existing.name,
    });
    return res.status(200).json({ token });
  }

  // No email yet — the profile page collects one later if they want it.
  const resident = {
    id: 'phone_' + randomUUID(),
    name: (name || '').trim() || verified.phone,
    email: '',
    phone: verified.phone,
    createdAt: now,
    updatedAt: now,
  };
  await saveResidents([...residents, resident]);

  const token = signSessionToken({ sub: resident.id, email: '', name: resident.name });
  return res.status(201).json({ token });
}
