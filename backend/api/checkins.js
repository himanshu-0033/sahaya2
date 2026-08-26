import { getCheckins, saveCheckins, getResidents } from '../lib/store.js';
import { todayISO, pickThought, computeFlag, MOOD_OPTIONS } from '../lib/logic.js';
import { currentStreak } from '../lib/analytics.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

function isValidMood(mood) {
  return MOOD_OPTIONS.some((m) => m.value === mood);
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const googleUser = await requireGoogleUser(req, res);
  if (!googleUser) return;
  const residentId = googleUser.sub;

  if (req.method === 'POST') {
    const { words: rawWords, mood } = req.body || {};

    if (!Array.isArray(rawWords) || rawWords.length !== 3) {
      return res.status(400).json({ error: 'words must be an array of 3 entries' });
    }
    // A blank is a legitimate answer, and used to be the one answer the form
    // would not take. Requiring three non-empty strings did not produce three
    // honest words — it produced two honest words and "ebjkfkej", because
    // keyboard mash was the only way past a plate that brought nothing to
    // mind. That junk then fed the negative-word rule in lib/logic.js, so
    // forcing the field actively degraded the signal it was protecting.
    const words = rawWords.map((w) => (typeof w === 'string' ? w.trim().slice(0, 60) : ''));
    if (!isValidMood(mood)) {
      return res.status(400).json({ error: 'mood must be one of ' + MOOD_OPTIONS.map((m) => m.value).join(', ') });
    }

    const residents = await getResidents();
    if (!residents.some((r) => r.id === residentId && r.onboarded)) {
      return res.status(400).json({ error: 'Create your account before checking in' });
    }

    const date = todayISO();
    const checkins = await getCheckins();
    const residentHistory = checkins
      .filter((c) => c.residentId === residentId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const existingToday = residentHistory.find((c) => c.date === date);
    if (existingToday) {
      return res.status(200).json({
        ...existingToday,
        streak: currentStreak(residentHistory.map((c) => c.date)),
      });
    }

    const { flagged, reasons } = computeFlag(residentHistory, words);

    const record = {
      id: `${residentId}:${date}`,
      residentId,
      date,
      words: words.map((w) => w.trim()),
      mood,
      moodScore: mood,
      thought: pickThought(residentId, date),
      flagged,
      flagReasons: reasons,
      createdAt: new Date().toISOString(),
    };

    await saveCheckins([...checkins, record]);

    // Streak counted with today included — it is the number the resident is
    // about to be shown, and it should already reflect the check-in they just
    // finished rather than yesterday's total.
    return res.status(201).json({
      ...record,
      streak: currentStreak([...residentHistory.map((c) => c.date), date]),
    });
  }

  if (req.method === 'GET') {
    const { date } = req.query;
    const targetDate = date || todayISO();
    const checkins = await getCheckins();
    const history = checkins
      .filter((c) => c.residentId === residentId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const record = history.find((c) => c.date === targetDate) || null;

    return res.status(200).json({
      checkedIn: Boolean(record),
      record: record ? { ...record, streak: currentStreak(history.map((c) => c.date)) } : null,
      history: history.slice(-14),
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
