// Books worth the time.
//
// Everything else in Reading is this app explaining itself. Useful, and also a
// closed loop: nothing here sent anyone to work that has outlived a product
// cycle, and a student gets more from one of these than from anything we write.
//
// HOW THE LIST WAS BUILT, because "recommended reading" usually means "books
// somebody liked". Three tests, in order:
//
//   1. Is it on a list somebody clinical put their name to? Several of these
//      are on Reading Well Books on Prescription, chosen by health experts
//      and people with lived experience, endorsed by the British
//      Psychological Society, and stocked by public libraries in England and
//      Wales on that basis.
//   2. Has reading it, by itself, been tested? Bibliotherapy is a real
//      research area. Where a book has been through trials, the entry says so
//      and what was found.
//   3. Is it famous and also disputed? Then the dispute is in the entry, named
//      and sourced. A reader who finds out later that we knew has been sold
//      something.
//
// `evidence` is that research line. `note` is the caution. It is not a review
// and never a reason not to read, but the thing a friend would say while
// handing you the book. No shop links and no affiliate codes; most of these
// sit in a college library.

// The papers this app is actually built on.
//
// Separate from the books because they are a different kind of thing: one
// study each, with what it found and what it did not. Every exercise in here
// came from somewhere, and a student who wants to check whether we are making
// it up should be able to go and read the paper rather than take our word.
//
// `limits` is not optional. A finding quoted without its sample size and its
// caveats is advertising.
export const PAPERS = [
  {
    claim: 'Why the app keeps telling you to make the exhale longer',
    citation:
      'Yilmaz Balban, M., Neri, E., Kogon, M., et al. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine, 4(1).',
    finding:
      'A randomised, controlled study out of Stanford, run by David Spiegel and Andrew Huberman. Participants did five minutes a day for a month of one of three breathing patterns, or mindfulness meditation. Cyclic sighing, the one that emphasises a long exhale, beat the others and beat meditation on mood improvement and on slowing the breath.',
    limits:
      'Five minutes a day for one month, in healthy volunteers, self-reporting their own mood at home. It is not a treatment trial and nobody in it was being treated for anything.',
    practice: { to: '/grounding/cyclic-sighing', label: 'Cyclic sighing' },
  },
  {
    claim: 'Why the check-in asks you to put it in words',
    citation:
      'Pennebaker, J. W., and Beall, S. K. (1986). Confronting a traumatic event. Journal of Abnormal Psychology, 95(3). Reviewed in Pennebaker, J. W. (2018), Expressive Writing in Psychological Science.',
    finding:
      'The experiment that started a whole research area. Students wrote about a distressing experience for fifteen minutes a day across four days. Over the following six months they turned up at the student health centre at roughly half the rate of students who wrote about nothing in particular.',
    limits:
      'Effects across the hundreds of studies since are real but modest, and they are not the same for everyone. Writing about something raw can leave you feeling worse for a day or two before it helps.',
  },
  {
    claim: 'Whether colouring a mandala does anything',
    citation:
      'Curry, N. A., and Kasser, T. (2005). Can coloring mandalas reduce anxiety? Art Therapy, 22(2). Replication: Art Therapy, 29(2), 2012.',
    finding:
      'Eighty-four undergraduates coloured a mandala, a plaid pattern, or blank paper. Anxiety dropped about the same for the mandala and the plaid, and more than for the blank sheet, which suggests what helped was having a structure to fill in. The 2012 replication found the mandala did beat the plaid.',
    limits:
      'Two small studies on students that disagree with each other. Enough to say it is worth twenty minutes, nowhere near enough to say the mandala shape is doing something special.',
  },
];

export const SHELVES = [
  {
    id: 'practical',
    title: 'Things you can actually do',
    blurb: 'Methods, from the people who built them. The most tested shelf here.',
    books: [
      {
        title: 'Mind Over Mood: Change How You Feel by Changing the Way You Think',
        author: 'Dennis Greenberger and Christine A. Padesky',
        year: 2015,
        why: 'A workbook rather than a book about a method. You fill in the sheets and watch your own thinking on paper. Start here if you only ever open one of these.',
        evidence:
          'Named the most influential cognitive therapy book ever written by the British Association for Behavioural and Cognitive Psychotherapies, and carried on the Reading Well list. Second edition; the foreword is by Aaron Beck, who built CBT.',
      },
      {
        title: 'Feeling Good: The New Mood Therapy',
        author: 'David D. Burns',
        year: 1980,
        why: 'The book that put cognitive therapy in ordinary hands. Old, plain, and still the standard recommendation.',
        evidence:
          'The one depression self-help book to have met the "probably efficacious treatment" standard on its own. Meta-analyses of bibliotherapy for depression put the effect at around d = 0.8. Almost nothing else on a self-help shelf can say that.',
      },
      {
        title: 'Overcoming Depression and Low Mood: A Five Areas Approach',
        author: 'Chris Williams',
        why: 'Built as a course, not a read: short workbooks on one problem at a time. Williams’s Five Areas material is used across the NHS, which is a stranger endorsement than a good review.',
      },
      {
        title: 'The Happiness Trap',
        author: 'Russ Harris',
        year: 2007,
        why: 'Acceptance and commitment therapy without the jargon. Its argument, that trying to get rid of a feeling is often what keeps it, is the one most people have never heard.',
      },
      {
        title: 'Full Catastrophe Living',
        author: 'Jon Kabat-Zinn',
        year: 1990,
        why: 'The source text for MBSR, which is where most of the eight-week mindfulness courses in the world came from.',
        note: 'Long, and it is a programme rather than an evening. Read it when you have the weeks to give it.',
      },
    ],
  },
  {
    id: 'mandala',
    title: 'Mandalas, and what is actually known about them',
    blurb: 'Drawing as a way of settling. The research is smaller than the claims made for it.',
    books: [
      {
        title: 'Creating Mandalas: For Insight, Healing, and Self-Expression',
        author: 'Susanne F. Fincher',
        year: 1991,
        why: 'The practical one. Fincher is a Jungian-oriented psychotherapist and a board-certified art therapist, and this is a guide to actually making them, covering materials, colour and the shapes that keep recurring, rather than a book about them.',
        evidence:
          'The research, such as it is: Curry and Kasser (Art Therapy, 2005) had 84 undergraduates colour a mandala, a plaid pattern, or blank paper. Anxiety fell in the mandala and plaid groups about equally, and more than in the blank group. What helped looked like the structure, not the mandala. A 2012 replication in the same journal disagreed and found the mandala did beat the plaid. Two small student studies that do not agree. Worth doing, not worth overclaiming.',
      },
      {
        title: 'Mandala: Luminous Symbols for Healing',
        author: 'Judith Cornell',
        year: 1994,
        why: 'Exercises in drawing mandalas as a meditative practice, tracing the symbolism across the traditions it came from rather than only the Western reading of it.',
      },
      {
        title: 'Memories, Dreams, Reflections',
        author: 'C. G. Jung',
        year: 1961,
        why: 'Where the idea entered Western psychology at all. Jung drew a mandala most mornings for years and worked out what he thought they were doing from that; this is him telling it himself.',
        note: 'Jung is read now for how he thought, not as tested method. His framework never went through trials the way the cognitive work above did.',
      },
    ],
  },
  {
    id: 'nobel',
    title: 'Wrote the science, then wrote for the rest of us',
    blurb:
      'Two laureates who went back and explained it in plain language. Worth knowing first: there is no Nobel Prize in psychology. Kahneman took his in economic sciences and Kandel his in medicine, so anyone selling you a "Nobel prize-winning psychologist" is rounding up.',
    books: [
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        year: 2011,
        why: 'Forty years of work on how judgement actually goes wrong, written for anyone. The thinking traps CBT asks you to catch in yourself are, more or less, the ones mapped in here.',
        evidence:
          'Kahneman was a psychologist who took the 2002 Nobel Memorial Prize in Economic Sciences, for putting human judgement back into a field that had assumed people were rational. He died in 2024.',
        note: 'Some of the priming studies it cites came out badly in psychology’s replication crisis, and Kahneman said so himself. The core work on judgement held up; the chapter on priming did not.',
      },
      {
        title: 'In Search of Memory',
        author: 'Eric R. Kandel',
        year: 2006,
        why: 'Half memoir of a boy who got out of Vienna in 1939, half the story of working out what a memory physically is. The best answer here to why a bad experience can still be doing something to you years later.',
        evidence:
          'Kandel shared the 2000 Nobel Prize in Physiology or Medicine for showing how memory is stored in neurons.',
      },
    ],
  },
  {
    id: 'body',
    title: 'Why your body does this',
    blurb: 'For when the racing heart and the sleepless night need explaining, not soothing.',
    books: [
      {
        title: "Why Zebras Don't Get Ulcers",
        author: 'Robert M. Sapolsky',
        year: 1994,
        why: 'A Stanford neurobiologist on what a stress response is for. A zebra’s emergency lasts two minutes; yours can last a term, and the same machinery that saves the zebra is what wears you down. Funny, and the best answer to "why does worry make me ill".',
      },
      {
        title: 'Breath: The New Science of a Lost Art',
        author: 'James Nestor',
        year: 2020,
        why: 'A readable tour of why how you breathe changes how you feel. It is the territory the long-exhale practice in this app comes from.',
        note: 'Journalism, not a review of the evidence. Several claims in it run well ahead of what has been shown. Enjoy it; do not plan around it.',
      },
    ],
  },
  {
    id: 'india',
    title: 'Written from here',
    blurb: 'Indian families, Indian hospitals, and what illness does inside a house.',
    books: [
      {
        title: 'Em and the Big Hoom',
        author: 'Jerry Pinto',
        year: 2012,
        why: 'A novel about growing up in a one-bedroom Mumbai flat with a mother who has bipolar disorder. Widely held to be the finest thing written about mental illness in an Indian family, and very funny in places.',
      },
      {
        title: 'A Book of Light',
        author: 'edited by Jerry Pinto',
        why: 'The non-fiction that followed, after readers wrote to Pinto with their own. Accounts by families of living alongside someone who is ill. It is the part nobody puts in a pamphlet.',
      },
      {
        title: 'How to Travel Light: My Memories of Madness and Melancholia',
        author: 'Shreevatsa Nevatia',
        year: 2017,
        why: 'A journalist on his own bipolar disorder and on the Indian psychiatric system as a patient meets it. Unsparing about both.',
      },
    ],
  },
  {
    id: 'bad-patch',
    title: 'When you are in it',
    blurb: 'Written by people who have been where you are, rather than about them.',
    books: [
      {
        title: 'Reasons to Stay Alive',
        author: 'Matt Haig',
        year: 2015,
        why: 'A short account of a breakdown at twenty-four and the years after it. The closest thing here to being talked to by someone who gets it, and it can be read in two sittings.',
      },
      {
        title: "Man's Search for Meaning",
        author: 'Viktor E. Frankl',
        year: 1946,
        why: 'A psychiatrist on what let some people survive the camps: that meaning, not comfort, is what a person holds on by. The most quoted book about suffering there is.',
        note: 'It is a Holocaust memoir before it is a psychology book. Heavy going in a bad week.',
      },
    ],
  },
  {
    id: 'trauma',
    title: 'If something happened',
    blurb: 'The most read book on trauma, and the argument about it.',
    books: [
      {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        year: 2014,
        why: 'The book that made "trauma lives in the body" a phrase ordinary people use. Close to 300 weeks on the New York Times list, and many readers say it was the first time their own reactions made sense to them.',
        note: 'It is also the most disputed book here, and the dispute is not a quibble. A 2025 review in BJPsych Bulletin went through 122 of its claims and found the ones about trauma-induced brain damage unsupported by current research. A 2023 editorial in Research on Social Work Practice said this literature can "veer into or close to pseudoscience". It is also cool on CBT, the approach with the strongest evidence behind it and the one the exercises in this app are built from. Read it for why it lands with people. Do not let it talk you out of a treatment that works.',
      },
    ],
  },
];
