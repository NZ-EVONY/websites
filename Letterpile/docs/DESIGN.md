# Design notes

**Current look: "Tile Table, Night Edition"** (October 2026 refresh, from `design/home-mockup-v2.html`,
`design/tool-mockup-v2.html` and `design/DESIGN-NOTES.md`). Only the look changed: URLs, titles, H1s,
descriptions, JSON-LD, element ids, `<body data-page>`, word data and search logic are as before
(checked by comparing all 726 built pages with the previous build). System fonts only; no web
fonts, icon fonts or images from other sites.

## The idea
The **stage** (header, home hero, footer) is navy in both themes, with a faint electric-blue grid
behind the home hero. The page below follows the visitor's colour scheme until the header toggle is
used (`localStorage.theme`, applied before paint by the unchanged head script). Letter tiles with
point values (coral, sunshine, mint, blue, violet, plus wood for blanks) are the motif: logo, hero
pile, rack preview, category cards, tool icons, step numbers and result chips.

## Colours (CSS custom properties in `src/assets/style.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--stage` / `--stage-2` | `#0A1030` / `#131B45` | same | header, hero, footer, hero inputs |
| `--stage-ink` / `--stage-muted` | `#FFFFFF` / `#D3DBFF` | same | text on the stage |
| `--stage-line` / `--stage-grid` | `#2D3E86` / `rgb(77 141 255 / .10)` | same | menus, footer rule / hero grid |
| `--bg` | `#F3F5FF` | `#0E1735` | page |
| `--surface` / `--surface-2` | `#FFFFFF` / `#E8ECFF` | `#161F4A` / `#1D2960` | cards / quiet panels |
| `--text` (= `--ink`) | `#0A1030` | `#F2F5FF` | body text |
| `--muted` | `#4A557F` | `#AEBBE6` | secondary text |
| `--link` | `#1F4FD8` | `#7FB0FF` | links |
| `--outline` | `#1F4FD8` | `#4D8DFF` | secondary buttons, hover borders |
| `--line` / `--field` | `#CBD3F5` / `#6A76A8` | `#2D3E86` / `#7F92E6` | decorative borders / input borders |
| `--focus` | `#1D3FD1` | `#FFDD55` | 3px focus ring (`--focus-stage` `#FFDD55` on the stage) |
| `--blue` (= `--accent`) | `#4D8DFF` | same | primary button, active controls; navy text |
| `--violet` | `#9A7BFF` | same | current-page nav pill, hero eyebrow; navy text |
| tiles `--coral --sun --mint --tile-blue --tile-violet --wood` | `#FF7A5C #FFCC33 #35DCA2 #5C9DFF #A98BFF #FFE9B8` | same | tiles, cards, chip edges; text always `--tile-ink #0A1030` |
| `--error` / `--good` | `#B3261E` / `#1E7A45` | `#FF9A8A` / `#5EE0A0` | error and success text |
| Wordle tiles (white text) | gray `#5A5F78`, yellow `#8a6a00`, green `#2e6b3a` | same | Wordle Solver |

Older names are kept (`--accent`, `--tile`, `--tile-edge`, `--tile-ink`, `--nav`, `--nav-ink`); font
stacks are `--font-display` (ui-rounded first, weight 800 for headings) and `--font-body`.
`theme-color` is `#0A1030` for both schemes (the stage colour).

Category cards are filled with their tile colour in light theme and are dark surfaces with a
coloured border in dark theme. Result chips get a coloured bottom edge from their group's length
(`data-len` on `.group`): 7+ coral, 6 sunshine, 5 mint, 4 blue, 3 violet, 2 wood; all-tiles words are
filled coral. Colour is never the only cue (group headings name the length; the bingo chip has a title).

## Layout
- Header: brand tiles, pill navigation (violet pill for the current page) and theme toggle on the
  navy stage; below 860px a menu button opens the nav as a panel. Ids `menuToggle`, `navbar`,
  `moreMenu`, `themeToggle` unchanged.
- Home: hero (eyebrow, H1, lede, form, rack preview, three facts; decorative tile pile at 900px+),
  then the results panel, `home-extras` (category cards, ten-tool grid, A-Z tiles with counts,
  how it works, three guide cards), then the copy with the Tip panel (`id="sidebar"`) beside it.
- Other pages: breadcrumbs, a panel (tool card with a blue top edge) and the sidebar (tool list
  with coloured tile icons) from 1000px; one column below.
- Panels 26px radius, 2px borders; buttons 52px (small 44px) with a pressable bottom edge; all
  controls at least 44x44px.

## No layout shift
- Results regions reserve `--results-min` (160px); shared result links reserve 70vh.
- The rack preview reserves its height (48px) in the HTML; the tile finders render their seven
  ghost slots at build time, so the preview never moves content on load.
- Ad slots reserve `--ad-h` (280px mobile, 110px from 768px) with `contain: layout style`; hidden on
  query-string URLs. Elements with `hidden` are forced hidden (`[hidden] { display: none !important }`).

## Motion
One-time only: hero tiles drop in (0.55s, staggered), rack tiles pop as you type, result chips lift
in (transform only, never opacity, so text keeps full contrast), hover lifts of 2-3px.
`prefers-reduced-motion: reduce` turns all animation and transitions off.

## Measured contrast (October 2026 refresh)
`node scripts/contrast.mjs` (also `npm run check:contrast`) composites the real backgrounds of every
visible text style and input border on 11 URLs, light and dark, 360 and 1280px: 952 unique styles,
0 below 4.5:1 (3:1 for large text and input borders), lowest 3.75:1 (an input border, which needs
3:1). axe-core: no serious or critical issues on any template in either theme.

## Earlier design: measured contrast (Phase 3, superseded by the refresh above)

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

## Phase 3 changes (earlier design)
- Dark theme: button text is dark (`#1d1410`) on the orange accent (white was below 3:1).
- Light theme: prose links and tile-value numbers use `--link` `#a3431d`.
- Theme toggle icon is an inline SVG (the ◐ glyph rendered clipped on some systems).
- Result groups use `content-visibility: auto` so long result lists don't lay out off-screen groups.
- Query-string (shared result) pages reserve `70vh` for results so arriving results don't shift visible content.
- Tables wrap inside cells on phones; no page scrolls horizontally at 360px (tested).
- Screenshots: `node scripts/screenshots.mjs` writes 40 images (10 pages × 360/1280px × light/dark) to `reports/screens/`.
