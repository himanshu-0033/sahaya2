import assert from 'node:assert';
import {
  TECHNIQUES,
  TECHNIQUE_IDS,
  FAMILIES,
  MOODS,
  getTechnique,
  techniqueDetail,
  catalog,
  runSeconds,
  suggestFor,
} from '../lib/grounding.js';

const familyIds = new Set(FAMILIES.map((f) => f.id));
const STRENGTHS = new Set(['trial', 'mechanism', 'clinical']);

// --- catalog sanity -------------------------------------------------------
assert.ok(TECHNIQUES.length >= 10, `expected 10+ techniques, got ${TECHNIQUES.length}`);
assert.equal(new Set(TECHNIQUE_IDS).size, TECHNIQUES.length, 'unique ids');

for (const t of TECHNIQUES) {
  assert.ok(familyIds.has(t.family), `${t.id} sits in a declared family`);
  assert.ok(t.tagline && t.why, `${t.id} says what it is and why it works`);
  assert.ok(t.bestFor.length > 0, `${t.id} says when to reach for it`);

  // Evidence is mandatory and must be pitched at one of the three declared
  // strengths — the whole point of the ladder is that nothing can quietly
  // arrive without one.
  assert.ok(t.evidence, `${t.id} carries evidence`);
  assert.ok(STRENGTHS.has(t.evidence.strength), `${t.id} declares a known evidence strength`);
  assert.ok(t.evidence.claim && t.evidence.citation, `${t.id} states its claim and source`);
  assert.match(t.evidence.url, /^https:\/\//, `${t.id} links its source over https`);

  // Exactly one of the two shapes, never both, never neither: the runner
  // switches on this and has no third branch.
  assert.notEqual(
    Boolean(t.pacer),
    Boolean(t.steps),
    `${t.id} is either a pacer or a step sequence, not both`,
  );

  if (t.pacer) {
    assert.ok(t.pacer.rounds >= 1, `${t.id} runs at least one round`);
    assert.ok(t.pacer.phases.length >= 2, `${t.id} has phases to move between`);
    const declared = t.pacer.phases.reduce((total, p) => total + p.seconds, 0);
    assert.equal(declared, t.pacer.cycleSeconds, `${t.id} phases add up to its cycle length`);
    for (const phase of t.pacer.phases) {
      assert.ok(phase.seconds > 0, `${t.id} phase "${phase.label}" lasts a real amount of time`);
      assert.ok(
        ['grow', 'hold', 'shrink', 'left', 'right'].includes(phase.action),
        `${t.id} phase "${phase.label}" uses an action the animation knows`,
      );
    }
  } else {
    for (const step of t.steps) {
      assert.ok(step.label && step.prompt, `${t.id} step is labelled and says something`);
      assert.ok(step.seconds > 0, `${t.id} step "${step.label}" lasts a real amount of time`);
    }
  }

  // Every video id is the 11-character YouTube shape and names its channel.
  // These were checked against YouTube's oEmbed endpoint by hand; this only
  // catches typos and half-pasted urls.
  assert.ok(t.videos.length > 0, `${t.id} links at least one guided video`);
  for (const v of t.videos) {
    assert.match(v.id, /^[A-Za-z0-9_-]{11}$/, `${t.id} video id "${v.id}" is a bare YouTube id`);
    assert.ok(v.title && v.channel, `${t.id} video ${v.id} credits its channel`);
  }
}

// A practice nobody can finish is not a practice. Nothing over twelve minutes.
for (const t of TECHNIQUES) {
  const seconds = runSeconds(t);
  assert.ok(seconds >= 60, `${t.id} runs for at least a minute`);
  assert.ok(seconds <= 720, `${t.id} runs no longer than twelve minutes (got ${seconds}s)`);
}

// --- the cautions that matter --------------------------------------------
// Cold water and long breath-holds have real contraindications. If one of
// these ever loses its caution text, that is a safety regression, not a copy
// change — so it is asserted by name rather than left to review.
for (const id of ['temperature', 'box-breathing', '4-7-8-breathing']) {
  assert.ok(getTechnique(id).cautions, `${id} must keep its caution text`);
}
assert.match(getTechnique('temperature').cautions, /heart condition/i);
assert.match(getTechnique('temperature').cautions, /eating disorder/i);

// --- run length is derived, not declared ----------------------------------
const box = getTechnique('box-breathing');
assert.equal(runSeconds(box), box.pacer.cycleSeconds * box.pacer.rounds);
const scan = getTechnique('body-scan');
assert.equal(runSeconds(scan), scan.steps.reduce((total, s) => total + s.seconds, 0));

// 4-7-8 is capped at four rounds on purpose — Weil is explicit about it and
// the app must not quietly extend it to fill a nicer-looking duration.
assert.equal(getTechnique('4-7-8-breathing').pacer.rounds, 4);

// --- catalog vs detail ----------------------------------------------------
const cards = catalog();
assert.equal(cards.length, TECHNIQUES.length);
for (const card of cards) {
  assert.equal(card.seconds, runSeconds(getTechnique(card.id)), `${card.id} card promises the real length`);
  assert.ok(['pacer', 'steps'].includes(card.mode));
}
// The card list is for browsing; it must not ship the scripts or the videos.
// Checked on the keys, not on the word — `mode: 'steps'` is a legitimate value.
for (const card of cards) {
  assert.ok(!('steps' in card), `${card.id} card withholds its step script`);
  assert.ok(!('pacer' in card), `${card.id} card withholds its pacer`);
  assert.ok(!('videos' in card), `${card.id} card withholds its video list`);
  assert.ok(!('why' in card), `${card.id} card withholds the long explainer`);
}

const detail = techniqueDetail(getTechnique('5-4-3-2-1'));
assert.equal(detail.mode, 'steps');
assert.equal(detail.steps.length, 5);
assert.deepEqual(detail.steps.map((s) => s.count), [5, 4, 3, 2, 1], 'the countdown counts down');
assert.equal(detail.pacer, null, 'a step practice reports no pacer');

const sighs = techniqueDetail(getTechnique('cyclic-sighing'));
assert.equal(sighs.mode, 'pacer');
assert.equal(sighs.steps, null, 'a pacer practice reports no steps');
// Exhale must be longer than the combined inhale, or it is not a sigh.
const inhale = sighs.pacer.phases.filter((p) => p.action === 'grow').reduce((n, p) => n + p.seconds, 0);
const exhale = sighs.pacer.phases.filter((p) => p.action === 'shrink').reduce((n, p) => n + p.seconds, 0);
assert.ok(exhale > inhale, 'cyclic sighing weights the exhale');

// --- moods point somewhere real -------------------------------------------
assert.ok(MOODS.length >= 8, 'enough entry points to find yourself in one');
for (const mood of MOODS) {
  assert.ok(mood.techniques.length > 0, `${mood.id} suggests something`);
  for (const id of mood.techniques) {
    assert.ok(TECHNIQUE_IDS.includes(id), `${mood.id} points at a real technique (${id})`);
  }
  assert.equal(suggestFor(mood.id).length, mood.techniques.length);
}
assert.deepEqual(suggestFor('nonsense'), [], 'an unknown mood suggests nothing rather than guessing');

// Panic should lead with something that works in seconds, not a ten-minute
// body scan — the ordering inside a mood is the actual advice.
assert.ok(['fast'].includes(suggestFor('panic')[0].speed), 'panic leads with a fast technique');

// Every technique is reachable from at least one mood, or it is dead weight
// nobody will ever find.
const reachable = new Set(MOODS.flatMap((m) => m.techniques));
for (const id of TECHNIQUE_IDS) {
  assert.ok(reachable.has(id), `${id} is reachable from at least one mood`);
}

assert.equal(getTechnique('does-not-exist'), null);

console.log(
  `grounding checks passed — ${TECHNIQUES.length} techniques, ` +
    `${TECHNIQUES.reduce((n, t) => n + t.videos.length, 0)} videos, ${MOODS.length} moods`,
);
