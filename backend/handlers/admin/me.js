import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { getStaff } from '../../lib/store.js';
import { normalizeEmail } from '../../lib/sharing.js';

// The console calls this right after sign-in so it can show "not on the
// allowlist" up front instead of failing on every dashboard request.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  // null until they have said whether they are a counsellor or a manager; the
  // panel asks on that first sign-in. The super admin is never asked.
  const staff = admin.superAdmin
    ? null
    : (await getStaff()).find((s) => s.id === normalizeEmail(admin.email));
  const role = admin.superAdmin ? 'super_admin' : staff?.role || null;

  return res.status(200).json({
    admin: {
      role,
      email: admin.email,
      name: admin.name || admin.email,
      picture: admin.picture || null,
      superAdmin: Boolean(admin.superAdmin),
    },
  });
}
