import { getSession } from './session.js';

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
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function submitCheckin({ room, words, mood }) {
  return request('/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ room, words, mood }),
  });
}

export function getStatus() {
  return request('/api/checkins');
}

export function getCaregiverResidents() {
  return request('/api/caregiver/residents');
}

export function getCaregiverResident(residentId) {
  return request(`/api/caregiver/resident?residentId=${encodeURIComponent(residentId)}`);
}
