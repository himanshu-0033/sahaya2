// What a student brought to the companion, sorted into the buckets a campus
// counsellor works from: study pressure, relationships, placements, family,
// and everything else.
//
// A conversation gets its topics two ways. The student can tap one when the
// chat opens, which is their own label and is taken as given. Or they just
// talk, and the words they use are matched against the lists below. The match
// runs on the server when the transcript is saved, so the console's idea of
// what a conversation is about never depends on what a client claims.
//
// LIMITS, the same as safety.js: this is word matching. "My exams are next
// week" is caught, "I can't face that hall again" is not, and a student who
// mentions their dad while talking about an internship lands in two buckets.
// It tells a counsellor which students to reach and roughly why; the
// transcript, one click away, is what they actually said.
//
// ponytail: keyword lists, not a model. Have the agent's provider label the
// transcript if these miss too much in real use.
export const TOPICS = [
  {
    id: 'study',
    label: 'Study pressure',
    words: [
      'study', 'studies', 'studying', 'exam', 'exams', 'marks', 'grades', 'gpa', 'cgpa',
      'backlog', 'backlogs', 'assignment', 'assignments', 'syllabus', 'semester',
      'revision', 'attendance', 'lecture', 'lectures', 'viva', 'deadline', 'deadlines',
      'homework', 'coursework', 'thesis', 'jee', 'neet', 'coaching', 'padhai',
    ],
  },
  {
    id: 'relationship',
    label: 'Relationships',
    words: [
      'relationship', 'relationships', 'girlfriend', 'boyfriend', 'breakup', 'break up',
      'broke up', 'crush', 'partner', 'cheated', 'my ex', 'friendship', 'roommate',
      'roommates',
    ],
  },
  {
    id: 'placement',
    label: 'Placements',
    words: [
      'placement', 'placements', 'internship', 'internships', 'interview', 'interviews',
      'job', 'jobs', 'offer letter', 'recruiter', 'recruiters', 'resume', 'cv',
      'shortlisted', 'campus drive', 'career', 'lpa', 'ctc', 'aptitude', 'naukri',
    ],
  },
  {
    id: 'family',
    label: 'Family',
    words: [
      'family', 'parents', 'parent', 'mom', 'mum', 'mother', 'mummy', 'dad', 'father',
      'papa', 'brother', 'sister', 'sibling', 'siblings', 'relatives', 'divorce',
      'at home', 'back home', 'ghar',
    ],
  },
  // Only ever chosen, never detected. It exists so "something is wrong and it
  // is none of those" still reaches a counsellor.
  { id: 'other', label: 'Something else', words: [] },
];

const PATTERNS = TOPICS.filter((t) => t.words.length).map((t) => ({
  id: t.id,
  re: new RegExp(`\\b(?:${t.words.join('|')})\\b`),
}));

export function isTopic(id) {
  return TOPICS.some((t) => t.id === id);
}

export function topicLabel(id) {
  return TOPICS.find((t) => t.id === id)?.label || id;
}

// The student's own pick plus whatever their words match, in TOPICS order.
// "Something else" is dropped once anything specific turns up, because a
// counsellor filtering by Family should find the student who tapped "other"
// and then spent the conversation on their parents.
export function topicsFor({ chosen = null, turns = [] }) {
  const said = turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join('\n')
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const found = new Set(PATTERNS.filter((p) => p.re.test(said)).map((p) => p.id));
  if (isTopic(chosen)) found.add(chosen);
  if (found.size > 1) found.delete('other');
  return TOPICS.map((t) => t.id).filter((id) => found.has(id));
}
