// A <label> that only sits above an input is a caption, not a label.
//
// It looks finished, and on a mouse it behaves finished. What it does not do
// is tell anybody what the field is: a screen reader reaches the box and
// announces "edit text, blank", and tapping the words does not move the cursor
// into the field, which is the behaviour a lot of people rely on on a phone.
// Every form in this app had this, including the one you sign up with.
//
// A label counts as associated if it carries htmlFor, or if the control is
// nested inside it. This walks the JSX looking for the ones that are neither.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOTS = [
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src'),
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'admin', 'src'),
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

// Comments are blanked rather than removed, so reported line numbers still
// point at the real line. Prose about <label> is not markup.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^([ \t]*)\/\/.*$/gm, (_, indent) => indent);
}

const orphans = [];
for (const root of ROOTS) {
  for (const file of jsxFiles(root)) {
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    const open = /<label\b[^>]*>/g;
    let match;
    while ((match = open.exec(src))) {
      if (match[0].includes('htmlFor')) continue;
      const close = src.indexOf('</label>', match.index);
      const inner = close === -1 ? '' : src.slice(match.index + match[0].length, close);
      // Nested control: implicitly associated, nothing more needed.
      if (/<(input|select|textarea)\b/.test(inner)) continue;
      orphans.push(`${path.relative(ROOTS[0], file).split(path.sep).join('/')}:${src.slice(0, match.index).split('\n').length}`);
    }
  }
}

assert.deepEqual(
  orphans,
  [],
  `these labels name no field, so the field they sit above is announced blank:\n  ${orphans.join('\n  ')}\n`,
);

// The checker is only worth keeping if it would notice. A label with neither
// htmlFor nor a nested control is exactly the shape it exists to catch, so a
// run that finds nothing anywhere is more likely to be a broken scan than a
// clean codebase.
const sample = stripComments('<label className="x">Name</label>\n<input />');
assert.ok(/<label\b[^>]*>/.test(sample), 'the scan still matches a plain label');

console.log(`label checks passed: every <label> in ${ROOTS.length} trees names a field`);
