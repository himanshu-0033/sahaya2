// Scoring for the instruments in instruments.js.
//
// Deliberately dumb: sum the items, apply the instrument's published
// transform, look the total up in its published bands. No modelling, no
// inference, nothing that would turn a questionnaire into a claim about a
// person. Everything here can be checked by hand against the source paper.
import { resolveItems, resolveFollowUp, followUpDef } from './instruments.js';

function bounds(options) {
  const values = options.map((o) => o.value);
  return { min: Math.min(...values), max: Math.max(...values) };
}

// Reverse-keyed items flip within their own scale's range, so a 0–4 item and
// a 1–7 item both invert correctly.
function itemScore(item, value) {
  if (!item.reverse) return value;
  const { min, max } = bounds(item.options);
  return max + min - value;
}

function applyTransform(sum, itemCount, transform) {
  switch (transform) {
    case 'mean':
      return Math.round((sum / itemCount) * 100) / 100;
    case 'x4':
      return sum * 4;
    case 'x25':
      return Math.round((sum / itemCount) * 25 * 100) / 100;
    default:
      return sum;
  }
}

function maxScore(items, transform) {
  const sum = items.reduce((total, item) => total + bounds(item.options).max, 0);
  return applyTransform(sum, items.length, transform);
}

// Whether an item is asked at all. The C-SSRS only asks about method, intent
// and plan of someone who has said yes to having thoughts of suicide; the
// rest of the battery asks everything of everyone.
function isAsked(item, items, answers) {
  if (item.dependsOn == null) return true;
  const parent = items[item.dependsOn];
  return answers[item.dependsOn] > bounds(parent.options).min;
}

// Does one `when` clause hold? A clause matches if ANY of its items was
// endorsed, and — where it names one — the follow-up reached its value.
function clauseHolds(clause, items, answers, followUpValue) {
  const endorsed = (clause.items || []).some(
    (i) => isAsked(items[i], items, answers) && answers[i] > bounds(items[i].options).min,
  );
  if ((clause.items || []).length > 0 && !endorsed) return false;
  if (clause.followUp != null && !(followUpValue >= clause.followUp)) return false;
  return true;
}

// Two ways to land in a band.
//
// The usual one is a threshold on the total, and it is what almost every
// instrument here uses. The other is a set of rules, because some scales do
// not rank by sum at all: on the C-SSRS, yes to Q1 and Q2 is low risk while
// yes to Q5 alone is high, and no arrangement of thresholds expresses that.
// Rule-based bands are listed mildest first, like every other band table, and
// matched in reverse so the most severe rule that holds is the one that wins.
function bandFor(instrument, score, items, answers, followUpValue) {
  const ruled = instrument.bands.some((b) => b.when);
  if (!ruled) {
    const index = instrument.bands.findIndex((b) => score <= b.max);
    return index === -1 ? instrument.bands.length - 1 : index;
  }

  for (let i = instrument.bands.length - 1; i >= 0; i -= 1) {
    const clauses = instrument.bands[i].when;
    if (clauses.length === 0) return i; // the catch-all
    if (clauses.some((c) => clauseHolds(c, items, answers, followUpValue))) return i;
  }
  return 0;
}

// Some instruments publish sub-scores as well as a total — the MSPSS splits
// perceived support into significant other, family and friends. Where the
// instrument declares them, each is scored the same way the total is, so a
// low total can be traced to which source of support is actually thin.
function subscaleScores(instrument, items, answers) {
  if (!instrument.subscales) return null;
  return instrument.subscales.map((sub) => {
    const sum = sub.items.reduce((total, i) => total + itemScore(items[i], answers[i]), 0);
    return {
      label: sub.label,
      score: applyTransform(sum, sub.items.length, instrument.transform),
      maxScore: maxScore(sub.items.map((i) => items[i]), instrument.transform),
    };
  });
}

// "Checked off a problem" means answering above the floor of that item's own
// option set, which is what the PHQ-9 sheet means by a tick in any column
// other than "Not at all".
function anyEndorsed(items, answers) {
  return items.some((item, index) => answers[index] > bounds(item.options).min);
}

// Two gates a form can put on its trailing question: the PHQ-9's "if you
// checked off any problems", and the C-SSRS's narrower "only if you said yes
// to that specific one".
function conditionMet(condition, items, answers) {
  if (!condition) return true;
  if (condition === 'anyEndorsed') return anyEndorsed(items, answers);
  if (condition.afterItem != null) {
    const i = condition.afterItem;
    return answers[i] > bounds(items[i].options).min;
  }
  return true;
}

// The unscored trailing question. It is validated like an item and then kept
// entirely out of the arithmetic — no sum, no band, no transform.
//
// Leaving it unanswered is legitimate: the PHQ-9 only asks it of someone who
// endorsed something, so an answer that arrives when the condition is not met
// is dropped rather than rejected — the form would not have asked.
function resolveFollowUpAnswer(instrument, items, answers, value) {
  const followUp = resolveFollowUp(instrument);
  if (!followUp) {
    return value == null ? { answer: null } : { error: `${instrument.name} has no follow-up question` };
  }
  if (value == null) return { answer: null };

  const option = followUp.options.find((o) => o.value === value);
  if (!option) return { error: 'the follow-up answer is not one of the allowed options' };
  if (!conditionMet(followUp.condition, items, answers)) {
    // One exception, and it only ever goes one way: never discard a
    // disclosure of imminent risk on the grounds that the gate which would
    // have asked for it was not met.
    const crisisValue = followUpDef(instrument).crisisValue;
    if (crisisValue == null || value < crisisValue) return { answer: null };
  }

  return { answer: { id: followUp.id, text: followUp.text, value: option.value, label: option.label } };
}

// Which answers, if any, mean this sitting has to reach a human rather than
// just be filed.
//
// Two shapes feed in. `crisisItem` is a single index (PHQ-9's item 9);
// `crisisItems` is a list, because the ASQ treats a yes to ANY of its four
// questions as a positive screen. On top of that, a follow-up carrying a
// `crisisValue` raises the level to acute — the ASQ's acuity question asks
// whether the thoughts are happening right now, and "right now" is a
// different response than "in the past few weeks".
//
// `itemIndex` and `value` are kept for the first hit so this stays readable
// to anything written against the single-item shape.
function crisisFor(instrument, items, answers, followUpValue, band) {
  const indices = instrument.crisisItems || (instrument.crisisItem != null ? [instrument.crisisItem] : []);

  const hits = indices
    .filter((i) => isAsked(items[i], items, answers) && answers[i] > bounds(items[i].options).min)
    .map((i) => ({
      index: i,
      value: answers[i],
      text: items[i].text,
      label: items[i].options.find((o) => o.value === answers[i])?.label || String(answers[i]),
    }));

  const followUp = followUpDef(instrument);
  // Two routes to acute. The ASQ gets there through its "right now" question;
  // the C-SSRS gets there by landing in a band that says so, because on that
  // scale the severity is in the pattern of answers rather than any one of
  // them.
  const acuteAnswer =
    followUp?.crisisValue != null && followUpValue != null && followUpValue >= followUp.crisisValue;
  const acuteBand = band?.crisisLevel === 'acute';
  const acute = acuteAnswer || acuteBand;

  if (hits.length === 0 && !acute) return null;

  const reasons = hits.map((h) => `Answered "${h.label}" to: ${h.text}`);
  if (acuteAnswer) reasons.unshift(`Answered "${followUp.options.find((o) => o.value === followUpValue)?.label}" to: ${followUp.text}`);
  if (acuteBand) reasons.unshift(`${instrument.name} triage: ${band.label}`);

  return {
    // 'acute' means right now. Everything downstream — the resident's screen,
    // the counsellor's list — sorts on this word.
    level: acute ? 'acute' : 'positive',
    reasons,
    items: hits,
    itemIndex: hits.length > 0 ? hits[0].index : null,
    value: hits.length > 0 ? hits[0].value : null,
  };
}

// Returns { error } on anything malformed, so the handler can 400 without
// having to re-validate.
export function scoreInstrument(instrument, answers, followUpValue = null) {
  const items = resolveItems(instrument);

  if (!Array.isArray(answers)) return { error: 'answers must be an array' };
  if (answers.length !== items.length) {
    return { error: `${instrument.name} expects ${items.length} answers, got ${answers.length}` };
  }

  for (const [index, item] of items.entries()) {
    const value = answers[index];

    // An item the form skipped arrives empty, or at worst as its own "no".
    // The property worth protecting is narrow and specific: nobody can be
    // recorded as having endorsed a question they were never shown.
    if (!isAsked(item, items, answers)) {
      if (value != null && value > bounds(item.options).min) {
        return { error: `answer ${index + 1} was not asked and cannot be endorsed` };
      }
      continue;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { error: `answer ${index + 1} is missing` };
    }
    if (!item.options.some((o) => o.value === value)) {
      return { error: `answer ${index + 1} is not one of the allowed options` };
    }
  }

  const followUp = resolveFollowUpAnswer(instrument, items, answers, followUpValue);
  if (followUp.error) return { error: followUp.error };

  const followUpValueUsed = followUp.answer ? followUp.answer.value : null;
  const sum = items.reduce(
    (total, item, index) => (isAsked(item, items, answers) ? total + itemScore(item, answers[index]) : total),
    0,
  );
  const score = applyTransform(sum, items.length, instrument.transform);
  const bandIndex = bandFor(instrument, score, items, answers, followUpValueUsed);
  const band = instrument.bands[bandIndex];

  // A crisis answer routes into the same path as a free-text disclosure — a
  // number on its own is not something to quietly file.
  const crisis = crisisFor(instrument, items, answers, followUpValueUsed, band);

  return {
    raw: sum,
    score,
    maxScore: maxScore(items, instrument.transform),
    // True where the total is not a quantity and must not be shown as one.
    reportsBandOnly: Boolean(instrument.reportsBandOnly),
    band: {
      label: band.label,
      note: band.note,
      // Where this band sits in the instrument's own ladder, and which end of
      // that ladder is the good end — the UI cannot infer either from a number.
      index: bandIndex,
      count: instrument.bands.length,
      higherIsBetter: Boolean(instrument.higherIsBetter),
    },
    subscales: subscaleScores(instrument, items, answers),
    // Reported next to the score, deliberately not folded into it.
    followUp: followUp.answer,
    crisis,
  };
}
