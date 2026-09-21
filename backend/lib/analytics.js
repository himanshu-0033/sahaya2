// Shared read-only aggregation over residents, check-ins and assessments,
// used by the admin (counsellor) endpoints. Everything here is derived from
// stored records — no clinical scoring, just counting and averaging.
//
// WHY ASSESSMENTS ARE IN HERE. They were not, originally, and that was a real
// hole: a resident could answer yes to "have you been having thoughts about
// killing yourself" and the console's own idea of who needs a conversation
// would not move, because it was computed from check-ins alone. The flag sat
// in a table four clicks deep. A screen nobody is shown is not a screen, so
// `flaggedRecently` now means "check-ins OR a positive risk screen", and the
// screen sorts to the top of every list it appears in.

import { TOPICS, topicLabel } from './topics.js';
import { LABELS as SAFETY_LABELS } from './safety.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDay(offsetFromToday = 0) {
  return new Date(Date.now() - offsetFromToday * DAY_MS).toISOString().slice(0, 10);
}

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round1(value) {
  return value === null ? null : Math.round(value * 10) / 10;
}

// Consecutive days checked in, counting back from today (or yesterday, so an
// evening-checker doesn't appear to have lost their streak at midnight).
// How long a positive screen keeps counting as current. Two weeks is a
// judgement call, not a clinical constant: long enough that a screen taken on
// a Friday is still visible the following week, short enough that a row does
// not stay red for a month after it has been dealt with.
const RISK_WINDOW_DAYS = 14;

// The most recent flagged sitting, with the acute ones winning ties. An acute
// screen is someone saying the thoughts are happening right now, so it must
// never be hidden behind a merely-newer positive one.
function riskScreenFor(assessments, residentId) {
  const flagged = assessments
    .filter((a) => a.residentId === residentId && a.flagged)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (flagged.length === 0) return null;

  const acute = flagged.find((a) => a.riskLevel === 'acute');
  const chosen = acute || flagged[0];
  const ageDays = Math.floor((Date.now() - new Date(chosen.createdAt).getTime()) / DAY_MS);

  return {
    instrumentId: chosen.instrumentId,
    instrumentName: chosen.instrumentName,
    // Older records predate riskLevel; a flag without one is a positive.
    level: chosen.riskLevel || 'positive',
    date: chosen.date,
    createdAt: chosen.createdAt,
    reasons: chosen.flagReasons || [],
    recent: ageDays <= RISK_WINDOW_DAYS,
    totalFlagged: flagged.length,
  };
}

// What a student has brought to the companion lately, one entry per topic,
// newest first. The same two weeks as a risk screen, for the same reason: long
// enough to still be on the list after a weekend, short enough that a student
// who talked about exams in March is not still a "study pressure" case in May.
function recentChats(chatSessions) {
  const since = Date.now() - RISK_WINDOW_DAYS * DAY_MS;
  return chatSessions.filter(
    (c) => (c.topics || []).length > 0 && new Date(c.updatedAt || c.startedAt).getTime() >= since,
  );
}

// The most recent check-in in the window whose words were screened as a
// disclosure. Same idea as chatSafetyFor below and deliberately the same
// shape, because to a counsellor it is the same fact arriving through a
// different door: three words in a box rather than a sentence in a chat.
//
// Kept separate from the flag reasons because those are nudges, and this is
// not one. A student can write this on their first ever check-in, with no
// mood history for any of the other rules to have noticed.
function checkinSafetyFor(checkins, residentId) {
  const since = Date.now() - RISK_WINDOW_DAYS * DAY_MS;
  const hits = checkins
    .filter(
      (c) =>
        c.residentId === residentId &&
        (c.safety || []).length > 0 &&
        new Date(c.createdAt || c.date).getTime() >= since,
    )
    .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
  if (hits.length === 0) return null;
  const categories = [...new Set(hits.flatMap((c) => c.safety))];
  const at = hits[0].createdAt || hits[0].date;
  return {
    categories,
    labels: categories.map((c) => SAFETY_LABELS[c] || c),
    at,
    date: at.slice(0, 10),
    words: hits[0].words || [],
    checkIns: hits.length,
  };
}

// The most recent inkblot sitting in the window whose free text was screened
// as a disclosure. Same shape as the chat and check-in versions below and
// above, because to a counsellor it is the same fact arriving through a third
// door: ten plates answered in the student's own words.
function inkblotSafetyFor(inkblotSessions, residentId) {
  const since = Date.now() - RISK_WINDOW_DAYS * DAY_MS;
  const hits = (inkblotSessions || [])
    .filter(
      (s) =>
        s.residentId === residentId &&
        (s.safety || []).length > 0 &&
        new Date(s.createdAt || s.date).getTime() >= since,
    )
    .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
  if (hits.length === 0) return null;
  const categories = [...new Set(hits.flatMap((s) => s.safety))];
  const at = hits[0].createdAt || hits[0].date;
  return {
    categories,
    labels: categories.map((c) => SAFETY_LABELS[c] || c),
    at,
    date: at.slice(0, 10),
    // Which plates matched, so a counsellor can go straight to the response
    // rather than reading all ten.
    plates: (hits[0].summary?.crisisHits || []).map((h) => h.plateId),
    sittings: hits.length,
  };
}

// The most recent conversation in the window where the resident disclosed
// suicide, self-harm or abuse. Counts toward "needs a conversation" and sits
// with the risk screens, because to a counsellor it is the same kind of fact:
// the person said something about their safety.
function chatSafetyFor(chatSessions, residentId) {
  const since = Date.now() - RISK_WINDOW_DAYS * DAY_MS;
  const hits = chatSessions
    .filter(
      (c) =>
        c.residentId === residentId &&
        (c.safety || []).length > 0 &&
        new Date(c.updatedAt || c.startedAt).getTime() >= since,
    )
    .sort((a, b) => (b.updatedAt || b.startedAt).localeCompare(a.updatedAt || a.startedAt));
  if (hits.length === 0) return null;
  const categories = [...new Set(hits.flatMap((c) => c.safety))];
  const at = hits[0].updatedAt || hits[0].startedAt;
  return {
    categories,
    labels: categories.map((c) => SAFETY_LABELS[c] || c),
    at,
    date: at.slice(0, 10),
    conversations: hits.length,
  };
}

function concernsFor(chatSessions, residentId) {
  const byTopic = new Map();
  for (const c of recentChats(chatSessions)) {
    if (c.residentId !== residentId) continue;
    const at = c.updatedAt || c.startedAt;
    for (const topic of c.topics) {
      const entry = byTopic.get(topic) || { topic, label: topicLabel(topic), conversations: 0, at };
      entry.conversations += 1;
      if (at > entry.at) entry.at = at;
      byTopic.set(topic, entry);
    }
  }
  return [...byTopic.values()].sort((a, b) => b.at.localeCompare(a.at));
}

// Exported because the check-in endpoint returns it now: the streak is what
// the resident sees at the end of a check-in, in the place the dinner-pass
// code used to occupy.
export function currentStreak(historyDates) {
  const days = new Set(historyDates);
  if (days.size === 0) return 0;

  let cursor = 0;
  if (!days.has(isoDay(0))) {
    if (!days.has(isoDay(1))) return 0;
    cursor = 1;
  }

  let streak = 0;
  while (days.has(isoDay(cursor))) {
    streak++;
    cursor++;
  }
  return streak;
}

export function historyFor(checkins, residentId) {
  return checkins
    .filter((c) => c.residentId === residentId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// One row per resident: who they are, plus how their check-ins have been
// going. `detailed` adds the contact fields a counsellor needs to reach out.
export function summarizeResident(
  resident,
  checkins,
  { detailed = false, assessments = [], chatSessions = [], inkblotSessions = [] } = {},
) {
  const history = historyFor(checkins, resident.id);
  const last = history[history.length - 1] || null;
  const recent = history.slice(-7);

  const recentThree = history.slice(-3);
  const checkinFlagRecently = recentThree.some((c) => c.flagged);
  // WHY someone is flagged, not just that they are.
  //
  // logic.js has always written readable reasons onto the check-in — "Mood has
  // stayed low for 3 check-ins in a row", "Today's words lean heavy" — and they
  // reached the CSV export and the detail page. They did not reach the list,
  // which is the screen a counsellor actually triages from: forty rows of an
  // identical "Needs a conversation" badge, with the reason one click away on
  // each. De-duplicated, because the same rule firing on three consecutive days
  // is one thing to know, not three.
  const checkinFlagReasons = [
    ...new Set(recentThree.filter((c) => c.flagged).flatMap((c) => c.flagReasons || [])),
  ];
  const riskScreen = riskScreenFor(assessments, resident.id);
  const chatSafety = chatSafetyFor(chatSessions, resident.id);
  const checkinSafety = checkinSafetyFor(history, resident.id);
  const inkblotSafety = inkblotSafetyFor(inkblotSessions, resident.id);

  const mine = assessments
    .filter((a) => a.residentId === resident.id)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const lastAssessment = mine[0]
    ? {
        instrumentId: mine[0].instrumentId,
        instrumentName: mine[0].instrumentName,
        domain: mine[0].domain,
        score: mine[0].score,
        maxScore: mine[0].maxScore,
        band: mine[0].band,
        reportsBandOnly: Boolean(mine[0].reportsBandOnly),
        followUp: mine[0].followUp || null,
        date: mine[0].date,
        createdAt: mine[0].createdAt,
      }
    : null;

  const base = {
    id: resident.id,
    name: resident.name,
    email: resident.email,
    invited: Boolean(resident.invited),
    onboarded: Boolean(resident.onboarded),
    joinedAt: resident.createdAt || null,
    totalCheckIns: history.length,
    streak: currentStreak(history.map((c) => c.date)),
    flaggedCount: history.filter((c) => c.flagged).length,
    // Deliberately broader than it used to be — see the note at the top.
    flaggedRecently:
      checkinFlagRecently ||
      Boolean(riskScreen && riskScreen.recent) ||
      Boolean(chatSafety) ||
      Boolean(checkinSafety) ||
      Boolean(inkblotSafety),
    checkinFlaggedRecently: checkinFlagRecently,
    checkinFlagReasons,
    riskScreen,
    chatSafety,
    checkinSafety,
    inkblotSafety,
    concerns: concernsFor(chatSessions, resident.id),
    assessmentCount: mine.length,
    lastAssessment,
    avgMoodRecent: round1(average(recent.map((c) => c.moodScore))),
    lastCheckIn: last
      ? { date: last.date, mood: last.mood, flagged: last.flagged, words: last.words }
      : null,
    trend: history.slice(-14).map((c) => ({
      date: c.date,
      moodScore: c.moodScore,
      flagged: c.flagged,
    })),
  };

  if (!detailed) return base;

  return {
    ...base,
    phone: resident.phone || '',
    dob: resident.dob || '',
    invitedBy: resident.invitedBy || '',
    updatedAt: resident.updatedAt || null,
  };
}

// Sorted the way a counsellor would triage: someone who said "right now"
// first, then anyone with a positive screen, then the check-in flags, then
// alphabetical.
function triageRank(row) {
  if (row.riskScreen?.recent && row.riskScreen.level === 'acute') return 0;
  if (row.riskScreen?.recent || row.chatSafety || row.checkinSafety || row.inkblotSafety) return 1;
  if (row.flaggedRecently) return 2;
  if (row.riskScreen) return 3;
  return 4;
}

export function summarizeResidents(residents, checkins, options) {
  const rows = residents.map((r) => summarizeResident(r, checkins, options));
  rows.sort((a, b) => {
    const rank = triageRank(a) - triageRank(b);
    if (rank !== 0) return rank;
    return (a.name || '').localeCompare(b.name || '');
  });
  return rows;
}

// Whole-cohort picture for the dashboard: today's participation, who needs a
// conversation, and how mood has moved over the last two weeks.
export function buildOverview(
  residents,
  checkins,
  { trendDays = 14, assessments = [], chatSessions = [], inkblotSessions = [] } = {},
) {
  const today = isoDay(0);
  const summaries = summarizeResidents(residents, checkins, {
    detailed: false,
    assessments,
    chatSessions,
    inkblotSessions,
  });

  const trend = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const date = isoDay(i);
    const dayCheckins = checkins.filter((c) => c.date === date);
    trend.push({
      date,
      checkIns: dayCheckins.length,
      flagged: dayCheckins.filter((c) => c.flagged).length,
      avgMood: round1(average(dayCheckins.map((c) => c.moodScore))),
    });
  }

  const since = isoDay(29);
  const moodDistribution = [1, 2, 3, 4, 5].map((value) => ({
    mood: value,
    count: checkins.filter((c) => c.date >= since && c.moodScore === value).length,
  }));

  const residentName = new Map(residents.map((r) => [r.id, r.name || r.email]));
  const recentFlags = checkins
    .filter((c) => c.flagged)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
    .map((c) => ({
      residentId: c.residentId,
      residentName: residentName.get(c.residentId) || 'Unknown',
      date: c.date,
      mood: c.mood,
      words: c.words,
      flagReasons: c.flagReasons || [],
    }));

  // Every flagged sitting across the cohort, newest first — the counsellor's
  // equivalent of an inbox. Kept separate from `recentFlags` because that list
  // is check-in shaped (a mood and three words) and this one is not.
  const recentRiskScreens = assessments
    .filter((a) => a.flagged)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 12)
    .map((a) => ({
      residentId: a.residentId,
      residentName: residentName.get(a.residentId) || 'Unknown',
      instrumentId: a.instrumentId,
      instrumentName: a.instrumentName,
      level: a.riskLevel || 'positive',
      score: a.score,
      maxScore: a.maxScore,
      band: a.band,
      date: a.date,
      createdAt: a.createdAt,
      reasons: a.flagReasons || [],
    }));

  // Who raised what with the companion, one entry per student per topic, so
  // the dashboard can list the students under each topic without a student who
  // talked about placements five times turning up five times.
  const recentConcerns = residents
    .flatMap((r) =>
      concernsFor(chatSessions, r.id).map((c) => ({
        residentId: r.id,
        residentName: r.name || r.email || 'Unknown',
        ...c,
        date: c.at.slice(0, 10),
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));

  // A disclosure in a chat joins the questionnaire screens here, so the
  // dashboard's risk list is one list of "said something about their safety".
  for (const s of summaries) {
    if (!s.chatSafety) continue;
    recentRiskScreens.push({
      residentId: s.id,
      residentName: s.name || s.email || 'Unknown',
      instrumentId: 'chat',
      instrumentName: 'Chat with DP',
      level: 'positive',
      date: s.chatSafety.date,
      createdAt: s.chatSafety.at,
      reasons: [`Talked about ${s.chatSafety.labels.join(' and ')}`],
    });
  }
  recentRiskScreens.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const atRisk = summaries.filter(
    (s) => (s.riskScreen && s.riskScreen.recent) || s.chatSafety || s.checkinSafety || s.inkblotSafety,
  );

  return {
    generatedAt: new Date().toISOString(),
    today,
    totals: {
      residents: residents.length,
      onboarded: residents.filter((r) => r.onboarded).length,
      invited: residents.filter((r) => r.invited && !r.onboarded).length,
      checkedInToday: checkins.filter((c) => c.date === today).length,
      flaggedResidents: summaries.filter((s) => s.flaggedRecently).length,
      atRisk: atRisk.length,
      acuteRisk: atRisk.filter((s) => s.riskScreen?.recent && s.riskScreen.level === 'acute').length,
      assessmentsTaken: assessments.length,
      raisedInChat: new Set(recentConcerns.map((c) => c.residentId)).size,
      totalCheckIns: checkins.length,
      avgMoodToday: round1(
        average(checkins.filter((c) => c.date === today).map((c) => c.moodScore)),
      ),
    },
    trend,
    moodDistribution,
    recentFlags,
    recentRiskScreens,
    recentConcerns,
    topics: TOPICS.map(({ id, label }) => ({ id, label })),
    needsAttention: summaries.filter((s) => s.flaggedRecently).slice(0, 8),
    quietest: summaries
      .filter((s) => s.onboarded && !s.flaggedRecently)
      .sort((a, b) => {
        const aDate = a.lastCheckIn?.date || '';
        const bDate = b.lastCheckIn?.date || '';
        return aDate.localeCompare(bDate);
      })
      .slice(0, 6),
  };
}
