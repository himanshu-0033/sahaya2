// The store is the one module where a mistake destroys data rather than
// showing a wrong number, so its four operations get exercised for real.
//
// Runs against the local-file backend. VERCEL=1 is set before the module is
// imported, which sends DATA_DIR to the OS temp directory instead of
// backend/.data — so this never touches a developer's own database.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.VERCEL = '1';
delete process.env.STORAGE_URL;
delete process.env.MONGODB_URI;
delete process.env.MONGODB_URL;

const DATA_FILE = path.join(os.tmpdir(), 'sahay-data', 'db.json');
fs.rmSync(path.dirname(DATA_FILE), { recursive: true, force: true });

const { readAll, appendRecord, upsertRecord, removeRecords, storageMode } = await import(
  '../lib/store.js'
);

assert.equal(storageMode, 'local-file', 'test must not run against a real database');

// --- reading nothing ---------------------------------------------------
assert.deepEqual(await readAll('checkins'), [], 'an unknown collection reads as empty');

// --- append ------------------------------------------------------------
await appendRecord('checkins', { id: 'a', residentId: 'r1', date: '2026-09-01' });
await appendRecord('checkins', { id: 'b', residentId: 'r1', date: '2026-09-02' });
await appendRecord('checkins', { id: 'c', residentId: 'r2', date: '2026-09-01' });

let rows = await readAll('checkins');
assert.equal(rows.length, 3, 'three appends leave three records');
assert.deepEqual(rows.map((r) => r.id), ['a', 'b', 'c'], 'append preserves order');

// The bug this layout exists to fix: concurrent appends must not overwrite
// one another. Under the old read-modify-write shape this left one record.
await Promise.all([
  appendRecord('checkins', { id: 'd', residentId: 'r3', date: '2026-09-03' }),
  appendRecord('checkins', { id: 'e', residentId: 'r4', date: '2026-09-03' }),
  appendRecord('checkins', { id: 'f', residentId: 'r5', date: '2026-09-03' }),
]);
rows = await readAll('checkins');
assert.equal(rows.length, 6, 'concurrent appends all survive');
for (const id of ['d', 'e', 'f']) {
  assert.ok(rows.some((r) => r.id === id), `concurrent append ${id} was lost`);
}

// --- upsert ------------------------------------------------------------
await upsertRecord('residents', { id: 'r1' }, { id: 'r1', name: 'Asha', onboarded: true });
assert.equal((await readAll('residents')).length, 1, 'upsert inserts when absent');

await upsertRecord('residents', { id: 'r1' }, { id: 'r1', name: 'Asha K', onboarded: true });
rows = await readAll('residents');
assert.equal(rows.length, 1, 'upsert replaces rather than duplicating');
assert.equal(rows[0].name, 'Asha K', 'upsert wrote the new value');

// A two-key filter is what path progress uses.
await upsertRecord('pathProgress', { residentId: 'r1', pathId: 'p1' }, { residentId: 'r1', pathId: 'p1', completedDays: [1] });
await upsertRecord('pathProgress', { residentId: 'r1', pathId: 'p2' }, { residentId: 'r1', pathId: 'p2', completedDays: [] });
await upsertRecord('pathProgress', { residentId: 'r1', pathId: 'p1' }, { residentId: 'r1', pathId: 'p1', completedDays: [1, 2] });
rows = await readAll('pathProgress');
assert.equal(rows.length, 2, 'a compound filter matches only the intended record');
assert.deepEqual(rows.find((r) => r.pathId === 'p1').completedDays, [1, 2], 'compound upsert updated the right row');

// --- remove ------------------------------------------------------------
await removeRecords('pathProgress', { residentId: 'r1', pathId: 'p1' });
rows = await readAll('pathProgress');
assert.equal(rows.length, 1, 'remove deleted exactly one record');
assert.equal(rows[0].pathId, 'p2', 'remove deleted the right record');

// Removing what is not there is not an error, and removes nothing else.
await removeRecords('pathProgress', { residentId: 'nobody', pathId: 'p9' });
assert.equal((await readAll('pathProgress')).length, 1, 'a filter matching nothing removes nothing');

// --- collections stay separate -----------------------------------------
assert.equal((await readAll('checkins')).length, 6, 'writes to one collection did not touch another');

fs.rmSync(path.dirname(DATA_FILE), { recursive: true, force: true });
console.log('store checks passed — appends survive concurrency, upsert replaces, remove is targeted');
