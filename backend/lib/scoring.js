// Scoring for the instruments in instruments.js.
//
// Deliberately dumb: sum the items, apply the instrument's published
// transform, look the total up in its published bands. No modelling, no
// inference, nothing that would turn a questionnaire into a claim about a
// person. Everything here can be checked by hand against the source paper.
import { resolveItems } from './instruments.js';

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

function bandFor(instrument, score) {
  const index = instrument.bands.findIndex((b) => score <= b.max);
  return index === -1 ? instrument.bands.length - 1 : index;
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

// Returns { error } on anything malformed, so the handler can 400 without
// having to re-validate.
export function scoreInstrument(instrument, answers) {
  const items = resolveItems(instrument);

  if (!Array.isArray(answers)) return { error: 'answers must be an array' };
  if (answers.length !== items.length) {
    return { error: `${instrument.name} expects ${items.length} answers, got ${answers.length}` };
  }

  for (const [index, item] of items.entries()) {
    const value = answers[index];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { error: `answer ${index + 1} is missing` };
    }
    if (!item.options.some((o) => o.value === value)) {
      return { error: `answer ${index + 1} is not one of the allowed options` };
    }
  }

  const sum = items.reduce((total, item, index) => total + itemScore(item, answers[index]), 0);
  const score = applyTransform(sum, items.length, instrument.transform);
  const bandIndex = bandFor(instrument, score);
  const band = instrument.bands[bandIndex];

  // PHQ-9 item 9 asks about self-harm. Any non-zero answer routes into the
  // same crisis path as a free-text disclosure — a number on its own is not
  // something to quietly file.
  const crisis =
    instrument.crisisItem != null && answers[instrument.crisisItem] > 0
      ? { itemIndex: instrument.crisisItem, value: answers[instrument.crisisItem] }
      : null;

  return {
    raw: sum,
    score,
    maxScore: maxScore(items, instrument.transform),
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
    crisis,
  };
}
