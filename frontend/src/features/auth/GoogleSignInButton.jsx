import { useEffect, useRef, useState } from 'react';
import { decodeJwt, saveSession } from './session.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services renders into an iframe and only accepts a pixel
// number for width — a CSS length won't work. So we measure our own container
// and re-render at that size, which keeps the button flush with its siblings
// and stops it overflowing narrow phones.
const GIS_MIN_WIDTH = 200;
const GIS_MAX_WIDTH = 400;

export default function GoogleSignInButton({ onSignedIn }) {
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
        // Google's own sign-in opens in a separate browser window rather than
        // inside this page. Popup is already the default; it is written down
        // because the alternative ('redirect') navigates this tab away to
        // Google and needs a server `login_uri` to POST the credential back,
        // which this app does not have. Whether the browser gives that window
        // a tab or a panel is the browser's call, not something a site can ask
        // for — and a blocked popup is the one failure worth watching for.
        ux_mode: 'popup',
        callback: (response) => {
          const profile = decodeJwt(response.credential);
          const session = saveSession({ idToken: response.credential, profile });
          onSignedIn(session);
        },
      });
      // renderButton appends, so clear first or resizes stack up copies.
      slotRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(slotRef.current, {
        theme: 'outline',
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
  }, [onSignedIn, width]);

  if (error) {
    // The deep step: the light coral is 2.4:1 on cream, this is 5.5:1.
    return (
      <p className="text-sm text-[var(--color-flag-deep)]">
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
