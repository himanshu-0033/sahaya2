// Moves a database from the old single-document layout to one document per
// record.
//
// The app no longer needs this run first — lib/store.js moves each collection
// itself the first time it is read, keyed and resumable, so a deploy is not an
// outage waiting for an operator. This script remains for the two jobs that
// are better done deliberately: seeing what is there before anything touches
// it, and clearing the legacy documents away afterwards.
//
//   node scripts/migrate-store.mjs            # dry run — reports, changes nothing
//   node scripts/migrate-store.mjs --run      # performs the migration up front
//   node scripts/migrate-store.mjs --run --drop-legacy   # and removes the old documents
//
// Idempotent: records already present in the new collections are not inserted
// twice, so re-running after an interruption resumes rather than duplicates.
// The legacy documents are left in place unless --drop-legacy is passed, so
// the migration is reversible until you say otherwise.
import { MongoClient } from 'mongodb';

const URI = process.env.STORAGE_URL || process.env.MONGODB_URI || process.env.MONGODB_URL;
const RUN = process.argv.includes('--run');
const DROP_LEGACY = process.argv.includes('--drop-legacy');

const KINDS = [
  'checkins',
  'residents',
  'assessments',
  'inkblotSessions',
  'groundingSessions',
  'pathProgress',
  'exportLog',
];

// Natural identity per kind — what makes two records "the same record".
// Used to skip rows already migrated, so a second run is a no-op.
const IDENTITY = {
  checkins: (r) => ({ id: r.id }),
  residents: (r) => ({ id: r.id }),
  assessments: (r) => ({ id: r.id }),
  inkblotSessions: (r) => ({ id: r.id }),
  groundingSessions: (r) => ({ id: r.id }),
  pathProgress: (r) => ({ residentId: r.residentId, pathId: r.pathId }),
  exportLog: (r) => ({ at: r.at, residentId: r.residentId, by: r.by }),
};

if (!URI) {
  console.error('No database configured. Set STORAGE_URL or MONGODB_URI and try again.');
  process.exit(1);
}

const client = await new MongoClient(URI).connect();
const db = client.db('sahay');

console.log(RUN ? 'MIGRATING' : 'DRY RUN — nothing will be written. Add --run to perform it.');
console.log('');

let totalToMove = 0;
let totalMoved = 0;
let totalSkipped = 0;

for (const kind of KINDS) {
  const legacy = await db.collection('state').findOne({ _id: kind });
  const records = Array.isArray(legacy?.data) ? legacy.data : [];
  const alreadyThere = await db.collection(kind).countDocuments();

  if (records.length === 0) {
    // `migratedData` is what the app renames `data` to once it has moved a
    // collection itself, so this distinguishes "never had anything" from
    // "already done" rather than reporting both as nothing.
    const done = Array.isArray(legacy?.migratedData) ? legacy.migratedData.length : 0;
    const note = done ? `already migrated (${done} legacy rows retained)` : 'nothing to move';
    console.log(`${kind.padEnd(18)} legacy: 0        new: ${alreadyThere} — ${note}`);
    continue;
  }

  totalToMove += records.length;

  let moved = 0;
  let skipped = 0;

  for (const record of records) {
    const identity = IDENTITY[kind](record);
    // A record with no usable identity cannot be checked for duplicates, so it
    // is matched on the whole document instead. Slower, and only ever hit by
    // malformed rows.
    const filter = Object.values(identity).every((v) => v !== undefined && v !== null)
      ? identity
      : record;

    const exists = await db.collection(kind).findOne(filter, { projection: { _id: 1 } });
    if (exists) {
      skipped += 1;
      continue;
    }
    if (RUN) await db.collection(kind).insertOne({ ...record });
    moved += 1;
  }

  totalMoved += moved;
  totalSkipped += skipped;
  console.log(
    `${kind.padEnd(18)} legacy: ${String(records.length).padEnd(8)} new: ${alreadyThere} — ` +
      `${RUN ? 'moved' : 'would move'} ${moved}, already present ${skipped}`,
  );
}

// A resident may only check in once per day. That rule lived in application
// code that read the list first, so two simultaneous requests could both pass
// it. The database can enforce it properly now that check-ins are documents.
if (RUN) {
  console.log('');
  try {
    await db.collection('checkins').createIndex({ id: 1 }, { unique: true });
    console.log('index          checkins(id) unique — created');
  } catch (err) {
    console.log(`index          checkins(id) unique — NOT created: ${err.message}`);
    console.log('               (duplicates exist; resolve them, then re-run to add the index)');
  }
}

if (RUN && DROP_LEGACY) {
  for (const kind of KINDS) await db.collection('state').deleteOne({ _id: kind });
  console.log('legacy         state documents removed');
} else if (RUN) {
  console.log('legacy         state documents LEFT IN PLACE — re-run with --drop-legacy once verified');
}

console.log('');
console.log(
  RUN
    ? `Done. Moved ${totalMoved}, skipped ${totalSkipped} already present, of ${totalToMove} legacy records.`
    : `Would move ${totalMoved} of ${totalToMove} legacy records (${totalSkipped} already present). Re-run with --run.`,
);

await client.close();
