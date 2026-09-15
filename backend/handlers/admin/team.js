import { getCheckins, getResidents, getAssessments, getChatSessions, getStaff } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { counsellorAllowlist, requireSuperAdmin } from '../../lib/auth.js';
import { summarizeResidents } from '../../lib/analytics.js';
import { sharedWithList } from '../../lib/sharing.js';

// Every counsellor, and how the students each of them looks after are doing.
// Super admin only.
//
// A counsellor is anyone on the console allowlist, and anyone a student has
// shared with or been assigned to: the second group can exist without the
// first, and a caseload nobody can open is exactly what this page should show.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireSuperAdmin(req, res);
  if (!admin) return;

  const [residents, checkins, assessments, chatSessions, staff] = await Promise.all([
    getResidents(),
    getCheckins(),
    getAssessments(),
    getChatSessions(),
    getStaff(),
  ]);
  const roleOf = new Map(staff.map((s) => [s.id, s.role]));
  const allowlist = counsellorAllowlist();
  const today = new Date().toISOString().slice(0, 10);
  const summaries = new Map(
    summarizeResidents(residents, checkins, { assessments, chatSessions }).map((s) => [s.id, s]),
  );

  const emails = new Set(allowlist);
  for (const r of residents) for (const e of sharedWithList(r)) emails.add(e);

  const counsellors = [...emails]
    .map((email) => {
      const students = residents.filter((r) => sharedWithList(r).includes(email)).map((r) => summaries.get(r.id));
      const moods = students.map((s) => s.avgMoodRecent).filter((m) => m != null);
      // A counsellor who also has an account in the app has a name there.
      const own = residents.find((r) => (r.email || '').toLowerCase() === email);
      return {
        email,
        name: own?.name || null,
        // Counsellor or manager, as they said on first sign-in; null if they
        // have not signed in yet.
        role: roleOf.get(email) || null,
        canOpenConsole: allowlist.includes(email),
        students: students.length,
        assigned: residents.filter((r) => r.assignedBy?.[email]).length,
        checkedInToday: students.filter((s) => s.lastCheckIn?.date === today).length,
        needsConversation: students.filter((s) => s.flaggedRecently).length,
        atRiskNow: students.filter((s) => s.riskScreen?.recent && s.riskScreen.level === 'acute').length,
        avgMood: moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.needsConversation - a.needsConversation || b.students - a.students || a.email.localeCompare(b.email));

  const unassigned = residents
    .filter((r) => r.onboarded && sharedWithList(r).length === 0)
    .map((r) => {
      const s = summaries.get(r.id);
      return { id: r.id, name: r.name, email: r.email, flaggedRecently: s.flaggedRecently, lastCheckIn: s.lastCheckIn };
    })
    .sort((a, b) => Number(b.flaggedRecently) - Number(a.flaggedRecently) || (a.name || '').localeCompare(b.name || ''));

  return res.status(200).json({
    counsellors,
    unassigned,
    students: residents
      .filter((r) => r.onboarded)
      .map((r) => ({ id: r.id, name: r.name, email: r.email }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  });
}
