# Deploying Letterpile (Bee's runbook)

Run these in PowerShell in the `Letterpile` folder. Claude Code never deploys; only you do.

## 1. Before deploying

```powershell
git status                      # should be clean
npm install                     # first time only
npm test                        # must end with "# fail 0"
npm run regression              # must end with "# fail 0"
npm run build
npm run check:deploy            # must print "OK: ..." (fails while {{PLACEHOLDERS}} remain)
npm run dry-run                 # uploads nothing; prints "Read N files from the assets directory ...\public"
git diff live-before-upgrade -- wrangler.jsonc
```

- Look at `public/` once: only HTML pages, `assets/`, `data/`, `licenses/`, `_headers`, `robots.txt`, `sitemap.xml`, `ads.txt`, `favicon.svg`, `.assetsignore`. No `docs`, `.git`, `.wrangler`, `node_modules`, `tests`, backups or `.md` files (the tests and `check:deploy` also enforce this).
- The dry-run line counts folders too ("Read 39 files" = 35 files + 4 folders for the Phase 1 build; "Read 764 files" = 746 files + 18 folders after Phase 2). Write the commit, file count and that number in `docs/deploy-log.md`, and compare with the previous entry.

### What the first deploy changes in the upload (old vs new)

| Old (directory `.`, live today) | New (directory `./public`) |
|---|---|
| `index.html` and the 9 other tool pages | Same 10 file names, rebuilt (served at the same clean URLs) |
| `assets/engine.js`, `assets/site.js`, `assets/style.css` | `assets/engine.<hash>.js`, `assets/site.<hash>.js`, `assets/style.<hash>.css`, `assets/js/<page>.<hash>.js` (9) |
| `data/words.js` (old list) | `data/words.<hash>.js` (ENABLE) |
| `data/LICENSE-wordlist.txt` | `licenses/enable.txt` |
| — | `about.html`, `contact.html`, `privacy-policy.html`, `terms.html`, `404.html`, `robots.txt`, `sitemap.xml`, `ads.txt`, `_headers`, `favicon.svg` |
| (anything else in the folder could have been uploaded) | only `public/` can be uploaded |

Old asset URLs (`/assets/engine.js`, `/data/words.js`, ...) will return 404 after the deploy. Only a tab left open across the deploy is affected (it needs a reload).

## 2. Local preview

```powershell
npx wrangler dev --local
```

Open http://localhost:8787 and click through: the ten tool URLs (`/`, `/word-scrambler`, `/word-combiner`, `/scrabble-word-finder`, `/words-with-friends`, `/wordle-solver`, `/anagram-solver`, `/jumble-solver`, `/crossword-solver`, `/text-twist-solver`), `/privacy-policy`, `/about`, a nonsense URL such as `/xyz` (404 page), `/robots.txt`, `/sitemap.xml`, `/ads.txt`. Check that `/word-scrambler.html` and `/word-scrambler/` redirect to `/word-scrambler`. (Verified in `wrangler dev --local` during Phase 1.)

## 3. Deploy

```powershell
npx wrangler deploy
```

Immediately after:

```powershell
curl.exe -sI https://letterpile.app/
curl.exe -sI https://letterpile.app/word-scrambler.html     # expect 307 to /word-scrambler
curl.exe -sI https://letterpile.app/xyz                     # expect 404
curl.exe -sI https://letterpile.app/privacy-policy          # expect 200 and the security headers
curl.exe -s  https://letterpile.app/robots.txt              # must contain the Sitemap line
curl.exe -s  https://letterpile.app/ads.txt
```

Open the ten tool URLs and the new pages in a browser and try each tool once. If `robots.txt` shows only Cloudflare's "content signals" block and no `Sitemap:` line, Cloudflare's managed robots.txt is overriding the file: change that setting in the dashboard (Security → Bots / AI crawl control, wording may differ) rather than editing the site.

## 4. Rollback

- **Quickest: Cloudflare dashboard** → Workers & Pages → `letterpile` → Deployments → roll back to the previous version.
- **Fallback: git tag** (create it once with `git tag live-before-upgrade 25944fa` if `git tag` doesn't list it): `git checkout live-before-upgrade`, then deploy those files the old way (that commit's `wrangler.jsonc` uploads the whole folder, as before). Return with `git checkout -` afterwards.

## 5. Dashboard tasks (Claude Code cannot do these)

| Task | Why |
|---|---|
| Redirect `www.letterpile.app` → `https://letterpile.app` permanently (Redirect Rule or Bulk Redirect) | `www` serves a duplicate of the site today (per the planner's check). Option: keep the `www` custom-domain route in `wrangler.jsonc` (the redirect rule runs first; **not verified** how it interacts with a Worker custom domain, check Cloudflare's docs) or remove the route and add a proxied DNS record for `www` that the redirect rule handles. |
| Turn on **Always Use HTTPS** and Automatic HTTPS Rewrites | `http://letterpile.app` returns 200 today (per the planner's check). |
| Keep **Bot Fight Mode OFF**, no managed challenges on content paths, not "I'm Under Attack" | It can block Googlebot, Mediapartners-Google and Google-Display-Ads-Bot, breaking indexing and AdSense review. After launch check Security → Events for challenged Google user agents. |
| Rocket Loader off, Email Address Obfuscation off, Web Analytics automatic injection off (unless you decide otherwise) | They inject or rewrite scripts, which breaks the strict CSP and interferes with consent banners and ads. |
| Decide on the managed `robots.txt` / AI-crawler content signals | Affects what the live `robots.txt` shows. |
| Google Search Console: Domain property, submit the sitemap, inspect a few URLs | Indexing. |
| AdSense application | Only after the Phase 2 content is live and indexed and you've read it; see `docs/BEE-TODO.md`. Approval is never guaranteed. |

## 6. Free-plan facts (from the brief; re-check on Cloudflare's docs)

Static asset requests are free and unlimited; there is no Worker script, so Workers request quotas don't apply. Up to 20,000 files per version on the free plan and 25 MiB per file; `_headers` up to 100 rules. After Phase 2 this site has 746 files (the build fails above 5,000). The biggest file is the word list at about 1.7 MB.

## 7. Updating later

- Edit text in `content/pages/<page>.mjs`, menus in `config/nav.json`, styles in `src/assets/style.css`.
- `npm test`, `npm run regression`, then deploy as above.
- Change the contact email: `site.config.json` → `contactEmail`, rebuild.
- Add a page: copy a file in `content/pages/`, change `key`, `path`, `file`, title, description, H1 and copy; link to it from somewhere (the orphan test fails otherwise).
