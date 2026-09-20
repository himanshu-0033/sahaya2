// Two columns in the exported tables are typed by the student: the words they
// write at check-in, and their own name. A spreadsheet runs a cell that starts
// with = + - @, so those two columns are a way for a student to put a formula
// on a counsellor's machine. This checks it cannot happen, and that defusing
// it did not wreck the ordinary rows.
import assert from 'node:assert/strict';
import { toCsv } from '../src/lib/csv.js';

const cols = [
  { label: 'Name', value: (r) => r.name },
  { label: 'Words', value: (r) => r.words },
  { label: 'Score', value: (r) => r.score },
];
const lines = (rows) => toCsv(cols, rows).split('\n');

// --- a formula is neutralised ----------------------------------------------
let out = lines([{ name: 'Asha', words: '=HYPERLINK("http://evil.test","click")', score: 3 }]);
assert.ok(
  out[1].includes("'=HYPERLINK"),
  'a cell starting with = leaves as text, not as something Excel will run',
);

for (const lead of ['=', '+', '@', '\t', '\r']) {
  const row = lines([{ name: `${lead}cmd`, words: 'x', score: 1 }])[1];
  assert.ok(row.includes(`'${lead}cmd`), `a cell starting with ${JSON.stringify(lead)} is defused`);
}

// --- the RFC quoting still happens, and happens around the apostrophe -------
out = lines([{ name: 'Asha', words: '=a,b', score: 2 }]);
assert.ok(out[1].includes(`"'=a,b"`), 'a defused cell containing a comma is still quoted');

out = lines([{ name: 'Say "hi"', words: 'x', score: 2 }]);
assert.ok(out[1].includes('"Say ""hi"""'), 'embedded quotes are still doubled');

// --- ordinary values are untouched ------------------------------------------
out = lines([{ name: 'Asha Rao', words: 'tired / heavy', score: 3 }]);
assert.equal(out[1], 'Asha Rao,tired / heavy,3', 'a normal row gains nothing');

// A negative number is a value, not a formula. Prefixing it would turn a real
// figure into text in the counsellor's spreadsheet.
out = lines([{ name: 'Asha', words: 'x', score: -2 }]);
assert.equal(out[1], 'Asha,x,-2', 'a negative number stays a number');
out = lines([{ name: 'Asha', words: 'x', score: -2.5 }]);
assert.equal(out[1], 'Asha,x,-2.5', 'including a decimal one');

// But a minus that starts something which is not a number is still a formula.
out = lines([{ name: 'Asha', words: '-1+cmd|calc', score: 1 }]);
assert.ok(out[1].includes("'-1+cmd"), 'a minus followed by anything else is defused');

// --- empties and nulls do not crash or gain a stray quote -------------------
out = lines([{ name: null, words: undefined, score: 0 }]);
assert.equal(out[1], ',,0', 'null and undefined are empty cells');

console.log('csv checks passed: formulas defused, quoting intact, numbers and blanks untouched');
