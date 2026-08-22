// Crisis screening for free-text a resident submits to the backend.
//
// The daily check-in only ever takes one word per plate, so it never needed
// this. The reflection takes open sentences, which is exactly where someone
// discloses something the rest of the app has no way to hear — so anything
// stored from that field is screened first.
//
// This deliberately duplicates agent/lib/safety.js rather than importing it:
// `agent/` is its own independently deployed Vercel project and the two do
// not share a node_modules or a build. Keep the two lists in step by hand.
//
// LIMITS, stated plainly: this is substring matching. It will miss indirect
// phrasing, sarcasm, metaphor, typos and Hindi/Hinglish phrasing, and it
// will occasionally fire on harmless text ("this deadline is killing me").
// It is a safety net that fails toward showing help, never a detector to
// rely on alone or a substitute for a human.
const CRISIS_PATTERNS = [
  'kill myself', 'killing myself', 'end my life', 'ending my life',
  'want to die', 'wanna die', 'better off dead', 'not want to live',
  "don't want to live", 'dont want to live', 'no reason to live',
  'suicide', 'suicidal', 'take my own life',
  'hurt myself', 'hurting myself', 'harm myself', 'self harm', 'self-harm',
  'cut myself', 'cutting myself', 'overdose',
  'not wake up', 'never wake up', 'disappear forever',
  'everyone would be better without me', 'nobody would miss me',
  'no one would miss me', 'end it all',
];

export const HELPLINES = [
  { name: 'Emergency (police / ambulance)', number: '112' },
  { name: 'KIRAN Mental Health Helpline', number: '1800-599-0019' },
  { name: 'iCall (TISS)', number: '9152987821' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345' },
  { name: 'AASRA', number: '9820466726' },
];

export function screenForCrisis(text) {
  const normalized = (text || '').toLowerCase().replace(/\s+/g, ' ');
  const hit = CRISIS_PATTERNS.find((p) => normalized.includes(p));
  return { flagged: Boolean(hit), matched: hit || null };
}

// Screens a whole set of responses at once. Returns which plates matched so
// a counsellor can go straight to the response rather than reading ten.
export function screenResponses(responses) {
  const hits = [];
  for (const r of responses) {
    const { flagged, matched } = screenForCrisis(r.text);
    if (flagged) hits.push({ plateId: r.plateId, matched });
  }
  return { flagged: hits.length > 0, hits };
}
