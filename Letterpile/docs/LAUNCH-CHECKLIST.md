# Launch checklist (games and features upgrade)

Everything below is on branch `claude/festive-sagan-qvxg1j`. Nothing has been deployed.

## Before deploying (owner)

- [ ] Proofread the Word of the Day notes in `scripts/games/wotd-review.md`; set each approved line to `ok` in `scripts/games/wotd-notes.txt`, then `npm run games:generate -- --game wotd --days 0` and `npm run build`. Until then the page shows "Come back soon".
- [ ] Proofread crossword batch 1 (`scripts/games/crossword-review.md`). The crossword stays optional: its card hides on days without a puzzle.
- [ ] Clue pipeline for later crosswords: see GAMES.md (not built yet; clues come from the owner).
- [ ] `npm install` (new dev dependencies: tesseract.js, tesseract.js-core, jspdf), then `npm test`, `npm run test:e2e`, `npm run regression`.
- [ ] `npm run games:check`: every non-optional game should have 35+ days.
- [ ] `npm run dry-run`, then deploy as usual.

## After deploying

- [ ] Play each daily game once on a phone (iPhone and Android): see docs/UNVERIFIED.md rows 30 and 36.
- [ ] Press "Scan tiles" on a real rack (row 37) and check the network panel for the /vendor/ files (row 39).
- [ ] Install the app from the browser menu; open it offline and play today's game (offline play was tested in Chromium only).
- [ ] Download a printable PDF and print it.
- [ ] Submit `https://letterpile.app/sitemap.xml` (now a sitemap index) in Search Console; watch /word/ pages (row 40).
- [ ] Check the weekly "games supply" GitHub Action runs from the default branch (row 32).

## Every week

- [ ] The supply reminder opens an issue when any game has fewer than 14 days left: run `npm run games:generate -- --days 35`, review, build, deploy.
- [ ] Approve the next Word of the Day batch.

## Where things are

- Decisions made along the way: `docs/DECISIONS.md`. Things not verified, and how to check them: `docs/UNVERIFIED.md`.
- Daily games, Word of the Day, streaks: `GAMES.md`. Third-party code and data with licences: `THIRD_PARTY.md`.
