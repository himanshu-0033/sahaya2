import { getSession } from './session.js';

const API_BASE = import.meta.env.VITE_API_URL || '';
// The agent is its own deployable module, so it gets its own base URL.
const AGENT_BASE = import.meta.env.VITE_AGENT_URL || '';

// An error the UI can act on, rather than a bare string.
//
// `offline` marks the case where the request never reached a server at all —
// fetch() rejects with a TypeError whose message is the famously unhelpful
// "Failed to fetch". Rendering that verbatim tells a student nothing and
// offers them nothing to do, so it is tagged here and the pages turn it into
// a real message with a retry.
export class ApiError extends Error {
  constructor(message, { status = 0, offline = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.offline = offline;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Statuses that mean "the API itself never answered" rather than "the API
// answered and said no". A dev server mid-restart, or a serverless cold start
// that timed out, surfaces as one of these — from the proxy in front of the
// API, not from the API. They are treated exactly like a dropped connection:
// worth retrying, and worth describing to the user as a reachability problem
// rather than quoting a bare status code at them.
const UPSTREAM_DOWN = new Set([502, 503, 504]);

async function request(path, options = {}, base = API_BASE) {
  const session = getSession();
  const method = (options.method || 'GET').toUpperCase();

  // Retry only reads, and only on a network-level failure. A GET is safe to
  // repeat; a POST is not — retrying a check-in or a logged practice would
  // duplicate it. The delay covers the common local case of the dev server
  // being a second into a restart.
  const attempts = method === 'GET' ? 3 : 1;
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let res;
    try {
      res = await fetch(`${base}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.idToken}` } : {}),
          ...(options.headers || {}),
        },
      });
    } catch {
      // Network-level: DNS, connection refused, CORS, offline, server mid-restart.
      lastError = new ApiError(
        navigator.onLine === false
          ? "You're offline. Check your connection and try again."
          : "Can't reach the server right now.",
        { offline: true },
      );
      if (attempt < attempts - 1) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw lastError;
    }

    if (UPSTREAM_DOWN.has(res.status)) {
      lastError = new ApiError("Can't reach the server right now.", {
        status: res.status,
        offline: true,
      });
      if (attempt < attempts - 1) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw lastError;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // A real answer with a real status is the API talking, not a
      // reachability problem — never retried, and reported as it was sent.
      throw new ApiError(data?.error || `Request failed (${res.status})`, { status: res.status });
    }
    return data;
  }

  throw lastError;
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

// Sharing. Only the resident's own session can call these — the server writes
// to the record belonging to the signed-in user and nothing else, so there is
// no residentId to pass.
export function getSharing() {
  return request('/api/sharing');
}

export function shareWith(email) {
  return request('/api/sharing', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function stopSharingWith(email) {
  return request('/api/sharing', {
    method: 'DELETE',
    body: JSON.stringify({ email }),
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

export function getInkblotTest() {
  return request('/api/inkblot-test');
}

export function submitInkblotTest({ responses }) {
  return request('/api/inkblot-test', {
    method: 'POST',
    body: JSON.stringify({ responses }),
  });
}

export function getAssessmentCatalog() {
  return request('/api/assessments');
}

export function getAssessmentInstrument(instrumentId) {
  return request(`/api/assessments?instrumentId=${encodeURIComponent(instrumentId)}`);
}

// `followUp` is the unscored trailing question a form may carry (the PHQ-9's
// difficulty question). Null when the instrument has none, or when it was
// asked and skipped.
export function submitAssessment({ instrumentId, answers, followUp = null }) {
  return request('/api/assessments', {
    method: 'POST',
    body: JSON.stringify({ instrumentId, answers, followUp }),
  });
}

export function getGroundingCatalog() {
  return request('/api/grounding');
}

export function getGroundingTechnique(techniqueId) {
  return request(`/api/grounding?techniqueId=${encodeURIComponent(techniqueId)}`);
}

export function logGroundingPractice({ techniqueId, secondsPracticed, completed, before, after }) {
  return request('/api/grounding', {
    method: 'POST',
    body: JSON.stringify({ techniqueId, secondsPracticed, completed, before, after }),
  });
}

export function getPaths() {
  return request('/api/paths');
}

export function getPath(pathId) {
  return request(`/api/paths?pathId=${encodeURIComponent(pathId)}`);
}

// action: 'start' | 'complete' | 'undo' | 'leave'
export function updatePath({ pathId, action, day }) {
  return request('/api/paths', {
    method: 'POST',
    body: JSON.stringify({ pathId, action, day }),
  });
}
