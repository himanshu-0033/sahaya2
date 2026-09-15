import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignCounsellor, getTeam } from '../lib/api.js';

// The super admin's page: every counsellor and how the students each of them
// looks after are doing, the students nobody has yet, and the form that assigns
// a counsellor to a student.
//
// An assignment gives that counsellor access to the student at once. The
// student is told on their own account page, where the counsellor is listed as
// assigned by the institution.
export default function Team() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const [formError, setFormError] = useState(null);

  function load() {
    return getTeam()
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  function assign(e) {
    e.preventDefault();
    if (!studentId || !email.trim()) return;
    setSaving(true);
    setNote(null);
    setFormError(null);
    assignCounsellor({ residentId: studentId, email: email.trim() })
      .then(() => {
        const student = data.students.find((s) => s.id === studentId);
        setNote(`${email.trim()} can now see ${student?.name || 'this student'}.`);
        setStudentId('');
        setEmail('');
        return load();
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setSaving(false));
  }

  if (error) return <p className="text-sm text-[var(--color-flag-deep)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;

  const cell = 'px-4 py-3 whitespace-nowrap';

  return (
    <div className="animate-fade-up space-y-8">
      <header>
        <p className="label-eyebrow">Super admin</p>
        <h2 className="font-display mt-2 text-3xl">Team</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Every counsellor, the students they look after, and how those students are doing. An
          assignment gives the counsellor access straight away, and the student sees it on their
          account page.
        </p>
      </header>

      <section className="card-soft rounded-2xl p-6">
        <h3 className="font-display text-xl">Assign a counsellor</h3>
        <form onSubmit={assign} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Student</span>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input-soft mt-1 w-full"
              required
            >
              <option value="">Choose a student</option>
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Counsellor email
            </span>
            {/* A native datalist: the known counsellors to pick from, and still
                room to type a new address. */}
            <input
              type="email"
              list="counsellor-emails"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counsellor@college.edu"
              className="input-soft mt-1 w-full"
              required
            />
            <datalist id="counsellor-emails">
              {data.counsellors.map((c) => (
                <option key={c.email} value={c.email} />
              ))}
            </datalist>
          </label>
          <button
            type="submit"
            disabled={saving || !studentId || !email.trim()}
            className="rounded-full bg-[var(--color-lavender-deep)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </form>
        {note && <p className="mt-3 text-sm text-[var(--color-teal-dark)]" role="status">{note}</p>}
        {formError && <p className="mt-3 text-sm text-[var(--color-flag-deep)]" role="alert">{formError}</p>}
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          A counsellor also has to be on the console allowlist (ADMIN_EMAILS) to sign in here.
          Anyone who is not yet is marked below.
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl">Counsellors</h3>
        {data.counsellors.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No counsellors yet.</p>
        ) : (
          <div className="card-soft mt-4 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-4 py-3">Counsellor</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Checked in today</th>
                  <th className="px-4 py-3">Need a conversation</th>
                  <th className="px-4 py-3">At risk now</th>
                  <th className="px-4 py-3">Avg mood</th>
                </tr>
              </thead>
              <tbody>
                {data.counsellors.map((c) => (
                  <tr key={c.email} className="border-t border-[var(--line-1)]">
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.email}</span>
                      {!c.canOpenConsole && (
                        <span className="ml-2 rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag-deep)]">
                          Not on allowlist
                        </span>
                      )}
                    </td>
                    <td className={`${cell} tabular-nums`}>
                      {c.students}
                      {c.assigned > 0 && (
                        <span className="ml-1.5 text-xs text-[var(--color-muted)]">({c.assigned} assigned)</span>
                      )}
                    </td>
                    <td className={`${cell} tabular-nums`}>{c.checkedInToday}</td>
                    <td className={`${cell} tabular-nums ${c.needsConversation ? 'text-[var(--color-flag-deep)]' : ''}`}>
                      {c.needsConversation}
                    </td>
                    <td className={`${cell} tabular-nums ${c.atRiskNow ? 'font-semibold text-[var(--color-flag-deep)]' : ''}`}>
                      {c.atRiskNow}
                    </td>
                    <td className={`${cell} tabular-nums`}>{c.avgMood ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display text-xl">
          Without a counsellor{' '}
          <span className="tabular-nums text-[var(--color-muted)]">{data.unassigned.length}</span>
        </h3>
        {data.unassigned.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Every student has a counsellor.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line-1)] border-y border-[var(--line-1)]">
            {data.unassigned.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-2 py-3">
                <Link to={`/residents/${encodeURIComponent(s.id)}`} className="min-w-0">
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-[var(--color-muted)]">{s.email}</span>
                  {s.flaggedRecently && (
                    <span className="ml-2 rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag-deep)]">
                      Needs a conversation
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStudentId(s.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-full border border-[var(--color-lavender-deep)] px-3 py-1 text-xs text-[var(--color-lavender-deep)]"
                >
                  Assign
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
