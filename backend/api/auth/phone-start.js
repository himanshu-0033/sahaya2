import { applyCors } from '../../lib/cors.js';
import { issueCode } from '../../lib/otp.js';

// No SMS provider is wired up, so the code has to reach the developer some
// other way. That is only acceptable when it is switched on deliberately:
// without DEV_OTP=true this route refuses to run at all, so it cannot quietly
// ship to production as an open door into any account.
const DEV_OTP = process.env.DEV_OTP === 'true';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!DEV_OTP) {
    return res.status(501).json({
      error: 'Phone sign-in has no SMS provider configured on this server.',
    });
  }

  const { phone } = req.body || {};
  if (!phone) {
    return res.status(400).json({ error: 'A phone number is required' });
  }

  const { code, error, expiresInMs } = await issueCode(phone);
  if (error) {
    return res.status(429).json({ error });
  }

  // The "delivery channel" in dev mode: the terminal running the backend.
  console.log(`\n  ┌─ Sahay phone sign-in ─────────────────\n  │  ${phone}\n  │  code: ${code}\n  └───────────────────────────────────────\n`);

  return res.status(200).json({ sent: true, expiresInMs, devCode: code });
}
