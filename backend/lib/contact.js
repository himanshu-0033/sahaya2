// What counts as a real email address and a real phone number, everywhere the
// backend accepts one. frontend/src/shared/contact.js is the same rules for the
// forms, so a mistake is caught before it is sent; backend/test/contact.test.mjs
// runs one table of cases through both copies.
//
// Deliberately the shape of a real address, not full RFC 5322: a local part, an
// @, a domain with at least one dot, and a top-level domain of two or more
// letters. "name@college" and "name@@mail.com" are refused; "a.b+c@mail.co.in"
// is fine.
const EMAIL = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value) {
  const email = String(value || '').trim();
  return email.length <= 254 && !email.includes('..') && EMAIL.test(email);
}

// Indian mobiles are checked exactly: ten digits starting 6 to 9, written bare,
// with a leading 0, or after +91. Any other country code gets the international
// limit of 8 to 15 digits in total, since each country's own rules are beyond
// what a form should guess at. Spaces, dashes and brackets are allowed as
// people type them; letters are not.
export function isValidPhone(value) {
  const raw = String(value || '').trim();
  if (!/^\+?[\d\s()-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+91')) return /^91[6-9]\d{9}$/.test(digits);
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15;
  return /^0?[6-9]\d{9}$/.test(digits);
}
