// Guards the runner's branching against the scorer's.
//
// frontend/src/lib/steps.js decides which questions go on screen. This file
// decides which answers count. They are separate on purpose — the browser is
// not trusted — but if they disagree the resident gets a form they cannot
// submit, or one that submits with a question missing.
//
// The assertion that matters most is the last block: walk every possible
// sitting of a branching instrument the way the UI would, and check the sheet
// that comes out the other end is one scoreInstrument accepts.
import assert from 'node:assert/strict';
import { getInstrument, instrumentDetail } from '../lib/instruments.js';
import { scoreInstrument } from '../lib/scoring.js';
import { allAnswered, asksFollowUp, clearOrphans, isAsked, stepsFor } from '../../frontend/src/lib/steps.js';

// steps.js is written against what the API actually sends the runner, not
// against the raw definitions, so drive it with exactly that.
const cssrs = instrumentDetail(getInstrument('c-ssrs'));
const phq = instrumentDetail(getInstrument('phq-9'));
const ucla = instrumentDetail(getInstrument('ucla-3'));

const blank = (i) => new Array(i.items.length).fill(null);

// ------------------------------------------------------------- no branching
// The overwhelming majority of the battery: every question, every time.
assert.deepEqual(stepsFor(ucla, blank(ucla)), [0, 1, 2], 'a plain instrument asks everything');
assert.deepEqual(stepsFor(phq, blank(phq)), [0, 1, 2, 3, 4, 5, 6, 7, 8], 'no follow-up until endorsed');
const phqEndorsed = blank(phq).map((_, i) => (i === 0 ? 2 : 0));
assert.equal(stepsFor(phq, phqEndorsed).length, 10, 'one endorsement opens the difficulty question');

// --------------------------------------------------------- the Columbia skip
const noThoughts = [0, 0, null, null, null, null];
assert.deepEqual(stepsFor(cssrs, noThoughts), [0, 1, 5], 'no to Q2 skips method, intent and plan');

const hasThoughts = [0, 1, null, null, null, null];
assert.deepEqual(stepsFor(cssrs, hasThoughts), [0, 1, 2, 3, 4, 5], 'yes to Q2 opens all three');
assert.equal(isAsked(cssrs.items, noThoughts, 2), false);
assert.equal(isAsked(cssrs.items, hasThoughts, 2), true);
assert.equal(isAsked(cssrs.items, noThoughts, 5), true, 'the behaviour question is always asked');

// The recency follow-up hangs off Q6 specifically, not off "anything at all".
assert.equal(asksFollowUp(cssrs, [1, 1, 1, 1, 1, 0]), false, 'four yeses but no past behaviour');
assert.equal(asksFollowUp(cssrs, [0, 0, null, null, null, 1]), true, 'past behaviour alone opens it');

// ------------------------------------------------------------- retraction
// Saying yes, answering the branch, then going back and saying no must not
// leave the branch answers behind.
const answeredBranch = [1, 1, 1, 1, 1, 0];
const retracted = clearOrphans(cssrs, [1, 0, 1, 1, 1, 0]);
assert.deepEqual(retracted, [1, 0, null, null, null, 0], 'retracting Q2 clears what it opened');
assert.deepEqual(clearOrphans(cssrs, answeredBranch), answeredBranch, 'nothing cleared while it still holds');
assert.equal(allAnswered(cssrs, retracted), true, 'and the sitting is finished, not stuck');

// A sheet with an open branch question is not finished.
assert.equal(allAnswered(cssrs, [1, 1, null, null, null, 0]), false);
assert.equal(allAnswered(cssrs, noThoughts), false, 'Q6 still unanswered');
assert.equal(allAnswered(cssrs, [0, 0, null, null, null, 0]), true);

// ------------------------------------------- the two halves have to agree
// Walk every reachable sitting the way the UI walks it — answer whatever step
// is on the board, re-deriving the board after each answer — and require the
// scorer to accept the result. This is the failure that would strand someone
// on a form that will not submit.
function walk(instrument, choices) {
  let answers = blank(instrument);
  let followUp = null;
  let guard = 0;

  for (;;) {
    if (guard++ > 50) throw new Error('step machine did not terminate');
    const steps = stepsFor(instrument, answers);
    const open = steps.filter((st) =>
      st === instrument.items.length ? followUp === null : answers[st] === null,
    );
    if (open.length === 0) return { answers, followUp };

    const step = open[0];
    const options = step === instrument.items.length ? instrument.followUp.options : instrument.items[step].options;
    const pick = options[choices(step) % options.length].value;

    if (step === instrument.items.length) followUp = pick;
    else {
      const next = [...answers];
      next[step] = pick;
      answers = clearOrphans(instrument, next);
    }
  }
}

let walked = 0;
for (const instrument of [cssrs, phq]) {
  const raw = getInstrument(instrument.id);
  // Every combination of "answer the nth option" strategies, which between
  // them reach every branch of both forms.
  for (let mask = 0; mask < 64; mask += 1) {
    const { answers, followUp } = walk(instrument, (step) => (mask >> step % 6) & 1 ? 1 : 0);
    assert.equal(allAnswered(instrument, answers), true, `${instrument.id}: UI thinks it is finished`);

    const result = scoreInstrument(raw, answers, followUp);
    assert.ok(!result.error, `${instrument.id}: scorer rejected a sheet the UI called finished — ${result.error}`);
    assert.ok(result.band, `${instrument.id}: no band`);
    walked += 1;
  }
}

console.log(`step checks passed — ${walked} simulated sittings, runner and scorer agree`);
