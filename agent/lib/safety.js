// Crisis screening runs BEFORE any model call, so it behaves identically no
// matter which provider is plugged in — and keeps working if the model is
// unreachable.
//
// LIMITS, stated plainly: this is substring matching. It will miss indirect
// phrasing ("I want to go to sleep and not wake up" is caught, but sarcasm,
// metaphor, typos, Hindi/Hinglish phrasing and many real disclosures are not),
// and it will occasionally fire on harmless text ("this deadline is killing
// me"). It is a safety net that fails toward showing help, never a detector to
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

export function crisisResponse() {
  return {
    reply:
      "I'm really glad you told me, and I don't want you to sit with this alone. " +
      "I'm a prototype, not a person, and this is bigger than I can hold — please " +
      'reach out to someone who can be with you right now. If you are in immediate ' +
      'danger, call 112.',
    helplines: HELPLINES,
    flagged: true,
  };
}
