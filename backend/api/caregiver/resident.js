import { getCheckins, getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireCaregiverUser } from '../../lib/auth.js';
import { publicResident } from '../../lib/sanitize.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const caregiver = await requireCaregiverUser(req, res);
  if (!caregiver) return;

  const { residentId } = req.query;
  if (!residentId) return res.status(400).json({ error: 'residentId is required' });

  const [residents, checkins] = await Promise.all([getResidents(), getCheckins()]);
  const resident = residents.find((r) => r.id === residentId);
  if (!resident) return res.status(404).json({ error: 'Resident not found' });

  const history = checkins
    .filter((c) => c.residentId === residentId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return res.status(200).json({ resident: publicResident(resident), history });
}
