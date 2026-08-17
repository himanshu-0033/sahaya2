const KEY = 'sahay:identity';

function makeId() {
  return 'r_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getIdentity() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveIdentity({ name, room }) {
  const existing = getIdentity();
  const identity = {
    id: existing?.id || makeId(),
    name: name.trim(),
    room: room.trim(),
  };
  localStorage.setItem(KEY, JSON.stringify(identity));
  return identity;
}

export function clearIdentity() {
  localStorage.removeItem(KEY);
}
