// Google Gemini, via its OpenAI-compatible chat-completions endpoint.
//
// Added as a fallback when Cerebras quota is unavailable. The free tier
// at aistudio.google.com needs no credit card and allows 15 RPM / 1500
// requests per day — plenty for a small deployment.
//
// Plain fetch, same as cerebras.js — one POST, one JSON body.
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// gemini-2.0-flash is the recommended free-tier model — fast, capable,
// and generous on context.
const DEFAULT_MODEL = 'gemini-2.0-flash';

const MAX_COMPLETION_TOKENS = 1024;

const KEEP_TURNS = 12;

function trimHistory(messages) {
  if (messages.length <= KEEP_TURNS) return messages;
  return messages.slice(-KEEP_TURNS);
}

export async function geminiReply({ system, messages }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to agent/.env.local, or set AGENT_PROVIDER=mock.',
    );
  }

  const kept = trimHistory(messages);
  const dropped = messages.length - kept.length;

  const preamble = dropped > 0
    ? `\n\n(Earlier in this conversation, ${dropped} message${dropped === 1 ? '' : 's'} have been omitted for length.)`
    : '';

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_COMPLETION_TOKENS,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system + preamble },
          ...kept.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
  } catch {
    throw new Error("Can't reach the chat service right now. Please try again.");
  }

  if (res.status === 429) {
    throw new Error('The chat is busy right now. Give it a moment and try again.');
  }

  if (res.status === 401 || res.status === 403) {
    console.error(`[gemini] ${res.status} — GEMINI_API_KEY rejected or insufficient permissions`);
    throw new Error('The chat is not available right now.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Chat service error (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const data = await res.json().catch(() => null);

  const choice = data?.choices?.[0];
  const text = (choice?.message?.content || '').trim();

  if (!text) {
    throw new Error(
      choice?.finish_reason === 'length'
        ? 'The reply ran out of room before it was finished.'
        : 'The model returned an empty reply.',
    );
  }
  return text;
}
