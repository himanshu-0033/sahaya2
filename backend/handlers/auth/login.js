import bcrypt from 'bcryptjs';
import { getResidents } from '../../lib/store.js';
import { applyCors } from '../../lib/cors.js';
import { signSessionToken } from '../../lib/auth.js';
import { clientKey, limiter } from '../../lib/rate-limit.js';

// Email only. A phone number used to work here too, as the other half of
// phone sign-in; that is gone, and matching on a number nobody can sign in
// with would only produce a password prompt that never succeeds. The field
// itself stays on the record — the console still calls people.
function findByEmail(residents, identifier) {
  const email = identifier.trim().toLowerCase();
  if (!email) return undefined;
  return residents.find((r) => (r.email || '').toLowerCase() === email);
}

// Two counters, because one of them is always the wrong one to have.
//
// Counting per IP alone lets a list of addresses be tried one guess each from
// one machine, which is how credential stuffing actually works. Counting per
// account alone lets a botnet spread the same guesses across addresses. Doing
// both means a single client runs out of attempts and a single account stops
// accepting them, whichever comes first.
//
// The window is long on purpose. A minute-long window on a password form is a
// speed bump: an attacker waits a minute. Fifteen minutes costs a person who
// genuinely forgot their password one coffee and costs a guessing script most
// of its throughput.
//
// The per-account number is the strict one and the per-client number is
// deliberately loose, because this is built for a campus: a hall of students
// on one network is one IP as far as this file can tell, and a limit tuned to
// one person would lock out a corridor at nine in the morning. Ten attempts on
// a single account in a quarter of an hour is already far more than anybody
// types by hand, and an account is the thing an attacker is actually trying to
// open, so that is where the tight bound belongs. NAT does not blur it.
//
// ponytail: per-instance, like every other limiter here, so the real ceiling
// is (instances x max). It ends the unbounded case, which is the failure that
// matters; a shared counter in Mongo is the upgrade if this ever needs a true
// global cap.
const perClient = limiter({ windowMs: 15 * 60_000, max: 100 });
const perAccount = limiter({ windowMs: 15 * 60_000, max: 10 });

// One message for both "no such account" and "wrong password".
//
// handlers/auth/forgot.js goes out of its way never to say whether an address
// is registered, because an endpoint that does is a free membership check for
// anybody holding a list of email addresses, and the membership in question
// here is a mental-health app. This endpoint used to give that away in the
// friendlier of its two errors, which made the care taken in forgot.js
// decorative.
//
// The Google hint stays, because it is the useful half and most people who see
// this really did sign up that way. It is now said to everyone rather than
// only to the addresses that have an account, so it helps without confirming.
const REFUSED =
  'Incorrect email or password. If you signed up with Google, use "Continue with Google" instead.';

// A real bcrypt hash, of a random string nobody has, at the same cost factor
// the rest of the app uses.
//
// Identical wording on both refusals is only half of not answering the
// question. bcrypt.compare is deliberately slow, so an endpoint that runs it
// only when the account exists answers "is this address registered" in the
// response time instead of the response body, and the attacker does not even
// need to read the message. Comparing against this when there is no account
// makes both paths cost the same.
//
// It can never match: the plaintext was thrown away the moment it was hashed.
const DECOY_HASH = '$2b$10$t3rBSzyCaAPmrkKcbagZ2OFuaOavBUq9fwxFrOR7KnWz/sYYHe3vi';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Counted before the password is checked, so a wrong guess costs an attempt
  // whether or not the address exists. Counting only failures would let an
  // attacker keep a working account's counter at zero while guessing others.
  const account = String(identifier).trim().toLowerCase();
  if (perClient(clientKey(req)) || perAccount(account)) {
    return res.status(429).json({ error: 'Too many sign-in attempts. Try again in a few minutes.' });
  }

  const residents = await getResidents();
  const resident = findByEmail(residents, identifier);

  const valid = await bcrypt.compare(password, resident?.passwordHash || DECOY_HASH);
  if (!resident || !resident.passwordHash || !valid) {
    return res.status(401).json({ error: REFUSED });
  }

  const token = signSessionToken({ sub: resident.id, email: resident.email, name: resident.name });
  return res.status(200).json({ token });
}
