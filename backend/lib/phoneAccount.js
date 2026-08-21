import { randomUUID } from 'node:crypto';
import { getResidents, saveResidents } from './store.js';
import { signSessionToken } from './auth.js';
import { phonesMatch } from './phone.js';

// Once a number is proven — by Firebase or by our own code — the account side
// is identical, so both sign-in routes end up here. Phone sign-in is one door,
// not two: a verified number either matches a resident (log in) or becomes one
// (sign up). There's no password to get wrong, so splitting it into separate
// forms would only add a way to pick the wrong one.
export async function sessionForVerifiedPhone(phone, name) {
  const residents = await getResidents();
  const now = new Date().toISOString();
  const existing = residents.find((r) => phonesMatch(r.phone, phone));

  if (existing) {
    // A caregiver-created placeholder becomes a real account the first time
    // the person it was made for actually signs in.
    if (existing.invited) {
      await saveResidents(
        residents.map((r) =>
          r.id === existing.id ? { ...r, invited: false, phone, updatedAt: now } : r,
        ),
      );
    }
    return {
      created: false,
      token: signSessionToken({
        sub: existing.id,
        email: existing.email || '',
        name: existing.name,
      }),
    };
  }

  // No email yet — the account form collects one later if they want it.
  const resident = {
    id: 'phone_' + randomUUID(),
    name: (name || '').trim() || phone,
    email: '',
    phone,
    createdAt: now,
    updatedAt: now,
  };
  await saveResidents([...residents, resident]);

  return {
    created: true,
    token: signSessionToken({ sub: resident.id, email: '', name: resident.name }),
  };
}
