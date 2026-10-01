# Step 0 audit (before any change)

Audited 2026-10-01 (container clock, UTC) in a Claude Code cloud session, on the files Bee committed as `Letterpile/` in `NZ-EVONY/websites` (commit `25944fa`, now tagged **`live-before-upgrade`**).

## Things that change the plan (read first)

1. **Environment differs from the brief.** This ran in a cloud container, not on Bee's PC "RYZEN". The folder was already inside a git repo (`NZ-EVONY/websites`, alongside a sibling project folder), so no `git init`. The baseline commit is Bee's own commit `25944fa`, tagged `live-before-upgrade`. The `.backup/` zip was made from that tag inside the container (gitignored, so it is **not** on Bee's PC; the git tag is the rollback point). Work is pushed to branch `claude/new-session-9zuiol`.
2. **The live site could not be reached from this environment.** The network policy denied `letterpile.app` (proxy returned 403 to CONNECT). All "Live behaviour" statements in the brief remain **NOT VERIFIED** here; the regression baseline was built from the committed files instead (`tests/baseline/live-urls.json`). Bee can verify them with the `curl` commands in `docs/DEPLOY.md`.
3. **Two proposed titles are longer than 60 characters** (the brief says they fit): "Wordle Solver: Possible Answers from Your Guesses | Letterpile" is 62 and "Words With Friends Word Finder: High-Scoring Plays | Letterpile" is 63. The test caught it; shorter titles are used (`docs/DECISIONS.md`).
4. **The live copy relies on words that are not in ENABLE**: `qi`, `za` (unscrambler "(It is.)" joke, finder strategy tip) and `qorma` (crossword table). Rewritten; the build now refuses copy that names a word not in the list.

## Known state: confirmed or contradicted

| Statement in the brief | Result |
|---|---|
| File list and sizes | **Confirmed list.** Sizes in git are a few bytes smaller per file than the brief (e.g. `index.html` 5,733 vs 5,823; `data/words.js` 2,805,537 vs 2,805,539): the git copies have LF line endings, the PC copies presumably CRLF. Files edited here keep LF. |
| No `package.json`, tests, favicon file; inline SVG favicon | Confirmed. (`.git` exists at the monorepo root.) |
| `wrangler.jsonc` content | Confirmed exactly (`directory: "."`, two custom-domain routes). |
| `.assetsignore` content | Confirmed (`wrangler.jsonc`, `README.md`, `node_modules`, `.wrangler`). |
| `data/words.js`: 274,137 words, a–z, 2+ letters, no 1-letter words | **Confirmed** (VERIFIED by script): 274,137, all a–z, unique, 0 one-letter words. Not in plain sort order (irrelevant to the engine). |
| 124 two-letter, 12,578 five-letter words in the live list | **Confirmed.** |
| ENABLE 172,823 words, SHA-256 `3f161302…1a89` | **Confirmed** on the downloaded file. |
| Overlap 172,298 / 525 only-ENABLE / 101,839 only-live | **Confirmed** (`docs/WORDLIST-DIFF.md`). |
| `qi`, `za`, `zzz` in live list, not ENABLE; neither has `ok`, `ew`; both have `jo`, `xu` | **Confirmed** (test `words the copy says are missing…`). |
| ENABLE reference counts: 96 two-letter, 21 Q-without-U, 121 / 20 vowel-less | **All confirmed** (test `planner reference counts`). |
| Live behaviour table (status codes, redirects, robots.txt, www/http duplicates) | **NOT VERIFIED**: host blocked from this environment. |
| Good (keep) list | Confirmed: clean dependency-free code, CSS variables, light/dark, dialog, toast, `history.replaceState` URLs, `engine.js` pure and Node-loadable. |
| (a) No canonical/OG/Twitter/JSON-LD/theme-color | Confirmed. |
| (b) Header, menu, sidebar, footer injected by `site.js` | Confirmed (`renderChrome()`); measured cost: CLS 0.079 on `/` (Lighthouse, below). |
| (c) No trust pages | Confirmed. |
| (d) Thin text | Confirmed. Visible words in raw HTML (no nav/footer, since those were injected): `/` 231, scrambler 251, combiner 201, scrabble finder 269, WWF 212, Wordle 203, anagram 157, jumble 165, crossword 168, twist 204. No FAQs, guides or list pages. |
| (e) No sitemap, ads.txt, robots rules, 404, `_headers`, CSP | Confirmed (files absent). |
| (f) Menu links use relative `*.html` | Confirmed (`NAV`/`MORE` in `site.js`, `href="index.html"` etc.). |
| (g) Inline `<script>` per page | Confirmed (10 pages; the two finders' scripts are identical). Also: Wordle page had an inline `<style>` block and many `style=""` attributes, all of which a strict CSP blocks. |
| (h) www / HTTP duplicates | Not verifiable here (see 2). |
| (i) "official"/"tournament" on the Scrabble page | Context checked: "Our dictionary is a broad English list, not an official tournament lexicon." It is a disclaimer, not a claim. Kept in spirit, reworded to the standard sentence. README had "not an official Scrabble or Words With Friends tournament dictionary" (also a disclaimer). Footer said "Scrabble® and Words With Friends® are trademarks of their owners" with no owners named. |
| (j) Definition popup calls `api.dictionaryapi.dev` on every word tap | Confirmed (`define()` fetches immediately). Also labeled points "in Scrabble". |
| (k) Engine on main thread, `setTimeout` yield | Confirmed. Long-task measurement for 15-letter + blank searches is a Phase 3 item. |

## Other findings

- **Wordle page loaded the whole 2.8 MB list on page open** (it ran `solve()` with no guesses) → Lighthouse TBT 840 ms, CLS 0.486. Word scrambler and combiner also loaded it on open.
- **Accessibility:** Wordle tile state was color-only (aria-label "c grey"), and white text on the yellow tile (`#c79a1c`) is low contrast. Skip link was hidden with an inline `left:-999px` and never became visible on focus. Dropdown was a `<button>` toggling a class (OK with JS, nothing without). Results regions had `aria-live` but `display:none` when empty (no reserved height → layout shift).
- **`innerHTML` with user-derived text** (every place, all already passed through `esc()` or reduced to a–z first, so none was exploitable): unscrambler summary (`esc(letters)`), scrambler output (`esc`), combiner and jumble input `value="${esc()}"`, anagram empty message (a–z only), jumble headings (`esc`), crossword summary (sanitized + `esc`), Wordle tiles (a–z), definition popup (third-party API text through `esc`). Decision: keep `esc()` for sanitized/engine strings, use DOM text nodes for third-party API text (`docs/DECISIONS.md`).
- **Pattern search coverage:** `/crossword-solver` supports `?`, `_`, `.` and `*` wildcards, must-include and exclude letters. Starts/ends filters are expressible as patterns. Nothing missing that would justify a separate `/word-finder` page.
- **Input limits:** unscrambler accepted 20 characters with no letter cap; the engine caps blanks at 3. Now 15 letters + 3 blanks with a message.
- **Old copy accuracy:** "about 274,000 English words" (old list size), "standard Scrabble letter values", "50-point bingo", "35-point bonus", "SLATE, CRANE and TRACE are popular choices" (unsourced popularity), "plenty of authors have hidden their real names in anagrams" (unsourced; removed), "The board's triple-letter squares sit closer to the centre than in Scrabble" (unverified product claim; removed). British spellings ("colour", "grey", "centre", "recognisable") changed to American.

## Keep / Fix / Add / Remove

| Action | Item | Files |
|---|---|---|
| Keep | All ten tools, URLs, element IDs, query parameters, look and feel | `src/assets/engine.js`, `src/assets/style.css`, `src/assets/js/*` |
| Keep | Engine logic (extended only: data URL, hidden words, limits) | `src/assets/engine.js` |
| Fix | Header/nav/sidebar/footer into raw HTML; `<details>` dropdown | `src/templates/partials/*` |
| Fix | Inline scripts → files; inline styles → classes | `src/assets/js/*.js`, `style.css` |
| Fix | Relative `*.html` links → root-relative clean URLs | `config/nav.json`, templates |
| Fix | Definition lookup opt-in, disclosed | `src/assets/site.js`, footer partial, privacy policy |
| Fix | Theme applied before paint; skip link; Wordle tile names and non-color marks | layout, `style.css`, `wordle.js` |
| Fix | Lazy word-list loading on Wordle/scrambler/combiner | `wordle.js`, `scrambler.js`, `combiner.js` |
| Fix | Copy accuracy and American spelling; numbers computed | `content/pages/*.mjs` |
| Add | Build pipeline into `public/`, hashed assets, `_headers` (CSP, security, caching) | `scripts/build.mjs` |
| Add | ENABLE list with integrity checks, blocklist + "show all words" toggle | `data/`, `scripts/wordstats.mjs` |
| Add | Trust pages, 404, robots.txt, sitemap.xml, ads.txt placeholder | `content/pages/*` , build |
| Add | Canonical, OG/Twitter, theme-color, JSON-LD, breadcrumbs | layout, partials |
| Add | Ad-slot, CMP-slot, AdSense-slot partials (no ad code) | `src/templates/partials/` |
| Add | Tests, regression baseline, Lighthouse runner, docs | `tests/`, `scripts/`, `docs/` |
| Remove | Old word list from the site (kept in git history) | `data/words.js` |
| Remove | Root `.assetsignore` (assets dir is now `public/`; a new one is generated there) | `.assetsignore` |
| Later (Phase 2) | Explainers + FAQs, 12 guides, hubs, programmatic word-list pages, HTML sitemap | |
| Later (Phase 3) | Long-task measurement / Web Worker decision, axe runs, screenshots, final report | |

## Lighthouse baseline (lab, mobile emulation)

Lighthouse 13.5.0, Chromium from the Playwright install (`/opt/pw-browsers/chromium-1194`), simulated throttling, served by `scripts/serve.mjs` from the `live-before-upgrade` files (no compression, unlike Cloudflare). Lab data only.

| URL | Perf | A11y | Best Pr. | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 98 | 100 | 100 | 100 | 1.2 s | 0.079 | 0 ms |
| `/wordle-solver` | 59 | 94 | 100 | 100 | 1.2 s | 0.486 | 840 ms |

## Top risks

1. **Word list switch is visible to returning visitors** (101,839 words disappear, Wordle five-letter pool 12,578 → 8,636). Mitigation: `docs/WORDLIST-DIFF.md`, honest copy, Bee decides when to deploy.
2. **Deploying with `{{PLACEHOLDERS}}`** (contact email, operator, governing law) would publish broken-looking trust pages. Mitigation: `npm run check:deploy` fails until they're filled.
3. **Old asset URLs disappear** (`/assets/engine.js`, `/assets/site.js`, `/assets/style.css`, `/data/words.js`, `/data/LICENSE-wordlist.txt`): a tab left open across the deploy fails to load the word list until reloaded. Pages themselves keep their URLs.
4. **www and plain-HTTP duplicates, Bot Fight Mode, Cloudflare's managed robots.txt**: dashboard-only fixes (Bee).
5. **Privacy policy is a template**, not legal advice; it must be updated before ads, analytics or a CMP are switched on.
