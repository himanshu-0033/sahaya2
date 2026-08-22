// The ten plates used by the inkblot reflection.
//
// These are ORIGINAL abstract symmetric shapes, in the same style as the
// three check-in plates in the frontend's lib/inkblots.js. They are
// deliberately NOT the Rorschach plates: those are administered and scored
// by a trained clinician against a coding system, and reproducing them in a
// self-serve app both misrepresents what is happening and burns the real
// instrument's test security for anyone who later sits it properly.
//
// Ten is kept because the count is what gives the exercise its shape — long
// enough to settle into, short enough to finish in one sitting.
//
// Every path draws the LEFT half only (the viewBox is centred at x=0); the
// client mirrors it to complete the form, the way a folded blot is made.
export const PLATES = [
  {
    id: 'plate-01',
    label: 'Plate I',
    path: 'M0,-86 C-32,-90 -58,-70 -66,-44 C-76,-14 -50,-6 -62,18 C-74,42 -52,54 -38,70 C-24,84 -10,82 0,86 Z',
  },
  {
    id: 'plate-02',
    label: 'Plate II',
    path: 'M0,-92 C-28,-92 -44,-62 -34,-42 C-24,-22 -54,-16 -58,8 C-62,32 -38,28 -44,52 C-50,78 -18,88 0,92 Z',
  },
  {
    id: 'plate-03',
    label: 'Plate III',
    path: 'M0,-78 C-18,-84 -48,-74 -54,-50 C-60,-26 -34,-24 -48,-4 C-62,16 -68,44 -44,54 C-24,62 -34,78 0,86 Z',
  },
  {
    id: 'plate-04',
    label: 'Plate IV',
    path: 'M0,-70 C-24,-80 -56,-64 -60,-38 C-64,-12 -40,-8 -46,10 C-54,34 -30,40 -26,60 C-22,78 -8,76 0,84 Z',
  },
  {
    id: 'plate-05',
    label: 'Plate V',
    path: 'M0,-88 C-40,-84 -70,-58 -62,-32 C-56,-12 -32,-14 -36,4 C-40,26 -66,30 -58,52 C-50,74 -20,72 0,88 Z',
  },
  {
    id: 'plate-06',
    label: 'Plate VI',
    path: 'M0,-64 C-30,-74 -64,-52 -58,-26 C-53,-6 -28,-10 -34,10 C-41,32 -62,44 -48,62 C-34,78 -14,72 0,82 Z',
  },
  {
    id: 'plate-07',
    label: 'Plate VII',
    path: 'M0,-90 C-22,-86 -36,-66 -44,-44 C-54,-18 -78,-22 -76,2 C-74,26 -48,24 -50,44 C-52,68 -22,74 0,90 Z',
  },
  {
    id: 'plate-08',
    label: 'Plate VIII',
    path: 'M0,-74 C-36,-82 -66,-62 -64,-36 C-62,-14 -38,-18 -42,2 C-46,24 -70,36 -56,56 C-42,74 -16,70 0,80 Z',
  },
  {
    id: 'plate-09',
    label: 'Plate IX',
    path: 'M0,-82 C-26,-88 -52,-68 -50,-42 C-48,-20 -70,-16 -66,6 C-62,30 -36,26 -40,48 C-44,72 -16,80 0,88 Z',
  },
  {
    id: 'plate-10',
    label: 'Plate X',
    path: 'M0,-68 C-34,-78 -62,-56 -54,-30 C-48,-10 -26,-16 -30,6 C-35,30 -60,38 -50,58 C-40,76 -12,74 0,84 Z',
  },
];

export const PLATE_IDS = PLATES.map((p) => p.id);

export function isPlateId(id) {
  return PLATE_IDS.includes(id);
}
