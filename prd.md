# prd.md

## What this is

DP Sahay is a daily wellness check-in for students, with a counsellor console
beside it. A student types one word per abstract plate, taps a mood, and gets a
short thought and a streak. Counsellors see who might be worth a real
conversation.

**It is a reflective prototype, not a medical device.** No screen in it
diagnoses anyone.

## Who it is for

1. **Students** on a campus deployment. The daily loop is the product; paths,
   questionnaires, grounding, reading and the chat sit one tap deeper.
2. **Counsellors**, in `admin/`, their own window, their own sign-in. Read-only
   apart from inviting a student.
3. **A super admin** per institution, who assigns counsellors and approves
   staff access. See `memory.md`.

## What it does

| Area | Shape |
| --- | --- |
| Check-in | 3 plates plus mood 1 to 5, deterministic thought for the day, streak |
| Flagging | Rule based, `backend/lib/logic.js`. A nudge, never a signal to act on alone |
| Assessments | 21 published self-scoring questionnaires, sum plus published transform plus band lookup |
| Grounding | 13 practices run in the app, not scored, evidence strength labelled |
| Paths | 5 multi-day sequences, order free, 4 bookended by a questionnaire |
| Inkblot | 10 original plates, free text or voice, descriptive counts only, never scored |
| Chat | Supportive companion, every user turn safety screened before any model call |
| Enquiries | Public "bring it to your campus" form, no account |

## Non-goals

- No diagnosis, no clinical assessment, no treatment protocol.
- No modelling or scoring anywhere a human cannot check by hand.
- No instrument that measures nothing. See the rejected tests in `memory.md`.
- No outcome reporting off the bookend questionnaires. A seven-day change is
  noise plus regression to the mean.

## Done means

Every claim on a screen is true, every number is hand-checkable, every crisis
number is live, and every screen that takes student data says who can see it.

Full behaviour: [README.md](README.md).
