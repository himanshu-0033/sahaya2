import { getInstrument, instrumentDetail } from '../lib/instruments.js';
import { scoreInstrument } from '../lib/scoring.js';
import { applyCors } from '../lib/cors.js';

// One questionnaire, to anybody, with no account and nothing kept.
//
// Every other route in here is gated, which was the right default and became
// the wrong front door: the app asked a stranger to hand over a Google account
// before it had shown them a single thing. Someone at two in the morning who
// wants to know whether what they are feeling is worth taking seriously should
// not have to sign up to find out.
//
// WHAT THIS DELIBERATELY IS NOT. It stores nothing. No record, no residentId,
// no history, no way to look at it again. The score is computed and returned
// and then it is gone, which is what lets it run without an account at all.
// Anyone who wants their answers kept is asked to make an account, after they
// have seen what they get.
//
// WHY ONLY WHO-5. It is five items and about a minute; its licence is free
// with attribution; its wording here is verified against the source. Most
// importantly it has no crisis item. The PHQ-9's item 9 asks about self-harm,
// and a positive answer from an anonymous stranger is the one result this
// endpoint could not do anything responsible with: no account to flag, no
// counsellor to route to, nobody to follow up. Screening for that without
// somewhere to send the answer is worse than not asking. So the gated route
// keeps the instruments that can ask it, and this one cannot.
const PUBLIC_INSTRUMENT = 'who-5';

// A public POST with no session behind it. Scoring is pure arithmetic and
// touches no storage, so the exposure is CPU rather than data, but an open
// endpoint still gets found.
//
// ponytail: per-instance counters, same as the agent's chat limiter. Several
// serverless instances do not share this map, so the real ceiling is
// (instances x MAX_PER_WINDOW). It stops a runaway client, which is the actual
// failure to defend against here.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function overLimit(key) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, reset: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const instrument = getInstrument(PUBLIC_INSTRUMENT);
  if (!instrument) {
    // The whitelist names an instrument that is no longer in the battery.
    // That is our bug, not the caller's, so it is logged rather than explained.
    console.error(`[preview] ${PUBLIC_INSTRUMENT} is not in the instrument list`);
    return res.status(500).json({ error: 'The quick check is not available right now.' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ instrument: instrumentDetail(instrument) });
  }

  if (req.method === 'POST') {
    if (overLimit(clientKey(req))) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'That is a lot of attempts at once. Give it a minute.' });
    }

    const { answers } = req.body || {};
    const result = scoreInstrument(instrument, answers, null);
    if (result.error) return res.status(400).json({ error: result.error });

    // No appendRecord, and no residentId to attach one to. The response is the
    // whole of what happens.
    return res.status(200).json({
      score: result.score,
      maxScore: result.maxScore,
      band: result.band,
      higherIsBetter: Boolean(instrument.higherIsBetter),
      name: instrument.name,
      fullName: instrument.fullName,
      // Carried so the result screen can say where the numbers came from,
      // the same as every scored screen behind the login does.
      license: instrument.license,
      citation: instrument.citation,
    });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
