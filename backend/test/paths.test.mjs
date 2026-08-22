import assert from 'node:assert';
import { PATHS, PATH_IDS, getPath, catalog, pathDetail, dayAt, progressFor } from '../lib/paths.js';
import { TECHNIQUE_IDS } from '../lib/grounding.js';
import { INSTRUMENT_IDS, getInstrument } from '../lib/instruments.js';

// --- every reference resolves --------------------------------------------
// This is the whole reason this file exists. A path is nothing but pointers
// into two other catalogues, so a renamed practice or a retired instrument
// would leave a resident staring at a day that cannot open.
assert.ok(PATHS.length >= 3, `expected 3+ paths, got ${PATHS.length}`);
assert.equal(new Set(PATH_IDS).size, PATHS.length, 'unique ids');

for (const path of PATHS) {
  assert.ok(path.name && path.blurb && path.forWhom, `${path.id} says what it is and who for`);
  assert.ok(path.days.length >= 3, `${path.id} runs for at least three days`);
  assert.ok(path.days.length <= 14, `${path.id} is not longer than a fortnight`);

  for (const [i, day] of path.days.entries()) {
    assert.ok(day.title, `${path.id} day ${i + 1} has a title`);
    assert.ok(day.note, `${path.id} day ${i + 1} says something`);
    assert.ok(
      TECHNIQUE_IDS.includes(day.technique),
      `${path.id} day ${i + 1} points at a real practice (got "${day.technique}")`,
    );
  }

  for (const id of [path.opensWith, path.closesWith].filter(Boolean)) {
    assert.ok(INSTRUMENT_IDS.includes(id), `${path.id} bookend "${id}" is a real instrument`);
  }
}

// --- the honesty rules ----------------------------------------------------
// A path that closes with a questionnaire MUST carry the caveat that goes
// with it. Without that, a seven-day score change reads as proof the path
// worked, which is not something this data can support. Treat this assertion
// as load-bearing rather than as a copy check.
for (const path of PATHS) {
  if (path.closesWith) {
    assert.ok(
      path.closingCaveat && path.closingCaveat.length > 40,
      `${path.id} closes with ${path.closesWith} and must explain what a change does not mean`,
    );
  }
}

// A bookended path must open and close on the SAME instrument, or the
// comparison is between two different scales.
for (const path of PATHS) {
  if (path.opensWith || path.closesWith) {
    assert.equal(path.opensWith, path.closesWith, `${path.id} brackets one instrument`);
  }
}

// Where an MCID is declared it must be a positive number within the
// instrument's own range — a threshold larger than the scale would silently
// mark every change as "not meaningful".
for (const path of PATHS) {
  if (path.mcid != null) {
    assert.ok(path.mcid > 0, `${path.id} mcid is positive`);
    const instrument = getInstrument(path.closesWith);
    const ceiling = instrument.bands[instrument.bands.length - 1].max;
    assert.ok(path.mcid < ceiling, `${path.id} mcid sits inside the ${path.closesWith} range`);
  }
}

// --- day indexing ---------------------------------------------------------
// Days are 1-indexed to a resident and 0-indexed in the array. Getting this
// wrong shows someone the wrong practice, so both ends are pinned.
const steadier = getPath('steadier');
assert.equal(dayAt(steadier, 1), steadier.days[0]);
assert.equal(dayAt(steadier, steadier.days.length), steadier.days[steadier.days.length - 1]);
assert.equal(dayAt(steadier, 0), null, 'there is no day zero');
assert.equal(dayAt(steadier, steadier.days.length + 1), null, 'no day past the end');
assert.equal(getPath('nope'), null);

const detail = pathDetail(steadier);
assert.deepEqual(
  detail.days.map((d) => d.day),
  steadier.days.map((_, i) => i + 1),
  'detail numbers days from one',
);

// --- progress -------------------------------------------------------------
const fresh = progressFor(steadier, null);
assert.equal(fresh.done, 0);
assert.equal(fresh.nextDay, 1, 'a path nobody has started begins at day one');
assert.equal(fresh.finished, false);
assert.equal(fresh.startedAt, null);

// Days can be done out of order, so "next" is the lowest gap, not done + 1.
const skipped = progressFor(steadier, { completedDays: [1, 2, 4], startedAt: '2026-01-01T00:00:00Z' });
assert.equal(skipped.done, 3);
assert.equal(skipped.nextDay, 3, 'next is the earliest unfinished day, not the one after the last');
assert.equal(skipped.finished, false);

const doneOutOfOrder = progressFor(steadier, {
  completedDays: [7, 6, 5, 4, 3, 2, 1],
  startedAt: '2026-01-01T00:00:00Z',
});
assert.equal(doneOutOfOrder.finished, true, 'order does not matter for completion');
assert.equal(doneOutOfOrder.nextDay, null, 'a finished path has no next day');

// --- catalog withholds the day-by-day script ------------------------------
const cards = catalog();
assert.equal(cards.length, PATHS.length);
for (const card of cards) {
  assert.ok(!('days' in card), `${card.id} card withholds the script`);
  assert.equal(card.dayCount, getPath(card.id).days.length, `${card.id} promises its real length`);
}

console.log(
  `path checks passed — ${PATHS.length} paths, ` +
    `${PATHS.reduce((n, p) => n + p.days.length, 0)} days, ` +
    `${PATHS.filter((p) => p.closesWith).length} bookended`,
);
