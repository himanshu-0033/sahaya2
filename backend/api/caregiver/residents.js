import { getCheckins, getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireCaregiverUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const caregiver = await requireCaregiverUser(req, res);
  if (!caregiver) return;

  const [residents, checkins] = await Promise.all([getResidents(), getCheckins()]);

  const summaries = residents.map((resident) => {
    const history = checkins
      .filter((c) => c.residentId === resident.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    const last = history[history.length - 1] || null;

    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const expected = new Date();
      expected.setDate(expected.getDate() - (history.length - 1 - i));
      if (history[i].date === expected.toISOString().slice(0, 10)) streak++;
      else break;
    }

    const flaggedRecently = history.slice(-3).some((c) => c.flagged);

    return {
      id: resident.id,
      name: resident.name,
      room: resident.room,
      lastCheckIn: last ? { date: last.date, mood: last.mood, flagged: last.flagged } : null,
      totalCheckIns: history.length,
      streak,
      flaggedRecently,
    };
  });

  summaries.sort((a, b) => {
    if (a.flaggedRecently !== b.flaggedRecently) return a.flaggedRecently ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return res.status(200).json({ residents: summaries });
}
