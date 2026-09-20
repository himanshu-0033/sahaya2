// useSession can now return null while a page is already on screen.
//
// It could not before: it read the session once on mount and held it, so a
// page that reached straight into session.profile was safe by accident. Then
// a 401 started clearing the session and telling every mounted page about it,
// because a Google ID token lasts an hour and this is an app people leave
// open. That fixed a student being stuck on "jwt expired" forever, and it put
// a new obligation on every page: signed in can become signed out under you.
//
// So a page that uses useSession has to either guard on null before touching
// the session, or only ever use it in a way null survives. This finds the
// ones that do neither, because the failure is a white screen on a page
// somebody opened an hour ago.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function jsxFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsxFiles(full, out);
    else if (entry.name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

// Reaching into the session without optional chaining. `session?.profile` is
// fine, `Boolean(session)` is fine, `session.profile` is only fine behind a
// guard that has already returned.
const UNSAFE = /(?<!\?)\bsession\.(profile|idToken)\b/;
// Any of these means the file has already dealt with the null case.
const GUARD = /if \(!session\)|!session\s*\)|session\s*\?\s*\.|\bsession\s*&&/;

const users = [];
const unsafe = [];

for (const file of jsxFiles(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('useSession()')) continue;
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  users.push(rel);

  const lines = src.split('\n');
  const guardLine = lines.findIndex((l) => /if \(!session\)/.test(l));
  lines.forEach((line, i) => {
    if (!UNSAFE.test(line)) return;
    // Behind an early return that has already run: safe.
    if (guardLine !== -1 && i > guardLine) return;
    if (GUARD.test(line)) return;
    unsafe.push(`${rel}:${i + 1}  ${line.trim().slice(0, 80)}`);
  });
}

assert.ok(users.length > 0, 'the scan found no useSession pages, so it is not scanning anything');

assert.deepEqual(
  unsafe,
  [],
  'these read the session without guarding on null, and useSession can now ' +
    `return null on a page that is already open:\n  ${unsafe.join('\n  ')}\n`,
);

// The wiring itself, in one line each. If either goes, the 401 fix is gone
// and nothing else in this suite would notice.
const api = fs.readFileSync(path.join(SRC, 'shared', 'api.js'), 'utf8');
assert.ok(
  /status === 401/.test(api) && /clearSession\(\)/.test(api),
  'api.js must drop the session on a 401, or an expired tab is stuck forever',
);
const hook = fs.readFileSync(path.join(SRC, 'features', 'auth', 'useSession.js'), 'utf8');
assert.ok(
  /SIGNED_OUT_EVENT/.test(hook) && /addEventListener/.test(hook),
  'useSession must listen for the signed-out event, or pages never hear about it',
);

console.log(`session guard checks passed: ${users.length} pages use useSession, all null-safe`);
