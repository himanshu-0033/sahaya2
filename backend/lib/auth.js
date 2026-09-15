import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getStaff } from './store.js';

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

function parseAllowlist(raw) {
  return (raw || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// The allowlist answers one question only: may this person open a staff
// console at all. It does NOT decide whose data they see — that is a separate
// consent gate on each resident's own record, in lib/sharing.js.
//
// An unset allowlist now FAILS CLOSED. It used to return the user, on the
// reasoning that an unconfigured deployment was a local prototype. That is
// true right up until it isn't: one missing environment variable on a real
// deployment silently handed the console, and every resident's mood history
// and risk screens in it, to anybody who could sign in. A prototype that
// refuses to open until it is configured costs a developer thirty seconds;
// the other failure has no floor.
function requireAllowlisted(user, res, { raw, roleLabel, envLabel }) {
  const allowlist = parseAllowlist(raw);

  if (allowlist.length === 0) {
    res.status(403).json({
      error: `The ${roleLabel} console is not configured. Set ${envLabel} on the server to the addresses allowed to open it.`,
    });
    return null;
  }
  if (allowlist.includes((user.email || '').toLowerCase())) {
    return user;
  }
  res.status(403).json({ error: `${user.email || 'This account'} is not on the ${roleLabel} allowlist` });
  return null;
}

export async function requireCaregiverUser(req, res) {
  const user = await requireGoogleUser(req, res);
  if (!user) return null;

  return requireAllowlisted(user, res, {
    raw: process.env.CAREGIVER_EMAILS,
    roleLabel: 'caregiver',
    envLabel: 'CAREGIVER_EMAILS',
  });
}

// The super admin: the owner of the deployment, who sees every counsellor and
// every student and assigns counsellors to students.
//
// This is a deliberate change to the consent model in lib/sharing.js, made by
// the owner on 2026-09-15: a counsellor the super admin assigns can see that
// student straight away, without the student inviting them. Students are told
// so on every screen that used to promise otherwise, and an assigned counsellor
// is listed on their account page as "Assigned by your institution".
//
// SUPER_ADMIN_EMAILS overrides the default, comma-separated like the others.
const DEFAULT_SUPER_ADMINS = 'himanshumalik0033@gmail.com';

export function isSuperAdmin(email) {
  return parseAllowlist(process.env.SUPER_ADMIN_EMAILS || DEFAULT_SUPER_ADMINS).includes(
    (email || '').toLowerCase(),
  );
}

export function counsellorAllowlist() {
  return parseAllowlist(process.env.ADMIN_EMAILS || process.env.CAREGIVER_EMAILS);
}

// Managers see counsellor performance and nothing about individual students;
// counsellors see the students assigned to them or who invited them. An
// allowlisted account that has not chosen yet is treated as a counsellor, which
// is what every console account was before roles existed.
export async function requireStudentAccess(req, res) {
  const admin = await requireAdminUser(req, res);
  if (!admin) return null;
  if (admin.role === 'manager') {
    res.status(403).json({ error: 'Managers see counsellor performance, not individual students.' });
    return null;
  }
  return admin;
}

export async function requireTeamAccess(req, res) {
  const admin = await requireAdminUser(req, res);
  if (!admin) return null;
  if (!admin.superAdmin && admin.role !== 'manager') {
    res.status(403).json({ error: 'Only managers and the super admin see the team.' });
    return null;
  }
  return admin;
}

export async function requireSuperAdmin(req, res) {
  const admin = await requireAdminUser(req, res);
  if (!admin) return null;
  if (!admin.superAdmin) {
    res.status(403).json({ error: 'Only the super admin can do this.' });
    return null;
  }
  return admin;
}

// The counsellor/admin console is a separate app with its own allowlist.
// Falls back to CAREGIVER_EMAILS so a single-allowlist deployment keeps
// working without extra configuration.
export async function requireAdminUser(req, res) {
  const user = await requireGoogleUser(req, res);
  if (!user) return null;

  // The super admin opens the panel whether or not the allowlist names them.
  if (isSuperAdmin(user.email)) return { ...user, superAdmin: true, role: 'super_admin' };

  // Everyone else is let in by the ADMIN_EMAILS allowlist or by the super admin
  // adding them as staff from the Team page, and carries the role they chose on
  // their first sign-in (null until then).
  const email = (user.email || '').toLowerCase();
  const staff = (await getStaff()).find((s) => s.id === email);
  if (staff) return { ...user, superAdmin: false, role: staff.role || null };
  if (counsellorAllowlist().includes(email)) return { ...user, superAdmin: false, role: null };
  res.status(403).json({
    error: `${user.email || 'This account'} does not have access to the admin panel yet. Ask the super admin to add this address on the Team page.`,
  });
  return null;

}
