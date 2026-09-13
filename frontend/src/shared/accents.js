// One accent per practice, resolved here rather than in each component so a
// card, its orb and its progress ring can never disagree about the colour.
//
// These are literal hex rather than var() lookups on purpose: the pacer builds
// rgba() shadows and radial gradients from them at runtime, and you cannot
// interpolate alpha into a CSS custom property without colour-mix, which is
// still uneven across the browsers this runs on.
// `base` and `bright` are light: they were drawn to glow on a dark ground, and
// they still do exactly the right thing as an orb, a gradient, a ring stroke or
// a tint. What they cannot do any more is carry a letter. The app's ground is
// #f4f7f3 now, and every one of these lands between 1.5:1 and 2.3:1 against it
// — against a floor of 4.5:1. That is the same class of bug as the section
// greys that got fixed, one layer further in.
//
// So `deep` is the third step: the same hue, dark enough to read, measured on
// both the app's ground and a white card. Nothing about the light values
// changed, because nothing is wrong with them where they are used as light.
// Text takes `deep`; everything that is a fill keeps `base` and `bright`.
const ACCENTS = {
  teal: { base: '#1fae95', bright: '#5fd6bf', deep: '#0f7e6b' },
  sky: { base: '#58b6f5', bright: '#8fd0ff', deep: '#1a6da6' },
  lavender: { base: '#a79cf0', bright: '#c4bcff', deep: '#5546c0' },
  amber: { base: '#d9a55c', bright: '#f0c68a', deep: '#8a5716' },
  rose: { base: '#f2789f', bright: '#ffa3c0', deep: '#b83a63' },
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
