// The grounding library.
//
// Thirteen practices a resident can run in the app, plus links out to guided
// videos for each. This is the one part of Sahaya that tries to *do* something
// in the moment rather than record something — so the rules here are different
// from instruments.js:
//
//   1. NOTHING HERE IS SCORED. A practice is not a measurement. The app records
//      that you did one and, if you say so, how settled you felt before and
//      after — a self-report, never a result.
//   2. EVERY TECHNIQUE CARRIES ITS EVIDENCE, and the evidence is stated at the
//      strength it actually has. `evidence.strength` is one of:
//        'trial'      — tested in a randomised trial in humans
//        'mechanism'  — the physiology is well established, the practice itself
//                       is less directly tested
//        'clinical'   — standard taught practice in an established therapy
//                       (DBT, EMDR, MBSR) without a trial of the single skill
//      Do not promote a technique up this ladder to make it sound better.
//   3. CAUTIONS ARE NOT DECORATION. Cold-water and breath-hold practices have
//      real contraindications. Every technique that has one says so, and the
//      UI shows it before the practice starts, not after.
//   4. VIDEO LINKS WERE CHECKED, NOT GUESSED. Every id below returned 200 from
//      YouTube's oEmbed endpoint with the channel named here. Re-check before
//      adding: third-party videos are the one thing in this repo that can rot
//      without anybody touching the code.
//
// Two shapes of practice, distinguished by which key is present:
//   `pacer` — a repeating breath/movement cycle the UI animates. Phases carry
//             an `action` the animation maps to a shape: grow, hold, shrink,
//             or move to one side.
//   `steps` — a sequence of timed prompts. `count` asks for that many things.

// Rounds needed to fill a target duration. Derived rather than typed in, so a
// cycle can be retimed without leaving a stale round count behind it.
const roundsFor = (cycleSeconds, totalSeconds) => Math.max(1, Math.round(totalSeconds / cycleSeconds));

const CYCLIC_SIGH_CYCLE = 9;
const BOX_CYCLE = 16;
const BUTTERFLY_CYCLE = 4;

export const FAMILIES = [
  { id: 'breath', label: 'Breath', note: 'Change the body first; the mind follows.' },
  { id: 'senses', label: 'Senses', note: 'Put attention outside your head.' },
  { id: 'body', label: 'Body', note: 'Somewhere to put the feeling that is not thinking.' },
  { id: 'mind', label: 'Mind', note: 'Give a spinning brain a job it can finish.' },
  { id: 'kindness', label: 'Kindness', note: 'How you talk to yourself at 2am.' },
  { id: 'rest', label: 'Rest', note: 'Longer practices, for after the spike.' },
];

export const TECHNIQUES = [
  // ---------------------------------------------------------------- breath
  {
    id: 'cyclic-sighing',
    name: 'Cyclic sighing',
    aka: 'The physiological sigh',
    family: 'breath',
    tagline: 'Two breaths in. One long breath out.',
    accent: 'teal',
    speed: 'fast',
    bestFor: ['Panic', 'Racing heart', 'Right before something scary'],
    why:
      'A long exhale is the one lever you have on your own heart rate that works in seconds. ' +
      'Slowing the out-breath relative to the in-breath shifts the balance toward the calming ' +
      'branch of the nervous system, and the second small sip of air reinflates parts of the ' +
      'lungs that shallow, anxious breathing leaves collapsed.',
    evidence: {
      strength: 'trial',
      claim:
        'In a randomised trial of 111 adults, five minutes a day of cyclic sighing improved mood ' +
        'and lowered resting breathing rate more than five minutes of mindfulness meditation.',
      citation: 'Balban et al. (2023), Cell Reports Medicine 4(1):100895',
      url: 'https://pubmed.ncbi.nlm.nih.gov/36630953/',
    },
    pacer: {
      cycleSeconds: CYCLIC_SIGH_CYCLE,
      rounds: roundsFor(CYCLIC_SIGH_CYCLE, 300),
      phases: [
        { label: 'In through your nose', seconds: 2, action: 'grow' },
        { label: 'One more sip of air', seconds: 1, action: 'grow' },
        { label: 'Long, slow out through your mouth', seconds: 5, action: 'shrink' },
        { label: 'Rest', seconds: 1, action: 'hold' },
      ],
    },
    videos: [
      { id: 'EN2ta7Z4d3s', title: 'Guided Cyclic Sighing (5 minutes)', channel: 'RESPIRE' },
      { id: 'rBdhqBGqiMc', title: 'Reduce Anxiety & Stress with the Physiological Sigh', channel: 'Andrew Huberman' },
      { id: '33zRGVGepiw', title: 'Double Inhale, Long Exhale Breath', channel: 'Ally Boothroyd | Sarovara Yoga' },
    ],
  },
  {
    id: 'box-breathing',
    name: 'Box breathing',
    aka: 'Square breathing, 4-4-4-4',
    family: 'breath',
    tagline: 'In four. Hold four. Out four. Hold four.',
    accent: 'sky',
    speed: 'steady',
    bestFor: ['Before an exam', 'Focus', 'When you cannot sit still'],
    why:
      'Four equal sides means there is nothing to decide and nothing to get wrong — which is ' +
      'most of the point. Counting occupies the part of your attention that would otherwise be ' +
      'running the worry, and the even rhythm pulls breathing down out of the top of the chest.',
    evidence: {
      strength: 'trial',
      claim:
        'Box breathing was one of three breathwork arms in the Stanford trial; all three beat the ' +
        'meditation control on mood, with the exhale-weighted pattern ahead of it. A 2023 ' +
        'meta-analysis of 12 randomised trials (785 adults) found structured breathwork reduced ' +
        'self-reported stress and anxiety overall.',
      citation:
        'Balban et al. (2023), Cell Reports Medicine 4(1):100895; Fincham et al. (2023), Scientific Reports 13:432',
      url: 'https://www.nature.com/articles/s41598-022-27247-y',
    },
    pacer: {
      cycleSeconds: BOX_CYCLE,
      rounds: roundsFor(BOX_CYCLE, 240),
      phases: [
        { label: 'Breathe in', seconds: 4, action: 'grow' },
        { label: 'Hold', seconds: 4, action: 'hold' },
        { label: 'Breathe out', seconds: 4, action: 'shrink' },
        { label: 'Hold', seconds: 4, action: 'hold' },
      ],
    },
    cautions:
      'If holding your breath makes you light-headed, drop the holds and just breathe in for four, out for four.',
    videos: [
      { id: 'aDLOazk_JVQ', title: 'Box Breathing | 5 Minutes | Guided Breathing for Calm & Focus', channel: 'Recovery.com' },
      { id: 'oN8xV3Kb5-Q', title: '5 Minutes Box Breathing Relaxation Exercise (Beginner Pace)', channel: 'Hands-On Meditation' },
      { id: 'zq07gbFLCAs', title: 'Guided Box Breathing — 5 Minute Meditation (5-5-5-5)', channel: 'Feeling Healing' },
    ],
  },
  {
    id: '4-7-8-breathing',
    name: '4-7-8 breathing',
    aka: 'The relaxing breath',
    family: 'breath',
    tagline: 'A long hold and a longer exhale. Four rounds, no more.',
    accent: 'lavender',
    speed: 'steady',
    bestFor: ['Lying awake', 'Winding down', 'Anger that will not drop'],
    why:
      'The exhale is twice the inhale, which is the part that does the work. The seven-count hold ' +
      'is mostly there to force the ratio — it is very hard to rush an out-breath you have been ' +
      'holding for seven seconds. Weil, who popularised it, is firm that four cycles is the ' +
      'ceiling when you are starting out.',
    evidence: {
      strength: 'mechanism',
      claim:
        'Slow, exhale-weighted breathing at roughly six breaths a minute reliably raises heart ' +
        'rate variability and lowers self-reported arousal. The specific 4-7-8 count is a ' +
        'popularised protocol rather than one with its own randomised trial.',
      citation:
        'Weil, A. — Breathing: The Master Key to Self Healing; Zaccaro et al. (2018), Front Hum Neurosci 12:353',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6137615/',
    },
    pacer: {
      cycleSeconds: 19,
      rounds: 4,
      phases: [
        { label: 'In through your nose', seconds: 4, action: 'grow' },
        { label: 'Hold', seconds: 7, action: 'hold' },
        { label: 'Out through your mouth, lips pursed', seconds: 8, action: 'shrink' },
      ],
    },
    cautions:
      'Four rounds is the whole practice — do not push for more early on. Sit or lie down the ' +
      'first few times; the long hold can make people light-headed.',
    videos: [
      { id: 'YRPh_GaiL8s', title: 'How To Perform the 4-7-8 Breathing Exercise', channel: 'Andrew Weil, M.D.' },
      { id: 'Egr8iGBg8Oc', title: '4-7-8 Breathing: Health Benefits & Demonstration', channel: 'Andrew Weil, M.D.' },
      { id: 'yHsE4z1gba0', title: 'Guided 4-7-8 Breathing for Anxiety | Feel Calm In 5 Minutes', channel: 'Ksenia Love' },
    ],
  },

  // ---------------------------------------------------------------- senses
  {
    id: '5-4-3-2-1',
    name: '5-4-3-2-1',
    aka: 'The five senses countdown',
    family: 'senses',
    tagline: 'Name five things you can see. Then four you can feel.',
    accent: 'amber',
    speed: 'fast',
    bestFor: ['Spiralling thoughts', 'Panic', 'Feeling unreal or far away'],
    why:
      'Anxiety runs on things that are not in the room — what might happen, what someone meant, ' +
      'what you should have said. Naming what is actually here forces attention outward, and ' +
      'counting down gives it a finish line. Say the things out loud if you can.',
    evidence: {
      strength: 'clinical',
      claim:
        'Standard sensory grounding, taught across trauma and anxiety care. A small study in ' +
        'nursing students found the share reporting high test anxiety fell from 23% to 4% after ' +
        'using it — encouraging, but small and uncontrolled.',
      citation: 'Widely taught in CBT and trauma-informed care',
      url: 'https://therapist.com/disorders/anxiety/grounding-techniques-for-anxiety/',
    },
    steps: [
      { label: '5', prompt: 'things you can see', hint: 'Look properly. The scuff on the wall counts.', count: 5, seconds: 40 },
      { label: '4', prompt: 'things you can feel', hint: 'Chair under you, cloth on your arms, air on your face.', count: 4, seconds: 35 },
      { label: '3', prompt: 'things you can hear', hint: 'Go for the quiet ones — a fan, traffic, your own breath.', count: 3, seconds: 30 },
      { label: '2', prompt: 'things you can smell', hint: 'If nothing, name two smells you like.', count: 2, seconds: 25 },
      { label: '1', prompt: 'thing you can taste', hint: 'Or one good thing about today.', count: 1, seconds: 20 },
    ],
    videos: [
      { id: '30VMIEmA114', title: 'The 5-4-3-2-1 Method: A Grounding Exercise to Manage Anxiety', channel: 'The Partnership In Education' },
      { id: 'nSB-gYvPOaQ', title: 'Grounding Techniques to Reduce Anxiety', channel: 'Cleveland Clinic' },
      { id: '8lM8pgMgjEs', title: 'Coping Skill: 5, 4, 3, 2, 1 Grounding Technique', channel: 'Stand4Kind' },
      { id: 'pyaJFJyx5vU', title: 'Explore the 5-4-3-2-1 Grounding Method', channel: 'South Dakota Behavioral Health' },
    ],
  },
  {
    id: 'orienting',
    name: 'Orienting',
    aka: 'Looking around on purpose',
    family: 'senses',
    tagline: 'Turn your head slowly. Let your eyes land where they want.',
    accent: 'sky',
    speed: 'fast',
    bestFor: ['Feeling watched or unsafe', 'After a shock', 'Feeling far away'],
    why:
      'When you are braced for something, your eyes narrow and your head stops moving. Turning ' +
      'slowly and actually letting your gaze rest on things is the opposite signal — it is what ' +
      'a body does when it has already decided the room is fine. Do not force it; you are giving ' +
      'your nervous system time to check, not telling it to relax.',
    evidence: {
      strength: 'clinical',
      claim:
        'A core practice in Somatic Experiencing and other body-based trauma therapies. Taught ' +
        'widely by clinicians; the individual exercise has not been isolated in a trial.',
      citation: 'Levine, P. — Somatic Experiencing; Schwartz, A. — The Complex PTSD Workbook',
      url: 'https://www.youtube.com/watch?v=tS6w03X8d-8',
    },
    steps: [
      { label: 'Slow', prompt: 'Turn your head to the left. Slower than feels natural.', hint: 'Let your eyes go first, then your neck.', seconds: 25 },
      { label: 'Land', prompt: 'Let your gaze stop somewhere. Anywhere. Stay a moment.', hint: 'You are not looking for anything.', seconds: 25 },
      { label: 'Back', prompt: 'Now turn slowly to the right, the same way.', seconds: 25 },
      { label: 'Notice', prompt: 'Name three things in this room that are not a threat.', hint: 'A door. A window. A wall that has been there all day.', count: 3, seconds: 40 },
      { label: 'Check', prompt: 'Did you sigh, swallow, or shift? That is the point of it.', hint: 'Nothing to fix if you did not.', seconds: 35 },
    ],
    videos: [
      { id: 'tS6w03X8d-8', title: 'Orienting Practice: How To Bring Safety To Your Nervous System', channel: 'Rebecca Tolin Mind-Body Coaching' },
      { id: 'LffzIPZUuUg', title: 'Tap into a deep sense of safety — The Robin, with Dr. Arielle Schwartz', channel: 'Therapy in a Nutshell' },
    ],
  },

  // ------------------------------------------------------------------ body
  {
    id: 'feet-on-floor',
    name: 'Feet on the floor',
    aka: 'Anchoring',
    family: 'body',
    tagline: 'Push down. Notice the floor pushing back.',
    accent: 'amber',
    speed: 'fast',
    bestFor: ['In a lecture', 'On a bus', 'Anywhere you cannot be seen doing it'],
    why:
      'The most portable one here — nobody can tell you are doing it. Pressure through the soles ' +
      'of your feet is a strong, unambiguous signal from the edge of your body, and attention ' +
      'goes to strong signals. It also quietly answers the question a panicking body is asking, ' +
      'which is roughly "where am I".',
    evidence: {
      strength: 'clinical',
      claim:
        'Standard grounding instruction across anxiety and trauma care. Effectiveness is reported ' +
        'at the level of grounding as a category, not this exercise alone.',
      citation: 'Taught in DBT distress tolerance and trauma-informed care',
      url: 'https://therapist.com/disorders/anxiety/grounding-techniques-for-anxiety/',
    },
    steps: [
      { label: 'Plant', prompt: 'Both feet flat. Push down through your heels.', hint: 'Shoes on is fine.', seconds: 20 },
      { label: 'Press', prompt: 'Press harder. Hold it for a slow count of five.', seconds: 20 },
      { label: 'Release', prompt: 'Let go all at once. Notice the difference.', seconds: 20 },
      { label: 'Weight', prompt: 'Feel the chair or the ground taking your whole weight.', hint: 'It has been doing that the entire time.', seconds: 30 },
      { label: 'Say it', prompt: 'Say your name, where you are, and what day it is.', hint: 'Out loud if you can. Quietly is fine.', seconds: 30 },
    ],
    videos: [
      { id: 'dSWT33VaZHg', title: 'Grounding Exercise: Press Your Feet Into the Ground', channel: 'April Linville' },
      { id: 'Txbun5WbDBg', title: 'Meditation — Feet on the Floor | Grounding Technique', channel: 'Wellbeing Therapy Solutions' },
      { id: 'dd45b53yeuQ', title: 'Ground Through the Feet — A Simple Grounding Practice', channel: 'GROUNDED&NOURISHED' },
    ],
  },
  {
    id: 'butterfly-hug',
    name: 'Butterfly hug',
    aka: 'Bilateral tapping',
    family: 'body',
    tagline: 'Arms crossed. Tap left, tap right, slowly.',
    accent: 'rose',
    speed: 'steady',
    bestFor: ['Crying and cannot stop', 'Overwhelm', 'Comfort when nobody is around'],
    why:
      'Cross your arms over your chest, hands on opposite shoulders, and tap alternately — slow, ' +
      'about one tap a second. It is two things at once: steady left-right input, and the posture ' +
      'of being held. It was developed for hurricane survivors in Mexico in 1998 and spread ' +
      'because it works on people who cannot manage anything more complicated.',
    evidence: {
      strength: 'clinical',
      claim:
        'Developed by Artigas and Jarero for group trauma work and adopted into EMDR practice. ' +
        'Alternating bilateral stimulation shows measurable prefrontal changes consistent with ' +
        'reduced arousal, though the butterfly hug specifically is not separately trialled.',
      citation: 'Artigas & Jarero (2014), in Implementing EMDR Early Mental Health Interventions',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5061320/',
    },
    pacer: {
      cycleSeconds: BUTTERFLY_CYCLE,
      rounds: roundsFor(BUTTERFLY_CYCLE, 120),
      phases: [
        { label: 'Left', seconds: 1, action: 'left' },
        { label: 'Right', seconds: 1, action: 'right' },
        { label: 'Left', seconds: 1, action: 'left' },
        { label: 'Right', seconds: 1, action: 'right' },
      ],
    },
    videos: [
      { id: 'RurqWg2Bcuo', title: 'Mindful Practice: Butterfly Hug', channel: 'Cork Kerry Community Healthcare' },
      { id: 'KKJ7PNOzsHU', title: 'The Butterfly Hug: Stress Reduction Technique', channel: 'Healbright' },
      { id: '2p5RG3gXRgM', title: 'Regulate Your Nervous System with The Butterfly Hug', channel: 're-origin' },
      { id: 'm8k5qjCaMj8', title: 'The Butterfly Hug Method — for trauma, anxiety or hyper-arousal', channel: 'Dr Kelly Watkins' },
    ],
  },
  {
    id: 'progressive-muscle-relaxation',
    name: 'Muscle release',
    aka: 'Progressive muscle relaxation',
    family: 'body',
    tagline: 'Tense it hard. Let it go. Work up the body.',
    accent: 'teal',
    speed: 'deep',
    bestFor: ['Jaw and shoulders that will not drop', 'Before sleep', 'Stress you are carrying physically'],
    why:
      'You cannot relax a muscle you cannot feel, and after a long day you genuinely cannot feel ' +
      'your own shoulders. Squeezing hard first makes the letting-go obvious. Tense for about ' +
      'five seconds, release for ten, and pay more attention to the release than the squeeze.',
    evidence: {
      strength: 'trial',
      claim:
        'One of the most-studied relaxation methods there is, with decades of randomised trials ' +
        'showing reductions in anxiety and improvements in sleep quality. It is the final P in ' +
        'the DBT distress-tolerance TIPP skill.',
      citation: 'Jacobson (1938); Manzoni et al. (2008), BMC Psychiatry 8:41',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2427027/',
    },
    steps: [
      { label: 'Hands', prompt: 'Make fists. Squeeze hard — five seconds.', hint: 'Then drop them completely.', seconds: 30 },
      { label: 'Arms', prompt: 'Pull your forearms up toward your shoulders. Tense.', seconds: 30 },
      { label: 'Shoulders', prompt: 'Lift both shoulders toward your ears. Hold.', hint: 'This is where most of it lives.', seconds: 35 },
      { label: 'Face', prompt: 'Scrunch your whole face. Eyes, jaw, forehead.', hint: 'It looks ridiculous. Nobody is watching.', seconds: 30 },
      { label: 'Chest', prompt: 'Breathe in and hold it. Tense your chest and stomach.', seconds: 30 },
      { label: 'Legs', prompt: 'Straighten your legs, point your toes, tense your thighs.', seconds: 35 },
      { label: 'Feet', prompt: 'Curl your toes under, hard. Then let go.', seconds: 30 },
      { label: 'All of it', prompt: 'Sit still. Notice which parts are heavier than before.', hint: 'No need to do anything about the ones that are not.', seconds: 60 },
    ],
    cautions: 'Skip any group that is injured or painful — go around it rather than through it.',
    videos: [
      { id: '8pT_gHcgPd8', title: '5 Minutes Progressive Muscle Relaxation Meditation', channel: 'Happier TV' },
      { id: 'utGa6rqzs3g', title: 'Mindful Breathing: Progressive Muscle Relaxation', channel: 'American Lung Association' },
    ],
  },
  {
    id: 'body-scan',
    name: 'Body scan',
    family: 'body',
    tagline: 'Head to toe. Notice, do not fix.',
    accent: 'lavender',
    speed: 'deep',
    bestFor: ['Winding down', 'Living entirely in your head', 'Trouble falling asleep'],
    why:
      'Unlike the muscle release, you change nothing here — you just visit each part of yourself ' +
      'and report what is there. That distinction is the practice. Most of the benefit is in ' +
      'noticing a sensation without immediately deciding what to do about it.',
    evidence: {
      strength: 'trial',
      claim:
        'A core component of Mindfulness-Based Stress Reduction, which has been through many ' +
        'randomised trials showing moderate reductions in anxiety and stress. Most trials test ' +
        'the eight-week programme rather than the scan alone.',
      citation: 'Kabat-Zinn (1982); Khoury et al. (2015), J Psychosom Res 78(6):519-28',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25818837/',
    },
    steps: [
      { label: 'Settle', prompt: 'Lie down or sit back. Let your eyes close if that is alright.', seconds: 40 },
      { label: 'Feet', prompt: 'Start at your feet. Warm, cold, tight, nothing at all?', hint: '"Nothing" is a real answer.', seconds: 45 },
      { label: 'Legs', prompt: 'Move up through your calves, knees, thighs.', seconds: 45 },
      { label: 'Middle', prompt: 'Hips, lower back, stomach. Let the stomach be soft.', seconds: 45 },
      { label: 'Chest', prompt: 'Ribs rising and falling. Do not change the breath.', seconds: 45 },
      { label: 'Arms', prompt: 'Shoulders, down the arms, into the hands and fingers.', seconds: 45 },
      { label: 'Head', prompt: 'Neck, jaw, around the eyes, scalp.', hint: 'Jaw first. It is always the jaw.', seconds: 45 },
      { label: 'Whole', prompt: 'Now the whole body at once, breathing, where it is.', seconds: 50 },
    ],
    videos: [
      { id: 'uqtIqCKjkuc', title: '10-Minute Body Scan Meditation', channel: 'Jess Yoga' },
      { id: 'v87BX0bJK8Y', title: 'NSDR Non Sleep Deep Rest | 10 Minute Yoga Nidra', channel: 'Yoga With Tim' },
    ],
  },
  {
    id: 'temperature',
    name: 'Cold water',
    aka: 'TIPP — tip the temperature',
    family: 'body',
    tagline: 'Cold on your face. Thirty seconds. It is almost unfair how fast it works.',
    accent: 'sky',
    speed: 'fast',
    bestFor: ['Full panic', 'Rage', 'When nothing else is landing'],
    why:
      'Cold water on the face — especially around the eyes and upper cheeks, while holding your ' +
      'breath — triggers the mammalian dive reflex: heart rate drops, blood moves to the core. ' +
      'It is a reflex, not a mood, which is why it still works when you are too far gone to ' +
      'concentrate on breathing. This is the emergency one.',
    evidence: {
      strength: 'clinical',
      claim:
        'The T in DBT’s TIPP distress-tolerance skill. The dive reflex itself is well-established ' +
        'physiology; DBT as a whole has strong trial support, though the temperature skill has ' +
        'not been isolated in its own trial.',
      citation: 'Linehan, M. — DBT Skills Training Manual (2nd ed., 2015)',
      url: 'https://www.youtube.com/watch?v=G8jJAvLEbiw',
    },
    steps: [
      { label: 'Get it', prompt: 'Cold water in a basin, or a cold pack, or a bottle from the fridge.', hint: 'Cold, not painful. No ice directly on skin.', seconds: 25 },
      { label: 'Breathe', prompt: 'Take a breath and hold it.', seconds: 10 },
      { label: 'Dip', prompt: 'Cold on your face — eyes and upper cheeks. Hold about 30 seconds.', hint: 'Bend forward over the basin, or press the pack there.', seconds: 35 },
      { label: 'Up', prompt: 'Come up. Breathe normally. Wait for it to land.', hint: 'Usually about twenty seconds.', seconds: 20 },
    ],
    cautions:
      'Do not use this if you have a heart condition, an eating disorder, low blood pressure, or take a beta ' +
      'blocker — the dive reflex slows the heart, which is exactly the problem in those cases. Ask a doctor first.',
    videos: [
      { id: 'G8jJAvLEbiw', title: 'How to Calm Down Fast with TIPP: "Tip Your Temperature"', channel: 'Dr. Kiki Fehling' },
      { id: 'Ku_s8hJRyyQ', title: 'The 30-Second Trick That Stops Panic Fast', channel: 'Doctor Ali Mattu' },
      { id: 'ZVHtjDgc_XU', title: 'Tip the Temperature: TIP DBT Skill', channel: 'DBT Skills from Experts' },
    ],
  },

  // ------------------------------------------------------------------ mind
  {
    id: 'mental-grounding',
    name: 'Give your brain a job',
    aka: 'Cognitive grounding',
    family: 'mind',
    tagline: 'Count backwards from 100 by sevens. Try to worry at the same time.',
    accent: 'amber',
    speed: 'fast',
    bestFor: ['Rumination', 'The same thought on a loop', 'Trying to sleep'],
    why:
      'Working memory is small and you only get one. A task that is genuinely a bit hard — not ' +
      'boring, actually hard — occupies the same space the loop is running in. The point is not ' +
      'to get the answers right. Getting them slightly wrong works just as well.',
    evidence: {
      strength: 'clinical',
      claim:
        'Distraction and cognitive grounding are standard DBT distress-tolerance skills. The ' +
        'underlying working-memory competition is well established; the specific exercises are ' +
        'taught practice rather than individually trialled.',
      citation: 'Linehan, M. — DBT Skills Training Manual (2nd ed., 2015)',
      url: 'https://www.youtube.com/watch?v=OoOtJV6NJUE',
    },
    steps: [
      { label: '−7', prompt: '100, 93, 86… keep going, out loud.', hint: 'If you lose your place, start again from 100.', seconds: 45 },
      { label: 'A–Z', prompt: 'A city for every letter. A, B, C…', hint: 'Stuck on X? Skip it. Nobody is marking this.', seconds: 45 },
      { label: '10', prompt: 'Name ten things that are blue.', count: 10, seconds: 40 },
      { label: 'Route', prompt: 'Walk yourself through getting home. Every turn.', hint: 'Which side is the shop on?', seconds: 50 },
    ],
    videos: [
      { id: '6lc72fOv57g', title: 'Counting Backwards Distraction Technique', channel: 'The Unstuck Initiative' },
      { id: 'OoOtJV6NJUE', title: 'Distress Tolerance: DBT Grounding and Distraction Techniques', channel: 'Psychotherapy Academy' },
      { id: 'NNYHFp33nuE', title: 'Grounding Techniques for Anxiety: 11 Practices to Try', channel: 'Priory' },
    ],
  },

  // -------------------------------------------------------------- kindness
  {
    id: 'self-compassion-break',
    name: 'Self-compassion break',
    family: 'kindness',
    tagline: 'Three sentences you would say to a friend, said to yourself.',
    accent: 'rose',
    speed: 'steady',
    bestFor: ['After a mistake', 'Shame', 'Being hard on yourself'],
    why:
      'Three moves, in order: name that this hurts, remember that suffering is not a personal ' +
      'defect, then say something kind. Most people manage the first two and stall on the third. ' +
      'If it feels fake, that is normal and it still counts — you are practising a different ' +
      'reflex, not performing a feeling.',
    evidence: {
      strength: 'trial',
      claim:
        'The core practice of Mindful Self-Compassion, an eight-week programme tested in a ' +
        'randomised controlled trial showing significant gains in self-compassion and reductions ' +
        'in depression and anxiety, sustained at one year.',
      citation: 'Neff & Germer (2013), J Clin Psychol 69(1):28-44',
      url: 'https://self-compassion.org/',
    },
    steps: [
      { label: 'Ouch', prompt: 'Say: "This is a moment of suffering." Or just: "This really hurts."', hint: 'Use your own words. Yours will land better.', seconds: 45 },
      { label: 'Human', prompt: 'Say: "Other people feel this too. I am not the only one."', hint: 'Someone within a hundred metres of you feels something like it right now.', seconds: 45 },
      { label: 'Kind', prompt: 'Hand on your heart. Say: "May I be kind to myself."', hint: 'Or: what would you say to your best friend in this exact situation?', seconds: 50 },
      { label: 'Stay', prompt: 'Leave your hand there. Feel the warmth and the weight of it.', seconds: 40 },
    ],
    videos: [
      { id: 'A7tfP1WH3_I', title: 'General Self-Compassion Break', channel: 'Dr. Kristin Neff' },
      { id: 'L2VN16WP8SQ', title: '5-Minute Self-Compassion Meditation', channel: 'FitMind' },
      { id: 'q2ek0Uv70YE', title: 'Take a Self-Compassion Break', channel: 'Mindful' },
      { id: 't24v0CtNSkA', title: 'Soften, Soothe, Allow', channel: 'Dr. Kristin Neff' },
    ],
  },

  // ------------------------------------------------------------------ rest
  {
    id: 'nsdr',
    name: 'Deep rest',
    aka: 'NSDR / yoga nidra',
    family: 'rest',
    tagline: 'Lying still, deliberately, in a way that is not sleep and not nothing.',
    accent: 'lavender',
    speed: 'deep',
    bestFor: ['Wrecked but wired', 'Bad night before', 'The gap between studying and sleeping'],
    why:
      'Non-sleep deep rest is a guided body scan you do lying down, deliberately staying just the ' +
      'right side of awake. Unlike a nap it does not leave you groggy, and unlike scrolling it ' +
      'actually returns something. Best done with audio — this one is a listen, not a read.',
    evidence: {
      strength: 'trial',
      claim:
        'Yoga nidra has randomised trials showing improved sleep quality and reduced anxiety, ' +
        'though the studies are generally small. "NSDR" is a recent relabelling of the same practice.',
      citation: 'Datta et al. (2021), Sleep Vigil 5:107-114; Moszeik et al. (2020), Curr Psychol',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34608422/',
    },
    steps: [
      { label: 'Lie down', prompt: 'Flat on your back if you can. Phone face down.', hint: 'Somewhere you will not be interrupted for twenty minutes.', seconds: 40 },
      { label: 'Press play', prompt: 'Start one of the guided recordings below and follow the voice.', hint: 'The app cannot do this part — it needs someone talking.', seconds: 30 },
      { label: 'Stay awake', prompt: 'If you drift off, that is fine. Aim to stay just awake.', seconds: 30 },
    ],
    videos: [
      { id: 'YrubXRXwxJc', title: 'NSDR | 10 Minutes Non Sleep Deep Rest', channel: 'Mindset Factory' },
      { id: 'AKGrmY8OSHM', title: 'NSDR (Non-Sleep Deep Rest) with Dr. Andrew Huberman', channel: 'Virtusan' },
      { id: 'YLq2Xiet330', title: '10 Minute Yoga Nidra | Non Sleep Deep Rest', channel: '3xOM Yoga' },
      { id: 'fV08JOq7j6s', title: 'Vagus Nerve Meditation | NSDR Yoga Nidra | 10 minutes', channel: 'Body Illumination Yoga & Pilates' },
    ],
  },
];

export const TECHNIQUE_IDS = TECHNIQUES.map((t) => t.id);

export function getTechnique(id) {
  return TECHNIQUES.find((t) => t.id === id) || null;
}

// Total run time the UI promises, computed rather than declared, so a card can
// never advertise four minutes for a practice that runs six.
export function runSeconds(technique) {
  if (technique.pacer) return technique.pacer.cycleSeconds * technique.pacer.rounds;
  return technique.steps.reduce((total, s) => total + s.seconds, 0);
}

// The card list. Everything a browsing resident needs and nothing they don't —
// the step scripts are a separate fetch, so the catalog stays small.
export function catalog() {
  return TECHNIQUES.map((t) => ({
    id: t.id,
    name: t.name,
    aka: t.aka || null,
    family: t.family,
    tagline: t.tagline,
    accent: t.accent,
    speed: t.speed,
    bestFor: t.bestFor,
    seconds: runSeconds(t),
    mode: t.pacer ? 'pacer' : 'steps',
    evidenceStrength: t.evidence.strength,
    videoCount: t.videos.length,
    hasCautions: Boolean(t.cautions),
  }));
}

export function techniqueDetail(technique) {
  return {
    id: technique.id,
    name: technique.name,
    aka: technique.aka || null,
    family: technique.family,
    tagline: technique.tagline,
    accent: technique.accent,
    speed: technique.speed,
    bestFor: technique.bestFor,
    seconds: runSeconds(technique),
    mode: technique.pacer ? 'pacer' : 'steps',
    why: technique.why,
    evidence: technique.evidence,
    cautions: technique.cautions || null,
    pacer: technique.pacer || null,
    steps: technique.steps || null,
    videos: technique.videos,
  };
}

// Suggestions, not a recommendation engine. A resident says how they feel in
// one word and gets back the practices tagged for it — nothing is inferred
// from their check-ins, scores or history, deliberately. A grounding exercise
// chosen for you by a heuristic is a worse experience than choosing your own.
export const MOODS = [
  { id: 'panic', label: 'Panicking', techniques: ['temperature', 'cyclic-sighing', '5-4-3-2-1'] },
  { id: 'anxious', label: 'Anxious', techniques: ['cyclic-sighing', '5-4-3-2-1', 'box-breathing'] },
  { id: 'spiralling', label: 'Spiralling', techniques: ['mental-grounding', '5-4-3-2-1', 'feet-on-floor'] },
  { id: 'angry', label: 'Angry', techniques: ['temperature', '4-7-8-breathing', 'progressive-muscle-relaxation'] },
  { id: 'numb', label: 'Numb or far away', techniques: ['orienting', 'feet-on-floor', '5-4-3-2-1'] },
  { id: 'sad', label: 'Sad', techniques: ['self-compassion-break', 'butterfly-hug', 'body-scan'] },
  { id: 'ashamed', label: 'Hard on myself', techniques: ['self-compassion-break', 'butterfly-hug'] },
  { id: 'wired', label: 'Tired but wired', techniques: ['nsdr', 'progressive-muscle-relaxation', '4-7-8-breathing'] },
  { id: 'sleepless', label: 'Cannot sleep', techniques: ['4-7-8-breathing', 'body-scan', 'mental-grounding'] },
  { id: 'exam', label: 'Exam in an hour', techniques: ['box-breathing', 'cyclic-sighing', 'feet-on-floor'] },
];

export function suggestFor(moodId) {
  const mood = MOODS.find((m) => m.id === moodId);
  if (!mood) return [];
  return mood.techniques.map((id) => getTechnique(id)).filter(Boolean);
}
