// Minimal local server that mimics Vercel's serverless (req, res) contract,
// so the handlers in api/ can be tested with plain `node dev-server.js`
// without needing `vercel login` / `vercel dev` during local development.
import http from 'node:http';
import { URL } from 'node:url';

import checkinsHandler from './api/checkins.js';
import profileHandler from './api/profile.js';
import inkblotTestHandler from './api/inkblot-test.js';
import assessmentsHandler from './api/assessments.js';
import groundingHandler from './api/grounding.js';
import pathsHandler from './api/paths.js';
import signupHandler from './api/auth/signup.js';
import loginHandler from './api/auth/login.js';
import phoneHandler from './api/auth/phone.js';
import phoneStartHandler from './api/auth/phone-start.js';
import phoneVerifyHandler from './api/auth/phone-verify.js';
import caregiverResidentsHandler from './api/caregiver/residents.js';
import caregiverResidentHandler from './api/caregiver/resident.js';
import adminMeHandler from './api/admin/me.js';
import adminOverviewHandler from './api/admin/overview.js';
import adminResidentsHandler from './api/admin/residents.js';
import adminResidentHandler from './api/admin/resident.js';

const PORT = process.env.PORT || 3000;

// Answers without touching auth or storage, so "is the backend up?" has an
// answer that never depends on being signed in. The frontend uses it to tell
// "the server is down" apart from "the server said no".
function healthHandler(req, res) {
  res.status(200).json({ ok: true, uptime: Math.round(process.uptime()) });
}

const routes = {
  '/api/health': healthHandler,
  '/api/checkins': checkinsHandler,
  '/api/profile': profileHandler,
  '/api/inkblot-test': inkblotTestHandler,
  '/api/assessments': assessmentsHandler,
  '/api/grounding': groundingHandler,
  '/api/paths': pathsHandler,
  '/api/auth/signup': signupHandler,
  '/api/auth/login': loginHandler,
  '/api/auth/phone': phoneHandler,
  '/api/auth/phone-start': phoneStartHandler,
  '/api/auth/phone-verify': phoneVerifyHandler,
  '/api/caregiver/residents': caregiverResidentsHandler,
  '/api/caregiver/resident': caregiverResidentHandler,
  '/api/admin/me': adminMeHandler,
  '/api/admin/overview': adminOverviewHandler,
  '/api/admin/residents': adminResidentsHandler,
  '/api/admin/resident': adminResidentHandler,
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
