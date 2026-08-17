// Minimal local server that mimics Vercel's serverless (req, res) contract,
// so the handlers in api/ can be tested with plain `node dev-server.js`
// without needing `vercel login` / `vercel dev` during local development.
import http from 'node:http';
import { URL } from 'node:url';

import checkinsHandler from './api/checkins.js';
import caregiverResidentsHandler from './api/caregiver/residents.js';
import caregiverResidentHandler from './api/caregiver/resident.js';

const PORT = process.env.PORT || 3000;

const routes = {
  '/api/checkins': checkinsHandler,
  '/api/caregiver/residents': caregiverResidentsHandler,
  '/api/caregiver/resident': caregiverResidentHandler,
};

function enhanceResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = routes[url.pathname];
  enhanceResponse(res);

  if (!handler) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  req.query = Object.fromEntries(url.searchParams.entries());

  if (req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8');
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Sahay backend (local dev) listening on http://localhost:${PORT}`);
});
