import { useEffect, useRef, useState } from 'react';
import { decodeJwt, saveSession } from './session.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services renders into an iframe and only accepts a pixel
// number for width — a CSS length won't work. So we measure our own container
// and re-render at that size, which keeps the button flush with its siblings
// and stops it overflowing narrow phones.
const GIS_MIN_WIDTH = 200;
const GIS_MAX_WIDTH = 400;

export default function GoogleSignInButton({ onSignedIn, dark = false }) {
  const wrapRef = useRef(null);
  const slotRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).');
      return;
    }
    if (!width) return;

    let cancelled = false;
    let poll;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !slotRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          const profile = decodeJwt(response.credential);
          const session = saveSession({ idToken: response.credential, profile });
          onSignedIn(session);
        },
      });
      // renderButton appends, so clear first or resizes stack up copies.
      slotRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(slotRef.current, {
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        width: Math.min(GIS_MAX_WIDTH, Math.max(GIS_MIN_WIDTH, width)),
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      poll = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(poll);
          init();
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [onSignedIn, dark, width]);

  if (error) {
    // On the dark heroes the light coral is the readable one; on cream it is
    // 2.4:1 and the deep step is 5.5:1.
    return (
      <p className={`text-sm ${dark ? 'text-[var(--color-flag)]' : 'text-[var(--color-flag-deep)]'}`}>
        {error}
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="w-full">
      <div ref={slotRef} className="flex justify-center" />
    </div>
  );
}
