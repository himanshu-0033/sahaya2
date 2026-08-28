// Abstract symmetric blot shapes, used as page decoration by AmbientBlots.
// Each path draws the left half only (viewBox is centered at x=0); the
// component mirrors it to complete the shape.
//
// These are stylised, not Rorschach plates. They used to open the check-in as
// a three-plate word-association step, which put an invented blot in the seat
// of an exercise the ten real plates now do properly later in the same flow —
// so the check-in was asking the same question twice, worse the first time.
// The shapes stayed because they still make good ambient furniture, and
// because nothing decorative should be a real plate.
export const INKBLOTS = [
  {
    id: 'plate-1',
    label: 'Plate 1',
    path: 'M0,-85 C-35,-88 -60,-70 -70,-45 C-82,-15 -55,-5 -68,20 C-80,45 -55,55 -40,72 C-25,86 -10,84 0,85 Z',
  },
  {
    id: 'plate-2',
    label: 'Plate 2',
    path: 'M0,-90 C-30,-90 -45,-60 -35,-40 C-25,-20 -55,-15 -60,10 C-65,35 -40,30 -45,55 C-50,80 -20,90 0,90 Z',
  },
  {
    id: 'plate-3',
    label: 'Plate 3',
    path: 'M0,-80 C-20,-85 -50,-75 -55,-50 C-60,-25 -35,-25 -50,-5 C-65,15 -70,45 -45,55 C-25,63 -35,80 0,88 Z',
  },
];
