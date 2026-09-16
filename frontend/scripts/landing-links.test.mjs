// node scripts/landing-links.test.mjs
//
// Every path the landing page links to has to lead somewhere a signed-OUT
// visitor can actually read. Two ways that broke, both silently:
//
//   1. The path names an essay or questionnaire dossier that does not exist,
//      so the reader gets "That piece isn't here." A renamed article id does
//      this, and nothing in the build complains.
//   2. The route exists but bounces a visitor with no session back to `/`,
//      which redirects to `/welcome`, the page they clicked from. Nothing
//      appears to happen at all. This is what made the whole footer look dead.
//
// So this test reads the paths out of Welcome.jsx and checks each one against
// the routes that are public, plus the two content indexes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARTICLES } from '../src/features/read/articles.js';
import { TEST_INDEX } from '../src/features/read/testIndex.js';

// Routes AppRoutes.jsx serves without a session. `/caregiver` qualifies: it
// renders its own sign-in rather than redirecting.
const PUBLIC = new Set(['/', '/check', '/welcome', '/read', '/caregiver', '/reset-password']);

const source = readFileSync(new URL('../src/features/auth/Welcome.jsx', import.meta.url), 'utf8');
const paths = [...new Set(source.match(/'\/[^']*'/g).map((s) => s.slice(1, -1)))];
assert.ok(paths.length > 10, 'found almost no paths, did the file move?');

const articles = new Set(ARTICLES.map((a) => a.id));
const tests = new Set(TEST_INDEX.map((t) => t.id));

for (const path of paths) {
  if (path.startsWith('/read/tests/')) {
    assert.ok(tests.has(path.slice(12)), `${path}: no such questionnaire`);
  } else if (path.startsWith('/read/')) {
    assert.ok(articles.has(path.slice(6)), `${path}: no such article`);
  } else {
    assert.ok(PUBLIC.has(path), `${path}: needs a session, so it dead-ends a visitor`);
  }
}

console.log(`landing links: ${paths.length} paths, all public and all with content, ok`);
