import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// Mirrors backend/lib/auth.js verification so this module can be deployed and
// scaled on its own. It only ever *verifies* tokens — issuing them stays the
// backend's job.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const SESSION_ISSUER = 'sahay-ai';

function bearerToken(req) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function verifyGoogleIdToken(token) {
  if (!client) throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return { sub: payload.sub, email: payload.email, name: payload.name || payload.email };
}

function verifyOwnSessionToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured on the server');
  const payload = jwt.verify(token, secret, { issuer: SESSION_ISSUER });
  return { sub: payload.sub, email: payload.email, name: payload.name };
}

export async function requireUser(req, res) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Sign in is required' });
    return null;
  }
  // Our own tokens carry iss "sahay-ai"; anything else is treated as Google's.
  try {
    return verifyOwnSessionToken(token);
  } catch {
    try {
      return await verifyGoogleIdToken(token);
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired session: ' + err.message });
      return null;
    }
  }
}
