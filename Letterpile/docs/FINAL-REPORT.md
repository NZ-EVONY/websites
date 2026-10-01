# Letterpile upgrade: final report

Upgrade of the live static site https://letterpile.app, done in three phases on branch `claude/new-session-9zuiol` of `NZ-EVONY/websites` (folder `Letterpile/`). **Nothing has been deployed.** Rollback point: commit `25944fa` (tag `live-before-upgrade`, to be created locally by Bee: `git tag live-before-upgrade 25944fa`).

Every statement below is in one of three buckets: **VERIFIED** (run and observed in this environment), **IMPLEMENTED, NOT TESTED**, or **NOT VERIFIED**.

## 1. What changed compared with the live site

| Area | Before (live) | After (this branch) |
|---|---|---|
| Pages | 10 tool pages | 726 pages: 10 tools, 12 guides, 4 hubs, 4 trust pages, HTML site map, 404, 671 generated word-list pages, 23 curated prefix/suffix pages |
| Word list | `word-list` npm package, 274,137 words, unclear upstream provenance | ENABLE (public domain), 172,823 words, SHA-256 checked at build; 389 vulgar words and slurs hidden by default with a "Show all words" switch |
| Header, nav, footer | Injected by JavaScript | In the raw HTML; footer has legal links, credits, trademark notice |
| Text per tool page | 157–269 words | 609–938 words plus FAQ |
| SEO plumbing | None | Canonical, Open Graph, Twitter card, theme-color, JSON-LD (`WebSite`, `Organization`, `WebApplication`, `Article`, `FAQPage`, `BreadcrumbList`), `robots.txt`, `sitemap.xml`, HTML `/sitemap`, query-string URLs `noindex` |
| Trust pages | None | Privacy Policy, Terms, About, Contact (Letterpile, nz@letterpile.app, New Zealand) |
| Security | Cloudflare defaults | `_headers`: strict CSP (one hashed inline script, `worker-src 'self'`), nosniff, Referrer-Policy, Permissions-Policy, HSTS; immutable caching for hashed assets |
| Deployment surface | Whole folder uploaded | Only `public/` (`assets.directory`), `drop-trailing-slash`, real 404 page |
| JavaScript | Inline scripts, main-thread searches | 9 small page scripts, shared `site.js`, searches in a Web Worker with main-thread fallback |
| Definitions | Fetched automatically on every word tap | Only after "Look up definition", with a disclosure line |
| Ads / consent | None | Marked integration points only (CMP slot, AdSense slot, reserved ad containers); no ad code |
| Tests | None | 57 unit/build/content tests, 3 regression tests, 10 browser tests |

User-visible behavior changes are listed in `docs/WORDLIST-DIFF.md` (word list) and `docs/DECISIONS.md` (everything else). The most noticeable: about 101,800 words disappear from results (including *qi* and *za*), and the Wordle Solver's five-letter pool drops from 12,578 to 8,564 visible words.

## 2. Tests run (VERIFIED, final run)

| Suite | Command | Result |
|---|---|---|
| Unit, build output, content | `npm test` | 57 pass, 0 fail |
| Live-URL regression (incl. old deep links in Chromium) | `npm run regression` | 3 pass, 0 fail |
| Browser: axe (light + dark), keyboard, CLS, ad placement, 360px overflow, long tasks, worker + fallback, stale-result guard, privacy behavior, theme before paint | `npm run test:e2e` | 10 pass, 0 fail |
| Deploy gate | `npm run check:deploy` | `OK: 748 files in public/, no placeholders, nothing private.` |
| Wrangler dry-run | `npm run dry-run` | `Read 766 files from the assets directory …/public` (748 files + 18 folders; Wrangler counts folders, verified) |
| Routing in `wrangler dev --local` | manual curl | `/`, `/word-scrambler`, `/guides`, `/guides/two-letter-words`, `/words-by-length/7-letter-words/s` → 200; `.html` and trailing-slash forms → 307 to the clean URL; `/words-starting-with/con` → 301 to `/words-starting-with/con-words`; unknown paths → 404 page; `_headers` applied |

## 3. Lighthouse before and after (VERIFIED, lab, mobile emulation)

Lighthouse 13.5.0, headless Chromium, simulated throttling, local uncompressed server (Cloudflare compresses, so real transfer is smaller).

| URL | Before: Perf / A11y / BP / SEO, CLS, TBT | After: Perf / A11y / BP / SEO, CLS, TBT |
|---|---|---|
| `/` | 98 / 100 / 100 / 100, 0.079, 0 ms | 100 / 100 / 100 / 100, 0, 0 ms |
| `/wordle-solver` | 59 / 94 / 100 / 100, 0.486, 840 ms | 100 / 100 / 100 / 100, 0, 0 ms |
| `/guides/two-letter-words` | (did not exist) | 100 / 100 / 100 / 100, 0, 0 ms |
| `/words-by-length/5-letter-words` | (did not exist) | 100 / 100 / 100 / 100, 0, 0 ms |
| `/words-by-length/7-letter-words/s` | (did not exist) | 100 / 100 / 100 / 100, 0, 0 ms |
| `/privacy-policy` | (did not exist) | 100 / 100 / 100 / 100, 0, 0 ms |

With ad placeholders visible (`npm run build:ads-preview`): `/`, `/guides/two-letter-words`, `/words-ending-in/ness` all 100/100/100/100 with CLS 0.

**Main-thread long tasks** (`npm run measure:longtasks`, worst of 3 runs, VERIFIED):

| Case | Before worker (1× / 4× CPU) | After (1× / 4× CPU) |
|---|---|---|
| Unscrambler, 15 letters + 3 blanks | 111 ms / 462 ms | none ≥ 50 ms / 159 ms |
| Anagram, 15 letters with two-word phrases | 270 ms / 952 ms | none / 94 ms |
| Rack finder, 7 + 2 blanks with board letters | none / 237 ms | none / 117 ms |
| Crossword, 7 open squares | 62 ms / 189 ms | none / 101 ms |

**Budgets (gzip -9, VERIFIED):** CSS 5.2 KB (budget 12); JS per tool page ≈ 10.6 KB incl. worker (budget 15); worst HTML 25.2 KB (`/words-ending-in/ies`, budget 60). Word list 456 KB gzipped, loaded only when a tool is used.

## 4. Page inventory and word counts

From `npm run report:content` (written copy only; word lists, link lists and forms excluded):

| Type | Pages | Words (min–max) | Minimum |
|---|---:|---|---:|
| Tool | 10 | 609–938 | 600 |
| Guide | 12 | 802–1,037 | 800 |
| Hub | 4 | 377–509 | 300 |
| Trust | 4 | 322–1,067 | 300 |
| Curated affix | 23 | 333–457 | 250 |
| Generated word list | 671 | 244–426 (median 304) | 150 |

31 substantial non-programmatic pages (brief: at least 20). Similarity: hand-written pages at most 0.093 (limit 0.2), generated pages at most 0.545 (limit 0.6). Every visible word appears on at least one indexable page (tested); a test recounts the numbers on 20 random generated pages independently.

## 5. Could not verify (complete list)

- **The live site itself**: `letterpile.app` was blocked by this environment's network policy, so none of the planner's live checks (status codes, redirects, robots.txt, www/HTTP duplicates, cache headers) could be repeated.
- **The real Cloudflare deployment**: `html_handling`, `404-page`, `_headers` and `_redirects` were verified only in `wrangler dev --local`.
- **Google**: indexing, Rich Results Test, Search Console, how Google treats the JavaScript-added `noindex` on query URLs, and AdSense review. All need the live site and Bee's accounts.
- **Field performance**: real INP and Core Web Vitals; only lab numbers exist.
- **Other browsers and devices**: Firefox, Safari, real phones (only Chromium was available).
- **Screen readers**: only axe-core and keyboard tests were run.
- **Windows checkout**: the reserved-name fix is tested by a build check, not on a Windows machine.
- **Content facts not checked against a primary source**: short word meanings in three guides, language-history statements, trademark-owner wording, commonly reported game values and bonuses, Wordle hard-mode description (all listed in `docs/UNVERIFIED.md`).
- **Legal review** of the Privacy Policy, Terms and About pages (good-faith template, not legal advice).
- **The git tag**: `live-before-upgrade` could not be pushed from this environment.

## 6. Known weaknesses

- 694 generated word-list pages are the biggest "low value content" risk. They have computed facts and varied wording, but they are template pages; ads stay off on them (`ADS_ENABLED_FOR_TEMPLATE_PAGES=false`).
- Generated pages share template sentences (similarity up to 0.545 between two of them).
- Empty "Advertisement" boxes show on guides, hubs and affix pages until AdSense code is pasted (see BEE-TODO #19).
- The blocklist is a judgment call (389 words); some offensive words may remain visible and a few ordinary words are hidden.
- The suggested Wordle guesses use a simple letter-frequency heuristic, not an optimal solver.
- `/data/words.<hash>.js` is still about 1.7 MB raw (456 KB gzipped) on first tool use.

## 7. Recommended next steps

1. Create the tag locally, review the branch, read five random word-list pages, then deploy with `docs/DEPLOY.md`.
2. Do the Cloudflare dashboard tasks (www → apex redirect, Always Use HTTPS, Bot Fight Mode off, managed robots.txt decision).
3. Add the site to Search Console and submit the sitemap; check a `?letters=` URL is reported as noindex.
4. Decide on the empty ad boxes (BEE-TODO #19), then apply to AdSense only once the content is indexed.
5. After approval, wire in a TCF v2.3 certified CMP first, then AdSense, update the CSP, privacy policy and `ads.txt`, and re-run `npm run lighthouse` and `npm run test:e2e`.

## 8. Ten most important manual checks for Bee

1. Open five random generated pages from `/sitemap` and judge whether you'd be happy for an AdSense reviewer to see them.
2. Read the Privacy Policy and Terms end to end (and have them reviewed).
3. Try every tool once on your phone, including a shared result link.
4. Look up a definition in the word popup and confirm the disclosure line reads well to you.
5. Check `docs/WORDLIST-DIFF.md` and decide you're comfortable with the word list change.
6. Run `npm test`, `npm run regression` and `npm run test:e2e` on your PC.
7. Run `npx wrangler dev --local` and click through the URLs in `docs/DEPLOY.md` step 2.
8. After deploy, `curl -sI` the URLs in `docs/DEPLOY.md` step 3 (including `/words-starting-with/con`).
9. Check `https://letterpile.app/robots.txt` shows the Sitemap line.
10. Confirm in the Cloudflare dashboard that Bot Fight Mode is off and `www` redirects to the apex.
