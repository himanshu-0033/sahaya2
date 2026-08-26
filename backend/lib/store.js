import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const MONGO_URI =
  process.env.STORAGE_URL || process.env.MONGODB_URI || process.env.MONGODB_URL;

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(MONGO_URI).connect();
  }
  return clientPromise;
}

async function getStateCollection() {
  const client = await getClient();
  return client.db('sahay').collection('state');
}

async function readState(id) {
  const col = await getStateCollection();
  const doc = await col.findOne({ _id: id });
  return doc?.data || [];
}

async function writeState(id, data) {
  const col = await getStateCollection();
  await col.updateOne({ _id: id }, { $set: { data } }, { upsert: true });
}

// Vercel's function filesystem is read-only except /tmp, and /tmp doesn't
// persist across invocations or spread across instances. This fallback is
// only reliable for local dev — set STORAGE_URL (MongoDB) for real deployments.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'sahay-data')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function readFileDb() {
  if (!fs.existsSync(DATA_FILE)) {
    return { checkins: [], residents: [], inkblotSessions: [], assessments: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { checkins: [], residents: [], inkblotSessions: [], assessments: [] };
  }
}

function writeFileDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export async function getCheckins() {
  if (MONGO_URI) return readState('checkins');
  return readFileDb().checkins;
}

export async function saveCheckins(checkins) {
  if (MONGO_URI) return writeState('checkins', checkins);
  const db = readFileDb();
  db.checkins = checkins;
  writeFileDb(db);
}

export async function getResidents() {
  if (MONGO_URI) return readState('residents');
  return readFileDb().residents;
}

export async function saveResidents(residents) {
  if (MONGO_URI) return writeState('residents', residents);
  const db = readFileDb();
  db.residents = residents;
  writeFileDb(db);
}

export const storageMode = MONGO_URI ? 'mongodb' : 'local-file';

// Pending phone one-time codes. Short-lived by nature — every record carries
// its own expiry and is pruned on the next write.
export async function getOtps() {
  if (MONGO_URI) return readState('otps');
  return readFileDb().otps || [];
}

export async function saveOtps(otps) {
  if (MONGO_URI) return writeState('otps', otps);
  const db = readFileDb();
  db.otps = otps;
  writeFileDb(db);
}

// Inkblot test sessions. One record per completed sitting, so a resident can
// have several over time and the counsellor console can read them in order.
export async function getInkblotSessions() {
  if (MONGO_URI) return readState('inkblotSessions');
  return readFileDb().inkblotSessions || [];
}

export async function saveInkblotSessions(sessions) {
  if (MONGO_URI) return writeState('inkblotSessions', sessions);
  const db = readFileDb();
  db.inkblotSessions = sessions;
  writeFileDb(db);
}

// Completed questionnaire sittings — one record per instrument per sitting.
export async function getAssessments() {
  if (MONGO_URI) return readState('assessments');
  return readFileDb().assessments || [];
}

export async function saveAssessments(assessments) {
  if (MONGO_URI) return writeState('assessments', assessments);
  const db = readFileDb();
  db.assessments = assessments;
  writeFileDb(db);
}

// Who looked at what.
//
// Append-only, and deliberately separate from everything else: this is the one
// collection nothing in the app is allowed to edit or delete, because a log a
// viewer can rewrite is not a log. The counsellor console writes to it when a
// CSV leaves the building; nothing else writes to it at all.
export async function getExportLog() {
  if (MONGO_URI) return readState('exportLog');
  return readFileDb().exportLog || [];
}

export async function appendExportLog(entry) {
  const existing = await getExportLog();
  // Kept bounded so a busy deployment cannot grow one document without limit.
  // Oldest first, so the tail is the recent history a person would actually
  // look at.
  const next = [...existing, entry].slice(-2000);
  if (MONGO_URI) return writeState('exportLog', next);
  const db = readFileDb();
  db.exportLog = next;
  writeFileDb(db);
}

// Grounding practices a resident has run. Not a score and never treated as
// one — one record per completed (or abandoned) sitting, so the app can show a
// streak and a counsellor can see that someone reached for a tool.
export async function getGroundingSessions() {
  if (MONGO_URI) return readState('groundingSessions');
  return readFileDb().groundingSessions || [];
}

export async function saveGroundingSessions(sessions) {
  if (MONGO_URI) return writeState('groundingSessions', sessions);
  const db = readFileDb();
  db.groundingSessions = sessions;
  writeFileDb(db);
}

// Guided-path progress. One record per resident per path, holding which days
// they have completed — days are stored as a list rather than a count because
// they can be done out of order.
export async function getPathProgress() {
  if (MONGO_URI) return readState('pathProgress');
  return readFileDb().pathProgress || [];
}

export async function savePathProgress(progress) {
  if (MONGO_URI) return writeState('pathProgress', progress);
  const db = readFileDb();
  db.pathProgress = progress;
  writeFileDb(db);
}
