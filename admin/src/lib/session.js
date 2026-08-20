// Deliberately a different storage key from the resident app's
// 'sahay:google-session': a counsellor can have the console open in one
// window and their own check-in in another without the two overwriting each
// other. localStorage (not sessionStorage) so a console refresh or a second
// tab of the console keeps the same signed-in counsellor.
const SESSION_KEY = 'sahay:admin-session';

export function decodeJwt(token) {
  const payload = token.split('.')[1];
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decodeURIComponent(escape(json)));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.profile?.exp && session.profile.exp * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession({ idToken, profile }) {
  const session = { idToken, profile };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
