import { getAssessments, saveAssessments, getResidents } from '../lib/store.js';
import { catalog, getInstrument, instrumentDetail } from '../lib/instruments.js';
import { scoreInstrument } from '../lib/scoring.js';
import { HELPLINES, ACUTE_MESSAGE } from '../lib/safety.js';
import { todayISO } from '../lib/logic.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const user = await requireGoogleUser(req, res);
  if (!user) return;
  const residentId = user.sub;

  if (req.method === 'GET') {
    const { instrumentId } = req.query;

    // One instrument, with its items — what the runner page needs.
    if (instrumentId) {
      const instrument = getInstrument(instrumentId);
      if (!instrument) return res.status(404).json({ error: 'Unknown instrument' });
      return res.status(200).json({ instrument: instrumentDetail(instrument) });
    }

    // The catalog, plus this resident's own history.
    const assessments = await getAssessments();
    const mine = assessments
      .filter((a) => a.residentId === residentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.status(200).json({ instruments: catalog(), sessions: mine.slice(0, 40) });
  }

  if (req.method === 'POST') {
    const residents = await getResidents();
    if (!residents.some((r) => r.id === residentId && r.onboarded)) {
      return res.status(400).json({ error: 'Create your account before taking an assessment' });
    }

    const { instrumentId, answers, followUp } = req.body || {};
    const instrument = getInstrument(instrumentId);
    if (!instrument) return res.status(400).json({ error: 'Unknown instrument' });

    // `followUp` is the unscored question some forms print after their items —
    // the PHQ-9's "how difficult have these problems made it". It is validated
    // here and filed beside the score, never inside it.
    const result = scoreInstrument(instrument, answers, followUp ?? null);
    if (result.error) return res.status(400).json({ error: result.error });

    const assessments = await getAssessments();

    const record = {
      id: `${residentId}:${instrument.id}:${Date.now()}`,
      residentId,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      domain: instrument.domain,
      date: todayISO(),
      answers,
      raw: result.raw,
      score: result.score,
      maxScore: result.maxScore,
      band: result.band,
      subscales: result.subscales,
      followUp: result.followUp,
      // A crisis item is a flag on its own, independent of the total: someone
      // can answer item 9 positively and still land in a "mild" band, and an
      // ASQ positive screen scores 1 out of 4.
      flagged: Boolean(result.crisis),
      flagReasons: result.crisis ? result.crisis.reasons : [],
      // 'acute' | 'positive' | null. The counsellor console sorts on this.
      riskLevel: result.crisis ? result.crisis.level : null,
      createdAt: new Date().toISOString(),
    };

    // The previous sitting of this same instrument, so the result screen can
    // say which way things have moved rather than just showing a number.
    const previous = assessments
      .filter((a) => a.residentId === residentId && a.instrumentId === instrument.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;

    await saveAssessments([...assessments, record]);

    return res.status(201).json({
      record,
      previous: previous ? { score: previous.score, band: previous.band, createdAt: previous.createdAt } : null,
      // The wording belongs to the instrument that asked, except when someone
      // says "right now" — then there is only one thing worth saying.
      crisis: result.crisis
        ? {
            level: result.crisis.level,
            message:
              result.crisis.level === 'acute'
                ? ACUTE_MESSAGE
                : instrument.crisisMessage || ACUTE_MESSAGE,
          }
        : null,
      helplines: result.crisis ? HELPLINES : null,
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
