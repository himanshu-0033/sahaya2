// Every route needs a name in RouteChrome's table.
//
// A route that is missing falls through pageName() to its default, and the
// default is "Page not found". Nothing breaks. The page renders, the app
// works, and it quietly tells everybody it is broken: the browser tab reads
// "Page not found", so does the history entry and the phone's tab switcher,
// and the sr-only marker announces "Page not found" to a screen reader on
// arrival.
//
// Five routes were in that state, including the two at the top of the funnel:
// /welcome, where every new person lands, and /check, where the landing page's
// hero sends them. This is the kind of thing that survives a long time because
// it never throws.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const routes = [...read('routes/AppRoutes.jsx').matchAll(/path="([^"]+)"/g)]
  .map((m) => m[1])
  // The catch-all is what "Page not found" is actually for.
  .filter((p) => p !== '*');

const chrome = read('layouts/RouteChrome.jsx');
const titled = [...chrome.matchAll(/\['([^']+)',\s*'([^']*)'\]/g)].map((m) => ({
  pattern: m[1],
  name: m[2],
}));
const patterns = titled.map((t) => t.pattern);

assert.ok(routes.length > 10, 'the scan found almost no routes, so it is not scanning anything');

const untitled = routes.filter((r) => !patterns.includes(r));
assert.deepEqual(
  untitled,
  [],
  'these routes have no name in RouteChrome, so their tab and their screen ' +
    `reader announcement both say "Page not found":\n  ${untitled.join('\n  ')}\n`,
);

// A name that is itself the fallback would pass the check above and still be
// wrong on the screen.
for (const { pattern, name } of titled) {
  assert.notEqual(name, 'Page not found', `${pattern} is named after the fallback`);
  assert.ok(name.trim().length > 0, `${pattern} has an empty name`);
}

// Order matters: matchPath takes the first hit, so a pattern that would
// swallow a more specific one has to come after it. /read/:articleId before
// /read/tests/:instrumentId would eat the second.
const indexOf = (p) => patterns.indexOf(p);
if (indexOf('/read/:articleId') !== -1 && indexOf('/read/tests/:instrumentId') !== -1) {
  assert.ok(
    indexOf('/read/tests/:instrumentId') < indexOf('/read/:articleId'),
    '/read/tests/:instrumentId must be listed before /read/:articleId or it is never matched',
  );
}

console.log(`route title checks passed: ${routes.length} routes, all named`);
