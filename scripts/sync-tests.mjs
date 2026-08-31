// Regenerates frontend/src/features/read/testIndex.js from the instrument definitions.
//
// The reading section renders questionnaire names, domains and item counts
// without touching the API, so it needs its own copy of that list. This is the
// one place the copy is made, and backend/test/test-notes.test.mjs fails if
// the copy and the source disagree — so the workflow when an instrument
// changes is: edit instruments.js, run this, commit both.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSTRUMENTS } from '../backend/lib/instruments.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'frontend/src/features/read/testIndex.js');

const rows = INSTRUMENTS.map((i) => ({
  id: i.id,
  name: i.name,
  fullName: i.fullName,
  domain: i.domain,
  itemCount: i.items.length,
  minutes: i.minutes,
  wordingVerified: Boolean(i.wordingVerified),
  // Whether the app will actually serve it. An instrument can be documented
  // here and still be withheld — see licenceCleared in instruments.js — and the
  // reading page needs to know so it does not offer a "take it" link that
  // leads to a 404.
  available: i.licenceCleared !== false,
}));

const header = `// The questionnaire list the reading section renders from.
//
// GENERATED from backend/lib/instruments.js — do not hand-edit. Regenerate with:
//   npm run sync:tests
//
// It exists so the reading section stays a pure static bundle: the Tests tab
// fetches this same information from /api/assessments because it also needs
// scoring, but an explainer page has nothing to score and should not need a
// server to render. backend/test/test-notes.test.mjs fails if this file drifts
// out of step with the instruments it was generated from.

export const TEST_INDEX = `;

writeFileSync(OUT, `${header}${JSON.stringify(rows, null, 2)};\n`, 'utf-8');
console.log(`testIndex.js regenerated — ${rows.length} questionnaires`);
