import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlagBadge from '../components/FlagBadge.jsx';
import MoodSparkline from '../components/MoodSparkline.jsx';
import { getResidents, inviteResident, logExport } from '../lib/api.js';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { moodLabel, daysSince } from '../lib/moods.js';

const FILTERS = [
  { key: 'all', label: 'Everyone' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'quiet', label: 'Quiet 3+ days' },
  { key: 'invited', label: 'Not joined' },
];

const SORTS = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'name', label: 'Name' },
  { key: 'recent', label: 'Last check-in' },
  { key: 'mood', label: 'Lowest mood' },
];

const CSV_COLUMNS = [
  { label: 'Name', value: (r) => r.name },
  { label: 'Email', value: (r) => r.email },
  { label: 'Phone', value: (r) => r.phone },
  { label: 'Date of birth', value: (r) => r.dob },
  { label: 'Joined', value: (r) => (r.onboarded ? 'yes' : 'invited only') },
  { label: 'Check-ins', value: (r) => r.totalCheckIns },
  { label: 'Streak (days)', value: (r) => r.streak },
  { label: 'Avg mood (last 7)', value: (r) => r.avgMoodRecent ?? '' },
  { label: 'Times flagged', value: (r) => r.flaggedCount },
  { label: 'Flagged recently', value: (r) => (r.flaggedRecently ? 'yes' : 'no') },
  { label: 'Last check-in', value: (r) => r.lastCheckIn?.date || '' },
  { label: 'Last mood', value: (r) => (r.lastCheckIn ? moodLabel(r.lastCheckIn.mood) : '') },
  { label: 'Last words', value: (r) => (r.lastCheckIn?.words || []).join(' / ') },
];

export default function Residents() {
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('attention');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResidents()
      .then((res) => !cancelled && setResidents(res.residents))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!residents) return [];
    const q = query.trim().toLowerCase();

    const filtered = residents.filter((r) => {
      if (filter === 'flagged' && !r.flaggedRecently) return false;
      if (filter === 'invited' && r.onboarded) return false;
      if (filter === 'quiet') {
        const gap = daysSince(r.lastCheckIn?.date);
        if (!r.onboarded) return false;
        if (gap !== null && gap < 3) return false;
      }
      if (!q) return true;
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        (r.lastCheckIn?.words || []).some((w) => w.toLowerCase().includes(q))
      );
    });

    const sorted = [...filtered];
    if (sort === 'name') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'recent') {
      sorted.sort((a, b) => (b.lastCheckIn?.date || '').localeCompare(a.lastCheckIn?.date || ''));
    } else if (sort === 'mood') {
      sorted.sort((a, b) => (a.avgMoodRecent ?? 99) - (b.avgMoodRecent ?? 99));
    }
    // 'attention' keeps the server's order: flagged first, then by name.
    return sorted;
  }, [residents, query, filter, sort]);

  function handleInvite(e) {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviteSaving(true);
    setInviteError(null);
    inviteResident({ name: inviteName, email: inviteEmail })
      .then((data) => {
        setResidents((prev) => [
          {
            ...data.resident,
            totalCheckIns: 0,
            streak: 0,
            flaggedCount: 0,
            flaggedRecently: false,
            avgMoodRecent: null,
            lastCheckIn: null,
            trend: [],
          },
          ...(prev || []),
        ]);
        setInviteName('');
        setInviteEmail('');
        setShowInvite(false);
      })
      .catch((err) => setInviteError(err.message))
      .finally(() => setInviteSaving(false));
  }

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10);
    // Logged before the file is built, and deliberately not awaited: a failed
    // audit write must not stop a counsellor reading their own caseload. A
    // missing entry is a visible gap; a blocked export is a broken console.
    logExport({ scope: 'cohort', rowCount: visible.length }).catch(() => {});
    downloadCsv(`sahay-residents-${stamp}.csv`, toCsv(CSV_COLUMNS, visible));
  }

  if (loading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;
  if (error) return <p className="text-sm text-[var(--color-flag)]">{error}</p>;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Residents</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            {visible.length} shown of {residents.length} · click anyone to see their full check-in
            history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={visible.length === 0}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-white/30 hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="rounded-full bg-[var(--color-lavender)] px-4 py-2 text-sm font-medium text-[#14121f]"
          >
            {showInvite ? 'Cancel' : 'Add resident'}
          </button>
        </div>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="card-soft flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Name
            </span>
            <input
              className="input-soft mt-1 w-full"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </label>
          <label className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Email
            </span>
            <input
              type="email"
              className="input-soft mt-1 w-full"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={inviteSaving}
            className="rounded-xl bg-[var(--color-teal)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {inviteSaving ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}
      {inviteError && <p className="text-sm text-[var(--color-flag)]">{inviteError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone, or a word they used…"
          className="input-soft min-w-[240px] flex-1"
        />
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                filter === f.key
                  ? 'bg-[var(--color-lavender)] text-[#14121f]'
                  : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-soft py-1.5 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} className="bg-[var(--color-cream-soft)]">
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        residents.length === 0 ? (
          /* An empty console is now the NORMAL first state, not a fault, and it
             has to say so — otherwise the honest answer ("nobody has shared with
             you") is indistinguishable from a broken deployment, and every one
             of those becomes a support conversation. Two things get explained
             here because both surprise people: that access is granted by the
             resident rather than by the allowlist, and that inviting someone is
             not the same as being given access to them. */
          <div className="card-soft rounded-2xl px-6 py-7">
            <h3 className="font-display text-xl">Nobody has shared with you yet.</h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Being on the counsellor allowlist lets you open this console. It does not give you
              access to anyone's check-ins — each person decides that for themselves, from the
              &ldquo;Who can see this&rdquo; page in their own account.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-muted)]">
              Ask the people you work with to add your address there. If you invite someone below,
              they will appear here straight away — but once they sign in and create their real
              account, they are only visible again if they choose to share.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Nobody matches this filter.</p>
        )
      ) : (
        <div className="space-y-2">
          {visible.map((r) => {
            const gap = daysSince(r.lastCheckIn?.date);
            return (
              <Link
                key={r.id}
                to={`/residents/${encodeURIComponent(r.id)}`}
                className="card-soft flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 transition-colors hover:border-[var(--color-lavender)]/40"
              >
                <div className="min-w-[180px] flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{r.email}</p>

                  {/* The reason, on the row. A risk screen brings its own
                      wording and outranks a check-in rule, so only one set
                      shows — a row that lists everything at once is a row
                      nobody reads. */}
                  {(r.riskScreen?.recent ? r.riskScreen.reasons : r.checkinFlagReasons)
                    ?.slice(0, 2)
                    .map((reason) => (
                      <p
                        key={reason}
                        className="mt-1 text-xs leading-snug text-[var(--color-flag)]"
                      >
                        {reason}
                      </p>
                    ))}
                </div>

                <div className="w-28 text-xs text-[var(--color-ink-soft)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    Last
                  </p>
                  <p className="mt-0.5">
                    {r.lastCheckIn
                      ? gap === 0
                        ? 'Today'
                        : `${gap}d ago`
                      : '—'}
                  </p>
                </div>

                <div className="w-24 text-xs text-[var(--color-ink-soft)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    Avg mood
                  </p>
                  <p className="mt-0.5">{r.avgMoodRecent ?? '—'}</p>
                </div>

                <div className="w-20 text-xs text-[var(--color-ink-soft)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    Streak
                  </p>
                  <p className="mt-0.5">{r.streak}d</p>
                </div>

                <div className="hidden w-[120px] md:block">
                  <MoodSparkline history={r.trend} height={28} barWidth={6} />
                </div>

                <FlagBadge resident={r} />
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--color-muted)]">
        Exported files contain residents' personal details — store them the way your institution
        requires, and delete them when you no longer need them.
      </p>
    </div>
  );
}
