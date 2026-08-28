import { SYSTEM_PROMPT } from './persona.js';
import { cerebrasReply } from './cerebras.js';
import { geminiReply } from './gemini.js';

// ---------------------------------------------------------------------------
// THE SEAM
//
// Everything above this line is provider-agnostic. To go live, add a real
// provider below and set AGENT_PROVIDER to its name. Nothing else in the app
// needs to change — api/chat.js only ever calls generateReply().
//
// A real provider is an async function ({ system, messages }) => string, where
// `messages` is [{ role: 'user' | 'assistant', content: string }, ...].
//
// `anthropic` below is one such provider. `mock` remains the default, so
// nothing changes until AGENT_PROVIDER says otherwise.
// ---------------------------------------------------------------------------

const REFLECTIONS = [
  "That sounds like it's taking up a lot of room. What does it feel like when it's at its loudest?",
  'Thank you for saying that out loud. How long has it been sitting with you?',
  "I hear you. Is this a new thing, or something that's been building?",
  "That's a lot to hold. Is there anyone around you who knows about it?",
  'Makes sense that would land hard. What would make today even slightly lighter?',
  "I'm listening. What part of it feels most tangled right now?",
];

const ACKNOWLEDGEMENTS = [
  'That makes sense.',
  'Fair enough.',
  'That tracks.',
  'I can see that.',
];

const CLOSERS = [
  "Whatever today looked like, you showed up for the check-in. That counts for something.",
  "You don't have to resolve it tonight. Resting on it is allowed.",
  'Thanks for telling me. Come back tomorrow if you want to pick it up again.',
];

// Deterministic pick so the same conversation replays identically while
// prototyping — no random churn between refreshes.
function pick(list, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(hash) % list.length];
}

function mockReply({ messages }) {
  const userTurns = messages.filter((m) => m.role === 'user');
  const last = userTurns[userTurns.length - 1]?.content || '';
  const turnCount = userTurns.length;

  if (turnCount >= 5) return pick(CLOSERS, last);
  if (last.trim().length < 12) {
    return `${pick(ACKNOWLEDGEMENTS, last)} Want to say a bit more about that?`;
  }
  return pick(REFLECTIONS, last);
}

// ---------------------------------------------------------------------------
// ANTHROPIC
//
// Claude, via the official SDK. Reached only when AGENT_PROVIDER=anthropic.
// ---------------------------------------------------------------------------

const MODEL = 'claude-opus-5';

// max_tokens has to cover the model's own reasoning as well as the reply, and
// adaptive thinking is on by default. Sizing this to the two or three
// sentences the persona asks for would truncate the answer somewhere inside
// the thinking, and the user would get an empty bubble. So: generous ceiling,
// and the brevity comes from SYSTEM_PROMPT, which is where it belongs.
const MAX_TOKENS = 2048;

// The SDK is loaded on first use rather than imported at the top of the file,
// so that `mock` keeps its promise of needing no key, no network and no
// dependency. A stale node_modules should not be able to take the chat down
// for someone who never asked for a real model.
let clientPromise = null;

async function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to agent/.env.local, or set AGENT_PROVIDER=mock.',
    );
  }
  if (!clientPromise) {
    clientPromise = import('@anthropic-ai/sdk').then(({ default: Anthropic }) => new Anthropic());
  }
  return clientPromise;
}

// The API requires the first message to be from the user. Our history never
// is: the panel opens the conversation by asking for an opening line and
// storing it as the first assistant turn, so messages[0] is always assistant.
//
// Dropping it outright would work and would also throw away the thing the
// user's first reply is a reply *to* ("You wrote 'tired', 'flat' today. What's
// sitting heaviest?"), leaving Claude to answer an unprompted fragment. So the
// leading assistant turns move into the system prompt as context, and what is
// left starts with a user turn, as required.
function splitOpening(messages) {
  let i = 0;
  while (i < messages.length && messages[i].role === 'assistant') i += 1;
  return { opening: messages.slice(0, i), rest: messages.slice(i) };
}

async function anthropicReply({ system, messages }) {
  const client = await getClient();
  const { opening, rest } = splitOpening(messages);

  if (rest.length === 0) {
    // Nothing but assistant turns — there is no question to answer.
    throw new Error('No user message to reply to.');
  }

  const systemPrompt = opening.length
    ? [
        system,
        '',
        'You have already opened this conversation by saying:',
        ...opening.map((m) => m.content),
      ].join('\n')
    : system;

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: rest.map((m) => ({ role: m.role, content: m.content })),
    // Short, warm reflection — not a reasoning problem. Low effort keeps the
    // latency and the bill down without disabling thinking, which on this
    // model can leak internal tags into the visible reply.
    output_config: { effort: 'low' },
    // A safety classifier can decline a turn outright, and this is an app
    // where people talk about being unwell — precisely the material most
    // likely to trip one. Rather than failing the conversation, the request
    // is re-run server-side on a fallback model within the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });

  // stop_reason is checked before the content is read: on a refusal the
  // content is not an answer, and on max_tokens it is a half-finished one.
  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to answer that.');
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!text) {
    throw new Error(
      response.stop_reason === 'max_tokens'
        ? 'The reply ran out of room before it was finished.'
        : 'The model returned an empty reply.',
    );
  }
  return text;
}

const PROVIDERS = {
  // Scripted stand-in: no network, no key, no model. Exists so the chat flow,
  // safety layer and UI can be built and tested before a provider is chosen.
  mock: mockReply,

  // Claude. Needs ANTHROPIC_API_KEY; see agent/.env.example.
  anthropic: anthropicReply,

  // Cerebras, on its free tier. Needs CEREBRAS_API_KEY; see agent/.env.example.
  // Lives in its own file because, unlike the two above, it carries real
  // request-shaping logic — history trimming and rate-limit handling.
  cerebras: cerebrasReply,

  // Google Gemini, via its OpenAI-compatible endpoint. Needs GEMINI_API_KEY
  // from aistudio.google.com. Free tier: 15 RPM, 1500 requests/day.
  gemini: geminiReply,
};

export const activeProvider = process.env.AGENT_PROVIDER || 'mock';
export const isMock = activeProvider === 'mock';

export async function generateReply(messages) {
  const impl = PROVIDERS[activeProvider];
  if (!impl) {
    throw new Error(
      `AGENT_PROVIDER "${activeProvider}" is not implemented. Add it to PROVIDERS in agent/lib/provider.js.`,
    );
  }
  return impl({ system: SYSTEM_PROMPT, messages });
}
