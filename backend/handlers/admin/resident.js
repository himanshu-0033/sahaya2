import {
  getCheckins,
  getResidents,
  getInkblotSessions,
  getAssessments,
  getChatSessions,
  recordView,
} from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireStudentAccess } from '../../lib/auth.js';
import { publicResident } from '../../lib/sanitize.js';
import { historyFor, summarizeResident } from '../../lib/analytics.js';
import { assignedList, canAdminView, normalizeEmail, sharedWithList } from '../../lib/sharing.js';
import { topicLabel } from '../../lib/topics.js';
import { LABELS as SAFETY_LABELS } from '../../lib/safety.js';

// One row per viewer per student per quarter hour. Long enough that a refresh,
// a second tab and a glance back after a meeting are one visit; short enough
// that two visits in a morning are two rows.
const VIEW_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireStudentAccess(req, res);
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
  if (!resident || !canAdminView(resident, admin)) {
    return res.status(404).json({ error: 'Resident not found' });
  }

  // Logged here rather than by the console, for the same reason the safety
  // screen runs on the saved transcript as well as in the browser: a client
  // that decides whether to report itself is not a record of anything. This
  // sits after the access check, so a 404 leaves no row and the log cannot be
  // used to prove an account exists.
  //
  // Awaited, unlike the export write. An export is logged before the file is
  // built and a failure there would block a counsellor from their own
  // caseload; here the write is already on the response path, and a view that
  // silently went unlogged is the failure this endpoint exists to prevent. A
  // storage error surfaces rather than leaving a gap that looks like nobody
  // looked.
  await recordView({
    actor: normalizeEmail(admin.email),
    residentId,
    subjectName: resident.name || null,
    at: new Date().toISOString(),
    windowMs: VIEW_WINDOW_MS,
  });

  return res.status(200).json({
    resident: publicResident(resident),
    // Who can see this person, for the super admin's assign controls.
    counsellors: admin.superAdmin
      ? sharedWithList(resident).map((email) => ({
          email,
          assigned: assignedList(resident).includes(email),
          assignedAt: resident.assignedBy?.[email]?.at || null,
        }))
      : undefined,
    summary: summarizeResident(resident, checkins, { detailed: true, assessments, chatSessions }),
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
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map((c) => ({
        ...c,
        topicLabels: (c.topics || []).map(topicLabel),
        safetyLabels: (c.safety || []).map((k) => SAFETY_LABELS[k] || k),
      })),
  });
}
