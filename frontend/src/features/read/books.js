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
//      are on Reading Well Books on Prescription — chosen by health experts
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
// `evidence` is that research line. `note` is the caution — not a review and
// never a reason not to read, but the thing a friend would say while handing
// you the book. No shop links and no affiliate codes; most of these sit in a
// college library.

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
        why: 'A workbook rather than a book about a method — you fill in the sheets and watch your own thinking on paper. Start here if you only ever open one of these.',
        evidence:
          'Named the most influential cognitive therapy book ever written by the British Association for Behavioural and Cognitive Psychotherapies, and carried on the Reading Well list. Second edition; the foreword is by Aaron Beck, who built CBT.',
      },
      {
        title: 'Feeling Good: The New Mood Therapy',
        author: 'David D. Burns',
        year: 1980,
        why: 'The book that put cognitive therapy in ordinary hands. Old, plain, and still the standard recommendation.',
        evidence:
          'The one depression self-help book to have met the "probably efficacious treatment" standard on its own — meta-analyses of bibliotherapy for depression put the effect around d = 0.8. Almost nothing else on a self-help shelf can say that.',
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
        why: 'Acceptance and commitment therapy without the jargon. Its argument — that trying to get rid of a feeling is often what keeps it — is the one most people have never heard.',
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
    blurb: 'Drawing as a way of settling — with the research, which is smaller than the claims made for it.',
    books: [
      {
        title: 'Creating Mandalas: For Insight, Healing, and Self-Expression',
        author: 'Susanne F. Fincher',
        year: 1991,
        why: 'The practical one. Fincher is a Jungian-oriented art therapist and a board-certified art therapist, and this is a guide to actually making them — materials, colour, the recurring shapes — rather than a book about them.',
        evidence:
          'The research such as it is: Curry and Kasser (Art Therapy, 2005) had 84 undergraduates colour a mandala, a plaid pattern, or blank paper. Anxiety fell in the mandala and plaid groups about equally, and more than in the blank group — so what helped looked like the structure, not the mandala. A 2012 replication in the same journal disagreed, finding the mandala did beat the plaid. Two small student studies that do not agree. Worth doing, not worth overclaiming.',
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
        why: 'A readable tour of why how you breathe changes how you feel — the territory the long-exhale practice in this app comes from.',
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
        why: 'The non-fiction that followed, after readers wrote to Pinto with their own. Accounts by families of living alongside someone who is ill — the part nobody puts in a pamphlet.',
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
        why: 'A psychiatrist on what let some people survive the camps — that meaning, not comfort, is what a person holds on by. The most quoted book about suffering there is.',
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
        note: 'It is also the most disputed book here, and the dispute is not a quibble. A 2025 review in BJPsych Bulletin went through 122 of its claims and found the ones about trauma-induced brain damage unsupported by current research; a 2023 editorial in Research on Social Work Practice said this literature can "veer into or close to pseudoscience". It is also cool on CBT — the approach with the strongest evidence behind it, and the one the exercises in this app are built from. Read it for why it lands with people. Do not let it talk you out of a treatment that works.',
      },
    ],
  },
];
