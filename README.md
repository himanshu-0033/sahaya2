# Sahay AI — Daily Check-in

A wellness check-in prototype: a resident looks at three abstract "plates,"
types the first word each brings to mind, taps a mood, and gets a short
affirming thought plus a dinner pass. A separate counsellor console surfaces
residents whose recent check-ins look worth a real conversation, using a
plain rule-based heuristic — not a diagnosis.

This is a **reflective prototype, not a medical device**. It does not
perform clinical assessment of any kind.

## Structure

Independently deployable modules:

```
frontend/   React + Vite + Tailwind — the resident UI (and a light caregiver view)
admin/      React + Vite + Tailwind — the counsellor/admin console, its own window
backend/    Vercel serverless functions (/api) — check-ins, residents, storage
agent/      Vercel serverless function (/api/chat) — the supportive chat companion
```

They talk over HTTP (`VITE_API_URL` in `frontend/` and `admin/` points at the
backend's deployed URL). Each has its own `package.json` and deploys as its
own Vercel project.

`admin/` is deliberately a separate app rather than another route in
`frontend/`: a counsellor keeps it open in its own window, it signs in under
its own storage key (so it doesn't collide with a resident session in another
window of the same browser), and it never ships resident-facing code.

## How it works

- **Sign-in**: Google (Google Identity Services, ID token verified
  server-side with `google-auth-library`) or email/password (bcrypt hash +
  a self-issued JWT signed with `JWT_SECRET`) — both produce the same
  `{ sub, email, name }` shape, so the rest of the backend doesn't care
  which one was used. A resident's `sub` is their stable `residentId`. The
  app additionally asks for phone/DOB/address/occupation once via the
  account form, since auth alone doesn't cover those.
- **Check-in**: a resident types one word per plate + taps a mood (1–5).
  The backend stores it, generates a `SH-MMDD-XXXX` dinner-pass code, and
  picks a short "thought for today" deterministically from the resident's
  id + date (same thought all day, varies day to day).
- **Flagging**: a check-in (and the resident) gets flagged if mood has been
  low for 3 check-ins running, the weekly average is low, or 2+ of today's
  words hit a small negative-word list. See `backend/lib/logic.js`.
- **Caregiver access**: any signed-in Google account can check in as a
  resident, but the caregiver dashboard additionally checks the signed-in
  email against `CAREGIVER_EMAILS`, a comma-separated allowlist. See
  "Before this handles real data" below.
- **Counsellor console** (`admin/`): the same sign-in, checked against
  `ADMIN_EMAILS` (falling back to `CAREGIVER_EMAILS`) on every request. It
  shows a cohort dashboard — today's participation, 14-day check-in trend,
  mood mix, who is flagged, and who has gone quiet — plus a searchable,
  filterable resident list and a per-resident page with contact details, mood
  trend, and the full check-in history. Lists and histories export to CSV.
  All of it is read-only apart from inviting a new resident.

## Local development

Separate terminals, one per module you need:

```bash
cd backend && npm install && npm run dev:local   # plain Node server on :3000, no Vercel login needed
cd frontend && npm install && npm run dev         # Vite on :5173, proxies /api to :3000
cd admin && npm install && npm run dev            # Vite on :5174, proxies /api to :3000
```

Open http://localhost:5173 for the resident app and http://localhost:5174 for
the counsellor console — they're meant to be two windows, and each keeps its
own sign-in. Without `STORAGE_URL` set, the backend stores
data in a local JSON file (`backend/.data/db.json`, gitignored) — fine for
local dev, **not** for a real deployment (see below).

`frontend/.env`, `admin/.env` and `backend/.env` all need
`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_ID` (same value) from a Google Cloud
OAuth Client ID — sign-in won't work without it. That Client ID needs **both**
`http://localhost:5173` and `http://localhost:5174` listed as authorized
JavaScript origins (Google checks the origin, and the two apps run on
different ports), otherwise the Google button won't render in the console.
Email/password sign-in works either way.

Vite reads `.env.local` once at startup, so restart the dev server after
creating or editing it.

`npm run dev` (instead of `dev:local`) in `backend/` uses `vercel dev`
instead, which needs `vercel login` first — slower to start but closer to
the real serverless runtime.

## Deploying to Vercel

Each module is its own Vercel project, both pointed at this one repo with
a different **Root Directory**.

1. **Backend first** (so you have its URL for the frontend):
   ```bash
   cd backend
   vercel link       # creates/links a project, e.g. sahay-backend
   vercel --prod
   ```
   Then in the Vercel dashboard for that project:
   - **Storage → connect a MongoDB database** (Atlas or another Marketplace
     provider) with the default `STORAGE` prefix, so it lands in
     `STORAGE_URL`. **Without this, check-ins won't persist** — Vercel's
     filesystem is read-only outside `/tmp`, and `/tmp` doesn't survive
     between requests.
   - **Settings → Environment Variables**: set `GOOGLE_CLIENT_ID` (from
     Google Cloud Console), `CAREGIVER_EMAILS` and `ADMIN_EMAILS`
     (comma-separated allowlists), and `ALLOWED_ORIGIN` to your frontend and
     admin URLs, comma-separated, once you know them (steps 2 and 3).
   - Redeploy after adding env vars so they take effect.

2. **Frontend**:
   ```bash
   cd frontend
   vercel link       # creates/links a project, e.g. sahay-frontend
   ```
   In its dashboard, set env vars `VITE_API_URL` (the backend's deployed
   URL) and `VITE_GOOGLE_CLIENT_ID` (same Client ID as the backend), then:
   ```bash
   vercel --prod
   ```

3. **Admin console** — same shape as the frontend, its own project:
   ```bash
   cd admin
   vercel link       # creates/links a project, e.g. sahay-admin
   ```
   Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` in its dashboard (same
   values as the frontend), then `vercel --prod`. Add its URL to the Google
   OAuth Client's authorized JavaScript origins too, or sign-in won't render.

4. Go back to the backend project and set `ALLOWED_ORIGIN` to the frontend's
   and admin's URLs, comma-separated, then redeploy the backend so CORS is
   locked down instead of `*`.

## Before this handles real residents' data

This was built as a prototype and cuts corners that matter once real
mental-health-adjacent data is involved:

- Caregiver and counsellor access is an email allowlist checked on every
  request, but there's no audit log of who viewed what — and the admin
  console shows contact details and exports them to CSV, so that gap matters
  more there than anywhere else.
- The OAuth consent screen is unverified — Google will show an "unverified
  app" warning until you go through Google's verification process, which
  matters once this is used by people who don't personally know you.
- The flagging heuristic is intentionally simple and will both miss real
  concerns and flag false positives — it's a nudge to check in on someone,
  not a signal to act on alone.

Don't point this at real students without addressing those first.
