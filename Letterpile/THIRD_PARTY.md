# Third-party data and software

Licences below were read from the actual licence files (data) or the installed packages' `package.json` and licence files (dev tools), on the date of the upgrade. Nothing here is loaded from a third-party origin when a page opens.

## Shipped to visitors

| What | Version / retrieved | Licence (verified from) | Where attribution appears |
|---|---|---|---|
| **ENABLE word list** (enable1), compiled by M. Cooper and Alan Beale | `data/enable1.txt`, 172,823 words, SHA-256 `3f161302…1a89`; see `data/SOURCE.md` | Public domain; the authors ask to be credited as originators and that redistribution of the list not be restricted. Text: `licenses/ENABLE-README.txt` (from the ENABLE2K README), `licenses/ENABLE-LICENSE.txt` | Footer of every page, About, Terms, `/licenses/enable.txt`, header comment of `/data/words.*.js` |
| **LDNOOBW** English list (List of Dirty, Naughty, Obscene and Otherwise Bad Words) | `data/blocklist.txt`, retrieved from the project's GitHub `master` branch | CC BY 4.0, verified from the repository's `LICENSE` file (`licenses/LDNOOBW-LICENSE-CC-BY-4.0.txt`) and README | About page (credit, licence link, and a statement of the changes made). Changes: only single a–z entries used, simple inflections added, an allowlist of ordinary words (`data/blocklist-allow.txt`) and a short supplement of our own (`data/blocklist-extra.txt`). The resulting hidden-word list ships in `/data/words.*.js` (`WORD_HIDE`). |

## Used by visitors' browsers on request only

| What | Notes |
|---|---|
| Free Dictionary API (`api.dictionaryapi.dev`) | Called from the visitor's browser only when they press "Look up definition". No key. Disclosed in the Privacy Policy and allowed in the CSP `connect-src`. Its terms were not reviewed for this upgrade (see `docs/UNVERIFIED.md`). |
| Wiktionary, Merriam-Webster | Plain links only. |

## Development tools (devDependencies; never copied into `public/`)

| Package | Version | Licence (from the installed package) |
|---|---|---|
| wrangler | 4.145.0 | MIT OR Apache-2.0 (`package.json`) |
| lighthouse | 13.5.0 | Apache-2.0 (`LICENSE`) |
| playwright-core | 1.63.0 | Apache-2.0 (`LICENSE`) |
| axe-core | 4.13.0 | MPL-2.0 (`LICENSE`) |

## Kept for the record (no longer used)

| What | Licence |
|---|---|
| `word-list` npm package by Sindre Sorhus (the old live list, "derived from the Letterpress list") | MIT, `licenses/wordlist-npm-MIT.txt`. The provenance/licence of the underlying Letterpress list could not be verified; that is why the site switched to ENABLE. |
