// The three-test sitting: PHQ-9, then GAD-7, then WHO-5, back to back.
//
// Taken one at a time these are three errands. Taken in a row they are one
// appointment, and the thing a person actually wanted when they opened the
// Tests door — "where am I, roughly" — is a question no single instrument
// answers. Low mood, worry and wellbeing are the three axes it takes.
//
// The set travels in the query string rather than in router state because
// each instrument is a fresh mount of AssessmentRun: a reload mid-set would
// drop state handed through navigate(), and someone two questionnaires deep
// should not lose them to a stray refresh. The finished scores accumulate in
// sessionStorage for the same reason — and in sessionStorage rather than
// localStorage because a set is a sitting, not a record. The records live on
// the server; this is only what the last screen needs to lay them side by
// side.

export const SET_IDS = ['phq-9', 'gad-7', 'who-5'];
export const SET_PARAM = 'set';

// Where the set hands off when it finishes, when it is not finishing on its
// own summary. `after=checkin` means the sitting started in the check-in and
// has ten plates still to go, so the three scores are held back and shown
// once at the end with everything else rather than interrupting the run.
export const AFTER_PARAM = 'after';
export const AFTER_CHECKIN = 'checkin';

const storeKey = (ids) => `sahay:test-set:${ids.join(',')}`;

// Names for the set rail, which has to label three tests while only one of
// them has been fetched. Acronyms only — the server still owns the real
// instrument name, and this never reaches a results screen.
const LABELS = { 'phq-9': 'PHQ-9', 'gad-7': 'GAD-7', 'who-5': 'WHO-5' };

export function labelFor(id) {
  return LABELS[id] || id.toUpperCase();
}

// Takes the raw query-string value rather than the URLSearchParams object, so
// callers can memoise on a string instead of on an object identity that
// changes every render.
export function parseSet(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function setHref(ids, instrumentId, after = null) {
  const tail = after ? `&${AFTER_PARAM}=${encodeURIComponent(after)}` : '';
  return `/assessments/${instrumentId}?${SET_PARAM}=${encodeURIComponent(ids.join(','))}${tail}`;
}

export function setStartHref(ids = SET_IDS, after = null) {
  return setHref(ids, ids[0], after);
}

export function readSetResults(ids) {
  try {
    const raw = window.sessionStorage.getItem(storeKey(ids));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // No storage means no side-by-side summary, not a broken sitting.
    return {};
  }
}

export function recordSetResult(ids, instrumentId, summary) {
  try {
    const all = readSetResults(ids);
    all[instrumentId] = summary;
    window.sessionStorage.setItem(storeKey(ids), JSON.stringify(all));
  } catch {
    // Ignore — the result is already saved server-side.
  }
}

export function clearSetResults(ids) {
  try {
    window.sessionStorage.removeItem(storeKey(ids));
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
