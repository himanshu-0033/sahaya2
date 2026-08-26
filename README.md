# Sahay AI — Daily Check-in

A wellness check-in prototype: a resident looks at three abstract "plates,"
types the first word each brings to mind, taps a mood, and gets a short
affirming thought and one more day on their streak. A separate counsellor console surfaces
residents whose recent check-ins look worth a real conversation, using a
plain rule-based heuristic — not a diagnosis.

This is a **reflective prototype, not a medical device**. It does not
perform clinical assessment of any kind.

## Structure

Independently deployable modules:

```
frontend/   React + Vite + Tailwind — the resident UI (and a light caregiver view)
            Three tabs: Home, Calm, More — the daily loop gets the bar, and
            paths/questionnaires/reading/inkblot sit one tap deeper. Shared shell in
            components/PageShell.jsx; one card treatment (.card) and a four-step
            vertical rhythm (.stack-*) live in src/index.css.
admin/      React + Vite + Tailwind — the counsellor/admin console, its own window
backend/    One Vercel serverless function (/api) — check-ins, residents, storage.
            api/[...path].js dispatches every route through lib/routes.js; the
            handlers live in handlers/. See "One function, not nineteen" below.
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
  server-side with `google-auth-library`), phone number (Firebase sends the
  SMS code, the returned Firebase ID token is verified server-side with
  `firebase-admin`, and a resident is found-or-created by number), or
  email/password (bcrypt hash + a self-issued JWT signed with
  `JWT_SECRET`) — all three produce the same
  `{ sub, email, name }` shape, so the rest of the backend doesn't care
  which one was used. A resident's `sub` is their stable `residentId`. The
  app additionally asks for phone/DOB/address/occupation once via the
  account form, since auth alone doesn't cover those.
- **Check-in**: a resident types one word per plate + taps a mood (1–5).
  The backend stores it, returns the resident's check-in streak, and
  picks a short "thought for today" deterministically from the resident's
  id + date (same thought all day, varies day to day).
- **Flagging**: a check-in (and the resident) gets flagged if mood has been
  low for 3 check-ins running, the weekly average is low, or 2+ of today's
  words hit a small negative-word list. See `backend/lib/logic.js`.
- **Assessments** (`/assessments`): twenty-one published, self-scoring
  questionnaires — PHQ-9, GAD-7, K10, WHO-5, PSS-10, UCLA-3, MSPSS,
  Mini-SPIN, RSES, BRS, GSE-10, Flourishing, CBI (personal), AIS-8, SAS-SV,
  AUDIT-C, PHQ-15, PC-PTSD-5, SCOFF, BSMAS and SCS-SF. Items, answer scales,
  licence and citation all live in `backend/lib/instruments.js`; scoring is a
  sum, an optional published transform and a band lookup in
  `backend/lib/scoring.js` — deliberately hand-checkable, with no modelling
  anywhere. A positive answer to PHQ-9 item 9 routes into the crisis path
  regardless of the total score. The band tables for the screens that have a
  published cut-off (PC-PTSD-5 at 3, SCOFF at 2, BSMAS at 24, Mini-SPIN and
  UCLA-3 at 6) are tested exactly on the boundary, which is the part of a
  band table that is easiest to get wrong by one.

- **Grounding** (`/grounding`): thirteen practices a resident runs in the app
  rather than fills in — 5-4-3-2-1, cyclic sighing, box breathing, 4-7-8,
  orienting, feet on the floor, butterfly hug, muscle release, body scan,
  cold water (DBT's TIPP), cognitive grounding, a self-compassion break and
  NSDR. Two shapes, both defined in `backend/lib/grounding.js`: a `pacer`
  (an animated breath or tap cycle) or `steps` (a sequence of timed
  prompts). Nothing here is scored — the app records that you practised and,
  only if you offer it, a 1–5 self-report of how settled you felt either
  side. Every technique carries its evidence at the strength it actually
  has (`trial`, `mechanism` or `clinical`), and the ones with real
  contraindications — cold water, and both breath-hold patterns — carry
  caution text that the UI shows *before* the start button. Each links two
  to four guided YouTube videos; all 40 ids were checked against YouTube's
  oEmbed endpoint, and nothing loads from YouTube until someone presses
  play.
- **Inkblot test** (`/inkblot-test`): ten abstract symmetric plates, one at
  a time, answered in free text or by voice (the browser's own
  SpeechRecognition — no key, no upload). It is **not scored**: a real
  Rorschach is administered and coded by a trained clinician, so the app
  stores what was written and reports only descriptive counts — plates
  answered, words written, which words recurred across plates. Free text is
  screened by `backend/lib/safety.js` before storage. The plates are
  original shapes, not the Rorschach plates.
- **Guided paths** (`/paths`): five multi-day sequences that put one existing
  grounding practice in front of a resident per day, in an order that builds —
  seven days of breathwork for background anxiety, five nights of winding
  down, a week of getting out of a spinning head, six days of self-compassion,
  and five days timed around an exam. Days are stored as a list, not a count,
  because they can be done **out of order**, undone, and picked up on day nine;
  nothing is gated and there is no streak to break. Four of the five bracket a
  questionnaire (GAD-7, AIS-8, PSS-10, SCS-SF), taken at the start and again at
  the end.

  That comparison is the one number in this app most likely to be misread, so
  `backend/lib/paths.js` enforces three things and
  `backend/test/paths.test.mjs` asserts them: a bookended path **must** carry
  `closingCaveat` explaining what a change does *not* mean; it must open and
  close on the same instrument; and where a minimal clinically important
  difference is published (4 points for the GAD-7) a smaller move is reported
  as "no measurable change" rather than as a direction. A path is described
  throughout as a way to practise, never as a course of treatment.

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

One command from the repo root, first time and every time:

```bash
npm run install:all   # once
npm run dev           # backend :3000, agent :3100, resident app :5173, console :5174
```

`npm run dev` runs all four together, prefixes each one's output with its
name, and restarts any of them that exits on its own. Ctrl-C stops the lot.

Run them separately if you'd rather — but note that the two API servers are
the ones whose absence is easy to miss. The Vite apps fail loudly (the page
doesn't load); a missing backend leaves a perfectly working-looking app where
every tab reads "Can't reach the server", and a missing agent leaves one
where only the chat says it. That's what the root script prevents.

```bash
cd backend && npm run dev:local   # plain Node server on :3000, no Vercel login needed
cd agent && npm run dev:local     # plain Node server on :3100, serves /api/chat only
cd frontend && npm run dev        # Vite on :5173, proxies /api to :3000, /api/chat to :3100
cd admin && npm run dev           # Vite on :5174, proxies /api to :3000
```

`curl http://localhost:3000/api/health` answers `{"ok":true}` whenever the
backend is up, without needing a sign-in — the quickest way to tell "the
server is down" from "the server said no".

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

Phone sign-in needs `DEV_OTP=true` in `backend/.env.local` — the code is then
printed to the backend terminal instead of being sent by SMS, which costs
nothing and needs no provider account. Real SMS via Firebase is the
alternative and needs a paid plan. Both are covered under "Phone sign-in"
below.

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
   locked down instead of `*`. Environment variables only take effect on a
   deployment made after they are set — a failed deploy leaves the old one
   serving, and the old one has the old variables.

### One function, not nineteen

The backend routes every `/api/*` request through a single serverless
function, `api/[...path].js`, which looks the path up in `lib/routes.js` and
calls the matching handler from `handlers/`.

The obvious layout — one file per route under `api/`, which is what Vercel
turns into one function each — is what this was. It broke twice. Vercel's
Hobby plan allows **12 functions per deployment**; at 19 routes every deploy
built successfully and then failed while shipping, so production silently
stayed on the last build small enough to deploy while the repo moved on for
weeks. Routes added in that window returned the platform's own 404, which
carries no CORS headers, so the browser blocked it and the app reported the
server as unreachable rather than the route as missing.

Adding a route now means one line in `lib/routes.js` and a file in
`handlers/`. The function count stays at one, and `dev-server.js` reads the
same table — so a route cannot exist locally and not in production, which is
how `/api/health` came to answer on a laptop and 404 in production.

## Phone sign-in

Two interchangeable routes, picked by environment. The account side is
identical either way (`lib/phoneAccount.js`): a verified number matches an
existing resident or becomes a new one, and both end up issuing the same
`JWT_SECRET`-signed session as every other sign-in.

| | Backend OTP (default) | Firebase |
|---|---|---|
| Real SMS | No — code goes to the backend terminal | Yes |
| Cost | Free | Needs the Blaze plan (card on file) |
| Switched on by | `DEV_OTP=true` in `backend/.env.local` | the four `VITE_FIREBASE_*` vars |

The frontend picks Firebase when all four `VITE_FIREBASE_*` vars are set and
falls back to the backend OTP route otherwise, so commenting those four out
is the whole switch.

### Backend OTP (no SMS provider)

Set `DEV_OTP=true` in `backend/.env.local`. `POST /api/auth/phone-start`
generates a 6-digit code, stores **only a bcrypt hash** of it with a 5-minute
expiry, prints it to the backend terminal and returns it in the response;
`POST /api/auth/phone-verify` checks it and issues the session. Codes are
single-use, capped at 5 wrong attempts, rate-limited to one per 30s and five
per hour per number.

Returning the code to the caller is an open door into any account, so both
routes **refuse to run at all** unless `DEV_OTP=true` — they cannot ship to
production by accident. Swapping in Twilio/MSG91 later is a change to those
two files only: stop returning `devCode`, send it instead.

### Firebase (real SMS)

Firebase does the SMS and the code check; this app only trusts the signed
token it hands back.

**Phone Auth is not on the Spark free plan** — it is listed as "Not applicable"
there and needs the pay-as-you-go **Blaze** plan with a billing account. The
first 10 SMS/day are not billed and test numbers send no SMS at all, so
development is free, but a card has to be on file. If you go this way, set an
SMS region allowlist and a budget alert first — a public phone-auth endpoint
with billing attached is a target for SMS pumping.

1. **Create the Firebase project** — [console.firebase.google.com](https://console.firebase.google.com)
   → *Add project*. Google Analytics is not needed.

2. **Turn on the provider** — *Build → Authentication → Get started →
   Sign-in method → Phone → Enable*.

3. **Register a web app** — *Project settings → General → Your apps → Web
   (`</>`)*. Copy `apiKey`, `authDomain`, `projectId` and `appId` from the
   config it shows into `frontend/.env.local`:

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:123...:web:abc...
   ```

   These are public by design — the account is protected by the authorized
   domains list and reCAPTCHA, not by hiding the key.

4. **Authorize the domains** — *Authentication → Settings → Authorized
   domains*. `localhost` is there already; add the deployed frontend domain
   before going live, or sign-in fails with `auth/unauthorized-domain`.

5. **Add the service account to the backend** — *Project settings → Service
   accounts → Generate new private key* downloads a JSON file. Copy three
   fields out of it into `backend/.env.local`:

   ```
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

   Keep the private key's literal `\n` sequences and the surrounding double
   quotes — it goes in as one line. **This file is a credential; never commit
   it.**

6. **Add test numbers while developing** — *Authentication → Sign-in method →
   Phone → Phone numbers for testing* lets you pair e.g. `+91 98765 43210`
   with a fixed code like `123456`. No SMS is sent and no quota is spent, so
   you can demo the flow repeatedly without waiting on a real handset.

7. **Restart both dev servers** — Vite reads `.env.local` only at startup.

On Vercel, set the same `VITE_FIREBASE_*` vars on the frontend project and
the `FIREBASE_*` vars on the backend project, then redeploy each.

### What happens on sign-in

`PhoneSignInButton` sends the code via Firebase, confirms it in the browser,
and posts the resulting Firebase ID token to `POST /api/auth/phone`. The
backend verifies that token with `firebase-admin`, then matches the verified
number against existing residents with `phonesMatch` — suffix-tolerant, so
`+919876543210` finds a resident stored as `+91 98765 43210`. A match logs
in; no match creates a resident with that number and no email yet. Either
way it returns the same `JWT_SECRET`-signed session token the other sign-in
paths issue, so nothing downstream changes.

A phone-only account has no email, so it can never be on `CAREGIVER_EMAILS`
or `ADMIN_EMAILS` — residents only, which is the intended shape.

### Free-tier limits

Firebase phone auth allows a small number of real SMS verifications per day
on the free Spark plan (Blaze is pay-as-you-go beyond that). Test numbers
don't count against it. Indian (+91) delivery goes through Firebase's own
carrier arrangements, so no TRAI DLT template registration is needed — that
is the main reason to prefer this over a direct SMS gateway here.

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
- The assessments are screening instruments, not diagnostic ones, and the
  entries marked `wordingVerified: false` in `backend/lib/instruments.js`
  (K10, MSPSS, CBI, AIS-8, SAS-SV, and all five of PHQ-15, PC-PTSD-5, SCOFF,
  BSMAS and SCS-SF) were written from memory rather than transcribed from
  the source document — check them against their citations before using them
  with real students. PSS-10 is free for research and teaching but needs its
  author's permission for commercial use.
- A guided path is a sequence of practices, not a clinical protocol. The
  bookend questionnaires exist so a resident has a before and after to look
  at; they are not outcome measures and a seven-day change is dominated by
  noise and regression to the mean. If anyone ever wants to report on these,
  that needs a real design, not this.
- The grounding videos are other people's, on YouTube. They were all live
  when added, but they can be deleted, made private or region-blocked
  without anyone touching this repo — `backend/test/grounding.test.mjs`
  only catches malformed ids, not dead ones. Re-check them periodically.
- The cold-water practice can slow the heart, which is the point and also
  the risk. Its caution text is asserted by name in the test suite so it
  cannot be edited away by accident; treat that assertion as load-bearing.
- The flagging heuristic is intentionally simple and will both miss real
  concerns and flag false positives — it's a nudge to check in on someone,
  not a signal to act on alone.

Don't point this at real students without addressing those first.
