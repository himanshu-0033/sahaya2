// node scripts/quick-start.test.mjs
//
// The landing page hands the free check an answer through router state, which
// is the one input on this page that does not come from the server. The rules
// it has to hold: 0 is a real answer, anything the instrument does not offer is
// refused, and a check with one item never opens past its own end.
import assert from 'node:assert/strict';
import { startFrom } from '../src/features/checkin/quickStart.js';

const who5 = {
  items: [
    { text: 'I have felt cheerful and in good spirits', options: [0, 1, 2, 3, 4, 5].map((value) => ({ value })) },
    { text: 'I have felt calm and relaxed', options: [0, 1, 2, 3, 4, 5].map((value) => ({ value })) },
  ],
};

assert.deepEqual(startFrom(who5, 3), { answers: [3], index: 1 }, 'a ticked answer opens question two');
assert.deepEqual(startFrom(who5, 0), { answers: [0], index: 1 }, '0 is an answer, not an absence');
assert.deepEqual(startFrom(who5, 5), { answers: [5], index: 1 }, 'the last option counts too');

assert.deepEqual(startFrom(who5, undefined), { answers: [], index: 0 }, 'an ordinary visit starts at one');
assert.deepEqual(startFrom(who5, null), { answers: [], index: 0 }, 'null starts at one');
assert.deepEqual(startFrom(who5, 9), { answers: [], index: 0 }, 'a value the scale does not offer is refused');
assert.deepEqual(startFrom(who5, '3'), { answers: [], index: 0 }, 'a string is refused');
assert.deepEqual(startFrom(who5, 2.5), { answers: [], index: 0 }, 'a fraction is refused');

assert.deepEqual(startFrom(null, 3), { answers: [], index: 0 }, 'no instrument yet');
assert.deepEqual(startFrom({ items: [who5.items[0]] }, 3), { answers: [], index: 0 }, 'one item cannot skip ahead');

console.log('quick check start: 10 cases, ok');
