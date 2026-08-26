import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import LoadError from '../components/LoadError.jsx';
import { useSession } from '../lib/useSession.js';
import { getSharing, shareWith, stopSharingWith } from '../lib/api.js';

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

  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [removingEmail, setRemovingEmail] = useState(null);

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

  return (
    <PageShell section="home">
      <Header eyebrow="Account" />

      <div className="animate-slide-up stack-block">
        <p className="marginalia">Who can see your check-ins</p>
        <h1 className="font-display mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">
          Nobody, unless
          <br />
          you say so.
        </h1>
        <p className="stack-item max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Your check-ins, questionnaire scores and inkblot notes are yours. Invite a counsellor here
          and they will be able to follow along; remove them and they stop, straight away.
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
            className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 outline-none transition-colors placeholder:text-white/25 focus:border-[var(--color-teal)]/60 focus:bg-white/[0.05]"
          />
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            Use the address they sign in with. They will only see you once they open the counsellor
            console — nothing is emailed to them from here.
          </p>

          {formError && <p className="mt-3 text-sm text-[var(--color-flag)]">{formError}</p>}

          <button
            type="submit"
            disabled={saving || !email.trim()}
            className="press mt-5 rounded-full bg-[var(--color-teal)] px-6 py-3 text-sm font-medium text-[#07080a] transition-colors hover:bg-[var(--color-teal-dark)] disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/30"
          >
            {saving ? 'Sharing…' : 'Share with them'}
          </button>
        </form>
      </div>

      <div className="rule-fade stack-section" />

      <p className="mt-6 max-w-md pb-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
        Sharing is per person and works one way: they can read what you have written, they cannot
        write anything into your account, and they cannot invite anyone else to see it.
      </p>
    </PageShell>
  );
}
