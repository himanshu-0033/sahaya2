// Spoken replies, through the browser's own speechSynthesis. No key, no new
// dependency, and on most platforms the voice is generated on the device.
// The listening half lives in VoiceInputButton.jsx.
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

// One knob for both halves of the conversation, so the voice that answers is
// the one the recogniser is listening for. Indian English, as the deployment is.
export const VOICE_LANG = 'en-IN';

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}

// Slower than the companion's voice. This one paces a breath and reads a step
// to someone with their eyes shut, where the chat voice is answering a question.
export const GUIDE_RATE = 0.82;

// `onEnd` runs when the voice stops, including when there was no voice at all,
// because the hands-free loop reopens the mic from this callback and a browser
// without synthesis must not leave the person waiting for a turn that never comes.
export function speak(text, onEnd, rate = 0.95) {
  if (!canSpeak || !text) {
    onEnd?.();
    return;
  }
  // Anything still queued is abandoned: the newest reply is the one that
  // matters, and two voices over each other is worse than neither.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LANG;
  // A shade under default by default. This is a companion, not a newsreader.
  utterance.rate = rate;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
