# WellNest — sleek redesign

A more minimal, more confident take on the WellNest marketing site.
Astro 5 + Tailwind CSS v4. Single landing page, fully responsive.

## Run it

```sh
cd wellnest-site
npm install
npm run dev
```

Open http://localhost:4321

## Design notes

**Palette** — kept WellNest's signature emerald (`#059669` primary, `#00c853`
accent in the wordmark) but warmed the canvas to `#fafaf7` and the ink to
`#0f1110` for a softer, more editorial feel than the existing `#fafbfc` /
near-black contrast.

**Type** — same Inter family the app uses. Pushed the display scale
considerably (up to 7xl) and leaned on tracking-tight + `italic font-light`
accents to give headlines a calmer, more confident voice.

**Surfaces** — `rounded-3xl` cards with hairline borders (`#e7e6df`) instead
of the app's `rounded-xl` and harder dividers. Glassmorphic header preserved.
Soft aurora gradient mesh in the hero replaces flat backgrounds.

**Sections**

1. Hero with live-feel dashboard mock + floating Emergency card
2. Eleven-module grid with Free / Premium chips matching the app's tiering
3. Two-up condition spotlight (CRPSmate, AsthmaMate) — the differentiators
4. Pricing — Free vs Premium, dark-card emphasis on Premium
5. Privacy — dark section reinforcing the app's session-timeout / consent posture
6. CTA banner + footer

**No icon dependency** — all icons are inlined Lucide SVG paths in
`src/components/Icon.astro`, matching the icon set used in the app's `Layout.jsx`.

## Structure

```
src/
  components/
    Icon.astro          # inline lucide SVGs
    Logo.astro          # WellNest wordmark
    SiteHeader.astro    # sticky glassmorphic nav
    Hero.astro          # headline + product mock
    Features.astro      # 11-module grid
    Conditions.astro    # CRPSmate + AsthmaMate spotlight
    Pricing.astro       # Free vs Premium
    Privacy.astro       # dark trust section
    CTA.astro           # closing banner
    SiteFooter.astro    # footer
  layouts/Layout.astro  # html shell + Inter font
  pages/index.astro     # composes the page
  styles/global.css     # Tailwind v4 theme + components
```
