// Shared read-only aggregation over residents + check-ins, used by the admin
// (counsellor) endpoints. Everything here is derived from stored records —
// no clinical scoring, just counting and averaging.

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
function currentStreak(historyDates) {
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
export function summarizeResident(resident, checkins, { detailed = false } = {}) {
  const history = historyFor(checkins, resident.id);
  const last = history[history.length - 1] || null;
  const recent = history.slice(-7);

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
    flaggedRecently: history.slice(-3).some((c) => c.flagged),
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
    address: resident.address || '',
    occupation: resident.occupation || '',
    invitedBy: resident.invitedBy || '',
    updatedAt: resident.updatedAt || null,
  };
}

export function summarizeResidents(residents, checkins, options) {
  const rows = residents.map((r) => summarizeResident(r, checkins, options));
  rows.sort((a, b) => {
    if (a.flaggedRecently !== b.flaggedRecently) return a.flaggedRecently ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  return rows;
}

// Whole-cohort picture for the dashboard: today's participation, who needs a
// conversation, and how mood has moved over the last two weeks.
export function buildOverview(residents, checkins, { trendDays = 14 } = {}) {
  const today = isoDay(0);
  const summaries = summarizeResidents(residents, checkins, { detailed: false });

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

  const residentName = new Map(residents.map((r) => [r.id, r.name]));
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

  return {
    generatedAt: new Date().toISOString(),
    today,
    totals: {
      residents: residents.length,
      onboarded: residents.filter((r) => r.onboarded).length,
      invited: residents.filter((r) => r.invited && !r.onboarded).length,
      checkedInToday: checkins.filter((c) => c.date === today).length,
      flaggedResidents: summaries.filter((s) => s.flaggedRecently).length,
      totalCheckIns: checkins.length,
      avgMoodToday: round1(
        average(checkins.filter((c) => c.date === today).map((c) => c.moodScore)),
      ),
    },
    trend,
    moodDistribution,
    recentFlags,
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
