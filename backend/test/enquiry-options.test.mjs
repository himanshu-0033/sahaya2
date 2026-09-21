// The two dropdowns on the public enquiry form, against the two lists the
// server validates them with.
//
// The form hardcodes its own copy of both. The server rejects anything not on
// its own copy, with "Pick what the enquiry is about." So the day somebody
// renames an option on one side, every submission of that option is refused
// with a validation error about a dropdown the person picked from and could
// not have got wrong. On the one public form in the app whose entire job is
// letting an institution make contact.
//
// contact.test.mjs already does exactly this for emails and phone numbers,
// under the same reasoning: a form and the server must not be able to disagree
// about what a valid answer is.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENQUIRY_TYPES, HEARD_FROM } from '../handlers/enquiries.js';

const FORM = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'frontend', 'src', 'features', 'auth', 'PartnerForm.jsx',
);
const src = fs.readFileSync(FORM, 'utf8');

// Reads a `const NAME = [ '...', '...' ];` literal out of the form.
function arrayLiteral(name) {
  const start = src.indexOf(`const ${name}`);
  assert.notEqual(start, -1, `${name} is gone from PartnerForm; update this check`);
  const open = src.indexOf('[', start);
  const close = src.indexOf('];', open);
  assert.ok(close > open, `could not read ${name} as an array literal`);
  return [...src.slice(open, close).matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

const formTypes = arrayLiteral('TYPES');
const formHeard = arrayLiteral('HEARD_FROM');

assert.ok(formTypes.length > 0, 'the form offers no enquiry types, so the scan is broken');

assert.deepEqual(
  formTypes,
  ENQUIRY_TYPES,
  'the enquiry type dropdown and the list the server accepts have drifted. ' +
    'Every submission of the odd one out is refused with "Pick what the ' +
    'enquiry is about", on a value the person chose from a menu.',
);

assert.deepEqual(
  formHeard,
  HEARD_FROM,
  'the "how did you hear about us" dropdown and the server list have drifted',
);

// The order matters too, not just the membership: the form defaults to
// TYPES[0], so a reorder silently changes what an untouched form submits.
assert.equal(
  formTypes[0],
  ENQUIRY_TYPES[0],
  'the form defaults to its first type, so the two lists must agree on which that is',
);

console.log(
  `enquiry option checks passed: ${formTypes.length} types and ${formHeard.length} sources, form and server agree`,
);
