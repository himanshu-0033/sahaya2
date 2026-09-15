import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addStaff, assignCounsellor, getTeam, removeStaff } from '../lib/api.js';
import PeoplePicker from '../components/PeoplePicker.jsx';
import { ROLE_LABEL } from '../lib/roles.js';
import { EMAIL_MESSAGE, isValidEmail } from '../lib/contact.js';

// Every counsellor and how the students each of them looks after are doing.
//
// Two people read this page. The super admin sees it all: who may sign in, the
// assign form, and the students with no counsellor by name. A manager sees the
// counsellor figures only; the server does not send them any student's name
// (see handlers/admin/team.js), so there is nothing here to hide from them.
export default function Team({ admin }) {
  const isSuper = Boolean(admin?.superAdmin);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [counsellor, setCounsellor] = useState(null);
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const [formError, setFormError] = useState(null);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffBusy, setStaffBusy] = useState(false);
  const [staffNote, setStaffNote] = useState(null);
  const [staffError, setStaffError] = useState(null);

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

  function add(e) {
    e.preventDefault();
    const email = staffEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setStaffError(EMAIL_MESSAGE);
      return;
    }
    setStaffBusy(true);
    setStaffNote(null);
    setStaffError(null);
    addStaff(email)
      .then(() => {
        setStaffNote(`${email} can now sign in. They will be asked whether they are a counsellor or a manager.`);
        setStaffEmail('');
        return load();
      })
      .catch((err) => setStaffError(err.message))
      .finally(() => setStaffBusy(false));
  }

  function remove(email) {
    setStaffBusy(true);
    setStaffNote(null);
    setStaffError(null);
    removeStaff(email)
      .then(() => {
        setStaffNote(`${email} can no longer sign in to the admin panel.`);
        return load();
      })
      .catch((err) => setStaffError(err.message))
      .finally(() => setStaffBusy(false));
  }

  if (error) return <p className="text-sm text-[var(--color-flag-deep)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;

  const cell = 'px-4 py-3 whitespace-nowrap';
  // The super admin manages everyone's access here, so sees every row; a manager
  // is here for counsellor performance, so managers are left out of their table.
  const rows = isSuper ? data.counsellors : data.counsellors.filter((c) => c.role !== 'manager');
  const totals = data.counsellors.reduce(
    (t, c) => ({
      students: t.students + c.students,
      checkedInToday: t.checkedInToday + c.checkedInToday,
      needsConversation: t.needsConversation + c.needsConversation,
      atRiskNow: t.atRiskNow + c.atRiskNow,
    }),
    { students: 0, checkedInToday: 0, needsConversation: 0, atRiskNow: 0 },
  );

  return (
    <div className="animate-fade-up space-y-8">
      <header>
        <p className="inline-block rounded-full bg-[#1f4d47] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          {isSuper ? 'Super admin' : 'Manager'} dashboard
        </p>
        <h2 className="font-display mt-4 text-[clamp(1.8rem,3.6vw,2.4rem)] leading-tight">
          {isSuper ? 'Team' : 'Counsellor performance'}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          {isSuper
            ? 'Who may sign in, every counsellor and how their students are doing, and who still needs a counsellor. An assignment gives the counsellor access straight away, and the student sees it on their account page.'
            : "How each counsellor's caseload is doing. Individual students are not shown here; each counsellor sees their own."}
        </p>
      </header>

      {/* The figures across every counsellor, the same four a manager is here for. */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Counsellors', value: data.counsellors.filter((c) => c.role !== 'manager').length },
          { label: 'Students looked after', value: totals.students },
          { label: 'Checked in today', value: totals.checkedInToday },
          { label: 'Need a conversation', value: totals.needsConversation, alert: totals.needsConversation > 0 },
          { label: 'Without a counsellor', value: data.unassignedCount ?? data.unassigned?.length ?? 0, alert: (data.unassignedCount ?? 0) > 0 },
        ].map((f) => (
          <div key={f.label} className="rounded-2xl border border-[var(--line-1)] bg-white px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{f.label}</p>
            <p className={`font-display mt-2 text-[2rem] leading-none tabular-nums ${f.alert ? 'text-[#c2410c]' : ''}`}>{f.value}</p>
          </div>
        ))}
      </div>

      {isSuper && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--line-1)] bg-white p-6">
            <h3 className="font-display text-xl">Add a staff member</h3>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Lets them sign in. On their first sign-in they choose counsellor or manager.
            </p>
            <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="name@college.edu"
                className="input-soft min-w-[220px] flex-1"
              />
              <button
                type="submit"
                disabled={staffBusy || !staffEmail.trim()}
                className="rounded-full bg-[#1f4d47] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                {staffBusy ? 'Saving…' : 'Add'}
              </button>
            </form>
            {staffNote && <p className="mt-3 text-sm text-[var(--color-teal-dark)]" role="status">{staffNote}</p>}
            {staffError && <p className="mt-3 text-sm text-[var(--color-flag-deep)]" role="alert">{staffError}</p>}
          </section>

          <section className="rounded-2xl border border-[var(--line-1)] bg-white p-6">
            <h3 className="font-display text-xl">Assign a counsellor</h3>
            {/* Counsellor on one side, student on the other, each found by typing
                part of a name or an email. */}
            <form onSubmit={assign} className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <PeoplePicker
                  label="Counsellor"
                  placeholder="Name or email"
                  people={data.counsellors
                    .filter((c) => c.role !== 'manager')
                    .map((c) => ({ id: c.email, name: c.name, email: c.email }))}
                  selected={counsellor}
                  onSelect={setCounsellor}
                  allowNew
                />
                <PeoplePicker
                  label="Student"
                  placeholder="Name or email"
                  people={data.students || []}
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
          </section>
        </div>
      )}

      <section>
        <h3 className="font-display text-xl">{isSuper ? 'Staff and counsellors' : 'Counsellors'}</h3>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No counsellors yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line-1)] bg-white">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Checked in today</th>
                  <th className="px-4 py-3">Need a conversation</th>
                  <th className="px-4 py-3">At risk now</th>
                  <th className="px-4 py-3">Avg mood</th>
                  {isSuper && <th className="px-4 py-3">Access</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.email} className="border-t border-[var(--line-1)]">
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.name || c.email}</span>
                      {c.name && <span className="ml-2 text-xs text-[var(--color-muted)]">{c.email}</span>}
                    </td>
                    <td className={cell}>
                      {c.role ? (
                        <span className="rounded-full bg-[#e3efeb] px-2.5 py-0.5 text-xs font-medium text-[#1f4d47]">{ROLE_LABEL[c.role]}</span>
                      ) : (
                        <span className="text-xs text-[var(--color-muted)]">Not chosen yet</span>
                      )}
                    </td>
                    <td className={`${cell} tabular-nums`}>
                      {c.students}
                      {c.assigned > 0 && <span className="ml-1.5 text-xs text-[var(--color-muted)]">({c.assigned} assigned)</span>}
                    </td>
                    <td className={`${cell} tabular-nums`}>{c.checkedInToday}</td>
                    <td className={`${cell} tabular-nums ${c.needsConversation ? 'text-[var(--color-flag-deep)]' : ''}`}>{c.needsConversation}</td>
                    <td className={`${cell} tabular-nums ${c.atRiskNow ? 'font-semibold text-[var(--color-flag-deep)]' : ''}`}>{c.atRiskNow}</td>
                    <td className={`${cell} tabular-nums`}>{c.avgMood ?? '-'}</td>
                    {isSuper && (
                      <td className={cell}>
                        {c.addedFromPanel ? (
                          <button
                            type="button"
                            onClick={() => remove(c.email)}
                            disabled={staffBusy}
                            className="rounded-full border border-[var(--color-flag)]/40 px-3 py-1 text-xs text-[var(--color-flag-deep)] hover:bg-[var(--color-flag-soft)] disabled:opacity-40"
                          >
                            Remove access
                          </button>
                        ) : c.canOpenConsole ? (
                          <span className="text-xs text-[var(--color-muted)]">Server allowlist</span>
                        ) : (
                          <span className="rounded-full bg-[var(--color-flag-soft)] px-2 py-0.5 text-[10px] text-[var(--color-flag-deep)]">
                            Cannot sign in yet
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isSuper && (
        <section>
          <h3 className="font-display text-xl">
            Without a counsellor <span className="tabular-nums text-[var(--color-muted)]">{data.unassigned.length}</span>
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
      )}
    </div>
  );
}
