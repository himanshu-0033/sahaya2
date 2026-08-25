// The assessment battery.
//
// Every instrument here is one that can be self-administered and scored by a
// fixed rule — which is why the inkblot reflection is NOT in this file: it
// has no scoring key and deliberately never gets one.
//
// Three things to know before adding to this list:
//
//   1. LICENSING IS NOT UNIFORM. Each entry carries a `license` field. Most
//      of these are free to reproduce; PSS-10 is free for research and
//      teaching but its author's permission is needed for commercial use,
//      and instruments like the MBI-SS (student burnout) are deliberately
//      absent because they are licensed per-administration through Mind
//      Garden and cannot legally be embedded here.
//   2. WORDING MATTERS. A validated scale is only validated at its published
//      wording. Entries with `wordingVerified: false` are faithful but were
//      written from memory, not transcribed from the source document — check
//      them against the citation before this is used with real students.
//   3. A SCORE IS NOT A DIAGNOSIS. `bands` exist to say what a range is
//      conventionally called, not to tell a resident what they have.
//
// PHQ-9 item 9 asks about self-harm. It is marked with `crisisItem` and the
// API routes a positive answer into the same crisis path as the inkblot
// free-text, rather than just filing a number.
//
// An instrument may also carry a `followUp`: a question printed on the source
// form that is deliberately NOT part of the total. The PHQ-9 sheet ends by
// asking how difficult the symptoms have made work, home and other people —
// two people can reach 14 with one of them still working and the other unable
// to leave a room, and the sum cannot tell them apart. It is stored beside the
// score, never added to it, and `condition: 'anyEndorsed'` reproduces the
// form's own "If you checked off any problems" gate.

// Shared answer scales, so instruments that share one stay literally identical.
export const SCALES = {
  phq: {
    id: 'phq',
    prompt: 'Over the last 2 weeks, how often have you been bothered by the following?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  k10: {
    id: 'k10',
    prompt: 'In the past 4 weeks, about how often did you feel…',
    options: [
      { value: 1, label: 'None of the time' },
      { value: 2, label: 'A little of the time' },
      { value: 3, label: 'Some of the time' },
      { value: 4, label: 'Most of the time' },
      { value: 5, label: 'All of the time' },
    ],
  },
  who5: {
    id: 'who5',
    prompt: 'Over the last 2 weeks…',
    options: [
      { value: 0, label: 'At no time' },
      { value: 1, label: 'Some of the time' },
      { value: 2, label: 'Less than half the time' },
      { value: 3, label: 'More than half the time' },
      { value: 4, label: 'Most of the time' },
      { value: 5, label: 'All of the time' },
    ],
  },
  pss: {
    id: 'pss',
    prompt: 'In the last month, how often have you…',
    options: [
      { value: 0, label: 'Never' },
      { value: 1, label: 'Almost never' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Fairly often' },
      { value: 4, label: 'Very often' },
    ],
  },
  ucla3: {
    id: 'ucla3',
    prompt: 'How often do you feel…',
    options: [
      { value: 1, label: 'Hardly ever' },
      { value: 2, label: 'Some of the time' },
      { value: 3, label: 'Often' },
    ],
  },
  mspss: {
    id: 'mspss',
    higherIsBetter: true,
    prompt: 'How strongly do you agree?',
    options: [
      { value: 1, label: 'Very strongly disagree' },
      { value: 2, label: 'Strongly disagree' },
      { value: 3, label: 'Mildly disagree' },
      { value: 4, label: 'Neutral' },
      { value: 5, label: 'Mildly agree' },
      { value: 6, label: 'Strongly agree' },
      { value: 7, label: 'Very strongly agree' },
    ],
  },
  spin: {
    id: 'spin',
    prompt: 'How much has this bothered you in the past week?',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'A little bit' },
      { value: 2, label: 'Somewhat' },
      { value: 3, label: 'Very much' },
      { value: 4, label: 'Extremely' },
    ],
  },
  agree4: {
    id: 'agree4',
    prompt: 'How strongly do you agree?',
    options: [
      { value: 0, label: 'Strongly disagree' },
      { value: 1, label: 'Disagree' },
      { value: 2, label: 'Agree' },
      { value: 3, label: 'Strongly agree' },
    ],
  },
  agree5: {
    id: 'agree5',
    prompt: 'How strongly do you agree?',
    options: [
      { value: 1, label: 'Strongly disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly agree' },
    ],
  },
  gse: {
    id: 'gse',
    prompt: 'How true is this of you?',
    options: [
      { value: 1, label: 'Not at all true' },
      { value: 2, label: 'Hardly true' },
      { value: 3, label: 'Moderately true' },
      { value: 4, label: 'Exactly true' },
    ],
  },
  agree7: {
    id: 'agree7',
    prompt: 'How strongly do you agree?',
    options: [
      { value: 1, label: 'Strongly disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Slightly disagree' },
      { value: 4, label: 'Mixed' },
      { value: 5, label: 'Slightly agree' },
      { value: 6, label: 'Agree' },
      { value: 7, label: 'Strongly agree' },
    ],
  },
  cbi: {
    id: 'cbi',
    prompt: 'How often does this apply to you?',
    options: [
      { value: 0, label: 'Never / almost never' },
      { value: 1, label: 'Seldom' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Always' },
    ],
  },
  ais: {
    id: 'ais',
    prompt: 'For the past month, at least three times a week…',
    options: [
      { value: 0, label: 'No problem' },
      { value: 1, label: 'Slight problem' },
      { value: 2, label: 'Marked problem' },
      { value: 3, label: 'Very serious problem' },
    ],
  },
  sas: {
    id: 'sas',
    prompt: 'How strongly do you agree?',
    options: [
      { value: 1, label: 'Strongly disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Weakly disagree' },
      { value: 4, label: 'Weakly agree' },
      { value: 5, label: 'Agree' },
      { value: 6, label: 'Strongly agree' },
    ],
  },
  phq15: {
    id: 'phq15',
    prompt: 'Over the last 4 weeks, how much have you been bothered by…',
    options: [
      { value: 0, label: 'Not bothered at all' },
      { value: 1, label: 'Bothered a little' },
      { value: 2, label: 'Bothered a lot' },
    ],
  },
  // Two separate yes/no scales rather than one shared one: the prompt lives on
  // the scale, and these two instruments ask their yes/no questions about very
  // different things. Sharing the scale would mean sharing the wrong preamble.
  ptsd5: {
    id: 'ptsd5',
    prompt:
      'Sometimes things happen that are extremely frightening, horrible or upsetting. If something like that has happened to you, in the past month have you…',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  scoff: {
    id: 'scoff',
    prompt: 'Answer yes or no.',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  bsmas: {
    id: 'bsmas',
    prompt: 'Over the past year, how often have you…',
    options: [
      { value: 1, label: 'Very rarely' },
      { value: 2, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 4, label: 'Often' },
      { value: 5, label: 'Very often' },
    ],
  },
  scs: {
    id: 'scs',
    higherIsBetter: true,
    prompt: 'How often do you behave in this way?',
    options: [
      { value: 1, label: 'Almost never' },
      { value: 2, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 4, label: 'Often' },
      { value: 5, label: 'Almost always' },
    ],
  },
};

// `transform` turns the raw item sum into the instrument's reported score:
//   sum   — report the sum as is (default)
//   mean  — average across items (MSPSS, BRS)
//   x4    — WHO-5's 0–25 becomes 0–100
//   x25   — CBI's 0–4 mean becomes 0–100
export const INSTRUMENTS = [
  {
    id: 'phq-9',
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    domain: 'Mood',
    blurb: 'Depression symptoms over the last two weeks.',
    minutes: 3,
    scale: 'phq',
    license: 'Public domain (Pfizer released the PHQ family for free use)',
    citation: 'Kroenke, Spitzer & Williams (2001), J Gen Intern Med 16(9):606-13',
    wordingVerified: true,
    crisisItem: 8,
    items: [
      { text: 'Little interest or pleasure in doing things' },
      { text: 'Feeling down, depressed, or hopeless' },
      { text: 'Trouble falling or staying asleep, or sleeping too much' },
      { text: 'Feeling tired or having little energy' },
      { text: 'Poor appetite or overeating' },
      { text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
      { text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { text: 'Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual' },
      { text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
    ],
    followUp: {
      id: 'difficulty',
      condition: 'anyEndorsed',
      text: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
      note: 'This one is not part of the score. It is on the form because the same total can mean very different days.',
      options: [
        { value: 0, label: 'Not difficult at all' },
        { value: 1, label: 'Somewhat difficult' },
        { value: 2, label: 'Very difficult' },
        { value: 3, label: 'Extremely difficult' },
      ],
    },
    bands: [
      { max: 4, label: 'Minimal', note: 'Few or no depression symptoms reported.' },
      { max: 9, label: 'Mild', note: 'Some symptoms. Worth watching over the next few weeks.' },
      { max: 14, label: 'Moderate', note: 'Symptoms that usually warrant a conversation with a counsellor.' },
      { max: 19, label: 'Moderately severe', note: 'A level at which professional support is normally recommended.' },
      { max: 27, label: 'Severe', note: 'Please speak to a counsellor or doctor about this.' },
    ],
  },
  {
    id: 'gad-7',
    name: 'GAD-7',
    fullName: 'Generalised Anxiety Disorder-7',
    domain: 'Anxiety',
    blurb: 'Anxiety symptoms over the last two weeks.',
    minutes: 2,
    scale: 'phq',
    license: 'Public domain (Pfizer released the PHQ family for free use)',
    citation: 'Spitzer, Kroenke, Williams & Löwe (2006), Arch Intern Med 166(10):1092-7',
    wordingVerified: true,
    items: [
      { text: 'Feeling nervous, anxious, or on edge' },
      { text: 'Not being able to stop or control worrying' },
      { text: 'Worrying too much about different things' },
      { text: 'Trouble relaxing' },
      { text: 'Being so restless that it is hard to sit still' },
      { text: 'Becoming easily annoyed or irritable' },
      { text: 'Feeling afraid, as if something awful might happen' },
    ],
    bands: [
      { max: 4, label: 'Minimal', note: 'Little anxiety reported.' },
      { max: 9, label: 'Mild', note: 'Some anxiety. Often manageable with routine and rest.' },
      { max: 14, label: 'Moderate', note: 'Worth talking through with a counsellor.' },
      { max: 21, label: 'Severe', note: 'A level at which professional support is normally recommended.' },
    ],
  },
  {
    id: 'k10',
    name: 'K10',
    fullName: 'Kessler Psychological Distress Scale',
    domain: 'General distress',
    blurb: 'Overall psychological distress in the past month.',
    minutes: 3,
    scale: 'k10',
    license: 'Free to use (Kessler & Mroczek; widely reproduced in public health)',
    citation: 'Kessler et al. (2002), Psychol Med 32(6):959-76',
    wordingVerified: true,
    items: [
      { text: '…tired out for no good reason?' },
      { text: '…nervous?' },
      { text: '…so nervous that nothing could calm you down?' },
      { text: '…hopeless?' },
      { text: '…restless or fidgety?' },
      { text: '…so restless that you could not sit still?' },
      { text: '…depressed?' },
      { text: '…that everything was an effort?' },
      { text: '…so sad that nothing could cheer you up?' },
      { text: '…worthless?' },
    ],
    bands: [
      { max: 19, label: 'Low distress', note: 'In the range most people report.' },
      { max: 24, label: 'Moderate distress', note: 'Higher than typical. Worth keeping an eye on.' },
      { max: 29, label: 'High distress', note: 'Worth talking through with a counsellor.' },
      { max: 50, label: 'Very high distress', note: 'A level at which professional support is normally recommended.' },
    ],
  },
  {
    id: 'who-5',
    higherIsBetter: true,
    name: 'WHO-5',
    fullName: 'WHO-5 Well-Being Index',
    domain: 'Wellbeing',
    blurb: 'How well the last two weeks have actually felt.',
    minutes: 1,
    scale: 'who5',
    license: 'Free to use with attribution (WHO Collaborating Centre, Denmark)',
    citation: 'Topp et al. (2015), Psychother Psychosom 84(3):167-76',
    wordingVerified: true,
    transform: 'x4',
    items: [
      { text: 'I have felt cheerful and in good spirits' },
      { text: 'I have felt calm and relaxed' },
      { text: 'I have felt active and vigorous' },
      { text: 'I woke up feeling fresh and rested' },
      { text: 'My daily life has been filled with things that interest me' },
    ],
    bands: [
      { max: 28, label: 'Low wellbeing', note: 'A score at or below 28 is the usual cue to screen for depression.' },
      { max: 50, label: 'Below average', note: 'Lower than typical. Small daily changes tend to move this most.' },
      { max: 75, label: 'Moderate', note: 'A fairly ordinary fortnight.' },
      { max: 100, label: 'Good', note: 'A good stretch — worth noticing what helped.' },
    ],
  },
  {
    id: 'pss-10',
    name: 'PSS-10',
    fullName: 'Perceived Stress Scale',
    domain: 'Stress',
    blurb: 'How unpredictable and overloaded the last month has felt.',
    minutes: 3,
    scale: 'pss',
    license: 'Free for research and teaching; commercial use needs the author’s permission',
    citation: 'Cohen, Kamarck & Mermelstein (1983), J Health Soc Behav 24(4):385-96',
    wordingVerified: true,
    items: [
      { text: '…been upset because of something that happened unexpectedly?' },
      { text: '…felt that you were unable to control the important things in your life?' },
      { text: '…felt nervous and stressed?' },
      { text: '…felt confident about your ability to handle your personal problems?', reverse: true },
      { text: '…felt that things were going your way?', reverse: true },
      { text: '…found that you could not cope with all the things that you had to do?' },
      { text: '…been able to control irritations in your life?', reverse: true },
      { text: '…felt that you were on top of things?', reverse: true },
      { text: '…been angered because of things that were outside of your control?' },
      { text: '…felt difficulties were piling up so high that you could not overcome them?' },
    ],
    bands: [
      { max: 13, label: 'Low stress', note: 'Within the range most people report.' },
      { max: 26, label: 'Moderate stress', note: 'A normal load, but one worth managing deliberately.' },
      { max: 40, label: 'High stress', note: 'A heavy month. Worth talking about what could come off the pile.' },
    ],
  },
  {
    id: 'ucla-3',
    name: 'UCLA-3',
    fullName: 'Three-Item Loneliness Scale',
    domain: 'Social',
    blurb: 'How connected you feel to the people around you.',
    minutes: 1,
    scale: 'ucla3',
    license: 'Free to use',
    citation: 'Hughes, Waite, Hawkley & Cacioppo (2004), Res Aging 26(6):655-72',
    wordingVerified: true,
    items: [
      { text: '…that you lack companionship?' },
      { text: '…left out?' },
      { text: '…isolated from others?' },
    ],
    bands: [
      { max: 5, label: 'Not lonely', note: 'Connection looks steady.' },
      { max: 9, label: 'Lonely', note: 'A score of 6 or more is the usual cut-off for loneliness.' },
    ],
  },
  {
    id: 'mspss',
    name: 'MSPSS',
    fullName: 'Multidimensional Scale of Perceived Social Support',
    domain: 'Social',
    blurb: 'Support you feel you have from family, friends, and someone special.',
    minutes: 3,
    scale: 'mspss',
    license: 'Free to use',
    citation: 'Zimet, Dahlem, Zimet & Farley (1988), J Pers Assess 52(1):30-41',
    wordingVerified: true,
    transform: 'mean',
    // The published three-factor structure. Item numbers are 0-indexed here.
    subscales: [
      { label: 'Significant other', items: [0, 1, 4, 9] },
      { label: 'Family', items: [2, 3, 7, 10] },
      { label: 'Friends', items: [5, 6, 8, 11] },
    ],
    items: [
      { text: 'There is a special person who is around when I am in need' },
      { text: 'There is a special person with whom I can share my joys and sorrows' },
      { text: 'My family really tries to help me' },
      { text: 'I get the emotional help and support I need from my family' },
      { text: 'I have a special person who is a real source of comfort to me' },
      { text: 'My friends really try to help me' },
      { text: 'I can count on my friends when things go wrong' },
      { text: 'I can talk about my problems with my family' },
      { text: 'I have friends with whom I can share my joys and sorrows' },
      { text: 'There is a special person in my life who cares about my feelings' },
      { text: 'My family is willing to help me make decisions' },
      { text: 'I can talk about my problems with my friends' },
    ],
    bands: [
      { max: 2.9, label: 'Low support', note: 'Few people feel available to you right now.' },
      { max: 5.0, label: 'Moderate support', note: 'Some support, with room to widen it.' },
      { max: 7, label: 'High support', note: 'You have people you can reach.' },
    ],
  },
  {
    id: 'mini-spin',
    name: 'Mini-SPIN',
    fullName: 'Mini Social Phobia Inventory',
    domain: 'Social',
    blurb: 'A three-question screen for social anxiety.',
    minutes: 1,
    scale: 'spin',
    license: 'Free to use',
    citation: 'Connor, Kobak, Churchill, Katzelnick & Davidson (2001), Depress Anxiety 14(2):137-40',
    wordingVerified: true,
    items: [
      { text: 'Fear of embarrassment causes me to avoid doing things or speaking to people' },
      { text: 'I avoid activities in which I am the centre of attention' },
      { text: 'Being embarrassed or looking stupid are among my worst fears' },
    ],
    bands: [
      { max: 5, label: 'Below screen cut-off', note: 'Social anxiety unlikely on this screen.' },
      { max: 12, label: 'Above screen cut-off', note: 'A score of 6 or more suggests social anxiety is worth exploring.' },
    ],
  },
  {
    id: 'rses',
    higherIsBetter: true,
    name: 'RSES',
    fullName: 'Rosenberg Self-Esteem Scale',
    domain: 'Self',
    blurb: 'How you currently regard yourself.',
    minutes: 2,
    scale: 'agree4',
    license: 'Free to use',
    citation: 'Rosenberg (1965), Society and the Adolescent Self-Image',
    wordingVerified: true,
    items: [
      { text: 'On the whole, I am satisfied with myself' },
      { text: 'At times I think I am no good at all', reverse: true },
      { text: 'I feel that I have a number of good qualities' },
      { text: 'I am able to do things as well as most other people' },
      { text: 'I feel I do not have much to be proud of', reverse: true },
      { text: 'I certainly feel useless at times', reverse: true },
      { text: 'I feel that I am a person of worth, at least on an equal plane with others' },
      { text: 'I wish I could have more respect for myself', reverse: true },
      { text: 'All in all, I am inclined to feel that I am a failure', reverse: true },
      { text: 'I take a positive attitude toward myself' },
    ],
    bands: [
      { max: 14, label: 'Low self-esteem', note: 'Below the usual range. Often moves with mood.' },
      { max: 25, label: 'Normal range', note: 'Within the range most people report.' },
      { max: 30, label: 'High self-esteem', note: 'A steady view of yourself.' },
    ],
  },
  {
    id: 'brs',
    higherIsBetter: true,
    name: 'BRS',
    fullName: 'Brief Resilience Scale',
    domain: 'Strengths',
    blurb: 'How quickly you tend to bounce back.',
    minutes: 1,
    scale: 'agree5',
    license: 'Free to use',
    citation: 'Smith et al. (2008), Int J Behav Med 15(3):194-200',
    wordingVerified: true,
    transform: 'mean',
    items: [
      { text: 'I tend to bounce back quickly after hard times' },
      { text: 'I have a hard time making it through stressful events', reverse: true },
      { text: 'It does not take me long to recover from a stressful event' },
      { text: 'It is hard for me to snap back when something bad happens', reverse: true },
      { text: 'I usually come through difficult times with little trouble' },
      { text: 'I tend to take a long time to get over set-backs in my life', reverse: true },
    ],
    bands: [
      { max: 2.99, label: 'Low resilience', note: 'Set-backs are taking a while to shake off right now.' },
      { max: 4.3, label: 'Normal resilience', note: 'Within the usual range.' },
      { max: 5, label: 'High resilience', note: 'You recover from set-backs quickly.' },
    ],
  },
  {
    id: 'gse-10',
    higherIsBetter: true,
    name: 'GSE-10',
    fullName: 'General Self-Efficacy Scale',
    domain: 'Strengths',
    blurb: 'Your belief that you can handle what comes.',
    minutes: 2,
    scale: 'gse',
    license: 'Free to use for research and non-commercial purposes',
    citation: 'Schwarzer & Jerusalem (1995), Measures in Health Psychology',
    wordingVerified: true,
    items: [
      { text: 'I can always manage to solve difficult problems if I try hard enough' },
      { text: 'If someone opposes me, I can find the means and ways to get what I want' },
      { text: 'It is easy for me to stick to my aims and accomplish my goals' },
      { text: 'I am confident that I could deal efficiently with unexpected events' },
      { text: 'Thanks to my resourcefulness, I know how to handle unforeseen situations' },
      { text: 'I can solve most problems if I invest the necessary effort' },
      { text: 'I can remain calm when facing difficulties because I can rely on my coping abilities' },
      { text: 'When I am confronted with a problem, I can usually find several solutions' },
      { text: 'If I am in trouble, I can usually think of a solution' },
      { text: 'I can usually handle whatever comes my way' },
    ],
    bands: [
      { max: 19, label: 'Low', note: 'Confidence in handling demands is low right now.' },
      { max: 30, label: 'Moderate', note: 'Within the usual range.' },
      { max: 40, label: 'High', note: 'A strong sense that you can meet what comes.' },
    ],
  },
  {
    id: 'flourishing',
    higherIsBetter: true,
    name: 'Flourishing Scale',
    fullName: 'Diener Flourishing Scale',
    domain: 'Wellbeing',
    blurb: 'Purpose, relationships, and self-regard.',
    minutes: 2,
    scale: 'agree7',
    license: 'Free to use with attribution',
    citation: 'Diener et al. (2010), Soc Indic Res 97(2):143-56',
    wordingVerified: true,
    items: [
      { text: 'I lead a purposeful and meaningful life' },
      { text: 'My social relationships are supportive and rewarding' },
      { text: 'I am engaged and interested in my daily activities' },
      { text: 'I actively contribute to the happiness and well-being of others' },
      { text: 'I am competent and capable in the activities that are important to me' },
      { text: 'I am a good person and live a good life' },
      { text: 'I am optimistic about my future' },
      { text: 'People respect me' },
    ],
    bands: [
      { max: 31, label: 'Low', note: 'Meaning and connection feel thin at the moment.' },
      { max: 47, label: 'Moderate', note: 'Within the usual range.' },
      { max: 56, label: 'High', note: 'A strong sense of purpose and connection.' },
    ],
  },
  {
    id: 'cbi-personal',
    name: 'CBI (personal)',
    fullName: 'Copenhagen Burnout Inventory — personal burnout',
    domain: 'Burnout',
    blurb: 'Physical and emotional exhaustion.',
    minutes: 2,
    scale: 'cbi',
    license: 'Free to use (public domain, Kristensen et al.)',
    citation: 'Kristensen, Borritz, Villadsen & Christensen (2005), Work & Stress 19(3):192-207',
    wordingVerified: true,
    transform: 'x25',
    items: [
      { text: 'How often do you feel tired?' },
      { text: 'How often are you physically exhausted?' },
      { text: 'How often are you emotionally exhausted?' },
      { text: 'How often do you think: “I can’t take it anymore”?' },
      { text: 'How often do you feel worn out?' },
      { text: 'How often do you feel weak and susceptible to illness?' },
    ],
    bands: [
      { max: 49, label: 'Low burnout', note: 'Energy is holding up.' },
      { max: 74, label: 'Moderate burnout', note: 'Running low. Recovery time matters more than effort here.' },
      { max: 100, label: 'High burnout', note: 'A level worth taking seriously and talking about.' },
    ],
  },
  {
    id: 'ais-8',
    name: 'AIS-8',
    fullName: 'Athens Insomnia Scale',
    domain: 'Sleep',
    blurb: 'Sleep difficulty over the past month.',
    minutes: 2,
    scale: 'ais',
    license: 'Free to use',
    citation: 'Soldatos, Dikeos & Paparrigopoulos (2000), J Psychosom Res 48(6):555-60',
    wordingVerified: true,
    items: [
      { text: 'Sleep induction — time it takes you to fall asleep after turning the light off' },
      { text: 'Awakenings during the night' },
      { text: 'Final awakening earlier than desired' },
      { text: 'Total sleep duration' },
      { text: 'Overall quality of sleep' },
      { text: 'Sense of well-being during the day' },
      { text: 'Functioning (physical and mental) during the day' },
      { text: 'Sleepiness during the day' },
    ],
    // Cut-offs from Soldatos (2003) and the ISI-criterion severity bands in
    // Okajima et al. (2020): 6 is the screening threshold, not 10.
    bands: [
      { max: 5, label: 'No insomnia', note: 'Sleep looks broadly fine.' },
      { max: 9, label: 'Mild insomnia', note: 'A score of 6 or more meets the screening threshold. Sleep timing is usually the first thing to fix.' },
      { max: 15, label: 'Moderate insomnia', note: 'Enough disruption to be worth raising with a doctor.' },
      { max: 24, label: 'Severe insomnia', note: 'Please talk to a doctor about this — insomnia this heavy responds well to treatment.' },
    ],
  },
  {
    id: 'sas-sv',
    name: 'SAS-SV',
    fullName: 'Smartphone Addiction Scale — Short Version',
    domain: 'Habits',
    blurb: 'How much your phone use is interfering.',
    minutes: 2,
    scale: 'sas',
    license: 'Free to use',
    citation: 'Kwon, Kim, Cho & Yang (2013), PLoS ONE 8(12):e83558',
    wordingVerified: true,
    items: [
      { text: 'Missing planned work due to smartphone use' },
      { text: 'Having a hard time concentrating in class, while doing assignments, or while working, due to smartphone use' },
      { text: 'Feeling pain in the wrists or at the back of the neck while using a smartphone' },
      { text: 'Won’t be able to stand not having a smartphone' },
      { text: 'Feeling impatient and fretful when I am not holding my smartphone' },
      { text: 'Having my smartphone in mind even when I am not using it' },
      { text: 'I will never give up using my smartphone even when my daily life is already greatly affected by it' },
      { text: 'Constantly checking my smartphone so as not to miss conversations between other people on social media' },
      { text: 'Using my smartphone longer than I had intended' },
      { text: 'The people around me tell me that I use my smartphone too much' },
    ],
    bands: [
      { max: 30, label: 'Low', note: 'Phone use looks unproblematic.' },
      { max: 60, label: 'Elevated', note: 'Above the published cut-offs (31 for men, 33 for women). Worth a look at where the hours go.' },
    ],
  },
  {
    id: 'audit-c',
    name: 'AUDIT-C',
    fullName: 'Alcohol Use Disorders Identification Test — Consumption',
    domain: 'Habits',
    blurb: 'A three-question screen for drinking patterns.',
    minutes: 1,
    scale: null,
    license: 'Public domain (World Health Organization)',
    citation: 'Bush, Kivlahan, McDonell, Fihn & Bradley (1998), Arch Intern Med 158(16):1789-95',
    wordingVerified: true,
    items: [
      {
        text: 'How often do you have a drink containing alcohol?',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Monthly or less' },
          { value: 2, label: '2–4 times a month' },
          { value: 3, label: '2–3 times a week' },
          { value: 4, label: '4 or more times a week' },
        ],
      },
      {
        text: 'How many standard drinks do you have on a typical day when you are drinking?',
        options: [
          { value: 0, label: '1 or 2' },
          { value: 1, label: '3 or 4' },
          { value: 2, label: '5 or 6' },
          { value: 3, label: '7 to 9' },
          { value: 4, label: '10 or more' },
        ],
      },
      {
        text: 'How often do you have six or more drinks on one occasion?',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Less than monthly' },
          { value: 2, label: 'Monthly' },
          { value: 3, label: 'Weekly' },
          { value: 4, label: 'Daily or almost daily' },
        ],
      },
    ],
    bands: [
      { max: 2, label: 'Low risk', note: 'Below the usual screening cut-off.' },
      { max: 12, label: 'Above cut-off', note: 'At or above the usual cut-off (3 for women, 4 for men). Worth a conversation.' },
    ],
  },
  {
    id: 'phq-15',
    name: 'PHQ-15',
    fullName: 'Patient Health Questionnaire-15 (Somatic Symptom Scale)',
    domain: 'Body',
    blurb: 'Physical symptoms — the aches and nausea that stress often shows up as.',
    minutes: 3,
    scale: 'phq15',
    license: 'Public domain (Pfizer released the PHQ family for free use)',
    citation: 'Kroenke, Spitzer & Williams (2002), Psychosom Med 64(2):258-66',
    wordingVerified: false,
    items: [
      { text: 'Stomach pain' },
      { text: 'Back pain' },
      { text: 'Pain in your arms, legs, or joints (knees, hips, etc.)' },
      { text: 'Menstrual cramps or other problems with your periods (women only)' },
      { text: 'Headaches' },
      { text: 'Chest pain' },
      { text: 'Dizziness' },
      { text: 'Fainting spells' },
      { text: 'Feeling your heart pound or race' },
      { text: 'Shortness of breath' },
      { text: 'Pain or problems during sexual intercourse' },
      { text: 'Constipation, loose bowels, or diarrhoea' },
      { text: 'Nausea, gas, or indigestion' },
      { text: 'Feeling tired or having low energy' },
      { text: 'Trouble sleeping' },
    ],
    bands: [
      { max: 4, label: 'Minimal', note: 'Few physical symptoms reported.' },
      { max: 9, label: 'Low', note: 'Some symptoms. Common during a stressful stretch.' },
      { max: 14, label: 'Medium', note: 'Enough to be worth mentioning to a doctor as well as a counsellor.' },
      { max: 30, label: 'High', note: 'Please have these checked medically — physical symptoms deserve physical care, whatever else is going on.' },
    ],
  },
  {
    id: 'pc-ptsd-5',
    name: 'PC-PTSD-5',
    fullName: 'Primary Care PTSD Screen for DSM-5',
    domain: 'Trauma',
    blurb: 'Five questions about how a frightening event is still affecting you.',
    minutes: 1,
    scale: 'ptsd5',
    license: 'Public domain (US Department of Veterans Affairs, National Center for PTSD)',
    citation: 'Prins et al. (2016), J Gen Intern Med 31(10):1206-11',
    wordingVerified: false,
    items: [
      { text: 'Had nightmares about the event(s), or thought about the event(s) when you did not want to?' },
      { text: 'Tried hard not to think about the event(s), or went out of your way to avoid situations that reminded you of it?' },
      { text: 'Been constantly on guard, watchful, or easily startled?' },
      { text: 'Felt numb or detached from people, activities, or your surroundings?' },
      { text: 'Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?' },
    ],
    bands: [
      { max: 2, label: 'Below cut-off', note: 'Below the usual screening threshold.' },
      { max: 5, label: 'At or above cut-off', note: 'A score of 3 or more is the point at which a proper conversation with a clinician is recommended. It is a screen, not a diagnosis of PTSD.' },
    ],
  },
  {
    id: 'scoff',
    name: 'SCOFF',
    fullName: 'SCOFF Eating Disorder Screening Questionnaire',
    domain: 'Eating',
    blurb: 'Five yes/no questions about eating, weight and control.',
    minutes: 1,
    scale: 'scoff',
    license: 'Free to reproduce (published in the BMJ)',
    citation: 'Morgan, Reid & Lacey (1999), BMJ 319(7223):1467-8',
    wordingVerified: false,
    items: [
      { text: 'Do you make yourself Sick because you feel uncomfortably full?' },
      { text: 'Do you worry you have lost Control over how much you eat?' },
      { text: 'Have you recently lost more than One stone (about 6 kg) in a three-month period?' },
      { text: 'Do you believe yourself to be Fat when others say you are too thin?' },
      { text: 'Would you say that Food dominates your life?' },
    ],
    bands: [
      { max: 1, label: 'Below cut-off', note: 'Below the usual screening threshold.' },
      { max: 5, label: 'At or above cut-off', note: 'Two or more yeses is the point at which the authors recommend a proper assessment. Eating difficulties respond well to early help — please talk to someone.' },
    ],
  },
  {
    id: 'bsmas',
    name: 'BSMAS',
    fullName: 'Bergen Social Media Addiction Scale',
    domain: 'Habits',
    blurb: 'Six questions about where social media sits in your day.',
    minutes: 2,
    scale: 'bsmas',
    license: 'Free to use for research and education (Andreassen et al.)',
    citation: 'Andreassen et al. (2016), Psychol Addict Behav 30(2):252-62',
    wordingVerified: false,
    items: [
      { text: '…spent a lot of time thinking about social media or planning how to use it?' },
      { text: '…felt an urge to use social media more and more?' },
      { text: '…used social media in order to forget about personal problems?' },
      { text: '…tried to cut down on social media without success?' },
      { text: '…become restless or troubled if you were unable to use social media?' },
      { text: '…used social media so much that it has had a negative impact on your studies or work?' },
    ],
    bands: [
      { max: 23, label: 'Below cut-off', note: 'Social media use looks unproblematic on this scale.' },
      { max: 30, label: 'At or above cut-off', note: 'At or above the commonly used cut-off of 24. Worth a look at where the hours go — this is a screen, not a diagnosis of anything.' },
    ],
  },
  {
    id: 'scs-sf',
    higherIsBetter: true,
    name: 'SCS-SF',
    fullName: 'Self-Compassion Scale — Short Form',
    domain: 'Strengths',
    blurb: 'How you treat yourself when things go badly.',
    minutes: 3,
    scale: 'scs',
    license: 'Free for research and educational use (Kristin Neff)',
    citation: 'Raes, Pommier, Neff & Van Gucht (2011), Clin Psychol Psychother 18(3):250-5',
    wordingVerified: false,
    transform: 'mean',
    items: [
      { text: 'When I fail at something important to me, I become consumed by feelings of inadequacy.', reverse: true },
      { text: 'I try to be understanding and patient towards those aspects of my personality I do not like.' },
      { text: 'When something painful happens, I try to take a balanced view of the situation.' },
      { text: 'When I am feeling down, I tend to feel like most other people are probably happier than I am.', reverse: true },
      { text: 'I try to see my failings as part of being human.' },
      { text: 'When I am going through a very hard time, I give myself the caring and tenderness I need.' },
      { text: 'When something upsets me, I try to keep my emotions in balance.' },
      { text: 'When I fail at something that matters to me, I tend to feel alone in my failure.', reverse: true },
      { text: 'When I am feeling down, I tend to obsess and fixate on everything that is wrong.', reverse: true },
      { text: 'When I feel inadequate in some way, I try to remind myself that most people feel that way sometimes.' },
      { text: 'I am disapproving and judgmental about my own flaws and inadequacies.', reverse: true },
      { text: 'I am intolerant and impatient towards those aspects of my personality I do not like.', reverse: true },
    ],
    bands: [
      { max: 2.49, label: 'Low', note: 'You are harder on yourself than you would ever be on a friend. That is a learnable skill, not a fixed trait.' },
      { max: 3.5, label: 'Moderate', note: 'A fairly typical mix of kindness and criticism toward yourself.' },
      { max: 5, label: 'High', note: 'You tend to treat yourself decently when things go wrong — that is protective, and worth keeping.' },
    ],
  },
];

export const INSTRUMENT_IDS = INSTRUMENTS.map((i) => i.id);

export function getInstrument(id) {
  return INSTRUMENTS.find((i) => i.id === id) || null;
}

// Every item carries its own options once resolved, so the client and the
// scorer never have to look a scale up separately.
export function resolveItems(instrument) {
  const scale = instrument.scale ? SCALES[instrument.scale] : null;
  return instrument.items.map((item, index) => ({
    index,
    text: item.text,
    reverse: Boolean(item.reverse),
    options: item.options || scale.options,
  }));
}

// The unscored question some source forms print after their scored items.
// Returned separately from `items` so nothing that sums an array can reach it
// by accident.
export function resolveFollowUp(instrument) {
  const followUp = instrument.followUp;
  if (!followUp) return null;
  return {
    id: followUp.id,
    text: followUp.text,
    note: followUp.note || null,
    // 'anyEndorsed' means the form only asks this of someone who answered
    // above the floor on at least one scored item; null means always ask.
    condition: followUp.condition || null,
    options: followUp.options,
  };
}

// The catalog the client renders — everything except the scoring key, which
// is not something the browser needs.
export function catalog() {
  return INSTRUMENTS.map((i) => ({
    id: i.id,
    name: i.name,
    fullName: i.fullName,
    domain: i.domain,
    blurb: i.blurb,
    minutes: i.minutes,
    itemCount: i.items.length,
    higherIsBetter: Boolean(i.higherIsBetter),
    license: i.license,
    citation: i.citation,
    wordingVerified: i.wordingVerified,
  }));
}

export function instrumentDetail(instrument) {
  const scale = instrument.scale ? SCALES[instrument.scale] : null;
  return {
    id: instrument.id,
    name: instrument.name,
    fullName: instrument.fullName,
    domain: instrument.domain,
    blurb: instrument.blurb,
    minutes: instrument.minutes,
    prompt: scale ? scale.prompt : null,
    higherIsBetter: Boolean(instrument.higherIsBetter),
    license: instrument.license,
    citation: instrument.citation,
    wordingVerified: instrument.wordingVerified,
    items: resolveItems(instrument),
    followUp: resolveFollowUp(instrument),
  };
}
