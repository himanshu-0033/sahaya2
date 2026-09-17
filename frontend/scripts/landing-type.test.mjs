// node scripts/landing-type.test.mjs
//
// The landing page had 27 distinct font sizes across its two files. Not 27
// roles: 27 numbers, several of them a pixel or two apart and doing the same
// job, because every heading and caption was written as its own arbitrary
// Tailwind value with nothing to check it against. That is how a section
// heading ends up at 2.9rem while every other section on the page tops out at
// 2.75rem, and how prose someone is meant to read ends up at 13px.
//
// So the page has a scale now, and this is what makes it one. The numbers live
// here rather than in a CSS file on purpose: the page is written in arbitrary
// values and rewriting it into named classes would be a bigger change than the
// problem deserves. A list plus a test that fails on anything outside it gets
// the same result, which is that a new size has to be a decision.
//
// Adding a step is allowed. Adding it here, deliberately, is the point.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Eleven roles, twelve numbers. The hero spends two of them on one role
// because a wordmark at 84px on a laptop is 56px on a phone. There is no 11px
// step any more: on the printed sheet the small capitals are field labels, set
// condensed at 13px by .f-label in index.css, which is narrower than the wide
// 11px capitals were and can actually be read.
const PAGE = new Map([
  [0.8125, 'meta: the strip, footnotes, citations, tags'],
  [0.875, 'small: stat labels, starting points, row actions'],
  [0.9375, 'body small: supporting prose, footer links, nav'],
  [1, 'body: section intros, answer options'],
  [1.0625, 'body large: the approach paragraphs'],
  [1.25, 'lead: hero subtitle, tool titles, the footer lede, the header wordmark'],
  [1.5, 'title: the showcase columns, the hero tagline'],
  [1.75, 'sub-heading: the tear-off slip, the printed question on a phone'],
  [2, 'section heading and boxed digits, phone'],
  [2.75, 'section heading and boxed digits, laptop'],
  [3.5, 'hero wordmark, phone'],
  [5.25, 'hero wordmark, laptop'],
]);

// The phone mockup in AppShowcase is a picture of the app, not reading matter.
// It is aria-hidden, it runs from 7px to 18px, and its sizes are chosen to keep
// a miniature looking like a screenshot rather than to be read. Forcing it onto
// the page scale would break the illusion and help nobody.
const MOCKUP = new Set([0.4375, 0.5, 0.5625, 0.625, 0.6875, 0.75, 0.8, 1.1]);

const FILES = [
  ['src/features/auth/Welcome.jsx', PAGE],
  ['src/features/auth/AppShowcase.jsx', PAGE, MOCKUP],
];

let checked = 0;
for (const [file, scale, extra] of FILES) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const sizes = [...source.matchAll(/text-\[([0-9.]+)rem\]/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length, `${file}: found no sizes at all, has the file moved?`);

  for (const size of sizes) {
    assert.ok(
      scale.has(size) || extra?.has(size),
      `${file}: ${size}rem (${size * 16}px) is not a step on the scale. ` +
        `Use the nearest of ${[...scale.keys()].join(', ')}, or add a step to landing-type.test.mjs ` +
        `and say what it is for.`,
    );
    checked += 1;
  }
}

const distinct = new Set();
for (const [file] of FILES) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const m of source.matchAll(/text-\[([0-9.]+)rem\]/g)) distinct.add(m[1]);
}

console.log(
  `landing type: ${checked} sizes used, ${distinct.size} distinct, ` +
    `all on the ${PAGE.size}-step scale or in the mockup set, ok`,
);
