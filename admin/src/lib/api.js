import { clearSession, getSession } from './session.js';

// Google ID tokens expire after an hour. Rather than leaving the console
// showing a stale error, drop the dead session and let App re-render the
// sign-in screen.
export const SIGNED_OUT_EVENT = 'sahay:signed-out';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const session = getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.idToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent(SIGNED_OUT_EVENT, { detail: data?.error }));
    }
    const error = new Error(data?.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export function login({ identifier, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

// Confirms the signed-in account is on the counsellor allowlist.
export function getAdmin() {
  return request('/api/admin/me');
}

export function getOverview() {
  return request('/api/admin/overview');
}

export function getResidents() {
  return request('/api/admin/residents');
}

export function getResident(residentId) {
  return request(`/api/admin/resident?residentId=${encodeURIComponent(residentId)}`);
}

export function inviteResident({ name, email }) {
  return request('/api/admin/residents', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}
