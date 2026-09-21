<div align="center">

# Design

### Midnight, marigold, and photographs. What holds, and what was already rejected

![brand](https://img.shields.io/badge/midnight-%231f2d52-1f2d52?style=flat-square)
![accent](https://img.shields.io/badge/marigold-%23f2a93b-f2a93b?style=flat-square)
![ink](https://img.shields.io/badge/ink-%23141b2d-141b2d?style=flat-square)
![type](https://img.shields.io/badge/type-Funnel%20Display%20%2B%20Sans-1f2d52?style=flat-square)
![contrast](https://img.shields.io/badge/contrast-tested%20at%204.5%3A1-1f2d52?style=flat-square)

[prd](prd.md) · [architecture](architecture.md) · [rules](rules.md) · **design** · [tasks](tasks.md) · [memory](memory.md) · [readme](README.md)

</div>

---

> [!IMPORTANT]
> The full system is **[frontend/DESIGN.md](frontend/DESIGN.md)**, written from
> the shipped artifact rather than from intentions. Read it before touching any
> student-facing screen. This file holds the summary and, more importantly, the
> directions that were already tried and refused, so they do not come back.

## 1. The world

One light world across the landing page, the free check and the student app: a
cool off-white ground, midnight blue as the brand, one marigold accent, and
full-colour photography.

| Role | Token | Value | Use |
| :--- | :--- | :--- | :--- |
| **Midnight** | `--w-accent-deep`, `--color-teal-dark` | `#1f2d52` | The brand. Primary buttons, headings, links. White on it reads 13.5:1 |
| **Marigold** | `--w-accent`, `--color-teal` | `#f2a93b` | The one accent. Ticks, the strip button, selected answers. Ink on it reads 8.6:1 |
| Marigold wash | `--w-accent-wash` | `#fdf0da` | Behind ink or midnight text |
| Ink | `--w-ink`, `--color-ink` | `#141b2d` | Reading text, and the strip and footer grounds |
| Ink soft | `--w-ink-soft` | `#4b5566` | Secondary text |
| Ground | `--w-cream`, `--color-cream` | `#fafbfc` / `#f5f6f8` | The page behind the cards |
| Band | `--w-band` | `#eef1f5` / `#eceff4` | Section bands |
| Lake | `--sec-home` | `#2f6b8a` | Home's section colour |
| **Alarm** | red | `#b42318` | The crisis control and emergency lines **only** |

> [!WARNING]
> **Marigold is a fill and never a letter.** It sits at 2:1 against white,
> which fails text contrast at any size. If you find yourself writing marigold
> text, you want midnight or ink on a marigold wash instead.

Values live in `frontend/tokens.json`, generated into
`src/styles/design-tokens.css`. For the landing page and the free check they
also live in the `.welcome` block of `src/index.css`. **Edit the token file,
never the generated CSS.**

The other section hues (`--sec-calm`, `--sec-paths`, `--sec-tests`,
`--sec-read`, `--sec-inkblot`) and the five mood hues stay as they are. They
are wayfinding and a scale, not decoration.

## 2. Rejected, do not retry

<table>
<tr><th>Direction</th><th>Verdict</th></tr>
<tr>
<td><b>The one-ink printed form.</b> White paper, one green ink, square boxes, duotone photographs.</td>
<td>Rejected as cold and official. A wellness app that looks like a government form is the wrong feeling.</td>
</tr>
<tr>
<td><b>A panel over the hero photograph.</b> The survey card laid on top of the image.</td>
<td>Rejected as amateur. Never cover an image with a panel.</td>
</tr>
<tr>
<td><b>The launch sage green.</b></td>
<td>Gone, replaced deliberately. Do not reintroduce it.</td>
</tr>
</table>

## 3. What holds

- Keep the photographs and keep the colour. They are self-hosted in
  `src/shared/photos.js`, full colour, with a light wash of the section hue on
  in-app cards (`.photo-head`).
- The hero's call to action is a **real interactive product element**, the live
  WHO-5 first question, not a button promising one. Ticking an answer fills the
  box in marigold, draws the tick, and opens `/check` on question two with that
  answer kept.
- Cards are 18 to 28px radius (`.card`, `.w-card`). Buttons and chips are pills.
- Depth is a 1px contact shadow plus a wide diffused one tinted with the ink,
  never pure black.
- The landing showcase cards are full-bleed gradients: two midnight, one lake,
  one marigold. The marigold one carries ink text, not white.
- Below the hero, the tools are a bento of six cells, two carrying photographs,
  rather than six identical cards.

## 4. Type

Funnel Display for headings, Funnel Sans for everything else. Dicotype, SIL
OFL, self-hosted from `public/fonts/` as one variable file per subset. `h1`,
`h2`, `h3` and `.font-display` take Display, the rest take Sans. Headings run
600 to 700 with slight negative tracking.

## 5. Motion

| Curve | Value | For |
| :--- | :--- | :--- |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Anything arriving |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Anything travelling |

The landing page and the free check are seen rarely, so they **arrive**: the
hero rises in order, the photograph opens top down while settling from a slight
zoom, sections rise once as they scroll into view, the counts roll, the
showcase phones slide up, and a new question rises 6px.

The app is opened daily, so it keeps to **feedback**: press scale, hover lift
on pointer devices, dialogs that arrive in 240ms.

Transform, opacity and clip-path only. Hover motion is gated to fine pointers.
Under `prefers-reduced-motion`, every hidden starting state is skipped.

## 6. Components worth knowing

| Piece | Where | Notes |
| :--- | :--- | :--- |
| First question card | `FirstQuestion` in `features/auth/Welcome.jsx` | The hero's action |
| Tick box | `shared/Tick.jsx`, `.f-tick`, `.soft-option` | A parent with `data-ticked="true"` fills it and draws the tick |
| Count roll | `shared/Odometer.jsx` | Rolls to its value once `go` is true |
| Reveal | `shared/useReveal.js` | `data-reveal` on a section, `.reveal-item` on what rises |
| Crisis control | `shared/CrisisContacts.jsx` | Solid red, 44px target on every variant |
| Shell | `components/PageShell.jsx` | One card treatment and a four-step vertical rhythm |

## 7. The teeth

| Check | Enforces |
| :--- | :--- |
| `scripts/contrast.test.mjs` | Every `-deep` token and accent at 4.5:1 on the app ground, on a white card, and on a wash of its own hue |
| `scripts/landing-type.test.mjs` | The landing page's fixed type scale |
| `scripts/quick-start.test.mjs` | The hero hand-off: 0 is a real answer, an unoffered value is refused, a one-item check never skips past its end |

## 8. Copy

**No em-dashes anywhere, on screen or in source.**

Show a rendered screenshot before committing to a large visual change, not an
ASCII mockup.

The admin console (`admin/`) is its own app and is not covered by any of this.
