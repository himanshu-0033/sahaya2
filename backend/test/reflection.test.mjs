import assert from 'node:assert';
import { PLATES, isPlateId } from '../lib/plates.js';
import { summarizeSession } from '../lib/reflection.js';
import { screenForCrisis, screenResponses } from '../lib/safety.js';

// --- plates ---------------------------------------------------------------
assert.equal(PLATES.length, 10, 'ten plates');
assert.equal(new Set(PLATES.map((p) => p.id)).size, 10, 'unique ids');
assert.ok(
  PLATES.every((p) => p.path.startsWith('M0,') && p.path.trim().endsWith('Z')),
  'every half-path starts on the midline and closes',
);
assert.ok(isPlateId('plate-01') && !isPlateId('plate-99'));

// --- a calm session -------------------------------------------------------
const calm = summarizeSession([
  { plateId: 'plate-01', text: 'two dancers facing each other', latencyMs: 4200 },
  { plateId: 'plate-02', text: 'a butterfly, maybe a moth', latencyMs: 3100 },
  { plateId: 'plate-03', text: 'dancers again, holding a pot', latencyMs: 5000 },
  { plateId: 'plate-04', text: 'a large coat hanging up', latencyMs: 2600 },
  { plateId: 'plate-05', text: 'a bat in flight', latencyMs: 1900 },
]);
assert.equal(calm.respondedCount, 5);
assert.equal(calm.plateCount, 10);
assert.equal(calm.flagged, false, 'a calm session must not flag');
assert.deepEqual(calm.recurring.map((r) => r.word), ['dancers'], 'recurring word found');
assert.equal(calm.avgLatencyMs, 3360);

// --- heavy language -------------------------------------------------------
const heavy = summarizeSession([
  { plateId: 'plate-01', text: 'something broken and empty', latencyMs: 9000 },
  { plateId: 'plate-02', text: 'feels heavy', latencyMs: 8000 },
  { plateId: 'plate-03', text: 'a trapped animal', latencyMs: 7000 },
]);
assert.equal(heavy.flagged, true);
assert.ok(heavy.flagReasons.includes('Language across the session leans heavy'));
assert.ok(heavy.flagReasons.some((r) => r.startsWith('Only 3 of 10')));

// --- crisis disclosure ----------------------------------------------------
const crisis = summarizeSession([
  { plateId: 'plate-07', text: 'honestly I want to die when I look at this', latencyMs: 12000 },
]);
assert.equal(crisis.flagged, true);
assert.equal(crisis.crisisHits.length, 1);
assert.equal(crisis.crisisHits[0].plateId, 'plate-07', 'names the plate it came from');
assert.ok(crisis.flagReasons.includes('A response mentioned self-harm or suicide'));

// --- empty input ----------------------------------------------------------
const blank = summarizeSession([{ plateId: 'plate-01', text: '', latencyMs: null }]);
assert.equal(blank.respondedCount, 0);
assert.equal(blank.avgWordsPerPlate, 0, 'no divide-by-zero');
assert.equal(blank.avgLatencyMs, null);
assert.equal(blank.flagged, false);
assert.deepEqual(blank.recurring, []);

// --- screening ------------------------------------------------------------
assert.equal(
  screenForCrisis('this deadline is killing me').flagged,
  false,
  'no false positive on "killing me"',
);
assert.equal(screenForCrisis('I want to hurt myself').flagged, true);
assert.equal(screenForCrisis('').flagged, false);
assert.equal(screenForCrisis(null).flagged, false);
assert.equal(screenResponses([]).flagged, false);

console.log('reflection + safety checks passed');
