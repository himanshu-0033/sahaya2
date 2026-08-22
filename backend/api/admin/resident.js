import { getCheckins, getResidents, getInkblotSessions, getAssessments } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { publicResident } from '../../lib/sanitize.js';
import { historyFor, summarizeResident } from '../../lib/analytics.js';

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

  const [residents, checkins, inkblotSessions, assessments] = await Promise.all([
    getResidents(),
    getCheckins(),
    getInkblotSessions(),
    getAssessments(),
  ]);
  const resident = residents.find((r) => r.id === residentId);
  if (!resident) return res.status(404).json({ error: 'Resident not found' });

  return res.status(200).json({
    resident: publicResident(resident),
    summary: summarizeResident(resident, checkins, { detailed: true }),
    history: historyFor(checkins, residentId),
    inkblotSessions: inkblotSessions
      .filter((s) => s.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    assessments: assessments
      .filter((a) => a.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
