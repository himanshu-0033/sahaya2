import { useEffect, useRef, useState } from 'react';

// Voice answers use the browser's own SpeechRecognition — no key, no
// upload, no new dependency. Support is uneven (Chrome and Edge yes, Firefox
// no, Safari partial), so the button renders nothing at all where it is
// missing rather than offering a control that quietly does nothing.
function getRecognition() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function VoiceInputButton({ onTranscript, disabled = false }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const recognition = getRecognition();
    if (!recognition) return undefined;

    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission was declined'
          : 'Could not hear that — try typing instead',
      );
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
  }, [onTranscript]);

  if (!supported) return null;

  function toggle() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    if (listening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if it is already running; the onend handler settles it.
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={listening ? 'Stop listening' : 'Answer by voice'}
        aria-pressed={listening}
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
          listening
            ? 'border-[var(--color-teal)] bg-[var(--color-teal)] text-white'
            : 'border-[var(--color-teal)]/30 bg-[var(--color-teal-soft)] text-[var(--color-teal-dark)] hover:border-[var(--color-teal)]/60'
        }`}
        style={listening ? { animation: 'soft-pulse 1.6s ease-in-out infinite' } : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
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
      {(listening || error) && (
        <p className="mt-2 max-w-[10rem] text-center text-[11px] leading-tight text-[var(--color-muted)]">
          {error || 'Listening…'}
        </p>
      )}
    </div>
  );
}
