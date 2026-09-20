# memory.md

Decisions and their reasons, for context an agent cannot read off the code.
Dates are when the call was made.

## Crisis helplines, verified 2026-09-15

Used in CrisisContacts, ErrorBoundary, the `index.html` noscript block, the
landing footer, and both safety modules.

- **Tele-MANAS 14416** (also 1-800-891-4416), 24/7. **KIRAN 1800-599-0019
  merged into it. Never list KIRAN again.**
- Emergency **112**.
- iCall (TISS) **9152987821**, Mon to Sat, **10am to 8pm**. The app once said
  8am to 10pm, which was wrong.
- Vandrevala Foundation **+91 9999 666 555**, 24/7. The old 1860-2662-345 is gone.
- AASRA **+91 98204 66726**, 24/7.
- Abuse: Women Helpline **181**, NCW **7827170170** (also 14490), Childline
  **1098** for under 18.

A wrong number on a crisis screen sends someone in danger to a dead line.

## Instruments reviewed 2026-09-04

Nine candidates were reviewed. Four were already built. Of the rest:

**Rejected on evidence. Do not add these, and do not re-propose them without
new evidence.**

- **Dot probe.** A 2025 study across 36 variations and 9,600 participants found
  no version with internal reliability above zero. Meta-analysis finds no
  behavioural bias even in clinically anxious people. The effect only shows up
  in the N2pc ERP, which means EEG, not a browser.
- **Emotional Stroop.** Raw reaction times are reliable, but the interference
  index (the number you would actually report) is a difference between two
  highly correlated values and has unacceptably low internal consistency.
- **Facial Emotion Recognition.** FER2013 is 48x48 greyscale, web-scraped, built
  to train models, so it is too low-resolution to show a person and made of
  faces that never consented. Ekman's material is commercial training, not an
  administrable test.

Shipping an unreliable instrument puts a number in the counsellor console that
looks clinical and measures nothing. In a mental-health app that is worse than
the test being absent.

Blocked on permission rather than code: C-SSRS and SAM. See `tasks.md`.

## Access model, chosen 2026-09-15

The owner runs the deployment for an institution and wants oversight.

- The super admin (`SUPER_ADMIN_EMAILS`, default himanshumalik0033@gmail.com)
  opens the console without being on `ADMIN_EMAILS`, sees every student, and
  uses the Team page.
- **Assign directly, students told**, chosen over "student accepts first". An
  assigned counsellor sees the student immediately, the assignment is stored in
  `resident.assignedBy`, and the student's account page shows "Assigned by your
  institution" and cannot remove it. A counsellor the student invited stays
  removable by the student.
- The console is the **"Admin panel"**, never badged "Counsellor".
- Access is **request, then approve**. Anyone can sign in and pick counsellor
  or manager, which saves a pending `staff` record and shows a "Request sent"
  screen. The super admin approves on the Team page. `ADMIN_EMAILS` and
  addresses added ahead of time skip the request. **Do not go back to "the
  super admin must add your email first"**, that was tried and refused a real
  user.
- A **manager** sees counsellor performance only, no student names. A
  **counsellor** sees only students assigned to them or who invited them.
  Enquiries and assigning are super admin only.

## Visual direction, settled 2026-09-18

Two rejected attempts taught the rules: a one-ink printed form look (cold and
official) and a hero that laid the survey card over the photograph (amateur).
Keep photographs and colour, never cover an image with a panel. Details in
`design.md` and `frontend/DESIGN.md`.

## Why the backend is one function

One file per route hit Vercel Hobby's 12 function cap at 19 routes. Deploys
built and then failed while shipping, so production silently stayed weeks
behind on the last build small enough to deploy, and new routes returned the
platform's own 404, which carries no CORS headers, so the browser reported the
server as unreachable rather than the route as missing. The filesystem
catch-all was tried first and resolved as a single segment, breaking sign-in.
See `architecture.md`.
