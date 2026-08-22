// The ten plates used by the inkblot reflection.
//
// These are the original Rorschach plates (Hermann Rorschach, 1921), served
// from frontend/public/plates/. Rorschach died in 1922, so the images are in
// the public domain worldwide; they were taken from Wikimedia Commons, which
// records them as such.
//
// WHAT THIS IS NOT. A real Rorschach administration is done one-to-one by a
// trained clinician and scored against a formal coding system (Exner, R-PAS)
// that looks at *how* someone answers — location, determinants, form quality —
// not at what they say they see. None of that happens here and none of it
// could: this screen collects free text and reflects it back. So the plates
// are the real ones, but the exercise is not the test, and every string the
// user sees has to keep saying so.
//
// There is a live argument in clinical psychology against publishing these at
// all, on the grounds that prior exposure changes how someone responds if they
// later sit the real thing. That argument is worth knowing about. It is also
// somewhat moot — the plates have been on Wikipedia since 2009 — but it is the
// reason this file previously used invented shapes instead.
//
// `path` is kept on every plate as a fallback: it is an original abstract
// shape, drawn as the LEFT half only (viewBox centred at x=0) and mirrored by
// the client, and it renders if the image fails to load.
export const PLATES = [
  {
    id: 'plate-01',
    image: '/plates/rorschach-01.jpg',
    label: 'Plate I',
    path: 'M0,-86 C-32,-90 -58,-70 -66,-44 C-76,-14 -50,-6 -62,18 C-74,42 -52,54 -38,70 C-24,84 -10,82 0,86 Z',
  },
  {
    id: 'plate-02',
    image: '/plates/rorschach-02.jpg',
    label: 'Plate II',
    path: 'M0,-92 C-28,-92 -44,-62 -34,-42 C-24,-22 -54,-16 -58,8 C-62,32 -38,28 -44,52 C-50,78 -18,88 0,92 Z',
  },
  {
    id: 'plate-03',
    image: '/plates/rorschach-03.jpg',
    label: 'Plate III',
    path: 'M0,-78 C-18,-84 -48,-74 -54,-50 C-60,-26 -34,-24 -48,-4 C-62,16 -68,44 -44,54 C-24,62 -34,78 0,86 Z',
  },
  {
    id: 'plate-04',
    image: '/plates/rorschach-04.jpg',
    label: 'Plate IV',
    path: 'M0,-70 C-24,-80 -56,-64 -60,-38 C-64,-12 -40,-8 -46,10 C-54,34 -30,40 -26,60 C-22,78 -8,76 0,84 Z',
  },
  {
    id: 'plate-05',
    image: '/plates/rorschach-05.jpg',
    label: 'Plate V',
    path: 'M0,-88 C-40,-84 -70,-58 -62,-32 C-56,-12 -32,-14 -36,4 C-40,26 -66,30 -58,52 C-50,74 -20,72 0,88 Z',
  },
  {
    id: 'plate-06',
    image: '/plates/rorschach-06.jpg',
    label: 'Plate VI',
    path: 'M0,-64 C-30,-74 -64,-52 -58,-26 C-53,-6 -28,-10 -34,10 C-41,32 -62,44 -48,62 C-34,78 -14,72 0,82 Z',
  },
  {
    id: 'plate-07',
    image: '/plates/rorschach-07.jpg',
    label: 'Plate VII',
    path: 'M0,-90 C-22,-86 -36,-66 -44,-44 C-54,-18 -78,-22 -76,2 C-74,26 -48,24 -50,44 C-52,68 -22,74 0,90 Z',
  },
  {
    id: 'plate-08',
    image: '/plates/rorschach-08.jpg',
    label: 'Plate VIII',
    path: 'M0,-74 C-36,-82 -66,-62 -64,-36 C-62,-14 -38,-18 -42,2 C-46,24 -70,36 -56,56 C-42,74 -16,70 0,80 Z',
  },
  {
    id: 'plate-09',
    image: '/plates/rorschach-09.jpg',
    label: 'Plate IX',
    path: 'M0,-82 C-26,-88 -52,-68 -50,-42 C-48,-20 -70,-16 -66,6 C-62,30 -36,26 -40,48 C-44,72 -16,80 0,88 Z',
  },
  {
    id: 'plate-10',
    image: '/plates/rorschach-10.jpg',
    label: 'Plate X',
    path: 'M0,-68 C-34,-78 -62,-56 -54,-30 C-48,-10 -26,-16 -30,6 C-35,30 -60,38 -50,58 C-40,76 -12,74 0,84 Z',
  },
];

export const PLATE_IDS = PLATES.map((p) => p.id);

export function isPlateId(id) {
  return PLATE_IDS.includes(id);
}
