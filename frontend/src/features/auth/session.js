const SESSION_KEY = 'sahay:google-session';

// Fired when the server refuses the token we are holding.
//
// getSession() already drops a token whose `exp` has passed, but that only
// helps on the next read. A Google ID token lasts an hour and this is an app
// people leave open, so the common case is a tab that was signed in when it
// was opened and is not any more: the page is still mounted, still holding
// the session it read on mount, and still sending a dead token at every tap.
//
// Without this the student got "Invalid or expired session: jwt expired"
// rendered as an error, on the check-in, on the companion, on everything,
// with nothing on screen to act on and no way out but a manual reload. The
// companion is the part that matters: an expired tab is exactly the state
// somebody at two in the morning would find it in.
export const SIGNED_OUT_EVENT = 'sahay:signed-out';

export function decodeJwt(token) {
  const payload = token.split('.')[1];
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decodeURIComponent(escape(json)));
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.profile?.exp && session.profile.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession({ idToken, profile }) {
  const session = { idToken, profile };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
