<div align="center">

# DP Sahay

### A daily wellness check-in for students, and a console for the people who look after them

![status](https://img.shields.io/badge/status-prototype-f2a93b?style=flat-square)
![not a medical device](https://img.shields.io/badge/not%20a-medical%20device-b42318?style=flat-square)
![instruments](https://img.shields.io/badge/instruments-22%20published-1f2d52?style=flat-square)
![modules](https://img.shields.io/badge/modules-4-1f2d52?style=flat-square)
![node](https://img.shields.io/badge/node-%E2%89%A522-1f2d52?style=flat-square)

**prd** · [architecture](architecture.md) · [rules](rules.md) · [design](design.md) · [tasks](tasks.md) · [memory](memory.md) · [readme](README.md)

</div>

---

## 1. The product in one paragraph

A student opens the app once a day, looks at three abstract plates, types the
first word each one brings to mind, and taps a mood from 1 to 5. They get back
a short affirming thought and one more day on their streak. That is the whole
daily loop, and it is deliberately about thirty seconds long. Everything else,
the questionnaires, the grounding practices, the guided paths, the reading and
the chat companion, sits one tap deeper and is opened by choice. Beside it runs
a separate console where a counsellor sees which students might be worth a real
conversation.

> [!IMPORTANT]
> This is a reflective prototype, not a medical device. Nothing in it performs
> clinical assessment, and no screen in it diagnoses anyone. Read
> [section 6](#6-non-goals) before adding anything that produces a number.

## 2. Who it is for

| Audience | Where they are | What they can do |
| :--- | :--- | :--- |
| **Student** | `frontend/`, three tabs: Home, Calm, More | Check in daily, take a questionnaire, run a grounding practice, follow a path, chat, read |
| **Counsellor** | `admin/`, its own window and sign-in | See only students assigned to them or who invited them. Read only, apart from inviting a student |
| **Manager** | `admin/` | Counsellor performance only, no student names anywhere |
| **Super admin** | `admin/` | Every student, assigns counsellors, approves staff access, reads enquiries |
| **Visitor** | The landing page | Answer one real WHO-5 question with no account, or send a campus enquiry |

The console is a separate app rather than another route in `frontend/` for
three reasons: a counsellor keeps it open in its own window, it signs in under
its own storage key so it cannot collide with a student session in another tab
of the same browser, and it never ships student-facing code.

## 3. The daily loop

```
   three plates        one word each        mood 1 to 5
        |                    |                   |
        +--------------------+-------------------+
                             |
                 stored, then answered with
                             |
        +--------------------+-------------------+
        |                                        |
  a thought for today                     a streak count
  deterministic from the                  days in a row
  student id plus the date,
  so it is the same all day
  and different tomorrow
```

In the background, `backend/lib/logic.js` flags the check-in if mood has been
low for three check-ins running, or the weekly average is low, or two or more
of today's words hit a small negative word list.

> [!NOTE]
> The flagging heuristic is intentionally simple. It will both miss real
> concerns and flag false positives. It is a nudge to check in on someone, not
> a signal to act on alone, and the copy in the console says exactly that.

## 4. What is in the product

<details open>
<summary><b>Assessments</b> &middot; 22 published self-scoring questionnaires</summary>

<br>

ASQ, PHQ-9, GAD-7, K10, WHO-5, PSS-10, UCLA-3, MSPSS, Mini-SPIN, RSES, BRS,
GSE-10, Flourishing Scale, CBI (personal), AIS-8, SAS-SV, AUDIT-C, PHQ-15,
PC-PTSD-5, SCOFF, BSMAS, SCS-SF.

Items, answer scales, licence and citation live in
`backend/lib/instruments.js`. Scoring in `backend/lib/scoring.js` is a sum, an
optional published transform, and a band lookup. It is deliberately
hand-checkable, with no modelling anywhere.

A positive answer to PHQ-9 item 9 routes into the crisis path regardless of the
total score.

Every screen with a published cut-off (PC-PTSD-5 at 3, SCOFF at 2, BSMAS at 24,
Mini-SPIN and UCLA-3 at 6) is tested **exactly on the boundary**, because off
by one is how a band table actually fails.

</details>

<details open>
<summary><b>Grounding</b> &middot; 13 practices the student runs rather than fills in</summary>

<br>

Cyclic sighing, box breathing, 4-7-8, 5-4-3-2-1, orienting, feet on the floor,
butterfly hug, progressive muscle release, body scan, cold water (DBT's TIPP),
cognitive grounding, a self-compassion break, and NSDR.

Two shapes, both in `backend/lib/grounding.js`: a **pacer** (an animated breath
or tap cycle) or **steps** (a sequence of timed prompts).

Nothing here is scored. The app records that you practised, and only if you
offer it, a 1 to 5 self-report of how settled you felt either side.

Each practice carries its evidence at the strength it actually has, labelled
`trial`, `mechanism` or `clinical`. Each links four guided YouTube videos, all
52 ids checked against YouTube's oEmbed endpoint, and nothing loads from
YouTube until someone presses play.

</details>

<details open>
<summary><b>Guided paths</b> &middot; 5 multi-day sequences</summary>

<br>

| Path | Days | Shape |
| :--- | :---: | :--- |
| `steadier` | 7 | Breathwork for background anxiety, bookended by GAD-7 |
| `winding-down` | 5 | Nights, bookended by AIS-8 |
| `less-noise` | 7 | Getting out of a spinning head, bookended by PSS-10 |
| `own-side` | 6 | Self-compassion, bookended by SCS-SF |
| `exam-week` | 5 | Timed around an exam, no bookend |

Days are stored as a **list, not a count**, because they can be done out of
order, undone, and picked up on day nine. Nothing is gated and there is no
streak to break.

</details>

<details open>
<summary><b>Inkblot</b> &middot; 10 original plates, never scored</summary>

<br>

Answered in free text or by voice, using the browser's own SpeechRecognition,
so no key and no upload. A real Rorschach is administered and coded by a
trained clinician, so this stores what was written and reports only descriptive
counts: plates answered, words written, and which words recurred across plates.
Free text is screened by `backend/lib/safety.js` before storage. The plates are
original shapes, not the Rorschach plates.

</details>

<details open>
<summary><b>Chat</b> &middot; a supportive companion with a hard safety floor</summary>

<br>

`agent/lib/safety.js` screens every user turn **before any model is called**,
for three kinds of disclosure (suicide, self-harm, and abuse or violence), in
English and romanised Hindi. A match gets a fixed reply that thanks them, asks
directly whether they are safe right now, gives 112 and the line that fits, and
stays in the conversation.

Every later reply runs the model under a safety protocol that forbids method
information and keeps the way to a person open. The backend screens the saved
transcript again, so a disclosure reaches the console even if the browser never
reported it.

A chat can open on a topic chip (study pressure, relationships, placements,
family, something else). `backend/lib/topics.js` files the saved transcript
under the chip they tapped plus any topic whose words they used, and the
console lists those students under **Raised in chat**. It is word matching over
the student's own lines, it reaches only counsellors the student shared with,
and it is not a flag.

</details>

<details>
<summary><b>Enquiries</b> &middot; the public campus form</summary>

<br>

The landing page ends with a "bring it to your campus" form for a college or
organisation: enquiry type, name, phone, email, organisation, role, a message,
and how they heard about the app. It posts to `/api/enquiries` with no account,
behind a per-client rate limit and a hidden field that drops bot submissions.
Only the super admin reads them back.

</details>

## 5. The bookend problem

Four of the five paths take a questionnaire at the start and again at the end.
That comparison is the single number in this app most likely to be misread, so
`backend/lib/paths.js` enforces three things and `backend/test/paths.test.mjs`
asserts them:

1. A bookended path **must** carry `closingCaveat`, explaining what a change
   does not mean.
2. It must open and close on the **same** instrument.
3. Where a minimal clinically important difference is published (4 points for
   the GAD-7), a smaller move is reported as **"no measurable change"** rather
   than as a direction.

A path is described throughout as a way to practise, never as a course of
treatment.

## 6. Non-goals

| Not this | Why |
| :--- | :--- |
| Diagnosis or clinical assessment | It is a prototype, and it says so on the screen |
| Any score a human cannot check by hand | A number that looks clinical must be reproducible with a pen |
| Any instrument without demonstrated reliability | See the three rejected tests in [memory.md](memory.md) |
| Outcome reporting from the bookends | A seven-day change is dominated by noise and regression to the mean |
| A promise that nobody sees a student's data | Untrue. Their counsellor and the administrator can. See [memory.md](memory.md) |
| Scoring the inkblot | Coding a Rorschach requires a trained clinician |

## 7. Done means

- [x] Every claim on a screen is true.
- [x] Every number is hand-checkable.
- [x] Every practice with a contraindication shows its caution **before** the
      start button.
- [x] Every CSV that leaves the console, and every record opened in it, is
      logged, append only.
- [ ] Every crisis number is verified within the current release.
- [ ] Every instrument's wording is transcribed from its source document.

The two unticked lines are the live work. See [tasks.md](tasks.md).
