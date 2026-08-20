import { getSession } from './session.js';

const API_BASE = import.meta.env.VITE_API_URL || '';
// The agent is its own deployable module, so it gets its own base URL.
const AGENT_BASE = import.meta.env.VITE_AGENT_URL || '';

async function request(path, options = {}, base = API_BASE) {
  const session = getSession();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.idToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function signup({ name, email, phone, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export function login({ identifier, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export function submitCheckin({ words, mood }) {
  return request('/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ words, mood }),
  });
}

export function getStatus() {
  return request('/api/checkins');
}

export function getProfile() {
  return request('/api/profile');
}

export function saveProfile(profile) {
  return request('/api/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function getCaregiverResidents() {
  return request('/api/caregiver/residents');
}

export function inviteResident({ name, email }) {
  return request('/api/caregiver/residents', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

export function getCaregiverResident(residentId) {
  return request(`/api/caregiver/resident?residentId=${encodeURIComponent(residentId)}`);
}

export function sendChat({ messages, checkin }) {
  return request(
    '/api/chat',
    { method: 'POST', body: JSON.stringify({ messages, checkin }) },
    AGENT_BASE,
  );
}
