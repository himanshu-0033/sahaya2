import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function bearerToken(req) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Returns { sub, email, name, picture } for a verified Google ID token, or
// null if there's no token / it fails verification. `res` is only used to
// write an error response when verification is explicitly required.
export async function verifyGoogleUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
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

export async function requireGoogleUser(req, res) {
  try {
    const user = await verifyGoogleUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sign in with Google is required' });
      return null;
    }
    return user;
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired Google session: ' + err.message });
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
