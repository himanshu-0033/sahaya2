import {
  getCheckins,
  getResidents,
  getInkblotSessions,
  getAssessments,
  getChatSessions,
} from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { publicResident } from '../../lib/sanitize.js';
import { historyFor, summarizeResident } from '../../lib/analytics.js';
import { canView } from '../../lib/sharing.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  const { residentId } = req.query;
  if (!residentId) return res.status(400).json({ error: 'residentId is required' });

  const [residents, checkins, inkblotSessions, assessments, chatSessions] = await Promise.all([
    getResidents(),
    getCheckins(),
    getInkblotSessions(),
    getAssessments(),
    getChatSessions(),
  ]);
  const resident = residents.find((r) => r.id === residentId);
  // Deliberately the same 404 either way. Distinguishing "no such person" from
  // "that person has not shared with you" would turn this endpoint into a way
  // to test whether a given account uses the app at all.
  if (!resident || !canView(resident, admin.email)) {
    return res.status(404).json({ error: 'Resident not found' });
  }

  return res.status(200).json({
    resident: publicResident(resident),
    summary: summarizeResident(resident, checkins, { detailed: true, assessments }),
    history: historyFor(checkins, residentId),
    inkblotSessions: inkblotSessions
      .filter((s) => s.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    assessments: assessments
      .filter((a) => a.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    // Newest conversation first, which is the one a counsellor opening this
    // page is looking for. Reached through the same canView() check above as
    // everything else here: a resident who has not shared with this counsellor
    // is a 404 before any of this is read.
    chatSessions: chatSessions
      .filter((c) => c.residentId === residentId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
  });
}
