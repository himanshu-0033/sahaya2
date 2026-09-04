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

// Where the old single-document layout lives. Read only, and only to notice
// that a deployment has not been migrated yet.
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

// "One check-in per resident per day" was enforced by reading the list and
// looking for today first, which two simultaneous requests can both pass. A
// check-in's id is `${residentId}:${date}`, so a unique index on it states the
// same rule somewhere that concurrency cannot argue with.
//
// Failure here is logged, never thrown: an existing database with duplicates
// would otherwise refuse to start, and a missing index is a weaker guarantee,
// not a broken app. Runs once per process, on the first connection.
async function ensureIndexes(client) {
  try {
    await client.db(DB_NAME).collection('checkins').createIndex({ id: 1 }, { unique: true });
  } catch (err) {
    console.error('[store] unique check-in index not created:', err.message);
  }
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

// An empty collection is ambiguous: either this is a fresh deployment, or it
// is an existing one whose records are still in the old layout. Answering []
// in the second case would show every resident an empty app, and let new
// writes accumulate alongside data that is still sitting there untouched.
//
// So: an empty read checks for legacy data once, and refuses loudly if it
// finds any. A deployment that stops with a clear instruction is recoverable;
// one that quietly serves nothing invites someone to "fix" it by writing over
// the top.
const migrationChecked = new Set();

async function assertMigrated(name) {
  if (migrationChecked.has(name)) return;
  const legacy = await (await collection(LEGACY_COLLECTION)).findOne({ _id: name });
  if (legacy?.data?.length) {
    throw new Error(
      `Storage for "${name}" has not been migrated: ${legacy.data.length} records are still in the ` +
        'old single-document layout. Run `node scripts/migrate-store.mjs --run` against this database ' +
        'before serving traffic.',
    );
  }
  migrationChecked.add(name);
}

// --- the four operations every handler needs -------------------------------

export async function readAll(name) {
  if (!MONGO_URI) return readFileDb()[name] || [];
  const col = await collection(name);
  // _id is the database's business, never the app's — projected away so
  // records round-trip exactly as they were written.
  const rows = await col.find({}, { projection: { _id: 0 } }).toArray();
  if (rows.length === 0) await assertMigrated(name);
  return rows;
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
