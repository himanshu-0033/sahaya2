// Guided paths.
//
// A path sequences things that already exist in this app — a grounding
// practice from grounding.js, sometimes a questionnaire from instruments.js —
// across several days. Nothing new is being claimed or measured; the only new
// idea is ORDER, and the fact that Tuesday knows Monday happened.
//
// This is the part of the app most likely to drift into implying treatment, so
// the rules are strict:
//
//   1. A PATH IS A STRUCTURE FOR PRACTISING, NOT A COURSE OF TREATMENT. It is
//      not CBT, it is not therapy, and it must never be described as either.
//      The copy here says "a way to practise" and never "a programme to treat".
//   2. THE CLOSING QUESTIONNAIRE IS NOT AN OUTCOME MEASURE. Re-taking the
//      GAD-7 after seven days and showing a drop invites exactly one reading:
//      "the path worked". That reading is not supportable. A week is short,
//      these scales move several points on sleep and exam timing alone, and
//      regression to the mean does most of the work at the top end. Every
//      path therefore carries `closingCaveat`, the API returns it alongside
//      any comparison, and the UI is required to show it next to the numbers.
//      The published minimal clinically important difference is recorded in
//      `mcid` where one exists, so the UI can say when a change is smaller
//      than the instrument can actually resolve.
//   3. NOTHING IS LOCKED. Days can be done out of order, repeated, or skipped.
//      A streak mechanic that punishes a bad week is the wrong shape for a
//      mental-health app — the people most likely to break a streak are the
//      ones who most need to come back on day nine.
//   4. EVERY REFERENCE MUST RESOLVE. Technique and instrument ids are checked
//      against the real catalogues in test/paths.test.mjs, so a renamed
//      practice cannot leave a path pointing at nothing.

export const PATHS = [
  {
    id: 'steadier',
    name: 'Seven days of steadier',
    blurb: 'A short breath practice every day for a week, when anxiety is the background noise.',
    forWhom: 'Anxiety that is there most days rather than in one big spike.',
    accent: 'teal',
    opensWith: 'gad-7',
    closesWith: 'gad-7',
    // Spitzer et al. put the minimal clinically important difference at ~4
    // points. Anything smaller is inside the instrument's own noise.
    mcid: 4,
    closingCaveat:
      'A week is a short time. GAD-7 scores move by several points on their own — with sleep, ' +
      'exams, illness, or how the last hour went. A change here is a snapshot of two particular ' +
      'days, not a verdict on the week or on you.',
    days: [
      { title: 'Start with the fastest one', note: 'Two breaths in, one long breath out. It works in seconds, which is the point.', technique: 'cyclic-sighing' },
      { title: 'Something to count', note: 'Four equal sides. Nothing to decide and nothing to get wrong.', technique: 'box-breathing' },
      { title: 'Out of your head', note: 'Anxiety runs on things that are not in the room. This puts attention back in it.', technique: '5-4-3-2-1' },
      { title: 'Again, properly', note: 'The second time is usually better than the first. You know what to expect.', technique: 'cyclic-sighing' },
      { title: 'Somewhere to put it', note: 'The one nobody can see you doing. Useful in a lecture.', technique: 'feet-on-floor' },
      { title: 'Before something hard', note: 'Try this one before a thing you are dreading rather than after.', technique: 'box-breathing' },
      { title: 'Last day', note: 'Same as day one. Notice whether it lands differently now.', technique: 'cyclic-sighing' },
    ],
  },
  {
    id: 'winding-down',
    name: 'Five nights of winding down',
    blurb: 'A wind-down practice each night, for when getting to sleep is the problem.',
    forWhom: 'Lying awake, or a mind that starts up the moment the light goes off.',
    accent: 'lavender',
    opensWith: 'ais-8',
    closesWith: 'ais-8',
    mcid: null,
    closingCaveat:
      'Sleep varies enormously night to night for reasons that have nothing to do with practice — ' +
      'noise, heat, caffeine, what is happening tomorrow. Five nights is far too short to say ' +
      'anything about your sleep in general.',
    days: [
      { title: 'The long exhale', note: 'Four rounds and no more. Do it lying down the first time.', technique: '4-7-8-breathing' },
      { title: 'Head to toe', note: 'You are not fixing anything here. Just visiting each part and reporting back.', technique: 'body-scan' },
      { title: 'Let the day out of your shoulders', note: 'Squeeze hard first — it is the only way to feel the letting go.', technique: 'progressive-muscle-relaxation' },
      { title: 'Lying still on purpose', note: 'This one needs a voice. Put the phone face down and follow the recording.', technique: 'nsdr' },
      { title: 'Back to the breath', note: 'Day one again, now that your body knows the shape of it.', technique: '4-7-8-breathing' },
    ],
  },
  {
    id: 'less-noise',
    name: 'A week of less noise',
    blurb: 'Seven days of getting out of a spinning head, when everything feels like too much.',
    forWhom: 'Overwhelm, rumination, the same thought going round since Tuesday.',
    accent: 'amber',
    opensWith: 'pss-10',
    closesWith: 'pss-10',
    mcid: null,
    closingCaveat:
      'The PSS-10 asks about the last month, so after one week most of what it is measuring has ' +
      'not changed and cannot have. Treat a difference here as noise unless it is large.',
    days: [
      { title: 'Name what is actually here', note: 'Five things you can see. Say them out loud if you can.', technique: '5-4-3-2-1' },
      { title: 'Give the loop a job', note: 'Working memory is small and you only get one. Occupy it.', technique: 'mental-grounding' },
      { title: 'Find the floor', note: 'Push down. Notice it pushing back.', technique: 'feet-on-floor' },
      { title: 'Check the room', note: 'Turn your head slower than feels natural. Let your eyes land.', technique: 'orienting' },
      { title: 'Something with edges', note: 'Four counts each way. A shape to hold on to.', technique: 'box-breathing' },
      { title: 'Back into your body', note: 'Notice, do not fix. That distinction is the whole practice.', technique: 'body-scan' },
      { title: 'Last day', note: 'Count backwards from 100 by sevens and try to worry at the same time.', technique: 'mental-grounding' },
    ],
  },
  {
    id: 'own-side',
    name: 'Six days on your own side',
    blurb: 'Practising the way you talk to yourself when something goes wrong.',
    forWhom: 'Being harder on yourself than you would ever be on a friend.',
    accent: 'rose',
    opensWith: 'scs-sf',
    closesWith: 'scs-sf',
    mcid: null,
    closingCaveat:
      'How you treat yourself is a long habit and six days is not long. If the number barely moves, ' +
      'that is expected and is not a failure — the practice is the point, not the score.',
    days: [
      { title: 'Three sentences', note: 'Name that it hurts, remember you are not the only one, then say something kind. Most people stall on the third.', technique: 'self-compassion-break' },
      { title: 'Something steadier', note: 'Arms crossed, tap slowly. It is the posture of being held.', technique: 'butterfly-hug' },
      { title: 'Say it again', note: 'If it felt fake on day one, that is normal. It still counts.', technique: 'self-compassion-break' },
      { title: 'Somewhere that is not thinking', note: 'A break from the commentary.', technique: 'body-scan' },
      { title: 'When it is bad', note: 'Use this one on a real bad moment rather than a scheduled one.', technique: 'butterfly-hug' },
      { title: 'Last day', note: 'What would you say to your best friend in exactly your situation? Say that.', technique: 'self-compassion-break' },
    ],
  },
  {
    id: 'exam-week',
    name: 'Five days to an exam',
    blurb: 'Short practices timed around an exam, so the week does not run you.',
    forWhom: 'An exam coming, and the days before it getting worse than the exam.',
    accent: 'sky',
    // No opening or closing questionnaire on purpose: a screening instrument
    // taken in exam week measures exam week. Handing someone a "moderate
    // anxiety" label four days before a paper is not useful to them.
    opensWith: null,
    closesWith: null,
    mcid: null,
    closingCaveat: null,
    days: [
      { title: 'Five days out', note: 'Something with a rhythm you can do at a desk.', technique: 'box-breathing' },
      { title: 'Four days out', note: 'The fast one. Learn it now so it is there on the day.', technique: 'cyclic-sighing' },
      { title: 'Three days out', note: 'Invisible, and doable in the exam hall itself.', technique: 'feet-on-floor' },
      { title: 'The night before', note: 'Get it out of your shoulders so you can sleep.', technique: 'progressive-muscle-relaxation' },
      { title: 'The day itself', note: 'Four counts each way, right outside the hall. Then go in.', technique: 'box-breathing' },
    ],
  },
];

export const PATH_IDS = PATHS.map((p) => p.id);

export function getPath(id) {
  return PATHS.find((p) => p.id === id) || null;
}

// Days are 1-indexed everywhere a resident sees them, and 0-indexed in the
// array. Converting in one place stops that being an off-by-one waiting to
// happen in three different components.
export function dayAt(path, dayNumber) {
  return path.days[dayNumber - 1] || null;
}

export function catalog() {
  return PATHS.map((p) => ({
    id: p.id,
    name: p.name,
    blurb: p.blurb,
    forWhom: p.forWhom,
    accent: p.accent,
    dayCount: p.days.length,
    opensWith: p.opensWith,
    closesWith: p.closesWith,
  }));
}

export function pathDetail(path) {
  return {
    id: path.id,
    name: path.name,
    blurb: path.blurb,
    forWhom: path.forWhom,
    accent: path.accent,
    dayCount: path.days.length,
    opensWith: path.opensWith,
    closesWith: path.closesWith,
    mcid: path.mcid,
    closingCaveat: path.closingCaveat,
    days: path.days.map((d, i) => ({ day: i + 1, ...d })),
  };
}

// How a resident's stored progress becomes something the UI can render.
// `completedDays` is an array of day numbers, deliberately not a count: days
// can be done out of order, so a count would lose which ones.
export function progressFor(path, record) {
  const completed = record?.completedDays || [];
  const done = completed.length;
  const total = path.days.length;

  // The next thing to suggest: the lowest day not yet done. Once everything is
  // done there is no next day, and the path is finished.
  const nextDay = path.days.map((_, i) => i + 1).find((d) => !completed.includes(d)) || null;

  return {
    pathId: path.id,
    startedAt: record?.startedAt || null,
    completedDays: completed,
    done,
    total,
    nextDay,
    finished: done === total,
  };
}
