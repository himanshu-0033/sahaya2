import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';

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

  return res.status(200).json({
    admin: { email: admin.email, name: admin.name || admin.email },
  });
}
