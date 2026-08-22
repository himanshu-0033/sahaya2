// Guards the reading section's per-questionnaire dossiers against the real
// instrument definitions.
//
// The dossiers live in the frontend and restate two things that also exist in
// backend/lib/instruments.js: the score range, and the band thresholds. That
// duplication is deliberate — reference text should not need the network to
// render — but duplicated numbers drift, and a dossier that quietly disagrees
// with the scoring code would be the app lying about what a score means.
//
// So this asserts the three ways they can come apart:
//   1. an instrument exists with no dossier,
//   2. a dossier exists for an instrument that does not,
//   3. a dossier states a range that the instrument cannot actually produce.

import assert from 'node:assert/strict';
import { INSTRUMENTS, resolveItems } from '../lib/instruments.js';
import { scoreInstrument } from '../lib/scoring.js';
import { TEST_NOTES } from '../../frontend/src/lib/testNotes.js';
import { TEST_INDEX } from '../../frontend/src/lib/testIndex.js';

const instrumentIds = INSTRUMENTS.map((i) => i.id);
const noteIds = Object.keys(TEST_NOTES);

// ---------------------------------------------------------------- coverage
const missing = instrumentIds.filter((id) => !noteIds.includes(id));
assert.deepEqual(
  missing,
  [],
  `every questionnaire needs a dossier in frontend/src/lib/testNotes.js — missing: ${missing.join(', ')}`,
);

const orphaned = noteIds.filter((id) => !instrumentIds.includes(id));
assert.deepEqual(
  orphaned,
  [],
  `these dossiers describe questionnaires that no longer exist: ${orphaned.join(', ')}`,
);

// ------------------------------------------------------------ score ranges
// Derived by actually scoring each instrument twice — once with every item at
// its lowest option and once at its highest — rather than by reimplementing
// the transforms here. An earlier version of this test did reimplement them,
// got `x25` wrong (it is mean x 25, not sum x 25), and reported a correct
// scorer as broken. Driving the real code path removes that whole class of
// error: if this disagrees with the app, the app is what a user sees.
function achievableRange(instrument) {
  // resolveItems is what the scorer itself uses: it falls back to the
  // instrument's scale but lets an individual item override the options, which
  // several instruments do. Reading `SCALES[instrument.scale]` directly misses
  // those and throws on the instruments that have no top-level scale at all.
  const items = resolveItems(instrument);
  const count = items.length;
  const base = items.map((item) => item.options[0].value);
  const rawOf = (sheet) => {
    const result = scoreInstrument(instrument, sheet);
    assert.ok(!result.error, `${instrument.id}: ${result.error}`);
    return result;
  };

  // Probe one item at a time. Reverse-keyed items invert, so the sheet of all
  // lowest answers is NOT the lowest score - PSS-10 has four reversed items
  // and bottoms out at 16, not 0. Asking the scorer what each option is worth
  // in each position is the only way to find the true extremes without
  // reimplementing the keying.
  const lowSheet = [...base];
  const highSheet = [...base];
  const baseRaw = rawOf(base).raw;

  for (let i = 0; i < count; i += 1) {
    let low = { value: base[i], raw: baseRaw };
    let high = { value: base[i], raw: baseRaw };
    for (const { value } of items[i].options) {
      const sheet = [...base];
      sheet[i] = value;
      const { raw } = rawOf(sheet);
      if (raw < low.raw) low = { value, raw };
      if (raw > high.raw) high = { value, raw };
    }
    lowSheet[i] = low.value;
    highSheet[i] = high.value;
  }

  return [rawOf(lowSheet).score, rawOf(highSheet).score];
}

// The prose says things like "0-27" or "1-5 (mean of six items)". Only the
// first pair of numbers is the range; the rest is explanation.
function statedRange(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

for (const instrument of INSTRUMENTS) {
  const note = TEST_NOTES[instrument.id];
  const stated = statedRange(note.range);
  assert.ok(stated, `${instrument.id}: could not read a range out of "${note.range}"`);

  const [lo, hi] = achievableRange(instrument);
  assert.deepEqual(
    stated,
    [lo, hi],
    `${instrument.id}: dossier says ${note.range} but the instrument scores ${lo}-${hi}`,
  );
}

// ---------------------------------------------------- generated index sync
// testIndex.js is generated from these same instruments. If someone edits an
// instrument and forgets to run `npm run sync:tests`, the reading section
// silently shows a stale name or item count - so compare them field by field.
const expectedIndex = INSTRUMENTS.map((i) => ({
  id: i.id,
  name: i.name,
  fullName: i.fullName,
  domain: i.domain,
  itemCount: i.items.length,
  minutes: i.minutes,
  wordingVerified: Boolean(i.wordingVerified),
}));

assert.deepEqual(
  TEST_INDEX,
  expectedIndex,
  'frontend/src/lib/testIndex.js is out of date - run: npm run sync:tests',
);

// ------------------------------------------------------------ prose present
// A dossier with an empty field renders as a blank heading, which looks broken.
for (const [id, note] of Object.entries(TEST_NOTES)) {
  for (const field of ['measures', 'origin', 'reading', 'limits', 'cutoffs']) {
    assert.ok(
      typeof note[field] === 'string' && note[field].trim().length > 20,
      `${id}: "${field}" is missing or too short to be useful`,
    );
  }
  assert.ok(Array.isArray(note.sources) && note.sources.length > 0, `${id}: needs at least one source`);
}

console.log(
  `test dossier checks passed — ${noteIds.length} questionnaires documented, ranges agree with scoring, index in sync`,
);
