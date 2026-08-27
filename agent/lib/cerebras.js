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

// gemma-4-31b and gpt-oss-120b are the free-tier models. An env var because
// that list is Cerebras's to change, and a model id baked into source becomes
// a 404 the day they retire one.
//
// Gemma is the default over gpt-oss-120b, which is a reasoning model: this
// asks for two or three warm sentences, and paying for a chain of thought to
// produce them is the wrong trade twice over — slower, and the reasoning
// competes with the answer for the token budget (see below).
const DEFAULT_MODEL = 'gemma-4-31b';

// The budget is deliberately far above the two or three sentences the persona
// asks for. Cerebras counts reasoning tokens inside this limit — its docs say
// "the maximum number of tokens that can be generated in the completion,
// including reasoning tokens" — so on a reasoning model a snug budget is spent
// thinking and the visible reply comes back empty. Brevity is the system
// prompt's job; this is only a ceiling.
const MAX_COMPLETION_TOKENS = 1024;

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
        // Not `max_tokens`. That is the OpenAI-compatible spelling and the one
        // this was first written with; Cerebras's API reference lists only
        // `max_completion_tokens`, so the old name went through as an unknown
        // field and bounded nothing at all.
        max_completion_tokens: MAX_COMPLETION_TOKENS,
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

  // 401 is a bad or revoked key; 402 is a valid key on an account with no
  // quota left — or none ever granted, which is what a fresh key on an
  // unactivated free tier returns. Both are ours to fix and neither is
  // anything the person typing can do something about, so they get one
  // honest sentence while the detail goes to the server log.
  if (res.status === 401 || res.status === 402) {
    console.error(
      `[cerebras] ${res.status} — ${res.status === 401 ? 'CEREBRAS_API_KEY rejected' : 'no quota on this account; check the billing tab at cloud.cerebras.ai'}`,
    );
    throw new Error('The chat is not available right now.');
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
