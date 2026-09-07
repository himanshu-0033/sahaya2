// node scripts/words.test.mjs
//
// The gate on the plate inputs. The two failure modes are not symmetric: mash
// getting through pollutes the "words you came back to" list, while a real
// response turned away is a person told their answer was wrong on the one
// screen that promises it cannot be. So the accept list is the one that
// matters, and it leans on the unusual answers.
import assert from 'node:assert/strict';
import { hasRealWord } from '../src/shared/words.js';

const KEEP = [
  'bat',
  'a bat',
  'two people dancing',
  'butterfly',
  'thorax',
  'pelvis',
  'chitin',
  'vertebrae',
  'lobster',
  'eye',
  'a moth, maybe',
  "someone's face",
  'TWO BEARS',
  'aaargh, a spider',
];

const REJECT = [
  '',
  '   ',
  'asdf',
  'asdfgh',
  'qwerty',
  'zxcvb',
  'sdfsdf',
  'lkjhgf',
  'jjjjjj',
  'aaa',
  'ooooo',
  '12345',
  '...',
  'ok',
  'hm',
];

for (const text of KEEP) assert.equal(hasRealWord(text), true, `should keep: ${text}`);
for (const text of REJECT) assert.equal(hasRealWord(text), false, `should reject: ${text}`);

console.log(`words: ${KEEP.length} kept, ${REJECT.length} rejected — ok`);
