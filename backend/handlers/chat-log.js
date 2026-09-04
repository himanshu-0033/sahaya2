import { upsertRecord } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';

// The companion's transcripts, kept so a counsellor the resident has already
// let in can read what has been going on between check-ins.
//
// The conversation used to exist only in the browser tab it happened in: the
// agent is stateless and replays the history it is handed, so closing the tab
// ended it for good. That is a defensible design for a chat toy and a poor one
// for the place a person is most likely to first say something that matters.
//
// Three things about how this is stored, and each of them is a deliberate
// answer to "who gets to read this":
//
//   The resident writes their own. residentId comes from the verified session,
//   never from the body, so this endpoint cannot be used to file a transcript
//   under somebody else's name.
//
//   Reading is not part of this file. It happens in handlers/admin/resident.js
//   behind canView(), which is the consent the resident already granted to a
//   named counsellor — the same gate as their check-ins and their
//   questionnaires. No new way in, and nothing visible to a counsellor they
//   have not chosen.
//
//   A session is one document, not one document per turn. The agent already
//   caps a conversation at 24 turns of 2000 characters, so a session cannot
//   grow beyond about 50KB — bounded, and cheap to read whole, which is how a
//   transcript is read.
const MAX_TURNS = 24;
const MAX_CHARS = 2000;

// A session id is the resident's own id and the moment the conversation
// opened, so replaying the same session updates it rather than filing a second
// copy of a conversation that is still going.
function sessionIdFor(residentId, startedAt) {
  return `${residentId}:${startedAt}`;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireGoogleUser(req, res);
  if (!user) return;

  const { startedAt, messages, flagged } = req.body || {};

  if (typeof startedAt !== 'string' || !startedAt || Number.isNaN(Date.parse(startedAt))) {
    return res.status(400).json({ error: 'startedAt must be an ISO timestamp' });
  }
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages must not be empty' });
  }
  if (messages.length > MAX_TURNS) {
    return res.status(400).json({ error: `a conversation is limited to ${MAX_TURNS} turns` });
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'each message needs role "user"|"assistant" and string content' });
    }
    if (m.content.length > MAX_CHARS) {
      return res.status(400).json({ error: `messages are limited to ${MAX_CHARS} characters` });
    }
  }

  const now = new Date().toISOString();
  const record = {
    id: sessionIdFor(user.sub, startedAt),
    residentId: user.sub,
    startedAt,
    updatedAt: now,
    // Whether the safety screen fired at any point in this conversation. The
    // agent decides it; this only records what it decided, so a client cannot
    // clear a flag by lying about it — the worst it can do is set one.
    flagged: Boolean(flagged),
    turns: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  await upsertRecord('chatSessions', { id: record.id }, record);

  return res.status(200).json({ saved: true, id: record.id });
}
