# MyAddr audit (Step 0, 2026-10-02)

## Contradictions and blockers (read first)
- **The address data service cannot be reached from the cloud build session.** `chromium-i18n.appspot.com` (libaddressinput data) is refused by the session's network policy, so `data/libaddressinput/snapshot.json` cannot be fetched here. The repo's `testdata/countryinfo.txt` is reachable but is the older snapshot the brief forbids. Everything that depends on the data (country pages, formatter, postcode checker, cheat sheet, golden formats) is waiting on this.
- Also refused from this session: `creativecommons.org`, `api.github.com` (403), `developers.cloudflare.com`, the postal operators' sites (NZ Post, Australia Post, Royal Mail, Japan Post, UPU), `nominatim.openstreetmap.org`, `api.zippopotam.us`, `operations.osmfoundation.org`. Operator-sourced facts and the tool 8 verification requests cannot be done here.
- Reachable: `raw.githubusercontent.com` (libaddressinput README and LICENSE; the CC BY 4.0 legal code from Creative Commons' own `cc-legal-tools-data` repository; Cloudflare's docs source), `registry.npmjs.org`.
- An earlier, superseded "what's my IP" rebuild exists on another branch (`claude/new-session-9zuiol`, commit `675412b`, Worker code for IP/WHOIS/port checks). It is ignored: nothing from it is merged or reused.
- Git: configured identity present: yes. The owner should check that the identity is the one they want on this branch (the brief forbids changing it here).

## What was on `origin/main`
`MyAddr/` held only the old IP prototype: `README.md`, `app.js`, `index.html` (no `h1`), `package.json`, `server.js` (port check, ping and traceroute via `child_process`, WHOIS over raw sockets), `styles.css`. The front end called four third-party IP services. No Wrangler config, no tests.

## What was moved or deleted
1. Commit 1: the six files moved unchanged with `git mv` into `legacy/ip-prototype/`.
2. Commit 2: `server.js` and `app.js` reduced to stubs (network tools and third-party calls deleted); `legacy/README.md` added. `index.html` and `styles.css` kept as a record only. Nothing in `legacy/` is built or published.

## Licence evidence gathered (2026-10-02, 13:13 NZDT / 00:13 UTC)
- libaddressinput README, line 43: "Source code licensed under the Apache 2.0. Data licensed under the CC-BY 4.0" (saved as `licenses/libaddressinput-README.txt`, sha256 `5365994d…`).
- Repo `LICENSE`: Apache License 2.0 (`licenses/libaddressinput-LICENSE-Apache-2.0.txt`, sha256 `389e6d12…`).
- CC BY 4.0 legal code, plain text, from `github.com/creativecommons/cc-legal-tools-data` (`docs/licenses/by/4.0/legalcode.txt`), because `creativecommons.org` is refused (`licenses/CC-BY-4.0.txt`, sha256 `9ba9550a…`).
- Not checked: the GitHub licence API and the latest upstream commit SHA/date (api.github.com refused), the wiki.

## What will be reused from the Letterpile model
Build, serve, check-deploy, Chrome/Lighthouse/screenshot scripts, similarity and content reports; layout and partials; theme/menu/toast/worker bridge; CSS token system; test helpers and e2e patterns; config shapes. Word-game code, the dictionary call and all Letterpile identity and owner details are not copied. MyAddr gets its own palette.
