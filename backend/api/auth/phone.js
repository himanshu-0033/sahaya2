import { applyCors } from '../../lib/cors.js';
import { verifyFirebasePhoneToken } from '../../lib/firebase.js';
import { sessionForVerifiedPhone } from '../../lib/phoneAccount.js';

// The Firebase route: the browser has already passed Firebase's SMS check, so
// all this does is confirm the token really is Firebase's and hand back one of
// our own sessions. Inert until the FIREBASE_* env vars are set — see
// phone-start.js / phone-verify.js for the no-SMS-provider alternative.
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

  const { token, created } = await sessionForVerifiedPhone(verified.phone, name);
  return res.status(created ? 201 : 200).json({ token });
}
