# Decisions (one line each; newest at the bottom)

- Repo: the folder already lives in `NZ-EVONY/websites`; used Bee's commit `25944fa` as the baseline and tagged it `live-before-upgrade` instead of `git init`.
- Git identity for this work: repo-local `Claude Code for Bee <noreply@localhost>` as the brief asks.
- Content files are JS modules (`content/pages/*.mjs`), not Markdown, so copy can embed numbers computed from the word list in the same build (the brief allows "JSON/JS modules").
- Assets get content-hashed names (`style.<hash>.css`, `words.<hash>.js`) with `Cache-Control: immutable`; HTML keeps Cloudflare's default `max-age=0, must-revalidate`.
- `html_handling: "drop-trailing-slash"` kept: `wrangler dev --local` showed `/`, `/word-scrambler` = 200; `/word-scrambler.html`, `/word-scrambler/`, `/index.html`, `/about.html` = 307 to the clean URL; unknown path = 404 with `404.html`. No surprises for the ten live URLs.
- Root `.assetsignore` removed; the build writes `public/.assetsignore` (Wrangler reads it from the assets directory).
- Blocklist: LDNOOBW English single words + simple inflections (-s, -es, -ed, -d, -ing, -er, -ers, -y) + a short supplement (`data/blocklist-extra.txt`) minus an allowlist of ordinary words (e.g. escort, scat, intercourse, suck, retarding). Phase 1: 324 words hidden; Phase 2 review added ethnic/religious/sexual slurs the LDNOOBW list misses (e.g. lowercase *jew* as a verb, *lez*, *gyp*, *squaw*, *fagot*) → 389 hidden. Ordinary-meaning words kept visible: *paddy*, *chink*, *gimp*, *fairy*, *limey*.
- Tools hide blocklisted words by default with a visible "Show all words, including vulgar ones" switch (remembered in localStorage `showAll`); static pages always exclude them.
- Definitions: kept the Free Dictionary API, made it a deliberate "Look up definition" button with a disclosure line, in-memory cache, polite 404/429/offline messages, `referrerPolicy: no-referrer`, `credentials: omit`.
- `innerHTML` audit: kept `esc()` for strings that are sanitized to a–z or produced by the engine; switched third-party definition text to DOM text nodes.
- More Word Games dropdown is a native `<details>`; hover-to-open on desktop dropped (closed `<details>` content can't be shown by CSS hover). Click/tap/keyboard work, with or without JS.
- Wordle Solver no longer loads the word list until a guess exists; empty state states the computed five-letter count instead of listing every word. (Behavior change; was the cause of TBT 840 ms.)
- Word Combiner no longer combines the example words on page load (needed the whole list); deep links (`?w=`) still run immediately.
- Scrambler challenge loads the list when it scrolls into view or on first interaction.
- Input caps: unscrambler and anagram 15 letters (+3 blanks for the unscrambler), scrambler answer box 40 chars, scrambler text 5,000 chars, combiner words 40 chars; characters outside a–z (and ?, *, _ where blanks are allowed) are stripped as typed.
- Wordle tiles recolored for AA contrast with white text (#6b6572 / #8a6a00 / #2e6b3a) and given non-color marks (dot = yellow, check = green).
- Title for `/wordle-solver` is "Wordle Solver: Words That Fit Your Guesses | Letterpile" (55); the brief's proposal is 62 characters.
- Title for `/words-with-friends` is "Words With Friends Finder: High-Scoring Plays | Letterpile" (58); the brief's proposal is 63 characters.
- `/scrabble-word-finder`: "Scrabble" removed from title, H1 and description (brief default); menu label is "Tile Game Word Finder". Open question for Bee in BEE-TODO.
- JSON-LD `WebApplication.applicationCategory` = `GameApplication`.
- The single inline script (theme + query-string noindex) is on every page, so any query-string URL is noindex, not only tool pages.
- `Strict-Transport-Security: max-age=31536000` without `includeSubDomains`/`preload` (conservative; `.app` is preloaded anyway).
- `ads.txt` contains only comment lines until Bee has a publisher ID; tests forbid any `pub-` number.
- AdSense integration point is a comment that tells Bee to paste the snippet from her account; it contains no script URL or ad markup (keeps the "no ad code" test strict).
- `public-manifest.json` (asset names, page list) is written at the repo root for tests; it is not deployed.
- Lighthouse runs via `scripts/lighthouse.mjs` with an async in-process server (a sync child process blocked the server and hung).
- Placeholders stay visible as `{{NAME}}` in built pages; `npm run check:deploy` refuses to pass until they are filled.

## Phase 2
- Generated word-list pages use the visible list (hidden words excluded). Families: by length (2–15), starting with, ending in. A list over 5,000 words becomes an overview that links to child pages extended by one letter (recursively); children under 100 words fold into the parent's "Other" section. Top-level length pages are always generated (the 2-letter list has 96 words).
- Generated-page URLs: `/words-by-length/{n}-letter-words[/{prefix}]`, `/words-starting-with/{prefix}` and `/words-ending-in/{suffix}` (flat, so two-letter partitions double as two-letter prefix/suffix pages). Verified in `wrangler dev --local` that `guides.html` and the `guides/` folder coexist (`/guides` and `/guides/x` both 200).
- Result: 671 generated + 23 curated affix pages = 694, at the top of the brief's 300–700 soft cap. Not reduced further: the 100-word child minimum and 5,000-word maximum fix the count.
- Curated affixes attach to the partition page with the same URL when one exists (e.g. `/words-starting-with/un`), otherwise get a standalone page.
- Quality gate (build): generated pages need ≥150 words of written copy (strict count: no tables, headings, word lists or link lists) and ≥5 `data-fact` numbers; curated affix pages ≥250. Pages failing are dropped and their words folded into the parent. Current result: none dropped.
- Similarity: 5-word shingles, Jaccard index on written copy only. Limit 0.20 whenever a hand-written page (tool, guide, hub, trust) is involved; 0.60 between two template-built word-list pages. Current maxima: hand-written 0.093 (/about ~ /terms); generated 0.545.
- Word counts for minimums (`npm run report:content`, tests) include headings and tables but exclude word lists, link lists, forms, breadcrumbs and the related-links block.
- Every number on generated pages is wrapped in `<span data-fact data-value>`; a test recounts 20 seeded random pages independently.
- "Most useful words" sample on overview pages is an evenly spaced alphabetical sample, labeled as such (no frequency data exists to rank usefulness honestly).
- Guides `datePublished` is 2026-10-01 (the date the copy was written); `dateModified` comes from git. Bee may want to set datePublished to the deploy date.
- Two-letter glosses: written for this site; words whose meaning wasn't certain (al, de, et, ne, od, oe, un, wo) get only a part of speech.
- Ad slots render on guides (after-intro, mid-article), hubs (after-intro) and curated affix pages (after-intro); never on tools (off), generated pages (`ADS_ENABLED_FOR_TEMPLATE_PAGES=false`), trust, 404 or the HTML sitemap.
- HTML site map at `/sitemap` (type "utility": no ads, no word minimum). Footer gained Guides, Word Lists and Site Map links.
- Prose link color darkened to `#a3431d` in the light theme (accent `#c2562b` on `--bg` was ~4.1:1); buttons keep the accent.
- All 726 titles are ≤ 60 characters and descriptions ≤ 155 (tested).

## Between Phase 2 and Phase 3
- Windows-reserved names: any URL segment equal to CON, PRN, AUX, NUL, COM1–9 or LPT1–9 (any case) gets a `-words` suffix (`scripts/pagegen.mjs` `safeSegment`); keys are a–z only, so the suffix can't collide. All links use the safe path; `public/_redirects` 301-redirects the natural URL (verified in `wrangler dev --local`: `/words-starting-with/con` → `/words-starting-with/con-words`). The build fails if any file or folder in `public/` has a reserved base name. Only affected page today: words starting with CON.
- Site settings from Bee: operator "an independent publisher", author "Letterpile", contact nz@letterpile.app, governing law New Zealand, lastReviewed 2026-10-01 (stored in `site.config.json`; not currently shown on any page).

## Phase 3
- Web Worker added (`src/assets/worker.js`): the measurement justified it. Before: the two-word anagram search caused a 270 ms main-thread long task unthrottled (~950 ms at 4× CPU slowdown). After: no long task ≥ 50 ms unthrottled in any measured case; worst 159 ms at 4×. All searches go through `UI.compute()`, which falls back to the main thread when workers are unavailable (tested). CSP gained `worker-src 'self'`.
- Results from an older search are discarded if a newer search started (search token in `withWords`).
- The worker returns grouped, trimmed unscramble results (`Engine.unscrambleGrouped`) so only displayed words cross back; result groups use `content-visibility: auto`.
- Tool-page ad slot markers moved: first slot after the first full section (was right after the intro, 74–101 px from the results area), second slot before the Privacy section (was directly above the FAQ toggles). Tool slots remain disabled; `npm run build:ads-preview` shows them.
- Ad slots render as empty labeled boxes until AdSense code is pasted (as the brief specifies). On guides, hubs and affix pages that means a visible "Advertisement" label over reserved blank space; see BEE-TODO.
- Placement check: in the ads-preview build every slot is ≥ 150 px from any button/input/select/summary/results area, below the h1, outside the tool card, at most 3 per page, at 360 and 1280 px (tested).

## Visual refresh: "Tile Table, Night Edition" (October 2026)
- Mockups `design/*-v2.html` are the reference; the v1 teal files were ignored. Only the look changed.
- The main navigation moved inside `<header class="masthead">` (pill nav on the navy stage); `<nav class="navbar" id="navbar">` markup and ids kept, so tests and `site.js` work unchanged.
- No-JavaScript visitors on narrow screens still get the existing behaviour (menu hidden below 860px); the mockup's `html.js` approach needs a change to the pinned head script, which was off limits.
- Home: the tool sits in a navy hero; results get their own panel below it; the sidebar's tool list is replaced by the ten-tool grid, and the page's Tip panel sits beside the copy in a `div` with the same `id="sidebar"` (an `<aside>` inside `<main>` is an axe best-practice issue).
- `site.config.json` operatorName stays "an independent publisher"; pages add "in {country}" so contact, terms, about and the footer read "an independent publisher in New Zealand". authorName/publisherName "Letterpile"; JSON-LD author is that Organization.
- The contact page's TODO comment about setting the email was removed (the email is set: nz@letterpile.app).
- Home A-Z counts are computed from the visible list (`ctx.clean`) and tested to equal the `/words-starting-with` hub's counts.
- "Contains" card links to `/words-by-length` and says so ("use the Contains filter in any finder ... or browse every word by length"), because there is no Contains hub.
- Tile point values (hero pile, category tiles, rack preview) come from the engine's `scrabble` scheme (the finders use their page's scheme); tool-grid icons are the existing nav icons without values.
- Rack preview: a decorative `aria-hidden` element mirrors the main letters input on the home page and the two tile finders (`data-rack-for`); other tools have different inputs and were left alone.
- Result-chip colour follows the group length via `data-len` on `.group`; ungrouped (score-sorted) lists keep the default wood edge.
- Chip entrance animation uses transform only (no fade): axe measured half-faded chips as low contrast.
- Global `[hidden] { display: none !important; }`: a component display rule had revealed the hidden "Privacy settings" footer link; a new e2e test checks hidden elements stay hidden.
- `theme-color` is `#0A1030` in both schemes (the stage colour).
- Screenshots script now captures 390 and 1280px (360px overflow stays covered by the e2e test) and waits for the one-time tile animations.
- `CLAUDE.md` and `docs/AUDIT.md` no longer name the sibling project folder (the brief asked that the other site's name not appear in `Letterpile/`); the hard rule now says "never touch the sibling project folders".
