// The same email and phone rules as backend/lib/contact.js, for the console's
// forms. backend/test/contact.test.mjs runs one table of cases through every
// copy and fails if they disagree.
const EMAIL = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value) {
  const email = String(value || '').trim();
  return email.length <= 254 && !email.includes('..') && EMAIL.test(email);
}

export function isValidPhone(value) {
  const raw = String(value || '').trim();
  if (!/^\+?[\d\s()-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+91')) return /^91[6-9]\d{9}$/.test(digits);
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15;
  return /^0?[6-9]\d{9}$/.test(digits);
}

// For a number box that sits beside a country-code picker: keep only digits as
// they are typed, and no more than a phone number can hold.
export const digitsOnly = (value, max = 15) => String(value || '').replace(/\D/g, '').slice(0, max);

export const PHONE_MESSAGE = 'Enter a valid mobile number: 10 digits for India, starting with 6, 7, 8 or 9.';
export const EMAIL_MESSAGE = 'Enter a valid email address, like name@college.edu.';
