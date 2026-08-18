import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Button from '../components/Button.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import RoomForm from '../components/RoomForm.jsx';
import { getSession, getRoom, saveRoom } from '../lib/session.js';
import { getStatus } from '../lib/api.js';

export default function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [room, setRoom] = useState(() => (session ? getRoom(session.profile.sub) : ''));
  const [status, setStatus] = useState({ loading: false, checkedIn: false, record: null, error: null });

  useEffect(() => {
    if (!session || !room) return;
    setStatus((s) => ({ ...s, loading: true }));
    getStatus()
      .then((data) => setStatus({ loading: false, checkedIn: data.checkedIn, record: data.record, error: null }))
      .catch((err) => setStatus({ loading: false, checkedIn: false, record: null, error: err.message }));
  }, [session, room]);

  return (
    <div className="min-h-screen px-6 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <Header />

        {!session ? (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10">
              Sign in to check in.
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              We use your Google account so your caregiver knows whose check-in this is.
            </p>
            <div className="mt-8">
              <GoogleSignInButton onSignedIn={setSession} />
            </div>
          </>
        ) : !room ? (
          <RoomForm
            name={session.profile.name}
            onDone={(r) => {
              saveRoom(session.profile.sub, r);
              setRoom(r);
            }}
          />
        ) : status.checkedIn ? (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10">
              You're checked in for today, {session.profile.name.split(' ')[0]}.
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
