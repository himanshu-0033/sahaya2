import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Button from '../components/Button.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import PhoneSignInButton from '../components/PhoneSignInButton.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import AccountForm from '../components/AccountForm.jsx';
import AmbientBlots from '../components/AmbientBlots.jsx';
import { getSession } from '../lib/session.js';
import { getStatus, getProfile, saveProfile } from '../lib/api.js';

export default function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [status, setStatus] = useState({ loading: false, checkedIn: false, record: null, error: null });

  useEffect(() => {
    if (!session) return;
    setProfileLoading(true);
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch((err) => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  }, [session]);

  useEffect(() => {
    if (!session || !profile) return;
    setStatus((s) => ({ ...s, loading: true }));
    getStatus()
      .then((data) => setStatus({ loading: false, checkedIn: data.checkedIn, record: data.record, error: null }))
      .catch((err) => setStatus({ loading: false, checkedIn: false, record: null, error: err.message }));
  }, [session, profile]);

  function handleCreateAccount(values) {
    setSavingProfile(true);
    setProfileError(null);
    saveProfile(values)
      .then((data) => setProfile(data.profile))
      .catch((err) => setProfileError(err.message))
      .finally(() => setSavingProfile(false));
  }

  return (
    <div className="relative min-h-screen px-6 py-10 md:py-16">
      <AmbientBlots />
      <div className="mx-auto max-w-xl">
        <Header />

        {!session ? (
          <>
            <div className="mt-10 flex justify-center animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <span className="rounded-full bg-[var(--color-teal-soft)] px-4 py-1 text-xs tracking-[0.15em] text-[var(--color-teal-dark)] uppercase">
                A quiet minute, once a day
              </span>
            </div>
            <h2
              className="font-display text-4xl md:text-5xl leading-tight mt-6 text-center animate-fade-up"
              style={{ animationDelay: '0.15s' }}
            >
              Sign in to check in.
            </h2>
            <p
              className="mt-4 text-center text-[var(--color-ink-soft)] animate-fade-up"
              style={{ animationDelay: '0.28s' }}
            >
              We use your Google account so your caregiver knows whose check-in this is.
            </p>
            <div
              className="mt-10 flex flex-col items-center gap-3 animate-fade-up"
              style={{ animationDelay: '0.42s' }}
            >
              <div className="animate-soft-pulse rounded-full">
                <GoogleSignInButton onSignedIn={setSession} />
              </div>
              <PhoneSignInButton />
            </div>
            <div
              className="mt-10 animate-fade-up"
              style={{ animationDelay: '0.55s' }}
            >
              <CrisisContacts />
            </div>
          </>
        ) : profileLoading ? (
          <p className="mt-10 text-[var(--color-ink-soft)]">Loading your account…</p>
        ) : profileError && !profile ? (
          <p className="mt-10 text-sm text-[var(--color-flag)]">
            Couldn't reach the server: {profileError}
          </p>
        ) : !profile ? (
          <AccountForm
            name={session.profile.name}
            email={session.profile.email}
            onDone={handleCreateAccount}
            saving={savingProfile}
            error={profileError}
          />
        ) : status.checkedIn ? (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10 animate-fade-up">
              You're checked in for today, {profile.name.split(' ')[0]}.
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)] animate-fade-up" style={{ animationDelay: '0.12s' }}>
              Come back tomorrow for your next check-in — or view today's dinner pass again below.
            </p>
            <Button
              className="mt-8 animate-fade-up"
              style={{ animationDelay: '0.24s' }}
              onClick={() => navigate('/results', { state: { record: status.record } })}
            >
              View today's pass
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mt-10 animate-fade-up">
              Thirty seconds. Three inkblots. Then your dinner pass.
            </h2>
            <p className="mt-4 text-[var(--color-ink-soft)] animate-fade-up" style={{ animationDelay: '0.12s' }}>
              Say the first word each shape brings up. Finish the check-in to collect today's
              thought and your dinner pass.
            </p>
            <Button
              className="mt-8 animate-fade-up"
              style={{ animationDelay: '0.24s' }}
              onClick={() => navigate('/checkin')}
              disabled={status.loading}
            >
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
