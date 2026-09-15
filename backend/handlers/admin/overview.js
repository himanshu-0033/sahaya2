import { getCheckins, getResidents, getAssessments, getChatSessions } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireStudentAccess } from '../../lib/auth.js';
import { buildOverview } from '../../lib/analytics.js';
import { recordsForResidents, residentsForAdmin } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireStudentAccess(req, res);
  if (!admin) return;

  const [residents, checkins, assessments, chatSessions] = await Promise.all([
    getResidents(),
    getCheckins(),
    getAssessments(),
    getChatSessions(),
  ]);
  // The cohort figures are built straight from the check-in and assessment
  // collections, so narrowing the resident list alone is not enough — the
  // records have to be narrowed to the same people or the totals count
  // residents this counsellor cannot open.
  const visible = residentsForAdmin(residents, admin);
  return res.status(200).json(
    buildOverview(visible, recordsForResidents(checkins, visible), {
      assessments: recordsForResidents(assessments, visible),
      chatSessions: recordsForResidents(chatSessions, visible),
    }),
  );
}
