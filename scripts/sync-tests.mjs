// Regenerates frontend/src/features/read/testIndex.js from the instrument definitions.
//
// The reading section renders the questionnaires without touching the API, so
// it needs its own copy of them. This is the one place the copy is made, and
// backend/test/test-notes.test.mjs fails if the copy and the source disagree,
// so the workflow when an instrument changes is: edit instruments.js, run
// this, commit both.
//
// WHY THE ITEMS ARE IN HERE NOW. The explainer pages used to carry five
// paragraphs about a questionnaire and never showed the questionnaire. Someone
// deciding whether to answer nine questions about themselves could not see the
// nine questions first, which is a strange thing to withhold from the page
// whose entire job is to explain the thing. The items, the answer options and
// the band table all already exist in instruments.js; this just carries them
// across.
//
// The one instrument whose items are NOT carried across is any with
// `licenceCleared: false`. The app does not administer those, and reproducing
// the full item list on a public page is the same reproduction that the
// licence is withheld for. Everything else about them still renders.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSTRUMENTS, SCALES } from '../backend/lib/instruments.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'frontend/src/features/read/testIndex.js');

// Exported so backend/test/test-notes.test.mjs can check the generated file
// against this rather than against its own second copy of the shape. Two
// copies of a row builder is exactly the drift the test exists to catch.
export function buildRows(instruments = INSTRUMENTS, scales = SCALES) {
  return instruments.map((i) => {
    const scale = scales[i.scale] || null;
    const served = i.licenceCleared !== false;
    return {
      id: i.id,
      name: i.name,
      fullName: i.fullName,
      domain: i.domain,
      itemCount: i.items.length,
      minutes: i.minutes,
      wordingVerified: Boolean(i.wordingVerified),
      // Whether the app will actually serve it. An instrument can be documented
      // here and still be withheld (see licenceCleared in instruments.js), and
      // the reading page needs to know so it does not offer a "take it" link
      // that leads to a 404.
      available: served,
      blurb: i.blurb,
      license: i.license,
      citation: i.citation,
      // The shared answer scale, once per instrument. AUDIT-C has no shared
      // scale because each of its three questions has its own options, so
      // there the options ride on the item instead and this is null.
      prompt: scale?.prompt || null,
      options: scale?.options || null,
      // A higher score is a better result on WHO-5 and the like, which changes
      // how the band table reads.
      higherIsBetter: Boolean(i.higherIsBetter),
      // The index of the item routed into the crisis path, so the page can say
      // which question is treated differently and why.
      crisisItems: i.crisisItems || (Number.isInteger(i.crisisItem) ? [i.crisisItem] : []),
      // Item text only, plus the two things that change how an item is read:
      // `reverse` (scored backwards) and `dependsOn` (only asked if an earlier
      // answer opened it). Options appear only where the item overrides.
      items: served
        ? i.items.map((item) => ({
            text: item.text,
            ...(item.reverse ? { reverse: true } : {}),
            ...(Number.isInteger(item.dependsOn) ? { dependsOn: item.dependsOn } : {}),
            ...(item.options ? { options: item.options } : {}),
          }))
        : null,
      bands: i.bands || null,
      // C-SSRS reports a triage level and no total on purpose.
      reportsBandOnly: Boolean(i.reportsBandOnly),
    };
  });
}

const header = `// The questionnaire list the reading section renders from.
//
// GENERATED from backend/lib/instruments.js. Do not hand-edit. Regenerate with:
//   npm run sync:tests
//
// It exists so the reading section stays a pure static bundle: the Tests tab
// fetches this same information from /api/assessments because it also needs
// scoring, but an explainer page has nothing to score and should not need a
// server to render. backend/test/test-notes.test.mjs fails if this file drifts
// out of step with the instruments it was generated from.
//
// \`items\` is null for an instrument the app does not serve, because the reason
// it is not served is that the licence to reproduce it has not come back.

export const TEST_INDEX = `;

// Only when run directly. The test imports buildRows from this file, and a
// module that rewrites a source file on import is a booby trap.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = buildRows();
  writeFileSync(OUT, `${header}${JSON.stringify(rows, null, 2)};\n`, 'utf-8');
  console.log(`testIndex.js regenerated: ${rows.length} questionnaires`);
}
