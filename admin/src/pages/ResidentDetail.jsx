import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MoodSparkline from '../components/MoodSparkline.jsx';
import StatCard from '../components/StatCard.jsx';
import FlagBadge from '../components/FlagBadge.jsx';
import { assignCounsellor, getResident, logExport, unassignCounsellor } from '../lib/api.js';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { formatDate, moodLabel, moodColor, daysSince } from '../lib/moods.js';

const CSV_COLUMNS = [
  { label: 'Date', value: (c) => c.date },
  { label: 'Mood', value: (c) => moodLabel(c.mood) },
  { label: 'Mood score', value: (c) => c.moodScore },
  { label: 'Words', value: (c) => (c.words || []).filter(Boolean).join(' / ') },
  { label: 'Flagged', value: (c) => (c.flagged ? 'yes' : 'no') },
  { label: 'Flag reasons', value: (c) => (c.flagReasons || []).join('; ') },
  { label: 'Recorded at', value: (c) => c.createdAt || '' },
];

function plateLabel(plateId) {
  const n = Number(String(plateId).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) && n > 0 ? `Plate ${n}` : plateId;
}

// Sits above everything else on the page. The rest of this screen is a
// month of moods and a table of scores; none of it is the thing you need to
// see first if someone has just answered yes to the ASQ.
function ago(date) {
  const days = daysSince(date);
  if (days === null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function RiskBanner({ risk, resident }) {
  if (!risk) return null;
  const acute = risk.level === 'acute';

  return (
    <section
      className={`rounded-2xl border p-6 ${
        acute
          ? 'border-[var(--color-flag)] bg-[var(--color-flag-soft)] ring-1 ring-[var(--color-flag)]/40'
          : 'border-[var(--color-flag)]/40 bg-[var(--color-flag-soft)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl text-[var(--color-flag-deep)]">
            {acute ? 'Said they are at risk right now' : 'Positive risk screen'}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {risk.instrumentName} · {formatDate(risk.date)} · {ago(risk.date)}
            {!risk.recent && ' · older than two weeks'}
          </p>
        </div>
        {resident.phone && (
          <a
            href={`tel:${resident.phone}`}
            className="whitespace-nowrap rounded-full bg-[var(--color-flag-deep)] px-4 py-2 text-sm font-medium text-white"
          >
            Call {resident.phone}
          </a>
        )}
      </div>

      {risk.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
          {risk.reasons.map((reason) => (
            <li key={reason} className="leading-snug">
              {reason}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
        A screening questionnaire says a conversation is needed. It does not say how likely
        anything is: no instrument does that for an individual person
        {risk.totalFlagged > 1 && ` · ${risk.totalFlagged} flagged sittings in total`}.
      </p>
    </section>
  );
}

// A disclosure of suicide, self-harm or abuse in a chat with DP. Sits with the
// risk banner, above the topics, and says how it was found: by matching words,
// so the counsellor reads the conversation before they pick up the phone.
// The same fact as the chat banner, arriving through a different door: three
// words typed into a check-in rather than a sentence in a conversation.
//
// Its own banner rather than a line in the flag reasons, because the reasons
// are nudges ("mood has stayed low", "today's words lean heavy") and this is
// not one. A student can write this on their very first check-in, with no
// history for any of the mood rules to have noticed, so it has to be able to
// arrive alone and still be the loudest thing on the page.
function CheckinSafetyBanner({ safety, resident }) {
  if (!safety) return null;
  return (
    <section className="rounded-2xl border border-[var(--color-flag)] bg-[var(--color-flag-soft)] p-6 ring-1 ring-[var(--color-flag)]/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl text-[var(--color-flag-deep)]">
            Wrote about {safety.labels.join(' and ')} in a check-in
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {safety.checkIns} {safety.checkIns === 1 ? 'check-in' : 'check-ins'} · latest{' '}
            {ago(safety.date)}
          </p>
          {safety.words.filter(Boolean).length > 0 && (
            <p className="mt-3 text-sm text-[var(--color-ink)]">
              Their words:{' '}
              <span className="font-medium">{safety.words.filter(Boolean).join(' · ')}</span>
            </p>
          )}
        </div>
        {resident.phone && (
          <a
            href={`tel:${resident.phone}`}
            className="whitespace-nowrap rounded-full bg-[var(--color-flag-deep)] px-4 py-2 text-sm font-medium text-white"
          >
            Call {resident.phone}
          </a>
        )}
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
        Found by matching the words the student wrote, so it can miss things and can misread them.
        They were shown crisis contacts in the app at the time. It says a conversation is needed,
        not how serious this is.
      </p>
    </section>
  );
}

function ChatSafetyBanner({ safety, resident }) {
  if (!safety) return null;
  return (
    <section className="rounded-2xl border border-[var(--color-flag)]/40 bg-[var(--color-flag-soft)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl text-[var(--color-flag-deep)]">
            Talked to DP about {safety.labels.join(' and ')}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {safety.conversations} {safety.conversations === 1 ? 'conversation' : 'conversations'} ·
            latest {ago(safety.date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {resident.phone && (
            <a
              href={`tel:${resident.phone}`}
              className="whitespace-nowrap rounded-full bg-[var(--color-flag-deep)] px-4 py-2 text-sm font-medium text-white"
            >
              Call {resident.phone}
            </a>
          )}
          <a
            href="#conversations"
            className="whitespace-nowrap rounded-full border border-[var(--color-flag-deep)] px-4 py-2 text-sm text-[var(--color-flag-deep)]"
          >
            Read the conversation
          </a>
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
        Found by matching the words the student wrote, so it can miss things and can misread
        them. They were shown crisis contacts in the chat at the time. It says a conversation is
        needed, not how serious this is.
      </p>
    </section>
  );
}

// What the student has brought to DP lately, and the way to reach them about
// it. Sits under the risk banner, never above it: a topic is a reason to get in
// touch, not an alarm.
function ConcernBanner({ concerns, resident }) {
  if (!concerns?.length) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-lavender)]/40 bg-[var(--color-lavender-soft)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl text-[var(--color-lavender-deep)]">Raised in chat</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {concerns.map((c) => (
              <li
                key={c.topic}
                className="rounded-full bg-[var(--color-cream-soft)] px-3 py-1 text-xs text-[var(--color-ink-soft)]"
              >
                {c.label}
                <span className="text-[var(--color-muted)]">
                  {' '}
                  · {c.conversations} {c.conversations === 1 ? 'chat' : 'chats'} · {ago(c.at.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          {resident.phone && (
            <a
              href={`tel:${resident.phone}`}
              className="whitespace-nowrap rounded-full bg-[var(--color-lavender-deep)] px-4 py-2 text-sm font-medium text-white"
            >
              Call {resident.phone}
            </a>
          )}
          {resident.email && (
            <a
              href={`mailto:${resident.email}`}
              className="whitespace-nowrap rounded-full border border-[var(--color-lavender-deep)] px-4 py-2 text-sm text-[var(--color-lavender-deep)]"
            >
              Email
            </a>
          )}
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
        Worked out from the words the student used, or the topic they tapped, over the last 14
        days. It says what they talked about, not how serious it is.{' '}
        <a href="#conversations" className="underline underline-offset-2">
          Read the conversations
        </a>
      </p>
    </section>
  );
}

// Super admin only: who can see this student, and assigning or removing a
// counsellor. A counsellor the student invited is shown but cannot be removed
// here; that share is the student's.
function Counsellors({ residentId, initial }) {
  const [list, setList] = useState(initial);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function run(action, target) {
    setBusy(true);
    setError(null);
    action({ residentId, email: target })
      .then((res) => {
        setList(res.counsellors);
        setEmail('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  return (
    <section className="card-soft rounded-2xl p-6">
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Counsellors</h3>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">No counsellor can see this student yet.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {list.map((c) => (
            <li
              key={c.email}
              className="flex items-center gap-2 rounded-full bg-[var(--color-lavender-soft)] py-1 pr-1.5 pl-3 text-sm text-[var(--color-lavender-deep)]"
            >
              {c.email}
              <span className="text-[10px] uppercase tracking-wider">{c.assigned ? 'assigned' : 'invited by student'}</span>
              {c.assigned && (
                <button
                  type="button"
                  onClick={() => run(unassignCounsellor, c.email)}
                  disabled={busy}
                  aria-label={`Remove ${c.email}`}
                  className="rounded-full px-1.5 text-base leading-none hover:bg-white/60"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) run(assignCounsellor, email.trim());
        }}
        className="mt-4 flex flex-wrap gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="counsellor@college.edu"
          className="input-soft min-w-[220px] flex-1"
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="rounded-full bg-[var(--color-lavender-deep)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Assign
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--color-flag-deep)]">{error}</p>}
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        An assigned counsellor sees this student at once. The student sees who was assigned on their
        account page and cannot remove them.
      </p>
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm">{value || '-'}</p>
    </div>
  );
}

export default function ResidentDetail() {
  const { residentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getResident(residentId)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [residentId]);

  function handleExport() {
    const name = (data.resident.name || 'resident').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // See the note in Residents.jsx — recorded, never blocking.
    logExport({ scope: 'resident', residentId, rowCount: data.history.length }).catch(() => {});
    downloadCsv(`sahay-${name}-checkins.csv`, toCsv(CSV_COLUMNS, [...data.history].reverse()));
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Link
        to="/residents"
        className="inline-block text-sm text-[var(--color-lavender-deep)] underline underline-offset-4"
      >
        ← All residents
      </Link>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading…</p>}
      {error && <p className="text-sm text-[var(--color-flag-deep)]">{error}</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">{data.resident.name || data.resident.email || 'Unnamed student'}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{data.resident.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <FlagBadge resident={data.summary} />
              <button
                onClick={handleExport}
                disabled={data.history.length === 0}
                className="rounded-full border border-[var(--line-3)] px-4 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* The cohort export has carried a handling warning for a while; this
              one did not, and it is the more sensitive of the two, one named
              person's full history, their written words and the reasons they
              were flagged, in a file that leaves the console and lands in a
              downloads folder. */}
          {data.history.length > 0 && (
            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              This file contains {data.resident.name}&apos;s check-in history, the words they wrote
              and why they were flagged. Store it the way your institution requires, and delete it
              when you no longer need it.
            </p>
          )}

          <RiskBanner risk={data.summary.riskScreen} resident={data.resident} />
          {/* Above the chat banner: a check-in disclosure is the newer signal
              and the one with no conversation behind it to soften it. */}
          <CheckinSafetyBanner safety={data.summary.checkinSafety} resident={data.resident} />
          <ChatSafetyBanner safety={data.summary.chatSafety} resident={data.resident} />
          <ConcernBanner concerns={data.summary.concerns} resident={data.resident} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Check-ins"
              value={data.summary.totalCheckIns}
              hint={
                data.summary.lastCheckIn
                  ? `Last ${formatDate(data.summary.lastCheckIn.date)}`
                  : 'None yet'
              }
            />
            <StatCard
              label="Avg mood, last 7"
              value={data.summary.avgMoodRecent ?? '-'}
              hint="Out of 5"
              tone="teal"
            />
            <StatCard label="Current streak" value={`${data.summary.streak}d`} tone="lavender" />
            <StatCard
              label="Times flagged"
              value={data.summary.flaggedCount}
              hint={data.summary.flaggedRecently ? 'Including a recent check-in' : 'None recent'}
              tone={data.summary.flaggedCount > 0 ? 'flag' : 'default'}
            />
          </div>

          {data.counsellors && <Counsellors residentId={residentId} initial={data.counsellors} />}

          <section className="card-soft rounded-2xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Contact details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Phone" value={data.resident.phone} />
              <Field label="Date of birth" value={data.resident.dob} />
              <Field
                label="Joined"
                value={data.resident.createdAt ? formatDate(data.resident.createdAt.slice(0, 10)) : ''}
              />
              <Field
                label="Status"
                value={data.resident.onboarded ? 'Account created' : `Invited by ${data.resident.invitedBy || 'a counsellor'}`}
              />
            </div>
          </section>

          <section className="card-soft rounded-2xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Mood trend, last {data.history.slice(-14).length} check-ins
            </h3>
            <div className="mt-4">
              <MoodSparkline history={data.history.slice(-14)} height={64} barWidth={16} />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-teal)]" /> steady
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-flag)]" /> flagged
                day
              </span>
            </div>
          </section>

          <section>
            <h3 className="font-display text-xl">Check-in history</h3>
            {data.history.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {data.resident.onboarded
                  ? 'No check-ins recorded yet.'
                  : "Invited, but hasn't signed in yet."}
              </p>
            ) : (
              <div className="card-soft mt-4 overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Mood</th>
                      <th className="px-5 py-3">Words</th>
                      <th className="px-5 py-3">Why it was flagged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.history].reverse().map((c) => {
                      const gap = daysSince(c.date);
                      return (
                        <tr key={c.date} className="border-t border-[var(--line-1)] align-top">
                          <td className="whitespace-nowrap px-5 py-3">
                            <span>{formatDate(c.date)}</span>
                            <span className="ml-2 text-xs text-[var(--color-muted)]">
                              {gap === 0 ? 'today' : `${gap}d ago`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">
                            <span
                              className="inline-flex items-center gap-2"
                              style={{ color: moodColor(c.moodScore) }}
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: moodColor(c.moodScore) }}
                              />
                              {moodLabel(c.mood)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[var(--color-ink-soft)]">
                            {(c.words || []).filter(Boolean).join(', ') || '-'}
                          </td>
                          <td className="px-5 py-3 text-xs text-[var(--color-flag-deep)]">
                            {c.flagged ? (c.flagReasons || []).join('; ') : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-display text-xl">Inkblot test</h3>
            {!data.inkblotSessions || data.inkblotSessions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                No sittings recorded yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.inkblotSessions.map((s) => (
                  <details key={s.id} className="card-soft rounded-2xl px-5 py-4">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <span>{formatDate(s.date)}</span>
                      <span className="text-[var(--color-muted)]">
                        {s.summary
                          ? `${s.summary.respondedCount} of ${s.summary.plateCount} plates · ${s.summary.wordCount} words`
                          : `${(s.responses || []).filter((r) => r.text).length} plates answered`}
                      </span>
                      {s.flagged && <FlagBadge />}
                    </summary>

                    {s.flagged && (
                      <p className="mt-3 text-xs text-[var(--color-flag-deep)]">
                        {(s.flagReasons || []).join('; ')}
                      </p>
                    )}

                    {s.summary?.recurring?.length > 0 && (
                      <p className="mt-3 text-xs text-[var(--color-muted)]">
                        Repeated across plates:{' '}
                        {s.summary.recurring.map((r) => `${r.word} (×${r.plates})`).join(', ')}
                      </p>
                    )}

                    <ul className="mt-4 space-y-3">
                      {(s.responses || [])
                        .filter((r) => r.text)
                        .map((r) => (
                          <li key={r.plateId} className="border-t border-[var(--line-1)] pt-3">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                              {plateLabel(r.plateId)}
                              {r.latencyMs != null && (
                                <span className="ml-2 normal-case tracking-normal">
                                  {Math.round(r.latencyMs / 1000)}s to first word
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{r.text}</p>
                          </li>
                        ))}
                    </ul>

                    <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-muted)]">
                      Responses are stored as written and are not scored. Counts and timings
                      are descriptive only.
                    </p>
                  </details>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="font-display text-xl">Assessments</h3>
            {data.summary.lastAssessment && (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Most recent: {data.summary.lastAssessment.instrumentName} ·{' '}
                <span className="text-[var(--color-ink)]">
                  {data.summary.lastAssessment.band?.label || 'No band recorded'}
                </span>
                {!data.summary.lastAssessment.reportsBandOnly &&
                  ` (${data.summary.lastAssessment.score}/${data.summary.lastAssessment.maxScore})`}
                {data.summary.lastAssessment.followUp &&
                  ` · day-to-day ${data.summary.lastAssessment.followUp.label.toLowerCase()}`}
                {' · '}
                {formatDate(data.summary.lastAssessment.date)}
              </p>
            )}
            {!data.assessments || data.assessments.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                No questionnaires completed yet.
              </p>
            ) : (
              <div className="card-soft mt-4 overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Instrument</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assessments.map((a) => (
                      <tr key={a.id} className="border-t border-[var(--line-1)] align-top">
                        <td className="whitespace-nowrap px-5 py-3">{formatDate(a.date)}</td>
                        <td className="px-5 py-3">
                          <span>{a.instrumentName}</span>
                          <span className="ml-2 text-xs text-[var(--color-muted)]">{a.domain}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {/* The C-SSRS has no total worth reading — its level
                              comes from the pattern of answers, not the sum. */}
                          {a.reportsBandOnly ? (
                            <span className="text-xs text-[var(--color-muted)]">Triage only</span>
                          ) : (
                            <>
                              {a.score}
                              <span className="text-xs text-[var(--color-muted)]">/{a.maxScore}</span>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[var(--color-ink-soft)]">{a.band?.label || 'No band recorded'}</span>
                          {a.flagged && (
                            <span className="ml-2 whitespace-nowrap rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag-deep)]">
                              {a.riskLevel === 'acute' ? 'At risk now' : 'Flagged'}
                            </span>
                          )}
                          {a.flagged && (a.flagReasons || []).length > 0 && (
                            <span className="mt-1 block text-xs leading-snug text-[var(--color-flag-deep)]">
                              {a.flagReasons.join(' · ')}
                            </span>
                          )}
                          {/* The PHQ-9's unscored difficulty question. Same
                              total, very different day, worth seeing next to
                              the band rather than buried in the raw answers. */}
                          {a.followUp && (
                            <span className="mt-1 block text-xs text-[var(--color-muted)]">
                              Day-to-day: {a.followUp.label.toLowerCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-muted)]">
              Scores place a resident in a range the published instrument defines. They are
              screening measures, not diagnoses.
            </p>
          </section>

          {/* Collapsed by default, like the inkblot sittings above it. A page
              that opens with somebody's conversations already unrolled invites
              reading them because they are there, rather than because there is
              a reason to. */}
          <section id="conversations" className="scroll-mt-6">
            <h3 className="font-display text-xl">Companion conversations</h3>
            {!data.chatSessions || data.chatSessions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                No conversations recorded yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.chatSessions.map((c) => (
                  <details key={c.id} className="card-soft rounded-2xl px-5 py-4">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <span>{formatDate(c.startedAt.slice(0, 10))}</span>
                      <span className="text-[var(--color-muted)]">
                        {c.turns.length} {c.turns.length === 1 ? 'message' : 'messages'}
                      </span>
                      {(c.topicLabels || []).map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-[var(--color-lavender-soft)] px-3 py-1 text-xs text-[var(--color-lavender-deep)]"
                        >
                          {label}
                        </span>
                      ))}
                      {c.flagged && (
                        <span className="rounded-full bg-[var(--color-flag-soft)] px-3 py-1 text-xs text-[var(--color-flag-deep)]">
                          {c.safetyLabels?.length
                            ? `Safety: ${c.safetyLabels.join(', ')}`
                            : 'Safety screen fired'}
                        </span>
                      )}
                    </summary>

                    <div className="mt-4 space-y-2.5">
                      {c.turns.map((t, i) => (
                        <div
                          key={i}
                          className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              t.role === 'user'
                                ? 'bg-[var(--color-teal-soft)] text-[var(--color-ink)]'
                                : 'border border-[var(--color-ink)]/12 text-[var(--color-ink-soft)]'
                            }`}
                          >
                            {t.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-muted)]">
              These are the resident&apos;s own words to the companion, and they were told the
              conversation is saved and readable by anyone they share their account with. It is a
              record of what they chose to say, not an assessment of them.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
