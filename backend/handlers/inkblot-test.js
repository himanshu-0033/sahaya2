import { getInkblotSessions, getResidents, appendRecord } from '../lib/store.js';
import { PLATES, isPlateId } from '../lib/plates.js';
import { summarizeSession } from '../lib/reflection.js';
import { HELPLINES } from '../lib/safety.js';
import { todayISO } from '../lib/logic.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

const MAX_RESPONSE_CHARS = 800;

// A sitting is one record. Unlike the daily check-in there is no
// one-per-day rule — someone may want to sit it again weeks later, and the
// comparison between sittings is the interesting part.
function normalizeResponses(raw) {
  if (!Array.isArray(raw)) return { error: 'responses must be an array' };
  if (raw.length > PLATES.length) {
    return { error: `responses cannot exceed ${PLATES.length} entries` };
  }

  const seen = new Set();
  const responses = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      return { error: 'each response must be an object' };
    }
    const { plateId, text, latencyMs } = entry;

    if (!isPlateId(plateId)) return { error: `unknown plateId: ${plateId}` };
    if (seen.has(plateId)) return { error: `duplicate response for ${plateId}` };
    seen.add(plateId);

    if (text != null && typeof text !== 'string') {
      return { error: 'response text must be a string' };
    }
    const trimmed = (text || '').trim().slice(0, MAX_RESPONSE_CHARS);

    responses.push({
      plateId,
      text: trimmed,
      latencyMs: typeof latencyMs === 'number' && latencyMs >= 0 ? Math.round(latencyMs) : null,
    });
  }

  if (!responses.some((r) => r.text)) {
    return { error: 'at least one plate needs a response' };
  }

  return { responses };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const residentId = user.sub;

  if (req.method === 'GET') {
    const sessions = await getInkblotSessions();
    const mine = sessions
      .filter((s) => s.residentId === residentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return res.status(200).json({
      plates: PLATES,
      sessions: mine.slice(-10),
    });
  }

  if (req.method === 'POST') {
    const residents = await getResidents();
    if (!residents.some((r) => r.id === residentId && r.onboarded)) {
      return res.status(400).json({ error: 'Create your account before taking the test' });
    }

    const { responses, error } = normalizeResponses(req.body?.responses);
    if (error) return res.status(400).json({ error });

    const summary = summarizeSession(responses);
    const sessions = await getInkblotSessions();

    const record = {
      id: `${residentId}:${Date.now()}`,
      residentId,
      date: todayISO(),
      responses,
      summary,
      flagged: summary.flagged,
      flagReasons: summary.flagReasons,
      createdAt: new Date().toISOString(),
    };

    await appendRecord('inkblotSessions', record);

    // A crisis match is the one case where the response carries something
    // back to the resident immediately rather than just filing it.
    return res.status(201).json({
      record,
      helplines: summary.crisisHits.length > 0 ? HELPLINES : null,
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
