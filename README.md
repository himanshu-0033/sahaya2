# Sahay AI — Daily Check-in

A hostel/college wellness check-in prototype: a resident looks at three
abstract "plates," types the first word each brings to mind, taps a mood,
and gets a short affirming thought plus a dinner pass. A caregiver
dashboard surfaces residents whose recent check-ins look worth a real
conversation, using a plain rule-based heuristic — not a diagnosis.

This is a **reflective prototype, not a medical device**. It does not
perform clinical assessment of any kind.

## Structure

Two independently deployable modules:

```
frontend/   React + Vite + Tailwind — the resident and caregiver UI
backend/    Vercel serverless functions (/api) — check-ins, residents, storage
```

They talk over HTTP (`VITE_API_URL` on the frontend points at the backend's
deployed URL). Each has its own `package.json` and deploys as its own
Vercel project.

## How it works

- **Check-in**: a resident types one word per plate + taps a mood (1–5).
  The backend stores it, generates a `SH-MMDD-XXXX` dinner-pass code, and
  picks a short "thought for today" deterministically from the resident's
  id + date (same thought all day, varies day to day).
- **Flagging**: a check-in (and the resident) gets flagged if mood has been
  low for 3 check-ins running, the weekly average is low, or 2+ of today's
  words hit a small negative-word list. See `backend/lib/logic.js`.
- **Caregiver access**: gated by a shared secret (`CAREGIVER_ACCESS_KEY`),
  not real per-caregiver auth — fine for a prototype, not for real
  resident data. See "Before this handles real data" below.

## Local development

Two terminals:

```bash
cd backend && npm install && npm run dev:local   # plain Node server on :3000, no Vercel login needed
cd frontend && npm install && npm run dev         # Vite on :5173, proxies /api to :3000
```

Open http://localhost:5173. Without `STORAGE_URL` set, the backend stores
data in a local JSON file (`backend/.data/db.json`, gitignored) — fine for
local dev, **not** for a real deployment (see below).

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
   - **Settings → Environment Variables**: set `CAREGIVER_ACCESS_KEY` to a
     secret string, and `ALLOWED_ORIGIN` to your frontend's URL once you
     know it (step 2).
   - Redeploy after adding env vars so they take effect.

2. **Frontend**:
   ```bash
   cd frontend
   vercel link       # creates/links a project, e.g. sahay-frontend
   ```
   In its dashboard, set env var `VITE_API_URL` to the backend's deployed
   URL (e.g. `https://sahay-backend.vercel.app`), then:
   ```bash
   vercel --prod
   ```

3. Go back to the backend project and set `ALLOWED_ORIGIN` to the
   frontend's URL, then redeploy the backend so CORS is locked down
   instead of `*`.

## Before this handles real residents' data

This was built as a prototype and cuts corners that matter once real
mental-health-adjacent data is involved:

- Caregiver access is one shared key, not per-person login/audit trail.
- Residents aren't authenticated — anyone with the app URL can check in
  as anyone else's `residentId` if they have it (it's a random client-side
  id in `localStorage`, not tied to a real account).
- The flagging heuristic is intentionally simple and will both miss real
  concerns and flag false positives — it's a nudge to check in on someone,
  not a signal to act on alone.

Don't point this at real students without addressing those first.
