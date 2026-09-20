<div align="center">

# Rules

### What must not be broken, what must not be rediscovered, and how to add to this repo

![safety](https://img.shields.io/badge/safety-non%20negotiable-b42318?style=flat-square)
![tests](https://img.shields.io/badge/tests-node%3Atest-1f2d52?style=flat-square)
![deps](https://img.shields.io/badge/new%20dependencies-justify%20them-f2a93b?style=flat-square)
![copy](https://img.shields.io/badge/em%20dashes-never-b42318?style=flat-square)

[prd](prd.md) · [architecture](architecture.md) · **rules** · [design](design.md) · [tasks](tasks.md) · [memory](memory.md) · [readme](README.md)

</div>

---

## 1. Safety, non-negotiable

> [!CAUTION]
> These are the rules where being wrong hurts a real person. None of them is a
> preference, and none of them is negotiable for the sake of a smaller diff.

### 1.1 Crisis numbers are load-bearing

- Re-verify every helpline number before any release that touches crisis UI.
  The current verified list, with dates, is in [memory.md](memory.md).
- **Never reintroduce KIRAN.** It merged into Tele-MANAS 14416.
- A number appears in six places: `CrisisContacts`, `ErrorBoundary`, the
  `index.html` noscript block, the landing footer, and both `safety.js` files.
  Change one, change all six.

### 1.2 The two safety modules stay identical

`backend/lib/safety.js` and `agent/lib/safety.js` must not diverge.
`backend/test/reflection.test.mjs` enforces it. The browser is not trusted to
report a disclosure, which is the entire reason the backend screens the saved
transcript a second time.

### 1.3 Screen before the model, never after

The agent screens every user turn **before any model is called**. A crisis
reply is fixed text, not generated text. Do not move the screen behind a model
call, and do not let a provider failure skip it.

### 1.4 Caution text is asserted by name

Cold water and both breath-hold patterns carry caution text that the UI shows
**before** the start button. The test suite asserts that text by name. If a
test fails because the caution changed, fix the caution, do not edit the
assertion.

### 1.5 Say who can see it

Never write a screen that promises "nobody sees this unless you share". It is
not true. Any screen that collects student data says who can see it: their
counsellor and the institution's administrator. See
[memory.md](memory.md#access-model-chosen-2026-09-15).

### 1.6 Access is decided on the server

Every handler touching student data goes through `requireStudentAccess` or
`requireTeamAccess` in `backend/lib/auth.js`. Hiding a button is not access
control.

### 1.7 No endpoint says whether an account exists

Being a user of this app is itself sensitive. `auth/forgot.js` gives one answer
to every address, and `auth/login.js` gives one refusal whether the password
was wrong, the account is Google-only, or there is no account at all. It also
runs bcrypt against a decoy hash when there is no account, because an endpoint
that skips the slow part answers the question in its response time instead.

### 1.8 Anything a student typed is defused before it leaves as a CSV

`admin/src/lib/csv.js` prefixes a cell starting with `=`, `+`, `-`, `@`, tab
or carriage return with an apostrophe. Two exported columns are student-typed,
the check-in words and the student's own name, and a spreadsheet runs a cell
before it shows it. Quoting does not help: the quotes come off when the file
is parsed and the formula is what is left.

### 1.9 Every unauthenticated route is metered

`lib/rate-limit.js`, applied to enquiries, preview, signup, forgot and login.
Sign-in counts per account as well as per client: a campus shares one IP, so
the per-client number is loose and the per-account number is the strict one.
A throttled reset request answers exactly what an unthrottled one answers, or
the limit becomes the membership check that 1.7 exists to prevent.

## 2. Instruments

| Rule | Why |
| :--- | :--- |
| Items, scales, licence and citation go in `backend/lib/instruments.js` | One place to check a questionnaire against its source |
| Scoring is a sum, an optional **published** transform, and a band lookup | So a counsellor can reproduce any number with a pen |
| No modelling, ever | A number that looks clinical and is not is worse than no number |
| A published cut-off gets a test **exactly on the boundary** | Off by one is how band tables fail |
| `wordingVerified: false` means written from memory | It must be transcribed from the source before real use |
| `licenceCleared: false` means do not publish | C-SSRS is fully built and held on exactly this flag |

> [!WARNING]
> Do not add an instrument whose reported number has no demonstrated
> reliability. Dot probe, emotional Stroop and facial emotion recognition were
> each reviewed and rejected on evidence. The findings are recorded in
> [memory.md](memory.md#instruments-reviewed-2026-09-04) so the same proposal
> does not come back twice.

## 3. Backend

- **A new route is one line in `backend/lib/routes.js` plus a handler.** Never
  a new file under `api/`. The reasons are three separate production failures,
  written up in [architecture.md](architecture.md#2-one-function-not-nineteen).
- `dev-server.js` reads the same route table. A route cannot exist locally and
  not in production.
- `backend/lib/store.js` is the only module that touches persistence.
- The access log is append-only. It records that a record was opened or
  exported, never what was in it, and there is no delete. A log the viewer can
  edit is decoration.
- **A view is logged on the server, not by the client.** The browser reports
  exports because the CSV is built there, but a client that decides whether to
  report itself is not a record of anything. Log after the access check, so a
  refusal leaves no row and the log cannot prove an account exists.
- Anything that reads the access log back must be scoped. It names students.

## 4. Code

Climb this ladder and stop at the first rung that holds.

1. **Does it need to exist?** Speculative need means skip it and say so.
2. **Is it already here?** `PageShell.jsx`, `.card`, the `.stack-*` rhythm,
   `shared/Tick.jsx`, `shared/Odometer.jsx`, `shared/useReveal.js`, and the
   `lib/` modules on both sides. Look before you write.
3. **Does the stdlib do it?** Node 22 is the floor. Use it.
4. **Does the platform do it?** `<input type="date">` over a picker library,
   CSS over JS, SpeechRecognition over an upload.
5. **Does an installed dependency do it?** Use it. Never add a new one for what
   a few lines can do.
6. Only then, the minimum code that works.

Plus:

- No interface with one implementation, no factory for one product, no config
  for a value that never changes.
- Fix the root cause, not the symptom. Grep every caller before editing a
  shared function.
- Non-trivial logic leaves one runnable check behind, in the existing
  `node:test` suites under `backend/test/`. No new frameworks, no fixtures.
- `npm test` passes before a commit.

## 5. Copy

| Rule | Example |
| :--- | :--- |
| **No em-dashes**, on screen or in source | Use a comma, a colon, or brackets |
| Plain, calm, second person | "You practised this yesterday", not "User completed session" |
| Say what a thing does **and does not** do | "This is not a diagnosis" belongs on the screen, not in a footnote |
| Never call a path treatment | It is a way to practise |
| Never call an assessment a diagnosis | It is a screening questionnaire |
| A change below the published MCID is "no measurable change" | Not "slightly better" |

The em-dash rule is also written in `frontend/DESIGN.md`, because it is a
design rule as much as a writing one.

## 6. Design

The system is [frontend/DESIGN.md](frontend/DESIGN.md), summarised in
[design.md](design.md). Three things that get broken most often:

- Marigold is a **fill, never a letter**. It is 2:1 against white.
- Never lay a panel over a photograph.
- Edit `frontend/tokens.json`, not the generated
  `src/styles/design-tokens.css`.

`scripts/contrast.test.mjs` and `scripts/landing-type.test.mjs` are the design
system's teeth. Show a rendered screenshot before committing to a large visual
change, not an ASCII mockup.

## 7. Git

- Commit messages are lowercase-prefixed and describe the effect, not the file
  list. No em-dashes.
- The root `.gitignore` is an **allowlist**: `/*` ignores every root-level
  entry and the exceptions are named. A new root file needs its own negation
  line, which is the cost of the allowlist and the whole reason it is written
  down.
- Push to `origin/main` when a task is finished.
