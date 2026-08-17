const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function submitCheckin({ residentId, name, room, words, mood }) {
  return request('/api/checkins', {
    method: 'POST',
    body: JSON.stringify({ residentId, name, room, words, mood }),
  });
}

export function getStatus(residentId) {
  return request(`/api/checkins?residentId=${encodeURIComponent(residentId)}`);
}

export function getCaregiverResidents(key) {
  return request('/api/caregiver/residents', {
    headers: key ? { 'x-caregiver-key': key } : {},
  });
}

export function getCaregiverResident(residentId, key) {
  return request(`/api/caregiver/resident?residentId=${encodeURIComponent(residentId)}`, {
    headers: key ? { 'x-caregiver-key': key } : {},
  });
}
