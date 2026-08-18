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
    return { checkins: [], residents: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { checkins: [], residents: [] };
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
