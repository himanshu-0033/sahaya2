// Cerebras, via its OpenAI-shaped chat-completions endpoint.
//
// Chosen over the other free tiers for one reason that matters more here than
// speed or quota: Cerebras states it retains none of it — "Prompt content, API
// requests or responses, Chat or transaction logs, User input or model output"
// — and its terms do not grant it the right to use that content to train or
// fine-tune. Most no-credit-card tiers are funded the other way round, by the
// prompts. Students type about being unwell in this box, so that difference is
// the whole reason this provider exists.
//
// Plain fetch rather than the Cerebras SDK. The endpoint is one POST with a
// JSON body, the agent module otherwise carries only auth dependencies, and a
// dependency that exists to save eight lines is a dependency that still has to
// be installed on every cold start.
const ENDPOINT = 'https://api.cerebras.ai/v1/chat/completions';

// gpt-oss-120b and gemma-4-31b are the free-tier models. This is an env var
// because that list is Cerebras's to change, and a model id baked into source
// becomes a 404 the day they retire one.
const DEFAULT_MODEL = 'gpt-oss-120b';

// Short, warm, two or three sentences — the persona asks for that, and there
// is no reasoning task here that needs room beyond it.
const MAX_TOKENS = 512;

// How many turns of history to send.
//
// The free models hold 65k tokens, and chat.js already caps a conversation at
// 24 turns of 2000 characters, so the ceiling is around 48k characters — that
// fits. This is not really about the context window: every turn is re-sent on
// every message, so an unbounded history means the twentieth reply costs
// twenty times the first for a companion that only ever needs the recent
// thread. The opening line moves into the system prompt, so nothing is lost
// from the start of the conversation when the middle is dropped.
const KEEP_TURNS = 12;

function trimHistory(messages) {
  if (messages.length <= KEEP_TURNS) return messages;
  return messages.slice(-KEEP_TURNS);
}

export async function cerebrasReply({ system, messages }) {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) {
    throw new Error(
      'CEREBRAS_API_KEY is not set. Add it to agent/.env.local, or set AGENT_PROVIDER=mock.',
    );
  }

  const kept = trimHistory(messages);
  const dropped = messages.length - kept.length;

  // Anything trimmed off the front is summarised as a fact rather than
  // silently vanishing, so the model does not answer as though the
  // conversation began mid-thought.
  const preamble = dropped > 0 ? `\n\n(Earlier in this conversation, ${dropped} message${dropped === 1 ? '' : 's'} have been omitted for length.)` : '';

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.CEREBRAS_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system + preamble },
          ...kept.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
  } catch {
    // DNS, TLS, connection refused — never reached the API at all.
    throw new Error("Can't reach the chat service right now. Please try again.");
  }

  // The free tier allows about 30 requests a minute, which a handful of
  // people typing at once can cross. Said plainly, because "429" in a chat
  // bubble tells a student nothing and blames them for it.
  if (res.status === 429) {
    throw new Error('The chat is busy right now. Give it a moment and try again.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Chat service error (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }

  const data = await res.json().catch(() => null);

  // A refusal or a length cut-off is not an answer, and reading content
  // without checking why generation stopped is how half a sentence reaches
  // someone as though it were the whole reply.
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
