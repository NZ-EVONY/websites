# Bee's to-do list

Things only Bee can do, or must decide. Ordered roughly by when they matter.

## Before the first deploy
0. **Create the rollback tag on your PC** (the cloud session could not push tags): `git fetch origin` then `git tag live-before-upgrade 25944fa`. It marks the live site as it was before the upgrade; `npm run regression` helpers, `npm run wordlist:diff` and the rollback steps use it.
1. ~~**Fill in `site.config.json`**~~ Done (an independent publisher, nz@letterpile.app, New Zealand). Original note:: `operatorName` (how you want to be named on About/Privacy/Terms), `contactEmail` (an address you check), `governingLaw` (suggested: "New Zealand"), `authorName` (shown as the author of the guides in their structured data; use your name or "Letterpile"). Then `npm run build` and `npm run check:deploy` must print OK. Every `TODO-BEE:` comment in the built HTML points here.
2. **Read `docs/WORDLIST-DIFF.md`** and confirm you're happy that ~101,800 words disappear from the tools (including `qi` and `za`) and the Wordle pool shrinks from 12,578 to 8,636 five-letter words.
3. **About page, "How this site is made"**: rewrite or approve the paragraph (`content/pages/about.mjs`).
4. **Decide**: keep "Scrabble" out of the `/scrabble-word-finder` title (current default) or put it back for search reasons. Trademark risk vs search visibility; the URL stays either way.
5. **Have the Privacy Policy, Terms and trademark wording reviewed** (they are a template, not legal advice).

## Cloudflare dashboard (see `docs/DEPLOY.md` for the table)
6. Redirect `www.letterpile.app` → `https://letterpile.app` (permanent); turn on Always Use HTTPS.
7. Keep **Bot Fight Mode OFF**; no challenges on content paths; Rocket Loader, Email Obfuscation and automatic Web Analytics injection off.
8. Check `https://letterpile.app/robots.txt` after deploy and decide on Cloudflare's managed AI-crawler "content signals".

## After deploy
9. Google Search Console: add `letterpile.app` as a Domain property, submit `https://letterpile.app/sitemap.xml`, inspect a few URLs (including one `?letters=` URL to confirm noindex).

## AdSense (only after Phase 2 content is live and indexed, and you have read the pages yourself)
10. Apply only when at least 15 substantial non-programmatic pages are live (Phase 2 target: 20+), trust pages are live, and the site has been indexed. Approval is never guaranteed.
11. After approval: paste the AdSense verification meta tag and loader snippet at the **ADSENSE INTEGRATION POINT** comment (`src/templates/partials/adsense-slot.mjs`), put the real line in `ads.txt` (build script `scripts/build.mjs`), add the CSP origins listed in `public/_headers` (generated from `scripts/build.mjs`), and test.
12. Consent: wire in a Google-certified CMP supporting **IAB TCF v2.3** (Google's Privacy & messaging or another certified CMP) at the **CMP INTEGRATION POINT** (`src/templates/partials/cmp-slot.mjs`), loading **before** AdSense. Remove `hidden` from the footer "Privacy settings" link (`src/templates/partials/footer.mjs`) and connect it to the CMP. The banner must be an overlay (no layout shift); re-run `npm run lighthouse` and check CLS.
13. Update the Privacy Policy's Advertising, Consent and US-state sections (marked `TODO-BEE`), and the "Last updated" date will move automatically on the next build.
14. Ad slots: tool pages ship with slots **off** (`config/ads.json` → `pageTypes.tool.enabled: false`); guides and hubs (Phase 2) have them on. Flip tool pages only after looking at a few pages yourself. `ADS_ENABLED_FOR_TEMPLATE_PAGES` stays `false` until you've reviewed a sample of the generated word-list pages.

## Phase 2 review (content)
15. **Read a sample of the generated word-list pages yourself** (for example five random ones from `/sitemap`) before ever setting `ADS_ENABLED_FOR_TEMPLATE_PAGES` to `true` in `config/ads.json`. There are 694 of them.
16. Skim the 12 guides and the ten tool explainers for tone and anything you disagree with; copy lives in `content/pages/`.
17. Guides show "Last updated" from git and carry `datePublished: 2026-10-01` in their structured data. If you'd rather use the deploy date, change `published` in each `content/pages/guides/*.mjs`.
18. If you see a word on any list page that you think should be hidden, add it to `data/blocklist-extra.txt` and rebuild.

## Phase 3 notes
19. **Empty ad boxes:** guides, hubs and the 23 affix pages render an "Advertisement" label over reserved blank space (280px on phones, 110px on wider screens) even before AdSense is wired in. That is what the brief asked for, but it can look unfinished to a reviewer. If you'd rather hide them until the ad code is in, set `enabled: false` for `guide`, `hub` and `affix` in `config/ads.json` and rebuild; turn them back on when you paste the AdSense units.
20. To see where ads would go on every page type (including tool pages), run `npm run build:ads-preview` and open `reports/ads-preview` with `node scripts/serve.mjs reports/ads-preview 8788`. Never deploy that folder.
21. Test the site on a real iPhone and Android phone, and with a screen reader (VoiceOver or NVDA) if you can.
22. After the first deploy, run PageSpeed Insights on `/`, `/wordle-solver` and one guide, and look at Search Console's Core Web Vitals report after a few weeks of traffic (the only place real INP shows up).
