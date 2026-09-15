import { randomUUID } from 'node:crypto';
import { appendRecord, getEnquiries } from '../lib/store.js';
import { applyCors } from '../lib/cors.js';
import { requireAdminUser } from '../lib/auth.js';
import { isValidEmail, isValidPhone } from '../lib/contact.js';
import { clientKey, limiter } from '../lib/rate-limit.js';

// "Bring this to our campus": the form on the landing page, for a college,
// hostel or organisation asking about the app before anyone there has an
// account.
//
// POST is open, because the person filling it in has no session and should not
// need one to ask a question. GET is the counsellor console, behind the same
// allowlist as the rest of it. An enquiry is an organisation's contact details,
// not a resident's data, so it is not behind anyone's share.
//
// The lists below are the values the form offers. They are stored as the words
// themselves, so the console can show them without a second copy of the list.
export const ENQUIRY_TYPES = ['Bring it to my campus', 'Partner with us', 'Other enquiries'];
export const HEARD_FROM = [
  'Word of mouth',
  'News or press',
  'Conference or event',
  'Blog or article',
  'LinkedIn post',
  'Social media ad',
  'Instagram post',
  'Others',
];

const REQUIRED = ['firstName', 'lastName', 'organization', 'role'];
const MAX_FIELD = 120;
const MAX_MESSAGE = 2000;

// Every submission is a stored record from a stranger, so the limit is far
// tighter than the quick check's: nobody fills in a contact form three times a
// minute.
const overLimit = limiter({ max: 3 });

const text = (v) => (typeof v === 'string' ? v.trim() : '');

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    const admin = await requireAdminUser(req, res);
    if (!admin) return;
    const all = await getEnquiries();
    return res.status(200).json({
      enquiries: all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (overLimit(clientKey(req))) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'That form was just sent. Give it a minute.' });
  }

  const body = req.body || {};

  // A field no person can see. A bot filling in every input fills this one too,
  // and is told it worked, so it has no reason to try again differently.
  if (text(body.website)) return res.status(201).json({ saved: true });

  if (!ENQUIRY_TYPES.includes(body.type)) {
    return res.status(400).json({ error: 'Pick what the enquiry is about.' });
  }
  for (const field of REQUIRED) {
    const value = text(body[field]);
    if (!value) return res.status(400).json({ error: 'Please fill in every field marked *.' });
    if (value.length > MAX_FIELD) return res.status(400).json({ error: 'One of the fields is too long.' });
  }
  const email = text(body.email).toLowerCase();
  if (!isValidEmail(email) || email.length > MAX_FIELD) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const phone = text(body.phone);
  if (!isValidPhone(phone) || phone.length > 30) {
    return res.status(400).json({ error: 'Enter a valid phone number.' });
  }
  const message = text(body.message);
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: `Keep the message under ${MAX_MESSAGE} characters.` });
  }
  const heardFrom = Array.isArray(body.heardFrom)
    ? [...new Set(body.heardFrom.filter((h) => HEARD_FROM.includes(h)))]
    : [];

  await appendRecord('enquiries', {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    type: body.type,
    firstName: text(body.firstName),
    lastName: text(body.lastName),
    phone,
    email,
    organization: text(body.organization),
    role: text(body.role),
    message,
    heardFrom,
  });
  return res.status(201).json({ saved: true });
}
