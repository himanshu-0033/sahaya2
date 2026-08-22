// One accent per practice, resolved here rather than in each component so a
// card, its orb and its progress ring can never disagree about the colour.
//
// These are literal hex rather than var() lookups on purpose: the pacer builds
// rgba() shadows and radial gradients from them at runtime, and you cannot
// interpolate alpha into a CSS custom property without colour-mix, which is
// still uneven across the browsers this runs on.
const ACCENTS = {
  teal: { base: '#1fae95', bright: '#5fd6bf' },
  sky: { base: '#58b6f5', bright: '#8fd0ff' },
  lavender: { base: '#a79cf0', bright: '#c4bcff' },
  amber: { base: '#d9a55c', bright: '#f0c68a' },
  rose: { base: '#f2789f', bright: '#ffa3c0' },
};

const FALLBACK = ACCENTS.teal;

export function accent(name) {
  return ACCENTS[name] || FALLBACK;
}

// rgba() from a #rrggbb, so one accent can produce a glow, a tint and a border
// without three more entries in the table above.
export function alpha(hex, a) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const FAMILY_ACCENT = {
  breath: 'teal',
  senses: 'amber',
  body: 'sky',
  mind: 'amber',
  kindness: 'rose',
  rest: 'lavender',
};

// How the evidence ladder in backend/lib/grounding.js is worded to a resident.
// The backend refuses to promote a technique up this ladder; the UI must not
// quietly do it either, so the labels stay as plain as the strengths are.
export const EVIDENCE_LABEL = {
  trial: 'Tested in a trial',
  mechanism: 'Well-understood physiology',
  clinical: 'Standard clinical practice',
};

export const SPEED_LABEL = {
  fast: 'Works in seconds',
  steady: 'A few minutes',
  deep: 'Give it the full time',
};

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}
