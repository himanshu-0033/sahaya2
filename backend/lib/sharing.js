// Who may see a resident's data.
//
// Two independent gates, and both have to pass:
//
//   1. THE ALLOWLIST decides who may open the console at all. It is an
//      operational control — the staff of a deployment — and it lives in the
//      environment (see requireAdminUser in auth.js).
//   2. THE SHARE decides whose data that person then sees. It is a consent
//      control, it lives on the resident's own record, and only the resident
//      can change it.
//
// These used to be one thing: being on the allowlist meant seeing everybody in
// the deployment. For a hostel with one warden and forty residents he already
// knows by name, that is a fair model of the real relationship. For an app
// anyone can sign up to it is not — it means a handful of people the user has
// never heard of can read every mood entry, every written word, and every
// risk screen in the system.
//
// The default is nobody. A resident who has shared with no one is visible to
// no one: not to a counsellor on the allowlist, not to whoever invited them,
// not to the person who deployed the app. Making that the default is the whole
// point — consent that has to be withdrawn is not consent.

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// Always an array of normalised emails, whatever the record actually holds.
// Records written before sharing existed have no field at all, and those
// residents are correctly invisible until they choose otherwise.
export function sharedWithList(resident) {
  const raw = resident?.sharedWith;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEmail).filter(Boolean);
}

export function canView(resident, viewerEmail) {
  const viewer = normalizeEmail(viewerEmail);
  if (!viewer) return false;
  return sharedWithList(resident).includes(viewer);
}

export function visibleResidents(residents, viewerEmail) {
  const viewer = normalizeEmail(viewerEmail);
  if (!viewer) return [];
  return residents.filter((r) => canView(r, viewer));
}

// Scoping the resident list is not enough on its own: the overview builds
// cohort figures straight from the check-in and assessment collections, so
// those have to be narrowed to the same people or the totals count residents
// the viewer cannot open.
export function recordsForResidents(records, residents) {
  const ids = new Set(residents.map((r) => r.id));
  return records.filter((record) => ids.has(record.residentId));
}

export function addShare(resident, viewerEmail) {
  const viewer = normalizeEmail(viewerEmail);
  const current = sharedWithList(resident);
  if (!viewer || current.includes(viewer)) return current;
  return [...current, viewer];
}

export function removeShare(resident, viewerEmail) {
  const viewer = normalizeEmail(viewerEmail);
  return sharedWithList(resident).filter((e) => e !== viewer);
}
