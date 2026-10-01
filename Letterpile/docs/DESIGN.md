# Design notes

Keeps the live site's identity: warm paper/tile palette, terracotta accent, tile-styled word chips, light and dark themes, system fonts only (no web fonts, no icon fonts).

## Colors (CSS custom properties in `src/assets/style.css`)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f4f2ef` | `#17151a` |
| `--surface` | `#ffffff` | `#211e25` |
| `--text` | `#221f26` | `#ece8f0` |
| `--muted` | `#6b6572` | `#a39cab` |
| `--accent` (the one accent color) | `#c2562b` | `#e07347` |
| `--tile` / `--tile-edge` / `--tile-ink` | `#f3dfb4` / `#d7bd86` / `#3a2e18` | `#d9c28f` / `#b39b63` / `#3a2e18` |
| Wordle tiles (white text, both themes) | gray `#6b6572`, yellow `#8a6a00`, green `#2e6b3a` | same |

`theme-color`: `#ffffff` (light), `#211e25` (dark). Theme: follows `prefers-color-scheme`; the header toggle overrides it and is stored in localStorage `theme`; applied by the inline head script before first paint.

## Layout and spacing
- Mobile-first; content column + 300px sidebar from 961px; single column below.
- Radius 12px panels, 10px inputs/buttons, 1px borders.
- Buttons and icon buttons at least 44×44px; `:focus-visible` outline 3px accent.
- Inputs 16px+ (no iOS zoom); visible labels or `aria-label`.

## No layout shift
- Results regions reserve `--results-min` (160px) from first paint, with an empty-state message.
- Ad slots reserve `--ad-h` (280px mobile, 110px from 768px, label included) with `contain: layout style`; hidden on query-string URLs (`html.has-query`). The future consent banner must be an overlay.
- Header, nav and footer are in the HTML (no injected chrome). Lab CLS after Phase 3: 0 on all six Lighthouse URLs, also with ad placeholders visible; Playwright CLS ≤ 0.02 on load and after searches at 360px and 1280px.

## Motion
- `prefers-reduced-motion: reduce` disables animations and transitions. Only the loading spinner animates.

## Measured contrast (WCAG 2 formula, computed in Phase 3)

| Theme | Pair | Colors | Ratio |
|---|---|---|---:|
| Light | body text | `#221f26` on `#f4f2ef` | 14.55:1 |
| Light | body text on panel | `#221f26` on `#ffffff` | 16.25:1 |
| Light | muted text on panel | `#6b6572` on `#ffffff` | 5.63:1 |
| Light | muted text on page | `#6b6572` on `#f4f2ef` | 5.04:1 |
| Light | links on page | `#a3431d` on `#f4f2ef` | 5.56:1 |
| Light | links on panel | `#a3431d` on `#ffffff` | 6.22:1 |
| Light | button text on accent | `#ffffff` on `#c2562b` | 4.51:1 |
| Light | tile text | `#3a2e18` on `#f3dfb4` | 10.12:1 |
| Light | nav text | `#ffffff` on `#4e4757` | 8.89:1 |
| Light | footer fine print | `#c9c3d0` on `#4e4757` | 5.16:1 |
| Dark | body text | `#ece8f0` on `#17151a` | 14.99:1 |
| Dark | body text on panel | `#ece8f0` on `#211e25` | 13.60:1 |
| Dark | muted text on panel | `#a39cab` on `#211e25` | 6.19:1 |
| Dark | links on page | `#e07347` on `#17151a` | 5.79:1 |
| Dark | links on panel | `#e07347` on `#211e25` | 5.26:1 |
| Dark | button text on accent | `#1d1410` on `#e07347` | 5.79:1 |
| Dark | tile text | `#3a2e18` on `#d9c28f` | 7.62:1 |
| Dark | nav text | `#ffffff` on `#2b2631` | 14.74:1 |
| Both | Wordle gray tile | `#ffffff` on `#6b6572` | 5.63:1 |
| Both | Wordle yellow tile | `#ffffff` on `#8a6a00` | 5.07:1 |
| Both | Wordle green tile | `#ffffff` on `#2e6b3a` | 6.40:1 |

All pairs meet AA for body text (4.5:1). axe-core reports no contrast violations on any template in either theme (`tests/e2e/accessibility.test.mjs`).

## Phase 3 changes
- Dark theme: button text is dark (`#1d1410`) on the orange accent (white was below 3:1).
- Light theme: prose links and tile-value numbers use `--link` `#a3431d`.
- Theme toggle icon is an inline SVG (the ◐ glyph rendered clipped on some systems).
- Result groups use `content-visibility: auto` so long result lists don't lay out off-screen groups.
- Query-string (shared result) pages reserve `70vh` for results so arriving results don't shift visible content.
- Tables wrap inside cells on phones; no page scrolls horizontally at 360px (tested).
- Screenshots: `node scripts/screenshots.mjs` writes 40 images (10 pages × 360/1280px × light/dark) to `reports/screens/`.
