# Daily Games

Four daily puzzles at `/games`: **Daily Word** (`/games/word`), **Daily Crossword**
(`/games/crossword`), **Daily Word Search** (`/games/wordsearch`) and **Daily Sudoku**
(`/games/sudoku`). They change at **00:00 UTC** with no server work: every puzzle is generated
ahead of time, validated, committed, and deployed with the site.

## Letterpile (the site's own game)

`/games/letterpile`, plus `/games/letterpile/practice` and `/games/letterpile/arcade`; rules and
strategy in the guide at `/guides/letterpile`.

- Rules: a played word's tiles go, the tiles above fall (gravity), then any empty column closes
  up and the columns to its right slide left (column collapse). A letter no word can use with
  the tiles left (in any arrangement) is dimmed with a note; when no word can be traced, the
  game ends by itself and leftovers are counted. Arcade refills after collapse.
- Engine: `src/assets/games/lp-engine.js` (board rules, tracing, gravity and collapse, replay,
  unreachable letters) and `lp-gen.js` (backwards generator, beam-search solver). Both run in Node and the browser;
  `lp-gen.js` loads only on the Practice page.
- Daily piles (`scripts/games/letterpile.mjs`): built backwards from very common words (SCOWL
  level 20 and below); the reverse step can also slot in a new column (reverse collapse) and
  each step is checked by replaying it forwards, so replaying the stored solution always clears the pile. Par is the
  fewer of the solution's word count and what the solver finds in 3 seconds using common words
  (SCOWL 35 and below); players may use any ENABLE word not on the blocklist. Target par by
  weekday: Mon/Tue 5, Wed/Thu 6, Fri 7, Sat 8, Sun 7.
- Validated: the stored solution traces and clears the board, par equals its length and fits the
  weekday (target or one less), every solution word is allowed, and no blocklisted word reads
  in a straight line (rows, columns, diagonals, both ways).
- Player: drag or tap through neighbors (diagonals included), or type letters where only one
  tile fits; Enter plays, Backspace steps back (or undoes a word), Escape clears. Unlimited
  undo/restart, up to 3 hints (first tile of a solution word that still fits), optional timer,
  stats (`lp-game:letterpile:stats`), share text with one square per word colored by length.
- Practice: unlimited boards from the same generator (par = its word count). Arcade: 6x6, 8
  words, refills weighted by letter frequency, points by length, local best score.

## Registry

`config/games.json` lists the games (key, link, name, tile icon and colour, one-line blurb).
The build, the generators, `games:check` and the tests all read it. A game marked
`"optional": true` (currently the crossword, until it is restocked) has its card hidden on the
hub and home page on any day without a puzzle, and `games:check` reports it without counting
it. Its own page still says "Come back soon" on such days.

## How the daily swap works

1. Puzzles live in `content/games/<game>/<YYYY-MM-DD>.json`, one file per game per date.
2. `npm run build` validates every puzzle (the build fails on an invalid one) and copies them to
   `public/puzzles/<game>/<date>.json`, plus `public/puzzles/manifest.json` listing the dates.
   `/puzzles/*` is cached for 5 minutes only (`_headers`).
3. In the browser, `src/assets/games/core.js` takes today's date in UTC
   (`new Date().toISOString().slice(0,10)`), fetches that day's file and starts the game.
   If the device clock is more than 5 minutes out, the `Date` header of the manifest response
   is used instead.
4. Each game shows a countdown to 00:00 UTC. A page left open across midnight shows
   "New puzzles are available" with a Refresh button.
5. If a date has no puzzle, the game shows "Come back soon" instead of breaking.
6. `?date=YYYY-MM-DD` plays one of the previous 7 days (the archive on `/games`); anything
   else falls back to today. Archive games don't count towards Daily Word statistics.

Finished games show share buttons (`shareRow` in `src/templates/partials/game-cards.mjs`,
`Games.shareBar` in `core.js`): the phone's own share sheet (Web Share API) where available,
"Copy result", and "Share to Facebook", which copies the result text (Facebook doesn't accept
prefilled text) and opens Facebook's share page for the game's address. No SDK or app ID.
Share images for the game pages are in `src/assets/og/`, made by `node scripts/og-images.mjs`.

`/games/word/hints` shows graduated hints for today's word (vowels, repeats, first and last
letter, then the answer), each behind its own button, built in the browser from today's file.

Progress is saved per game per day in `localStorage` (`lp-game:<game>:<date>`), plus
`lp-game:word:stats` for Daily Word statistics. Every storage call is wrapped in try/catch.
The Privacy Policy lists these keys.

## Topping up (about once a month)

```
cd Letterpile
npm run games:check                     # days left per game; fails under 7
npm run games:generate -- --days 30     # adds 30 days after the last existing date (all games;
                                        # or --game word|crossword|wordsearch|sudoku|all)
```

Word, word search and sudoku are generated, validated and written straight away (a few
seconds). The crossword takes longer (a minute or two per day) and has one manual step:

1. Each new crossword grid is filled and saved as a draft in `scripts/games/crossword-drafts/`.
2. Every entry needs a clue in `scripts/games/lexicon/crossword-clues.txt`. Entries without one
   are listed under "Waiting for clues" in `scripts/games/crossword-review.md`, and that date is
   not published until they have clues.
3. Write the clues (format below), or ban a word you don't want and refill that date:
   add it to `scripts/games/lexicon/crossword-banned.txt`, then
   `npm run games:generate -- --game crossword --redo <date> --refill`.
4. Run `npm run games:generate -- --game crossword --days 30` again. Dates whose entries are all
   clued are published; the rest stay drafts.
5. Proofread `scripts/games/crossword-review.md` (every clue and answer, one section per date).
   To change a clue, edit it in `crossword-clues.txt` and run
   `npm run games:generate -- --game crossword --redo <date>`.

Since 2026-10-20 most entries are clued automatically, so step 3 is usually short:

- Hand-written clues (`crossword-clues.txt`) are always used first. Answers without one fall back
  to `lexicon/crossword-clues-auto.txt`: short synonyms and definitions derived from WordNet 3.0
  (licence in `licenses/WordNet-LICENSE.txt`) by `scripts/games/vendor-wordnet-clues.mjs`, plus
  regular inflections of single-word clues (walk "Stroll" gives walked "Strolled"). Regenerate it
  after changing the clue or banned files (see the script's header). Don't edit it by hand.
- Every automatic clue passes a quality gate (`autoClueOk` in `crossword.mjs`): 3-60 characters,
  at most 7 words, plain letters, no blocklisted word, and it never contains the answer, its stem
  or its base word. Words with any WordNet sense marked vulgar, offensive, slang and so on get no
  automatic clues. The review file marks automatic clues _(auto)_.
- `node scripts/games/crossword-missing.mjs` lists draft answers that still have no clue at all.
- Generation uses up to 8 threads and takes about 5-10 minutes a day of puzzles on the box.

Then `npm test`, commit (including `public/`) and deploy.

A GitHub Action (`.github/workflows/letterpile-games-check.yml`, in the repository root) runs
`games:check` every Monday and opens an issue when any game has fewer than 10 days left. It
only reads the repository and opens an issue. Scheduled workflows run from the default branch,
so it takes effect once the file is there; set the repository variable `LETTERPILE_BRANCH` to
the branch you deploy from (default `claude/letterpile-refresh`).

## The games and their checks

All generators are in `scripts/games/`; each is seeded by its date, so a puzzle can be
regenerated exactly. Each exports `generate()`, `validate()` and (where needed) `validateSet()`
for checks across dates; `lib.mjs` registers them for the build, `games:generate`,
`games:check` and the tests.

| Game | Source lists | Validated |
|---|---|---|
| Daily Word (`word.mjs`) | `lexicon/word-answers.txt`: hand-picked everyday five-letter words. Guesses: every five-letter ENABLE word not hidden by the blocklist, plus the answers (`/data/guesses.*.json`) | answer in the list, in ENABLE, not blocklisted, not a plural; no answer repeats within 365 days. The answer is stored lightly encoded (XOR + base64), not in plain sight |
| Daily Crossword (`crossword.mjs`, `crossword-grid.mjs`) | fill: `lexicon/crossword-fill.txt` (SCOWL levels 10-60 ∩ ENABLE, for ranking commonness) and ENABLE; clues: `lexicon/crossword-clues.txt`; never: `lexicon/crossword-banned.txt` | 15×15, rotationally symmetric, 70-78 entries, none under 3 letters, every square checked, all squares connected; numbering and clue count match the pattern; every answer a common word (see `isGood`) or a clued entry, not banned or blocklisted, not repeated in the grid; every clue present, under 120 characters and not containing its answer; an answer appears at most 3 times within 35 days; from 2026-10-24 an answer never gets the same clue, and an answer of 7+ letters is never reused, within 60 days; automatic clues must be in the auto file and pass the gate |
| Daily Word Search (`wordsearch.mjs`) | `lexicon/wordsearch-themes.txt`: 43 hand-written themes | 20×20, 25-30 words incl. 3+ of 8+ letters, words in all 8 directions, every word exactly once, no blocklisted word readable anywhere outside the theme words, no theme repeated within 35 days |
| Daily Sudoku (`sudoku.mjs`) | generated | exactly one solution (exact solver counting to 2), solvable by logic alone, rotationally symmetric givens; difficulty by weekday: Mon/Tue Easy, Wed/Thu/Sun Medium, Fri/Sat Hard (grader levels: singles; pointing pairs and box/line; pairs and triples) |

### Crossword fill

`fillGrid()` first fills a random symmetric pattern from the whole ENABLE list (rare words
heavily penalised), then repairs it: the squares of every entry that isn't a "good" word
(SCOWL level 35 or below for three letters, 50 for longer words, or any
word that already has clues, since those were reviewed by hand) are cleared and refilled from good words only, widening
the cleared area each few rounds. Patterns that can't be cleaned are dropped. The filler uses
letter-mask constraint propagation with look-ahead word ordering.

### Clue file format

```
answer: First clue | Second clue | Third clue
ice_cream: Sundae base | Cone filler
```

Lower-case answer, a colon, then clues separated by `|`. Write phrases with underscores (they
are entered in the grid without spaces). Give common answers several clues: an answer can't
repeat a clue within 35 days. Clues must not contain the answer.

## Tests

- `tests/unit/games-dates.test.mjs`: UTC date selection, midnight edges, UTC+13 and UTC-10,
  the 7-day archive window, the clock correction, encoding.
- `tests/unit/games-{word,crossword,wordsearch,sudoku}.test.mjs`: each validator (including the
  sudoku uniqueness check) and every published puzzle.
- `tests/e2e/games.test.mjs`: each game played to a win in Chromium at 390px and 1280px, with a
  reload in the middle; screenshots in `reports/games/`.

## Word of the Day

`/word-of-the-day`, linked from the games page and (once a day is published) the home page.
Published through the daily engine as game `wotd` (`config/games.json`, marked `feature` and
`optional`: no game card, not part of the all-games streak, not counted by `games:check`).

- Notes: `scripts/games/wotd-notes.txt`, one line per date: `date | word | meaning | usage | status`.
  Meanings and usage notes are written for the site; a date is published only when its status is
  `ok`. The word must have a word page. The fact for word games is computed from the list when the
  day is published (anagram, then vowels, then hooks, then points), so it is never hand-written.
- Review: `npm run games:generate -- --game wotd --days 35` writes `scripts/games/wotd-review.md`
  with every draft in full and a suggested word for each date that has no note yet. After
  proofreading, change `draft` to `ok`, rerun with `--days 0`, then `npm run build`.
- Validation: word has a page, meaning and usage are 20-320 characters with none of the banned
  wording, the stored fact and points match a fresh computation, and no word repeats.

## All-games streak

On `/games` (games/hub.js): today's finished count and a streak of days on which every game that
had a puzzle was finished (solved or played to the end). An unfinished today doesn't break the
streak. Computed from the saved progress keys; nothing new is stored.
