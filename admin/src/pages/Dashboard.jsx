import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlagBadge from '../components/FlagBadge.jsx';
import MoodSparkline from '../components/MoodSparkline.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { Monogram, Ring, Spark } from '../components/Spark.jsx';
import { getOverview, getAccessLog } from '../lib/api.js';
import { buildCaseload, hasScreen, raisedInChat } from '../lib/caseload.js';
import { formatDate, moodLabel, daysSince } from '../lib/moods.js';
import { roleLabel } from '../lib/roles.js';

// The console's first screen: one sentence saying what needs doing, six figures
// that double as filters, the fortnight's check-ins beside the month's moods,
// and the caseload, where each person's flags open in place.
//
// The four lists the overview endpoint returns are merged into one caseload in
// lib/caseload.js; see the note there for why.

const SEGMENTS = [
  { key: 'attention', label: 'Needs a conversation' },
  { key: 'risk', label: 'Risk screens' },
  { key: 'chat', label: 'Raised in chat' },
  { key: 'quiet', label: 'Quiet 3+ days' },
  { key: 'all', label: 'Everyone here' },
];

const QUIET_DAYS = 3;

// Each figure's card colour, with its text colours measured against it: the
// risk figure's orange #c2410c is 5.2:1 on white, the deep teal carries white
// at 9.5:1, the lavender-grey #2b2946 at 9.8:1.
const TONES = {
  risk: { bg: '#ffffff', ink: '#c2410c', soft: 'var(--color-muted)', mark: '#ea7a45', border: true },
  attention: { bg: '#1f4d47', ink: '#ffffff', soft: 'rgba(255,255,255,0.82)', mark: '#ffffff' },
  quiet: { bg: '#cfcde3', ink: '#2b2946', soft: '#45436a', mark: '#5b4bc4' },
  plain: { bg: '#ffffff', ink: 'var(--color-ink)', soft: 'var(--color-muted)', mark: 'var(--color-teal)' },
};

function Metric({ label, value, hint, tone = 'plain', visual, onClick, active = false }) {
  const t = TONES[tone];
  const body = (
    <>
      <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.14em]" style={{ color: t.soft }}>
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-[2rem] leading-none tabular-nums" style={{ color: t.ink }}>
          {value}
        </p>
        <span className="flex h-9 items-center">{visual}</span>
      </div>
      {hint && (
        <p className="mt-2 text-xs leading-snug" style={{ color: t.soft }}>
          {hint}
        </p>
      )}
    </>
  );

  const shell = `flex h-full flex-col rounded-2xl px-4 py-4 text-left ${tone === 'plain' || t.border ? 'border border-[var(--line-1)]' : ''}`;

  // A figure that maps onto a subset of the list below is a filter; one that
  // does not stays a figure.
  if (!onClick) {
    return (
      <div className={shell} style={{ background: t.bg }}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${shell} group cursor-pointer transition-[box-shadow,transform] hover:-translate-y-0.5 ${
        active ? 'shadow-[0_0_0_2px_var(--color-lavender-deep)]' : 'hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.35)]'
      }`}
      style={{ background: t.bg }}
    >
      {body}
      {/* Always rendered, so switching a filter on does not change the card's height. */}
      <span
        className={`mt-auto block truncate pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-opacity ${
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'
        }`}
        style={{ color: t.soft }}
      >
        {active ? 'Filtering · clear' : 'Filter the list'}
      </span>
    </button>
  );
}

function ChatIcon({ color }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-5 4Z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth="2.6" />
    </svg>
  );
}

const MOOD_BAR = { 1: '#c2410c', 2: 'var(--color-flag)', 3: 'var(--color-amber)', 4: '#5a9a6e', 5: 'var(--color-teal-dark)' };

// One flag on a person, as a line that opens to show all of it.
function EventRow({ event, residentId }) {
  const label =
    event.kind === 'screen'
      ? event.fromChat
        ? 'Chat with DP'
        : event.detail
      : event.kind === 'concern'
        ? 'Chat with DP'
        : 'Check-in';
  const lead =
    event.kind === 'concern'
      ? `Talked about ${event.detail.toLowerCase()}`
      : event.reasons[0] || event.detail;
  const tag =
    event.kind === 'screen'
      ? 'bg-[var(--color-flag-soft)] text-[var(--color-flag-deep)]'
      : event.kind === 'concern'
        ? 'bg-[var(--color-lavender-soft)] text-[var(--color-lavender-deep)]'
        : 'bg-[var(--surface-3)] text-[var(--color-ink-soft)]';
  const anchor = event.kind === 'concern' || event.fromChat ? '#conversations' : '';

  return (
    <details className="group rounded-xl border border-[var(--line-1)] bg-[var(--surface-1)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tag}`}>{label}</span>
          <span className="shrink-0 text-[var(--color-muted)]">{formatDate(event.date)}</span>
          <span aria-hidden="true" className="shrink-0 text-[var(--color-muted)]">→</span>
          <span className="min-w-0 truncate text-[var(--color-ink-soft)]">
            {event.kind === 'screen' && <span className="font-semibold text-[var(--color-flag-deep)]">Key flags: </span>}
            {lead}
          </span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-[var(--line-1)] px-3 py-2.5 text-xs leading-relaxed">
        {event.kind === 'checkin' && <p className="text-[var(--color-ink-soft)]">{event.detail}</p>}
        {event.reasons.length > 0 && (
          <ul className="space-y-1 text-[var(--color-flag-deep)]">
            {event.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        <Link
          to={`/residents/${encodeURIComponent(residentId)}${anchor}`}
          className="mt-2 inline-block font-medium text-[var(--color-lavender-deep)] underline underline-offset-4"
        >
          View full response
        </Link>
      </div>
    </details>
  );
}

export default function Dashboard({ admin }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // The access log is supporting information, not the point of the page, so a
  // failure here is swallowed: it must never take the dashboard down with it.
  const [access, setAccess] = useState([]);
  // 'all' for the super admin, 'self' for everyone else. The panel says which,
  // so a counsellor is never left thinking they are seeing the whole log.
  const [accessScope, setAccessScope] = useState('self');
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
    getAccessLog()
      .then((res) => {
        if (cancelled) return;
        setAccess(res.entries || []);
        setAccessScope(res.scope || 'self');
      })
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
    return bySegment.filter((r) => r.lastCheckIn?.date === day || r.events.some((e) => e.date === day));
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
  const quietCount = quietest.filter((r) => (daysSince(r.lastCheckIn?.date) ?? 99) >= QUIET_DAYS).length;

  // Every figure below is scoped to the people this counsellor can see. When
  // that is nobody, a wall of zeros looks like an outage, so say so first.
  const nobodyShared = totals.onboarded === 0 && totals.flaggedResidents === 0;

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // The state of the caseload as a sentence: a counsellor opening this window
  // wants the answer before the numbers. "Critical" only ever counts risk
  // screens, so a check-in flag is never inflated into an emergency.
  const lede = nobodyShared
    ? 'Nobody has shared with you yet.'
    : totals.acuteRisk > 0
      ? `${plural(totals.acuteRisk, 'person', 'people')} said “right now”. Call them first.`
      : totals.flaggedResidents > 0
        ? totals.atRisk >= totals.flaggedResidents
          ? `Your action is requested for ${plural(totals.flaggedResidents, 'critical conversation', 'critical conversations')} today.`
          : `Your action is requested for ${plural(totals.flaggedResidents, 'conversation', 'conversations')} today${
              totals.atRisk > 0 ? `, ${totals.atRisk} of them critical` : ''
            }.`
        : totals.raisedInChat > 0
          ? `Nothing is flagged. ${plural(totals.raisedInChat, 'student', 'students')} raised something with DP.`
          : 'Nothing is flagged today.';

  function toggleSegment(key) {
    setSegment((current) => (current === key ? 'all' : key));
  }

  return (
    <div className="animate-fade-up">
      <header>
        {/* The date, and who this dashboard belongs to. */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-block rounded-full border border-[var(--line-2)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            {formatDate(data.today)}
          </p>
          <p className="inline-block rounded-full bg-[#1f4d47] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
            {roleLabel(admin)} dashboard
          </p>
        </div>
        <h2 className="font-display mt-4 max-w-2xl text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.12]" style={{ textWrap: 'balance' }}>
          {lede}
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          <span className="tabular-nums">{totals.checkedInToday}</span> of{' '}
          <span className="tabular-nums">{totals.onboarded}</span> students have checked in ·{' '}
          <span className="tabular-nums">{totals.residents}</span> on your list,{' '}
          <span className="tabular-nums">{totals.invited}</span> invited
        </p>
      </header>

      {nobodyShared && (
        <div className="mt-6 rounded-2xl border border-[var(--color-lavender)]/30 bg-[var(--color-lavender-soft)] px-6 py-5">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            These figures cover the students you can see, and right now that is nobody, so everything
            below reads zero. This is not an error. Students appear here when the super admin assigns
            them to you, or when they add your address from their own account.
          </p>
        </div>
      )}

      {/* ─────────────────────────────── six figures, four of them filters */}
      <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Positive risk screens"
          value={totals.atRisk}
          hint={totals.acuteRisk > 0 ? `${totals.acuteRisk} said “right now”` : 'In the last 14 days'}
          tone="risk"
          visual={<Ring value={totals.atRisk} max={totals.onboarded} tone={TONES.risk.mark} />}
          onClick={() => toggleSegment('risk')}
          active={segment === 'risk'}
        />
        <Metric
          label="Needs a conversation"
          value={totals.flaggedResidents}
          hint="Check-in flags and risk screens"
          tone="attention"
          visual={<Spark values={trend.map((d) => d.flagged)} tone={TONES.attention.mark} />}
          onClick={() => toggleSegment('attention')}
          active={segment === 'attention'}
        />
        <Metric
          label="Raised in chat"
          value={totals.raisedInChat ?? 0}
          hint="Students who talked to DP about something, last 14 days"
          visual={<ChatIcon color="var(--color-lavender-deep)" />}
          onClick={() => toggleSegment('chat')}
          active={segment === 'chat'}
        />
        <Metric
          label={`Quiet ${QUIET_DAYS}+ days`}
          value={quietCount}
          hint="Longest since a check-in"
          tone="quiet"
          visual={<Ring value={quietCount} max={totals.onboarded} tone={TONES.quiet.mark} />}
          onClick={() => toggleSegment('quiet')}
          active={segment === 'quiet'}
        />
        <Metric
          label="Checked in today"
          value={totals.checkedInToday}
          hint={totals.avgMoodToday ? `Average mood ${totals.avgMoodToday} / 5` : 'No check-ins yet'}
          visual={<Spark values={trend.map((d) => d.checkIns)} tone="var(--color-teal-dark)" />}
        />
        <Metric
          label="Questionnaires taken"
          value={totals.assessmentsTaken}
          hint={`${totals.totalCheckIns} check-ins recorded`}
        />
      </div>

      {/* ─────────────────────────────── the fortnight and the month */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <section className="rounded-2xl border border-[var(--line-1)] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-lg">
              Check-in trends{' '}
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                (last {trend.length} days)
              </span>
            </h3>
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
          <div className="mt-3">
            <TrendChart trend={trend} selected={day} onSelect={setDay} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line-1)] bg-white p-6">
          <h3 className="font-display text-lg">
            Mood distribution{' '}
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              (last 30 days)
            </span>
          </h3>
          <div className="mt-5 space-y-3">
            {[...moodDistribution].reverse().map((entry) => (
              <div key={entry.mood} className="flex items-center gap-3 text-xs">
                <span className="w-14 shrink-0 text-[var(--color-ink-soft)]">{moodLabel(entry.mood)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(entry.count / maxMoodCount) * 100}%`, background: MOOD_BAR[entry.mood] }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-medium tabular-nums text-[var(--color-ink)]">{entry.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[var(--color-muted)]">
            {moodTotal === 0 ? 'No check-ins in this window.' : `${moodTotal} check-ins, and ${lowShare}% of them Heavy or Low.`}
          </p>
        </section>
      </div>

      {/* ─────────────────────────────── the caseload */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl">Caseload</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              <span className="tabular-nums">{visible.length}</span> shown
              {day ? ` on ${formatDate(day)}` : ''} · click anyone for their full history
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-full border border-[var(--line-1)] bg-white p-1 text-xs">
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
            <Link to="/residents" className="text-sm font-medium text-[var(--color-lavender-deep)] underline underline-offset-4">
              All students
            </Link>
          </div>
        </div>

        {/* The topics as sections, when the chat segment is on. Every topic is
            listed even at zero, so an empty one reads as "nobody". */}
        {segment === 'chat' && (
          <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {[{ id: null, label: 'All topics' }, ...(data.topics || [])].map((t) => {
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
          <ul className="mt-4 space-y-2.5">
            {visible.map((r) => {
              const gap = daysSince(r.lastCheckIn?.date);
              return (
                <li key={r.id} className="rounded-2xl border border-[var(--line-1)] bg-white px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link to={`/residents/${encodeURIComponent(r.id)}`} className="group flex min-w-0 items-center gap-3">
                      <Monogram name={r.name || r.email} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold transition-colors group-hover:text-[var(--color-lavender-deep)]">
                          {r.name || r.email || 'Unnamed student'}
                        </span>
                        {r.email && <span className="block truncate text-xs text-[var(--color-muted)]">{r.email}</span>}
                      </span>
                    </Link>
                    <div className="flex items-center gap-4">
                      {r.trend?.length > 0 && <MoodSparkline history={r.trend} height={28} barWidth={6} />}
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
                  </div>

                  {/* What actually happened, newest first. Three is enough to see
                      the shape of it; the rest are on the person's own page. */}
                  {r.events.length > 0 ? (
                    <div className="mt-3 space-y-1.5 sm:pl-12">
                      {r.events.slice(0, 3).map((e) => (
                        <EventRow key={`${e.kind}:${e.date}:${e.detail}`} event={e} residentId={r.id} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--color-muted)] sm:pl-12">
                      Last check-in{' '}
                      {r.lastCheckIn
                        ? `${formatDate(r.lastCheckIn.date)} · ${moodLabel(r.lastCheckIn.mood)}${gap ? ` · ${gap} day${gap === 1 ? '' : 's'} ago` : ''}`
                        : 'never'}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Who opened a record, and who took data out of here. A warning asks
          people to behave; this is a record, shown rather than merely written,
          because an audit log nobody can read protects nobody. Collapsed: it
          is consulted, not read daily. */}
      <details className="group mt-10 rounded-2xl border border-[var(--line-1)] bg-white px-6 py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span className="label-eyebrow">
            {accessScope === 'all' ? 'Recent access' : 'Your recent access'}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {access.length === 0
              ? 'none yet'
              : `${access.length} logged · latest ${new Date(access[0].at).toLocaleDateString()}`}
            <span aria-hidden="true" className="ml-2 inline-block transition-transform group-open:rotate-90">
              ›
            </span>
          </span>
        </summary>

        {access.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            No record has been opened and no CSV downloaded from this console yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {access.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--line-1)] pt-3 first:border-0 first:pt-0"
              >
                <span className="text-sm">
                  {/* An entry written before views were logged has no kind, and
                      every one of those was an export. */}
                  {e.kind === 'view' ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle bg-[var(--color-muted)]"
                      />
                      {e.actor}
                      <span className="text-[var(--color-muted)]">
                        {' '}
                        opened {e.subjectName || 'a student'}&rsquo;s record
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle bg-[var(--color-flag,#b42318)]"
                      />
                      {e.actor}
                      <span className="text-[var(--color-muted)]">
                        {' '}
                        exported{' '}
                        {e.scope === 'cohort' ? 'the student list' : `${e.subjectName || 'a student'}'s history`}
                      </span>
                    </>
                  )}
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
          This log records that a record was opened or exported, never what was in it. Repeat visits
          within a quarter of an hour count once. Entries cannot be edited or deleted from the
          console.
          {accessScope === 'self' && ' You are seeing your own activity; the administrator sees everyone’s.'}
        </p>
      </details>
    </div>
  );
}
