# WellNest — dark / kinetic redesign

Completely different vibe to `wellnest-site/`: dark canvas, bento grid,
animated aurora, scroll-triggered reveals, count-up stats, drawing
charts, marquee strip of conditions, conic-gradient borders.

## Run it

```sh
cd wellnest-dark
npm install
npm run dev
```

Opens at http://localhost:4321 (or 4322 if `wellnest-site` is also running).

## Design notes

**Palette** — pitch-black canvas (`#050506`) with the WellNest emerald
(`#00c853`) used as a neon accent. Glass surfaces with `rgba(255,255,255,0.04)`
and 1px `rgba(255,255,255,0.08)` hairline borders.

**Type** — Inter Tight for display headlines, Inter for body. Pushed
the display scale to `text-8xl` on the closing CTA. A live aurora-gradient
`background-clip: text` keyword fades through every hero / section heading.

**Motion**

- Floating aurora orbs in the hero (14s `transform` loops)
- Conic-gradient ring border that spins on emphasis tiles
- Scroll-triggered fade+lift via IntersectionObserver
- Count-up animations on stats and the dashboard mock
- SVG line-draw animation (stroke-dasharray) on charts
- Pulse-ring rings on live status indicators
- Infinite marquee of conditions
- Animated peak-flow bars on AsthmaMate tiles

**Sections**

1. Hero with bento — 4-tile composition: live dashboard / Emergency / Stat / AsthmaMate waveform
2. Marquee of supported conditions
3. Bento grid of 11 modules (CRPSmate + AsthmaMate as 2x2 anchors)
4. Live signal — animated stats + flare-correlation chart
5. Pricing — Free vs Premium with conic-gradient ring on Premium
6. Privacy — 4-pillar trust grid
7. Closing CTA with full-bleed gradient

Builds fully static. No JS framework, no animation library — all
motion is CSS keyframes + ~25 lines of vanilla IntersectionObserver.
