import { getCheckins, getResidents, appendRecord } from '../lib/store.js';
import { todayISO, pickThought, computeFlag, MOOD_OPTIONS } from '../lib/logic.js';
import { currentStreak } from '../lib/analytics.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';
import { HELPLINES_BY_CATEGORY, LABELS as SAFETY_LABELS, screenForCrisis } from '../lib/safety.js';

function isValidMood(mood) {
  return MOOD_OPTIONS.some((m) => m.value === mood);
}

// The daily check-in was the one piece of free text nobody screened.
//
// The chat screens every turn, the inkblot screens every response, and a
// positive PHQ-9 item 9 routes into the crisis path. Three words a day, typed
// by every student every day, went only through computeFlag in lib/logic.js,
// which matches a twenty-four word list of ordinary heavy words (tired, sad,
// lonely) and needs two hits.
//
// That list contains nothing about dying, so the app flagged "tired sad
// lonely" for a counsellor and did nothing at all for "kill myself tonight".
// The student who wrote the second one was shown a thought for the day and a
// streak. The screener that would have caught it was already in the codebase,
// three imports away, being used by everything else.
//
// The three words are screened as one line, because a disclosure is a phrase
// and the plates split it across boxes: "want" / "to" / "die" is only a
// disclosure joined up.
function screenWords(words) {
  return screenForCrisis(words.filter(Boolean).join(' '));
}

// What the student is shown. Deliberately the same numbers the chat and the
// questionnaires give, from the same table, so there is one list of helplines
// in this app and not four that drift apart.
function crisisPayload(category) {
  return {
    category,
    label: SAFETY_LABELS[category] || category,
    message:
      'You wrote something that sounds heavy, and it matters more than the streak. ' +
      'You do not have to sit with it alone. If you are in danger right now, call 112. ' +
      'Tele-MANAS on 14416 is free, confidential and answers at any hour.',
    helplines: HELPLINES_BY_CATEGORY[category] || HELPLINES_BY_CATEGORY.suicide,
  };
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
    const crisis = screenWords(words);

    const record = {
      id: `${residentId}:${date}`,
      residentId,
      date,
      words: words.map((w) => w.trim()),
      mood,
      moodScore: mood,
      thought: pickThought(residentId, date),
      // A disclosure flags the check-in whatever the mood scores have been
      // doing. It is not a nudge and it does not wait for a second signal.
      flagged: flagged || crisis.flagged,
      flagReasons: crisis.flagged
        ? [...reasons, `Wrote something about their safety: ${SAFETY_LABELS[crisis.category] || crisis.category}`]
        : reasons,
      // Same field and same shape as a screened chat transcript, so it reaches
      // the console's risk list through the path that already exists rather
      // than through a second one that would have to be kept in step.
      safety: crisis.flagged ? [crisis.category] : [],
      createdAt: new Date().toISOString(),
    };

    try {
      await appendRecord('checkins', record);
    } catch (err) {
      // The unique index rejected it: another request created today's check-in
      // between our read and our write. That is not an error to show anybody —
      // the check-in they asked for exists. Return it, exactly as the branch
      // above would have.
      if (err?.code !== 11000) throw err;
      const latest = (await getCheckins())
        .filter((c) => c.residentId === residentId)
        .sort((a, b) => a.date.localeCompare(b.date));
      const today = latest.find((c) => c.date === date);
      if (today) {
        return res.status(200).json({ ...today, streak: currentStreak(latest.map((c) => c.date)) });
      }
      throw err;
    }

    // Streak counted with today included — it is the number the resident is
    // about to be shown, and it should already reflect the check-in they just
    // finished rather than yesterday's total.
    return res.status(201).json({
      ...record,
      streak: currentStreak([...residentHistory.map((c) => c.date), date]),
      // Returned so the student sees help on the next screen instead of a
      // thought for the day. Reaching a counsellor is the slow path and this
      // is the fast one: whoever wrote those words is looking at the app right
      // now, and the console may not be opened until Monday.
      ...(crisis.flagged ? { crisis: crisisPayload(crisis.category) } : {}),
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

    // The streak is a property of the person, not of today's record, so it is
    // reported whether or not they have checked in yet. Nested inside `record`
    // it vanished every morning until the day's check-in was done — which is
    // exactly when a streak is worth seeing, because it is the thing about to
    // be broken. It stays on the record too: the home screen's ring reads it
    // from there.
    const streak = currentStreak(history.map((c) => c.date));

    return res.status(200).json({
      checkedIn: Boolean(record),
      streak,
      record: record ? { ...record, streak } : null,
      history: history.slice(-14),
      // Rebuilt here as well as on the POST, because /results re-fetches rather
      // than carrying the POST body through the router. Without this the help
      // would appear once and vanish on the first refresh, which is the worst
      // possible moment for it to be a trick of navigation.
      ...(record?.safety?.length ? { crisis: crisisPayload(record.safety[0]) } : {}),
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
