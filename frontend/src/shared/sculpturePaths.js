// The sculpture's silhouette, shared by the WebGL version (GlassSculpture,
// which extrudes these into real geometry) and the SVG fallback (Inkblot3D).
//
// Every path draws the LEFT half only and is mirrored to complete the form,
// the way a folded ink blot is made.
//
// The wing masses are hollow: each path pairs an outer contour with an inner
// one and fills with `evenodd`, so the middle punches out into negative
// space. That ring structure — rather than solid lobes — is what reads as
// blown glass.
export const RIBBONS = [
  // upper wing, hollow
  {
    d:
      'M-8,-20 C-40,-58 -86,-79 -106,-62 C-120,-50 -109,-19 -81,-1 C-52,15 -20,9 -8,-8 Z ' +
      'M-17,-18 C-43,-46 -77,-62 -93,-52 C-101,-44 -93,-23 -70,-9 C-48,4 -25,1 -17,-10 Z',
    fill: 'url(#g-glass)',
    o: 0.62,
    // WebGL only: glass tint and how far this ribbon stands off the centre
    // plane, so the mirrored halves don't render as one flat sheet.
    tint: '#7fe3da',
    depth: 13,
    z: 0,
  },
  // inner upper wing, hollow, warmer
  {
    d:
      'M-10,-14 C-32,-40 -62,-56 -76,-45 C-85,-37 -77,-18 -57,-6 C-38,5 -18,3 -10,-6 Z ' +
      'M-17,-13 C-35,-32 -57,-44 -67,-37 C-73,-31 -66,-18 -50,-9 C-36,-1 -22,-2 -17,-8 Z',
    fill: 'url(#g-warm)',
    o: 0.55,
    tint: '#ff9d5c',
    depth: 10,
    z: 7,
  },
  // lower wing, hollow
  {
    d:
      'M-8,6 C-34,20 -68,45 -76,70 C-82,88 -63,92 -44,75 C-23,56 -9,30 -6,11 Z ' +
      'M-13,17 C-33,31 -57,51 -63,67 C-67,79 -57,81 -44,66 C-30,50 -17,29 -13,17 Z',
    fill: 'url(#g-cool)',
    o: 0.6,
    tint: '#5fd6cc',
    depth: 12,
    z: -4,
  },
  // small hollow ring nested deep in the upper wing
  {
    d:
      'M-14,-12 C-28,-30 -48,-42 -58,-34 C-65,-28 -58,-14 -43,-5 C-30,3 -17,1 -14,-5 Z ' +
      'M-20,-12 C-31,-25 -45,-33 -51,-28 C-56,-24 -50,-14 -39,-8 C-30,-3 -22,-4 -20,-8 Z',
    fill: 'url(#g-cool)',
    o: 0.5,
    tint: '#a5f7ee',
    depth: 9,
    z: 13,
  },
  // small hollow ring in the lower wing
  {
    d:
      'M-10,14 C-26,26 -45,45 -50,61 C-54,74 -42,76 -30,62 C-17,47 -8,28 -7,17 Z ' +
      'M-14,24 C-27,34 -41,50 -44,60 C-47,68 -40,69 -32,59 C-23,48 -15,32 -14,24 Z',
    fill: 'url(#g-warm)',
    o: 0.5,
    tint: '#ffb070',
    depth: 9,
    z: 10,
  },
  // outer hook curling off the wing tip
  {
    d: 'M-96,-56 C-110,-64 -118,-52 -112,-40 C-107,-30 -96,-28 -92,-36 C-96,-38 -102,-44 -100,-50 C-99,-54 -97,-55 -96,-56 Z',
    fill: 'url(#g-cool)',
    o: 0.7,
    tint: '#c8faff',
    depth: 11,
    z: -8,
  },
  // top spike
  {
    d: 'M-4,-40 C-10,-62 -19,-84 -31,-104 C-26,-79 -16,-56 -10,-40 C-8,-34 -6,-34 -4,-40 Z',
    fill: 'url(#g-cool)',
    o: 0.8,
    tint: '#d9fbff',
    depth: 8,
    z: 4,
  },
  // thin strand crossing the wing
  {
    d: 'M-12,-24 C-40,-40 -70,-52 -92,-56 C-72,-46 -44,-30 -20,-16 C-14,-13 -11,-19 -12,-24 Z',
    fill: 'url(#g-glass)',
    o: 0.5,
    tint: '#eafcfa',
    depth: 7,
    z: 16,
  },
];

export const CORE = 'M0,-52 C-8,-30 -12,-4 -10,22 C-8,48 -3,66 0,80 Z';
export const TAIL = 'M0,66 C-7,76 -11,90 -7,101 C-3,108 0,109 0,111 Z';

// The body runs deeper than the wings — it is the spine the wings spring
// from, so it needs to still read as mass when the piece turns edge-on.
export const CORE_PARTS = [
  { d: CORE, tint: '#8ff0e4', depth: 26, z: 0 },
  { d: TAIL, tint: '#ffa463', depth: 18, z: 0 },
];

// Design space of the paths, before any mirroring. Used to centre the
// extruded geometry and to size the SVG viewBox.
export const BOUNDS = { x: -124, y: -112, w: 248, h: 300 };
