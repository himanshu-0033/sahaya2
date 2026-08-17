export function applyCors(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-caregiver-key');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function requireCaregiverKey(req, res) {
  const configured = process.env.CAREGIVER_ACCESS_KEY;
  if (!configured) return true; // no key set — open for local/dev prototyping
  const provided = req.headers['x-caregiver-key'];
  if (provided === configured) return true;
  res.status(401).json({ error: 'Invalid or missing caregiver access key' });
  return false;
}
