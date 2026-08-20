import { SYSTEM_PROMPT } from './persona.js';

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
// Sketch, once you have a key:
//
//   async function anthropicReply({ system, messages }) {
//     const res = await fetch('https://api.anthropic.com/v1/messages', {
//       method: 'POST',
//       headers: {
//         'content-type': 'application/json',
//         'x-api-key': process.env.ANTHROPIC_API_KEY,
//         'anthropic-version': '2023-06-01',
//       },
//       body: JSON.stringify({ model: <model-id>, max_tokens: 300, system, messages }),
//     });
//     const data = await res.json();
//     return data.content[0].text;
//   }
//
// Confirm the current model id and request shape against the provider's docs
// before shipping — don't copy the sketch blind.
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

const PROVIDERS = {
  // Scripted stand-in: no network, no key, no model. Exists so the chat flow,
  // safety layer and UI can be built and tested before a provider is chosen.
  mock: mockReply,
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
