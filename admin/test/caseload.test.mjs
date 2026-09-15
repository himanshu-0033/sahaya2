// Guards the dashboard's merge of the overview's four lists into one caseload.
//
// The specific failures this exists to prevent: a person who appears in two of
// the source lists showing up as two rows, someone who only appears in a flag
// list being dropped on the floor, and the sort putting an ordinary check-in
// flag above someone who said the thoughts are happening right now.
//
// buildCaseload is pure over plain arrays, so nothing here touches the API.
import assert from 'node:assert/strict';
import { buildCaseload, rank, raisedInChat } from '../src/lib/caseload.js';

const screened = {
  id: 'r1',
  name: 'Asha',
  riskScreen: { recent: true, level: 'acute' },
  lastCheckIn: { date: '2026-09-10', mood: 2 },
  trend: [],
};
const flagged = { id: 'r2', name: 'Bilal', lastCheckIn: { date: '2026-09-11', mood: 2 }, trend: [] };
const quiet = { id: 'r3', name: 'Chen', lastCheckIn: { date: '2026-09-01', mood: 4 }, trend: [] };

const rows = buildCaseload({
  needsAttention: [screened, flagged],
  quietest: [quiet],
  recentRiskScreens: [
    {
      residentId: 'r1',
      residentName: 'Asha',
      instrumentName: 'ASQ',
      level: 'acute',
      date: '2026-09-10',
      reasons: ['Answered yes'],
    },
    // Nobody's row yet — the screen lists reach further back than the capped
    // needsAttention list does.
    {
      residentId: 'r9',
      residentName: 'Dev',
      instrumentName: 'PHQ-9',
      level: 'positive',
      date: '2026-09-08',
      reasons: [],
    },
  ],
  recentFlags: [
    {
      residentId: 'r2',
      residentName: 'Bilal',
      date: '2026-09-11',
      mood: 2,
      words: ['tired', 'flat'],
      flagReasons: ['Mood has stayed low'],
    },
  ],
});

// One row per person, however many lists they turned up in.
assert.equal(rows.length, 4, 'r1, r2, r3 and the screen-only r9');
assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'no duplicate rows');

// The event lists land on the person they belong to, not in a panel of their own.
const asha = rows.find((r) => r.id === 'r1');
assert.equal(asha.events.length, 1);
assert.equal(asha.events[0].kind, 'screen');
assert.equal(asha.events[0].detail, 'ASQ');

const bilal = rows.find((r) => r.id === 'r2');
assert.equal(bilal.events[0].kind, 'checkin');
assert.equal(bilal.events[0].detail, 'Low — tired, flat', 'mood label and words, not raw fields');

// Someone known only from a flag list still gets a row, and is marked so the
// page skips the fields it has no data for.
const dev = rows.find((r) => r.id === 'r9');
assert.equal(dev.sparse, true);
assert.equal(dev.name, 'Dev');
assert.equal(dev.lastCheckIn, undefined, 'sparse rows carry no check-in to read');

// Acute first, then any screen, then check-in flags, then the quiet.
assert.deepEqual(
  rows.map((r) => r.id),
  ['r1', 'r9', 'r2', 'r3'],
);
assert.ok(rank(asha) < rank(bilal), 'a "right now" screen outranks a check-in flag');

// Events on a row read newest first, so the top line is what just happened.
const twice = buildCaseload({
  recentFlags: [
    { residentId: 'r5', residentName: 'Eve', date: '2026-09-02', mood: 1, words: ['a'] },
    { residentId: 'r5', residentName: 'Eve', date: '2026-09-09', mood: 2, words: ['b'] },
  ],
});
assert.equal(twice.length, 1);
assert.deepEqual(
  twice[0].events.map((e) => e.date),
  ['2026-09-09', '2026-09-02'],
);

// A chat topic lands on the student's row as an event, and a student known
// only from a chat still gets a row, ranked below every flag.
const chatted = buildCaseload({
  needsAttention: [flagged],
  recentConcerns: [
    { residentId: 'r2', residentName: 'Bilal', topic: 'family', label: 'Family', date: '2026-09-11' },
    { residentId: 'r7', residentName: 'Fatima', topic: 'placement', label: 'Placements', date: '2026-09-12' },
  ],
});
assert.deepEqual(chatted.map((r) => r.id), ['r2', 'r7'], 'a check-in flag outranks a chat topic');
assert.equal(raisedInChat(chatted[0], 'family'), true);
assert.equal(raisedInChat(chatted[0], 'placement'), false, 'filtered by the topic asked for');
assert.equal(chatted[1].events[0].detail, 'Placements');

// An empty overview must not throw — a console nobody has shared with is the
// normal first state, not a fault.
assert.deepEqual(buildCaseload({}), []);

console.log('caseload: ok');
