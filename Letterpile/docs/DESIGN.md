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
- Header, nav and footer are in the HTML (no injected chrome). Lab CLS after Phase 1: 0 on `/`, `/wordle-solver`, `/privacy-policy`.

## Motion
- `prefers-reduced-motion: reduce` disables animations and transitions. Only the loading spinner animates.

Phase 3 will add measured contrast checks for every token pair and screenshots at 360px and desktop width in both themes.
