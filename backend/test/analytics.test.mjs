// Guards the counsellor console's idea of who needs attention.
//
// The specific failure this exists to prevent: a resident answers yes to a
// suicide-screening question, the record is stored correctly with its flag,
// and the console's summary — the badge, the sort order, the dashboard count
// — does not move, because it was computed from check-ins alone. The data
// being right is not the same as anyone being shown it.
//
// These functions are pure over plain arrays, so nothing here touches storage.
import assert from 'node:assert/strict';
import { summarizeResident, summarizeResidents, buildOverview } from '../lib/analytics.js';

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const day = (daysAgo) => iso(daysAgo).slice(0, 10);

const resident = { id: 'r1', name: 'Asha', onboarded: true, createdAt: iso(60) };
const other = { id: 'r2', name: 'Bilal', onboarded: true, createdAt: iso(60) };

const screen = (overrides = {}) => ({
  id: 'a1',
  residentId: 'r1',
  instrumentId: 'asq',
  instrumentName: 'ASQ',
  domain: 'Safety',
  date: day(1),
  score: 1,
  maxScore: 4,
  band: { label: 'Positive screen' },
  flagged: true,
  flagReasons: ['Answered "Yes" to: In the past week, have you been having thoughts about killing yourself?'],
  riskLevel: 'positive',
  createdAt: iso(1),
  ...overrides,
});

// -------------------------------------------------- a screen alone is enough
// No check-ins at all. The console must still say this person needs someone.
const bare = summarizeResident(resident, [], { assessments: [screen()] });
assert.equal(bare.riskScreen.level, 'positive');
assert.equal(bare.riskScreen.recent, true);
assert.equal(bare.flaggedRecently, true, 'a positive screen alone means "needs a conversation"');
assert.equal(bare.checkinFlaggedRecently, false, 'and is still distinguishable from a check-in flag');
assert.equal(bare.riskScreen.instrumentName, 'ASQ');
assert.deepEqual(bare.riskScreen.reasons, screen().flagReasons, 'the counsellor sees which question');

// No assessments at all must not invent one, and must not throw.
const none = summarizeResident(resident, [], {});
assert.equal(none.riskScreen, null);
assert.equal(none.flaggedRecently, false);
assert.equal(none.lastAssessment, null);
assert.equal(none.assessmentCount, 0);

// An unflagged sitting is history, not a risk.
const calm = summarizeResident(resident, [], {
  assessments: [screen({ flagged: false, flagReasons: [], riskLevel: null, band: { label: 'No screen triggered' }, score: 0 })],
});
assert.equal(calm.riskScreen, null);
assert.equal(calm.flaggedRecently, false);
assert.equal(calm.lastAssessment.band.label, 'No screen triggered', 'still shown as their latest result');

// ------------------------------------------------------------ acute beats new
// Someone who said "right now" three days ago outranks a milder screen from
// yesterday. Sorting by date alone would bury the one that cannot wait.
const acuteThenPositive = summarizeResident(resident, [], {
  assessments: [
    screen({ id: 'a2', date: day(0), createdAt: iso(0) }),
    screen({ id: 'a3', date: day(3), createdAt: iso(3), riskLevel: 'acute', flagReasons: ['Answered "Yes" to: Are you having thoughts of killing yourself right now?'] }),
  ],
});
assert.equal(acuteThenPositive.riskScreen.level, 'acute', 'acute is never hidden behind a newer positive');
assert.equal(acuteThenPositive.riskScreen.totalFlagged, 2);

// --------------------------------------------------------------- the window
// Old screens stay visible on the record but stop driving the badge.
const stale = summarizeResident(resident, [], {
  assessments: [screen({ date: day(40), createdAt: iso(40) })],
});
assert.equal(stale.riskScreen.recent, false, '40 days is outside the window');
assert.equal(stale.flaggedRecently, false, 'and no longer claims they need a conversation today');
assert.ok(stale.riskScreen, 'but the screen is still on the record');

// Check-in flags keep working on their own, untouched by any of this.
const checkinFlagged = summarizeResident(resident, [
  { residentId: 'r1', date: day(1), moodScore: 1, flagged: true, flagReasons: ['crisis language'] },
], {});
assert.equal(checkinFlagged.flaggedRecently, true);
assert.equal(checkinFlagged.checkinFlaggedRecently, true);
assert.equal(checkinFlagged.riskScreen, null);

// The counsellor's list shows WHY, not just that. These reasons already
// existed on the check-in record and reached the CSV and the detail page; the
// summary is what the triage list reads from, so they have to survive to here.
assert.deepEqual(checkinFlagged.checkinFlagReasons, ['crisis language'], 'the reason reaches the row');

// The same rule firing three days running is one thing to know, not three.
const repeated = summarizeResident(resident, [
  { residentId: 'r1', date: day(3), moodScore: 1, flagged: true, flagReasons: ['Mood has stayed low'] },
  { residentId: 'r1', date: day(2), moodScore: 1, flagged: true, flagReasons: ['Mood has stayed low'] },
  { residentId: 'r1', date: day(1), moodScore: 1, flagged: true, flagReasons: ['Mood has stayed low', 'Words lean heavy'] },
], {});
assert.deepEqual(
  repeated.checkinFlagReasons,
  ['Mood has stayed low', 'Words lean heavy'],
  'repeated reasons are de-duplicated, distinct ones are kept',
);

// An unflagged resident carries no reasons rather than undefined — the row
// maps over this directly.
assert.deepEqual(summarizeResident(resident, [], {}).checkinFlagReasons, []);

// ------------------------------------------------------------- triage order
const rows = summarizeResidents([other, resident], [], {
  assessments: [screen({ riskLevel: 'acute' }), screen({ id: 'a4', residentId: 'r2', riskLevel: 'positive' })],
});
assert.deepEqual(rows.map((r) => r.name), ['Asha', 'Bilal'], 'acute sorts above positive');

// --------------------------------------------------------------- the cohort
const overview = buildOverview([resident, other], [], {
  assessments: [screen({ riskLevel: 'acute' }), screen({ id: 'a5', residentId: 'r2' })],
});
assert.equal(overview.totals.atRisk, 2);
assert.equal(overview.totals.acuteRisk, 1);
assert.equal(overview.totals.assessmentsTaken, 2);
assert.equal(overview.totals.flaggedResidents, 2, 'both count as needing a conversation');
assert.equal(overview.recentRiskScreens.length, 2);
assert.deepEqual(
  overview.recentRiskScreens.map((s) => s.residentName).sort(),
  ['Asha', 'Bilal'],
  'the dashboard names them rather than showing a bare count',
);
assert.equal(overview.needsAttention.length, 2);

// An overview with no assessments at all must still build — the parameter is
// optional and every older caller omits it.
const quiet = buildOverview([resident], []);
assert.equal(quiet.totals.atRisk, 0);
assert.equal(quiet.totals.acuteRisk, 0);
assert.deepEqual(quiet.recentRiskScreens, []);

console.log('analytics checks passed — risk screens reach the counsellor console');
