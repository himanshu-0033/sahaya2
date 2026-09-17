# DP Sahay: soft, photographic, green

The resident app, the landing page and the free check share one light, soft
world: white and pale sage grounds, rounded cards with soft shadows tinted to
the brand green, full-colour photography, and a calm colour per section.

A one-ink "printed form" redesign was tried in September 2026 and rolled back
the same day: without the photographs and the colour it read as cold and
official. Keep that in mind before stripping either out again.

The admin console (`admin/`) is its own app and is not covered here.

## Colour

Values live in `tokens.json` (generated into `src/styles/design-tokens.css`)
and, for the landing page and the check, in the `.welcome` block of
`src/index.css`.

| Role | Token | Use |
| --- | --- | --- |
| Brand green | `--w-accent-deep` `#0b6b3a` | Primary buttons, headings on the landing page, the ticked state |
| Forest | `--w-forest` `#0a4f2c` | The announcement strip and the landing footer |
| Wash | `--w-accent-wash` `#e3f1e8` | Chips, selected answers |
| App ground | `--color-cream` `#f4f7f3` | Behind every signed-in page |
| Section hues | `--sec-home`, `--sec-calm`, `--sec-paths`, `--sec-tests`, `--sec-read`, `--sec-inkblot` | Wayfinding: the tab, a page's wash, small markers |

Every hue has a `-deep` step for text. `scripts/contrast.test.mjs` checks each
one at 4.5:1 on the app ground and on a white card.

Photographs are full colour (`src/shared/photos.js`, self-hosted), with a light
wash of the section hue on in-app cards (`.photo-head`). The landing hero uses
the misty forest.

## Type

Plus Jakarta Sans, self-hosted from `public/fonts/` as one variable file per
subset (SIL OFL). 600 to 700 for headings with slight negative tracking, 500
for buttons, 400 for body. The landing page's sizes are a fixed scale enforced
by `scripts/landing-type.test.mjs`.

## Shape and depth

- Cards: 18 to 28px radius (`.card`, `.w-card`); buttons and chips are pills.
- Depth is the Soft UI Evolution shadow: a 1px contact shadow plus a wide
  diffused one tinted with the ink or the green, never pure black.
- The landing showcase cards are full gradients in the section colours, with a
  drawn phone inside.

## Components worth knowing

| Piece | Where | Notes |
| --- | --- | --- |
| First question card | `FirstQuestion` in `features/auth/Welcome.jsx` | The real WHO-5 item 1 over the hero photo; ticking carries the answer into `/check` |
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
  showcase phones slide up out of their cards, and a new question rises 6px.
- The app is opened daily, so it keeps to feedback: press scale, hover lifts on
  pointer devices, dialogs that arrive in 240ms.
- Transform, opacity and clip-path only. Hover motion is gated to fine
  pointers. Under `prefers-reduced-motion` every hidden starting state is
  skipped.

## Copy

No em-dashes anywhere, on screen or in source.
