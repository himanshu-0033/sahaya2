// Spoken replies, through the browser's own speechSynthesis. No key, no new
// dependency, and on most platforms the voice is generated on the device.
// The listening half lives in VoiceInputButton.jsx.
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

// One knob for both halves of the conversation, so the voice that answers is
// the one the recogniser is listening for. Indian English, as the deployment is.
export const VOICE_LANG = 'en-IN';

// A soft Indian English woman's voice, where the device has one.
//
// Browsers do not say which voices are female, so this goes by name, using the
// Indian English voices the platforms actually ship: Microsoft's Neerja (Edge)
// and Heera (Windows), Apple's Veena and Isha, and a few others seen on Android
// and in cloud voice packs. The male Indian voices are named too, so they rank
// last rather than being picked because they happen to be en-IN. Nothing here
// can install a voice: a device without one gets the closest thing it has.
const FEMALE = /neerja|heera|veena|isha|raveena|kajal|aditi|swara|ananya|lekha|\bfemale\b/i;
const MALE = /ravi|rishi|prabhat|hemant|aarav|kunal|madhur|\bmale\b/i;

export function pickVoice(voices) {
  const score = (v) =>
    (/^en[-_]in$/i.test(v.lang) ? 4 : /^en\b/i.test(v.lang) ? 1 : 0) +
    (FEMALE.test(v.name) ? 3 : 0) -
    (MALE.test(v.name) ? 5 : 0) +
    // The "natural" and "neural" voices are the ones that do not sound robotic.
    (/natural|neural|online/i.test(v.name) ? 1 : 0);
  const best = [...(voices || [])].sort((a, b) => score(b) - score(a))[0];
  return best && score(best) > 0 ? best : null;
}

// Voices load asynchronously in Chrome and Edge: getVoices() is empty until
// "voiceschanged" fires, so the choice is made then and remembered.
let voice = null;
if (canSpeak) {
  const choose = () => {
    voice = pickVoice(window.speechSynthesis.getVoices());
  };
  choose();
  window.speechSynthesis.addEventListener?.('voiceschanged', choose);
}

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}

// Slower than the companion's voice. This one paces a breath and reads a step
// to someone with their eyes shut, where the chat voice is answering a question.
export const GUIDE_RATE = 0.8;

// `onEnd` runs when the voice stops, including when there was no voice at all,
// because the hands-free loop reopens the mic from this callback and a browser
// without synthesis must not leave the person waiting for a turn that never comes.
export function speak(text, onEnd, rate = 0.9) {
  if (!canSpeak || !text) {
    onEnd?.();
    return;
  }
  // Anything still queued is abandoned: the newest reply is the one that
  // matters, and two voices over each other is worse than neither.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || VOICE_LANG;
  // Soft: a little slower and a little quieter than the default, at a natural
  // pitch. This is a companion, not a newsreader.
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
