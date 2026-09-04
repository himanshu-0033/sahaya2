import { getPathProgress, getAssessments, upsertRecord, removeRecords } from '../lib/store.js';
import { catalog, getPath, pathDetail, progressFor } from '../lib/paths.js';
import { getInstrument } from '../lib/instruments.js';
import { todayISO } from '../lib/logic.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

// The opening and closing sittings of a path's bookend questionnaire.
//
// This deliberately reads from the assessments the resident already took
// rather than storing its own copy: there is exactly one record of a PHQ-9
// sitting in this system, and a path is a lens onto it, not a second source of
// truth. "Opening" is the most recent sitting at or before the path started;
// "closing" is the most recent sitting since. If they are the same record
// there is nothing to compare and the API says so rather than comparing a
// score with itself.
function bookendScores(assessments, residentId, instrumentId, startedAt) {
  if (!instrumentId || !startedAt) return null;

  const mine = assessments
    .filter((a) => a.residentId === residentId && a.instrumentId === instrumentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (mine.length === 0) return null;

  const before = [...mine].reverse().find((a) => a.createdAt <= startedAt) || null;
  const after = [...mine].reverse().find((a) => a.createdAt > startedAt) || null;

  return {
    before: before ? { score: before.score, band: before.band, createdAt: before.createdAt } : null,
    after: after ? { score: after.score, band: after.band, createdAt: after.createdAt } : null,
  };
}

// A change is only reported as a direction, never as a cause, and never
// without saying whether it is large enough for the instrument to resolve.
function describeChange(path, scores) {
  if (!scores?.before || !scores?.after) return null;

  const instrument = getInstrument(path.closesWith);
  const delta = Math.round((scores.after.score - scores.before.score) * 100) / 100;
  const higherIsBetter = Boolean(instrument?.higherIsBetter);

  // Below the published minimal clinically important difference, the honest
  // answer is "this did not measurably move", not a direction.
  const meaningful = path.mcid == null ? Math.abs(delta) > 0 : Math.abs(delta) >= path.mcid;

  return {
    delta,
    direction: delta === 0 ? 'flat' : (higherIsBetter ? delta > 0 : delta < 0) ? 'better' : 'worse',
    meaningful,
    mcid: path.mcid,
    // Always sent, always shown. See the header of lib/paths.js.
    caveat: path.closingCaveat,
  };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const residentId = user.sub;

  const all = await getPathProgress();
  const mine = all.filter((p) => p.residentId === residentId);
  const recordFor = (pathId) => mine.find((p) => p.pathId === pathId) || null;

  if (req.method === 'GET') {
    const { pathId } = req.query;

    if (pathId) {
      const path = getPath(pathId);
      if (!path) return res.status(404).json({ error: 'Unknown path' });

      const record = recordFor(pathId);
      const progress = progressFor(path, record);
      const assessments = await getAssessments();
      const scores = bookendScores(assessments, residentId, path.closesWith, progress.startedAt);

      return res.status(200).json({
        path: pathDetail(path),
        progress,
        scores,
        change: describeChange(path, scores),
      });
    }

    return res.status(200).json({
      paths: catalog(),
      progress: mine.map((record) => {
        const path = getPath(record.pathId);
        return path ? progressFor(path, record) : null;
      }).filter(Boolean),
    });
  }

  if (req.method === 'POST') {
    const { pathId, day, action } = req.body || {};

    const path = getPath(pathId);
    if (!path) return res.status(400).json({ error: 'Unknown path' });

    const existing = recordFor(pathId);
    const now = new Date().toISOString();

    // Leaving a path deletes its progress rather than flagging it abandoned.
    // Half-finished attempts are not something a resident should have to look
    // at every time they open the page, and nothing downstream reads them.
    if (action === 'leave') {
      await removeRecords('pathProgress', { residentId, pathId });
      return res.status(200).json({ progress: progressFor(path, null) });
    }

    if (action === 'start') {
      // Restarting an in-progress path keeps the original start date, so the
      // opening questionnaire it was compared against stays the right one.
      const record = existing || {
        id: `${residentId}:${path.id}`,
        residentId,
        pathId: path.id,
        startedAt: now,
        startedDate: todayISO(),
        completedDays: [],
        updatedAt: now,
      };
      await upsertRecord('pathProgress', { residentId, pathId }, record);
      return res.status(201).json({ progress: progressFor(path, record) });
    }

    if (action === 'complete' || action === 'undo') {
      const dayNumber = Number(day);
      if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > path.days.length) {
        return res.status(400).json({ error: `day must be between 1 and ${path.days.length}` });
      }

      // Completing a day on a path that was never started begins it, so a
      // resident can just do day one rather than pressing "start" first.
      const base = existing || {
        id: `${residentId}:${path.id}`,
        residentId,
        pathId: path.id,
        startedAt: now,
        startedDate: todayISO(),
        completedDays: [],
        updatedAt: now,
      };

      const set = new Set(base.completedDays);
      if (action === 'complete') set.add(dayNumber);
      else set.delete(dayNumber);

      const record = {
        ...base,
        completedDays: [...set].sort((a, b) => a - b),
        updatedAt: now,
      };
      await upsertRecord('pathProgress', { residentId, pathId }, record);

      const progress = progressFor(path, record);
      const assessments = await getAssessments();
      const scores = bookendScores(assessments, residentId, path.closesWith, progress.startedAt);

      return res.status(200).json({
        progress,
        scores,
        change: describeChange(path, scores),
      });
    }

    return res.status(400).json({ error: 'action must be start, complete, undo or leave' });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
