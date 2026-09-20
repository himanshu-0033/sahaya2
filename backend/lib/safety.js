// Crisis screening for free text a resident submits to the backend: reflection
// answers, inkblot responses, and the companion's transcripts when they are
// saved.
//
// This deliberately duplicates agent/lib/safety.js rather than importing it:
// `agent/` is its own independently deployed Vercel project and the two do not
// share a node_modules or a build. PATTERNS and HELPLINES_BY_CATEGORY must match
// the agent's PATTERNS and HELPLINES exactly; backend/test/reflection.test.mjs
// imports both and fails if they drift. See the agent's copy for the reasoning
// behind the three categories and the limits of matching on words.
//
// LIMITS, stated plainly: this is pattern matching. It will miss indirect
// phrasing, sarcasm, metaphor, unusual spelling and many real disclosures, and
// will sometimes fire on a quoted news story. It is a safety net that fails
// toward showing help, never a detector to rely on alone or a substitute for a
// human.
export const PATTERNS = {
  suicide: [
    'kill(ing)? myself', 'end(ing)? my life', 'take my (own )?life', 'taking my (own )?life',
    'want(ed)? to die', 'wanna die', 'wish i (was|were) dead', 'better off dead',
    'better off without me', 'be better without me', 'nobody would miss me', 'no one would miss me',
    "(don't|dont|do not) want to (live|be alive|exist)", 'no reason to (live|go on)',
    'not worth living', 'no point (in )?(living|being alive)', 'suicide', 'suicidal', 'unalive',
    'end it all', 'sleep and (not|never) wake up', '(not|never) wake up again', 'disappear forever',
    "(can't|cant|cannot) go on (living|anymore)", 'goodbye forever',
    // Hinglish
    'marna chaht[ai]', 'mar jaa?na chaht[ai]', 'mar jaa?u(n|nga|ngi)', 'khudkushi', 'aa?tmhatya',
    'jee?na nahi chaht[ai]', 'jee?ne ka (mann|man) nahi', 'zinda nahi rehna', 'suicide kar',
  ],
  self_harm: [
    '(hurt|hurting|harm|harming|cut|cutting|burn|burning) myself', 'self[- ]?harm', 'overdose',
    'od on', 'hitting myself', 'punish(ing)? myself physically',
    // Hinglish
    'khud ko (hurt|nuksan|chot)', '(haath|hath|nas|nass) kaat',
  ],
  abuse: [
    // Someone doing it to them. The subject is required: "that song hits me"
    // and "the heat is killing me" are not disclosures.
    '(he|she|they|dad|papa|mom|mummy|seniors|my (dad|father|papa|mom|mum|mother|mummy|husband|boyfriend|girlfriend|partner|brother|sister|uncle|aunt|teacher|senior|seniors|roommate|relative|cousin|stepfather|stepmother|boss|parents|family)) (keeps |always |)(hits|hit|beats|beat|slaps|slapped|kicks|kicked|chokes|choked|abuses|abused|molests|molested|harasses|harassed|threatens|threatened) me',
    '(abusing|harassing|molesting) me', 'beat(s)? me up', 'being abused', 'was abused', 'domestic violence',
    'raped', 'rape', 'molested', 'sexual(ly)? (assault(ed)?|harass(ed|ment)|abus(e|ed))',
    'touch(es|ed)? me (inappropriately|without)', 'forced (me )?(into )?sex', 'threaten(s|ed)? to kill me',
    'blackmail(s|ed|ing)? me', 'leak(ed)? my (photos|pictures|videos)', 'ragging', 'ragged',
    // Hinglish
    'maar(te|ta|ti) (hai|hain|he)', 'mujhe maar', 'pee?t(te|ta|ti) (hai|hain)', 'chhed(ta|te|ti|khani)',
  ],
};

const ORDER = ['suicide', 'self_harm', 'abuse'];

const COMPILED = ORDER.map((category) => ({
  category,
  re: new RegExp(`\\b(?:${PATTERNS[category].join('|')})\\b`),
}));

export const LABELS = {
  suicide: 'suicide',
  self_harm: 'self-harm',
  abuse: 'abuse or violence',
};

// Verified September 2026. KIRAN (1800-599-0019) was merged into Tele-MANAS;
// iCall answers Monday to Saturday, 8am to 9pm, and its landline 022-25521111
// is the line icallhelpline.org currently shows as available; the mobile
// 9152987821 reads NOT AVAILABLE NOW there. Vandrevala's national number
// is +91 9999 666 555.
const EMERGENCY = { name: 'Emergency (police, ambulance)', number: '112' };
const TELE_MANAS = { name: 'Tele-MANAS, Govt. of India mental health line, 24/7', number: '14416' };

export const HELPLINES_BY_CATEGORY = {
  suicide: [
    EMERGENCY,
    TELE_MANAS,
    { name: 'Vandrevala Foundation, 24/7', number: '+91 9999 666 555' },
    { name: 'AASRA, 24/7', number: '022-27546669' },
    { name: 'iCall (TISS), Mon to Sat 8am to 9pm', number: '022-25521111' },
  ],
  abuse: [
    EMERGENCY,
    { name: 'Women Helpline, 24/7', number: '181' },
    { name: 'National Commission for Women, 24/7, call or WhatsApp', number: '7827170170' },
    { name: 'Childline, for anyone under 18, 24/7', number: '1098' },
    TELE_MANAS,
  ],
};
HELPLINES_BY_CATEGORY.self_harm = HELPLINES_BY_CATEGORY.suicide;

// What a questionnaire or the inkblot test shows alongside a crisis flag.
export const HELPLINES = HELPLINES_BY_CATEGORY.suicide;

// Shown when someone says the thoughts are happening right now. It does not
// vary by instrument, because at that point which questionnaire asked is the
// least relevant fact on the screen.
export const ACUTE_MESSAGE =
  'You said you are having these thoughts right now. Please do not sit with this alone. Call one of the numbers below, or go to the nearest hospital emergency department. If someone is with you, tell them now.';

function normalise(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/\s+/g, ' ');
}

export function screenForCrisis(text) {
  const said = normalise(text);
  for (const { category, re } of COMPILED) {
    const m = said.match(re);
    if (m) return { flagged: true, category, matched: m[0] };
  }
  return { flagged: false, category: null, matched: null };
}

// Screens a whole set of responses at once. Returns which plates matched so
// a counsellor can go straight to the response rather than reading ten.
export function screenResponses(responses) {
  const hits = [];
  for (const r of responses) {
    const { flagged, matched, category } = screenForCrisis(r.text);
    if (flagged) hits.push({ plateId: r.plateId, matched, category });
  }
  return { flagged: hits.length > 0, hits };
}

// The categories a companion transcript touched, in order of urgency. Only the
// resident's own lines are read: the assistant's replies name these topics on
// purpose, and would otherwise flag every conversation they appear in.
export function screenTranscript(turns) {
  const found = new Set(
    (turns || [])
      .filter((t) => t.role === 'user')
      .map((t) => screenForCrisis(t.content).category)
      .filter(Boolean),
  );
  return ORDER.filter((c) => found.has(c));
}
