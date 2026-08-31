# Source questionnaire forms

The published PDFs the instrument wording was transcribed from. They live
here so the transcription can be checked against the original, and they are
**not committed** — `.gitignore` excludes `*.pdf` throughout.

They are third-party clinical documents, not part of this codebase. The
wording actually served to a resident, together with its licence and
citation, lives in [`backend/lib/instruments.js`](../../backend/lib/instruments.js).
That file is the source of truth; these are the paper it was checked against.

| File | Instrument | Where to obtain it |
|---|---|---|
| `patient-health-questionnaire.pdf` | PHQ-9 — depression | Public domain (Pfizer released it); widely mirrored, e.g. by the APA |
| `gad-7-anxiety-scale.pdf` | GAD-7 — generalised anxiety | Public domain (Pfizer released it) |
| `Columbia-Suicide Severity Rating Scales (C-SSRS).pdf` | C-SSRS — suicide severity | Free for use; request from [cssrs.columbia.edu](https://cssrs.columbia.edu) |

If you are setting up a fresh clone you do not need these to run anything.
Download them only if you are changing question wording, in which case the
original is the thing to check against — not the copy in this repo.
