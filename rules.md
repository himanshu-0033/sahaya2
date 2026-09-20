# rules.md

## Safety, non-negotiable

- **Crisis numbers are load-bearing.** Re-verify every number before any
  release touching crisis UI. Never reintroduce KIRAN, it merged into
  Tele-MANAS 14416. Current list is in `memory.md`.
- `backend/lib/safety.js` and `agent/lib/safety.js` stay **identical**.
  `backend/test/reflection.test.mjs` enforces it.
- The browser is not trusted to report a disclosure. The backend screens the
  saved transcript again.
- Caution text on a practice with a real contraindication (cold water, both
  breath holds) is asserted by name in the tests. Treat that assertion as
  load-bearing, do not edit it away to make a test pass.
- Never write a screen that promises "nobody sees this unless you share".
  Any screen collecting student data says who can see it: their counsellor and
  the institution's administrator.

## Instruments

- Items, scales, licence and citation go in `backend/lib/instruments.js`.
  Scoring is a sum, an optional published transform, and a band lookup. No
  modelling, ever.
- A band table with a published cut-off gets a test **exactly on the
  boundary**. Off-by-one is the failure mode.
- `wordingVerified: false` means written from memory. It must be transcribed
  from the source document before real use.
- Do not add an instrument whose reported number has no demonstrated
  reliability. See the rejected tests in `memory.md`.

## Backend

- A new route is **one line in `backend/lib/routes.js` plus a handler**.
  Never a new file under `api/`. See `architecture.md` for why.
- Every handler that touches student data goes through `requireStudentAccess`
  or `requireTeamAccess` in `backend/lib/auth.js`. Roles are enforced server
  side, never in the UI alone.

## Code

- Reuse what is here before writing it: `PageShell.jsx`, `.card`, the
  `.stack-*` rhythm, the existing lib modules.
- Stdlib and native platform first. No new dependency for what a few lines do.
- No abstraction with one implementation, no config for a value that never
  changes.
- Non-trivial logic leaves one runnable check behind, in the existing
  `node:test` suites. No new frameworks.
- `npm test` passes before a commit.

## Copy

- Plain, calm, second person. Say what a thing does and does not do.
- **No em-dashes** in new copy, comments or commit messages. Use a comma, a
  colon or brackets.
- Never describe a path as treatment or an assessment as a diagnosis.

## Design

See `design.md`, which defers to `frontend/DESIGN.md`. Show a rendered
screenshot before committing to a large visual change, not an ASCII mockup.
