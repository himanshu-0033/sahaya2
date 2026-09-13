// Books worth the time.
//
// Everything else in Reading is this app explaining itself. Useful, and also a
// closed loop: nothing here sent anyone to a book that has outlived a product
// cycle. These are the ones people actually recommend to each other, which is a
// harder test than being new.
//
// SAME RULE AS THE ARTICLES. A recommendation is a claim strong enough to
// change what someone does, so it carries its reason — and where a book is
// famous and also disputed, that goes in the entry rather than being left out
// to keep the list tidy. A reader who finds out later that the neuroscience in
// a bestseller is contested, and that we knew, has been sold something.
//
// `note` is that caution. It is not a review and never a reason not to read;
// it is the thing a friend would say while handing you the book.
//
// No shop links, no affiliate codes, no editions. Titles and authors are enough
// to find a copy, and most of these sit in a college library.

export const SHELVES = [
  {
    id: 'bad-patch',
    title: 'When you are in it',
    blurb: 'Written by people who have been where you are, rather than about them.',
    books: [
      {
        title: 'Reasons to Stay Alive',
        author: 'Matt Haig',
        year: 2015,
        why: 'A short account of a breakdown at twenty-four and the years after it. The closest thing on this list to being talked to by someone who gets it, and it can be read in two sittings.',
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
    id: 'practical',
    title: 'Things you can actually do',
    blurb: 'The methods behind the exercises in this app, from the people who built them.',
    books: [
      {
        title: 'Feeling Good: The New Mood Therapy',
        author: 'David D. Burns',
        year: 1980,
        why: 'The book that put cognitive therapy in ordinary hands. Old, plain, and still the standard recommendation — reading it on its own has been tested against depression and holds up, which almost no self-help book can say.',
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
        why: 'The source text for MBSR, which is where most of the eight-week mindfulness courses in the world came from. Long; it is a programme, not an evening.',
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
        why: 'A neuroscientist on what a stress response is for, and what happens when one built for a two-minute emergency is left running for a term. Funny, and the best answer to "why does worry make me ill".',
      },
      {
        title: 'Breath: The New Science of a Lost Art',
        author: 'James Nestor',
        year: 2020,
        why: 'A readable tour of why how you breathe changes how you feel — the territory the long-exhale practice in this app comes from.',
        note: 'Journalism, not a review of the evidence. Some claims in it run well ahead of what has been shown.',
      },
    ],
  },
  {
    id: 'mandala',
    title: 'Mandalas, and where they come from',
    blurb: 'Drawing as a way of thinking — the tradition behind the plates in this app.',
    books: [
      {
        title: 'Creating Mandalas: For Insight, Healing, and Self-Expression',
        author: 'Susanne F. Fincher',
        year: 1991,
        why: 'The practical one. Fincher is a Jungian-oriented art therapist, and this is a guide to actually making mandalas — materials, colour, what the recurring shapes tend to mean — rather than a book about them.',
      },
      {
        title: 'Mandala: Luminous Symbols for Healing',
        author: 'Judith Cornell',
        year: 1994,
        why: 'Exercises in drawing mandalas as a meditative practice, with the symbolism traced across the traditions it came from rather than only the Western reading of it.',
      },
      {
        title: 'Memories, Dreams, Reflections',
        author: 'C. G. Jung',
        year: 1961,
        why: 'Where the idea entered Western psychology at all. Jung drew a mandala most mornings for years and worked out what he thought they were doing from that; this is him telling it himself.',
        note: 'Jung is read now for how he thought, not as tested method. His framework was never put through trials the way the cognitive and mindfulness work above was.',
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
        why: 'The non-fiction that followed, after people wrote to Pinto with their own. Accounts by families of living alongside someone who is ill — the part nobody puts in a pamphlet.',
      },
      {
        title: 'How to Travel Light: My Memories of Madness and Melancholia',
        author: 'Shreevatsa Nevatia',
        year: 2017,
        why: 'A journalist on his own bipolar disorder and the Indian psychiatric system as a patient meets it. Unsparing about both.',
      },
    ],
  },
  {
    id: 'trauma',
    title: 'If something happened',
    blurb: 'One book, with its argument and its critics named.',
    books: [
      {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        year: 2014,
        why: 'The book that made "trauma lives in the body" a phrase ordinary people use. Many readers say it was the first time their own reactions made sense to them.',
        note: 'Also the most disputed book on this list. Clinicians and researchers have challenged parts of the neuroscience and some of the treatment claims. Worth reading, worth not treating as settled.',
      },
    ],
  },
];
