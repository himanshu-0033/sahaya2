// A caregiver-created placeholder (no auth account yet) is replaced, not
// duplicated, once the real person signs up or signs in with a matching
// email — this drops the stale placeholder from the list.
export function withoutInvitedPlaceholder(residents, email) {
  const normalized = (email || '').toLowerCase();
  return residents.filter((r) => !(r.invited && (r.email || '').toLowerCase() === normalized));
}
