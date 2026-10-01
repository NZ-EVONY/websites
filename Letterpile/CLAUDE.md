# Letterpile: notes for Claude Code

**Read `docs/STATUS.md` first** (current phase, what's done, how to resume).

## Purpose
Live static site https://letterpile.app: ten in-browser word-game tools (unscrambler, scrambler,
combiner, tile-game finder, Words With Friends finder, Wordle, anagram, jumble, crossword, Text Twist),
being upgraded for AdSense readiness. Owner: Bee (New Zealand). American English.

## Stack
- Hand-written HTML/CSS/JS, no framework, no bundler. Node build script renders pages into `public/`.
- Hosting: Cloudflare Workers **static assets only** (`wrangler.jsonc`, `assets.directory = ./public`). No Worker script.
- Word list: ENABLE (`data/enable1.txt`, public domain). Build fails if its SHA-256/count differ from `data/SOURCE.md`.

## Layout
- `content/pages/**/*.mjs`: one module per page (meta + copy); numbers come from `ctx` (computed from the list). `export const late = true` renders after generated pages.
- `scripts/pagegen.mjs` + `content/programmatic.mjs` + `content/affixes.json`: generated word-list pages (quality and similarity gates in `config/quality.json`).
- `src/templates/`: `layout.mjs` + partials (header, nav, sidebar, footer, breadcrumbs, jsonld, ad-slot, cmp-slot, adsense-slot).
- `src/assets/`: `engine.js` (pure word engine, also runs in Node), `site.js` (shared behaviour), `style.css`, `js/*.js` (per-page scripts).
- `scripts/`: build, wordstats, serve (local Cloudflare-like server), lighthouse, wordlist-diff, baseline-capture, check-deploy.
- `public/`: GENERATED and committed. Never edit by hand.
- `tests/`: `unit/`, `build/`, `baseline/` (regression vs tag `live-before-upgrade`), `e2e/`.

## Commands
- `npm run build` · `npm test` (build + unit + build-output) · `npm run regression` · `npm run lighthouse`
- `npm run serve` (http://localhost:8788) · `npx wrangler dev --local` · `npm run dry-run` · `npm run check:deploy`
- `npm run wordlist:diff` regenerates `docs/WORDLIST-DIFF.md`. `npm run test:e2e`, `npm run measure:longtasks`, `npm run build:ads-preview`.
- Searches run in `src/assets/worker.js` via `UI.compute(fn, ...args)`; never call heavy `Engine.*` searches on the main thread.

## Hard rules
- **Never deploy.** No `wrangler deploy` (except `--dry-run`), `versions upload`, `login`, `whoami`, `secret`, `kv`, `r2`, `d1`, `tail`, `rollback`, `delete`. `wrangler dev` local only. Never read `.wrangler/`.
- Work only inside `Letterpile/`. Never touch the sibling project folders in this repo.
- Never claim "official", "tournament", "valid in Scrabble" or "accepted by" any game. No "Scrabble" in titles/H1/descriptions. No "cheat".
- No ad code, analytics, trackers, API keys or secrets. Only the marked integration points.
- Page text, nav and footer must be in the raw HTML. Only one inline script (hashed in the CSP); no inline styles.
- Facts in copy are computed from the list at build time (`ctx.*`) or verified; never typed from memory.
- Keep `docs/DECISIONS.md` (one line per default chosen) and `docs/UNVERIFIED.md` current.

## Reporting: three buckets, always
**VERIFIED** (ran it, saw output; quote it) · **IMPLEMENTED, NOT TESTED** · **NOT VERIFIED / COULD NOT DO** (say why).
Never write "all tests pass" unless you just ran them.
