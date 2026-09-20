# design.md

The design system lives in **[frontend/DESIGN.md](frontend/DESIGN.md)**, written
from the shipped artifact. Read it before touching any student-facing screen.
This file only holds the rules that must not be rediscovered.

## The world

Midnight blue `#1f2d52` is the brand. Marigold `#f2a93b` is the one accent, a
fill and never a letter. Cool off-white grounds, full-colour photographs, soft
rounded cards, Funnel Display and Funnel Sans, self-hosted.

Tokens are generated: edit `frontend/tokens.json`, not
`src/styles/design-tokens.css`. The landing page and the free check also read
the `.welcome` block in `src/index.css`.

## Rejected, do not retry

- **The one-ink printed form.** White paper, one green ink, square boxes,
  duotone photos. Rejected as cold and official.
- **A panel over the hero photograph.** Rejected as amateur. Never cover an
  image with a card.
- The sage green it launched with. Gone.

## Holds

- Keep the photographs and keep the colour.
- The hero's call to action is a real interactive product element (the live
  WHO-5 first question), not a button promising one.
- Section hues and the five mood hues are wayfinding and a scale, not
  decoration. Leave them alone.
- Red is the crisis control and emergency lines only.
- `scripts/contrast.test.mjs` checks every `-deep` token at 4.5:1, and
  `scripts/landing-type.test.mjs` fixes the landing type scale. Both are the
  design system's teeth.
- Show a rendered screenshot before committing to a large visual change.

The admin console is its own app and is not covered by any of this.
