# architecture.md

Four independently deployable modules, one repo, four Vercel projects with
different root directories.

```
frontend/  React + Vite + Tailwind   student app        :5173
admin/     React + Vite + Tailwind   counsellor console :5174
backend/   one serverless function   /api               :3000
agent/     one serverless function   /api/chat          :3100
```

They talk over HTTP. `VITE_API_URL` and `VITE_AGENT_URL` point the two apps at
the two functions. Vite inlines those at build time, so a change to either
means a frontend redeploy.

## The rule that shapes the backend

Every `/api/*` request goes through **one** function, `backend/api/router.js`,
which looks the path up in `lib/routes.js` and calls a handler in `handlers/`.
`vercel.json` rewrites everything there and passes the original path in
`?path=`. `dev-server.js` reads the same table.

Adding a route is one line in `lib/routes.js` plus a file in `handlers/`.

This is not the obvious layout, and the history is in
[README.md](README.md#one-function-not-nineteen): one file per route hit
Vercel Hobby's 12 function cap at 19 routes, so deploys built and then failed
while shipping, and production silently stayed weeks behind. The filesystem
catch-all `api/[...path].js` was worse: it resolved as a single segment
`[param]`, so `/api/auth/login` 404'd while `/api/checkins` worked.

## Where the logic lives

| Concern | File |
| --- | --- |
| Route table | `backend/lib/routes.js` |
| Auth, Google ID token and self-issued JWT, role gates | `backend/lib/auth.js` |
| Flagging heuristic | `backend/lib/logic.js` |
| Instrument definitions, items, scales, licence | `backend/lib/instruments.js` |
| Scoring, sum plus transform plus band | `backend/lib/scoring.js` |
| Grounding practices | `backend/lib/grounding.js` |
| Paths and their bookend guards | `backend/lib/paths.js` |
| Crisis screening | `backend/lib/safety.js` and `agent/lib/safety.js`, kept identical |
| Storage, Mongo or a local JSON file | `backend/lib/store.js` |
| Chat providers, mock, cerebras, anthropic | `agent/lib/provider.js` |

## Auth

Google Identity Services, ID token verified server side, or email plus
password with a bcrypt hash and a JWT signed with `JWT_SECRET`. Both produce
`{ sub, email, name }`, so nothing downstream cares which was used. A
student's `sub` is their `residentId`.

`agent/` verifies the same sessions, so it needs the **same** `GOOGLE_CLIENT_ID`
and `JWT_SECRET` as `backend/`. A different secret rejects every signed-in user
with "invalid signature".

## Storage

`STORAGE_URL` set means Mongo. Unset means `backend/.data/db.json`, which is
local dev only. Vercel's filesystem is read-only outside `/tmp`, and `/tmp`
does not survive between requests, so an unset `STORAGE_URL` in production
means check-ins silently do not persist.

## Running it

```bash
npm run install:all   # once
npm run dev           # all four, prefixed output, restarts any that exits
npm test              # backend and admin suites
```

`curl localhost:3000/api/health` separates "server is down" from "server said no".
