import assert from 'node:assert';
import { INSTRUMENTS, getInstrument, resolveItems, catalog } from '../lib/instruments.js';
import { scoreInstrument } from '../lib/scoring.js';

const fill = (id, value) => resolveItems(getInstrument(id)).map(() => value);
const score = (id, answers) => scoreInstrument(getInstrument(id), answers);

// --- catalog sanity -------------------------------------------------------
assert.ok(INSTRUMENTS.length >= 15, `expected 15+ instruments, got ${INSTRUMENTS.length}`);
assert.equal(new Set(INSTRUMENTS.map((i) => i.id)).size, INSTRUMENTS.length, 'unique ids');
for (const i of INSTRUMENTS) {
  assert.ok(i.items.length > 0, `${i.id} has items`);
  assert.ok(i.license, `${i.id} declares a license`);
  assert.ok(i.citation, `${i.id} declares a citation`);
  assert.ok(i.bands.length > 0, `${i.id} has bands`);
  // Every item must resolve to options, whether from a shared scale or its own.
  for (const item of resolveItems(i)) {
    assert.ok(item.options && item.options.length > 1, `${i.id} item has options`);
  }
  // Bands must cover the instrument's ceiling, or a max score falls off the
  // end. Reaching the ceiling means answering the TOP option on forward items
  // and the BOTTOM one on reverse-keyed items.
  const top = scoreInstrument(
    i,
    resolveItems(i).map((it) => {
      const values = it.options.map((o) => o.value);
      return it.reverse ? Math.min(...values) : Math.max(...values);
    }),
  );
  assert.ok(!top.error, `${i.id} scores a full-marks sheet: ${top.error}`);
  assert.ok(top.band, `${i.id} band found at ceiling`);
  assert.equal(top.score, top.maxScore, `${i.id} ceiling equals declared max`);
}
assert.equal(catalog().length, INSTRUMENTS.length);
assert.ok(!JSON.stringify(catalog()).includes('bands'), 'catalog withholds the scoring key');

// --- PHQ-9 ----------------------------------------------------------------
const phqLow = score('phq-9', fill('phq-9', 0));
assert.equal(phqLow.score, 0);
assert.equal(phqLow.band.label, 'Minimal');
assert.equal(phqLow.crisis, null);

const phqHigh = score('phq-9', fill('phq-9', 3));
assert.equal(phqHigh.score, 27);
assert.equal(phqHigh.band.label, 'Severe');
assert.ok(phqHigh.crisis, 'item 9 positive flags crisis');
assert.equal(phqHigh.crisis.itemIndex, 8);

// Crisis is independent of the total: a low scorer who endorses item 9 flags.
const phqSneaky = fill('phq-9', 0);
phqSneaky[8] = 1;
const sneaky = score('phq-9', phqSneaky);
assert.equal(sneaky.band.label, 'Minimal');
assert.ok(sneaky.crisis, 'low total still flags on item 9');

// --- GAD-7, WHO-5 ---------------------------------------------------------
assert.equal(score('gad-7', fill('gad-7', 3)).score, 21);
assert.equal(score('gad-7', fill('gad-7', 3)).band.label, 'Severe');
assert.equal(score('who-5', fill('who-5', 0)).score, 0);
assert.equal(score('who-5', fill('who-5', 0)).band.label, 'Low wellbeing');
assert.equal(score('who-5', fill('who-5', 5)).score, 100, 'WHO-5 raw x4');
assert.equal(score('who-5', fill('who-5', 5)).band.label, 'Good');

// --- reverse keying -------------------------------------------------------
// PSS-10: answering "Never" (0) to everything means the four reverse items
// each score 4, so the total is 16 — not 0.
assert.equal(score('pss-10', fill('pss-10', 0)).raw, 16, 'PSS-10 reverse items invert');
assert.equal(score('pss-10', fill('pss-10', 4)).raw, 24);

// RSES: "Strongly agree" (3) everywhere gives 5 forward x3 + 5 reversed x0.
assert.equal(score('rses', fill('rses', 3)).raw, 15, 'RSES half the items are reverse-keyed');
assert.equal(score('rses', fill('rses', 0)).raw, 15);

// BRS: three reverse items, then a mean.
assert.equal(score('brs', fill('brs', 3)).score, 3, 'BRS midpoint is invariant');
assert.equal(score('brs', fill('brs', 5)).score, 3, 'three forward 5s and three reversed 1s');

// --- transforms -----------------------------------------------------------
assert.equal(score('mspss', fill('mspss', 7)).score, 7, 'MSPSS reports a mean');
assert.equal(score('mspss', fill('mspss', 1)).score, 1);
assert.equal(score('cbi-personal', fill('cbi-personal', 4)).score, 100, 'CBI reports 0-100');
assert.equal(score('cbi-personal', fill('cbi-personal', 0)).score, 0);
assert.equal(score('cbi-personal', fill('cbi-personal', 2)).score, 50);

// --- subscales ------------------------------------------------------------
// MSPSS publishes three factors; the total can look fine while one source of
// support is empty, which is the whole reason to report them separately.
const mspssFlat = score('mspss', fill('mspss', 4));
assert.equal(mspssFlat.subscales.length, 3);
assert.deepEqual(
  mspssFlat.subscales.map((s) => s.label),
  ['Significant other', 'Family', 'Friends'],
);
assert.ok(mspssFlat.subscales.every((s) => s.score === 4 && s.maxScore === 7));

// Friends are items 6,7,9,12 (0-indexed 5,6,8,11): strand those and only the
// friends subscale should drop.
const lonely = fill('mspss', 7);
for (const i of [5, 6, 8, 11]) lonely[i] = 1;
const strandedFriends = score('mspss', lonely);
const byLabel = Object.fromEntries(strandedFriends.subscales.map((s) => [s.label, s.score]));
assert.equal(byLabel.Friends, 1, 'friends subscale isolates items 6/7/9/12');
assert.equal(byLabel.Family, 7);
assert.equal(byLabel['Significant other'], 7);
assert.equal(strandedFriends.score, 5, 'total stays "moderate" while one factor is empty');
assert.equal(strandedFriends.band.label, 'Moderate support');

// Instruments without declared subscales report null, not an empty array.
assert.equal(score('gad-7', fill('gad-7', 1)).subscales, null);

// --- cut-off behaviour ----------------------------------------------------
assert.equal(score('ucla-3', fill('ucla-3', 1)).band.label, 'Not lonely');
assert.equal(score('ucla-3', fill('ucla-3', 2)).band.label, 'Lonely', 'UCLA-3 cut-off is 6');
assert.equal(score('mini-spin', [1, 1, 1]).band.label, 'Below screen cut-off');
assert.equal(score('mini-spin', [2, 2, 2]).band.label, 'Above screen cut-off', 'Mini-SPIN cut-off is 6');

// --- per-item option sets (AUDIT-C has no shared scale) -------------------
const audit = getInstrument('audit-c');
assert.equal(audit.scale, null);
assert.equal(score('audit-c', [0, 0, 0]).band.label, 'Low risk');
assert.equal(score('audit-c', [4, 4, 4]).score, 12);

// --- the five newer screens ----------------------------------------------
// Each one is checked at both ends and, where it has one, exactly on its
// published cut-off — the boundary is the only part of a band table that is
// easy to get wrong by one.
assert.equal(score('phq-15', fill('phq-15', 0)).score, 0);
assert.equal(score('phq-15', fill('phq-15', 0)).band.label, 'Minimal');
assert.equal(score('phq-15', fill('phq-15', 2)).score, 30, 'PHQ-15 tops out at 15 items x 2');
assert.equal(score('phq-15', fill('phq-15', 2)).band.label, 'High');

const ptsd = fill('pc-ptsd-5', 0);
assert.equal(score('pc-ptsd-5', ptsd).band.label, 'Below cut-off');
ptsd[0] = 1; ptsd[1] = 1;
assert.equal(score('pc-ptsd-5', ptsd).band.label, 'Below cut-off', 'two yeses is still below');
ptsd[2] = 1;
assert.equal(score('pc-ptsd-5', ptsd).band.label, 'At or above cut-off', 'PC-PTSD-5 cut-off is 3');

const scoff = fill('scoff', 0);
assert.equal(score('scoff', scoff).band.label, 'Below cut-off');
scoff[0] = 1;
assert.equal(score('scoff', scoff).band.label, 'Below cut-off', 'one yes is still below');
scoff[3] = 1;
assert.equal(score('scoff', scoff).band.label, 'At or above cut-off', 'SCOFF cut-off is 2');

assert.equal(score('bsmas', fill('bsmas', 1)).score, 6, 'BSMAS floor is 6, not 0');
assert.equal(score('bsmas', fill('bsmas', 1)).band.label, 'Below cut-off');
assert.equal(score('bsmas', fill('bsmas', 4)).score, 24);
assert.equal(score('bsmas', fill('bsmas', 4)).band.label, 'At or above cut-off', 'BSMAS cut-off is 24');
assert.equal(score('bsmas', fill('bsmas', 5)).score, 30);

// SCS-SF is reverse-keyed on half its items and reported as a mean, so a
// sheet of straight 5s is NOT the compassionate end — it is a person who both
// gives themselves tenderness and is intolerant of themselves, i.e. the middle.
const scs = getInstrument('scs-sf');
assert.equal(scs.items.filter((i) => i.reverse).length, 6, 'SCS-SF reverses half its items');
assert.equal(score('scs-sf', fill('scs-sf', 5)).score, 3, 'all-5s means the midpoint after reversal');
assert.equal(score('scs-sf', fill('scs-sf', 5)).band.label, 'Moderate');

const kind = resolveItems(scs).map((item) => (item.reverse ? 1 : 5));
assert.equal(score('scs-sf', kind).score, 5, 'kindest possible sheet means 5');
assert.equal(score('scs-sf', kind).band.label, 'High');
assert.equal(score('scs-sf', kind.map((v) => 6 - v)).score, 1, 'harshest sheet means 1');
assert.equal(score('scs-sf', kind.map((v) => 6 - v)).band.label, 'Low');
// Higher is better here, so the UI must be told which end is the good one.
assert.equal(score('scs-sf', kind).band.higherIsBetter, true);
assert.equal(score('phq-15', fill('phq-15', 0)).band.higherIsBetter, false);

// --- validation -----------------------------------------------------------
assert.match(score('gad-7', [0, 0, 0]).error, /expects 7 answers/);
assert.match(score('gad-7', [0, 0, 0, 0, 0, 0, 9]).error, /not one of the allowed options/);
assert.match(score('gad-7', [0, 0, 0, 0, 0, 0, null]).error, /is missing/);
assert.match(score('gad-7', 'nope').error, /must be an array/);

console.log(`all scoring checks passed — ${INSTRUMENTS.length} instruments`);
