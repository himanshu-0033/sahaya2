// The one place that says which path runs which handler.
//
// This used to live in dev-server.js, while production got its routing for
// free from the filesystem: one file under api/, one Vercel function, one
// route. That was tidy until the two drifted — /api/health existed only in
// the dev server, so the health check the README recommends answered locally
// and 404'd in production.
//
// It also stopped scaling. Vercel's Hobby plan allows 12 serverless functions
// per deployment and the file-per-route layout had reached 19, so every
// deploy failed after a successful build and production silently froze on an
// old one. api/[...path].js now dispatches through this table instead, which
// is one function no matter how many routes are added below.
import checkinsHandler from '../handlers/checkins.js';
import profileHandler from '../handlers/profile.js';
import sharingHandler from '../handlers/sharing.js';
import inkblotTestHandler from '../handlers/inkblot-test.js';
import assessmentsHandler from '../handlers/assessments.js';
import groundingHandler from '../handlers/grounding.js';
import pathsHandler from '../handlers/paths.js';
import signupHandler from '../handlers/auth/signup.js';
import loginHandler from '../handlers/auth/login.js';
import phoneHandler from '../handlers/auth/phone.js';
import phoneStartHandler from '../handlers/auth/phone-start.js';
import phoneVerifyHandler from '../handlers/auth/phone-verify.js';
import caregiverResidentsHandler from '../handlers/caregiver/residents.js';
import caregiverResidentHandler from '../handlers/caregiver/resident.js';
import adminMeHandler from '../handlers/admin/me.js';
import adminOverviewHandler from '../handlers/admin/overview.js';
import adminResidentsHandler from '../handlers/admin/residents.js';
import adminResidentHandler from '../handlers/admin/resident.js';
import adminAuditHandler from '../handlers/admin/audit.js';

// Answers without touching auth or storage, so "is the backend up?" has an
// answer that never depends on being signed in, and — now that this table is
// shared — the same answer in production as locally.
function healthHandler(req, res) {
  return res.status(200).json({ ok: true, uptime: Math.round(process.uptime()) });
}

export const routes = {
  '/api/health': healthHandler,
  '/api/checkins': checkinsHandler,
  '/api/profile': profileHandler,
  '/api/sharing': sharingHandler,
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
  '/api/admin/audit': adminAuditHandler,
};

// A trailing slash is the same route. Anything else is not guessed at.
export function resolveRoute(pathname) {
  const clean = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return routes[clean] || null;
}
