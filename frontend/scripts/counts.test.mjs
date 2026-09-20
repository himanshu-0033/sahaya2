// The numbers in the copy, against the numbers in the product.
//
// The landing page told everybody the app had 21 questionnaires. It has 22,
// and had for a while. Three separate strings said 21: the strip across the
// top of the landing page, the showcase section under it, and the More tab
// inside the app.
//
// It is a small lie and it is on the first line a stranger reads, in an app
// whose entire pitch is that the numbers in it are checkable. Nothing catches
// this kind of drift, because the copy is a string and the product is a data
// file and nothing has ever made them meet.
//
// So they meet here. Counts are read out of the copy and compared with the
// backend's own tables.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_INSTRUMENTS } from '../../backend/lib/instruments.js';
import { TECHNIQUES } from '../../backend/lib/grounding.js';
import { PATHS } from '../../backend/lib/paths.js';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const TRUTH = {
  questionnaires: PUBLISHED_INSTRUMENTS.length,
  grounding: TECHNIQUES.length,
  paths: PATHS.length,
};

// Where a count is claimed, and the word it is claimed next to. Deliberately a
// list rather than a regex sweep: a number in the copy that nobody put here on
// purpose is not something this should silently bless.
const CLAIMS = [
  ['features/auth/Welcome.jsx', /(\d+)\s+questionnaires/g, 'questionnaires'],
  ['features/auth/Welcome.jsx', /(\d+)\s+grounding practices/g, 'grounding'],
  ['features/auth/AppShowcase.jsx', /(\d+)\s+published questionnaires/g, 'questionnaires'],
  ['features/auth/AppShowcase.jsx', /(\d+)\s+grounding practices/g, 'grounding'],
  ['features/auth/AppShowcase.jsx', /(\d+)\s+guided paths/g, 'paths'],
  ['features/home/More.jsx', /(\d+)\s+questionnaires/g, 'questionnaires'],
  ['features/home/More.jsx', /(\d+)\s+paths/g, 'paths'],
];

let checked = 0;
for (const [file, pattern, kind] of CLAIMS) {
  const src = read(file);
  const found = [...src.matchAll(pattern)];
  assert.ok(
    found.length > 0,
    `${file} no longer claims a ${kind} count. If the sentence was reworded, ` +
      'update this list; if it was removed, remove the row.',
  );
  for (const m of found) {
    assert.equal(
      Number(m[1]),
      TRUTH[kind],
      `${file} says "${m[0].trim()}" but the app has ${TRUTH[kind]}. ` +
        'The copy is on the first line a stranger reads.',
    );
    checked += 1;
  }
}

// The landing page's stat block. This is a separate shape from the sentences
// above: an array of { n, label } rendered through the odometer, so it carries
// the number as its own field and the first version of this test walked
// straight past it while it still said 21.
const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five',
];

const welcome = read('features/auth/Welcome.jsx');
const STAT_LABELS = {
  'published questionnaires': 'questionnaires',
  'grounding practices': 'grounding',
  'guided paths': 'paths',
};
let stats = 0;
for (const m of welcome.matchAll(/\{\s*n:\s*'(\d+)',\s*label:\s*'([^']+)'\s*\}/g)) {
  const kind = STAT_LABELS[m[2]];
  if (!kind) continue;
  assert.equal(
    Number(m[1]),
    TRUTH[kind],
    `the landing stat block says ${m[1]} ${m[2]} but the app has ${TRUTH[kind]}`,
  );
  stats += 1;
}
assert.ok(stats >= 3, 'the stat block scan matched almost nothing, so it is not scanning it');

// "PHQ-9, GAD-7, WHO-5 and eighteen more published screens" is a count too,
// spelled out and split across an addition, which is the hardest kind to
// notice going stale. Three named plus the remainder has to be the total.
const named = (welcome.match(/PHQ-9, GAD-7, WHO-5 and (\S+) more published screens/) || [])[1];
assert.ok(named, 'the "and N more published screens" line is gone; update this check');
const remainder = WORDS.indexOf(named);
assert.notEqual(remainder, -1, `could not read "${named}" as a number`);
assert.equal(
  3 + remainder,
  TRUTH.questionnaires,
  `"PHQ-9, GAD-7, WHO-5 and ${named} more" comes to ${3 + remainder}, ` +
    `but the app has ${TRUTH.questionnaires}`,
);

// A spelled-out count elsewhere drifts the same way and is harder to grep for.
for (const file of ['features/assessments/Assessments.jsx', 'features/home/More.jsx']) {
  const src = read(file);
  assert.ok(
    !/shelf of twenty-one|twenty-one questionnaires/.test(src),
    `${file} spells out a questionnaire count, which cannot be checked against the data`,
  );
}

console.log(
  `count checks passed: ${checked + stats + 1} claims match the product ` +
    `(${TRUTH.questionnaires} questionnaires, ${TRUTH.grounding} practices, ${TRUTH.paths} paths)`,
);
