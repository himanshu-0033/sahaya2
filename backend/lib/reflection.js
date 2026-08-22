// Summarising an inkblot reflection session.
//
// What this deliberately does NOT do: score. Real Rorschach coding assigns
// location, determinants, content and popularity to every response against a
// system (Exner, R-PAS) and is done by a trained clinician; none of that is
// happening here and pretending otherwise would be the harmful part. What
// this produces is DESCRIPTIVE — what the resident wrote, how much of it,
// what came back more than once — plus the same plain, auditable nudge
// vocabulary the daily check-in already uses in logic.js.
import { NEGATIVE_LEXICON } from './logic.js';
import { screenResponses } from './safety.js';
import { PLATES } from './plates.js';

// Small closed-class stoplist. Only used to keep the "came up more than
// once" list interesting — nothing downstream depends on it being complete.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for', 'with',
  'about', 'into', 'to', 'from', 'in', 'on', 'is', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'we', 'you', 'he', 'she', 'they', 'them',
  'some', 'like', 'looks', 'look', 'looking', 'see', 'seems', 'maybe', 'kind',
  'sort', 'something', 'thing', 'things', 'two', 'one', 'there', 'here', 'as',
  'be', 'am', 'are', 'was', 'were', 'been', 'has', 'have', 'had', 'do', 'does',
]);

function words(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ''))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Words the resident reached for on more than one plate. This is the piece
// worth handing back to them — it is their own material, not a verdict.
function recurringWords(responses) {
  const platesByWord = new Map();
  for (const r of responses) {
    for (const w of new Set(words(r.text))) {
      if (!platesByWord.has(w)) platesByWord.set(w, new Set());
      platesByWord.get(w).add(r.plateId);
    }
  }
  return [...platesByWord.entries()]
    .filter(([, plateIds]) => plateIds.size >= 2)
    .map(([word, plateIds]) => ({ word, plates: plateIds.size }))
    .sort((a, b) => b.plates - a.plates || a.word.localeCompare(b.word))
    .slice(0, 6);
}

function heavyWordHits(responses) {
  const hits = new Set();
  for (const r of responses) {
    for (const w of words(r.text)) {
      if (NEGATIVE_LEXICON.includes(w)) hits.add(w);
    }
  }
  return [...hits].sort();
}

export function summarizeSession(responses) {
  const answered = responses.filter((r) => r.text && r.text.trim());
  const allWords = answered.flatMap((r) => words(r.text));

  const latencies = answered
    .map((r) => r.latencyMs)
    .filter((ms) => typeof ms === 'number' && ms >= 0 && ms < 15 * 60 * 1000);
  const avgLatencyMs = latencies.length
    ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length)
    : null;

  const heavy = heavyWordHits(answered);
  const crisis = screenResponses(answered);

  // Same shape and the same honesty as computeFlag: a nudge to have a real
  // conversation, with its reasons shown, never a conclusion.
  const reasons = [];
  if (crisis.flagged) {
    reasons.push('A response mentioned self-harm or suicide');
  }
  if (heavy.length >= 4) {
    reasons.push('Language across the session leans heavy');
  }
  if (answered.length > 0 && answered.length <= 3) {
    reasons.push(`Only ${answered.length} of ${PLATES.length} plates got a response`);
  }

  return {
    plateCount: PLATES.length,
    respondedCount: answered.length,
    wordCount: allWords.length,
    avgWordsPerPlate: answered.length ? Math.round((allWords.length / answered.length) * 10) / 10 : 0,
    avgLatencyMs,
    recurring: recurringWords(answered),
    heavyWords: heavy,
    crisisHits: crisis.hits,
    flagged: reasons.length > 0,
    flagReasons: reasons,
  };
}
