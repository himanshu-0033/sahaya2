import { getResidents, saveResidents } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';
import { addShare, normalizeEmail, removeShare, sharedWithList } from '../lib/sharing.js';

// The only endpoint that can create or remove a share.
//
// It authenticates as the RESIDENT — requireGoogleUser, not requireAdminUser —
// and writes only to that resident's own record. There is deliberately no
// counsellor-side equivalent: a counsellor cannot grant themselves access to
// somebody, and cannot add a colleague to somebody else's record. If a share
// exists, the person it is about put it there.
//
// Revocation is immediate and needs no approval. Consent you cannot withdraw
// on your own is not consent, and a mental-health record is the last place to
// put a confirmation dialog in front of someone changing their mind.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const residentId = user.sub;

  const residents = await getResidents();
  const idx = residents.findIndex((r) => r.id === residentId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Finish setting up your account first' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ sharedWith: sharedWithList(residents[idx]) });
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const email = normalizeEmail((req.body || {}).email || req.query.email);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    // Sharing with yourself is a no-op that would read as a second viewer on
    // your own screen.
    if (email === normalizeEmail(user.email)) {
      return res.status(400).json({ error: 'That is your own address — you can always see your own check-ins.' });
    }

    const sharedWith =
      req.method === 'POST' ? addShare(residents[idx], email) : removeShare(residents[idx], email);

    const updated = [...residents];
    updated[idx] = { ...updated[idx], sharedWith, updatedAt: new Date().toISOString() };
    await saveResidents(updated);

    return res.status(200).json({ sharedWith });
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
