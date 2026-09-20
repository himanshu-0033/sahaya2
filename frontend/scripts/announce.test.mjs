// An error nobody is told about.
//
// A form fails, React swaps a paragraph in, and on screen that is obvious.
// To a screen reader it is nothing: the page changed somewhere the cursor is
// not, so the person hears silence and is left to work out that the button
// stopped saying "Saving". Thirty messages across the two apps did this,
// including the one on the sign-in form.
//
// A message that appears in response to something the user did needs a live
// region. `alert` interrupts, which is right for a failure. `status` waits for
// a pause, which is right for "Saved" and rude to skip.
//
// This finds a conditional render of an error-ish name whose element carries
// neither, so a new one cannot quietly land without its announcement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.join(HERE, '..', 'src'),
  path.join(HERE, '..', '..', 'admin', 'src'),
];

function jsxFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') jsxFiles(full, out);
    } else if (entry.name.endsWith('.jsx')) {
      out.push(full);
    }
  }
  return out;
}

// Components that carry their own live region, so a call site rendering one
// needs nothing further. Kept as a list rather than guessed at, because the
// whole point is to notice when something is announced by nobody.
const ANNOUNCING = ['LoadError', 'Note', 'ErrorBoundary'];

const COND = /\{(\w*[eE]rror\w*|note|formError|staffError|requestNote)\s*&&/;

const silent = [];
for (const root of ROOTS) {
  for (const file of jsxFiles(root)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!COND.test(line)) return;
      // The element and anything it delegates to live within a few lines.
      const window = lines.slice(i, i + 7).join('\n');
      if (/role="alert"|role="status"|role=\{/.test(window)) return;
      if (/aria-live/.test(window)) return;
      if (ANNOUNCING.some((c) => window.includes('<' + c))) return;
      silent.push(
        `${path.relative(ROOTS[0], file).split(path.sep).join('/')}:${i + 1}`,
      );
    });
  }
}

assert.deepEqual(
  silent,
  [],
  'these messages appear without being announced, so a screen reader hears ' +
    `nothing happen:\n  ${silent.join('\n  ')}\n`,
);

console.log(`announce checks passed: every conditional message reaches a live region`);
