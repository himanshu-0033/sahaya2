import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignCounsellor, getTeam } from '../lib/api.js';
import PeoplePicker from '../components/PeoplePicker.jsx';
import { ROLE_LABEL } from '../lib/roles.js';

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
  const [counsellor, setCounsellor] = useState(null);
  const [student, setStudent] = useState(null);
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
    if (!student || !counsellor) return;
    setSaving(true);
    setNote(null);
    setFormError(null);
    assignCounsellor({ residentId: student.id, email: counsellor.email })
      .then(() => {
        setNote(`${counsellor.name || counsellor.email} can now see ${student.name || student.email}.`);
        setStudent(null);
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
        {/* Counsellor on one side, student on the other, each found by typing
            part of a name or an email. */}
        <form onSubmit={assign} className="mt-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <PeoplePicker
              label="Counsellor"
              placeholder="Type a counsellor's name or email"
              people={data.counsellors.map((c) => ({ id: c.email, name: c.name, email: c.email }))}
              selected={counsellor}
              onSelect={setCounsellor}
              allowNew
            />
            <span
              aria-hidden="true"
              className="hidden h-[3.25rem] items-center self-end text-[var(--color-lavender-deep)] md:flex"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
            <PeoplePicker
              label="Student"
              placeholder="Type a student's name or email"
              people={data.students}
              selected={student}
              onSelect={setStudent}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !student || !counsellor}
              className="rounded-full bg-[var(--color-lavender-deep)] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? 'Assigning…' : 'Assign counsellor'}
            </button>
          </div>
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
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
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
                      <span className="font-medium">{c.name || c.email}</span>
                      {c.name && <span className="ml-2 text-xs text-[var(--color-muted)]">{c.email}</span>}
                      {!c.canOpenConsole && (
                        <span className="ml-2 rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag-deep)]">
                          Not on allowlist
                        </span>
                      )}
                    </td>
                    <td className={cell}>
                      {c.role ? (
                        <span className="rounded-full bg-[#e3efeb] px-2.5 py-0.5 text-xs font-medium text-[#1f4d47]">{ROLE_LABEL[c.role]}</span>
                      ) : (
                        <span className="text-xs text-[var(--color-muted)]">Not signed in yet</span>
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
                  <span className="font-medium">{s.name || s.email || 'Unnamed student'}</span>
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
                    setStudent({ id: s.id, name: s.name, email: s.email });
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
