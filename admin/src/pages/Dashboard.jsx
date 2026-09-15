import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlagBadge from '../components/FlagBadge.jsx';
import MoodSparkline from '../components/MoodSparkline.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { Monogram, Ring, Spark } from '../components/Spark.jsx';
import { getOverview, getExportLog } from '../lib/api.js';
import { buildCaseload, hasScreen, raisedInChat } from '../lib/caseload.js';
import { formatDate, moodLabel, daysSince } from '../lib/moods.js';

// The four lists the overview endpoint returns are merged into one caseload in
// lib/caseload.js — see the note there for why. What is left here is the page:
// the totals become the rail at the top, which is also what filters the list,
// and `quietest` becomes a segment rather than a panel of its own.

const SEGMENTS = [
  { key: 'attention', label: 'Needs a conversation' },
  { key: 'risk', label: 'Risk screens' },
  { key: 'chat', label: 'Raised in chat' },
  { key: 'quiet', label: 'Quiet 3+ days' },
  { key: 'all', label: 'Everyone here' },
];

const QUIET_DAYS = 3;

function Metric({ label, value, hint, tone = 'default', visual, onClick, active = false }) {
  const toneClass =
    tone === 'flag'
      ? 'text-[var(--color-flag-deep)]'
      : tone === 'teal'
        ? 'text-[var(--color-teal-dark)]'
        : tone === 'lavender'
          ? 'text-[var(--color-lavender-deep)]'
          : 'text-[var(--color-ink)]';

  const body = (
    <>
      <p className="label-eyebrow">{label}</p>
      {/* The slot keeps its height whether or not there is a visual in it, and
          whether that visual is a ring or a sparkline, otherwise the five
          figures along the rail sit at five slightly different heights. */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`font-display text-3xl leading-none tabular-nums ${toneClass}`}>{value}</p>
        <span className="flex h-9 items-center">{visual}</span>
      </div>
      {hint && <p className="mt-2 text-xs leading-snug text-[var(--color-muted)]">{hint}</p>}
    </>
  );

  // A figure that maps onto a subset of the list below is a filter; one that
  // does not stays a figure. The hover label is what tells the two apart,
  // rather than every tile pretending to be a button.
  if (!onClick) return <div className="bg-[var(--color-cream-soft)] px-5 py-4">{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group cursor-pointer px-5 py-4 text-left transition-colors ${
        active
          ? 'metric-on bg-[var(--color-lavender-soft)]'
          : 'bg-[var(--color-cream-soft)] hover:bg-[var(--surface-2)]'
      }`}
    >
      {body}
      {/* Always rendered, so switching a filter on does not make its cell
          taller than the four beside it. */}
      <span
        className={`mt-2 block truncate text-[10px] uppercase tracking-[0.16em] text-[var(--color-lavender-deep)] transition-opacity ${
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'
        }`}
      >
        {active ? 'Filtering · clear' : 'Filter the list'}
      </span>
    </button>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // The export log is supporting information, not the point of the page, so a
  // failure here is swallowed — it must never take the dashboard down with it.
  const [exports, setExports] = useState([]);
  const [segment, setSegment] = useState('attention');
  const [day, setDay] = useState(null);
  // Which topic the "Raised in chat" segment is narrowed to. Null is all of them.
  const [topic, setTopic] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOverview()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    getExportLog()
      .then((res) => !cancelled && setExports(res.entries || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const caseload = useMemo(() => (data ? buildCaseload(data) : []), [data]);

  const visible = useMemo(() => {
    const bySegment = caseload.filter((r) => {
      // A student known only from a chat is a sparse row too, but talking about
      // exams is not a flag and does not belong under "Needs a conversation".
      if (segment === 'attention') {
        return Boolean(r.attention) || (r.sparse && r.events.some((e) => e.kind !== 'concern'));
      }
      if (segment === 'risk') return hasScreen(r);
      if (segment === 'chat') return raisedInChat(r, topic);
      if (segment === 'quiet') return (daysSince(r.lastCheckIn?.date) ?? 99) >= QUIET_DAYS;
      return true;
    });
    if (!day) return bySegment;
    return bySegment.filter(
      (r) => r.lastCheckIn?.date === day || r.events.some((e) => e.date === day),
    );
  }, [caseload, segment, day, topic]);

  if (loading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (error) return <p className="text-sm text-[var(--color-flag-deep)]">{error}</p>;
  if (!data) return null;

  const { totals, trend, moodDistribution, quietest } = data;
  const maxMoodCount = Math.max(1, ...moodDistribution.map((m) => m.count));
  const moodTotal = moodDistribution.reduce((sum, m) => sum + m.count, 0);
  const lowShare = moodTotal
    ? Math.round(((moodDistribution[0].count + moodDistribution[1].count) / moodTotal) * 100)
    : 0;
  const quietCount = quietest.filter(
    (r) => (daysSince(r.lastCheckIn?.date) ?? 99) >= QUIET_DAYS,
  ).length;

  // Every figure below is scoped to the people who have shared with this
  // counsellor. When that is nobody, a wall of zeros looks like an outage — so
  // say what it actually means before showing the figures.
  const nobodyShared = totals.onboarded === 0 && totals.flaggedResidents === 0;

  // The state of the caseload as a sentence, because a counsellor opening this
  // window wants the answer before they want the numbers behind it.
  const lede = nobodyShared
    ? 'Nobody has shared with you yet.'
    : totals.acuteRisk > 0
      ? `${totals.acuteRisk} ${totals.acuteRisk === 1 ? 'person' : 'people'} said “right now”. Call first.`
      : totals.flaggedResidents > 0
        ? `${totals.flaggedResidents} ${
            totals.flaggedResidents === 1 ? 'person is' : 'people are'
          } worth a conversation today.`
        : totals.raisedInChat > 0
          ? `Nothing is flagged. ${totals.raisedInChat} ${
              totals.raisedInChat === 1 ? 'student' : 'students'
            } raised something with DP.`
          : 'Nothing is flagged today.';

  function toggleSegment(key) {
    setSegment((current) => (current === key ? 'all' : key));
  }

  return (
    <div className="animate-fade-up">
      <header>
        <p className="label-eyebrow">{formatDate(data.today)}</p>
        <h2 className="font-display mt-2 max-w-2xl text-[clamp(1.6rem,3.4vw,2.4rem)] leading-tight">
          {lede}
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          <span className="tabular-nums">{totals.checkedInToday}</span> of{' '}
          <span className="tabular-nums">{totals.onboarded}</span> residents have checked in ·{' '}
          <span className="tabular-nums">{totals.residents}</span> on your list,{' '}
          <span className="tabular-nums">{totals.invited}</span> invited
        </p>
      </header>

      {nobodyShared && (
        <div className="mt-6 rounded-2xl border border-[var(--color-lavender)]/30 bg-[var(--color-lavender-soft)] px-6 py-5">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            These figures cover the people who have shared their account with you, and right now
            that is nobody, so everything below reads zero. This is not an error. Ask the people
            you work with to add your address from &ldquo;Who can see this&rdquo; in their own
            account.
          </p>
        </div>
      )}

      <div className="rail mt-8 rounded-2xl border border-[var(--line-1)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Positive risk screens"
          value={totals.atRisk}
          hint={
            totals.acuteRisk > 0 ? `${totals.acuteRisk} said “right now”` : 'In the last 14 days'
          }
          tone="flag"
          visual={<Ring value={totals.atRisk} max={totals.onboarded} tone="var(--color-flag)" />}
          onClick={() => toggleSegment('risk')}
          active={segment === 'risk'}
        />
        <Metric
          label="Needs a conversation"
          value={totals.flaggedResidents}
          hint="Check-in flags and risk screens"
          tone="flag"
          visual={<Spark values={trend.map((d) => d.flagged)} tone="var(--color-flag)" />}
          onClick={() => toggleSegment('attention')}
          active={segment === 'attention'}
        />
        <Metric
          label="Raised in chat"
          value={totals.raisedInChat}
          hint="Students who talked to DP about something, last 14 days"
          tone="lavender"
          visual={<Ring value={totals.raisedInChat} max={totals.onboarded} />}
          onClick={() => toggleSegment('chat')}
          active={segment === 'chat'}
        />
        <Metric
          label={`Quiet ${QUIET_DAYS}+ days`}
          value={quietCount}
          hint="Longest since a check-in"
          tone="lavender"
          visual={<Ring value={quietCount} max={totals.onboarded} />}
          onClick={() => toggleSegment('quiet')}
          active={segment === 'quiet'}
        />
        <Metric
          label="Checked in today"
          value={totals.checkedInToday}
          hint={
            totals.avgMoodToday ? `Average mood ${totals.avgMoodToday} / 5` : 'No check-ins yet'
          }
          tone="teal"
          visual={<Spark values={trend.map((d) => d.checkIns)} />}
        />
        <Metric
          label="Questionnaires taken"
          value={totals.assessmentsTaken}
          hint={`${totals.totalCheckIns} check-ins recorded`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card-soft rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="label-eyebrow">Check-ins, last {trend.length} days</h3>
            {day && (
              <button
                type="button"
                onClick={() => setDay(null)}
                className="cursor-pointer rounded-full bg-[var(--color-lavender-soft)] px-3 py-1 text-[11px] text-[var(--color-lavender-deep)] transition-colors hover:bg-[var(--color-lavender)]/25"
              >
                Showing {formatDate(day)} · clear ✕
              </button>
            )}
          </div>
          <div className="mt-4">
            <TrendChart trend={trend} selected={day} onSelect={setDay} />
          </div>
        </section>

        <section className="card-soft rounded-2xl p-6">
          <h3 className="label-eyebrow">Mood mix, last 30 days</h3>
          <div className="mt-4 space-y-2.5">
            {[...moodDistribution].reverse().map((entry) => (
              <div key={entry.mood} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 text-[var(--color-ink-soft)]">
                  {moodLabel(entry.mood)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
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
                <span className="w-6 shrink-0 text-right tabular-nums text-[var(--color-muted)]">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-muted)]">
            {moodTotal === 0
              ? 'No check-ins in this window.'
              : `${moodTotal} check-ins, and ${lowShare}% of them Heavy or Low.`}
          </p>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-xl">The caseload</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              <span className="tabular-nums">{visible.length}</span> shown
              {day ? ` on ${formatDate(day)}` : ''} · click anyone for their full history
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-full bg-[var(--surface-2)] p-1 text-xs">
              {SEGMENTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSegment(s.key)}
                  aria-pressed={segment === s.key}
                  className={`cursor-pointer rounded-full px-3 py-1.5 transition-colors ${
                    segment === s.key
                      ? 'bg-[var(--color-lavender-deep)] text-white'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Link
              to="/residents"
              className="text-sm text-[var(--color-lavender-deep)] underline underline-offset-4"
            >
              All residents
            </Link>
          </div>
        </div>

        {/* The topics as sections: pick one to see the students who brought it
            to DP. Every topic is listed even at zero, so an empty one reads as
            "nobody" rather than as missing. */}
        {segment === 'chat' && (
          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {[{ id: null, label: 'All topics' }, ...data.topics].map((t) => {
              const count = caseload.filter((r) => raisedInChat(r, t.id)).length;
              return (
                <button
                  key={t.id || 'all'}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  aria-pressed={topic === t.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 transition-colors ${
                    topic === t.id
                      ? 'border-[var(--color-lavender-deep)] bg-[var(--color-lavender-soft)] text-[var(--color-lavender-deep)]'
                      : 'border-[var(--line-2)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {t.label} <span className="tabular-nums text-[var(--color-muted)]">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            {day
              ? `Nobody in this segment has anything on ${formatDate(day)}.`
              : segment === 'attention'
                ? 'Nobody is flagged right now.'
                : segment === 'chat'
                  ? 'Nobody has raised this with DP in the last 14 days.'
                  : 'Nobody matches this filter.'}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line-1)] border-y border-[var(--line-1)]">
            {visible.map((r) => {
              const gap = daysSince(r.lastCheckIn?.date);
              return (
                <li key={r.id}>
                  <Link
                    to={`/residents/${encodeURIComponent(r.id)}`}
                    className="group grid gap-4 px-2 py-4 transition-colors hover:bg-[var(--surface-1)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                  >
                    <div className="flex min-w-0 gap-3">
                      <Monogram name={r.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                          <p className="font-medium transition-colors group-hover:text-[var(--color-lavender-deep)]">
                            {r.name}
                          </p>
                          {r.email && (
                            <p className="text-xs text-[var(--color-muted)]">{r.email}</p>
                          )}
                        </div>

                        {/* What actually happened, newest first — the screens and
                          flagged check-ins that used to sit in two panels of
                          their own. Three is enough to see the shape of it; the
                          rest are on the resident's own page. */}
                        {r.events.slice(0, 3).map((e) => (
                          <p
                            key={`${e.kind}:${e.date}:${e.detail}`}
                            className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-snug"
                          >
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                                e.kind === 'screen'
                                  ? 'bg-[var(--color-flag-soft)] text-[var(--color-flag-deep)]'
                                  : e.kind === 'concern'
                                    ? 'bg-[var(--color-lavender-soft)] text-[var(--color-lavender-deep)]'
                                    : 'bg-[var(--surface-2)] text-[var(--color-muted)]'
                              }`}
                            >
                              {e.kind === 'screen'
                                ? e.fromChat
                                  ? 'Safety'
                                  : 'Screen'
                                : e.kind === 'concern'
                                  ? 'Chat'
                                  : 'Check-in'}
                            </span>
                            <span className="text-[var(--color-ink-soft)]">{e.detail}</span>
                            <span className="text-[var(--color-muted)]">{formatDate(e.date)}</span>
                            {e.reasons.length > 0 && (
                              <span className="text-[var(--color-flag-deep)]">
                                {e.reasons.join(' · ')}
                              </span>
                            )}
                          </p>
                        ))}

                        {r.events.length === 0 && (
                          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                            Last check-in{' '}
                            {r.lastCheckIn
                              ? `${formatDate(r.lastCheckIn.date)} · ${moodLabel(r.lastCheckIn.mood)}${
                                  gap ? ` · ${gap} day${gap === 1 ? '' : 's'} ago` : ''
                                }`
                              : 'never'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end">
                      {r.trend?.length > 0 && (
                        <MoodSparkline history={r.trend} height={30} barWidth={7} />
                      )}
                      {r.sparse && !r.events.some((e) => e.kind !== 'concern') ? (
                        <span className="whitespace-nowrap rounded-full bg-[var(--color-lavender-soft)] px-3 py-1 text-xs text-[var(--color-lavender-deep)]">
                          Raised in chat
                        </span>
                      ) : r.sparse ? (
                        <span className="whitespace-nowrap rounded-full bg-[var(--color-flag-soft)] px-3 py-1 text-xs text-[var(--color-flag-deep)]">
                          {hasScreen(r) ? 'Risk screen' : 'Flagged earlier'}
                        </span>
                      ) : (
                        <FlagBadge resident={r} />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Who took data out of here.

          The console has warned counsellors to handle exports carefully for a
          while. A warning is a request; this is a record. It is shown rather
          than merely written, because an audit log nobody can read protects
          nobody, and being visible is most of what makes it work.

          Collapsed, not hidden: it is a thing a counsellor consults, not
          something they read every morning, and <details> carries the
          disclosure and its keyboard handling without any state of ours. */}
      <details className="card-soft group mt-10 rounded-2xl px-6 py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span className="label-eyebrow">Recent exports</span>
          <span className="text-xs text-[var(--color-muted)]">
            {exports.length === 0
              ? 'none yet'
              : `${exports.length} logged · latest ${new Date(exports[0].at).toLocaleDateString()}`}
            <span
              aria-hidden="true"
              className="ml-2 inline-block transition-transform group-open:rotate-90"
            >
              ›
            </span>
          </span>
        </summary>

        {exports.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            No CSV has been downloaded from this console yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {exports.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--line-1)] pt-3 first:border-0 first:pt-0"
              >
                <span className="text-sm">
                  {e.actor}
                  <span className="text-[var(--color-muted)]">
                    {' '}
                    exported{' '}
                    {e.scope === 'cohort'
                      ? 'the resident list'
                      : `${e.subjectName || 'a resident'}'s history`}
                  </span>
                </span>
                <span className="text-xs whitespace-nowrap text-[var(--color-muted)]">
                  {e.rowCount != null && `${e.rowCount} rows · `}
                  {new Date(e.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
          This log records that an export happened, never what was in it. Entries cannot be edited
          or deleted from the console.
        </p>
      </details>
    </div>
  );
}
