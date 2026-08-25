import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MoodSparkline from '../components/MoodSparkline.jsx';
import StatCard from '../components/StatCard.jsx';
import FlagBadge from '../components/FlagBadge.jsx';
import { getResident } from '../lib/api.js';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { formatDate, moodLabel, moodColor, daysSince } from '../lib/moods.js';

const CSV_COLUMNS = [
  { label: 'Date', value: (c) => c.date },
  { label: 'Mood', value: (c) => moodLabel(c.mood) },
  { label: 'Mood score', value: (c) => c.moodScore },
  { label: 'Words', value: (c) => (c.words || []).join(' / ') },
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
          <p className="font-display text-xl text-[var(--color-flag)]">
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
            className="whitespace-nowrap rounded-full bg-[var(--color-flag)] px-4 py-2 text-sm font-medium text-white"
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
        anything is — no instrument does that for an individual person
        {risk.totalFlagged > 1 && ` · ${risk.totalFlagged} flagged sittings in total`}.
      </p>
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm">{value || '—'}</p>
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
    downloadCsv(`sahay-${name}-checkins.csv`, toCsv(CSV_COLUMNS, [...data.history].reverse()));
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Link
        to="/residents"
        className="inline-block text-sm text-[var(--color-lavender)] underline underline-offset-4"
      >
        ← All residents
      </Link>

      {loading && <p className="text-sm text-[var(--color-muted)]">Loading…</p>}
      {error && <p className="text-sm text-[var(--color-flag)]">{error}</p>}

      {data && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">{data.resident.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{data.resident.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <FlagBadge resident={data.summary} />
              <button
                onClick={handleExport}
                disabled={data.history.length === 0}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-white/30 hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
          </div>

          <RiskBanner risk={data.summary.riskScreen} resident={data.resident} />

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
              value={data.summary.avgMoodRecent ?? '—'}
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

          <section className="card-soft rounded-2xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Contact details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Phone" value={data.resident.phone} />
              <Field label="Date of birth" value={data.resident.dob} />
              <Field label="Occupation" value={data.resident.occupation} />
              <Field label="Address" value={data.resident.address} />
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
                        <tr key={c.date} className="border-t border-white/6 align-top">
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
                            {(c.words || []).join(', ')}
                          </td>
                          <td className="px-5 py-3 text-xs text-[var(--color-flag)]">
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
                        {s.summary.respondedCount} of {s.summary.plateCount} plates ·{' '}
                        {s.summary.wordCount} words
                      </span>
                      {s.flagged && <FlagBadge />}
                    </summary>

                    {s.flagged && (
                      <p className="mt-3 text-xs text-[var(--color-flag)]">
                        {(s.flagReasons || []).join('; ')}
                      </p>
                    )}

                    {s.summary.recurring.length > 0 && (
                      <p className="mt-3 text-xs text-[var(--color-muted)]">
                        Repeated across plates:{' '}
                        {s.summary.recurring.map((r) => `${r.word} (×${r.plates})`).join(', ')}
                      </p>
                    )}

                    <ul className="mt-4 space-y-3">
                      {s.responses
                        .filter((r) => r.text)
                        .map((r) => (
                          <li key={r.plateId} className="border-t border-white/6 pt-3">
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
                Most recent: {data.summary.lastAssessment.instrumentName} —{' '}
                <span className="text-[var(--color-ink)]">
                  {data.summary.lastAssessment.band.label}
                </span>{' '}
                ({data.summary.lastAssessment.score}/{data.summary.lastAssessment.maxScore})
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
                      <tr key={a.id} className="border-t border-white/6 align-top">
                        <td className="whitespace-nowrap px-5 py-3">{formatDate(a.date)}</td>
                        <td className="px-5 py-3">
                          <span>{a.instrumentName}</span>
                          <span className="ml-2 text-xs text-[var(--color-muted)]">{a.domain}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {a.score}
                          <span className="text-xs text-[var(--color-muted)]">/{a.maxScore}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[var(--color-ink-soft)]">{a.band.label}</span>
                          {a.flagged && (
                            <span className="ml-2 whitespace-nowrap rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag)]">
                              {a.riskLevel === 'acute' ? 'At risk now' : 'Flagged'}
                            </span>
                          )}
                          {a.flagged && (a.flagReasons || []).length > 0 && (
                            <span className="mt-1 block text-xs leading-snug text-[var(--color-flag)]">
                              {a.flagReasons.join(' · ')}
                            </span>
                          )}
                          {/* The PHQ-9's unscored difficulty question. Same
                              total, very different day — worth seeing next to
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
        </>
      )}
    </div>
  );
}
