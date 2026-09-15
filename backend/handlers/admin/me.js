import { getStaff } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { adminStanding, requireGoogleUser } from '../../lib/auth.js';

// The panel calls this right after sign-in to decide what to show: the role
// question, the "waiting for the super admin" screen, or the dashboard.
//
// Any signed-in account gets an answer here, because asking to join has to be
// possible before anyone has approved you. Every endpoint with data behind it
// still goes through requireAdminUser, which refuses anyone not approved.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const standing = await adminStanding(user);

  return res.status(200).json({
    admin: {
      // null until they have said whether they are a counsellor or a manager.
      role: standing.role,
      status: standing.status,
      email: user.email,
      name: user.name || user.email,
      picture: user.picture || null,
      superAdmin: standing.superAdmin,
      // For the super admin, how many are waiting on them, for the Team tab's badge.
      ...(standing.superAdmin && {
        pendingRequests: (await getStaff()).filter((s) => s.status === 'pending').length,
      }),
    },
  });
}
