# Bee's to-do list

Things only Bee can do, or must decide. Ordered roughly by when they matter.

## Before the first deploy
0. **Create the rollback tag on your PC** (the cloud session could not push tags): `git fetch origin` then `git tag live-before-upgrade 25944fa`. It marks the live site as it was before the upgrade; `npm run regression` helpers, `npm run wordlist:diff` and the rollback steps use it.
1. **Fill in `site.config.json`**: `operatorName` (how you want to be named on About/Privacy/Terms), `contactEmail` (an address you check), `governingLaw` (suggested: "New Zealand"). Then `npm run build` and `npm run check:deploy` must print OK. Every `TODO-BEE:` comment in the built HTML points here.
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
