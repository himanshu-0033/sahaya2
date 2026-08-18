import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { getSession } from '../lib/session.js';
import { getCaregiverResidents } from '../lib/api.js';
import { MOOD_OPTIONS } from '../lib/moods.js';

const moodLabel = (score) => MOOD_OPTIONS.find((m) => m.value === score)?.label || score;

export default function Caregiver() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [residents, setResidents] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);
    getCaregiverResidents()
      .then((data) => setResidents(data.residents))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen px-6 py-10 md:py-16">
        <div className="mx-auto max-w-xl">
          <Header />
          <h2 className="font-display text-3xl mt-10">Caregiver access</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Sign in with the Google account your caregiver access is registered under.
          </p>
          <div className="mt-6">
            <GoogleSignInButton onSignedIn={setSession} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Header />
        <h2 className="font-display text-3xl mt-10">Residents</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Flagged residents are surfaced first. This is a heuristic nudge, not a diagnosis.
        </p>

        {loading && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading…</p>}
        {error && <p className="mt-6 text-sm text-[var(--color-flag)]">{error}</p>}

        {residents && (
          <div className="mt-6 space-y-3">
            {residents.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">No check-ins recorded yet.</p>
            )}
            {residents.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/caregiver/${r.id}`)}
                className="w-full rounded-2xl bg-[var(--color-cream-soft)] p-5 text-left shadow-sm hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{r.room}</p>
                  </div>
                  {r.flaggedRecently && (
                    <span className="rounded-full bg-[var(--color-flag-soft)] text-[var(--color-flag)] text-xs px-3 py-1">
                      Check in soon
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  {r.lastCheckIn
                    ? `Last check-in ${r.lastCheckIn.date} · ${moodLabel(r.lastCheckIn.mood)}`
                    : 'No check-ins yet'}{' '}
                  · streak {r.streak}d
                </p>
              </button>
            ))}
          </div>
        )}

        <Link to="/" className="mt-8 inline-block text-sm text-[var(--color-teal)] underline">
          Back to check-in
        </Link>
      </div>
    </div>
  );
}
