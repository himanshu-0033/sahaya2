# tasks.md

Status as of 2026-09-20. Shipped work is in `git log`, not here.

## Blocking a real student deployment

- [ ] **Audit log.** Allowlists gate access on every request, but nothing
      records who viewed what. Matters most in `admin/`, which shows contact
      details and exports them to CSV.
- [ ] **Google OAuth verification.** The consent screen is unverified, so
      anyone who does not personally know the owner sees an "unverified app"
      warning.
- [ ] **Transcribe the unverified instruments.** `wordingVerified: false` in
      `backend/lib/instruments.js`: K10, MSPSS, CBI, AIS-8, SAS-SV, PHQ-15,
      PC-PTSD-5, SCOFF, BSMAS, SCS-SF. Check each against its citation.
- [ ] **PSS-10 licence.** Free for research and teaching, needs the author's
      permission for commercial use.

## Waiting on someone else

- [ ] **C-SSRS.** Fully implemented with its skip logic and non-additive
      bands, held by `licenceCleared: false`. Needs a permission request to
      the Columbia Lighthouse Project. Publishing is then a one-line change.
- [ ] **SAM.** Needs permission from the Center for the Study of Emotion and
      Attention (Univ. of Florida) before any build, then a pictorial option
      mode in `AssessmentRun`, roughly 15 SVG figures, and non-summed scoring
      across three independent dimensions.

## Recurring

- [ ] **Re-verify the helplines** before any release touching crisis UI.
      Last checked 2026-09-15.
- [ ] **Re-check the 52 grounding video ids.** They are other people's videos
      and can be deleted or region-blocked without anyone touching this repo.
      `backend/test/grounding.test.mjs` catches malformed ids, not dead ones.

## Known and accepted

- The flagging heuristic misses real concerns and produces false positives by
  design. It is a nudge, and the copy says so.
- The bookend questionnaires are not outcome measures. Reporting on them would
  need a real study design, not this.
