# DP Sahay: midnight, marigold, photographs

One light world across the landing page, the free check and the resident app:
a cool off-white ground, midnight blue as the brand, one marigold accent, and
full-colour photography.

Two earlier directions are recorded here because both were rejected and the
reasons still apply. A one-ink "printed form" look (white paper, one green ink,
square boxes, duotone photos) read as cold and official. Before that, the
landing hero laid the question card over the photograph, which read as
amateur. Keep the photographs, keep the colour, and do not cover an image with
a panel.

The admin console (`admin/`) is its own app and is not covered here.

## Colour

Values live in `tokens.json` (generated into `src/styles/design-tokens.css`)
and, for the landing page and the check, in the `.welcome` block of
`src/index.css`.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Midnight | `--w-accent-deep`, `--color-teal-dark` | `#1f2d52` | The brand: primary buttons, headings, links. White text on it reads 13.5:1 |
| Marigold | `--w-accent`, `--color-teal` | `#f2a93b` | The one accent, a fill and never a letter (2:1 against white). Ticks, the strip button, selected answers. Ink on it reads 8.6:1 |
| Marigold wash | `--w-accent-wash` | `#fdf0da` | Behind ink or midnight text |
| Ink | `--w-ink`, `--color-ink` | `#141b2d` | Reading text, and the strip and footer grounds |
| Ink soft | `--w-ink-soft`, `--color-ink-soft` | `#4b5566` | Secondary text |
| Ground | `--w-cream` / `--color-cream` | `#fafbfc` / `#f5f6f8` | The page behind the cards |
| Band | `--w-band`, `--color-cream-soft` | `#eef1f5` / `#eceff4` | Section bands |
| Lake | `--sec-home` | `#2f6b8a` | Home's section colour |
| Alarm | red `#b42318` | | The crisis control and emergency lines only |

The other section hues (`--sec-calm`, `--sec-paths`, `--sec-tests`,
`--sec-read`, `--sec-inkblot`) and the five mood hues stay as they are: they
are wayfinding and a scale, not decoration. `scripts/contrast.test.mjs` checks
every `-deep` token and accent at 4.5:1 on the app ground and on a white card.

Photographs are full colour (`src/shared/photos.js`, self-hosted), with a light
wash of the section hue on in-app cards (`.photo-head`).

## Type

Funnel Display for headings, Funnel Sans for everything else (Dicotype, SIL
OFL), self-hosted from `public/fonts/` as one variable file per subset. `h1`,
`h2`, `h3` and `.font-display` take Display; the rest take Sans. Headings run
600 to 700 with slight negative tracking. The landing page's sizes are a fixed
scale enforced by `scripts/landing-type.test.mjs`.

## Shape and depth

- Cards: 18 to 28px radius (`.card`, `.w-card`); buttons and chips are pills.
- Depth is a 1px contact shadow plus a wide diffused one tinted with the ink,
  never pure black.
- The landing showcase cards are full-bleed gradients: two midnight, one lake,
  one marigold. The marigold card carries ink text, not white.

## The landing hero

Split: the left column holds the wordmark, the one-line promise and the free
check's real first question, answerable on the spot; the right column is the
photograph at the column's full height, with nothing over it. Ticking an
answer fills the box in marigold, draws the tick and opens `/check` on question
two with that answer kept. `startFrom` in
`src/features/checkin/quickStart.js` owns that hand-off and is tested by
`scripts/quick-start.test.mjs`: 0 is a real answer, anything the instrument
does not offer is refused, and a one-item check never skips past its end.

Below it the tools are a bento of six cells, two carrying photographs, rather
than six identical cards.

## Components worth knowing

| Piece | Where | Notes |
| --- | --- | --- |
| First question card | `FirstQuestion` in `features/auth/Welcome.jsx` | The hero's action |
| Tick box | `shared/Tick.jsx`, `.f-tick`, `.soft-option` | A parent with `data-ticked="true"` fills it and draws the tick |
| Count roll | `shared/Odometer.jsx` | Rolls to its value once `go` is true |
| Reveal | `shared/useReveal.js` | `data-reveal` on a section, `.reveal-item` on what rises |
| Crisis control | `shared/CrisisContacts.jsx` | Solid red, 44px target on every variant |

## Motion

- Curves: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for anything arriving,
  `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for anything travelling.
- The landing page and the free check are seen rarely, so they arrive: the hero
  rises in order, the photograph opens top down while settling from a slight
  zoom, sections rise as they scroll into view (once), the counts roll, the
  showcase phones slide up, and a new question rises 6px.
- The app is opened daily, so it keeps to feedback: press scale, hover lifts on
  pointer devices, dialogs that arrive in 240ms.
- Transform, opacity and clip-path only. Hover motion is gated to fine
  pointers. Under `prefers-reduced-motion` every hidden starting state is
  skipped.

## Copy

No em-dashes anywhere, on screen or in source.
