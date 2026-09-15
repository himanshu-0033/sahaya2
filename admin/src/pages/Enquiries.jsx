import { useEffect, useState } from 'react';
import { getEnquiries } from '../lib/api.js';

// What came in through the landing page's "bring it to your campus" form.
// Newest first, one card each, with the ways to reply one tap away: the form
// exists so that somebody here gets back to them.
export default function Enquiries() {
  const [enquiries, setEnquiries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEnquiries()
      .then((res) => !cancelled && setEnquiries(res.enquiries))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-3xl">Enquiries</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        From the form on the landing page, newest first.
      </p>

      {error && <p className="mt-6 text-sm text-[var(--color-flag-deep)]">{error}</p>}
      {!enquiries && !error && <p className="mt-6 text-sm text-[var(--color-muted)]">Loading…</p>}
      {enquiries?.length === 0 && (
        <p className="mt-6 text-sm text-[var(--color-muted)]">Nobody has sent the form yet.</p>
      )}

      {enquiries?.length > 0 && (
        <ul className="mt-6 space-y-3">
          {enquiries.map((q) => (
            <li key={q.id} className="card-soft rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {q.firstName} {q.lastName}
                    <span className="font-normal text-[var(--color-muted)]">
                      {' '}
                      · {q.role}, {q.organization}
                    </span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                    <span className="rounded-full bg-[var(--color-lavender-soft)] px-2.5 py-0.5 text-[var(--color-lavender-deep)]">
                      {q.type}
                    </span>
                    {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <a
                    href={`tel:${q.phone}`}
                    className="whitespace-nowrap rounded-full bg-[var(--color-lavender-deep)] px-4 py-1.5 text-white"
                  >
                    Call {q.phone}
                  </a>
                  <a
                    href={`mailto:${q.email}`}
                    className="whitespace-nowrap rounded-full border border-[var(--color-lavender-deep)] px-4 py-1.5 text-[var(--color-lavender-deep)]"
                  >
                    {q.email}
                  </a>
                </div>
              </div>

              {q.message && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {q.message}
                </p>
              )}
              {q.heardFrom?.length > 0 && (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Heard about us from: {q.heardFrom.join(', ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
