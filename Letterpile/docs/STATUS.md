# Status

**All three phases complete.** Nothing has been deployed. Start with `docs/FINAL-REPORT.md`, then `docs/BEE-TODO.md` and `docs/DEPLOY.md`.

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

## Phase 2: done
- Ten tool pages: intro, how-to steps, computed worked examples, common mistakes, limits, privacy, 5–6 FAQs (FAQPage JSON-LD = visible text), related links. 609–938 words each.
- 12 guides (`content/pages/guides/`), 800–1,040 words each, Article JSON-LD, visible "Last updated", related links; every example computed or asserted against the list at build time.
- Hubs: `/guides`, `/words-by-length`, `/words-starting-with`, `/words-ending-in`; HTML `/sitemap`.
- Generated word-list pages (`scripts/pagegen.mjs`, copy in `content/programmatic.mjs`): 671 generated + 23 curated affix pages (`content/affixes.json`), quality gate, similarity gate, full coverage of the visible list.
- Tests: `tests/build/content.test.mjs` (word minimums, similarity, typed-percentage ban, FAQ/Article rules, coverage, size rules, blocklist on static pages, independent recount of 20 pages).
- `npm run report:content`. 31 substantial non-programmatic pages.
- Follow-up: Windows-reserved page names avoided (`/words-starting-with/con-words` + `_redirects`, build check); site settings filled in, so `npm run check:deploy` now passes.

## Phase 3: done
- Web Worker for all searches (measured: 270 ms long task before, none ≥ 50 ms after, unthrottled), main-thread fallback, stale-result guard.
- Browser tests: axe (every template, light and dark), keyboard, CLS, ad placement (≥ 150 px from controls, ads-preview build), 360px overflow, long-task budget.
- Fixes found by the tests: dark-mode button contrast, light-mode tile values, layout shift on shared result links, tool ad-slot positions, table overflow on phones, theme icon, guide summary style.
- Performance budget test; Lighthouse 100/100/100/100 and CLS 0 on the six URLs; screenshots in `reports/screens/`.
- Docs: FINAL-REPORT, DESIGN (contrast table), DEPLOY, BEE-TODO, UNVERIFIED finalized.
