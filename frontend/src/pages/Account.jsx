import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import LoadError from '../components/LoadError.jsx';
import { useSession } from '../lib/useSession.js';
import { clearSession } from '../lib/session.js';
import { getProfile, getSharing, shareWith, stopSharingWith } from '../lib/api.js';

// Account — which is, for now, entirely about who can see you.
//
// Every screen in the app that collects something now ends with a line saying
// nobody else sees it unless you invite a counsellor "from your account". This
// is that place. The promise and the control have to ship together: a privacy
// assurance pointing at a page that does not exist is worse than no assurance,
// because it reads as considered.
//
// The default state of this page is empty, and empty is the correct and
// expected state. It is written to read as reassuring rather than unfinished.

// A date someone can read. Both fields this renders — a date of birth and the
// day the account started — are dates and never times, so nothing here needs a
// timezone and nothing needs a library.
function readableDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

// The avatar. Google sends a picture claim; the app's own password tokens do
// not, so the initial is not a loading state — it is the other half of the
// design. Both are the same circle at the same size, so the layout does not
// shift depending on how someone signed in.
function Avatar({ name, picture }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl"
      style={{ background: 'var(--color-teal-soft)', color: 'var(--color-teal-dark)' }}
    >
      {initial}
    </span>
  );
}

// One labelled fact, rendered only when there is a value. A row reading
// "Phone —" is worse than no row: it looks like something that failed to load
// rather than something never filled in.
function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="marginalia">{label}</p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}

function ShareRow({ email, onRemove, removing }) {
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm">{email}</p>
        <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
          Can see your check-ins, questionnaire results and inkblot notes
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(email)}
        disabled={removing}
        className="press shrink-0 rounded-full border border-[var(--color-flag)]/35 px-4 py-2 text-xs text-[var(--color-flag)] transition-colors hover:bg-[var(--color-flag-soft)] disabled:opacity-50"
      >
        {removing ? 'Stopping…' : 'Stop sharing'}
      </button>
    </li>
  );
}

export default function Account() {
  const session = useSession();
  const [sharedWith, setSharedWith] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Details come from two places, and the local one wins on speed:
  // session.profile is a decoded token already in memory, so this card paints
  // immediately and never shows a spinner. The server profile carries what the
  // token does not — phone, date of birth, the day the account started — and
  // fills those in when it lands. If it never lands the card is still correct,
  // just shorter.
  const [profile, setProfile] = useState(null);

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [removingEmail, setRemovingEmail] = useState(null);

  // Its own effect rather than a Promise.all with the sharing list: a profile
  // that fails to load must not blank the list of people who can see you,
  // which is the more important thing on this page.
  useEffect(() => {
    if (!session) return;
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch(() => {
        // The token already carries the name and the email. Nothing to say.
      });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setLoadError(null);
    getSharing()
      .then((data) => setSharedWith(data.sharedWith || []))
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  }, [session, reloadKey]);

  function handleAdd(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSaving(true);
    setFormError(null);
    shareWith(value)
      .then((data) => {
        setSharedWith(data.sharedWith || []);
        setEmail('');
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setSaving(false));
  }

  function handleRemove(target) {
    setRemovingEmail(target);
    setFormError(null);
    stopSharingWith(target)
      .then((data) => setSharedWith(data.sharedWith || []))
      .catch((err) => setFormError(err.message))
      .finally(() => setRemovingEmail(null));
  }

  // Signing out is a hard navigation, not a router push. Clearing
  // sessionStorage does not clear what components are already holding — a
  // fetched check-in, a part-answered questionnaire, a chat transcript — and on
  // a shared laptop in a hostel common room "signed out" has to mean the next
  // person cannot press Back into any of it. A reload is the only thing that
  // actually empties the tab.
  function handleSignOut() {
    clearSession();
    window.location.assign('/');
  }

  const name = profile?.name || session?.profile?.name || '';
  const emailAddress = profile?.email || session?.profile?.email || '';

  return (
    <PageShell section="home">
      <Header eyebrow="Account" />

      <div className="animate-slide-up stack-block">
        <p className="marginalia">Your profile</p>
        <h1 className="font-display mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">
          You, and who
          <br />
          can see you.
        </h1>
        <p className="stack-item max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Your details, your totals, and the one setting that matters: your check-ins,
          questionnaire scores and inkblot notes are yours. Invite a counsellor here and they can
          follow along; remove them and they stop, straight away.
        </p>
      </div>

      <div className="stack-section">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg">You</h2>
          <span className="rule-fade flex-1" />
        </div>

        <div className="card stack-block p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar name={name} picture={session?.profile?.picture} />
            <div className="min-w-0">
              <p className="font-display truncate text-[1.35rem] leading-snug">{name || 'You'}</p>
              <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">{emailAddress}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
            <Fact label="Phone" value={profile?.phone} />
            <Fact label="Date of birth" value={readableDate(profile?.dob)} />
            <Fact label="Checking in since" value={readableDate(profile?.createdAt)} />
          </div>
        </div>

        <p className="stack-item max-w-md text-xs leading-relaxed text-[var(--color-muted)]">
          Only you, and anyone you invite below, can see this.
        </p>
      </div>

      {loadError && (
        <LoadError
          error={loadError}
          retrying={loading}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      )}

      {!loadError && (
        <div className="stack-section">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg">Shared with</h2>
            <span className="rule-fade flex-1" />
            <span className="marginalia num">{loading ? '—' : sharedWith.length}</span>
          </div>

          {loading ? (
            <p className="stack-block animate-pulse text-sm text-[var(--color-ink-soft)]">Loading…</p>
          ) : sharedWith.length === 0 ? (
            <p className="stack-block card px-5 py-6 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              You have not shared with anyone. Everything you have written stays between you and this
              app.
            </p>
          ) : (
            <ul className="stack-block flex flex-col gap-2">
              {sharedWith.map((e) => (
                <ShareRow
                  key={e}
                  email={e}
                  onRemove={handleRemove}
                  removing={removingEmail === e}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="stack-section">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg">Invite a counsellor</h2>
          <span className="rule-fade flex-1" />
        </div>

        <form className="stack-block" onSubmit={handleAdd}>
          <label className="marginalia block" htmlFor="share-email">
            Their email address
          </label>
          <input
            id="share-email"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="counsellor@example.com"
            className="mt-2 w-full rounded-xl border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-3 outline-none transition-colors placeholder:text-[var(--ink-placeholder)] focus:border-[var(--color-teal)]/60 focus:bg-[var(--surface-2)]"
          />
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            Use the address they sign in with. They will only see you once they open the counsellor
            console — nothing is emailed to them from here.
          </p>

          {formError && <p className="mt-3 text-sm text-[var(--color-flag)]">{formError}</p>}

          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="press mt-5 rounded-full bg-[var(--color-teal)] px-6 py-3 text-sm font-medium text-[#07080a] transition-colors hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]"
          >
            {saving ? 'Sharing…' : 'Share with them'}
          </button>
        </form>
      </div>

      <div className="rule-fade stack-section" />

      <p className="mt-6 max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
        Sharing is per person and works one way: they can read what you have written, they cannot
        write anything into your account, and they cannot invite anyone else to see it.
      </p>

      <div className="stack-section">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg">Sign out</h2>
          <span className="rule-fade flex-1" />
        </div>

        <p className="stack-block max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          This signs you out on this device only. Nothing is deleted — your check-ins, your streak
          and everyone you have shared with are all still here when you come back.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="press stack-block w-full rounded-full border border-[var(--line-3)] bg-[var(--surface-1)] py-3.5 text-sm font-medium transition-colors hover:bg-[var(--surface-3)] sm:w-auto sm:px-8"
        >
          Sign out
        </button>
      </div>

      <p className="mt-6 max-w-md pb-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
        On a shared or borrowed device, signing out is the safe way to leave — it empties this tab
        as well as forgetting you.
      </p>
    </PageShell>
  );
}
