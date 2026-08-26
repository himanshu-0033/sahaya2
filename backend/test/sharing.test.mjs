// Guards the rule that decides who can read a resident's mental-health record.
//
// The failure this exists to prevent: the console shows somebody it should not.
// Before sharing existed, being on the CAREGIVER_EMAILS allowlist meant seeing
// every resident in the deployment — correct for one warden and forty students
// he already knows, wrong for an app anyone can sign up to. The allowlist now
// only opens the door; these functions decide who is in the room.
//
// The cases that matter are the negative ones. A test that only proves sharing
// works would pass just as happily against a function that returned everybody.
import assert from 'node:assert/strict';
import {
  addShare,
  canView,
  normalizeEmail,
  recordsForResidents,
  removeShare,
  sharedWithList,
  visibleResidents,
} from '../lib/sharing.js';

const counsellor = 'meera@example.org';
const stranger = 'someone.else@example.org';

const shared = { id: 'r1', name: 'Asha', sharedWith: [counsellor] };
const unshared = { id: 'r2', name: 'Bilal', sharedWith: [] };
// Written before sharing existed: no field at all.
const legacy = { id: 'r3', name: 'Chandra' };

// ---------------------------------------------------------------- defaults --

// The whole design rests on this: absence of a share is absence of consent,
// not an unset flag to be treated permissively.
assert.equal(canView(unshared, counsellor), false, 'an empty list must not grant access');
assert.equal(canView(legacy, counsellor), false, 'a record with no sharedWith must not grant access');
assert.equal(sharedWithList(legacy).length, 0, 'a missing field reads as an empty list');

// A viewer with no email — an unauthenticated or malformed session — never
// matches, including against a record that happens to hold a blank entry.
assert.equal(canView(shared, ''), false, 'a blank viewer must not match');
assert.equal(canView(shared, null), false, 'a null viewer must not match');
assert.equal(canView(shared, undefined), false, 'an undefined viewer must not match');
assert.equal(canView({ id: 'r4', sharedWith: ['', null] }, ''), false, 'blank entries are dropped, not matched');

// ------------------------------------------------------------------ granted --

assert.equal(canView(shared, counsellor), true, 'an explicit share grants access');
assert.equal(canView(shared, stranger), false, 'a share with one person does not grant it to another');

// Addresses arrive from Google, from a typed form, and from an env var, so
// case and stray whitespace must not decide who can read a record.
assert.equal(canView(shared, '  MEERA@Example.ORG '), true, 'matching is case- and space-insensitive');
assert.equal(normalizeEmail('  A@B.COM '), 'a@b.com');

// ------------------------------------------------------------------- lists ---

const all = [shared, unshared, legacy];
assert.deepEqual(
  visibleResidents(all, counsellor).map((r) => r.id),
  ['r1'],
  'only residents who shared are listed',
);
assert.deepEqual(visibleResidents(all, stranger), [], 'a counsellor nobody shared with sees nobody');
assert.deepEqual(visibleResidents(all, ''), [], 'a blank viewer sees nobody');

// Scoping the resident list is not enough on its own — the overview counts
// check-ins and assessments straight out of their collections, so those have
// to be narrowed to the same people or the totals leak.
const checkins = [
  { residentId: 'r1', date: '2026-08-01' },
  { residentId: 'r2', date: '2026-08-01' },
  { residentId: 'r3', date: '2026-08-01' },
];
assert.deepEqual(
  recordsForResidents(checkins, visibleResidents(all, counsellor)).map((c) => c.residentId),
  ['r1'],
  'records are narrowed to the visible residents',
);
assert.deepEqual(
  recordsForResidents(checkins, visibleResidents(all, stranger)),
  [],
  'no visible residents means no records',
);

// -------------------------------------------------------- add and remove ----

assert.deepEqual(addShare(unshared, counsellor), [counsellor], 'adding a share works');
assert.deepEqual(addShare(legacy, counsellor), [counsellor], 'adding to a record with no field works');
assert.deepEqual(addShare(shared, counsellor), [counsellor], 'adding twice does not duplicate');
assert.deepEqual(addShare(shared, ' MEERA@EXAMPLE.ORG '), [counsellor], 'a differently-cased repeat is the same person');
assert.deepEqual(addShare(unshared, ''), [], 'a blank address is not added');

assert.deepEqual(removeShare(shared, counsellor), [], 'removing revokes access');
assert.deepEqual(removeShare(shared, ' Meera@Example.org '), [], 'revoking is case-insensitive too');
assert.deepEqual(removeShare(shared, stranger), [counsellor], 'removing someone else leaves the share alone');
assert.deepEqual(removeShare(legacy, counsellor), [], 'removing from a record with no field is a no-op');

// addShare/removeShare must not mutate the record they are given — the handler
// writes a new array onto a copy, and a mutation here would edit the in-memory
// store before the write was decided on.
assert.deepEqual(shared.sharedWith, [counsellor], 'the original record is left untouched');

console.log('sharing checks passed — allowlist opens the door, the resident decides who is in the room');
