# Chromia-Style Design Branch

The `design/chromia-style` branch is an **experimental design** branch inspired by [Chromia](https://chromia.com/). It applies a cleaner, tech/blockchain-style visual system across the Vibe Games site without changing any behavior or features.

## Design decisions

- **Palette**: Dark base (oklch 220 hue) with cyan/teal primary (`--primary` ~195) and green-teal accent (`--accent` ~165). Replaces the original purple/blue palette so all components pick up the new colors via existing CSS variables.
- **Typography**: Space Grotesk added as a heading font (`--font-heading`) for section titles and the logo; Inter remains the body font. Headings use `font-heading` and `tracking-tight` for a clearer hierarchy.
- **Effects**: Hero floating blobs removed; hero background uses a static gradient. Glass effect (`.glass`) uses the new palette with a subtle primary-tinted border. Gradient text (`.gradient-text`) uses cyan → teal → blue.
- **Motion**: No `animate-pulse-glow` on the main CTA; CTA card gradient no longer uses `animate-gradient`. Rely on Framer Motion for entrance/scroll animations only.
- **Confetti**: Color set updated to include Chromia-style cyan/teal/emerald for results celebration.

## Files touched

- **Tokens & globals**: `src/app/globals.css`
- **Layout / font**: `src/app/layout.tsx`
- **Pages**: `src/app/page.tsx`, `teams/page.tsx`, `voting/page.tsx`, `results/page.tsx`
- **Components**: `navigation.tsx`, `voting-card.tsx`, `team-card.tsx`, `leaderboard.tsx`, `idea-generator.tsx`, `team-form.tsx`, `confetti.tsx`

## Compare with main

```bash
git diff main..design/chromia-style
```

To revert to the original design, switch back to `main` and optionally delete the branch.
