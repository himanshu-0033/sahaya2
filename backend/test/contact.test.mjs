// One table of email and phone cases, run through the backend's rules and the
// frontend's copy of them, so a form and the server can never disagree about
// what is a real number or address.
import assert from 'node:assert/strict';
import * as server from '../lib/contact.js';
import * as form from '../../frontend/src/shared/contact.js';
import * as consoleForm from '../../admin/src/lib/contact.js';

const EMAILS = [
  ['himanshumalik0033@gmail.com', true],
  ['a.b+c@mail.co.in', true],
  ['First.Last@College.edu', true],
  ['name@college', false],
  ['name@@mail.com', false],
  ['name@mail..com', false],
  ['name mail@x.com', false],
  ['@mail.com', false],
  ['name@mail.c', false],
  ['', false],
];

const PHONES = [
  ['9876543210', true],
  ['09876543210', true],
  ['+91 98765 43210', true],
  ['+91-98765-43210', true],
  ['+1 415 555 2671', true],
  ['+971 50 123 4567', true],
  ['5876543210', false, 'an Indian mobile starts with 6 to 9'],
  ['98765', false, 'too short'],
  ['+91 98765 4321', false, 'nine digits after +91'],
  ['98765abcde', false, 'letters'],
  ['+44 12', false, 'too short for any country'],
  ['', false],
];

for (const impl of [server, form, consoleForm]) {
  for (const [value, ok] of EMAILS) assert.equal(impl.isValidEmail(value), ok, `email "${value}"`);
  for (const [value, ok, why = ''] of PHONES) assert.equal(impl.isValidPhone(value), ok, `phone "${value}" ${why}`);
}

console.log(`contact checks passed: ${EMAILS.length} emails and ${PHONES.length} phones, backend and forms agree`);
