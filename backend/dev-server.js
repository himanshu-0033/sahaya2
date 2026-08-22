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

const routes = {
  '/api/checkins': checkinsHandler,
  '/api/profile': profileHandler,
  '/api/inkblot-test': inkblotTestHandler,
  '/api/assessments': assessmentsHandler,
  '/api/grounding': groundingHandler,
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Sahay backend (local dev) listening on http://localhost:${PORT}`);
});
