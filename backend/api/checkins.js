import { getCheckins, saveCheckins, getResidents } from '../lib/store.js';
import { todayISO, pickThought, generateDinnerPassCode, computeFlag, MOOD_OPTIONS } from '../lib/logic.js';
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
    const { words, mood } = req.body || {};

    if (!Array.isArray(words) || words.length !== 3 || words.some((w) => !w || !w.trim())) {
      return res.status(400).json({ error: 'words must be an array of 3 non-empty strings' });
    }
    if (!isValidMood(mood)) {
      return res.status(400).json({ error: 'mood must be one of ' + MOOD_OPTIONS.map((m) => m.value).join(', ') });
    }

    const residents = await getResidents();
    if (!residents.some((r) => r.id === residentId)) {
      return res.status(400).json({ error: 'Create your account before checking in' });
    }

    const date = todayISO();
    const checkins = await getCheckins();
    const residentHistory = checkins
      .filter((c) => c.residentId === residentId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const existingToday = residentHistory.find((c) => c.date === date);
    if (existingToday) {
      return res.status(200).json(existingToday);
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
      dinnerPassCode: generateDinnerPassCode(date, residentId),
      flagged,
      flagReasons: reasons,
      createdAt: new Date().toISOString(),
    };

    await saveCheckins([...checkins, record]);

    return res.status(201).json(record);
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
      record,
      history: history.slice(-14),
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
