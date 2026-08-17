import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Vercel's function filesystem is read-only except /tmp, and /tmp doesn't
// persist across invocations or spread across instances. This fallback is
// only reliable for local dev — attach Vercel KV for real deployments.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'sahay-data')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

let kvClient = null;
async function getKv() {
  if (!kvClient) {
    const { kv } = await import('@vercel/kv');
    kvClient = kv;
  }
  return kvClient;
}

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
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get('sahay:checkins')) || [];
  }
  return readFileDb().checkins;
}

export async function saveCheckins(checkins) {
  if (hasKv) {
    const kv = await getKv();
    await kv.set('sahay:checkins', checkins);
    return;
  }
  const db = readFileDb();
  db.checkins = checkins;
  writeFileDb(db);
}

export async function getResidents() {
  if (hasKv) {
    const kv = await getKv();
    return (await kv.get('sahay:residents')) || [];
  }
  return readFileDb().residents;
}

export async function saveResidents(residents) {
  if (hasKv) {
    const kv = await getKv();
    await kv.set('sahay:residents', residents);
    return;
  }
  const db = readFileDb();
  db.residents = residents;
  writeFileDb(db);
}

export const storageMode = hasKv ? 'vercel-kv' : 'local-file';
