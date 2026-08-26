// Which questions a form is currently asking, and in what order.
//
// Most instruments here ask everything of everyone, and for those this is a
// long way of saying "0 to items.length". It exists for the ones that branch:
// the C-SSRS only asks about method, intent and plan of someone who said yes
// to having had thoughts of suicide, and the PHQ-9 and GAD-7 only ask their
// difficulty question of someone who reported a problem.
//
// These are a deliberate mirror of gates that also live in
// backend/lib/scoring.js. This copy decides only what goes on screen; the
// backend decides what counts and re-validates all of it, so a disagreement
// between them is a UI bug rather than a hole. backend/test/steps.test.mjs
// asserts the two agree — specifically, that any sheet this file calls
// finished is one the scorer accepts.

export function endorsed(items, answers, index) {
  const answer = answers[index];
  if (answer === null || answer === undefined) return false;
  return answer > Math.min(...items[index].options.map((o) => o.value));
}

// Whether a question is asked at all. The C-SSRS only asks about method,
// intent and plan of someone who said yes to having had thoughts of suicide —
// asking the rest of it regardless would not be thoroughness, it would be not
// listening.
export function isAsked(items, answers, index) {
  const dependsOn = items[index].dependsOn;
  return dependsOn == null || endorsed(items, answers, dependsOn);
}

// Gates on the trailing question: the PHQ-9's "if you checked off any
// problems", and the C-SSRS's narrower "only if you said yes to that one".
export function asksFollowUp(instrument, answers) {
  const followUp = instrument?.followUp;
  if (!followUp) return false;
  const condition = followUp.condition;
  if (!condition) return true;
  if (condition === 'anyEndorsed') {
    return instrument.items.some((_, i) => endorsed(instrument.items, answers, i));
  }
  if (condition.afterItem != null) {
    return endorsed(instrument.items, answers, condition.afterItem);
  }
  return true;
}

// The steps actually on the board right now: every question being asked, then
// the follow-up if the form has decided to ask it. Everything that navigates
// walks this list rather than counting to items.length.
export function stepsFor(instrument, answers) {
  if (!instrument) return [];
  const steps = [];
  instrument.items.forEach((_, i) => {
    if (isAsked(instrument.items, answers, i)) steps.push(i);
  });
  if (asksFollowUp(instrument, answers)) steps.push(instrument.items.length);
  return steps;
}

// Retracting a parent answer takes its dependents with it — otherwise a "yes,
// and here is my plan" could survive being changed back to "no".
export function clearOrphans(instrument, answers) {
  const next = [...answers];
  let changed = true;
  // Loop: clearing one dependent can orphan another that depends on IT.
  while (changed) {
    changed = false;
    instrument.items.forEach((item, i) => {
      if (item.dependsOn != null && next[i] !== null && !isAsked(instrument.items, next, i)) {
        next[i] = null;
        changed = true;
      }
    });
  }
  return next;
}

export function allAnswered(instrument, answers) {
  return instrument.items.every((_, i) => !isAsked(instrument.items, answers, i) || answers[i] !== null);
}
