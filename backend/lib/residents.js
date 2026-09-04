// A caregiver-created placeholder (no auth account yet) is replaced, not
// duplicated, once the real person signs up or signs in with a matching
// email.
//
// This used to return the list without the placeholder, because the caller
// then saved that whole list back. Records are their own documents now, so
// the caller deletes the placeholders instead — and what it needs is the
// records to delete, not the ones to keep.
export function invitedPlaceholders(residents, email) {
  const normalized = (email || '').toLowerCase();
  return residents.filter((r) => r.invited && (r.email || '').toLowerCase() === normalized);
}
