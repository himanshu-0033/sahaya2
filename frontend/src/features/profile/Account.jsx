import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
import { EMAIL_MESSAGE, PHONE_MESSAGE, isValidEmail, isValidPhone } from '../../shared/contact.js';

// Account: your details, who can see them, your password, and signing out.
//
// Laid out the way account pages in the apps people already use are: a profile
// card with a menu on the left, and the chosen section on the right as rows of
// label and value, each with its own edit button. On a phone the menu sits above
// the section and picking one scrolls to it.
//
// Every screen in the app that collects something ends with a line saying
// nobody else sees it unless you invite a counsellor "from your account". This
// is that place, so "Who can see this" is one tap from the top, and its empty
// state is written to read as reassuring rather than unfinished.
//
// Phone and date of birth are partly hidden until you edit them. This is used
// on shared hostel laptops, and a profile page left open should not read out
// someone's number to whoever sits down next.

const MIN_PASSWORD = 8;

const INPUT =
  'w-full rounded-xl border border-[var(--line-2)] bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-teal)]';

const BUTTON =
  'press rounded-full bg-[var(--color-teal-dark)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

const GHOST =
  'press rounded-full border border-[var(--line-2)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--surface-2)]';

function readableDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

const maskPhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 4 ? `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}` : phone;
};

const maskDob = (dob) => (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) ? `••/••/${dob.slice(0, 4)}` : dob);

// Google sends a picture; the app's own password tokens do not, so the initial
// is the other half of the design rather than a loading state.
function Avatar({ name, picture }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        width={96}
        height={96}
        className="h-24 w-24 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="font-display flex h-24 w-24 items-center justify-center rounded-full text-4xl"
      style={{ background: 'var(--color-teal-soft)', color: 'var(--color-teal-dark)' }}
    >
      {initial}
    </span>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

// Saved, or refused, said once and quietly.
function Note({ tone = 'ok', children }) {
  if (!children) return null;
  const color = tone === 'bad' ? 'var(--color-flag-deep)' : 'var(--color-teal-dark)';
  // A screen reader is told about this, which it was not before: a save that
  // failed used to change the screen silently, so the only way to find out was
  // to notice the button had stopped saying "Saving".
  //
  // The role follows the tone. `alert` interrupts whatever is being read,
  // which is right for a failure and rude for "Saved".
  return (
    <p role={tone === 'bad' ? 'alert' : 'status'} className="text-sm" style={{ color }}>
      {children}
    </p>
  );
}

// The right-hand panel: a title and a line under it, then its rows.
function Panel({ title, sub, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-dashed border-[var(--line-2)] px-5 py-5 sm:px-7">
        <h2 className="font-display text-xl">{title}</h2>
        {sub && <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

// One label-and-value row. `onEdit` puts the pencil on it; `editor` is what the
// row turns into while it is being edited.
function DetailRow({ label, value, onEdit, editing, editor, note }) {
  return (
    <div className="border-b border-[var(--line-1)] px-5 py-4 last:border-b-0 sm:px-7">
      {editing ? (
        editor
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 truncate text-[0.9375rem] font-medium">{value || 'Not added'}</p>
            {note && <p role="status" className="mt-1 text-xs text-[var(--color-muted)]">{note}</p>}
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${label.toLowerCase()}`}
              className="press shrink-0 rounded-full p-2 text-[var(--color-teal-dark)] transition-colors hover:bg-[var(--surface-2)]"
            >
              <Pencil />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const FIELDS = {
  name: { label: 'Full name', type: 'text', autoComplete: 'name' },
  phone: { label: 'Mobile number', type: 'tel', autoComplete: 'tel', hint: 'Only used to reach you if you ever lose access to this account.' },
  dob: { label: 'Date of birth', type: 'date', hint: 'So the app knows which questionnaires are appropriate to offer you.' },
};

export default function Account() {
  const session = useSession();
  const panelRef = useRef(null);
  const [section, setSection] = useState(() =>
    typeof window !== 'undefined' && window.location.hash === '#sharing' ? 'sharing' : 'details',
  );

  const [sharedWith, setSharedWith] = useState([]);
  // Counsellors the institution assigned. Listed as such, and not removable here.
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The token already carries the name and email, so the page paints at once;
  // the server profile fills in phone, date of birth and the start date.
  const [profile, setProfile] = useState(null);

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [removingEmail, setRemovingEmail] = useState(null);

  // Which detail is being edited, and its draft. Editing is only offered once
  // the profile has landed, so a save can never write blanks over real values.
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsNote, setDetailsNote] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwNote, setPwNote] = useState(null);
  const [pwError, setPwError] = useState(null);

  // Its own effect rather than a Promise.all with the sharing list: a profile
  // that fails to load must not blank the list of people who can see you.
  useEffect(() => {
    if (!session) return;
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setLoadError(null);
    getSharing()
      .then((data) => {
        setSharedWith(data.sharedWith || []);
        setAssigned(data.assigned || []);
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  }, [session, reloadKey]);

  function pick(next) {
    setSection(next);
    setEditing(null);
    // On a phone the panel is under the menu; bring it into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function startEdit(field) {
    setEditing(field);
    setDraft(profile?.[field] || '');
    setDetailsNote(null);
    setDetailsError(null);
  }

  function saveField(e) {
    e.preventDefault();
    // The server keeps the stored name rather than saving a blank one, so an
    // empty field would look like it had silently ignored you.
    if (editing === 'name' && !draft.trim()) {
      setDetailsError('Your name cannot be blank.');
      return;
    }
    if (editing === 'phone' && draft.trim() && !isValidPhone(draft)) {
      setDetailsError(PHONE_MESSAGE);
      return;
    }
    setSavingDetails(true);
    setDetailsError(null);
    // The email goes back unchanged: it is the address sign-in matches on, so it
    // is shown here and edited nowhere.
    saveProfile({
      name: profile?.name || '',
      phone: profile?.phone || '',
      dob: profile?.dob || '',
      email: profile?.email || session?.profile?.email || '',
      [editing]: draft,
    })
      .then((data) => {
        setProfile((p) => ({ ...p, ...data.profile }));
        setDetailsNote(`${FIELDS[editing].label} saved.`);
        setEditing(null);
      })
      .catch((err) => setDetailsError(err.message))
      .finally(() => setSavingDetails(false));
  }

  function handleAdd(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    if (!isValidEmail(value)) {
      setFormError(EMAIL_MESSAGE);
      return;
    }
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

  function handleChangePassword(e) {
    e.preventDefault();
    setPwNote(null);
    setPwError(null);
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

  // A hard navigation, not a router push: clearing sessionStorage does not clear
  // what components are already holding, and on a shared laptop "signed out" has
  // to mean the next person cannot press Back into any of it.
  function handleSignOut() {
    clearSession();
    window.location.assign('/');
  }

  const name = profile?.name || session?.profile?.name || '';
  const emailAddress = profile?.email || session?.profile?.email || '';
  const hasPassword = profile?.hasPassword;

  const MENU = [
    { id: 'details', label: 'Basic details' },
    { id: 'sharing', label: 'Who can see this', count: loading ? null : sharedWith.length },
    { id: 'password', label: hasPassword === false ? 'Password' : 'Change password' },
    { id: 'signout', label: 'Sign out' },
  ];

  const editor = (field) => (
    <form onSubmit={saveField} className="flex flex-col gap-3">
      <label htmlFor={`edit-${field}`} className="text-xs text-[var(--color-muted)]">
        {FIELDS[field].label}
      </label>
      <input
        id={`edit-${field}`}
        type={FIELDS[field].type}
        autoComplete={FIELDS[field].autoComplete}
        max={field === 'dob' ? new Date().toISOString().slice(0, 10) : undefined}
        value={draft}
        inputMode={field === 'phone' ? 'tel' : undefined}
        // Digits, a leading +, spaces and dashes only: letters never reach the box.
        onChange={(ev) => setDraft(field === 'phone' ? ev.target.value.replace(/[^\d+\s-]/g, '').slice(0, 20) : ev.target.value)}
        className={`${field === 'dob' ? 'input-soft ' : ''}${INPUT}`}
        autoFocus
      />
      {FIELDS[field].hint && <p className="text-xs text-[var(--color-muted)]">{FIELDS[field].hint}</p>}
      {detailsError && <Note tone="bad">{detailsError}</Note>}
      <div className="flex gap-2">
        <button type="submit" disabled={savingDetails} className={BUTTON}>
          {savingDetails ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setEditing(null)} className={GHOST}>
          Cancel
        </button>
      </div>
    </form>
  );

  // Signed out, this page had nothing to show but an empty card headed "You"
  // and a Sign out button. It is linked from the landing page's footer, so a
  // stranger could reach it; send them to the door instead.
  if (!session) return <Navigate to="/welcome" replace />;

  return (
    <PageShell section="home" width="wide">
      <Header eyebrow="Account" />

      <div className="stack-block grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ───────────────────────────── profile card and menu */}
        <aside className="card animate-slide-up overflow-hidden lg:sticky lg:top-6">
          <div className="flex flex-col items-center px-5 pt-7 pb-5 text-center">
            <Avatar name={name} picture={session?.profile?.picture} />
            <p className="font-display mt-4 max-w-full truncate text-xl">{name || 'You'}</p>
            <p className="mt-0.5 max-w-full truncate text-sm text-[var(--color-muted)]">{emailAddress}</p>
          </div>
          <nav aria-label="Account sections" className="border-t border-[var(--line-1)]">
            {MENU.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center justify-between gap-3 border-b border-[var(--line-1)] px-5 py-4 text-left text-sm transition-colors last:border-b-0 ${
                    active ? 'bg-[var(--surface-2)] font-semibold' : 'hover:bg-[var(--surface-1)]'
                  }`}
                  style={{
                    color:
                      item.id === 'signout'
                        ? 'var(--color-flag-deep)'
                        : active
                          ? 'var(--color-ink)'
                          : 'var(--color-ink-soft)',
                  }}
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-2 text-[var(--color-muted)]">
                    {item.count != null && (
                      <span className="num rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs">{item.count}</span>
                    )}
                    <Chevron />
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ───────────────────────────── the chosen section */}
        <div ref={panelRef} className="animate-slide-up scroll-mt-6" style={{ animationDelay: '60ms' }}>
          {section === 'details' && (
            <Panel
              title="Personal details"
              sub="You, your counsellor and your institution's administrator can see these."
            >
              <DetailRow
                label="Full name"
                value={name}
                onEdit={profile ? () => startEdit('name') : null}
                editing={editing === 'name'}
                editor={editor('name')}
              />
              <DetailRow
                label="Date of birth"
                value={maskDob(profile?.dob)}
                onEdit={profile ? () => startEdit('dob') : null}
                editing={editing === 'dob'}
                editor={editor('dob')}
              />
              <DetailRow
                label="Mobile number"
                value={maskPhone(profile?.phone)}
                onEdit={profile ? () => startEdit('phone') : null}
                editing={editing === 'phone'}
                editor={editor('phone')}
              />
              <DetailRow
                label="Email address"
                value={emailAddress}
                note="This is your sign-in, so it cannot be changed here."
              />
              {/* Not something anyone fills in, so it only appears once it is known. */}
              {profile?.createdAt && <DetailRow label="Checking in since" value={readableDate(profile.createdAt)} />}
              {detailsNote && !editing && (
                <div className="px-5 pb-4 sm:px-7">
                  <Note>{detailsNote}</Note>
                </div>
              )}
            </Panel>
          )}

          {section === 'sharing' && (
            <Panel
              title="Who can see this"
              sub="Your institution's administrator can see your check-ins, questionnaire results, inkblot notes and chats, and assigns you a counsellor who can see them too. You can also invite someone yourself, and remove them whenever you like."
            >
              {loadError ? (
                <div className="p-5 sm:px-7">
                  <LoadError error={loadError} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
                </div>
              ) : loading ? (
                <p className="animate-pulse px-5 py-5 text-sm text-[var(--color-ink-soft)] sm:px-7">Loading…</p>
              ) : sharedWith.length === 0 ? (
                <p className="border-b border-[var(--line-1)] px-5 py-5 text-sm leading-relaxed text-[var(--color-ink-soft)] sm:px-7">
                  No counsellor yet. Your institution&apos;s administrator can still see your account,
                  and will assign one.
                </p>
              ) : (
                <ul>
                  {sharedWith.map((e) => (
                    <li
                      key={e}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-1)] px-5 py-4 sm:px-7"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[0.9375rem] font-medium">{e}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          {assigned.includes(e)
                            ? 'Assigned by your institution. Ask your administrator to change it.'
                            : 'Invited by you. Can see your check-ins, questionnaire results and chats'}
                        </p>
                      </div>
                      {assigned.includes(e) ? (
                        <span className="shrink-0 rounded-full bg-[var(--color-teal-soft)] px-3 py-1.5 text-xs text-[var(--color-teal-dark)]">
                          Your counsellor
                        </span>
                      ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(e)}
                        disabled={removingEmail === e}
                        className="press shrink-0 rounded-full border border-[var(--color-flag)]/35 px-4 py-2 text-xs text-[var(--color-flag-deep)] transition-colors hover:bg-[var(--color-flag-soft)] disabled:opacity-50"
                      >
                        {removingEmail === e ? 'Stopping…' : 'Stop sharing'}
                      </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <form className="flex flex-col gap-3 px-5 py-5 sm:px-7" onSubmit={handleAdd}>
                <label htmlFor="share-email" className="text-sm font-medium">
                  Invite a counsellor
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="share-email"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="counsellor@example.com"
                    className={INPUT}
                  />
                  <button type="submit" disabled={saving || !email.trim()} className={`${BUTTON} shrink-0`}>
                    {saving ? 'Sharing…' : 'Share'}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                  Use the address they sign in with. Sharing works one way: they can read what you
                  have written, they cannot write anything into your account, and nothing is emailed
                  to them from here.
                </p>
                {formError && <Note tone="bad">{formError}</Note>}
              </form>
            </Panel>
          )}

          {section === 'password' && (
            <Panel
              title={hasPassword === false ? 'Password' : 'Change password'}
              sub={
                hasPassword === false
                  ? 'You sign in with Google, so this account has no password of its own. Google holds it, and that is where you change it.'
                  : 'You will be asked for the current one, so a signed-in tab left open on a shared machine cannot be used to lock you out.'
              }
            >
              {hasPassword !== false && (
                <form className="flex flex-col gap-4 px-5 py-5 sm:px-7" onSubmit={handleChangePassword}>
                  {[
                    ['current', 'Current password', 'current-password'],
                    ['next', `New password (at least ${MIN_PASSWORD} characters)`, 'new-password'],
                    ['confirm', 'New password again', 'new-password'],
                  ].map(([key, label, auto]) => (
                    <div key={key}>
                      <label htmlFor={`pw-${key}`} className="text-xs text-[var(--color-muted)]">
                        {label}
                      </label>
                      <input
                        id={`pw-${key}`}
                        type="password"
                        autoComplete={auto}
                        value={pw[key]}
                        onChange={(ev) => setPw((p) => ({ ...p, [key]: ev.target.value }))}
                        className={`mt-1.5 ${INPUT}`}
                      />
                    </div>
                  ))}
                  {pwError && <Note tone="bad">{pwError}</Note>}
                  {pwNote && <Note>{pwNote}</Note>}
                  <div>
                    <button type="submit" disabled={savingPw || !pw.current || !pw.next || !pw.confirm} className={BUTTON}>
                      {savingPw ? 'Changing…' : 'Change password'}
                    </button>
                  </div>
                </form>
              )}
            </Panel>
          )}

          {section === 'signout' && (
            <Panel
              title="Sign out"
              sub="This signs you out on this device only. Nothing is deleted: your check-ins, your streak and everyone you have shared with are still here when you come back."
            >
              <div className="px-5 py-5 sm:px-7">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="press rounded-full bg-[var(--color-flag-deep)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Sign out of this device
                </button>
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                  On a shared or borrowed device, signing out is the safe way to leave. It empties this
                  tab as well as forgetting you.
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </PageShell>
  );
}
