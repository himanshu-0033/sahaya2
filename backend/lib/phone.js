export function phoneDigits(value) {
  return (value || '').replace(/\D/g, '');
}

// Treats two phone numbers as the same if one is a suffix of the other, so
// "9876543210" matches "+91 98765 43210" regardless of country-code prefix.
export function phonesMatch(a, b) {
  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (!da || !db) return false;
  return da === db || da.endsWith(db) || db.endsWith(da);
}
