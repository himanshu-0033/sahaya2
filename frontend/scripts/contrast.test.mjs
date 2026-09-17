// Every `-deep` token has one job: to be legible as text. This asserts it, on
// the two grounds the app actually paints: its own cream, and the white card
// that sits on top of it.
//
// It exists because this bug has now been found twice. The section greys went
// under the floor once, and the accents in accents.js were still carrying the
// values they were given when the app had a dark ground: between 1.5:1 and
// 2.3:1 against the light one that replaced it. Both were invisible until
// somebody looked. This looks, on every run of `npm test`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));

// WCAG 2.1 relative luminance, then the contrast ratio built from it.
function luminance(hex) {
  const v = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => {
    const s = parseInt(v.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// AA for body text. Deliberately not the 3:1 large-text allowance: these are
// used on labels and marginalia as often as on headings. The two grounds are the
// printed form's: white paper, and the tint a shaded cell is printed in.
const FLOOR = 4.5;
const GROUNDS = { 'paper': '#ffffff', 'shaded cell': '#eef4ef' };

const css = readFileSync(join(here, '..', 'src', 'styles', 'design-tokens.css'), 'utf8');
const deepTokens = [...css.matchAll(/--([\w-]*-deep):\s*(#[0-9a-fA-F]{6})/g)];

assert.ok(deepTokens.length > 0, 'no -deep tokens found. Did the token build run?');

const failures = [];
for (const [, name, hex] of deepTokens) {
  for (const [groundName, ground] of Object.entries(GROUNDS)) {
    const r = ratio(hex, ground);
    if (r < FLOOR) failures.push(`--${name} ${hex} on ${groundName}: ${r.toFixed(2)}:1`);
  }
}

assert.deepEqual(failures, [], `these read below ${FLOOR}:1:\n  ${failures.join('\n  ')}`);

// The accents are literal hex rather than tokens, because the pacer interpolates
// alpha into them at runtime, so they are checked from their own source.
const accents = readFileSync(join(here, '..', 'src', 'shared', 'accents.js'), 'utf8');
const accentDeeps = [...accents.matchAll(/(\w+):\s*\{[^}]*deep:\s*'(#[0-9a-fA-F]{6})'/g)];

assert.ok(accentDeeps.length > 0, 'no accent `deep` values found in accents.js');

const accentFailures = [];
for (const [, name, hex] of accentDeeps) {
  for (const [groundName, ground] of Object.entries(GROUNDS)) {
    const r = ratio(hex, ground);
    if (r < FLOOR) accentFailures.push(`accent ${name} ${hex} on ${groundName}: ${r.toFixed(2)}:1`);
  }
}

assert.deepEqual(accentFailures, [], `these read below ${FLOOR}:1:\n  ${accentFailures.join('\n  ')}`);

console.log(
  `contrast: ${deepTokens.length} deep tokens and ${accentDeeps.length} accents clear ${FLOOR}:1 on both grounds`,
);
