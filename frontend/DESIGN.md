# DP Sahay: the printed form

The resident app, the landing page and the free check are one visual world: an
honest instrument sheet, printed in one green ink on white paper. Every
question, scale, citation and helpline is in plain view, ruled and numbered.
It replaced a soft wellness look (photo hero, rounded pastel cards, gradients,
pills), and that look is the thing to steer away from when adding a screen.

The admin console (`admin/`) is not part of this world.

## Why a form

The one claim this app makes over other wellness apps is that it uses the real
published questionnaires rather than a quiz of its own. A form is the shape that
shows that instead of saying it: the landing page prints the real first WHO-5
question, and ticking an answer starts the free check with that answer kept.

## Inks

All values live in `tokens.json` (generated into `src/styles/design-tokens.css`)
and as the form variables at the top of `src/index.css`.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Paper | `--paper`, `--color-cream` | `#ffffff` | Every ground |
| Tint | `--paper-tint`, `--color-cream-soft` | `#eef4ef` | Shaded cells, hover on a row or box |
| Wash | `--spot-wash` | `#dcebe1` | Placeholder fills, hover on a tick box |
| Spot | `--spot`, `--color-teal` | `#0a5c32` | Rules, box edges, titles, controls, the active tab |
| Spot deep | `--spot-deep`, `--color-teal-dark` | `#073f22` | Pressed and hovered controls, the landing footer |
| Key | `--key`, `--color-ink` | `#0f2419` | Reading text |
| Key soft | `--key-soft`, `--color-ink-soft` | `#3d5045` | Secondary text |
| Alarm | `--alarm` | `#b3261e` | Emergency lines and the crisis control, nothing else |
| Rule | `--rule` / `--rule-soft` | spot at 32% / 16% | Hairlines |

Every section hue (`--sec-*`) points at the spot. Wayfinding is the inked tab,
not a colour per section. Two colour sets stay on purpose: the five mood hues
(`shared/moods.js`), because mood is a scale people read by colour, and the
practice accents (`shared/accents.js`), which only colour the practice screen's
orb and rings, where the practice is the thing you look at.

Contrast is tested: `scripts/contrast.test.mjs` checks every `-deep` token and
accent on paper and on the tint at 4.5:1. On white: spot 8.1:1, key 16.3:1,
key soft 8.6:1, alarm 6.5:1.

Photographs are printed in the one ink (`.photo-head`, `.family-thumb`):
greyscale, with the spot screened over it, so the shadows print green and the
highlights stay paper.

## Type

Anek Latin (Ek Type, SIL OFL), self-hosted from `public/fonts/`, one variable
file per subset. One family in three widths:

| Role | Class | Setting |
| --- | --- | --- |
| Titles | `.f-title`, `.font-display` | `font-stretch: 112%`, weight 620 to 650 |
| Reading | body | normal width, weight 400 |
| Field labels | `.f-label`, `.marginalia` | `font-stretch: 82%`, weight 600, capitals, 0.06em to 0.08em tracking |

Counts are set in boxed figures (`.f-digits`, `shared/Odometer.jsx`). The
landing page's type sizes are a fixed scale enforced by
`scripts/landing-type.test.mjs`.

## Shape

- Square. Tailwind's radius scale is overridden in `@theme` to 1 to 6px, so
  `rounded-2xl` is a printed corner. `rounded-full` is kept for true circles
  only: dots, avatars, the breath orb. Never a pill for a button or a tag.
- A box is a 1px rule (`.card`, `.w-card`); a form box that matters is 1.5px of
  full spot. A part of a page starts with a 2px spot rule (`.f-part`).
- No shadows on boxes. The two dialogs and the DP button carry one soft shadow,
  tinted with the deep green, because they float over the page.

## Components

| Piece | Where | Notes |
| --- | --- | --- |
| Part | `Part` in `features/auth/AppShowcase.jsx` | 2px rule, name in a margin column from 900px; on a phone the name is screen-reader only |
| Tick box | `shared/Tick.jsx`, `.f-tick`, `.f-option` | A parent with `data-ticked="true"` fills it and draws the tick |
| Ink button | `.f-btn`, `.f-btn-line`; `shared/Button.jsx` in the app | Square block, arrow nudges 3px on hover |
| Tear-off slip | `.f-slip` | 1.5px dashed spot border, for the one thing to act on |
| Tab bar | `layouts/TabBar.jsx` | Phone: a strip with the active tab inked solid. Laptop: an index column of ruled rows |
| Crisis control | `shared/CrisisContacts.jsx` | Solid alarm red, square, 44px target on every variant |

## Motion

One grammar, the sheet being printed: rules draw from their left end, boxes
feed out top first (clip-path), counts roll like a numbering stamp, a tick is
drawn by its stroke. Nothing floats, glows or bounces.

- Curves: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for anything arriving,
  `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for anything travelling.
- Where it runs follows how often a screen is seen. The landing page and the
  free check are seen rarely, so they are printed as they arrive
  (`.print-roll`, `.print-feed`, `.print-rise`, `[data-reveal]` via
  `shared/useReveal.js`). The app is opened daily, so it gets feedback only:
  press scale 0.97 at 140ms, the tab ink travelling in 220ms, new questions
  rising 6px in 240ms.
- Transform, opacity and clip-path only. Hover motion is gated to fine
  pointers.
- Under `prefers-reduced-motion` the sheet is already printed: hidden starting
  states are skipped, not shortened.

## Copy

Unchanged by the redesign. No em-dashes anywhere, on screen or in source.
