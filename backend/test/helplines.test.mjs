// The helpline numbers, pinned.
//
// rules.md 1.1 says a number appears in six places and changing one means
// changing all six. That was a sentence in a document, which is a thing people
// read once. This is the executable version of it.
//
// It exists because these have now been wrong twice in this repo, both times
// in the direction that matters:
//
//   iCall's hours were listed as 8am to 10pm, were "corrected" to 10am to 8pm,
//   and the truth is 8am to 9pm. Both versions closed the line two hours early
//   in the morning, which is a person ringing at nine and being told by this
//   app not to bother.
//
//   AASRA was listed as 9820466726 for months. That number appears nowhere on
//   aasra.info. Their published line is 022-27546669.
//
// So: numbers live here, retired ones can never come back, and the two safety
// modules have to agree. Last verified against the organisations' own sites on
// 2026-09-20.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELPLINES_BY_CATEGORY } from '../lib/safety.js';
import { HELPLINES as AGENT_HELPLINES } from '../../agent/lib/safety.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readRaw = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Comments are stripped before the retired numbers are looked for, because the
// right place to record that KIRAN merged into Tele-MANAS is a comment saying
// so, next to its old number. Naming a dead number in prose is how it stays
// dead; the test is about what gets shown to somebody.
const read = (rel) =>
  readRaw(rel)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^[ 	]*\/\/.*$/gm, '');

// Every number this app is allowed to show, and where it came from.
const APPROVED = new Map([
  ['112', 'Emergency, universal'],
  ['14416', 'Tele-MANAS short code, telemanas.mohfw.gov.in'],
  ['1-800-891-4416', 'Tele-MANAS toll-free, same digits as 1800-89-14416'],
  ['+91 9999 666 555', 'Vandrevala, vandrevalafoundation.com/free-counseling'],
  ['022-27546669', 'AASRA, aasra.info'],
  ['022-25521111', 'iCall landline, the line icallhelpline.org shows available'],
  ['9152987821', 'iCall mobile, same site, status reads NOT AVAILABLE NOW'],
  ['181', 'Women Helpline'],
  ['7827170170', 'NCW, also 14490'],
  ['1098', 'Childline, under 18'],
]);

// Numbers that were here and must never come back. Each one was live in this
// repo at some point, which is exactly why a list of them is worth keeping.
const RETIRED = new Map([
  ['1800-599-0019', 'KIRAN, merged into Tele-MANAS'],
  ['1860-2662-345', 'Vandrevala, retired'],
  ['1860-266-2345', 'Vandrevala, retired, still returned by search engines'],
  ['9820466726', 'AASRA, not published by AASRA'],
  ['98204 66726', 'AASRA, spaced form of the same wrong number'],
]);

// The wording that sent people to a closed line. Both are wrong in the
// morning, which is when somebody who has been awake all night rings.
const RETIRED_HOURS = ['10am to 8pm', '8am to 10pm', '10am to 8 pm'];

// Every file that puts a crisis number in front of somebody.
const SURFACES = [
  'backend/lib/safety.js',
  'agent/lib/safety.js',
  'agent/lib/persona.js',
  'frontend/src/shared/CrisisContacts.jsx',
  'frontend/src/shared/ErrorBoundary.jsx',
  'frontend/src/features/auth/Welcome.jsx',
  'frontend/index.html',
];

// --- nothing retired appears anywhere --------------------------------------
for (const rel of SURFACES) {
  const src = read(rel);
  for (const [number, why] of RETIRED) {
    assert.ok(
      !src.includes(number),
      `${rel} still carries ${number} (${why}). A retired number on a crisis screen is a dead line.`,
    );
  }
  for (const hours of RETIRED_HOURS) {
    assert.ok(
      !src.includes(hours),
      `${rel} still says iCall answers "${hours}". It is 8am to 9pm, Mon to Sat.`,
    );
  }
}

// --- the two safety modules carry the same table ---------------------------
// The agent's HELPLINES is the whole category map; the backend calls that one
// HELPLINES_BY_CATEGORY and keeps HELPLINES as a shorthand for the suicide
// list. Different names, same table, and it is the table that has to match.
assert.deepEqual(
  HELPLINES_BY_CATEGORY,
  AGENT_HELPLINES,
  'backend and agent must offer the same numbers, or the chat and the app disagree',
);

// --- and every number in that table is one we checked -----------------------
for (const [category, lines] of Object.entries(HELPLINES_BY_CATEGORY)) {
  assert.ok(lines.length > 0, `${category} must offer at least one number`);
  for (const line of lines) {
    assert.ok(
      APPROVED.has(line.number),
      `${category} offers ${line.number}, which is not in the verified list. ` +
        'Check it against the organisation\'s own site, then add it here with the source.',
    );
    assert.ok(line.name && line.name.length > 0, `${line.number} needs a name beside it`);
  }
}

// --- the two that must always be reachable ---------------------------------
// Whatever else changes, a person in danger gets the emergency number and the
// national line. These are asserted by hand because losing either in a
// refactor would be silent.
const suicide = HELPLINES_BY_CATEGORY.suicide.map((l) => l.number);
assert.ok(suicide.includes('14416'), 'Tele-MANAS must be on the suicide list');

for (const rel of ['frontend/src/shared/CrisisContacts.jsx', 'frontend/src/shared/ErrorBoundary.jsx', 'frontend/index.html']) {
  const src = readRaw(rel);
  assert.ok(src.includes('112'), `${rel} must offer the emergency number`);
  assert.ok(src.includes('14416'), `${rel} must offer Tele-MANAS`);
}

// --- abuse gets different numbers from a suicide line ----------------------
// A student being hit at home does not need a suicide helpline, and this was a
// deliberate decision rather than an accident of the data.
const abuse = (HELPLINES_BY_CATEGORY.abuse || []).map((l) => l.number);
assert.ok(abuse.includes('181') || abuse.includes('1098'), 'abuse must route to its own lines');

console.log(
  `helpline checks passed: ${APPROVED.size} verified numbers, ${RETIRED.size} retired ones kept out, ${SURFACES.length} surfaces agree`,
);
