import { getResidents, appendRecord, upsertRecord, removeRecords } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireGoogleUser } from '../lib/auth.js';
import { publicResident } from '../lib/sanitize.js';
import { invitedPlaceholders } from '../lib/residents.js';
import { phonesMatch } from '../lib/phone.js';

// Long enough for any real name or number, short enough that the field cannot
// be used as storage. The same reasoning, and roughly the same ceiling, as the
// 60-character cap on a check-in word.
const MAX_NAME = 120;
const MAX_PHONE = 32;

// A date input sends exactly this, and nothing else is a date of birth. The
// value is shown in the counsellor console and exported, so it is validated
// rather than trusted: this endpoint is reachable with any body, not only
// through the form that normally fills it.
function cleanDob(value) {
  const raw = (value || '').trim();
  if (!raw) return { dob: '' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { error: 'Date of birth must be a calendar date.' };
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return { error: 'That is not a real date.' };
  if (parsed.getTime() > Date.now()) return { error: 'A date of birth cannot be in the future.' };
  if (parsed.getUTCFullYear() < 1900) return { error: 'That date of birth is too far back to be right.' };
  return { dob: raw };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const googleUser = await requireGoogleUser(req, res);
  if (!googleUser) return;
  const residentId = googleUser.sub;

  if (req.method === 'GET') {
    const residents = await getResidents();
    const profile = residents.find((r) => r.id === residentId) || null;
    // hasPassword, not the hash: the account page needs to know whether to
    // offer a password form at all, and a Google account has nothing to
    // change. Derived here rather than in publicResident() because the
    // consoles that also use that helper have no business knowing.
    return res.status(200).json({
      profile: profile ? { ...publicResident(profile), hasPassword: Boolean(profile.passwordHash) } : null,
    });
  }

  if (req.method === 'POST') {
    // address and occupation used to be collected here. They were never read
    // by anything — only displayed back in the console and the CSV export —
    // so they are no longer accepted. See components/AccountForm.jsx.
    const { name, email, dob, phone } = req.body || {};

    const residents = await getResidents();
    const idx = residents.findIndex((r) => r.id === residentId);
    const existing = idx === -1 ? null : residents[idx];
    const now = new Date().toISOString();

    const { dob: cleanedDob, error: dobError } = cleanDob(dob);
    if (dobError) return res.status(400).json({ error: dobError });

    const trimmedName = (name || '').trim().slice(0, MAX_NAME);
    const trimmedPhone = (phone || '').trim().slice(0, MAX_PHONE);

    // The email address on an existing record is not editable here, and the
    // field is ignored rather than refused so that a form posting the address
    // it was shown still saves. It is the identity the login lookup matches
    // on and the one the counsellor console knows a person by; letting an
    // account claim an address it never proved it holds means claiming
    // somebody else's, which locks the real owner out of their own sign-in.
    const claimedEmail = existing
      ? existing.email || ''
      : (email || '').trim() || googleUser.email || '';

    if (!existing) {
      const normalized = claimedEmail.toLowerCase();
      const taken = residents.some(
        (r) => !r.invited && r.id !== residentId && (r.email || '').toLowerCase() === normalized,
      );
      if (taken) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
    }

    // The console calls this number, so two accounts holding it means calling
    // one person about another. Signup already refuses a duplicate; this is
    // the same check on the other door into the same field.
    if (trimmedPhone) {
      const taken = residents.some((r) => r.id !== residentId && phonesMatch(r.phone, trimmedPhone));
      if (taken) {
        return res.status(409).json({ error: 'This phone number is already in use by another account.' });
      }
    }

    const profile = {
      id: residentId,
      // A blank name falls back to the one already stored before the one on
      // the token, which can be months stale by now. Only a brand new record
      // has nothing better to fall back to.
      name: trimmedName || existing?.name || googleUser.name,
      email: claimedEmail,
      // Blank means unchanged here too, for the same reason as the phone
      // below it: a form that did not load the field must not clear it.
      dob: cleanedDob || existing?.dob || '',
      // A blank field here means "unchanged", not "delete it" — the number is
      // contact detail the console relies on, and it is easy to wipe by
      // saving a form that never loaded it.
      phone: trimmedPhone || existing?.phone || '',
      onboarded: true,
      updatedAt: now,
    };

    if (idx === -1) {
      for (const stale of invitedPlaceholders(residents, profile.email)) {
        await removeRecords('residents', { id: stale.id });
      }
      await appendRecord('residents', { ...profile, createdAt: now });
    } else {
      await upsertRecord('residents', { id: residentId }, { ...residents[idx], ...profile });
    }

    return res.status(200).json({ profile });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed' });
}
