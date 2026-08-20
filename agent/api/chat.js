import { applyCors } from '../lib/cors.js';
import { requireUser } from '../lib/auth.js';
import { screenForCrisis, crisisResponse } from '../lib/safety.js';
import { generateReply, activeProvider, isMock } from '../lib/provider.js';
import { openingLine } from '../lib/persona.js';

const MAX_TURNS = 24;
const MAX_CHARS = 2000;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

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
    return res.status(500).json({ error: err.message });
  }
}
