// Minimal local server that mimics Vercel's serverless (req, res) contract,
// so the handlers in handlers/ can be tested with plain `node dev-server.js`
// without needing `vercel login` / `vercel dev` during local development.
//
// It serves the same table production does (lib/routes.js) rather than a
// second copy of it, so a route cannot exist in one and not the other.
import http from 'node:http';
import { URL } from 'node:url';

import { resolveRoute } from './lib/routes.js';

const PORT = process.env.PORT || 3000;

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
  const handler = resolveRoute(url.pathname);
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
    console.error(`[${req.method} ${url.pathname}]`, err);
    // If the handler already started the response, writing a second one throws
    // ERR_HTTP_HEADERS_SENT from inside this catch — which is unhandled, and
    // used to take the whole server down with it.
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A dev server that exits silently is worse than one that errors loudly: the
// frontend keeps running, every tab shows "Can't reach the server", and there
// is nothing on screen saying why. Node exits on an unhandled rejection by
// default, so one stray floating promise in a handler kills the process.
// These keep it serving and put the reason where it can be read.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandled rejection — server kept alive]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaught exception — server kept alive]', err);
});

// Binding can lose a race with a previous instance that is still shutting
// down and has not let go of the port yet — which is exactly what happens when
// this server is restarted automatically after a crash. Treating that first
// EADDRINUSE as fatal would turn a one-second gap into a backend that stays
// down, so it is retried a few times before giving up. Only a port still
// occupied after several seconds is a real conflict worth reporting.
const BIND_RETRIES = 6;
const BIND_RETRY_MS = 700;
let bindAttempt = 0;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    bindAttempt += 1;
    if (bindAttempt <= BIND_RETRIES) {
      console.warn(`Port ${PORT} busy, retrying (${bindAttempt}/${BIND_RETRIES})...`);
      setTimeout(() => server.listen(PORT), BIND_RETRY_MS);
      return;
    }
    console.error(
      `Port ${PORT} is already in use - another backend is still running.\n` +
        `Free it with:  npx kill-port ${PORT}`,
    );
    process.exit(1);
  }
  console.error('[server error]', err);
});

server.listen(PORT, () => {
  bindAttempt = 0;
  console.log(`Sahay backend (local dev) listening on http://localhost:${PORT}`);
});
