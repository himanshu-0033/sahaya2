// The reading section.
//
// Deliberately held in the frontend rather than served from the API, unlike
// grounding/paths/assessments. Those endpoints exist because they read and
// write per-user state; an article has no state, no scoring and no storage, so
// putting it behind the network would only add a way for it to fail. A student
// who opens this while the backend is down should still be able to read.
//
// WHAT THIS CONTENT HAS TO DO. Everything else in the app is careful about not
// overclaiming — the grounding techniques carry an evidence strength, the
// questionnaires carry their caveats. Prose is where overclaiming is easiest,
// because it has no schema forcing the caveat into view. So the rule here is
// that a claim strong enough to change what someone does carries its source,
// and where the evidence is thin the text says so rather than going quiet.
//
// `blocks` are a tiny format: { p } paragraph, { list } bullets, { note } an
// aside that must not be missed, { practice } a link into a real technique.

export const ARTICLES = [
  // ----------------------------------------------------------------- 1
  {
    id: 'the-inkblots-honestly',
    title: 'The inkblots, honestly',
    standfirst:
      'What Hermann Rorschach was actually measuring, why psychologists have argued about it for a century, and what ten symmetrical smudges can and cannot tell you.',
    topic: 'inkblot',
    minutes: 7,
    sections: [
      {
        heading: 'A perception experiment, not a personality decoder',
        blocks: [
          {
            p: 'The popular version of the Rorschach — the one in films, where a detective looks at a blot and a psychiatrist learns his darkest secret — has almost nothing to do with what the test was built to do. Hermann Rorschach was a Swiss psychiatrist interested in perception: not what people saw, so much as how they went about seeing it.',
          },
          {
            p: 'He published Psychodiagnostik in 1921. He died the following year, aged 37, of a burst appendix — months after the book appeared and long before it became famous. He never saw what the world did with his plates, which is worth remembering whenever someone tells you what Rorschach believed his test could prove.',
          },
          {
            p: 'The question he was asking was closer to "does this person take in the whole shape or fasten on one fragment? Did the outline drive the answer, or the colour, or the shading?" than to "what does a bat mean?". Content is the part everyone remembers and the part that matters least.',
          },
        ],
      },
      {
        heading: 'What the ten plates actually are',
        blocks: [
          {
            p: 'There are ten, always shown in the same order. Five are achromatic — black and grey on white: plates I, IV, V, VI and VII. Two add red to the black: plates II and III. The last three, VIII, IX and X, are fully coloured.',
          },
          {
            p: 'That progression is designed, not decorative. Colour arrives abruptly at plate II and takes over completely at VIII, and how someone handles those two switches is itself part of what is being observed. The symmetry comes from the oldest trick there is: ink on paper, folded while wet.',
          },
          {
            note: 'The plates on this site are the real ones. Rorschach died in 1922, so they have been in the public domain worldwide for decades; these came from Wikimedia Commons.',
          },
        ],
      },
      {
        heading: 'How a real administration is scored',
        blocks: [
          {
            p: 'Not by vibes, and not by a psychologist deciding what your answer symbolises. A response gets coded along several dimensions at once:',
          },
          {
            list: [
              'Location — did you use the whole blot, a commonly-used part, or an unusual one?',
              'Determinants — what property made it look like that: form, colour, shading, or an impression of movement?',
              'Form quality — does the thing you saw actually fit the contours, judged against large tables of what other people report?',
              'Popularity — is this one of the responses most people give to this plate?',
            ],
          },
          {
            p: 'John Exner pulled five competing and mutually incompatible scoring systems into one Comprehensive System in 1974, which is the reason the test survived as a research object at all. R-PAS, published in 2011, is the more current successor with better international norms.',
          },
          {
            p: 'A real sitting is one-to-one with a trained clinician, takes the better part of an hour, and is followed by hours of coding. Nothing about it resembles clicking through ten pictures on a phone.',
          },
        ],
      },
      {
        heading: 'The argument about whether it works',
        blocks: [
          {
            p: 'This is the longest-running fight in assessment psychology, and both sides have a point.',
          },
          {
            p: 'The case against was put most sharply by Wood, Nezworski and Lilienfeld in What’s Wrong with the Rorschach? (2003): that norms were skewed enough to make ordinary people look disturbed, and that many of the claims made for the test had never survived a decent study.',
          },
          {
            p: 'The most careful answer is a 2013 meta-analysis by Mihura and colleagues in Psychological Bulletin, which did the tedious and correct thing: it tested the variables one at a time instead of asking whether "the Rorschach" works. The result was a split decision. Variables about perception and thinking — form quality, the indices for disordered thought — held up. Many others, particularly those claimed to detect depression or abuse histories, did not.',
          },
          {
            p: 'So the honest summary is narrow and slightly boring. The test has some traction on the question "is this person organising what they see the way most people do?", which matters for psychosis and thought disorder. It has very little on "is this person depressed" or "what is this person really like" — the two things the popular version promises.',
          },
        ],
      },
      {
        heading: 'Why you can see them here at all',
        blocks: [
          {
            p: 'When the plates went up on Wikipedia in 2009, psychological bodies objected formally. The concern was not copyright — that expired long ago — but test security: if you have already seen a plate and read what answers are considered typical, your responses in a real assessment are no longer naive, and the norms no longer describe you.',
          },
          {
            p: 'That concern is legitimate, and it is worth knowing before you scroll. It is also, at this point, somewhat moot: the images have been a search away for over fifteen years.',
          },
          {
            p: 'What this app does with them is deliberately not the test. You are shown a plate, asked what you see, and your own words are reflected back to you at the end. Nothing is coded, nothing is scored, and no one is told what your answers mean — because nothing here is qualified to say.',
          },
        ],
      },
    ],
    sources: [
      { label: 'Rorschach, H. (1921). Psychodiagnostik.', detail: 'The original monograph.' },
      {
        label: 'Mihura, J. L. et al. (2013). Psychological Bulletin 139(3), 548–605.',
        detail: 'Systematic meta-analytic review of the Comprehensive System variables.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22925137/',
      },
      {
        label: 'Wood, J. M., Nezworski, M. T. & Lilienfeld, S. O. (2003). What’s Wrong with the Rorschach?',
        detail: 'The best-known critique.',
      },
      {
        label: 'Plate images: Wikimedia Commons, public domain.',
        detail: 'Hermann Rorschach died in 1922.',
        url: 'https://commons.wikimedia.org/wiki/Category:Rorschach_test',
      },
    ],
  },

  // ----------------------------------------------------------------- 2
  {
    id: 'why-a-long-exhale-works',
    title: 'Why a long exhale works so fast',
    standfirst:
      'Slow breathing is the one lever on your own nervous system that responds in seconds rather than weeks. Here is the mechanism, the evidence, and the parts that are weaker than people claim.',
    topic: 'calm',
    minutes: 6,
    sections: [
      {
        heading: 'Your heart rate is already following your breath',
        blocks: [
          {
            p: 'Put a finger on your pulse and breathe slowly. It speeds up slightly as you breathe in and slows as you breathe out. That is respiratory sinus arrhythmia, it is happening right now, and it is not a sign of anything wrong.',
          },
          {
            p: 'It happens because the vagus nerve — the main line of the body’s calming branch — puts a brake on the heart, and that brake eases on the in-breath and reapplies on the out-breath. Which gives you something unusual: a deliberate handle on a system that is otherwise automatic.',
          },
          {
            p: 'Make the exhale longer than the inhale and you spend proportionally more time with the brake on. That is the entire trick behind every breathing practice on this site. It is mechanical rather than psychological, which is why it works in about ninety seconds and why it works even when you feel silly doing it.',
          },
        ],
      },
      {
        heading: 'Roughly six breaths a minute',
        blocks: [
          {
            p: 'Most slow-breathing protocols land near six breaths a minute, and that is not a coincidence. Around that rate the rhythms of breathing and of blood-pressure regulation line up, and the swing in heart rate gets noticeably larger for the same effort — the reason it is sometimes called resonance frequency breathing.',
          },
          {
            p: 'You do not need to count or measure. A 4-second in and a 6-second out is already there. So is box breathing at 5-5-5-5.',
          },
        ],
      },
      {
        heading: 'What the trials actually show',
        blocks: [
          {
            p: 'The most useful recent study is Balban and colleagues (2023) in Cell Reports Medicine. 111 adults, randomised, five minutes a day for a month. Cyclic sighing — two inhales, one long exhale — beat mindfulness meditation on both mood improvement and reduction in resting breathing rate.',
          },
          { practice: 'cyclic-sighing', label: 'Try cyclic sighing' },
          {
            p: 'That is a genuinely good result for a five-minute intervention, and it is worth being precise about its size: this is a modest improvement in day-to-day mood over one month in a mostly healthy sample. It is not a treatment for an anxiety disorder, and nobody in that study was in crisis.',
          },
        ],
      },
      {
        heading: 'Where the evidence is thinner than the internet suggests',
        blocks: [
          {
            p: 'The 5-4-3-2-1 sensory exercise is taught in almost every clinic and school in the country. It is also barely tested as a standalone technique — most of what supports it is mechanistic reasoning and its role inside larger therapy packages, not trials of the exercise on its own.',
          },
          {
            p: 'That does not make it useless. It makes it a sensible thing with thin evidence, which is a different claim from a proven one, and this is why every practice in the Calm section carries a strength label rather than a uniform endorsement.',
          },
        ],
      },
      {
        heading: 'The cautions, which are real',
        blocks: [
          {
            list: [
              'Breath holds — the 7 in 4-7-8 — are worth skipping if you are pregnant, have epilepsy, or have a heart condition. Never do them while driving or in water.',
              'Light-headedness means you are over-breathing, not that it is working. Go gentler and shorter.',
              'Cold water on the face slows the heart sharply. Give it a miss with a cardiac condition, and be careful with it if you have an eating disorder, where it can become another way to punish the body.',
            ],
          },
          {
            note: 'None of this replaces treatment. Breathing well through a panic attack is a genuinely useful skill; it is not a reason to stop seeing someone about why the panic attacks keep happening.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Balban, M. Y. et al. (2023). Cell Reports Medicine 4(1), 100895.',
        detail: 'Randomised trial of brief breathwork versus mindfulness meditation.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36630953/',
      },
      {
        label: 'Zaccaro, A. et al. (2018). Frontiers in Human Neuroscience 12, 353.',
        detail: 'Systematic review of slow breathing and autonomic/CNS effects.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30245619/',
      },
    ],
  },

  // ----------------------------------------------------------------- 3
  {
    id: 'which-technique-when',
    title: 'Which one, and when',
    standfirst:
      'Thirteen practices is too many to choose from in a bad moment. This is the shorter version, sorted by what is actually happening to you.',
    topic: 'calm',
    minutes: 4,
    sections: [
      {
        heading: 'If your body is already racing',
        blocks: [
          {
            p: 'Heart going, hands shaking, chest tight. Reasoning with yourself will not land, because the part of you that reasons is not currently in charge. Go straight at the physiology.',
          },
          { practice: 'cyclic-sighing', label: 'Cyclic sighing' },
          { practice: 'temperature', label: 'Cold on the face' },
        ],
      },
      {
        heading: 'If your head is loud but your body is fine',
        blocks: [
          {
            p: 'Looping thoughts, replaying a conversation, three in the morning. Breathing helps less here, because there is no physical arousal to bring down. What works is giving the loop a competing job that it cannot do on autopilot.',
          },
          { practice: 'mental-grounding', label: 'Mental grounding' },
          { practice: '5-4-3-2-1', label: '5-4-3-2-1' },
        ],
      },
      {
        heading: 'If you feel far away, or not quite real',
        blocks: [
          {
            p: 'Flat, foggy, watching yourself from slightly outside. The aim is not calm — you are arguably too calm — but contact. Something concrete and physical, and eyes that move around the room rather than staring.',
          },
          { practice: 'orienting', label: 'Orienting' },
          { practice: 'feet-on-floor', label: 'Feet on the floor' },
        ],
      },
      {
        heading: 'If the voice in your head has turned cruel',
        blocks: [
          {
            p: 'This one gets missed, because it does not feel like anxiety — it feels like being right about yourself. It is worth treating as a state that will pass rather than as a verdict that has arrived.',
          },
          { practice: 'self-compassion-break', label: 'Self-compassion break' },
          { practice: 'butterfly-hug', label: 'Butterfly hug' },
        ],
      },
      {
        heading: 'If the spike has already passed',
        blocks: [
          {
            p: 'After the worst of it there is usually a flat, wrung-out stretch that people try to push through. The longer practices are built for exactly that, and they are the ones most worth doing on an ordinary day.',
          },
          { practice: 'nsdr', label: 'Non-sleep deep rest' },
          { practice: 'body-scan', label: 'Body scan' },
        ],
      },
      {
        heading: 'The part everyone skips',
        blocks: [
          {
            p: 'Practise these when you are fine. A technique you have only ever read about is not available to you at 2am — what you can reach for in a bad state is roughly what you have already rehearsed in a good one.',
          },
          {
            p: 'Two minutes on an ordinary Tuesday is worth more than an hour of reading about which method is best.',
          },
        ],
      },
    ],
    sources: [],
  },

  // ----------------------------------------------------------------- 4
  {
    id: 'what-a-score-means',
    title: 'What a questionnaire score is, and isn’t',
    standfirst:
      'A number out of 21 is a summary of the last fortnight. It is not a diagnosis, not a verdict, and not a stable fact about you.',
    topic: 'tests',
    minutes: 5,
    sections: [
      {
        heading: 'What they were built for',
        blocks: [
          {
            p: 'Scales like PHQ-9 and GAD-7 were designed for two jobs: to help a busy clinician notice someone who might need a longer conversation, and to track whether things are moving over time. Both jobs are about pointing at a conversation, not replacing one.',
          },
        ],
      },
      {
        heading: 'The bands are conventions, not cliffs',
        blocks: [
          {
            p: 'A score of 9 and a score of 10 can sit in different labelled bands and be, in reality, one item answered slightly differently on a slightly worse morning. The cut-offs were chosen to balance missing people against over-flagging them across a whole population. They were never meant to be read as a personal boundary you have crossed.',
          },
        ],
      },
      {
        heading: 'Most changes are noise',
        blocks: [
          {
            p: 'Every scale has a rough threshold below which a change cannot be told apart from measurement error and ordinary fluctuation. For GAD-7 that is around four points. A two-point improvement is not evidence that anything worked, and a two-point worsening is not evidence that anything has gone wrong.',
          },
          {
            note: 'This is why the before-and-after on a path reports "no measurable change" instead of pointing at a direction, whenever the difference is smaller than the questionnaire can resolve.',
          },
        ],
      },
      {
        heading: 'These scores move on their own',
        blocks: [
          {
            p: 'A bad week of sleep, a cold, an exam, a fight, a fortnight that happened to contain a deadline — all of these move a score by several points without anything meaningful having changed about you. Over a short window that is most of what you are looking at.',
          },
        ],
      },
      {
        heading: 'What they genuinely cannot do',
        blocks: [
          {
            p: 'They cannot diagnose. Diagnosis involves history, duration, how much a thing is actually interfering with your life, and ruling out the medical and situational explanations — none of which fits in nine questions. A high score means the questions are worth taking to someone, and that is the whole of what it means.',
          },
          {
            p: 'There is one exception to the "it is only a number" framing. Items asking about self-harm or being better off dead are not scored like the rest; if one of those is true for you, that is worth acting on today, regardless of what the total came to.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Kroenke, K., Spitzer, R. L. & Williams, J. B. (2001). J Gen Intern Med 16(9), 606–613.',
        detail: 'The PHQ-9 validation study.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/',
      },
      {
        label: 'Spitzer, R. L. et al. (2006). Arch Intern Med 166(10), 1092–1097.',
        detail: 'The GAD-7 validation study.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16717171/',
      },
    ],
  },
  // ----------------------------------------------------------------- 5
  {
    id: 'a-positive-screen-is-not-a-diagnosis',
    title: 'A positive screen is not a diagnosis',
    standfirst:
      'The most misread thing about questionnaires: even an accurate screen is wrong more often than it is right, and the arithmetic behind that is worth ten minutes of your life.',
    topic: 'tests',
    minutes: 6,
    sections: [
      {
        heading: 'Two numbers every screening test has',
        blocks: [
          {
            p: 'Sensitivity is the share of people who have the thing and get flagged. Specificity is the share of people who do not have it and correctly do not get flagged. The PHQ-9 at a threshold of 10 was reported at about 88% on both in its original validation, which sounds close to conclusive.',
          },
          { p: 'It is not, and the reason is arithmetic rather than psychology.' },
        ],
      },
      {
        heading: 'Work it through with a thousand students',
        blocks: [
          {
            p: 'Say a hostel has a thousand students and one in ten is genuinely experiencing a depressive disorder. Everyone fills in a PHQ-9.',
          },
          {
            list: [
              'Of the 100 who do have it, 88% get flagged — 88 correct flags, and 12 people missed.',
              'Of the 900 who do not, 88% correctly pass. But 12% do not, and that is 108 people flagged who are fine.',
              'So 196 students screen positive, and only 88 of them have the thing being screened for.',
            ],
          },
          {
            p: 'Fewer than half — from a test that is right 88% of the time in both directions. If you screened positive, the single most likely explanation is still that you do not have a depressive disorder.',
          },
          {
            note: 'It gets worse as the condition gets rarer. At one in twenty rather than one in ten, the same test gives 44 true flags against 114 false ones: barely one positive in four is real.',
          },
        ],
      },
      {
        heading: 'Why the thresholds are set to over-refer anyway',
        blocks: [
          {
            p: 'Knowing all that, cut-offs are still placed deliberately to catch too many people rather than too few. That is a considered trade rather than an oversight: an unnecessary conversation costs an hour of someone’s time, and a missed case can cost considerably more.',
          },
          {
            p: 'The SCOFF is the clearest case in this app. Two yes answers out of five is a low bar, and it is meant to be, because eating disorders are dangerous, treatable, and easy to hide.',
          },
        ],
      },
      {
        heading: 'What to actually do with a high score',
        blocks: [
          {
            p: 'Treat it as a question rather than an answer. The useful response is a conversation with someone who can ask the follow-ups — how long, how much it is interfering, what else is going on, what changed. Those are what turn a flag into an assessment, and none of them fit on a form.',
          },
          {
            p: 'The wrong response is to conclude you have a condition. The other wrong response is to dismiss it because you have just read that most positives are false. Yours might be one of the true ones, and that is the entire reason the question is worth asking out loud.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Kroenke, K., Spitzer, R. L. & Williams, J. B. (2001). J Gen Intern Med 16(9), 606–613.',
        detail: 'Source of the sensitivity and specificity figures used above.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/',
      },
      {
        label: 'Levis, B., Benedetti, A. & Thombs, B. D. (2019). BMJ 365, l1476.',
        detail: 'Individual-participant meta-analysis: real-world PHQ-9 accuracy is generally lower than the original validation reported.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30967483/',
      },
    ],
  },

  // ----------------------------------------------------------------- 6
  {
    id: 'which-test-and-what-for',
    title: 'Which test, and what for',
    standfirst:
      'Twenty-one questionnaires is an unhelpful number to be offered when you are already not feeling well. Find the sentence below that sounds like yours.',
    topic: 'tests',
    minutes: 5,
    sections: [
      {
        heading: 'Start with one',
        blocks: [
          {
            p: 'The instinct on seeing a list this long is to work through it, and that is the one approach worth avoiding. Twenty-one scores is not twenty-one times the insight — it is a pile of overlapping numbers, several of which will appear to contradict each other, and an afternoon spent being measured.',
          },
          { p: 'Pick the one that matches what you are actually wondering about.' },
        ],
      },
      {
        heading: '“I feel flat, or low, or like nothing is interesting”',
        blocks: [
          {
            p: 'PHQ-9 asks about depression symptoms directly. WHO-5 reaches the same territory from the opposite side, asking what is present rather than what is wrong — some people find that far easier to answer honestly, and a low WHO-5 next to a mild PHQ-9 is a real and informative combination rather than a contradiction.',
          },
        ],
      },
      {
        heading: '“I can’t stop worrying” · “everything is too much”',
        blocks: [
          {
            p: 'GAD-7 for worry that will not switch off. PSS-10 when the problem is less anxiety than sheer load — it asks how unpredictable and uncontrollable the last month felt rather than what happened in it. K10 is the one for knowing something is wrong but not being able to say what.',
          },
        ],
      },
      {
        heading: '“I am exhausted” · “I can’t sleep”',
        blocks: [
          {
            p: 'The CBI personal burnout subscale measures exhaustion without mentioning work, which is why it transfers to students. AIS-8 is for sleep specifically, and it is worth doing before drawing conclusions from any of the others — badly slept people score worse on nearly every scale here.',
          },
        ],
      },
      {
        heading: '“I feel alone” · “I dread being looked at”',
        blocks: [
          {
            p: 'UCLA-3 is three questions and never uses the word lonely, deliberately. MSPSS asks the different and sometimes harder question of who you believe you could actually call. Mini-SPIN is for the specific fear of embarrassment and of being watched.',
          },
        ],
      },
      {
        heading: '“I am hard on myself” · “am I coping?”',
        blocks: [
          {
            p: 'RSES for overall self-worth; SCS-SF for how you treat yourself specifically when things have gone badly. On coping: BRS measures how quickly you recover, GSE-10 whether you believe you can handle what is coming, and the Flourishing Scale whether life is going well in the ways people actually care about.',
          },
        ],
      },
      {
        heading: 'The specific ones',
        blocks: [
          {
            list: [
              'PHQ-15 — persistent physical symptoms: headaches, stomach trouble, dizziness.',
              'PC-PTSD-5 — after something frightening or harmful happened to you.',
              'SCOFF — food and eating.',
              'SAS-SV and BSMAS — phone and social media use that has started to cost you something.',
              'AUDIT-C — how much you drink.',
            ],
          },
          {
            note: 'These are screens for particular things, and a positive result on any of them is a reason to talk to someone rather than a conclusion. PC-PTSD-5 asks you to think about the worst thing that has happened to you — it will keep until a day you have chosen.',
          },
        ],
      },
      {
        heading: 'Then leave it a fortnight',
        blocks: [
          {
            p: 'Most of these ask about the last two weeks or the last month, so taking the same one twice in a few days measures little beyond the difference between Tuesday and Thursday. The number starts being useful when you have two of them a proper interval apart.',
          },
        ],
      },
    ],
    sources: [],
  },

  // ----------------------------------------------------------------- 7
  {
    id: 'where-your-answers-go',
    title: 'Where your answers go',
    standfirst:
      'What Sahaya stores when you finish a questionnaire, who can read it, and what happens if you answer one particular question.',
    topic: 'tests',
    minutes: 4,
    sections: [
      {
        heading: 'What is kept',
        blocks: [
          {
            p: 'When you submit a questionnaire, Sahaya stores your individual answers — not only the total. It also keeps the score, the band, the date, and which questionnaire it was.',
          },
          {
            p: 'That is more than the result screen needs, and it is the kind of thing worth knowing before you answer rather than after.',
          },
        ],
      },
      {
        heading: 'Who can read it',
        blocks: [
          {
            p: 'Your counsellor. The console shows the people assigned to it, and for each person their check-ins, their inkblot sittings and their questionnaire results, newest first.',
          },
          {
            p: 'That is the design of the app rather than an unfortunate side effect. Sahaya was built for a hostel where somebody is responsible for the students in it, and a screening result nobody ever reads is not much use to anyone. But it does mean this is not a private diary and should not be treated as one.',
          },
          {
            note: 'If what you want is somewhere to think without it being read, the grounding practices record only that you practised — never what you were feeling, and never anything you wrote.',
          },
        ],
      },
      {
        heading: 'The one question that is treated differently',
        blocks: [
          {
            p: 'Item 9 of the PHQ-9 asks about thoughts of being better off dead or of hurting yourself. Answering anything other than “not at all” does two things immediately: it puts crisis contacts on your screen, and it flags that result in the counsellor console.',
          },
          {
            p: 'The flag does not depend on your total. Someone can answer that item positively and still land in a band labelled mild, and the app deliberately does not let the total bury it.',
          },
          {
            p: 'It is the only item wired this way, because it is the only one that asks about self-harm directly. Which is worth stating plainly: answer it honestly and someone will see.',
          },
        ],
      },
      {
        heading: 'And if that is not what you want today',
        blocks: [
          {
            p: 'Then do not fill one in. Nothing here is compulsory, nothing is scored on whether you took it, and a questionnaire answered dishonestly because you were worried about who would read it is worse than no questionnaire at all.',
          },
          {
            p: 'The crisis contacts on every screen go to people who are not your counsellor and who do not know your name.',
          },
        ],
      },
    ],
    sources: [],
  },
];

export const ARTICLE_IDS = ARTICLES.map((a) => a.id);

export function getArticle(id) {
  return ARTICLES.find((a) => a.id === id) || null;
}

// Topic drives the accent only. The reading section has one hue of its own;
// these tint individual cards so a run of articles is scannable by subject.
export const TOPICS = {
  inkblot: { label: 'Inkblots', hue: 'var(--sec-inkblot)' },
  calm: { label: 'Calm', hue: 'var(--sec-calm)' },
  tests: { label: 'Questionnaires', hue: 'var(--sec-tests)' },
};
