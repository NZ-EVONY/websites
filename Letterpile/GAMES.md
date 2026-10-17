# Daily Games

Four daily puzzles at `/games`: **Daily Word** (`/games/word`), **Daily Crossword**
(`/games/crossword`), **Daily Word Search** (`/games/wordsearch`) and **Daily Sudoku**
(`/games/sudoku`). They change at **00:00 UTC** with no server work: every puzzle is generated
ahead of time, validated, committed, and deployed with the site.

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

Progress is saved per game per day in `localStorage` (`lp-game:<game>:<date>`), plus
`lp-game:word:stats` for Daily Word statistics. Every storage call is wrapped in try/catch.
The Privacy Policy lists these keys.

## Topping up (about once a month)

```
cd Letterpile
npm run games:check                     # days left per game; fails under 7
npm run games:generate -- --days 30     # adds 30 days after the last existing date
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
| Daily Crossword (`crossword.mjs`, `crossword-grid.mjs`) | fill: `lexicon/crossword-fill.txt` (SCOWL levels 10-60 ∩ ENABLE, for ranking commonness) and ENABLE; clues: `lexicon/crossword-clues.txt`; never: `lexicon/crossword-banned.txt` | 15×15, rotationally symmetric, 70-78 entries, none under 3 letters, every square checked, all squares connected; numbering and clue count match the pattern; every answer a common word (see `isGood`) or a clued entry, not banned or blocklisted, not repeated in the grid; every clue present, under 120 characters and not containing its answer; an answer appears at most 3 times and never with the same clue within 35 days |
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
