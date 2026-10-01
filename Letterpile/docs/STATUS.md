# Status

**Current phase: Phase 1 complete. Waiting for Bee to type "continue" before Phase 2.** Nothing has been deployed.

Branch: `claude/new-session-9zuiol` in `NZ-EVONY/websites` (folder `Letterpile/`). Rollback tag: `live-before-upgrade` (commit `25944fa`). The tag exists in the cloud session but **could not be pushed** (git proxy refused tag pushes); create it locally with `git tag live-before-upgrade 25944fa`.

## How to resume
1. Read `CLAUDE.md`, this file, `docs/DECISIONS.md`, `docs/UNVERIFIED.md`.
2. `npm install`, then `npm test`, `npm run regression`, `npm run test:e2e` (all should pass).
3. Start the next phase from the list below.

## Phase 1: done
- Step 0: baseline tag, `.backup/` zip (container only), `tests/baseline/live-urls.json`, `docs/AUDIT.md` with baseline Lighthouse.
- Build pipeline (`scripts/build.mjs`) → `public/` with content-hashed assets; header, nav, sidebar and footer in raw HTML; inline scripts extracted to `src/assets/js/`; no inline styles.
- ENABLE word list with SHA-256/count checks (`data/SOURCE.md`), licence files, `/licenses/enable.txt`, credits; `docs/WORDLIST-DIFF.md`.
- Blocklist (LDNOOBW, CC BY 4.0) with the "Show all words" switch in the tools.
- Opt-in definition lookups with a disclosure line.
- Trust pages: Privacy Policy, Terms, About, Contact (placeholders, never invented details); 404 page.
- Canonical, Open Graph, Twitter card, theme-color, JSON-LD (`WebSite`, `Organization`, `WebApplication`, `BreadcrumbList`), visible breadcrumbs.
- `robots.txt`, `sitemap.xml` (git-based lastmod), `ads.txt` placeholder, `_headers` (CSP with the inline-script hash, security headers, immutable caching for hashed assets).
- `wrangler.jsonc`: `directory ./public`, `drop-trailing-slash`, `404-page`; verified in `wrangler dev --local` and `--dry-run`.
- Ad-slot, CMP-slot and AdSense-slot partials (no ad code); `config/ads.json` (tool pages off).
- Tests: unit (engine vs brute force, Wordle consistency, data, partials), build output, regression (incl. old deep links in Chromium), e2e (privacy behavior, theme before paint).
- Docs: CLAUDE.md, README, THIRD_PARTY, AUDIT, DECISIONS, UNVERIFIED, BEE-TODO, DEPLOY, DESIGN, deploy-log template.

## Phase 2 (next): content
Explainers (600–900 words) + FAQs (FAQPage JSON-LD) for all ten tools; the 12 guides; `/guides`, `/words-by-length`, `/words-starting-with`, `/words-ending-in` hubs; programmatic pages with the quality gate (`config/quality.json`) and curated affix pages (`content/affixes.json`); HTML `/sitemap`; similarity and word-count tests; `npm run report:content`; ad slots placed on guides/hubs.

## Phase 3: performance, accessibility, polish
Long-task measurement for 15-letter + blank searches (Web Worker only if > 200 ms), axe-core on every template, screenshots at 360px/wide in both themes, contrast table, Lighthouse before/after on the six URLs in the brief, `docs/FINAL-REPORT.md`.
