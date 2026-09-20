import { getCheckins, getResidents, getAssessments, getChatSessions } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireStudentAccess } from '../../lib/auth.js';
import { buildOverview } from '../../lib/analytics.js';
import { recordsForResidents, residentsForAdmin } from '../../lib/sharing.js';

// ponytail: reads every check-in, assessment and chat session in the database
// on each dashboard load and narrows them in memory. Fine at prototype size
// and a real ceiling later: a thousand students over a year is a few hundred
// thousand check-in documents fetched to render a fourteen-day trend.
//
// Not narrowed by date here because the figures are not all recent. The trend
// is fourteen days and the mood mix thirty, but summarizeResidents also
// reports a streak and a lifetime check-in count, and both of those need the
// whole history for anybody still checking in. A date window would quietly
// truncate the streak, which is the one number on this page a student is told
// about, so it would be wrong rather than merely approximate.
//
// The upgrade is to denormalise: keep totalCheckIns, streak and lastCheckIn on
// the resident record, written when a check-in is stored, and let this handler
// read a date-bounded slice for the trend and the mix. That is a migration
// plus a second writer, so it wants doing on purpose rather than in passing.
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
