import { randomUUID } from 'node:crypto';
import { getAccessLog, appendAccessLog, getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireStudentAccess } from '../../lib/auth.js';
import { canAdminView, normalizeEmail } from '../../lib/sharing.js';

// A record of who opened a student's record and who took a CSV out of here.
//
// The console already warns a counsellor to handle exported files carefully.
// A warning asks someone to behave well; it does not record what happened, and
// those are different problems. If a spreadsheet of somebody's mood history and
// written words ends up somewhere it should not, the question is who downloaded
// it and when — and until now nothing in the system could answer that.
//
// Views are logged by handlers/admin/resident.js, on the server, after the
// access check passes. Exports are logged here, by the client, because the CSV
// is built in the browser and the server never sees it happen.
//
// Three deliberate limits:
//
//   - It logs THAT an access happened, never what was in it. A log holding
//     copies of the data it is protecting is a second copy of the problem.
//   - There is no delete. The endpoint accepts POST and GET and nothing else,
//     and the store only appends. A log the viewer can edit is decoration.
//   - Reading it back is scoped. The log names students, so handing the whole
//     thing to every counsellor would make the audit log itself the widest
//     leak in the console: a counsellor with one student could read the names
//     of every other student anybody had opened. The super admin sees all of
//     it, because oversight is the job; everyone else sees their own actions.
//
// The client calls this before it builds the file. If the call fails the
// download still proceeds — blocking a counsellor from reading their own
// caseload because an audit write timed out would be the wrong trade, and a
// missing entry is visible as a gap rather than as silence.

// Enough to fill the console's panel many times over without reading a
// collection that gains a row every time anybody opens a record.
const READ_LIMIT = 200;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const admin = await requireStudentAccess(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const entries = await getAccessLog(READ_LIMIT);
    // Newest first — this is read to answer "what just happened", not to
    // browse from the beginning. readRecent already sorts; the filter below
    // preserves that order.
    const actor = normalizeEmail(admin.email);
    const visible = admin.superAdmin ? entries : entries.filter((e) => e.actor === actor);
    return res.status(200).json({ entries: visible, scope: admin.superAdmin ? 'all' : 'self' });
  }

  if (req.method === 'POST') {
    const { scope, residentId, rowCount } = req.body || {};

    if (scope !== 'cohort' && scope !== 'resident') {
      return res.status(400).json({ error: 'scope must be "cohort" or "resident"' });
    }

    // A single-resident export is only loggable if this counsellor could have
    // opened that resident in the first place. Otherwise the log becomes a way
    // to write arbitrary names into an append-only store.
    let subjectName = null;
    if (scope === 'resident') {
      if (!residentId) return res.status(400).json({ error: 'residentId is required' });
      const residents = await getResidents();
      const resident = residents.find((r) => r.id === residentId);
      if (!resident || !canAdminView(resident, admin)) {
        return res.status(404).json({ error: 'Resident not found' });
      }
      subjectName = resident.name || null;
    }

    const entry = {
      id: randomUUID(),
      kind: 'export',
      at: new Date().toISOString(),
      actor: normalizeEmail(admin.email),
      scope,
      residentId: scope === 'resident' ? residentId : null,
      subjectName,
      rowCount: Number.isFinite(rowCount) ? rowCount : null,
    };

    await appendAccessLog(entry);
    return res.status(201).json({ entry });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
