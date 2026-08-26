import { getCheckins, getResidents, getAssessments } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { buildOverview } from '../../lib/analytics.js';
import { recordsForResidents, visibleResidents } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  const [residents, checkins, assessments] = await Promise.all([
    getResidents(),
    getCheckins(),
    getAssessments(),
  ]);
  // The cohort figures are built straight from the check-in and assessment
  // collections, so narrowing the resident list alone is not enough — the
  // records have to be narrowed to the same people or the totals count
  // residents this counsellor cannot open.
  const visible = visibleResidents(residents, admin.email);
  return res.status(200).json(
    buildOverview(visible, recordsForResidents(checkins, visible), {
      assessments: recordsForResidents(assessments, visible),
    }),
  );
}
