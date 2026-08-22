// One dossier per questionnaire in the Tests section.
//
// The app already tells you your score and which band it falls in. What it did
// not tell you is where the questionnaire came from, what it was actually
// built to detect, or what it is known to be bad at — and those are the things
// that decide whether a number deserves any weight.
//
// WHY THIS IS NOT FETCHED FROM THE API. Same reasoning as the essays in
// articles.js: this is fixed reference text with no per-user state, so putting
// it behind the network would only add a way for it to fail.
//
// WHY THE NUMBERS ARE REPEATED HERE. `range` and `cutoffs` also exist, in
// effect, in backend/lib/instruments.js as band tables. Duplicating them is a
// real risk — the two can drift apart and then the reading section is quietly
// lying about a score. test/test-notes.test.mjs guards this: it fails if an
// instrument has no dossier, if a dossier names an instrument that does not
// exist, or if a stated range disagrees with the band table it describes.
//
// The rule for the prose: say what the instrument is for, and say plainly
// where it is weak. A screening questionnaire that gets described only in
// terms of its strengths is being sold rather than explained.

export const TEST_NOTES = {
  // ---------------------------------------------------------- mood/anxiety
  'phq-9': {
    range: '0–27',
    cutoffs: '5 mild · 10 moderate · 15 moderately severe · 20 severe',
    measures:
      'Nine symptoms of depression over the last two weeks. The items are not a general mood question — they map one-to-one onto the diagnostic criteria for a major depressive episode, which is why sleep, appetite, concentration and movement all appear alongside sadness.',
    origin:
      'Developed by Kroenke, Spitzer and Williams in 2001 as the depression module of the larger PRIME-MD questionnaire, redesigned so a busy clinician could hand it over in a waiting room. Pfizer funded it and released the PHQ family into the public domain, which is most of why it is now the most-used depression measure in the world.',
    reading:
      'At the usual threshold of 10 or more it catches roughly seven or eight out of ten people who do have a depressive disorder, and wrongly flags a similar proportion of those who do not. That is good for a nine-item form and nowhere near good enough to be treated as an answer.',
    limits:
      'It cannot distinguish depression from the things that imitate it. Grief, thyroid problems, anaemia, a new medication, chronic pain and simple sustained exhaustion all push this score up, and the questionnaire has no way to tell them apart from each other.',
    watch:
      'Item 9 asks about thoughts of being better off dead or of hurting yourself. It is not really part of the total: if it is true for you, that matters on its own, whatever the other eight items added up to.',
    sources: [
      {
        label: 'Kroenke, K., Spitzer, R. L. & Williams, J. B. (2001). J Gen Intern Med 16(9), 606–613.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/',
      },
    ],
  },

  'gad-7': {
    range: '0–21',
    cutoffs: '5 mild · 10 moderate · 15 severe',
    measures:
      'Seven symptoms of generalised anxiety over two weeks — the worrying itself, and what it does to the body: restlessness, irritability, being unable to settle.',
    origin:
      'Spitzer and colleagues built it in 2006 as the anxiety counterpart to the PHQ-9, starting from a longer item pool and keeping the seven that best separated people with generalised anxiety disorder from those without.',
    reading:
      'At 10 or more it identifies about 89% of people with generalised anxiety disorder. It also picks up panic disorder, social anxiety and PTSD at a decent rate — useful in practice, but it means a high score tells you that something anxious is going on, not which thing.',
    limits:
      'It was validated on adults in primary care, not on students in an exam term. Anxiety that is proportionate to a genuinely difficult few weeks scores the same as anxiety that has detached from circumstance, and only one of those is a disorder.',
    watch:
      'Roughly four points is the smallest change worth reading as real. Anything under that is inside the range the questionnaire moves on its own.',
    sources: [
      {
        label: 'Spitzer, R. L., Kroenke, K., Williams, J. B. & Löwe, B. (2006). Arch Intern Med 166(10), 1092–1097.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16717171/',
      },
    ],
  },

  k10: {
    range: '10–50',
    cutoffs: '20 mild · 25 moderate · 30 severe distress',
    measures:
      'Non-specific psychological distress over the last four weeks — how often you felt nervous, hopeless, restless, worthless, or that everything was an effort.',
    origin:
      'Commissioned by the US National Center for Health Statistics and built by Ronald Kessler and colleagues in 2002, specifically to be short enough to ride along on national health surveys. It is the distress measure behind a great deal of what is known about population mental health.',
    reading:
      'Deliberately not diagnosis-shaped. A high score means "this person is having a hard time and is more likely than average to meet criteria for something" — it does not point at which something.',
    limits:
      'Its vagueness is the feature and the flaw. It is excellent at finding people worth talking to and useless for deciding what to talk about.',
    sources: [
      {
        label: 'Kessler, R. C. et al. (2002). Psychological Medicine 32(6), 959–976.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12214795/',
      },
    ],
  },

  'who-5': {
    range: '0–100 (raw 0–25, multiplied by four)',
    cutoffs: '50 or below is worth looking at · 28 or below suggests likely depression',
    measures:
      'Wellbeing over the last two weeks, asked entirely in the positive: feeling cheerful, calm, active, rested, interested. There is not a single symptom question in it.',
    origin:
      'Written by the WHO Regional Office for Europe in 1998. The all-positive wording was a deliberate choice — it asks what is present rather than what is wrong, which people find markedly easier to answer honestly.',
    reading:
      'A low score is an absence of good things, not the presence of bad ones, and the two are genuinely different. You can score badly here while scoring fine on PHQ-9, and that gap is informative rather than contradictory.',
    limits:
      'Five items is very short. It moves easily with a good night’s sleep or a bad week, so a single administration says little.',
    sources: [
      {
        label: 'Topp, C. W. et al. (2015). Psychotherapy and Psychosomatics 84(3), 167–176.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25831962/',
      },
    ],
  },

  // ---------------------------------------------------------------- stress
  'pss-10': {
    range: '0–40',
    cutoffs: 'No clinical threshold — compare against population norms only',
    measures:
      'How unpredictable, uncontrollable and overloaded your life has felt in the last month. Notably it does not ask what has happened to you.',
    origin:
      'Cohen, Kamarck and Mermelstein published the original in 1983, on the then-contested premise that appraisal matters more than events — that the same month can be ruinous to one person and manageable to another, and that this difference is measurable.',
    reading:
      'Four of the ten items are worded positively and scored in reverse, which is a check on people who answer everything down one column without reading.',
    limits:
      'There is no cut-off and there should not be one. Perceived stress is a continuum with no natural line across it, so a score is only meaningful next to other scores — yours from last month, or a published average.',
    sources: [
      {
        label: 'Cohen, S., Kamarck, T. & Mermelstein, R. (1983). J Health Soc Behav 24(4), 385–396.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/6668417/',
      },
    ],
  },

  // ---------------------------------------------------------------- social
  'ucla-3': {
    range: '3–9',
    cutoffs: '6 or more is generally read as lonely',
    measures:
      'Three questions: how often you feel you lack companionship, feel left out, and feel isolated from others.',
    origin:
      'Hughes, Waite, Hawkley and Cacioppo cut it down from the twenty-item UCLA Loneliness Scale in 2004, for use in a large telephone survey of older adults.',
    reading:
      'The word "lonely" never appears, and that is deliberate. People under-report loneliness when it is named, because admitting to it feels like admitting to a personal failure. Asking about the components gets a truer answer.',
    limits:
      'Three items cannot separate being alone from feeling alone, and those come apart constantly — a full hostel is one of the more reliable places to feel isolated.',
    sources: [
      {
        label: 'Hughes, M. E. et al. (2004). Research on Aging 26(6), 655–672.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/18504506/',
      },
    ],
  },

  mspss: {
    range: '1–7 (mean of twelve items)',
    cutoffs: 'Roughly: below 3 low support · 3–5 moderate · above 5 high',
    measures:
      'Support you believe you could draw on, across three sources: family, friends, and one significant other.',
    origin:
      'Zimet and colleagues, 1988. The three-part structure has held up unusually well across dozens of translations and cultures, which is rare for a subscale structure.',
    reading:
      'The subscales matter more than the total. Strong friends and absent family produce the same overall number as thin support everywhere, and those are entirely different situations.',
    limits:
      'It measures what you believe is available, not what is. Both directions of error are common, and depression reliably drags the estimate downward.',
    sources: [
      {
        label: 'Zimet, G. D. et al. (1988). Journal of Personality Assessment 52(1), 30–41.',
        url: 'https://doi.org/10.1207/s15327752jpa5201_2',
      },
    ],
  },

  'mini-spin': {
    range: '0–12',
    cutoffs: '6 or more warrants a longer look',
    measures:
      'Three items on fear of embarrassment, avoidance of being the centre of attention, and being held back by fear of looking foolish.',
    origin:
      'Connor and colleagues distilled it in 2001 from the seventeen-item Social Phobia Inventory, hunting for the shortest possible screen for generalised social anxiety disorder.',
    reading:
      'At a cut-off of 6 it catches roughly nine in ten people who have generalised social anxiety — very good sensitivity for three questions, bought at the cost of flagging a lot of people who are simply shy.',
    limits:
      'Shyness is not a disorder. What separates them is impairment — whether it is costing you things you wanted — and that question is not on the form.',
    sources: [
      {
        label: 'Connor, K. M. et al. (2001). Depression and Anxiety 14(2), 137–140.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11668666/',
      },
    ],
  },

  // ------------------------------------------------------------------ self
  rses: {
    range: '0–30',
    cutoffs: 'Below 15 is usually read as low self-esteem',
    measures:
      'Global self-worth — your overall sense of being a person of value, rather than confidence at any particular thing.',
    origin:
      'Morris Rosenberg wrote it in 1965 for a study of five thousand New York high-school students. Sixty years on it is still the standard, and almost every later self-esteem measure is compared against it.',
    reading:
      'Half the items are worded positively and half negatively, which is what makes the scale robust to people agreeing with everything.',
    limits:
      'Self-esteem is remarkably stable in the long run and quite volatile day to day, so a single sitting captures the day more than the person.',
    sources: [
      { label: 'Rosenberg, M. (1965). Society and the Adolescent Self-Image. Princeton University Press.' },
    ],
  },

  // ------------------------------------------------------------- strengths
  brs: {
    range: '1–5 (mean of six items)',
    cutoffs: '3.0–4.3 is normal resilience · below 3.0 low · above 4.3 high',
    measures:
      'The one thing its authors argued resilience actually means: how quickly you recover after something difficult. Not toughness, not resources — recovery speed.',
    origin:
      'Smith and colleagues, 2008, written as a corrective. Most resilience scales measure the ingredients thought to produce resilience — optimism, support, self-efficacy — and then claim to have measured resilience. This one measures the bouncing back directly.',
    reading:
      'Three of the six items are reversed, and the score is a mean rather than a sum, so it lands on the same 1–5 scale as the response options.',
    limits:
      'Six items, self-reported, and asked at a moment that is itself either good or bad. People in the middle of something hard reliably rate their own recovery pessimistically.',
    sources: [
      {
        label: 'Smith, B. W. et al. (2008). International Journal of Behavioral Medicine 15(3), 194–200.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/18696313/',
      },
    ],
  },

  'gse-10': {
    range: '10–40',
    cutoffs: 'No clinical threshold — higher is more self-efficacy',
    measures:
      'Belief that you can handle new or difficult demands through your own effort — a general expectation of competence rather than skill at anything specific.',
    origin:
      'Schwarzer and Jerusalem, first in German in 1981 and in the current form in 1995. It has since been translated into more than thirty languages and is one of the most cross-culturally tested scales in psychology.',
    reading:
      'It predicts persistence better than it predicts performance. People who score high keep going for longer after failing, which is a different and often more useful thing than being good at the task.',
    limits:
      'It is a belief measure. Confident and competent come apart in both directions, and this only sees one of them.',
    sources: [
      { label: 'Schwarzer, R. & Jerusalem, M. (1995). In Weinman, Wright & Johnston (eds.), Measures in Health Psychology.' },
    ],
  },

  flourishing: {
    range: '8–56',
    cutoffs: 'No clinical threshold — higher is more flourishing',
    measures:
      'Whether life feels like it is going well in the ways people actually care about: relationships, purpose, self-respect, optimism, being of use to others.',
    origin:
      'Ed Diener and colleagues, 2010, part of a long argument that measuring the absence of illness leaves out most of what makes a life good.',
    reading:
      'All eight items point the same way and it produces one number, which makes it a blunt instrument by design — it is meant to sit alongside a symptom measure, not replace one.',
    limits:
      'Highly sensitive to how the last week went. It is also the kind of scale people answer aspirationally.',
    sources: [
      {
        label: 'Diener, E. et al. (2010). Social Indicators Research 97(2), 143–156.',
        url: 'https://doi.org/10.1007/s11205-009-9493-y',
      },
    ],
  },

  'scs-sf': {
    range: '1–5 (mean of twelve items)',
    cutoffs: 'Roughly: below 2.5 low · 2.5–3.5 moderate · above 3.5 high',
    measures:
      'How you treat yourself when things go badly — across kindness versus self-judgement, common humanity versus isolation, and mindfulness versus over-identification.',
    origin:
      'Raes, Pommier, Neff and Van Gucht, 2011, a twelve-item short form of Kristin Neff’s original twenty-six-item scale.',
    reading:
      'Six of the twelve items are reversed. The short form is only recommended for the total score — the subscales are too short to be reliable on their own, and reading them individually is a known misuse.',
    limits:
      'There is an ongoing methodological argument about whether the reversed items measure self-compassion at all, or simply measure the absence of self-criticism, which may be a different thing.',
    sources: [
      {
        label: 'Raes, F., Pommier, E., Neff, K. D. & Van Gucht, D. (2011). Clin Psychol Psychother 18(3), 250–255.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21584907/',
      },
    ],
  },

  // -------------------------------------------------------------- burnout
  'cbi-personal': {
    range: '0–100',
    cutoffs: '50 or above is the usual marker for moderate burnout',
    measures:
      'Personal burnout — physical and psychological exhaustion, regardless of what caused it.',
    origin:
      'Kristensen and colleagues, 2005, built for a large Danish study of human-service workers and released free of charge, in deliberate contrast to the licensed Maslach inventory that dominated the field.',
    reading:
      'This is the subscale that does not mention work at all, which is exactly why it transfers to students. The full inventory adds work-related and client-related subscales that do not.',
    limits:
      'Exhaustion is the least specific symptom in mental health. Depression, anaemia, poor sleep, long COVID and simply doing too much all produce a high score here.',
    sources: [
      {
        label: 'Kristensen, T. S. et al. (2005). Work & Stress 19(3), 192–207.',
        url: 'https://doi.org/10.1080/02678370500297720',
      },
    ],
  },

  // ----------------------------------------------------------------- sleep
  'ais-8': {
    range: '0–24',
    cutoffs: '6 or more is consistent with insomnia',
    measures:
      'Sleep difficulty over the last month, built directly on the ICD-10 criteria: falling asleep, waking in the night, waking too early, total duration, quality, and the daytime consequences.',
    origin:
      'Soldatos, Dikeos and Paparrigopoulos, 2000, deliberately mapped onto a diagnostic definition rather than assembled from items that happened to correlate.',
    reading:
      'The last three items are about daytime function — mood, ability, sleepiness. That is the part that distinguishes insomnia as a disorder from simply sleeping less than you would like.',
    limits:
      'It does not ask why. Sleep apnoea, a noisy hostel, caffeine, a phone in bed and anxiety all produce the same score, and the treatment for each is completely different.',
    sources: [
      {
        label: 'Soldatos, C. R., Dikeos, D. G. & Paparrigopoulos, T. J. (2000). J Psychosom Res 48(6), 555–560.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11033374/',
      },
    ],
  },

  // ---------------------------------------------------------------- habits
  'sas-sv': {
    range: '10–60',
    cutoffs: '31 or more (men) · 33 or more (women), from the original Korean sample',
    measures:
      'Disruption from smartphone use: missed work, difficulty stopping, discomfort without the phone, and use displacing other things.',
    origin:
      'Kwon and colleagues, 2013, developed and validated on Korean adolescents.',
    reading:
      'The cut-offs come from that one sample in that one year, and phone use has changed enormously since. Treat the number as a prompt to think about your own use, not as a boundary you have crossed.',
    limits:
      'Whether "smartphone addiction" is a real clinical entity is genuinely unsettled. The items describe a habit that has become costly, which is worth noticing under any name.',
    sources: [
      {
        label: 'Kwon, M. et al. (2013). PLoS ONE 8(12), e83558.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24391787/',
      },
    ],
  },

  bsmas: {
    range: '6–30',
    cutoffs: 'No settled threshold — 19 and 24 both appear in the literature',
    measures:
      'Social media use mapped onto the six components proposed for behavioural addiction: salience, mood modification, tolerance, withdrawal, conflict and relapse.',
    origin:
      'Andreassen and colleagues, 2016, generalised from their earlier Bergen Facebook Addiction Scale as it became obvious that people were not only on one platform.',
    reading:
      'One item per component, which makes it fast and coarse. The absence of an agreed cut-off is honest rather than sloppy — the field has not settled on where the line is.',
    limits:
      'The addiction framework itself is contested for social media. Heavy use that is genuinely costing you something is worth addressing whether or not it qualifies as an addiction.',
    sources: [
      {
        label: 'Andreassen, C. S. et al. (2016). Psychology of Addictive Behaviors 30(2), 252–262.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/26999354/',
      },
    ],
  },

  'audit-c': {
    range: '0–12',
    cutoffs: '4 or more (men) · 3 or more (women)',
    measures:
      'Three questions about consumption only: how often you drink, how much on a typical day, and how often you have six or more in one sitting.',
    origin:
      'Bush and colleagues, 1998, taking the first three consumption items of the WHO’s ten-item AUDIT and showing they performed nearly as well on their own.',
    reading:
      'The thresholds differ by sex because of differences in body water and alcohol metabolism, not because of a different standard of behaviour.',
    limits:
      'Consumption questions are among the most under-reported items in medicine, and the scale asks nothing about consequences or dependence.',
    sources: [
      {
        label: 'Bush, K. et al. (1998). Arch Intern Med 158(16), 1789–1795.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9738608/',
      },
    ],
  },

  // ------------------------------------------------------------------ body
  'phq-15': {
    range: '0–30',
    cutoffs: '5 low · 10 medium · 15 high somatic symptom burden',
    measures:
      'How much you have been bothered by fifteen physical symptoms over the last four weeks — stomach pain, headaches, dizziness, palpitations, and so on.',
    origin:
      'Kroenke and colleagues, 2002, from the same PRIME-MD work as the PHQ-9, covering the physical complaints that account for a large share of all primary-care visits.',
    reading:
      'A high score does not mean the symptoms are imagined or that nothing physical is wrong. It measures burden, and it is a well-established predictor of impairment and of how often someone will see a doctor.',
    limits:
      'It cannot tell a somatic presentation of distress from an undiagnosed physical illness. That distinction needs a doctor, and getting it the wrong way round is harmful in both directions.',
    sources: [
      {
        label: 'Kroenke, K., Spitzer, R. L. & Williams, J. B. (2002). Psychosomatic Medicine 64(2), 258–266.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11914441/',
      },
    ],
  },

  // ---------------------------------------------------------------- trauma
  'pc-ptsd-5': {
    range: '0–5',
    cutoffs: '3 or more is a positive screen',
    measures:
      'Five yes/no questions covering the DSM-5 clusters: nightmares and intrusive memories, avoidance, hypervigilance, numbness, and self-blame.',
    origin:
      'Prins and colleagues, 2016, updating the earlier four-item version for DSM-5 criteria, for the US Department of Veterans Affairs.',
    reading:
      'It is preceded by a question about whether you have experienced a traumatic event at all, and the five items only make sense if that one is answered yes.',
    limits:
      'A positive screen is a reason for a proper assessment and nothing more. PTSD is diagnosed on a structured interview, because duration, timing and impairment all matter and none of them are asked here.',
    watch:
      'These questions ask you to think about the worst thing that has happened to you. If that is not something you want to do today, it will keep.',
    sources: [
      {
        label: 'Prins, A. et al. (2016). J Gen Intern Med 31(10), 1206–1211.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27170304/',
      },
    ],
  },

  // ---------------------------------------------------------------- eating
  scoff: {
    range: '0–5',
    cutoffs: '2 or more warrants further assessment',
    measures:
      'Five yes/no questions, one per letter: making yourself Sick, loss of Control, losing One stone in three months, believing yourself Fat when others disagree, and Food dominating your life.',
    origin:
      'Morgan, Reid and Lacey, 1999, written to be memorable enough that a GP could ask all five from memory in under two minutes.',
    reading:
      'Two or more is the threshold, and it is set to over-refer on purpose. In eating disorders, missing a case is far more costly than an unnecessary conversation.',
    limits:
      'Developed on young women in the UK and it performs less well elsewhere — particularly for men, for binge eating disorder, and for ARFID, none of which it was built to find.',
    watch:
      'A positive screen is not a diagnosis and is not a verdict on your body. It is a reason to talk to someone who knows this area.',
    sources: [
      {
        label: 'Morgan, J. F., Reid, F. & Lacey, J. H. (1999). BMJ 319(7223), 1467–1468.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10582927/',
      },
    ],
  },
};

export const TEST_NOTE_IDS = Object.keys(TEST_NOTES);

export function getTestNote(id) {
  return TEST_NOTES[id] || null;
}
