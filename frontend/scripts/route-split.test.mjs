// node scripts/route-split.test.mjs
//
// The routes are code-split, and the way that gets undone is not a decision:
// it is someone adding a screen, importing it at the top of AppRoutes.jsx the
// way the file used to do it, and never seeing a difference locally because
// everything is instant on localhost. The bundle quietly goes back to shipping
// every screen to every visitor.
//
// So: every component used as a route element has to be lazy, unless it is one
// of the three that are deliberately eager because they are where people
// arrive. Adding to that list is allowed and takes one line, which is the
// point — it should be a decision rather than a default.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Landing and Welcome are the two entry points, and signing in goes straight
// from one to the other. NotFound has to work when nothing else did.
const EAGER = new Set(['Landing', 'Welcome', 'NotFound']);

const source = readFileSync(new URL('../src/routes/AppRoutes.jsx', import.meta.url), 'utf8');

const routed = [...source.matchAll(/element=\{<([A-Z]\w*)\s*\/>\}/g)].map((m) => m[1]);
assert.ok(routed.length > 10, 'found almost no routes, has AppRoutes.jsx moved?');

const lazily = new Set(
  [...source.matchAll(/const\s+(\w+)\s*=\s*lazy\(/g)].map((m) => m[1]),
);

for (const name of new Set(routed)) {
  assert.ok(
    EAGER.has(name) || lazily.has(name),
    `${name} is a route element but is imported eagerly, so it ships to every ` +
      `visitor including someone who only opened the landing page. Declare it ` +
      `with lazy(() => import(...)), or add it to EAGER here and say why.`,
  );
}

// The eager list is the whole budget for the first load, so it should be hard
// to grow by accident too.
const eagerRouted = [...new Set(routed)].filter((n) => !lazily.has(n));
assert.ok(
  eagerRouted.length <= EAGER.size,
  `${eagerRouted.length} eager route components, expected at most ${EAGER.size}: ${eagerRouted.join(', ')}`,
);

// Suspense has to actually wrap them, or a lazy route throws on first render
// and the whole app falls through to the error screen.
assert.match(source, /<Suspense\b/, 'AppRoutes.jsx has lazy routes but no <Suspense> around them');

console.log(
  `route split: ${new Set(routed).size} routes, ${lazily.size} lazy, ` +
    `${eagerRouted.length} eager (${eagerRouted.join(', ')}), ok`,
);
