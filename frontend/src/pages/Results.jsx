import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Button from '../components/Button.jsx';
import { getSession } from '../lib/session.js';
import { getStatus } from '../lib/api.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [record, setRecord] = useState(location.state?.record || null);
  const [loading, setLoading] = useState(!location.state?.record);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    if (record) return;
    getStatus()
      .then((data) => {
        if (data.record) setRecord(data.record);
        else navigate('/');
      })
      .finally(() => setLoading(false));
  }, [session, record, navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <Header />

        {loading || !record ? (
          <p className="mt-10 text-[var(--color-ink-soft)]">Loading today's pass…</p>
        ) : (
          <>
            <div className="mt-8 rounded-3xl p-8 bg-gradient-to-br from-[var(--color-amber)]/15 to-[var(--color-teal-soft)] shadow-sm">
              <p className="text-xs tracking-[0.2em] text-[var(--color-ink-soft)] uppercase">
                Thought for today
              </p>
              <p className="font-display text-2xl md:text-3xl leading-snug mt-4">
                {record.thought}
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-[var(--color-cream-soft)] p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase">
                  Dinner pass
                </p>
                <span className="rounded-full border border-[var(--color-teal)]/40 px-3 py-1 text-xs text-[var(--color-teal-dark)]">
                  Valid
                </span>
              </div>
              <p className="font-display text-3xl mt-3">{record.dinnerPassCode}</p>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">{formatDate(record.date)}</p>
              <hr className="my-4 border-dashed border-[var(--color-ink)]/15" />
              <p className="text-sm text-[var(--color-ink-soft)]">
                Show this at the dining hall. Your check-in for today is complete.
              </p>
            </div>

            <p className="mt-6 text-xs text-center text-[var(--color-muted)]">
              Sahay AI is a reflective prototype, not a medical device. If you feel unsafe,
              contact a local helpline, your warden or a professional.
            </p>

            <Button className="mt-6" variant="secondary" onClick={() => navigate('/')}>
              Done
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
