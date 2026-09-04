import { getGroundingSessions, appendRecord } from '../lib/store.js';
import { catalog, getTechnique, techniqueDetail, FAMILIES, MOODS } from '../lib/grounding.js';
import { todayISO } from '../lib/logic.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

// Records are stamped with todayISO(), which is UTC. The streak has to count
// in the same calendar or it will drop a day for anyone east of Greenwich, so
// it goes through this rather than reimplementing the slice — change one and
// the other follows.
const DAY_MS = 86400000;
const isoDay = (date) => new Date(date).toISOString().slice(0, 10);

// How many consecutive days ending today (or yesterday) have a practice on
// them. Yesterday still counts as alive so a streak doesn't die at midnight
// while someone is asleep — it dies when they miss a whole day.
function streakFrom(dates) {
  const days = new Set(dates);
  let cursor = Date.now();
  if (!days.has(isoDay(cursor))) {
    cursor -= DAY_MS;
    if (!days.has(isoDay(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(isoDay(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const residentId = user.sub;

  if (req.method === 'GET') {
    const { techniqueId } = req.query;

    // One technique, with its script and videos — what the practice page needs.
    if (techniqueId) {
      const technique = getTechnique(techniqueId);
      if (!technique) return res.status(404).json({ error: 'Unknown technique' });
      return res.status(200).json({ technique: techniqueDetail(technique) });
    }

    const sessions = await getGroundingSessions();
    const mine = sessions
      .filter((s) => s.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.status(200).json({
      techniques: catalog(),
      families: FAMILIES,
      moods: MOODS,
      sessions: mine.slice(0, 60),
      streak: streakFrom(mine.map((s) => s.date)),
    });
  }

  if (req.method === 'POST') {
    const { techniqueId, secondsPracticed, completed, before, after } = req.body || {};

    const technique = getTechnique(techniqueId);
    if (!technique) return res.status(400).json({ error: 'Unknown technique' });

    // `before`/`after` are an optional 1–5 self-report of how settled someone
    // feels. Optional on purpose: being made to rate yourself before you are
    // allowed to breathe is the opposite of the point.
    const rating = (value) => {
      if (value == null) return null;
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
    };
    const beforeRating = rating(before);
    const afterRating = rating(after);
    if (beforeRating === undefined || afterRating === undefined) {
      return res.status(400).json({ error: 'before/after must be whole numbers from 1 to 5' });
    }

    const seconds = Number(secondsPracticed);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return res.status(400).json({ error: 'secondsPracticed must be a number of seconds' });
    }

    const sessions = await getGroundingSessions();
    const record = {
      id: `${residentId}:${technique.id}:${Date.now()}`,
      residentId,
      techniqueId: technique.id,
      techniqueName: technique.name,
      family: technique.family,
      date: todayISO(),
      // Capped at the technique's own length: a tab left open overnight should
      // not report an eight-hour breathing practice.
      secondsPracticed: Math.min(Math.round(seconds), technique.pacer
        ? technique.pacer.cycleSeconds * technique.pacer.rounds
        : technique.steps.reduce((total, s) => total + s.seconds, 0)),
      completed: Boolean(completed),
      before: beforeRating,
      after: afterRating,
      createdAt: new Date().toISOString(),
    };

    await appendRecord('groundingSessions', record);
    const next = [...sessions, record];

    const mine = next.filter((s) => s.residentId === residentId);
    return res.status(201).json({
      record,
      streak: streakFrom(mine.map((s) => s.date)),
      totalPractices: mine.length,
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
