import crypto from 'node:crypto';
import { getResidents, appendRecord, removeRecords } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { deliverResetLink } from '../../lib/reset-delivery.js';

// Step one of a password reset: prove you can receive mail at the address.
//
// Three properties this endpoint has to hold, and each of them is a way people
// get this wrong:
//
//   IT NEVER SAYS WHETHER AN ACCOUNT EXISTS. Every request gets the same
//   answer, whether the address is registered, registered via Google with no
//   password, or nonsense. An endpoint that answers "no such account" is a
//   free membership check for anybody with a list of email addresses, and the
//   membership in question here is a mental-health app.
//
//   THE TOKEN IS NEVER STORED. Only its SHA-256 hash is. A reset token is a
//   password with a short life, and a database that holds usable ones is a
//   database whose leak is an account takeover for every pending reset.
//
//   THE OLD ONES DIE. Asking again invalidates every earlier link for that
//   account, so a link that was forwarded, logged or left in an inbox stops
//   working the moment a newer one is issued.
const TTL_MINUTES = 30;

// Long enough that guessing is not a strategy: 32 random bytes is 256 bits,
// and the endpoint that consumes it looks the hash up directly rather than
// scanning, so there is nothing to rate limit into safety.
function makeToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalized = email.trim().toLowerCase();

  // The one answer this endpoint ever gives.
  const answer = () =>
    res.status(200).json({
      sent: true,
      message: 'If that address has a password account, a reset link is on its way.',
    });

  const residents = await getResidents();
  const resident = residents.find((r) => (r.email || '').toLowerCase() === normalized);

  // No account, or a Google account with no password to reset. Same answer,
  // same shape, and deliberately no timing games beyond this — the lookup is a
  // read either way.
  if (!resident || !resident.passwordHash) return answer();

  await removeRecords('passwordResets', { residentId: resident.id });

  const token = makeToken();
  const now = Date.now();
  await appendRecord('passwordResets', {
    id: hashToken(token),
    residentId: resident.id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MINUTES * 60_000).toISOString(),
  });

  // Delivery failing is not the caller's business, and telling them would leak
  // the existence of the account it failed to reach.
  try {
    await deliverResetLink({ email: resident.email, name: resident.name, token });
  } catch (err) {
    console.error('[forgot] could not deliver the reset link:', err.message);
  }

  return answer();
}
