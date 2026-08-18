import { useEffect, useRef, useState } from 'react';
import { decodeJwt, saveSession } from '../lib/session.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSignedIn }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    let cancelled = false;

    function init() {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          const profile = decodeJwt(response.credential);
          const session = saveSession({ idToken: response.credential, profile });
          onSignedIn(session);
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 320,
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const id = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(id);
          init();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
  }, [onSignedIn]);

  if (error) {
    return <p className="text-sm text-[var(--color-flag)]">{error}</p>;
  }

  return <div ref={ref} />;
}
