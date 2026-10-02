# Letterpile visual refresh v2: "Tile Table, Night Edition" (design mockups, nothing deployed)

**Current files (v2):** `home-mockup-v2.html`, `tool-mockup-v2.html`, `screenshots/v2-*.png`. The earlier teal/cream version is kept untouched as `home-mockup.html`, `tool-mockup.html`, `screenshots/*` (v1) and `DESIGN-NOTES-v1.md`.
Each mockup is one self-contained file (~43-45 KB, inline CSS + ~3 KB JS, system fonts, zero external requests).
Source studied: `NZ-EVONY/websites`, branch `claude/new-session-9zuiol`, folder `Letterpile/` (read-only clone; nothing pushed).

## What changed from v1 (Bee's feedback)
Bee preferred the navy / electric-blue / neon-violet mood of her reference screenshots and liked blue better than green. v2 swaps the teal felt for a **deep navy "stage"** with **electric blue** as the main accent and **violet** as the secondary. Colours were sampled from her screenshots (base `#141d3d` / `#0e1735`, panel `#182353`) and then pushed slightly deeper and retuned for contrast. The green now only appears as one of the five tile colours (mint).

## The idea
The **stage** (header, hero, footer) is deep navy in both themes, with a faint electric-blue board grid and a soft blue glow behind the hero tile pile. Under it the page is **dark navy by choice** or a **clean cool-white light mode** via the header toggle. **Letter tiles with point values** (coral, sunshine, mint, blue, violet) are the character: logo, hero pile, rack preview, category badges, tool icons, step numbers, result chips. Buttons are chunky and pressable (electric blue, navy text). Dark cards get thin neon-ish coloured borders like the reference. No purple gradients, no gradients behind text, no web fonts.

## Palette tokens (v2)
| Token | Light theme | Dark theme | Use |
|---|---|---|---|
| `--stage` / `--stage-2` | `#0A1030` / `#131B45` | same | header, hero, footer, hero input (always navy) |
| `--stage-ink` / `--stage-muted` | `#FFFFFF` / `#D3DBFF` | same | text on the stage (17.1:1 / 12.5:1 on `#0A1030`) |
| `--stage-grid` / `--stage-line` | `rgb(77 141 255 / .10)` / `#2D3E86` | same | hero grid, footer rules, menus |
| `--bg` | `#F3F5FF` | `#0E1735` | page |
| `--surface` / `--surface-2` | `#FFFFFF` / `#E8ECFF` | `#161F4A` / `#1D2960` | cards / quiet panels |
| `--ink` | `#0A1030` | `#F2F5FF` | body text (17.1:1 / 16.2:1 on bg) |
| `--muted` | `#4A557F` | `#AEBBE6` | secondary text (6.2-7.3:1 / 7.2-9.3:1) |
| `--link` | `#1F4FD8` | `#7FB0FF` | links (5.6-6.6:1 / 6.2-8.0:1) |
| `--outline` | `#1F4FD8` | `#4D8DFF` | secondary buttons, segmented control, hover borders |
| `--line` / `--field` | `#CBD3F5` / `#6A76A8` | `#2D3E86` / `#7F92E6` | decorative borders / input borders (>=3.7:1, needed 3:1) |
| `--blue` (main accent) | `#4D8DFF` | same | primary button, active segment, hover, hero input border (navy text on it 5.8:1) |
| `--violet` (secondary) | `#9A7BFF` | same | active nav pill, hero eyebrow (navy text 5.9:1) |
| Tiles `--coral --sun --mint --tile-blue --tile-violet --wood` | `#FF7A5C #FFCC33 #35DCA2 #5C9DFF #A98BFF #FFE9B8` | same | tiles, cards, chips; text always `--tile-ink #0A1030` (7.3, 12.3, 10.5, 6.8, 6.9, 15.6:1) |
| `--focus` / `--focus-stage` | `#1D3FD1` / `#FFDD55` | `#FFDD55` | 3px focus ring (7.2:1 on light bg; 13.9:1 on navy) |

Category colours: Word finders coral (W4), Starts with sunshine (S1), Ends with blue (E1), Contains mint (C3), Guides violet (G2). Result chip edge by length: 7 coral, 6 sunshine, 5 mint, 4 blue, 3 violet; 7-letter "all tiles" words are filled coral. Colour is never the only cue. In dark theme the category cards become `--surface` with a coloured border and soft glow; in light theme they are filled with the tile colour.

**Theme default (decision for Bee):** the stage is always navy so the dark look is the first thing everyone sees; the page body follows the visitor's system setting until they press the toggle (stored in `localStorage.theme`). If you want *everyone* to start in dark regardless of system setting, change the head script to set `data-theme="dark"` when nothing is stored (one line; light stays available via the toggle).

## Type scale (system fonts only)
Display/headings: `ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, ...` weight 800 (rounded on Apple, plain system sans elsewhere; layout is flexible so widths can differ). Body: `system-ui` 17px/1.6.
Hero H1 `clamp(2.4rem, 7.5vw, 4.25rem)` · tool H1 `clamp(1.9rem, 5vw, 2.6rem)` · H2 `clamp(1.6rem, 3.6vw, 2.25rem)` (prose H2 1.5rem) · card H3 1.5rem (small H3 1.15rem) · lede 1.05-1.25rem · body 1.0625rem · meta/chips .86-.95rem · labels .8rem caps +.07em · tile letter = 0.5 x tile size, point number 0.24 x (min 10px). Tiles: 28 (logo), 36-48 (UI), 64 (cards), 92 (hero pile).

## Motion
One-time only, none looping: hero tiles drop in (0.55 s, staggered), rack tiles pop as you type, result chips rise in (max 0.3 s), hover lift 2-3 px, button press. `prefers-reduced-motion` turns all of it off. Theme toggle: system by default, override stored in `localStorage.theme` (same key as today).

## Ads
Slots are `hidden` in the mockups (ads OFF). `?ads=preview` shows labelled placeholders for layout checks. Placements follow the repo's own rules (`tests/e2e/layout.test.mjs`): never above H1, never inside the tool card/results/form, >=150 px from controls (measured 229 px on the tool page), max 3 per page (mockups: home 2, tool 2 incl. a sidebar one), reserved heights 280/110 px (`--ad-h`).

## How it maps onto the repo (`Letterpile/`)
| File | Change |
|---|---|
| `src/assets/style.css` (19.6 KB) | **Main work.** Replace tokens (keep existing names `--bg --surface --text --muted --line --accent --link --tile --tile-edge --tile-ink` where possible, add `--stage --stage-2 --stage-ink --stage-muted --blue --violet --outline --coral --sun --mint --tile-blue --tile-violet --wood --field`), restyle masthead/nav (navy stage + pill nav, violet current page), `.panel`, `.btn`, inputs, `.word` chips, `.group`, `.tiles`, sidebar `.ico`, footer, `dialog.define`, FAQ. Keep ad-slot, CLS and `.has-query` rules. Add `.hero`, `.cats`, `.tools`, `.az`, `.steps`, `.guides`, `.pile`, `.rack`. |
| `src/templates/layout.mjs` | `theme-color` metas from config (both `#0A1030`, the stage colour); wrap the home page's tool panel in `.hero`. Do **not** change `HEAD_SCRIPT` (its SHA-256 is pinned in `public/_headers`). |
| `src/templates/partials/header.mjs`, `nav.mjs` | Colour the three brand tiles (L coral, P sunshine, ! blue), navy masthead with pill nav. Keep ids `menuToggle navbar moreMenu themeToggle` (used by `site.js` and tests). |
| `src/templates/partials/sidebar.mjs` | `.ico` tiles get a colour class by index. |
| `src/templates/partials/footer.mjs` | Navy stage footer, add "Email nz@letterpile.app" line, keep every existing link, licence and trademark text. |
| `src/templates/partials/home-extras.mjs` (new) + `content/pages/index.mjs` | Category cards, 10-tool grid, A-Z tiles (counts from `ctx`), how-it-works, guides teaser. Rendered between the tool panel and the existing SEO prose; **keep `<body data-page="unscrambler">`, H1 "Word Unscrambler", title, meta description, all ids**. |
| `src/assets/site.js` | Tiny additions: tile rack preview mirroring `#letters`/`#rack` (decorative, `aria-hidden`), and a `data-len` attribute on `.group` so group colours can follow length. Rendering markup of `.word` buttons otherwise unchanged. **No change to `worker.js`, `engine.js`, `data/`, `scripts/pagegen.mjs`.** |
| `site.config.json` | `themeColorLight` and `themeColorDark` both to `#0A1030`. **Also fix identity fields, see Risks.** |
| `docs/DESIGN.md` | Update palette/type tables (docs only). |
Not touched: `public/` (generated by `npm run build`), `content/affixes.json`, `config/quality.json`, tests (add new ones only).

## Estimated effort
Roughly 3 to 4 focused days by hand, or one long Claude Code session (half a day to a day) plus a human review pass: CSS rewrite 1-1.5 d, templates/partials 0.5 d, home extras partial 0.5 d, rack-preview JS 0.25 d, QA (unit, build, regression, e2e, Lighthouse, screenshots at 360/390/1280, light/dark) 0.5-1 d. The Contains hub is extra, see Risks.

## Risks and things to decide
1. **Personal name and wrong email are in the branch.** `site.config.json` has `operatorName`/`authorName` = a real personal name and `contactEmail` = another site's address; they render into about, contact, privacy, terms and every guide's JSON-LD `author` (Person). The live site currently shows `nz@letterpile.app`. The refresh branch must fix this before anyone deploys it.
2. `about.mjs` carries an HTML comment inviting a disclosure paragraph; it ends up in `public/about.html` source. Remove it (no AI disclosure text on pages).
3. **"Contains" has no hub page** today (only the Contains filter and `/words-by-length`). The mockup card points to `/words-by-length`; either build a hub later (needs pagegen work) or swap the card for "By length".
4. Home page is the Unscrambler tool itself. The mockup keeps the H1 and SEO copy, but the hero is a visual change on the most valuable URL: ship behind a before/after check of Search Console and Core Web Vitals.
5. Strict CSP: **no inline `style=""`**, one hashed inline script. All styling must live in `style.css`. The mockups follow this (0 `style=` attributes) but use an inline `<style>` and a different inline script for convenience.
6. CLS budget (<= 0.02): reserve rack-preview height (`min-height` 48 px), keep `--results-min`, don't animate layout properties.
7. The hero grid is a 10% electric-blue CSS gradient behind text, and a blue glow sits behind the tile pile; axe reports colour contrast "incomplete" there (it cannot compute over gradients). My own check composites flat backgrounds only and ignores those overlays; they are faint, so ratios barely move (lowest measured text pair 5.8:1, a lot of headroom).
13. v2 is deliberately dark-heavy: navy header, hero and footer in *both* themes. That is the look Bee asked for, but it means the light theme is "light page, dark stage", not a fully light site. Plain-white users of light mode may expect more white at the top.
14. Neon-style blue/violet on navy is easy to over-glow. The mockup limits glow to the hero input ring, the pile, and dark category cards; resist adding more.
8. Rounded display font differs by OS (rounded on Apple, plain sans on Windows/Linux/Android). Screenshots show the Linux fallback (Noto Sans), the widest case.
9. Mockup numbers (172,823 words, A-Z counts) are copied from the live/branch pages; in the build they must come from `ctx`.
10. Real results use `.word` buttons with tap-for-definition; the mockup's dialog shows the restyled look only, and no lookup is made.
11. Ad slot partial renders `<aside aria-label="Advertisement">`; with several slots visible axe flags `landmark-unique` (best-practice). Mockups use a plain `div` with a visible "Advertisement" label; recommend the same.
12. Git history of the branch still contains the personal name; scrubbing the working tree does not remove it from history.

## Ready-to-paste Claude Code prompt

```text
You are working in Letterpile/ of the NZ-EVONY/websites repo (branch: create claude/letterpile-refresh from claude/new-session-9zuiol). Read Letterpile/CLAUDE.md and docs/STATUS.md first and obey the Hard rules there. Work only inside Letterpile/. Do not touch the sibling project folders. Never deploy: no wrangler deploy, versions upload, login, whoami, secret, kv, r2, d1, tail, rollback or delete; `npm run dry-run` is fine. Do not push; commit locally only.

GOAL
Implement the "Tile Table, Night Edition" visual refresh from the two reference mockups (home-mockup-v2.html, tool-mockup-v2.html, which I will place in Letterpile/docs/design-mockups/). Ignore the older v1 teal files. Only the look changes. Keep what every page does.

DO NOT CHANGE
Word data (data/, public/data), src/assets/engine.js, worker.js, search/filter logic, scripts/pagegen.mjs, content/affixes.json, config/quality.json, URLs, titles, H1s, meta descriptions, JSON-LD structure (except author, below), element ids, <body data-page>, and the HEAD_SCRIPT in layout.mjs (its hash is pinned in public/_headers). public/ is generated: run npm run build, never hand-edit.

DESIGN
Tokens. The "stage" (masthead, home hero, footer) is navy in BOTH themes: stage #0A1030, stage-2 #131B45, stage-ink #FFFFFF, stage-muted #D3DBFF, stage-line #2D3E86, faint electric-blue grid rgb(77 141 255 / .10). Page tokens (light / dark): bg #F3F5FF / #0E1735; surface #FFFFFF / #161F4A; surface-2 #E8ECFF / #1D2960; ink #0A1030 / #F2F5FF; muted #4A557F / #AEBBE6; link #1F4FD8 / #7FB0FF; outline #1F4FD8 / #4D8DFF; line #CBD3F5 / #2D3E86; field (input borders) #6A76A8 / #7F92E6; focus #1D3FD1 / #FFDD55 (always #FFDD55 on the stage). Accents, same in both themes: electric blue #4D8DFF (primary button, active segment; navy text) and violet #9A7BFF (current-page nav pill, hero eyebrow; navy text). Tile colours with navy text #0A1030: coral #FF7A5C, sun #FFCC33, mint #35DCA2, blue #5C9DFF, violet #A98BFF, wood #FFE9B8. Category cards are filled with the tile colour in light theme and are dark surfaces with a coloured border in dark theme. Result chip edge by length: 7 coral, 6 sun, 5 mint, 4 blue, 3 violet. The page follows prefers-color-scheme until the header toggle is used (localStorage "theme"). Keep existing custom-property names where they exist and add the new ones. System fonts only (headings: ui-rounded stack, weight 800). Tiles carry a small point value. Motion is one-time and subtle; honour prefers-reduced-motion.

WORK
1. src/assets/style.css: new tokens and components per the mockups (pill nav, navy stage hero with faint blue grid, tile rack preview, chunky buttons, word chips with length-coloured edge, category cards, tool grid, A-Z tiles, steps, guide cards, navy stage footer, restyled definition dialog, FAQ). Keep ad-slot, CLS and .has-query rules. No inline style attributes anywhere (CSP style-src 'self').
2. Partials (header, nav, sidebar, footer, layout): colour the brand tiles and sidebar icons, keep ids menuToggle, navbar, moreMenu, themeToggle and all existing links and text.
3. New partial src/templates/partials/home-extras.mjs, used by content/pages/index.mjs between the tool panel and the existing prose: category cards (Word finders, Starts with, Ends with, Contains, Guides), the ten-tool grid, A-Z tiles with counts taken from ctx, how-it-works, three guide cards. Contains has no hub page: link it to /words-by-length. All numbers come from ctx, never typed.
4. src/assets/site.js: add only (a) a decorative aria-hidden tile preview of the typed letters and (b) data-len on .group in the existing group renderer.
5. Ads stay OFF: keep the existing ad-slot/cmp/adsense partials and their disabled state; slots must keep the existing placement rules (never above H1, not inside tool card/results/form, >=150px from controls, max 3).

IDENTITY AND COPY (must be true in src/, content/, docs/, public/ after build)
- Publisher is "Letterpile" / "an independent publisher in New Zealand". Set operatorName and authorName in site.config.json accordingly so about/contact/privacy/terms read naturally; change the JSON-LD article author from Person to Organization "Letterpile".
- No real personal name anywhere: after the change, a case-sensitive search of Letterpile/ (excluding node_modules) for the name must return nothing.
- contactEmail = nz@letterpile.app everywhere; the other site's domain must not appear in Letterpile/.
- No disclosure text about how the site was made on any page, and remove the HTML comment in content/pages/about.mjs that asks for one.
- No third-party requests from pages: no web fonts, analytics, CDNs. The definition lookup keeps its existing user-initiated behaviour and disclosure.
- Keep the existing trademark disclaimer and ENABLE licence text; never claim "official" or "valid in Scrabble"; no "Scrabble" in titles/H1/descriptions.

TESTS
Add a build test that fails if public/**/*.html contains the personal name, the other site's domain, "the disclosure wording" or inline style="" attributes, and that nz@letterpile.app is present on contact. Then run and report: npm test, npm run regression, npm run test:e2e, npm run lighthouse (mobile >= 98 on all URLs), npm run check:deploy. Fix failures; do not weaken or delete tests. Also capture screenshots at 1280 and 390 px, light and dark, and check no horizontal scroll at 360 px and text contrast >= 4.5:1 (3:1 large text and form borders).

REPORT in three buckets as CLAUDE.md requires: VERIFIED (quote command output), IMPLEMENTED NOT TESTED, NOT VERIFIED / COULD NOT DO. Update docs/DESIGN.md, docs/DECISIONS.md (one line per default chosen) and docs/UNVERIFIED.md. Never write "all tests pass" unless you just ran them.
```

## What was measured for v2 (Chrome 154 headless on the box, Playwright + Lighthouse 13.5 + axe-core 4.13)
- **Lighthouse mobile** (simulated throttling, localhost): home and tool both Performance 100, Accessibility 100, Best Practices 100; LCP 1.2-1.3 s, CLS 0, TBT 0 ms, 43-44 KiB. SEO shows 60 only because the mockups carry `noindex` on purpose. Lighthouse does not emulate dark mode, so dark was covered by axe and the contrast script.
- **axe-core** (WCAG 2.0/2.1/2.2 A+AA + best-practice): 0 violations on both pages, light and dark, 1280 and 360 px. Colour contrast over the hero gradient overlays is "incomplete" in axe (cannot compute), hence the separate script.
- **Contrast script** (alpha-composited backgrounds, every visible text style): 506 unique text styles across home/tool x light/dark x 1280/360, 0 below 4.5:1 (3:1 large text); lowest 5.82:1 (navy text on electric blue). Input borders 3.7-6.3:1 against their surfaces (need 3:1).
- **Layout:** no horizontal overflow at 1280, 1024, 900, 768, 390, 360 px, nor with JavaScript off at 360; no clipped chips/cards; hero tile pile never overlaps the copy; all buttons, inputs and chips >= 44 px (only the checkbox glyph itself, inside a 44 px label, and titles of whole-card links are smaller); one H1, one `main`.
- **Behaviour:** theme toggle follows system, overrides, persists after reload; rack preview mirrors typing; filters and both sort views give the right counts (237 words from AEINRST, 9 seven-letter); dialog opens/closes with Esc; mobile menu works; keyboard focus ring visible (3px); no console errors; **0 network requests**; 0 `style=` attributes; no `infinite` animations; ads hidden by default, `?ads=preview` shows them, in-article slot 229 px from the nearest control; no personal name, no other site's domain, no AI wording; `nz@letterpile.app` present.
- **Pixel checks (not descriptions):** stage renders `#0a1030`, dark page `#0e1735`, light page `#f3f5ff` in the screenshots.
- One automated run showed two theme-toggle checks failing; they passed on an immediate rerun and in an isolated debug script (the failure looked like a timing flake in the test, not in the page), but I did not find the exact cause.
- **Not measured:** Safari/Firefox/real phones, Apple rounded display font (Linux fallback in screenshots), the repo's own test suite (nothing in the repo was changed). Screenshot descriptions are unreliable, so judge the look by opening the PNGs.
- Screenshots: `screenshots/v2-{home,tool}-{1280,390}-{light,dark}-{fold,full}.png`, plus `v2-tool-1280-light-ads-preview-full.png`, `-dialog`, `-grouped-filtered-focus`, `v2-tool-390-dark-filters-open-fold.png`, `v2-home-360-menu-open-light-fold.png`.
