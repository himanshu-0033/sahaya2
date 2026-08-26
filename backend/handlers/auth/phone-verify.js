import { applyCors } from '../../lib/cors.js';
import { verifyCode } from '../../lib/otp.js';
import { sessionForVerifiedPhone } from '../../lib/phoneAccount.js';

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

  const { phone, code, name } = req.body || {};
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

  const check = await verifyCode(phone, code);
  if (!check.ok) {
    return res.status(401).json({ error: check.error });
  }

  const { token, created } = await sessionForVerifiedPhone(phone, name);
  return res.status(created ? 201 : 200).json({ token });
}
