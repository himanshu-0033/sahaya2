export const MOOD_OPTIONS = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Bright' },
];

const NEGATIVE_LEXICON = [
  'tired', 'exhausted', 'alone', 'lonely', 'sad', 'empty', 'numb', 'hopeless',
  'dark', 'heavy', 'lost', 'nothing', 'scared', 'anxious', 'worthless', 'stuck',
  'crying', 'tears', 'hurt', 'pain', 'broken', 'fear', 'panic', 'trapped',
];

const THOUGHTS = [
  'You are allowed to take today one hour at a time.',
  'Small steps still count as moving forward.',
  'It is okay to not have the answer today.',
  'Rest is productive too.',
  'You do not have to carry everything alone.',
  'One honest word today is a quiet kind of courage.',
  'Whatever today felt like, it does not decide tomorrow.',
  'Noticing how you feel is already the hard part done.',
  'You are more than your hardest days.',
  'It is fine to ask for a hand — that is not weakness.',
  'Some days are for surviving, not thriving. Both count.',
  'You showed up today. That matters more than it feels like.',
  'Feelings pass through — they are weather, not climate.',
  'You are not behind. You are exactly where you are.',
  'Being gentle with yourself is not the same as giving up.',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function pickThought(residentId, date) {
  const idx = hashString(`${residentId}:${date}`) % THOUGHTS.length;
  return THOUGHTS[idx];
}

export function generateDinnerPassCode(date, residentId) {
  const dateDigits = date.replace(/-/g, '').slice(4); // MMDD
  const suffix = String(hashString(`${residentId}:${date}`)).slice(-4).padStart(4, '0');
  return `SH-${dateDigits}-${suffix}`;
}

export function wordsFlag(words) {
  const lower = words.map((w) => (w || '').toLowerCase().trim());
  const hits = lower.filter((w) => NEGATIVE_LEXICON.includes(w));
  return hits.length >= 2;
}

// Heuristic only — not a diagnosis. Flags a resident for a caregiver to check
// in on based on recent mood scores and word associations.
export function computeFlag(recentCheckins, latestWords) {
  const reasons = [];

  const lastThree = recentCheckins.slice(-3);
  if (lastThree.length === 3 && lastThree.every((c) => c.moodScore <= 2)) {
    reasons.push('Mood has stayed low for 3 check-ins in a row');
  }

  const avgLast5 = recentCheckins.slice(-5);
  if (avgLast5.length >= 3) {
    const avg = avgLast5.reduce((sum, c) => sum + c.moodScore, 0) / avgLast5.length;
    if (avg <= 2.2) reasons.push('Average mood is low this week');
  }

  if (wordsFlag(latestWords)) {
    reasons.push('Today’s words lean heavy');
  }

  return { flagged: reasons.length > 0, reasons };
}
