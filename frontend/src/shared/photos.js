// The app's photography.
//
// Every one of these is an Unsplash photo under the Unsplash License: free for
// commercial use, no permission and no attribution required. Source ids are in
// public/photos/CREDITS.md so a future reader can find the original.
//
// Self-hosted rather than hot-linked from images.unsplash.com, which would
// have been two fewer lines. This app's whole pitch is that nobody sees what
// you do in it, and an image CDN embedded in every card would see the IP and
// the referring page of every user on every screen. 676KB of JPEG is a cheap
// price for not making that request.
//
// Keyed by what the picture is FOR, not what it shows, so swapping the actual
// photograph later is a one-line change here and nothing else moves.
export const PHOTO = {
  calm: '/photos/calm.jpg',
  paths: '/photos/paths.jpg',
  tests: '/photos/tests.jpg',
  read: '/photos/read.jpg',
  inkblot: '/photos/inkblot.jpg',
  stillness: '/photos/stillness.jpg',
  water: '/photos/water.jpg',
  forest: '/photos/forest.jpg',
  night: '/photos/night.jpg',
  trail: '/photos/trail.jpg',
  // The landing page's hero: the forest photograph, re-cropped tall.
  hero: '/photos/hero.jpg',
};

// The five paths ship from the backend, so their pictures are matched here by
// id rather than travelling with the data. `forest` is the fallback: a new
// path added server-side gets a sensible image instead of a broken one.
const PATH_PHOTO = {
  steadier: PHOTO.trail,
  'winding-down': PHOTO.night,
  'less-noise': PHOTO.forest,
  'own-side': PHOTO.calm,
  'exam-week': PHOTO.tests,
};

export function pathPhoto(id) {
  return PATH_PHOTO[id] || PHOTO.forest;
}

// Read articles carry a topic, not a picture. Same idea.
const TOPIC_PHOTO = {
  calm: PHOTO.water,
  tests: PHOTO.tests,
  inkblot: PHOTO.inkblot,
};

export function topicPhoto(topic) {
  return TOPIC_PHOTO[topic] || PHOTO.stillness;
}

// Seven articles over three topics put the same fountain pen on four cards in
// a row once the home page started showing them side by side. So each article
// gets its own, and the topic picture is the fallback for a new one.
const ARTICLE_PHOTO = {
  'the-inkblots-honestly': PHOTO.inkblot,
  'why-a-long-exhale-works': PHOTO.water,
  'which-technique-when': PHOTO.forest,
  'what-a-score-means': PHOTO.tests,
  'a-positive-screen-is-not-a-diagnosis': PHOTO.stillness,
  'which-test-and-what-for': PHOTO.trail,
  'where-your-answers-go': PHOTO.read,
};

export function articlePhoto(article) {
  return ARTICLE_PHOTO[article.id] || topicPhoto(article.topic);
}

// The six grounding families. Reuses the set above rather than adding six more
// files: these are 56px thumbnails beside a heading, not hero images, and a
// dedicated photograph per family would be 400KB spent on something the eye
// reads as a colour swatch.
const FAMILY_PHOTO = {
  breath: PHOTO.water,
  senses: PHOTO.forest,
  body: PHOTO.paths,
  mind: PHOTO.stillness,
  kindness: PHOTO.calm,
  rest: PHOTO.night,
};

export function familyPhoto(id) {
  return FAMILY_PHOTO[id] || PHOTO.stillness;
}
