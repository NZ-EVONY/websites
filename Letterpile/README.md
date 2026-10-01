# Letterpile: word game helper

Letterpile (https://letterpile.app) is a static word-tools site. Ten pages share one word engine and one word list, and every tool runs entirely in the browser. The site is built from source files in this folder into `public/`, which is what Cloudflare serves.

> **Status:** upgrade complete (all three phases); not deployed. Read `docs/FINAL-REPORT.md`. See `docs/STATUS.md`. Nothing has been deployed by the upgrade; Bee deploys with `npx wrangler deploy` after reviewing `docs/DEPLOY.md`.

## Pages

| Menu | URL | What it does |
|---|---|---|
| Word Unscrambler | `/` | Every word in your letters, grouped by length. `?` blanks; starts-with, ends-with, contains, length and use-every-letter filters |
| Word Scrambler | `/word-scrambler` | Scrambles text five ways, with up to 10 versions at once, plus an unscramble challenge game with hints and a streak counter |
| Word Combiner | `/word-combiner` | Blends 2–4 words into portmanteaus (breakfast + lunch → brunch), with blends that are real words listed first |
| Tile Game Word Finder | `/scrabble-word-finder` | Plays for your rack ranked by commonly used tile values: blanks score 0, all-tiles bonus, board letters to build through |
| More ▸ Words With Friends Finder | `/words-with-friends` | The same finder with commonly used Words With Friends values and its all-tiles bonus |
| More ▸ Wordle Solver | `/wordle-solver` | Tap tiles to set colors; handles repeated letters correctly, ranks the next guess, supports 4–8 letter variants |
| More ▸ Anagram Solver | `/anagram-solver` | Single-word and two-word anagrams (dormitory → dirty room) |
| More ▸ Jumble Solver | `/jumble-solver` | Solves up to 8 jumbled words at once, plus the final circled-letters phrase |
| More ▸ Crossword Solver | `/crossword-solver` | Pattern search (`C?O?S`) with must-include and exclude letters |
| More ▸ Text Twist & Wordscapes | `/text-twist-solver` | 3+ letter words from a letter wheel, with slot patterns and a shuffle button |

Plus 12 guides (`/guides`), browsable word lists (`/words-by-length`, `/words-starting-with`, `/words-ending-in`: about 700 generated pages, each with computed facts), About, Contact, Privacy Policy and Terms of Use pages, an HTML site map (`/sitemap`), a 404 page, `robots.txt`, `sitemap.xml` and an `ads.txt` placeholder.

Every tool page also has:
- A shareable URL: results are saved in the link (those URLs are marked `noindex`).
- Tap any word for its point value and an optional definition lookup.
- Light and dark themes (remembered in localStorage, applied before first paint).
- A layout that works on phones.

## Commands (Windows PowerShell, macOS or Linux)

Requires Node.js 20 or newer. From this folder:

```powershell
npm install              # once: installs dev tools (wrangler, lighthouse, playwright-core, axe-core)
npm run build            # builds public/ from content/, src/ and data/
npm test                 # build + unit tests + build-output tests
npm run regression       # build + live-URL regression tests (uses Chrome/Chromium if found)
npm run lighthouse       # build + Lighthouse (mobile, lab) on a local server; reports in reports/
npm run serve            # preview public/ at http://localhost:8788
npx wrangler dev --local # preview with Cloudflare's own asset handling (local only)
npm run check:deploy     # fails if placeholders or private files would be published
npm run dry-run          # wrangler deploy --dry-run (uploads nothing)
npm run wordlist:diff    # regenerates docs/WORDLIST-DIFF.md
npm run report:content   # word counts per page, flags pages under the minimums
npm run test:e2e         # browser tests: accessibility, layout shift, ad placement, long tasks, privacy behavior
npm run measure:longtasks  # main-thread long tasks during heavy searches (add 4 for 4x CPU slowdown)
npm run build:ads-preview  # build with ad slots on every page type into reports/ads-preview (never deploy)
node scripts/screenshots.mjs  # 360px/1280px, light/dark screenshots into reports/screens
```

Lighthouse and the browser tests need Chrome or Chromium. They look for Chrome in the usual Windows/macOS/Linux places, or set `CHROME_PATH`.

## Layout

```
content/pages/*.mjs   One file per page: title, description, H1 and copy. Numbers come from ctx (computed from the word list).
content/pages/guides/ The 12 guides
content/programmatic.mjs  Copy templates for the generated word-list pages
content/affixes.json  Hand-written intros for the 23 prefix/suffix pages
content/data/         Small data files used by pages (e.g. the 100-tile distribution).
src/templates/        layout.mjs and partials: header, nav, sidebar, footer, breadcrumbs, jsonld, ad-slot, cmp-slot, adsense-slot
src/assets/engine.js  Word logic (unscramble, scoring, anagrams, Wordle, blends, scrambling). Also runs in Node for tests.
src/assets/site.js    Shared behaviour: menus, theme, definition popup, results display, "show all words" switch
src/assets/style.css  All styles
src/assets/js/*.js    Each tool page's own script (formerly inline <script> blocks)
src/assets/worker.js  Web Worker that runs searches off the main thread
data/                 ENABLE word list, its source record, the blocklists
licenses/             ENABLE README and licence paragraph, LDNOOBW licence, the old list's MIT licence
config/               nav.json (menus), ads.json (ad slot switches), quality.json (content thresholds)
site.config.json      Site name, URL and the {{PLACEHOLDERS}} Bee fills in (operator, contact email, governing law)
scripts/              build, wordstats, pagegen, similarity, report-content, serve, lighthouse, wordlist-diff, baseline-capture, check-deploy
public/               GENERATED by npm run build. Committed so the deploy can be reviewed. Never edit by hand.
tests/                unit/, build/, baseline/ (regression), e2e/
docs/                 STATUS, AUDIT, DECISIONS, UNVERIFIED, BEE-TODO, DEPLOY, DESIGN, WORDLIST-DIFF
```

To add a page to the menus, add it to `config/nav.json`. The header, sidebar and footer on every page update on the next build. To change page text, edit its file in `content/pages/` and rebuild.

## Credits, licences and caveats

- **Word list: ENABLE** (enable1, 172,823 words), compiled by **M. Cooper and Alan Beale** and released into the public domain. See `data/SOURCE.md`, `licenses/ENABLE-README.txt` and `/licenses/enable.txt` on the site. The list is redistributed unchanged and openly downloadable; no copyright is claimed over it.
- Words hidden by default are based on the English list of **LDNOOBW** (List of Dirty, Naughty, Obscene and Otherwise Bad Words), CC BY 4.0, with changes (see `THIRD_PARTY.md`).
- The live site until this upgrade used the `word-list` npm package (MIT, Sindre Sorhus); its licence is kept in `licenses/wordlist-npm-MIT.txt` for the record. Why it was replaced: `docs/DECISIONS.md`. What changes for visitors: `docs/WORDLIST-DIFF.md`.
- Definitions come from the [Free Dictionary API](https://dictionaryapi.dev/), only when a visitor presses "Look up definition", with links to Wiktionary and Merriam-Webster.
- The list is broad English, not any game's official dictionary. Expect some words games reject, and some they accept that are missing.
- Scores are base tile values (commonly used values). Premium board squares aren't included. All-tiles bonuses are "commonly reported".
- Scrabble® is a registered trademark of Hasbro, Inc. in the United States and Canada and of Mattel, Inc. elsewhere. Wordle™ is a trademark of The New York Times Company. Words With Friends is a trademark of Zynga Inc. Letterpile is not affiliated with, endorsed by or sponsored by any of them.

## Privacy policy and terms: not legal advice

The Privacy Policy, Terms of Use and About pages are a good-faith template written to match what the site actually does. They are **not legal advice**. Bee should have them reviewed, and must update them before turning on ads, analytics or a consent platform (see `docs/BEE-TODO.md`).

Note on FAQ structured data: since Google's August 2023 change, FAQ rich results are shown only for a narrow set of sites (re-check the current status). FAQPage markup is still valid structured data, but don't expect FAQ rich results; the visible FAQ is the real value.

## Cloudflare notes (Bee's dashboard)

- **Bot Fight Mode must stay OFF**, and no challenge-style rules on content paths, and no "I'm Under Attack" mode. Bot Fight Mode cannot be bypassed with WAF skip rules and can block Google's crawlers (Googlebot, Mediapartners-Google, Google-Display-Ads-Bot), which breaks indexing and AdSense review. After launch, check Security → Events for challenged Google user agents.
- Static assets are free and unlimited on Cloudflare; there is no Worker script and no server to keep up.
- `www.letterpile.app` and plain `http://` currently serve duplicate copies of the site; the fixes are dashboard settings, listed in `docs/DEPLOY.md`.

## Deploying

Only Bee deploys. Follow `docs/DEPLOY.md` (pre-checks, local preview, `npx wrangler deploy`, after-deploy checks, rollback).

## Troubleshooting

- **Build fails with "Word list integrity check failed"**: `data/enable1.txt` changed (or its line endings did). Restore it from git; the build only accepts the exact file recorded in `data/SOURCE.md`. On Windows, make sure git doesn't convert it to CRLF (`.gitattributes` marks it `-text`).
- **Tests skip the browser checks**: Chrome/Chromium wasn't found. Install Chrome or set `CHROME_PATH`.
- **"Placeholders still in the pages"** from `npm run check:deploy`: fill in `site.config.json` and rebuild.
