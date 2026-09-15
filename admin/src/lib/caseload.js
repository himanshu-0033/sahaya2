// One caseload out of the overview's four lists.
//
// The console used to end in four separate panels — who needs attention, the
// recent risk screens, the recent flagged check-ins, and who had gone quiet —
// describing overlapping sets of the same people. A counsellor read the same
// name in three boxes and held the joins in their own head.
//
// This stitches them into one list where a person appears once, with what
// happened to them underneath. Nothing the endpoint returns is dropped: screens
// and flagged check-ins become the events on a row, and `quietest` survives as
// a row that simply has none.
import { moodLabel } from './moods.js';

export function hasScreen(row) {
  return Boolean(row.riskScreen) || row.events.some((e) => e.kind === 'screen');
}

export function raisedInChat(row, topic = null) {
  return row.events.some((e) => e.kind === 'concern' && (!topic || e.topic === topic));
}

export function isAcute(row) {
  return (
    (row.riskScreen?.recent && row.riskScreen.level === 'acute') ||
    row.events.some((e) => e.kind === 'screen' && e.level === 'acute')
  );
}

// Triage order, matching how the endpoint already ranks residents: someone who
// said "right now" first, then any positive screen, then the check-in flags,
// then everyone else.
export function rank(row) {
  if (isAcute(row)) return 0;
  if (hasScreen(row)) return 1;
  if (row.attention) return 2;
  if (row.events.length > 0) return 3;
  return 4;
}

export function buildCaseload({
  needsAttention = [],
  quietest = [],
  recentFlags = [],
  recentRiskScreens = [],
  recentConcerns = [],
} = {}) {
  const rows = new Map();

  for (const r of needsAttention) rows.set(r.id, { ...r, events: [], attention: true });
  for (const r of quietest) if (!rows.has(r.id)) rows.set(r.id, { ...r, events: [], quiet: true });

  // Someone can appear in an event list without being in either of those: the
  // flag lists reach back twelve entries, while `needsAttention` stops at eight
  // people. They arrive with a name and nothing else, so every field read off a
  // row has to survive being undefined — hence the `sparse` marker, which the
  // page uses to skip the parts of a row it has no data for.
  const ensure = (id, name) => {
    if (!rows.has(id)) rows.set(id, { id, name, events: [], sparse: true });
    return rows.get(id);
  };

  for (const s of recentRiskScreens) {
    ensure(s.residentId, s.residentName).events.push({
      kind: 'screen',
      // A disclosure to the companion arrives in the same list as the
      // questionnaire screens, and ranks the same, but is labelled apart.
      fromChat: s.instrumentId === 'chat',
      date: s.date,
      level: s.level,
      detail: s.instrumentName,
      reasons: s.reasons || [],
    });
  }

  for (const f of recentFlags) {
    ensure(f.residentId, f.residentName).events.push({
      kind: 'checkin',
      date: f.date,
      detail: `${moodLabel(f.mood)} · ${(f.words || []).join(', ')}`,
      reasons: f.flagReasons || [],
    });
  }

  // What a student brought to the companion. Not a flag: a row with only these
  // ranks with the check-in events, below anything a screen or a check-in said.
  for (const c of recentConcerns) {
    ensure(c.residentId, c.residentName).events.push({
      kind: 'concern',
      date: c.date,
      topic: c.topic,
      detail: c.label,
      reasons: [],
    });
  }

  const list = [...rows.values()];
  for (const row of list) row.events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  list.sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const aDate = a.events[0]?.date || a.lastCheckIn?.date || '';
    const bDate = b.events[0]?.date || b.lastCheckIn?.date || '';
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return (a.name || '').localeCompare(b.name || '');
  });
  return list;
}
