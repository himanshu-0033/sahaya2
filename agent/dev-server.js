// Minimal local server mirroring Vercel's (req, res) contract, so api/ handlers
// can be exercised with plain `node` — same approach as backend/dev-server.js.
import http from 'node:http';
import { URL } from 'node:url';

import chatHandler from './api/chat.js';

const PORT = process.env.PORT || 3100;

const routes = {
  '/api/chat': chatHandler,
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
  console.log(`Sahay agent (local dev) listening on http://localhost:${PORT}`);
});
