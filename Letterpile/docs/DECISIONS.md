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

- 2026-10-03: Dark is the default theme for everyone (no system-theme following). Light stays available via the header toggle (data-theme=light, saved in localStorage). theme-color meta is a single dark value.

## Daily games (October 2026)

- Daily puzzles are static JSON files chosen in the browser by the UTC date; no Worker code, no cron. Published under `/puzzles/` (5-minute cache) rather than `/data/` (cached as immutable for a year). See `GAMES.md`.
- Header: "Daily Games" is a mint pill before the tool links. To keep the header on one line at 1120px+, "Tile Game Word Finder" moved from the main nav to the top of the "More Word Games" menu; every list that uses main + more (tool grid, sidebar, footer) keeps the same order.
- Home: a "Today's puzzles" band (four game cards) sits above the category cards; its small script (`games/band.js`) doesn't load the games core, to stay within the home page's 15 KB JS budget.
- Game pages use a new page type `game` (full-width board, no sidebar, no ad slots); the hub uses type `games`. Both have `enabled: false` in `config/ads.json`.
- Game styles are in a separate `games.css` (loaded on the games pages and the home page) so `style.css` stays under its 12 KB budget.
- Daily Word: answers from a hand-picked list (881 words), none ending in a plural S; guesses accept every five-letter ENABLE word not hidden by the blocklist. No answer repeats within 365 days. Statistics count only today's puzzle, not archive games.
- Sudoku difficulty by weekday: Mon and Tue Easy, Wed, Thu and Sun Medium, Fri and Sat Hard (Saturday has fewer givens). Every puzzle can be solved without guessing.
- Word search: words of 4+ letters only (three-letter words turn up by chance in a 20×20 grid, breaking "exactly once"); phrases are hidden without spaces. A blocklisted word inside a theme word (COMPASS) is allowed; the same letters made by filler or across two words are not.
- Crossword fill: entries limited to 3-10 letters (the daily rules allow up to 15; long stacks need a much larger word list). Commonness from SCOWL levels (vendored as `scripts/games/lexicon/crossword-fill.txt`, licence in `licenses/SCOWL-Copyright.txt`); grids are filled from ENABLE and then repaired until every entry is common or clued.
- Crossword clues are all hand-written into `scripts/games/lexicon/crossword-clues.txt`; a date is published only when every entry has a clue. The same answer is used at most 3 times and never with the same clue within 35 days.
- Archive: only the previous 7 days, linked from `/games` by script (static pages carry no query-string links).
- The weekly supply check is a GitHub Action in the repository root (`.github/workflows/`), the only file of this work outside `Letterpile/`.
- Game registry in `config/games.json`; the crossword is `optional` (card hidden on days without a puzzle, not counted by games:check) until it is restocked, at the owner's request.
- Sharing: Web Share API plus "Copy result" and a Facebook share link (sharer.php with the game URL; the result text is copied first because Facebook ignores prefilled text). Static 1200x630 share images per game page.
- Hint pages: one page per game (`/games/word/hints`) filled in by script from today's puzzle, rather than a static page per day, so no future answers are published.
- Letterpile par uses common words (SCOWL <= 35) in the solver, so par reflects routes a player could realistically find; any ENABLE word may be played. Puzzle numbers count from 17 October 2026 (Letterpile #1).
- JS budget on game pages raised from 15 KB to 20 KB (gzip) in the build test: the games are interactive apps. The Letterpile generator/solver (lp-gen.js) and Practice word list still load only on the Practice page.
- Letterpile column collapse (owner's rule change after playtesting): empty columns close up after gravity in all three modes. All daily piles were regenerated from 2026-10-17 under the new rule; saved progress that no longer replays is dropped. Unreachable tiles are found with a sound letter-count test (no word in the list can be spelled from the remaining tiles with that letter), so a dimmed tile is never actually clearable; some stuck tiles may stay undimmed until the game ends.
- Phase 4 tool names are generic (Letter Hive, Word Grid, Letter Box, Multi-Board, Word Ladder, Hangman, Cryptogram, Rhyming Words, Syllable Counter); puzzle brand names appear once in each page's copy to describe the kind of game, and in the footer trademark notice.
- Phase 4 solvers rank results with a shipped common-words list (SCOWL levels 10-35, ~36,000 words, ~97 KB gzip), approved by the owner. Letter Box and Word Ladder default to everyday words; Hive, Hangman and Grid list everyday words first.
- Phase 4 searches run in a separate worker (`js/tools-worker.js`, loaded by `js/wt-client.js`) so `engine.js` and `worker.js` stay unchanged; the search code (`js/wordtools.js`) loads on the page only if workers are unavailable, keeping tool pages within the 15 KB JS budget.
- Rhymes and syllables use the CMU Pronouncing Dictionary (first pronunciation only), shipped as one JSON file (~270 KB gzip) loaded on those two pages only. Perfect rhyme = same sounds from the last primary-stressed vowel; near rhyme = same sounds from the last vowel. Syllables not in the dictionary are estimated from spelling and marked ~.
- Rhyming Words and Syllable Counter are separate pages (the brief listed them together) so each has its own copy and FAQ.
- The More menu shows two columns at 1000px and wider now that it holds 16 tools.
- Phase 5: the Board Solver is its own page (/board-solver) in the More menu. It uses the standard 15x15 bonus layout, editable square by square; "Words With Friends values" switches letter values and the all-tiles bonus (35) but not the layout, which differs and isn't built in. Board, rack and edited bonuses are kept in the address bar.
- Phase 5: the Board Solver counts as an interactive app for the JS budget (20 KB, like the game pages); every other tool page stays at 15 KB.
- Phase 5: "Scan tiles" self-hosts Tesseract.js 7.0.0 (owner's choice) under /vendor/tesseract-7.0.0/ (~14 MB, about 6 MB of it downloaded on first use: library, worker, one engine build chosen by the browser's features, English model). CSP script-src gained 'wasm-unsafe-eval'. Photos are read with createImageBitmap (no blob: URLs, so img-src is unchanged), and the camera opens through <input capture>, so Permissions-Policy keeps camera=().
- Phase 5: the scanner finds light tile squares, cuts out the largest dark shape in each (ignoring the small point value) and reads the letters as one clean row, then one by one if the count doesn't match. Unreadable tiles show as ? for the visitor to fix. The scan button is on the Unscrambler, both finders, the Anagram and Text Twist solvers and the Board Solver (not the Letter Hive: those letters come from a screen, not tiles).
- Phase 5: hooks appear in the word window on every page with the word engine (all tool pages); they respect the "show all words" setting and each hook word opens its own window.
- Phase 6 (owner approved): static word pages only for the most common words (SCOWL size 10, 3-8 letters, visible in ENABLE): 3090 pages at /word/{word}, keeping public/ under 5,000 files. "index" (it would clash with the folder index) and cheat/official/hack/exploit forms (kept out of page text by the site's wording rules) get no page. Every other word is looked up at /word?w=, filled in by script (js/word.js), which adds noindex for looked-up words and sends words that have a page to that page. Vulgar words get no pages and appear in no list.
- Phase 6: word pages are a templated type ("word") for the similarity gate (0.6, like the generated list pages); the per-page facts and word lists are what differ. Lists of words on them are in <p class="wordlist"> and link to other word pages. Links to tools from word pages don't carry the word in the address, because the site's link rules allow no query strings in static links.
- Phase 6: sitemap.xml is now a sitemap index pointing to sitemap-pages.xml and sitemap-words.xml.
- Phase 6: curated lists live under /lists (hub plus nine lists). Long lists are trimmed and each page states what it keeps: Z and X words up to seven letters plus everyday longer ones; double letters, very common words only (SCOWL 10-20); five-letter pairs, everyday words first. QI and ZA are not in ENABLE, so the pages say so instead of listing them.
- Phase 6: the word window links to /word?w= for every word ("Word page"). The build now takes about 45 seconds (word pages included).
- Phase 7: Word of the Day notes (meaning and usage) are written by Claude in batches of 7 and published only after the owner changes their status to "ok" (owner's choice); the word-game fact is computed, not written. Batch 1 (2026-10-17 to 10-23) is in scripts/games/wotd-review.md; until a day is approved, the page shows "Come back soon" and the home page shows no Word of the Day line.
- Phase 7: words come from the word-page set (SCOWL size 10), so every Word of the Day links to its word page. The archive is the last 7 days, like the games.
- Phase 7: the all-games streak counts a day when every game with a puzzle that day was finished, solved or not; the Word of the Day doesn't count.
- Phase 7: Training (/training) is one page with four drills (two- and three-letter quizzes, a 60-second anagram drill, Q-without-U flashcards). A quiz word is "mastered" after three right answers in a row. Drill racks are very common 7-letter words with at least six different letters. Linked from the two-letter, Q-without-U and anagram guides and the More menu.
- Phase 8: crosswords are left out of printables (owner's choice): filling a grid takes minutes and needs hand-written clues.
- Phase 8: the word search and sudoku cores moved into src/assets/games/ws-core.js and sd-core.js, loaded by both the daily generators (Node) and the printables page (browser), so they share one implementation. Regenerating every existing daily word search (with the theme list it was made from) and every daily sudoku from these cores gave byte-identical puzzles (37 of 37 each).
- Phase 8: printable levels. Word search: kids 10x10, 8-10 single words of up to 7 letters, across/down/diagonal down; teens 15x15, 14-16 words up to 11 letters, six directions; adults 20x20, 25-30 words, all eight. Sudoku: easy (singles only, 34-38 clues), medium (pointing pairs, 28-32), hard (pairs and triples, 24-27). PDFs are US Letter, puzzle on page 1 and answer key on page 2, with a one-line letterpile.app credit.
- Phase 8: "teacher mode" is not a switch: rude words are always excluded from word lists and checked out of filler letters, and the page says so with a checked, locked box.
- Phase 8: two word search themes were added for the theme pages, Holidays and Four Seasons. They also join the daily theme rotation from the next generated day (new themes are picked before reused ones); existing puzzles are unchanged. Theme pages: animals (On Safari), holidays, seasons, space (Outer Space), food (Fruit Bowl), sports (Sports Day), each with three ready-made puzzles built from a fixed seed.
