// Where the free check opens.
//
// The landing page prints the check's first question. Ticking an answer there
// sends the value in router state, and the check should open on question two
// with question one already answered. Everything that can go wrong with that
// is in here rather than inside the component, so it can be tested:
//
//   - arriving with nothing (the ordinary /check visit) starts at question one
//   - a value that is not one of the instrument's own options is refused,
//     because router state is whatever the last page put there, and a made-up
//     answer would be scored as if the person had given it
//   - 0 is a real WHO-5 answer ("At no time"), so the check is `Number`, never
//     a truthiness test
//   - a one-item instrument cannot skip ahead, or the check opens on nothing
export function startFrom(instrument, first) {
  const items = instrument?.items || [];
  const options = items[0]?.options || [];
  const valid = Number.isInteger(first) && options.some((o) => o.value === first);
  if (!valid || items.length < 2) return { answers: [], index: 0 };
  return { answers: [first], index: 1 };
}
