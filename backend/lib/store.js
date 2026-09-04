import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

// One document per record, in a collection per kind.
//
// It used to be one document per KIND, holding every record in an array, and
// every write rewrote the whole array. Two problems, both of which had already
// arrived rather than being hypothetical:
//
//   Lost writes. Two people checking in at the same moment both read the same
//   list, both appended their own record, and both saved. Whichever saved
//   second erased the other's check-in, and the erased one left no trace of
//   having existed.
//
//   A ceiling. MongoDB refuses any document over 16MB. Every check-in the app
//   has ever taken lived in one document, so there was a date after which
//   writes simply began to fail. appendExportLog already carried a hand-rolled
//   2000-entry cap for exactly this reason; nothing else did.
//
// Both are properties of the layout, not of the calling code, which is why the
// fix is here and the handlers barely changed.
const MONGO_URI =
  process.env.STORAGE_URL || process.env.MONGODB_URI || process.env.MONGODB_URL;

const DB_NAME = 'sahay';

// Where the old single-document layout lives. Read to notice records that
// have not moved yet, and written only to mark them as moved.
const LEGACY_COLLECTION = 'state';

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(MONGO_URI).connect().then(async (client) => {
      await ensureIndexes(client);
      return client;
    });
  }
  return clientPromise;
}

// Every record in every collection carries its own `id`, and two records with
// the same id are the same record. Saying so with a unique index buys two
// things that application code cannot.
//
// It settles "one check-in per resident per day", which a check-in's id
// (`${residentId}:${date}`) already encodes, and which was previously enforced
// by reading the list and looking for today — something two simultaneous
// requests can both pass.
//
// And it makes upsert atomic. MongoDB only guarantees that an upsert will not
// insert a second document when a unique index covers the filter; without one,
// two upserts racing on the same key can both insert. The migration below
// upserts by id from however many instances happen to be running, so this is
// the thing standing between a concurrent migration and duplicated history.
//
// Failure is logged, never thrown: a database that already contains duplicates
// must not refuse to start. Runs once per process, on the first connection.
const INDEXED = [
  'checkins',
  'chatSessions',
  'passwordResets',
  'residents',
  'assessments',
  'inkblotSessions',
  'groundingSessions',
  'pathProgress',
  'exportLog',
];

async function ensureIndexes(client) {
  const db = client.db(DB_NAME);
  await Promise.all(
    INDEXED.map(async (name) => {
      try {
        await db.collection(name).createIndex({ id: 1 }, { unique: true });
      } catch (err) {
        console.error(`[store] unique id index on ${name} not created:`, err.message);
      }
    }),
  );
}

async function collection(name) {
  const client = await getClient();
  return client.db(DB_NAME).collection(name);
}

// Vercel's function filesystem is read-only except /tmp, and /tmp doesn't
// persist across invocations or spread across instances. This fallback is
// only reliable for local dev — set STORAGE_URL (MongoDB) for real deployments.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'sahay-data')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function readFileDb() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeFileDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Equality-only match, which is all any caller needs and all the file backend
// can honestly promise. Shared by both backends so they cannot drift.
function matchesFilter(record, filter) {
  return Object.entries(filter).every(([key, value]) => record[key] === value);
}

// Moving a deployment off the old layout.
//
// This used to refuse to serve and tell an operator to run a migration script
// first. That is a defensible thing to ask of a database, and an indefensible
// thing to ask of the people using the app: the deploy and the migration are
// separate events, and everything between them was an outage.
//
// So the records move themselves, the first time a collection that still has
// legacy rows is read. Three properties make that safe to do on live data
// rather than under supervision:
//
//   It is keyed. Every record in every collection carries its own `id`, so
//   each row is upserted at its own identity rather than appended. Two
//   instances doing this at the same moment write the same rows to the same
//   keys and the result is identical either way — there is no interleaving
//   that produces a duplicate.
//
//   It is resumable. A function that dies halfway leaves `data` in place, so
//   the next read picks the whole set up again and the rows already moved are
//   simply rewritten. Completion is recorded by renaming `data`, not by
//   trusting the destination to look finished — a half-filled collection is
//   indistinguishable from a finished one, which is exactly how a partial
//   migration becomes permanent silent data loss.
//
//   It is reversible. The legacy records are renamed, never deleted, so the
//   old documents are still there to rename back. scripts/migrate-store.mjs
//   --drop-legacy removes them once you are satisfied.
const MIGRATION_BATCH = 500;

// Which kinds still hold legacy rows, in one query per process rather than one
// per collection per read.
let pendingPromise = null;

function pendingKinds() {
  if (!pendingPromise) {
    pendingPromise = (async () => {
      const col = await collection(LEGACY_COLLECTION);
      const docs = await col
        .find({ data: { $exists: true, $ne: [] } }, { projection: { _id: 1 } })
        .toArray();
      return new Set(docs.map((d) => d._id));
    })();
    // A failed lookup must not be cached as "nothing pending" — that would
    // serve an empty app. Clear it so the next request tries again, and let
    // this one surface the error.
    pendingPromise.catch(() => {
      pendingPromise = null;
    });
  }
  return pendingPromise;
}

async function migrateLegacy(name) {
  const legacyCol = await collection(LEGACY_COLLECTION);
  const legacy = await legacyCol.findOne({ _id: name });
  const rows = Array.isArray(legacy?.data) ? legacy.data : [];
  if (rows.length === 0) return;

  const col = await collection(name);
  for (let i = 0; i < rows.length; i += MIGRATION_BATCH) {
    await col.bulkWrite(
      rows.slice(i, i + MIGRATION_BATCH).map((record) => ({
        replaceOne: {
          // A row without an id cannot be keyed, so it is matched whole. Only
          // malformed rows reach this, and matching whole is still idempotent.
          filter: record?.id ? { id: record.id } : record,
          replacement: { ...record },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  await legacyCol.updateOne({ _id: name }, { $rename: { data: 'migratedData' } });
  console.log(`[store] migrated ${rows.length} legacy ${name} records`);
}

// --- the four operations every handler needs -------------------------------

export async function readAll(name) {
  if (!MONGO_URI) return readFileDb()[name] || [];

  const pending = await pendingKinds();
  if (pending.has(name)) {
    await migrateLegacy(name);
    pending.delete(name);
  }

  const col = await collection(name);
  // _id is the database's business, never the app's — projected away so
  // records round-trip exactly as they were written.
  return col.find({}, { projection: { _id: 0 } }).toArray();
}

export async function appendRecord(name, record) {
  if (!MONGO_URI) {
    const db = readFileDb();
    db[name] = [...(db[name] || []), record];
    writeFileDb(db);
    return;
  }
  // One insert. Nothing is read first, so there is no window in which two
  // writers can overwrite one another.
  await (await collection(name)).insertOne({ ...record });
}

export async function upsertRecord(name, filter, record) {
  if (!MONGO_URI) {
    const db = readFileDb();
    const rows = db[name] || [];
    const idx = rows.findIndex((r) => matchesFilter(r, filter));
    if (idx === -1) rows.push(record);
    else rows[idx] = record;
    db[name] = rows;
    writeFileDb(db);
    return;
  }
  await (await collection(name)).replaceOne(filter, { ...record }, { upsert: true });
}

export async function removeRecords(name, filter) {
  if (!MONGO_URI) {
    const db = readFileDb();
    db[name] = (db[name] || []).filter((r) => !matchesFilter(r, filter));
    writeFileDb(db);
    return;
  }
  await (await collection(name)).deleteMany(filter);
}

export const storageMode = MONGO_URI ? 'mongodb' : 'local-file';

// --- named readers ---------------------------------------------------------
//
// Thin aliases over readAll. They exist because the call sites read better
// with them, and because the collection name then lives in exactly one place.

export const getCheckins = () => readAll('checkins');
export const getResidents = () => readAll('residents');
export const getInkblotSessions = () => readAll('inkblotSessions');
export const getAssessments = () => readAll('assessments');
export const getGroundingSessions = () => readAll('groundingSessions');
export const getPathProgress = () => readAll('pathProgress');

// Companion transcripts. One document per conversation, bounded by the agent's
// own 24-turn limit, and readable only through the consent gate every other
// record goes through — see handlers/chat-log.js.
export const getChatSessions = () => readAll('chatSessions');

// Who looked at what.
//
// Append-only, and deliberately separate from everything else: this is the one
// collection nothing in the app is allowed to edit or delete, because a log a
// viewer can rewrite is not a log.
//
// The old 2000-entry cap is gone with the layout that forced it. It existed so
// one document could not grow past MongoDB's limit; now that entries are their
// own documents there is no such limit, and silently discarding the oldest
// audit records was never the behaviour anybody wanted from an audit log.
export const getExportLog = () => readAll('exportLog');

export const appendExportLog = (entry) => appendRecord('exportLog', entry);
