const SESSION_KEY = 'sahay:google-session';

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

export function getRoom(sub) {
  return localStorage.getItem(`sahay:room:${sub}`) || '';
}

export function saveRoom(sub, room) {
  localStorage.setItem(`sahay:room:${sub}`, room.trim());
}
