import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import MoodSparkline from '../../shared/MoodSparkline.jsx';
import { getCaregiverResident } from '../../shared/api.js';
import { getSession } from '../auth/session.js';
import { MOOD_OPTIONS } from '../../shared/moods.js';

const moodLabel = (score) => MOOD_OPTIONS.find((m) => m.value === score)?.label || score;

export default function CaregiverResident() {
  const { residentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getSession()) {
      navigate('/caregiver');
      return;
    }
    getCaregiverResident(residentId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [residentId, navigate]);

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <Header />
        <Link to="/caregiver" className="mt-8 inline-block text-sm text-[var(--color-teal)] underline">
          ← All residents
        </Link>

        {error && <p className="mt-6 text-sm text-[var(--color-flag-deep)]">{error}</p>}

        {data && (
          <>
            <h2 className="font-display text-3xl mt-6">{data.resident.name}</h2>
            <p className="text-sm text-[var(--color-muted)]">{data.resident.email}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-[var(--color-cream-soft)] p-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Phone</p>
                <p className="mt-1">{data.resident.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Date of birth</p>
                <p className="mt-1">{data.resident.dob || '—'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--color-cream-soft)] p-6">
              <p className="text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase mb-3">
                Mood trend, last {data.history.slice(-14).length} check-ins
              </p>
              <MoodSparkline history={data.history.slice(-14)} height={56} barWidth={14} />
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-muted)]">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-teal)]" /> steady
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-flag)]" /> flagged day
                </span>
              </div>
            </div>

            {data.history.length === 0 && (
              <p className="mt-6 text-sm text-[var(--color-muted)]">
                Invited but hasn't signed in or checked in yet.
              </p>
            )}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Mood</th>
                    <th className="py-2 pr-4">Words</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.history].reverse().map((c) => (
                    <tr key={c.date} className="border-t border-[var(--color-ink)]/8">
                      <td className="py-2 pr-4 whitespace-nowrap">{c.date}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{moodLabel(c.mood)}</td>
                      <td className="py-2 pr-4">{(c.words || []).filter(Boolean).join(', ') || '—'}</td>
                      <td className="py-2 text-[var(--color-flag-deep)]">
                        {c.flagged ? c.flagReasons.join('; ') : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
