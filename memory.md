<div align="center">

# Memory

### Decisions, their dates, and the reasons that are not readable from the code

![helplines](https://img.shields.io/badge/helplines%20verified-2026--09--15-1f2d52?style=flat-square)
![instruments](https://img.shields.io/badge/instruments%20reviewed-2026--09--04-1f2d52?style=flat-square)
![access](https://img.shields.io/badge/access%20model-2026--09--15-1f2d52?style=flat-square)
![visual](https://img.shields.io/badge/visual%20direction-2026--09--18-f2a93b?style=flat-square)

[prd](prd.md) · [architecture](architecture.md) · [rules](rules.md) · [design](design.md) · [tasks](tasks.md) · **memory** · [readme](README.md)

</div>

---

> [!NOTE]
> Everything here was decided once, for a reason, and the reason is not visible
> in the diff. Read this before re-proposing something that looks like an
> obvious improvement. Dates are when the call was made.

## Crisis helplines, verified 2026-09-15

Used in `CrisisContacts`, `ErrorBoundary`, the `index.html` noscript block, the
landing footer (`features/auth/Welcome.jsx`), `agent/lib/persona.js`, and both
`safety.js` modules. The two safety modules are separate files that must agree
on `PATTERNS` and `HELPLINES`, which `backend/test/reflection.test.mjs`
asserts; they are not, and need not be, byte-identical.

| Line | Number | Hours |
| :--- | :--- | :--- |
| **Tele-MANAS** | **14416**, also 1-800-891-4416 | 24/7, Govt. of India |
| Emergency | **112** | 24/7 |
| iCall (TISS) | 9152987821 | **Mon to Sat, 10am to 8pm** |
| Vandrevala Foundation | **+91 9999 666 555** | 24/7 |
| AASRA | +91 98204 66726 | 24/7 |
| Women Helpline | 181 | For abuse |
| NCW | 7827170170, also 14490 | 24/7 |
| Childline | 1098 | Under 18 |

> [!CAUTION]
> **KIRAN 1800-599-0019 merged into Tele-MANAS. Never list KIRAN again.**
>
> Two other corrections already made and not to be undone: iCall's hours were
> shown as 8am to 10pm, which was wrong, and Vandrevala's old 1860-2662-345
> number is gone.

**Why it matters:** a wrong or closed number on a crisis screen sends someone
in danger to a dead line.

## Instruments reviewed 2026-09-04

Nine candidate tests were reviewed. Four were already built. Of the remaining
five, two are blocked on permission (see [tasks.md](tasks.md#2-waiting-on-someone-else))
and three were rejected on evidence.

### Rejected. Do not add these, and do not re-propose them without new evidence.

<details open>
<summary><b>Dot probe</b></summary>

<br>

A 2025 study across 36 variations and 9,600 participants found **no version
with internal reliability above zero**. Meta-analysis finds no behavioural bias
even in clinically anxious people. The effect only appears via the N2pc ERP,
which means EEG, not a browser.

</details>

<details open>
<summary><b>Emotional Stroop</b></summary>

<br>

Raw reaction times are reliable, but the **interference index**, which is the
number you would actually report, is a difference between two highly correlated
values and has unacceptably low internal consistency.

</details>

<details open>
<summary><b>Facial emotion recognition</b></summary>

<br>

FER2013 is 48x48 greyscale, web-scraped, and built to train models. It is both
too low-resolution to show a person and made of faces that never consented.
Ekman's material is commercial training, not an administrable test.

</details>

**Why it matters:** shipping an unreliable instrument puts a number in the
counsellor console that looks clinical and measures nothing. In a
mental-health app that is worse than the test being absent.

**For broader coverage**, prefer freely-licensed validated scales that fit the
existing instrument engine.

## Access model, chosen 2026-09-15

The owner runs the deployment for an institution and wants oversight of every
counsellor and every student. Two forks were put to them and both were decided.

### Fork one: how a student gets a counsellor

**Chosen: assign directly, students told.** Rejected: student accepts first.

- The super admin (`SUPER_ADMIN_EMAILS`, default himanshumalik0033@gmail.com)
  opens the console without being on `ADMIN_EMAILS`, sees every student, and
  uses the Team page (`/api/admin/team`, `/api/admin/assign`).
- An assigned counsellor sees the student **immediately**. The assignment is
  stored in `resident.assignedBy` and shows on the student's account page as
  "Assigned by your institution", where the student **cannot remove it**.
- A counsellor the student invited themselves stays removable by the student.
- Every student-facing "nobody sees this unless you share" line was rewritten
  to say that their counsellor and the institution's administrator can.

### Fork two: how a staff member gets in

**Chosen: request, then approve.** Rejected: the super admin must add your
email first, which was tried and refused a real user (a kgpian account).

- Anyone can sign in and pick **counsellor or manager**. That saves a pending
  `staff` record and shows only a "Request sent" screen.
- The super admin approves or declines under **Access requests** on the Team
  page, which carries a count badge on the Team tab.
- `ADMIN_EMAILS`, and addresses the super admin adds ahead of time, skip the
  request.
- The console is called the **"Admin panel"**, never badged "Counsellor".

### Roles, enforced server-side

| Role | Sees |
| :--- | :--- |
| **Manager** | Counsellor performance only. The team page with no student names anywhere |
| **Counsellor** | Only students assigned to them or who invited them |
| **Super admin** | Everything, plus enquiries and assigning |

Enforced by `requireStudentAccess` and `requireTeamAccess` in
`backend/lib/auth.js`.

> [!IMPORTANT]
> Do not reintroduce "nobody sees it" promises, and do not quietly narrow the
> super admin's access. Any new screen that collects student data must say who
> can see it: counsellor plus administrator.

## Visual direction, settled 2026-09-18

Midnight blue `#1f2d52` as the brand, marigold `#f2a93b` as the one accent,
fill only and never text, cool off-white grounds, full-colour photographs, soft
rounded cards, Funnel Display and Funnel Sans self-hosted. The sage green it
launched with is gone: the owner asked for a different, trend-aware palette and
font.

**Two rejected attempts taught the rules:**

1. A one-ink "printed form" look, white paper, one green ink, square boxes,
   duotone photos. Rejected as cold and official.
2. A hero that laid the survey card over the hero photograph. Rejected as
   amateur. The owner wants senior-level composition.

**So:** keep photographs and colour, never cover an image with a panel, and let
a real interactive product element (the live WHO-5 first question) be the
hero's call to action rather than a button that promises one. Show a rendered
screenshot before committing to a large visual change, not an ASCII mockup.

Written up in [frontend/DESIGN.md](frontend/DESIGN.md) and summarised in
[design.md](design.md).

## Why the backend is one function

Three production failures, in order.

1. **The filesystem catch-all** `api/[...path].js` deployed as a
   single-segment `[param]`. `/api/checkins` resolved, `/api/auth/login`
   returned the platform's 404, and sign-in broke while the pages either side
   looked fine.
2. **The twelve function cap.** One file per route reached 19 routes on a plan
   allowing 12 functions per deployment. Every deploy built successfully and
   then failed while shipping, so production silently froze on an old build for
   weeks. New routes returned the platform's own 404, which carries no CORS
   headers, so the browser reported the server as unreachable rather than the
   route as missing.
3. **Two route tables.** Routing lived in `dev-server.js` locally and in the
   filesystem in production. They drifted, and `/api/health` answered on a
   laptop and 404'd in production.

All three are closed by one table in `backend/lib/routes.js`, read by both the
router and the dev server. Details in
[architecture.md](architecture.md#2-one-function-not-nineteen).

## Why the root `.gitignore` is an allowlist

`/*` ignores every root-level entry and the exceptions are named one by one.
The repo root collects directories from eighteen different AI assistants, and
an ignore-what-we-see list loses that race permanently. A new root file needs
its own negation line. That is the cost of the allowlist and the whole reason
it is written down in the file itself.
