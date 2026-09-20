<div align="center">

# Tasks

### What is left before this can point at real students, and what has to be re-checked forever

![updated](https://img.shields.io/badge/updated-2026--09--20-1f2d52?style=flat-square)
![blocking](https://img.shields.io/badge/blocking%20launch-3-b42318?style=flat-square)
![waiting](https://img.shields.io/badge/awaiting%20permission-2-f2a93b?style=flat-square)
![recurring](https://img.shields.io/badge/recurring-2-1f2d52?style=flat-square)
![tests](https://img.shields.io/badge/tests-32%20suites-1f2d52?style=flat-square)

[prd](prd.md) · [architecture](architecture.md) · [rules](rules.md) · [design](design.md) · **tasks** · [memory](memory.md) · [readme](README.md)

</div>

---

Shipped work is in `git log`, not here. This file holds only what is open.

## 1. Blocking a real student deployment

> [!CAUTION]
> Do not point this at real students until section 1 is empty.

### 1.1 Transcribe the unverified instruments

`wordingVerified: false` means the items were written from memory rather than
transcribed from the source document. Six **published** instruments are still
in that state:

| Instrument | Status |
| :--- | :--- |
| ASQ | published, wording unverified |
| PHQ-15 | published, wording unverified |
| PC-PTSD-5 | published, wording unverified |
| SCOFF | published, wording unverified |
| BSMAS | published, wording unverified |
| SCS-SF | published, wording unverified |
| C-SSRS | not published, also unverified, see 2.1 |

Check each against its citation in `backend/lib/instruments.js` and flip the
flag. K10, MSPSS, CBI, AIS-8 and SAS-SV were on this list and have since been
verified, so the remaining six are the whole job.

### 1.2 Verify the OAuth consent screen

Google shows an "unverified app" warning until the project goes through
verification. It matters the moment this is used by people who do not
personally know the owner.

### 1.3 Clear the PSS-10 licence for its actual use

Free for research and teaching. Commercial use needs the author's permission.
Decide which this deployment is before it takes money.

## 1b. Closed since this file was written

### The daily check-in was not screened, closed 2026-09-20

Every other place a student could type was screened for a crisis disclosure.
The daily check-in, the one thing every student does every day, was not: it
went only through the mild-word heuristic, which needs two hits from a
twenty-four word list with nothing about dying in it. The app flagged "tired
sad lonely" for a counsellor and did nothing at all for "kill myself tonight",
and the student who wrote the second one was shown a thought for the day and a
streak.

Now screened by the same module as the chat and the inkblot. See
[rules.md](rules.md) 1.4 for what a match has to do, and
`backend/test/checkin-safety.test.mjs` for the cases.

### Access logging, closed 2026-09-20

Both halves now exist and `backend/test/audit.test.mjs` holds them in place.

- **Exports** are logged by the console before the CSV is built, because the
  file is assembled in the browser and the server never sees it happen.
- **Views** are logged by the server in `handlers/admin/resident.js`, after the
  access check passes. A client that decides whether to report itself is not a
  record of anything, so this one is not the browser's call.
- A refused view writes **no** row, so the log cannot be used to prove an
  account exists.
- Repeat visits inside a quarter of an hour collapse to one row, by bucketing
  the entry id rather than reading the log first, so two racing requests cannot
  both insert.
- Reading the log back is **scoped**. It names students, so handing all of it
  to every counsellor would have made the audit log the widest leak in the
  console. The super admin sees everything; everyone else sees their own
  actions.

## 2. Waiting on someone else

### 2.1 C-SSRS

- [ ] Request permission from the Columbia Lighthouse Project
      (`cssrs.columbia.edu`).

Already fully implemented in `backend/lib/instruments.js`, with its skip logic
and its non-additive risk bands, held only by `licenceCleared: false`. When
permission clears, publishing is a one-line change plus the wording pass in 1.1.

### 2.2 SAM, the Self-Assessment Manikin

- [ ] Ask the Center for the Study of Emotion and Attention, University of
      Florida, **before** building anything.

The manikin figures are copyrighted and they *are* the instrument. Convention
is "adapted with permission from Bradley and Lang (1994)", and Millisecond
bundles it under a paid Inquisit licence. Once permission exists it needs a
pictorial option mode in `AssessmentRun`, roughly 15 SVG figures, and
non-summed scoring across three independent dimensions.

## 3. Known ceilings, not yet hit

### The dashboard reads the whole database

`/api/admin/overview` fetches every check-in, assessment and chat session and
narrows them in memory. Fine at prototype size; a thousand students over a year
is a few hundred thousand check-in documents fetched to draw a fourteen-day
trend.

It is not simply a date window. The trend is fourteen days and the mood mix
thirty, but the same pass reports a streak and a lifetime check-in count, and a
window would quietly truncate the streak, which is the one number a student is
told about. The upgrade is to denormalise `totalCheckIns`, `streak` and
`lastCheckIn` onto the resident record at write time, then read a bounded slice
here. That is a migration plus a second writer, so it wants doing on purpose.

## 4. Recurring, forever

| Check | Cadence | Last done | Why |
| :--- | :--- | :--- | :--- |
| **Re-verify every helpline** | Before any release touching crisis UI | **2026-09-20** | A dead number on a crisis screen sends someone in danger nowhere. Two were wrong on 2026-09-20: AASRA's number and iCall's hours |
| **Re-check the 52 grounding video ids** | Periodically | When added | They are other people's videos and can be deleted, made private or region-blocked without anyone touching this repo |

> [!NOTE]
> `backend/test/grounding.test.mjs` catches **malformed** video ids, not dead
> ones, and `backend/test/helplines.test.mjs` pins the numbers but cannot tell
> you one has gone dead. A test pass is not a verification. Check the
> organisation's own site, not a search summary: searches still hand back
> Vandrevala's retired 1860-266-2345.

## 5. Known and accepted

These are not bugs and do not need fixing. They need to stay true.

- The flagging heuristic misses real concerns and produces false positives by
  design. It is a nudge, and the copy says so.
- The bookend questionnaires are not outcome measures. Reporting on them would
  need a real study design, not this.
- A guided path is a sequence of practices, not a clinical protocol.
- The cold-water practice can slow the heart, which is the point and also the
  risk. Its caution text is asserted by name in the test suite. Treat that
  assertion as load-bearing.

## 6. Rejected, closed

Do not reopen these without new evidence. The reasoning is in
[memory.md](memory.md#instruments-reviewed-2026-09-04).

- ~~Dot probe~~ no version with internal reliability above zero.
- ~~Emotional Stroop~~ the interference index has unacceptably low internal
  consistency.
- ~~Facial emotion recognition~~ FER2013 is 48x48 greyscale and made of faces
  that never consented.
