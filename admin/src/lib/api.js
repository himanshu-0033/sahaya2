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

// Super admin: who may sign in to the admin panel.
export function addStaff(email) {
  return request('/api/admin/staff', { method: 'POST', body: JSON.stringify({ email }) });
}

export function removeStaff(email) {
  return request('/api/admin/staff', { method: 'DELETE', body: JSON.stringify({ email }) });
}

// Counsellor or manager, asked once on first sign-in.
export function setRole(role) {
  return request('/api/admin/role', { method: 'POST', body: JSON.stringify({ role }) });
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

// Records that a CSV left the console. Called before the file is built.
//
// Deliberately fire-and-forget at the call site: a counsellor should never be
// blocked from their own caseload because an audit write timed out. A failed
// write shows up as a gap in the log, which is visible; a blocked export shows
// up as an app that does not work.
export function logExport({ scope, residentId = null, rowCount = null }) {
  return request('/api/admin/audit', {
    method: 'POST',
    body: JSON.stringify({ scope, residentId, rowCount }),
  });
}

// Super admin: every counsellor's caseload, and assigning them to students.
export function getTeam() {
  return request('/api/admin/team');
}

export function assignCounsellor({ residentId, email }) {
  return request('/api/admin/assign', { method: 'POST', body: JSON.stringify({ residentId, email }) });
}

export function unassignCounsellor({ residentId, email }) {
  return request('/api/admin/assign', { method: 'DELETE', body: JSON.stringify({ residentId, email }) });
}

// What came in through the landing page's enquiry form.
export function getEnquiries() {
  return request('/api/enquiries');
}

export function getExportLog() {
  return request('/api/admin/audit');
}
