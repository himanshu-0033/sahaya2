// Backfill `sharedWith` on resident records written before sharing existed.
//
// READ THIS BEFORE RUNNING IT.
//
// Every other part of this feature exists to make sure a person decides who
// reads their mental-health record. This script does that FOR them. That is a
// real thing to do to somebody, and it is only defensible where the
// relationship it records already existed in the world — a hostel deployment
// where one named warden was already the counsellor for everyone on the list,
// and where the app is being migrated rather than launched.
//
// It is NOT defensible on a consumer deployment where people signed up alone.
// There, the correct migration is the empty console: ask people to share, and
// let the ones who want to, do it.
//
// So this script:
//   - never runs automatically, from no handler and no deploy hook
//   - does nothing without an explicit --counsellor and --apply
//   - prints the full plan and a diff-shaped summary first
//   - defaults to a dry run, so the natural mistake is the harmless one
//   - never removes an existing share, only adds
//
// Usage:
//   node --env-file=.env.local scripts/backfill-sharing.mjs --counsellor=meera@x.org
//   node --env-file=.env.local scripts/backfill-sharing.mjs --counsellor=meera@x.org --apply
//
// Options:
//   --counsellor=EMAIL   required; the address to grant. Repeatable.
//   --apply              actually write. Without it, nothing is saved.
//   --onboarded-only     skip invited placeholders that never signed in.
//   --before=YYYY-MM-DD  only residents created before this date.

import { getResidents, saveResidents, storageMode } from '../lib/store.js';
import { addShare, normalizeEmail, sharedWithList } from '../lib/sharing.js';

function parseArgs(argv) {
  const counsellors = [];
  let apply = false;
  let onboardedOnly = false;
  let before = null;

  for (const arg of argv) {
    if (arg === '--apply') apply = true;
    else if (arg === '--onboarded-only') onboardedOnly = true;
    else if (arg.startsWith('--counsellor=')) counsellors.push(normalizeEmail(arg.slice(13)));
    else if (arg.startsWith('--before=')) before = arg.slice(9);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return { counsellors: counsellors.filter(Boolean), apply, onboardedOnly, before };
}

function usage(message) {
  console.error(`\n${message}\n`);
  console.error('  node --env-file=.env.local scripts/backfill-sharing.mjs --counsellor=someone@example.org');
  console.error('  add --apply once the printed plan is what you want.\n');
  process.exit(2);
}

const { counsellors, apply, onboardedOnly, before } = parseArgs(process.argv.slice(2));

if (counsellors.length === 0) {
  usage('Nothing to do: pass at least one --counsellor=EMAIL.');
}
for (const email of counsellors) {
  if (!/^\S+@\S+\.\S+$/.test(email)) usage(`Not an email address: ${email}`);
}
if (before && !/^\d{4}-\d{2}-\d{2}$/.test(before)) {
  usage(`--before must be YYYY-MM-DD, got: ${before}`);
}

const residents = await getResidents();

const skipped = [];
const planned = [];

for (const resident of residents) {
  const existing = sharedWithList(resident);
  const label = `${resident.name || '(no name)'} <${resident.email || 'no email'}>`;

  if (onboardedOnly && !resident.onboarded) {
    skipped.push([label, 'invited placeholder, never signed in']);
    continue;
  }
  if (before && (resident.createdAt || '').slice(0, 10) >= before) {
    skipped.push([label, `created on or after ${before}`]);
    continue;
  }

  const toAdd = counsellors.filter((c) => !existing.includes(c));
  if (toAdd.length === 0) {
    skipped.push([label, 'already shared with all of them']);
    continue;
  }
  planned.push({ resident, label, existing, toAdd });
}

console.log(`\nStorage: ${storageMode}`);
console.log(`Residents on file: ${residents.length}`);
console.log(`Granting to: ${counsellors.join(', ')}\n`);

if (planned.length === 0) {
  console.log('Nothing to change.\n');
} else {
  console.log(`Will add a share for ${planned.length} resident${planned.length === 1 ? '' : 's'}:\n`);
  for (const { label, existing, toAdd } of planned) {
    const from = existing.length ? existing.join(', ') : '(nobody)';
    console.log(`  + ${label}`);
    console.log(`      ${from}  ->  ${[...existing, ...toAdd].join(', ')}`);
  }
  console.log('');
}

if (skipped.length > 0) {
  console.log(`Skipping ${skipped.length}:`);
  for (const [label, why] of skipped) console.log(`  - ${label} — ${why}`);
  console.log('');
}

if (!apply) {
  console.log('DRY RUN — nothing was written. Re-run with --apply to make these changes.\n');
  process.exit(0);
}

if (planned.length === 0) process.exit(0);

const plannedIds = new Set(planned.map((p) => p.resident.id));
const updated = residents.map((resident) => {
  if (!plannedIds.has(resident.id)) return resident;
  let sharedWith = sharedWithList(resident);
  for (const email of counsellors) sharedWith = addShare({ sharedWith }, email);
  return { ...resident, sharedWith, updatedAt: new Date().toISOString() };
});

await saveResidents(updated);
console.log(`Done. ${planned.length} resident record${planned.length === 1 ? '' : 's'} updated.`);
console.log('Each of those people can revoke this from their own account page.\n');
