import { applyCors } from '../lib/cors.js';
import { requireUser } from '../lib/auth.js';
import { screenForCrisis, crisisResponse } from '../lib/safety.js';
import { generateReply, activeProvider, isMock } from '../lib/provider.js';
import { openingLine } from '../lib/persona.js';

const MAX_TURNS = 24;
const MAX_CHARS = 2000;

// One person cannot be allowed to spend the whole deployment's quota. The free
// tiers this runs on are small and shared — Gemini's is 15 requests a minute
// for the entire project — so a single stuck client retrying in a loop takes
// the companion away from everybody else.
//
// ponytail: per-instance counters. Serverless runs several instances and they
// do not share this map, so the real ceiling is (instances x MAX_PER_WINDOW).
// It stops a runaway client, which is the actual failure seen here; a shared
// counter in Mongo is the upgrade if this ever needs a true global cap.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map();

function overLimit(key) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    // Cheap prune: the map only ever holds keys seen in the last window, and
    // is dropped wholesale if a burst of distinct users grows it unreasonably.
    if (hits.size > 5000) hits.clear();
    hits.set(key, { n: 1, reset: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  if (overLimit(user.sub)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'That is a lot of messages at once. Give it a minute.' });
  }

  const { messages, checkin } = req.body || {};

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  if (messages.length > MAX_TURNS) {
    return res.status(400).json({ error: `Conversation is limited to ${MAX_TURNS} turns` });
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'each message needs role "user"|"assistant" and string content' });
    }
    if (m.content.length > MAX_CHARS) {
      return res.status(400).json({ error: `messages are limited to ${MAX_CHARS} characters` });
    }
  }

  // An empty history means "start the conversation" — seeded from today's
  // check-in so the opener is about them, not generic.
  if (messages.length === 0) {
    return res.status(200).json({
      reply: openingLine(checkin?.mood, checkin?.words),
      flagged: false,
      provider: activeProvider,
      isMock,
    });
  }

  const latest = [...messages].reverse().find((m) => m.role === 'user');
  const screen = screenForCrisis(latest?.content);
  if (screen.flagged) {
    // Deliberately short-circuits before the provider: crisis handling must not
    // depend on a model being reachable, correct, or even configured.
    return res.status(200).json({ ...crisisResponse(), provider: activeProvider, isMock });
  }

  try {
    const reply = await generateReply(messages);
    return res.status(200).json({ reply, flagged: false, provider: activeProvider, isMock });
  } catch (err) {
    // The message can carry provider detail, configuration hints and the shape
    // of the request that was sent upstream. That belongs in the server log,
    // not in a response any signed-in client can read.
    console.error('[chat] provider failed:', err);
    // Deliberately 500 and not 502: the frontend treats 502/503/504 as "the
    // server is unreachable" and replaces the body with its own wording, which
    // would be a lie here — the server answered, the model behind it did not.
    return res.status(500).json({ error: 'The chat is not available right now.' });
  }
}
