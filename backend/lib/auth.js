import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const SESSION_ISSUER = 'sahay-ai';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured on the server');
  return secret;
}

function bearerToken(req) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Issues our own session token for email/password accounts, shaped like a
// decoded Google ID token so the frontend's session handling works for both.
export function signSessionToken({ sub, email, name }) {
  return jwt.sign({ sub, email, name, iss: SESSION_ISSUER }, jwtSecret(), { expiresIn: '30d' });
}

async function verifyGoogleIdToken(token) {
  if (!client) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server');
  }
  const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
  };
}

function verifyOwnSessionToken(token) {
  const payload = jwt.verify(token, jwtSecret(), { issuer: SESSION_ISSUER });
  return { sub: payload.sub, email: payload.email, name: payload.name };
}

// Returns { sub, email, name } for a verified session — either our own
// email/password JWT or a Google ID token — or null if there's no token.
export async function verifyGoogleUser(req) {
  const token = bearerToken(req);
  if (!token) return null;

  const unverified = jwt.decode(token);
  if (unverified?.iss === SESSION_ISSUER) {
    return verifyOwnSessionToken(token);
  }
  return verifyGoogleIdToken(token);
}

export async function requireGoogleUser(req, res) {
  try {
    const user = await verifyGoogleUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sign in is required' });
      return null;
    }
    return user;
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session: ' + err.message });
    return null;
  }
}

export async function requireCaregiverUser(req, res) {
  const user = await requireGoogleUser(req, res);
  if (!user) return null;

  const allowlist = (process.env.CAREGIVER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    // No allowlist configured — open for local/dev prototyping.
    return user;
  }
  if (allowlist.includes(user.email.toLowerCase())) {
    return user;
  }
  res.status(403).json({ error: `${user.email} is not on the caregiver allowlist` });
  return null;
}

// The counsellor/admin console is a separate app with its own allowlist.
// Falls back to CAREGIVER_EMAILS so a single-allowlist deployment keeps
// working without extra configuration.
export async function requireAdminUser(req, res) {
  const user = await requireGoogleUser(req, res);
  if (!user) return null;

  const raw = process.env.ADMIN_EMAILS || process.env.CAREGIVER_EMAILS || '';
  const allowlist = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    // No allowlist configured — open for local/dev prototyping.
    return user;
  }
  if (allowlist.includes(user.email.toLowerCase())) {
    return user;
  }
  res.status(403).json({ error: `${user.email} is not on the counsellor allowlist` });
  return null;
}
