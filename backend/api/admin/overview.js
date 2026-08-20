import { getCheckins, getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { buildOverview } from '../../lib/analytics.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  const [residents, checkins] = await Promise.all([getResidents(), getCheckins()]);
  return res.status(200).json(buildOverview(residents, checkins));
}
