import { useEffect, useRef, useState } from 'react';
import { VOICE_LANG } from './speech.js';

// Voice answers use the browser's own SpeechRecognition — no key, no new
// dependency. Support is uneven (Chrome and Edge yes, Firefox no, Safari
// partial), so the button renders nothing at all where it is missing rather
// than offering a control that quietly does nothing.
//
// Worth knowing where the audio goes: Chrome and Edge do not transcribe on the
// device, they stream the clip to the vendor's own speech service, the same way
// the OS keyboard's dictation key does. That is a third party this app does not
// otherwise talk to, which is why voice is never the only way to answer — the
// box beside it is always there, and nothing is recorded until a deliberate tap.
function getRecognition() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const SIZES = {
  lg: { box: 'h-14 w-14', icon: 22 },
  sm: { box: 'h-11 w-11', icon: 18 },
};

// `listenSignal` reopens the mic without a tap: increment it and this starts
// listening again. It is what lets the chat panel hold a hands-free
// conversation — reply spoken, then straight back to listening.
// `onError` hands the message to a parent that has somewhere better to put it
// than under a button; the caption below is only drawn at the large size.
export default function VoiceInputButton({
  onTranscript,
  disabled = false,
  size = 'lg',
  listenSignal = 0,
  onError = null,
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // The callbacks live in refs so that they can change on every render without
  // the effect below re-running. It used to depend on `onTranscript`, and every
  // caller rebuilds that function as they type — which aborted a recognition
  // session in the middle of a sentence. The chat panel re-renders on each
  // keystroke, so there it would have aborted constantly.
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const recognition = getRecognition();
    if (!recognition) return undefined;

    recognition.lang = VOICE_LANG;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) onTranscriptRef.current?.(transcript);
    };
    recognition.onerror = (event) => {
      // 'aborted' is this component tidying up after itself, and 'no-speech' is
      // someone opening the mic and saying nothing. Neither is worth a warning.
      if (event.error === 'aborted') return;
      const message =
        event.error === 'not-allowed'
          ? 'Microphone permission was declined'
          : 'Could not hear that, try typing instead';
      setError(message);
      onErrorRef.current?.(message);
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Already stopped — nothing to unwind.
      }
    };
  }, []);

  function startListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if it is already running; the onend handler settles it.
    }
  }

  useEffect(() => {
    if (!listenSignal || !supported || disabled) return;
    startListening();
    // startListening is stable for the life of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenSignal, supported, disabled]);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    startListening();
  }

  const { box, icon } = SIZES[size] || SIZES.lg;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={listening ? 'Stop listening' : 'Answer by voice'}
        aria-pressed={listening}
        className={`flex ${box} shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
          listening
            ? 'border-[var(--color-teal)] bg-[var(--color-teal)] text-[var(--color-ink)]'
            : 'border-[var(--color-teal)]/30 bg-[var(--color-teal-soft)] text-[var(--color-teal-dark)] hover:border-[var(--color-teal)]/60'
        }`}
        style={listening ? { animation: 'soft-pulse 1.6s ease-in-out infinite' } : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          width={icon}
          height={icon}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
          <path d="M12 18v3" />
        </svg>
      </button>
      {size === 'lg' && (listening || error) && (
        <p className="mt-2 max-w-[10rem] text-center text-[0.6875rem] leading-tight text-[var(--color-muted)]">
          {error || 'Listening…'}
        </p>
      )}
    </div>
  );
}
