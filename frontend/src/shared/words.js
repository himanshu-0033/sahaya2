// Is there a word in here worth reading back?
//
// The plate responses are analysed by word: backend/lib/reflection.js counts
// what came up on more than one plate and which words lean heavy. Keyboard
// mash survives all of that intact — "asdfgh" is six letters, it is not a
// stopword, and it lands in "words you came back to" as if it were meant. So
// the plate inputs ask for at least one thing that behaves like a word before
// they will keep what was typed. Leaving a plate blank stays free.
//
// Deliberately not a dictionary. A list big enough to hold "thorax", "chitin"
// and "pelvis" is ~60KB gzipped on a bundle that is currently 143KB, and a
// Rorschach response turned away for being unusual is the worst thing this
// screen could do — anatomy answers are exactly the ones a clinician would
// want kept.
//
// ponytail: structural check, not a lexicon. Swap in a wordlist if
// invented-but-plausible strings ("blorp", "grellip") turn out to matter.

// The three letter rows and the number row, whole. A token that is a run
// along one of them is somebody's hand, not their answer.
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

export function isWordLike(token) {
  if (token.length < 3) return false;
  // Every English word has one. "sdfsdf" and "lkjhgf" do not.
  if (!/[aeiouy]/.test(token)) return false;
  // "aaa" and "ooooo" clear the vowel test; two distinct letters is the floor
  // ("eye" has exactly two, so this cannot be raised).
  if (new Set(token).size < 2) return false;
  return !KEYBOARD_ROWS.some((row) => row.includes(token));
}

export function hasRealWord(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z']+/)
    .some(isWordLike);
}
