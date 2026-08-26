import { randomUUID } from 'node:crypto';
import { getExportLog, appendExportLog, getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { requireAdminUser } from '../../lib/auth.js';
import { canView, normalizeEmail } from '../../lib/sharing.js';

// A record of every CSV that left the console.
//
// The console already warns a counsellor to handle exported files carefully.
// A warning asks someone to behave well; it does not record what happened, and
// those are different problems. If a spreadsheet of somebody's mood history and
// written words ends up somewhere it should not, the question is who downloaded
// it and when — and until now nothing in the system could answer that.
//
// Two deliberate limits:
//
//   - It logs THAT an export happened, never what was in it. A log holding
//     copies of the data it is protecting is a second copy of the problem.
//   - There is no delete. The endpoint accepts POST and GET and nothing else,
//     and the store only appends. A log the viewer can edit is decoration.
//
// The client calls this before it builds the file. If the call fails the
// download still proceeds — blocking a counsellor from reading their own
// caseload because an audit write timed out would be the wrong trade, and a
// missing entry is visible as a gap rather than as silence.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const admin = await requireAdminUser(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const log = await getExportLog();
    // Newest first — this is read to answer "what just happened", not to
    // browse from the beginning.
    return res.status(200).json({ entries: [...log].reverse().slice(0, 200) });
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
      if (!resident || !canView(resident, admin.email)) {
        return res.status(404).json({ error: 'Resident not found' });
      }
      subjectName = resident.name || null;
    }

    const entry = {
      id: randomUUID(),
      at: new Date().toISOString(),
      actor: normalizeEmail(admin.email),
      scope,
      residentId: scope === 'resident' ? residentId : null,
      subjectName,
      rowCount: Number.isFinite(rowCount) ? rowCount : null,
    };

    await appendExportLog(entry);
    return res.status(201).json({ entry });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
