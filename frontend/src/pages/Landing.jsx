import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Button from '../components/Button.jsx';
import OnboardingForm from '../components/OnboardingForm.jsx';
import { getIdentity, saveIdentity } from '../lib/identity.js';
import { getStatus } from '../lib/api.js';

export default function Landing() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(() => getIdentity());
  const [status, setStatus] = useState({ loading: false, checkedIn: false, record: null, error: null });

  useEffect(() => {
    if (!identity) return;
    setStatus((s) => ({ ...s, loading: true }));
    getStatus(identity.id)
      .then((data) => setStatus({ loading: false, checkedIn: data.checkedIn, record: data.record, error: null }))
      .catch((err) => setStatus({ loading: false, checkedIn: false, record: null, error: err.message }));
  }, [identity]);

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <Header />

        {!identity ? (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10">
              Let's get to know you first.
            </h2>
            <OnboardingForm onDone={(info) => setIdentity(saveIdentity(info))} />
          </>
        ) : status.checkedIn ? (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10">
              You're checked in for today, {identity.name.split(' ')[0]}.
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              Come back tomorrow for your next check-in — or view today's dinner pass again below.
            </p>
            <Button className="mt-8" onClick={() => navigate('/results', { state: { record: status.record } })}>
              View today's pass
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10">
              Thirty seconds. Three inkblots. Then your dinner pass.
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              Say the first word each shape brings up. Finish the check-in to collect today's
              thought and your dinner pass.
            </p>
            <Button className="mt-8" onClick={() => navigate('/checkin')} disabled={status.loading}>
              Start today's check-in
            </Button>
            <ol className="mt-8 space-y-2 text-sm text-[var(--color-ink-soft)]">
              <li>1 · Look at each plate for 10 seconds</li>
              <li>2 · Type one word, tap one mood</li>
              <li>3 · Collect your quote and dinner pass</li>
            </ol>
            {status.error && (
              <p className="mt-6 text-sm text-[var(--color-flag)]">
                Couldn't reach the server — you can still check in, it will save once you're back online.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
