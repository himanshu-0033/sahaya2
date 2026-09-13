import { useEffect, useState } from 'react';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import { useSession } from '../auth/useSession.js';
import { clearSession } from '../auth/session.js';
import {
  getProfile,
  getSharing,
  saveProfile,
  shareWith,
  stopSharingWith,
  changePassword,
} from '../../shared/api.js';

// Account — your details, who can see them, and the two things about the
// account itself you can change from here.
//
// Every screen in the app that collects something now ends with a line saying
// nobody else sees it unless you invite a counsellor "from your account". This
// is that place. The promise and the control have to ship together: a privacy
// assurance pointing at a page that does not exist is worse than no assurance,
// because it reads as considered.
//
// The sharing list's default state is empty, and empty is the correct and
// expected state. It is written to read as reassuring rather than unfinished.

const MIN_PASSWORD = 8;

// One input style for the whole page. Three forms live here now, and three
// hand-copied class strings is how they drift apart.
const INPUT =
  'w-full rounded-xl border border-[var(--line-2)] bg-[var(--surface-1)] px-4 py-3 outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-teal)]/60 focus:bg-[var(--surface-2)]';

const BUTTON =
  'press rounded-full bg-[var(--color-teal)] px-6 py-3 text-sm font-medium text-[#07080a] transition-colors hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]';

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
// "Phone, with nothing after it" is worse than no row: it looks like something that failed to load
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

// The same header on every section: a name, a hairline, and sometimes a count.
function SectionHead({ title, count = null }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="font-display text-lg">{title}</h2>
      <span className="rule-fade flex-1" />
      {count !== null && <span className="marginalia num">{count}</span>}
    </div>
  );
}

// Label above the input, the reason for asking below it. Never a placeholder
// doing a label's job: a placeholder disappears on the first keystroke, which
// is exactly when someone stops being sure what they are typing into.
function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label className="marginalia block" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

// Saved, or refused, said once and quietly. A form that accepts a change and
// then looks identical leaves people pressing the button a second time.
function Note({ tone = 'ok', children }) {
  if (!children) return null;
  const color = tone === 'bad' ? 'var(--color-flag-deep)' : 'var(--color-teal-dark)';
  return (
    <p role="status" className="text-sm" style={{ color }}>
      {children}
    </p>
  );
}

function ShareRow({ email, onRemove, removing }) {
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm">{email}</p>
        <p className="mt-0.5 text-[0.6875rem] text-[var(--color-muted)]">
          Can see your check-ins, questionnaire results and inkblot notes
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(email)}
        disabled={removing}
        className="press shrink-0 rounded-full border border-[var(--color-flag)]/35 px-4 py-2 text-xs text-[var(--color-flag-deep)] transition-colors hover:bg-[var(--color-flag-soft)] disabled:opacity-50"
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

  // The edit form stays null until the profile lands, so it can never start
  // life holding blanks and then save them over real values.
  const [details, setDetails] = useState(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsNote, setDetailsNote] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwNote, setPwNote] = useState(null);
  const [pwError, setPwError] = useState(null);

  // Its own effect rather than a Promise.all with the sharing list: a profile
  // that fails to load must not blank the list of people who can see you,
  // which is the more important thing on this page.
  useEffect(() => {
    if (!session) return;
    getProfile()
      .then((data) => {
        setProfile(data.profile);
        if (data.profile) {
          setDetails({
            name: data.profile.name || '',
            phone: data.profile.phone || '',
            dob: data.profile.dob || '',
          });
        }
      })
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

  function handleSaveDetails(e) {
    e.preventDefault();
    if (!details) return;
    // The server keeps the stored name rather than saving a blank one, so
    // submitting an empty field would look like it had silently ignored you.
    if (!details.name.trim()) {
      setDetailsNote(null);
      setDetailsError('Your name cannot be blank.');
      return;
    }
    setSavingDetails(true);
    setDetailsNote(null);
    setDetailsError(null);
    // The email goes back unchanged. It is the account itself — the address
    // sign-in matches on, and the one a counsellor is invited by — so it is
    // shown here and edited nowhere.
    saveProfile({ ...details, email: profile?.email || session?.profile?.email || '' })
      .then((data) => {
        setProfile((p) => ({ ...p, ...data.profile }));
        setDetailsNote('Saved.');
      })
      .catch((err) => setDetailsError(err.message))
      .finally(() => setSavingDetails(false));
  }

  function handleChangePassword(e) {
    e.preventDefault();
    setPwNote(null);
    setPwError(null);
    // Both checks exist on the server too. They are repeated here so that a
    // typo costs a glance rather than a round trip.
    if (pw.next.length < MIN_PASSWORD) {
      setPwError(`New password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError('The two new passwords do not match.');
      return;
    }
    setSavingPw(true);
    changePassword({ currentPassword: pw.current, password: pw.next })
      .then(() => {
        setPw({ current: '', next: '', confirm: '' });
        setPwNote('Password changed. Use the new one next time you sign in.');
      })
      .catch((err) => setPwError(err.message))
      .finally(() => setSavingPw(false));
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
  const hasPassword = profile?.hasPassword;

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
          Your details, and the one setting that matters: your check-ins, questionnaire scores and
          inkblot notes are yours. Invite a counsellor here and they can follow along; remove them
          and they stop, straight away.
        </p>
      </div>

      <div className="stack-section">
        <SectionHead title="You" />

        {/* Identity on the left, the facts in a column beside it once there is
            room for one. In a two-up grid the third fact sat alone against an
            empty half, which read as a card that had failed to finish loading
            rather than as a card with three things in it. */}
        <div className="card stack-block p-5 sm:p-6 lg:flex lg:items-center lg:gap-8">
          <div className="flex items-center gap-4 lg:min-w-0 lg:flex-1">
            <Avatar name={name} picture={session?.profile?.picture} />
            <div className="min-w-0">
              <p className="font-display truncate text-[1.35rem] leading-snug">{name || 'You'}</p>
              <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">{emailAddress}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--line-1)] pt-5 sm:grid-cols-3 lg:mt-0 lg:w-60 lg:shrink-0 lg:grid-cols-1 lg:gap-y-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <Fact label="Phone" value={profile?.phone} />
            <Fact label="Date of birth" value={readableDate(profile?.dob)} />
            <Fact label="Checking in since" value={readableDate(profile?.createdAt)} />
          </div>
        </div>

        <p className="stack-item max-w-md text-xs leading-relaxed text-[var(--color-muted)]">
          Only you, and anyone you invite below, can see this.
        </p>
      </div>

      <div className="stack-section">
        <SectionHead title="Update details" />

        {details === null ? (
          // Shaped like the form it becomes, so nothing below it jumps when the
          // profile lands. A spinner here would move the rest of the page twice.
          <div className="stack-block flex flex-col gap-5" aria-hidden="true">
            <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-1)]" />
            <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-1)]" />
            <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-1)]" />
          </div>
        ) : (
          <form className="stack-block flex flex-col gap-5" onSubmit={handleSaveDetails}>
            <Field label="Full name" htmlFor="detail-name">
              <input
                id="detail-name"
                value={details.name}
                onChange={(ev) => setDetails((d) => ({ ...d, name: ev.target.value }))}
                className={INPUT}
              />
            </Field>

            <Field
              label="Phone"
              htmlFor="detail-phone"
              hint="Only used to reach you if you ever lose access to this account."
            >
              <input
                id="detail-phone"
                type="tel"
                value={details.phone}
                onChange={(ev) => setDetails((d) => ({ ...d, phone: ev.target.value }))}
                placeholder="+91 98765 43210"
                className={INPUT}
              />
            </Field>

            <Field
              label="Date of birth"
              htmlFor="detail-dob"
              hint="So the app knows which questionnaires are appropriate to offer you."
            >
              <input
                id="detail-dob"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={details.dob}
                onChange={(ev) => setDetails((d) => ({ ...d, dob: ev.target.value }))}
                className={`input-soft ${INPUT}`}
              />
            </Field>

            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              Your email address is the account itself, so it stays as {emailAddress}.
            </p>

            {detailsError && <Note tone="bad">{detailsError}</Note>}
            {detailsNote && <Note>{detailsNote}</Note>}

            <div>
              <button type="submit" disabled={savingDetails} className={BUTTON}>
                {savingDetails ? 'Saving…' : 'Save details'}
              </button>
            </div>
          </form>
        )}
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
          <SectionHead title="Shared with" count={loading ? '…' : sharedWith.length} />

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
        <SectionHead title="Invite a counsellor" />

        <form className="stack-block flex flex-col gap-5" onSubmit={handleAdd}>
          <Field
            label="Their email address"
            htmlFor="share-email"
            hint="Use the address they sign in with. They will only see you once they open the counsellor console, and nothing is emailed to them from here."
          >
            <input
              id="share-email"
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="counsellor@example.com"
              className={INPUT}
            />
          </Field>

          {formError && <Note tone="bad">{formError}</Note>}

          <div>
            <button type="submit" disabled={saving || !email.trim()} className={BUTTON}>
              {saving ? 'Sharing…' : 'Share with them'}
            </button>
          </div>
        </form>

        <p className="stack-item max-w-md text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
          Sharing is per person and works one way: they can read what you have written, they cannot
          write anything into your account, and they cannot invite anyone else to see it.
        </p>
      </div>

      <div className="stack-section">
        <SectionHead title="Password" />

        {hasPassword === false ? (
          <p className="stack-block max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
            You sign in with Google, so this account has no password of its own. Google holds it, and
            that is where you change it.
          </p>
        ) : (
          <form className="stack-block flex flex-col gap-5" onSubmit={handleChangePassword}>
            {/* The current password is asked for even though the request that
                follows already carries a valid session. A session proves this
                tab was signed in at some point, not that the person at the
                keyboard right now is the one it belongs to. */}
            <Field
              label="Current password"
              htmlFor="pw-current"
              hint="Asked for so a signed-in tab left open on a shared machine cannot be used to lock you out."
            >
              <input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={pw.current}
                onChange={(ev) => setPw((p) => ({ ...p, current: ev.target.value }))}
                className={INPUT}
              />
            </Field>

            <Field
              label="New password"
              htmlFor="pw-next"
              hint={`At least ${MIN_PASSWORD} characters.`}
            >
              <input
                id="pw-next"
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={(ev) => setPw((p) => ({ ...p, next: ev.target.value }))}
                className={INPUT}
              />
            </Field>

            <Field label="New password again" htmlFor="pw-confirm">
              <input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(ev) => setPw((p) => ({ ...p, confirm: ev.target.value }))}
                className={INPUT}
              />
            </Field>

            {pwError && <Note tone="bad">{pwError}</Note>}
            {pwNote && <Note>{pwNote}</Note>}

            <div>
              <button
                type="submit"
                disabled={savingPw || !pw.current || !pw.next || !pw.confirm}
                className={BUTTON}
              >
                {savingPw ? 'Changing…' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="stack-section">
        <SectionHead title="Sign out" />

        <p className="stack-block max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          This signs you out on this device only. Nothing is deleted. Your check-ins, your streak and
          everyone you have shared with are all still here when you come back.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="press stack-block w-full rounded-full border border-[var(--line-3)] bg-[var(--surface-1)] py-3.5 text-sm font-medium transition-colors hover:bg-[var(--surface-3)] sm:w-auto sm:px-8"
        >
          Sign out
        </button>

        <p className="stack-item max-w-md pb-2 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
          On a shared or borrowed device, signing out is the safe way to leave. It empties this tab
          as well as forgetting you.
        </p>
      </div>
    </PageShell>
  );
}
