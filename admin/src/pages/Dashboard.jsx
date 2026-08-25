import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard.jsx';
import TrendChart from '../components/TrendChart.jsx';
import MoodSparkline from '../components/MoodSparkline.jsx';
import { getOverview } from '../lib/api.js';
import { formatDate, moodLabel, daysSince } from '../lib/moods.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOverview()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (error) return <p className="text-sm text-[var(--color-flag)]">{error}</p>;
  if (!data) return null;

  const { totals, trend, moodDistribution, recentFlags, recentRiskScreens, needsAttention, quietest } =
    data;
  const maxMoodCount = Math.max(1, ...moodDistribution.map((m) => m.count));

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h2 className="font-display text-3xl">Today at a glance</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {formatDate(data.today)} · {totals.checkedInToday} of {totals.onboarded} residents have
          checked in.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Positive risk screens"
          value={totals.atRisk}
          hint={
            totals.acuteRisk > 0
              ? `${totals.acuteRisk} said "right now" — call first`
              : 'In the last 14 days'
          }
          tone="flag"
        />
        <StatCard
          label="Needs a conversation"
          value={totals.flaggedResidents}
          hint="Check-in flags and risk screens"
          tone="flag"
        />
        <StatCard
          label="Checked in today"
          value={totals.checkedInToday}
          hint={totals.avgMoodToday ? `Average mood ${totals.avgMoodToday} / 5` : 'No check-ins yet'}
          tone="teal"
        />
        <StatCard
          label="Residents"
          value={totals.residents}
          hint={`${totals.onboarded} joined · ${totals.invited} invited`}
          tone="lavender"
        />
        <StatCard
          label="Questionnaires taken"
          value={totals.assessmentsTaken}
          hint={`${totals.totalCheckIns} check-ins recorded`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card-soft rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Check-ins, last 14 days
          </h3>
          <div className="mt-4">
            <TrendChart trend={trend} />
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-[var(--color-muted)]">
            <span>{formatDate(trend[0]?.date)}</span>
            <span>{formatDate(trend[trend.length - 1]?.date)}</span>
          </div>
        </section>

        <section className="card-soft rounded-2xl p-6">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Mood mix, last 30 days
          </h3>
          <div className="mt-4 space-y-2.5">
            {[...moodDistribution].reverse().map((entry) => (
              <div key={entry.mood} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 text-[var(--color-ink-soft)]">
                  {moodLabel(entry.mood)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(entry.count / maxMoodCount) * 100}%`,
                      background:
                        entry.mood <= 2
                          ? 'var(--color-flag)'
                          : entry.mood === 3
                            ? 'var(--color-amber)'
                            : 'var(--color-teal)',
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-[var(--color-muted)]">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl">Worth reaching out to</h3>
          <Link
            to="/residents"
            className="text-sm text-[var(--color-lavender)] underline underline-offset-4"
          >
            All residents
          </Link>
        </div>
        {needsAttention.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Nobody is flagged right now.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {needsAttention.map((r) => (
              <Link
                key={r.id}
                to={`/residents/${encodeURIComponent(r.id)}`}
                className="card-soft rounded-2xl p-5 transition-colors hover:border-[var(--color-flag)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{r.email}</p>
                  </div>
                  <span className="rounded-full bg-[var(--color-flag-soft)] px-3 py-1 text-xs text-[var(--color-flag)]">
                    {r.flaggedCount} flagged
                  </span>
                </div>
                <div className="mt-4">
                  <MoodSparkline history={r.trend} height={34} barWidth={9} />
                </div>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Last check-in {formatDate(r.lastCheckIn?.date)} · {moodLabel(r.lastCheckIn?.mood)}
                  {r.lastCheckIn?.words?.length ? ` — ${r.lastCheckIn.words.join(', ')}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card-soft rounded-2xl p-6">
        <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Recent risk screens
        </h3>
        {recentRiskScreens.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            No questionnaire has flagged anyone.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentRiskScreens.map((screen) => (
              <li
                key={`${screen.residentId}:${screen.createdAt}`}
                className="border-t border-white/6 pt-3 first:border-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/residents/${encodeURIComponent(screen.residentId)}`}
                      className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-lavender)]"
                    >
                      {screen.residentName}
                    </Link>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] ${
                        screen.level === 'acute'
                          ? 'bg-[var(--color-flag)] text-white'
                          : 'bg-[var(--color-flag-soft)] text-[var(--color-flag)]'
                      }`}
                    >
                      {screen.level === 'acute' ? 'At risk now' : 'Positive'}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">
                    {screen.instrumentName} · {formatDate(screen.date)}
                  </span>
                </div>
                {screen.reasons.length > 0 && (
                  <p className="mt-1 text-xs leading-snug text-[var(--color-flag)]">
                    {screen.reasons.join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-soft rounded-2xl p-6">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Recent flagged check-ins
          </h3>
          {recentFlags.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">Nothing flagged yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentFlags.map((flag) => (
                <li
                  key={`${flag.residentId}:${flag.date}`}
                  className="border-t border-white/6 pt-3 first:border-0 first:pt-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      to={`/residents/${encodeURIComponent(flag.residentId)}`}
                      className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-lavender)]"
                    >
                      {flag.residentName}
                    </Link>
                    <span className="text-xs text-[var(--color-muted)]">
                      {formatDate(flag.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                    {moodLabel(flag.mood)} — {flag.words.join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-flag)]">
                    {flag.flagReasons.join('; ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-soft rounded-2xl p-6">
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Quietest — longest since a check-in
          </h3>
          {quietest.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">Everyone is up to date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {quietest.map((r) => {
                const gap = daysSince(r.lastCheckIn?.date);
                return (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-3 border-t border-white/6 pt-3 first:border-0 first:pt-0"
                  >
                    <Link
                      to={`/residents/${encodeURIComponent(r.id)}`}
                      className="text-sm hover:text-[var(--color-lavender)]"
                    >
                      {r.name}
                    </Link>
                    <span className="text-xs text-[var(--color-muted)]">
                      {r.lastCheckIn
                        ? gap === 0
                          ? 'today'
                          : `${gap} day${gap === 1 ? '' : 's'} ago`
                        : 'never'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
