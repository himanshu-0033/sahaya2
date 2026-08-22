import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { getSession } from '../lib/session.js';
import { getCaregiverResidents, inviteResident } from '../lib/api.js';
import { MOOD_OPTIONS } from '../lib/moods.js';

const moodLabel = (score) => MOOD_OPTIONS.find((m) => m.value === score)?.label || score;

export default function Caregiver() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);
    getCaregiverResidents()
      .then((data) => setResidents(data.residents))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const flaggedCount = useMemo(
    () => (residents || []).filter((r) => r.flaggedRecently).length,
    [residents],
  );
  const activeCount = useMemo(
    () => (residents || []).filter((r) => r.lastCheckIn).length,
    [residents],
  );

  const visibleResidents = useMemo(() => {
    if (!residents) return [];
    const q = query.trim().toLowerCase();
    return residents.filter((r) => {
      if (flaggedOnly && !r.flaggedRecently) return false;
      if (!q) return true;
      return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    });
  }, [residents, query, flaggedOnly]);

  function handleAddResident(e) {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;
    setAddSaving(true);
    setAddError(null);
    inviteResident({ name: addName, email: addEmail })
      .then((data) => {
        setResidents((prev) => [...(prev || []), { ...data.resident, lastCheckIn: null, totalCheckIns: 0, streak: 0, flaggedRecently: false }]);
        setAddName('');
        setAddEmail('');
        setShowAddForm(false);
      })
      .catch((err) => setAddError(err.message))
      .finally(() => setAddSaving(false));
  }

  if (!session) {
    return (
      <div className="min-h-screen px-6 py-10 md:py-16">
        <div className="mx-auto max-w-xl">
          <Header />
          <h2 className="font-display text-3xl stack-block">Caregiver access</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Sign in with the Google account your caregiver access is registered under.
          </p>
          <div className="mt-6">
            <GoogleSignInButton dark onSignedIn={setSession} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Header />
        <h2 className="font-display text-3xl stack-block">Residents</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Flagged residents are surfaced first. This is a heuristic nudge, not a diagnosis.
        </p>

        {loading && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading…</p>}
        {error && <p className="mt-6 text-sm text-[var(--color-flag)]">{error}</p>}

        {residents && (
          <>
            <div className="mt-6 flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--color-ink-soft)]">
                <span className="text-[var(--color-flag)] font-medium">{flaggedCount}</span> flagged ·{' '}
                {activeCount} active · {residents.length} total
              </span>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="shrink-0 text-[var(--color-teal)] underline underline-offset-4"
              >
                {showAddForm ? 'Cancel' : '+ Add resident'}
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleAddResident}
                className="mt-4 flex flex-col gap-2 rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] p-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</label>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-ink)]/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="rounded-lg bg-[var(--color-teal)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {addSaving ? 'Adding…' : 'Add'}
                </button>
              </form>
            )}
            {addError && <p className="mt-2 text-sm text-[var(--color-flag)]">{addError}</p>}

            <div className="mt-4 flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 rounded-xl border border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-teal)]"
              />
              <button
                onClick={() => setFlaggedOnly((v) => !v)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                  flaggedOnly
                    ? 'border-[var(--color-flag)]/40 bg-[var(--color-flag-soft)] text-[var(--color-flag)]'
                    : 'border-[var(--color-ink)]/10 bg-[var(--color-cream-soft)] text-[var(--color-ink-soft)]'
                }`}
              >
                Flagged only
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {visibleResidents.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  {residents.length === 0 ? 'No residents yet.' : 'No residents match this search.'}
                </p>
              )}
              {visibleResidents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/caregiver/${r.id}`)}
                  className={`w-full rounded-2xl bg-[var(--color-cream-soft)] p-5 text-left shadow-sm transition-colors hover:brightness-125 ${
                    r.lastCheckIn ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">{r.email}</p>
                    </div>
                    {r.flaggedRecently ? (
                      <span className="rounded-full bg-[var(--color-flag-soft)] text-[var(--color-flag)] text-xs px-3 py-1">
                        Check in soon
                      </span>
                    ) : r.invited && !r.lastCheckIn ? (
                      <span className="rounded-full bg-[var(--color-teal-soft)] text-[var(--color-teal-dark)] text-xs px-3 py-1">
                        Invited
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    {r.lastCheckIn
                      ? `Last check-in ${r.lastCheckIn.date} · ${moodLabel(r.lastCheckIn.mood)}`
                      : r.invited
                        ? 'Invited, not joined yet'
                        : 'No check-ins yet'}{' '}
                    · streak {r.streak}d
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        <Link to="/" className="mt-8 inline-block text-sm text-[var(--color-teal)] underline">
          Back to check-in
        </Link>
      </div>
    </div>
  );
}
