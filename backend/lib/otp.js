import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { getOtps, saveOtps } from './store.js';
import { phoneDigits } from './phone.js';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;
const HOUR_MS = 60 * 60 * 1000;

// Codes are never stored in the clear: the database only ever holds a bcrypt
// hash, so a leaked dump can't be replayed into someone's account.
function hashCode(code) {
  return bcrypt.hash(code, 10);
}

// randomInt is drawn from the CSPRNG — Math.random would make codes guessable.
function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

// Records outlive their code by an hour so the send-rate window survives, but
// nothing older than that is worth keeping.
function prune(records, now) {
  return records.filter((r) => now - r.firstSentAt < HOUR_MS);
}

export async function issueCode(phone) {
  const key = phoneDigits(phone);
  if (key.length < 6) {
    return { error: 'That does not look like a valid phone number.' };
  }

  const now = Date.now();
  const records = prune(await getOtps(), now);
  const existing = records.find((r) => r.phone === key);

  if (existing) {
    if (now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return { error: `Wait ${wait}s before asking for another code.` };
    }
    if (existing.sends >= MAX_SENDS_PER_HOUR) {
      return { error: 'Too many codes requested for this number. Try again in an hour.' };
    }
  }

  const code = generateCode();
  const record = {
    phone: key,
    hash: await hashCode(code),
    expiresAt: now + CODE_TTL_MS,
    attempts: 0,
    sends: (existing?.sends || 0) + 1,
    firstSentAt: existing?.firstSentAt || now,
    lastSentAt: now,
  };

  await saveOtps([...records.filter((r) => r.phone !== key), record]);
  return { code, expiresInMs: CODE_TTL_MS };
}

export async function verifyCode(phone, code) {
  const key = phoneDigits(phone);
  const now = Date.now();
  const records = prune(await getOtps(), now);
  const record = records.find((r) => r.phone === key);

  if (!record || now > record.expiresAt) {
    return { ok: false, error: 'That code has expired. Ask for a new one.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many wrong attempts. Ask for a new code.' };
  }

  const matches = await bcrypt.compare(String(code || '').trim(), record.hash);
  if (!matches) {
    // Count the miss before answering, so guessing costs an attempt whether
    // or not the caller comes back.
    await saveOtps([
      ...records.filter((r) => r.phone !== key),
      { ...record, attempts: record.attempts + 1 },
    ]);
    const left = MAX_ATTEMPTS - record.attempts - 1;
    return {
      ok: false,
      error: left > 0 ? `That code is not right. ${left} attempt${left === 1 ? '' : 's'} left.` : 'That code is not right. Ask for a new code.',
    };
  }

  // Single use — the record goes as soon as it works.
  await saveOtps(records.filter((r) => r.phone !== key));
  return { ok: true };
}
