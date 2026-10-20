# Third-party data and software

Licences below were read from the actual licence files (data) or the installed packages' `package.json` and licence files (dev tools), on the date of the upgrade. Nothing here is loaded from a third-party origin when a page opens.

## Shipped to visitors

| What | Version / retrieved | Licence (verified from) | Where attribution appears |
|---|---|---|---|
| **ENABLE word list** (enable1), compiled by M. Cooper and Alan Beale | `data/enable1.txt`, 172,823 words, SHA-256 `3f161302…1a89`; see `data/SOURCE.md` | Public domain; the authors ask to be credited as originators and that redistribution of the list not be restricted. Text: `licenses/ENABLE-README.txt` (from the ENABLE2K README), `licenses/ENABLE-LICENSE.txt` | Footer of every page, About, Terms, `/licenses/enable.txt`, header comment of `/data/words.*.js` |
| **LDNOOBW** English list (List of Dirty, Naughty, Obscene and Otherwise Bad Words) | `data/blocklist.txt`, retrieved from the project's GitHub `master` branch | CC BY 4.0, verified from the repository's `LICENSE` file (`licenses/LDNOOBW-LICENSE-CC-BY-4.0.txt`) and README | About page (credit, licence link, and a statement of the changes made). Changes: only single a–z entries used, simple inflections added, an allowlist of ordinary words (`data/blocklist-allow.txt`) and a short supplement of our own (`data/blocklist-extra.txt`). The resulting hidden-word list ships in `/data/words.*.js` (`WORD_HIDE`). |

| **CMU Pronouncing Dictionary** (cmudict), Carnegie Mellon University | `cmudict.dict` from github.com/cmusphinx/cmudict (master), retrieved October 2026; SHA-256 recorded in the header of `scripts/lexicon/cmudict-enable.txt`. Kept: first pronunciation of the 50,751 words also in the visible ENABLE list (`scripts/tools/vendor-cmudict.mjs`) | BSD-style (2-clause) licence, verified from the repository's `LICENSE` file (`licenses/CMUdict-LICENSE.txt`); redistributions must keep the copyright notice and reproduce it in documentation | Footer of every page, About, `/licenses/cmudict.txt`. Ships as `/data/rhymes.*.json` (Rhyming Words Finder, Syllable Counter) |
| **SCOWL** common-word levels (see below) | Levels 10-35 only, limited to visible ENABLE words | As below (`licenses/SCOWL-Copyright.txt`) | Footer of every page, About, `/licenses/scowl.txt`, header comment of `/data/common.*.js`. Ships as `/data/common.*.js`, used by the Phase 4 solvers to rank everyday words first |

| **Tesseract.js** 7.0.0 and **tesseract.js-core** 7.0.0 (Tesseract OCR engine compiled to WebAssembly, with Leptonica) | npm devDependencies (exact versions); the build copies `dist/tesseract.min.js`, `dist/worker.min.js` and the three `*-lstm.wasm.js` engine builds to `/vendor/tesseract-7.0.0/` | Apache-2.0, verified from the packages' `package.json` and `LICENSE` (`licenses/Tesseract-Apache-2.0.txt`) | About, footer, `/licenses/tesseract.txt`. Loaded only when someone uses "Scan tiles" |
| **tessdata_fast** English model (`eng.traineddata`) | `vendor/tessdata/eng.traineddata.gz`, see `vendor/tessdata/SOURCE.md` (SHA-256 of the original file) | Apache-2.0 (the repository's LICENSE) | As above; served at `/vendor/tesseract-7.0.0/lang/` |

| **jsPDF** 4.2.1 | npm devDependency (exact); the build copies `dist/jspdf.umd.min.js` to `/vendor/jspdf-4.2.1/` | MIT, verified from the package's `package.json` and `LICENSE` (`licenses/jsPDF-MIT.txt`) | About, footer, `/licenses/jspdf.txt`. Loaded only when someone downloads a printable PDF |

## Used by visitors' browsers on request only

| What | Notes |
|---|---|
| Free Dictionary API (`api.dictionaryapi.dev`) | Called from the visitor's browser only when they press "Look up definition". No key. Disclosed in the Privacy Policy and allowed in the CSP `connect-src`. Its terms were not reviewed for this upgrade (see `docs/UNVERIFIED.md`). |
| Wiktionary, Merriam-Webster | Plain links only. |

## Used by the puzzle generators (and, since Phase 4, levels 10-35 shipped as above)

| What | Version / retrieved | Licence (verified from) | Notes |
|---|---|---|---|
| **SCOWL** word lists (Spell Checker Oriented Word Lists) by Kevin Atkinson and others | `wordlist-english` npm package 1.2.1 (MIT packaging), English and American lists, size levels 10 to 60, retrieved October 2026 | Permissive notice: use, copy, modify, distribute and sell permitted provided the copyright and permission notice appear in copies and supporting documentation. Full text: `licenses/SCOWL-Copyright.txt` (the package's `Copyright` file) | Only used to rank how common a word is. `scripts/games/lexicon/crossword-fill.txt` keeps the SCOWL words that are also in ENABLE and not on the blocklist, grouped by level, for the crossword grid filler. Clues are written for this site; none come from SCOWL. |
| **WordNet 3.0** (Princeton University), via the `wordnet-db` npm package 3.1.14 (MIT packaging; the database itself is WordNet 3.0) | Retrieved October 2026; SHA-256 of the four `data.*` files in the header of `scripts/games/lexicon/crossword-clues-auto.txt` | WordNet 3.0 licence: use, copy, modify and distribute for any purpose without fee, provided the copyright notice and statements appear on all copies; Princeton's name may not be used in advertising. Text: `licenses/WordNet-LICENSE.txt` | `scripts/games/vendor-wordnet-clues.mjs` derives short synonyms and definitions into `crossword-clues-auto.txt`, a private writing aid shown by `crossword-missing.mjs`. Never published or shipped: every published clue is hand-written (the validator rejects anything else). WordNet itself is not committed. |

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
