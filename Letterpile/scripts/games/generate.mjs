// Adds days of puzzles after the last existing date (or from today if there are none, or if
// the supply has already run out). Every puzzle is validated before it is written.
//   npm run games:generate -- --days 30            all four games
//   npm run games:generate -- --days 7 --game crossword
//   npm run games:generate -- --game crossword --redo 2026-10-20   rebuild one crossword
// Crosswords are filled first and saved as drafts; a date is only published once every entry
// has a clue (see crossword.mjs). The run then writes scripts/games/crossword-review.md.
import fs from "node:fs";
import path from "node:path";
import { wordData } from "../wordstats.mjs";
import { MODULES, validatePuzzle } from "./lib.mjs";
import { ROOT, GAMES, puzzleDates, readPuzzle, writePuzzle, gameDir, addDays, todayUTC } from "./util.mjs";
import { NeedsClues, writeReview } from "./crossword.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const days = +arg("--days", 35);
// Crossword dates that were drafted but not published yet (waiting for clues) are retried on
// every run, before the new days.
const pendingDrafts = () => fs.existsSync(path.join(ROOT, "scripts/games/crossword-drafts"))
  ? fs.readdirSync(path.join(ROOT, "scripts/games/crossword-drafts")).map(f => f.slice(0, 10)).filter(d => d >= addDays(todayUTC(), -7)).sort() : [];
const only = arg("--game", null);
const redo = arg("--redo", null);
if (!(days >= 0 && days <= 400)) throw new Error("--days must be between 0 and 400");
if (only && !GAMES.includes(only)) throw new Error(`--game must be one of ${GAMES.join(", ")}`);
if (redo && !only) throw new Error("--redo needs --game");

const words = wordData();
let failed = false;
for (const game of only ? [only] : GAMES) {
  const m = MODULES[game];
  if (!m) { console.log(`${game}: no generator yet, skipped`); continue; }
  if (redo) {
    // Rebuild one date: drop the published puzzle and (for the crossword) its draft.
    fs.rmSync(path.join(gameDir(ROOT, game), `${redo}.json`), { force: true });
    if (game === "crossword" && process.argv.includes("--refill")) fs.rmSync(path.join(ROOT, "scripts/games/crossword-drafts", `${redo}.json`), { force: true });
  }
  const existing = puzzleDates(ROOT, game);
  const history = existing.map(d => readPuzzle(ROOT, game, d));
  // Dates to build: one date with --redo; otherwise any pending crossword drafts, then `days`
  // new dates after the last existing one (published or drafted).
  const pending = game === "crossword" && !redo ? pendingDrafts().filter(d => !existing.includes(d)) : [];
  const last = [...existing, ...pending].sort().at(-1);
  let next = last && last >= addDays(todayUTC(), -1) ? addDays(last, 1) : todayUTC();
  const dates = redo ? [redo] : [...pending, ...Array.from({ length: days }, (_, i) => addDays(next, i))];
  const made = [], missing = [];
  const t0 = Date.now();
  for (const date of dates) {
    let p;
    try {
      p = await m.generate(date, { history, words, log: s => console.log(s) });
    } catch (e) {
      // A crossword waiting for clues: keep going so every missing word is listed at once.
      if (e instanceof NeedsClues) { missing.push({ date, words: e.words }); console.log(`crossword ${date}: drafted, waiting for clues (${e.words.length} words)`); continue; }
      throw e;
    }
    const errors = [...validatePuzzle(game, p, { date, words }), ...(m.validateSet ? m.validateSet([...history.filter(h => h.date !== date), p]) : [])];
    if (errors.length) throw new Error(`${game} ${date}: generated puzzle failed validation, nothing written for it:\n  ${errors.join("\n  ")}`);
    writePuzzle(ROOT, game, date, p);
    history.push(p);
    made.push(p);
  }
  if (game === "crossword") writeReview(ROOT, { missing });
  if (made.length) console.log(`${game}: wrote ${made.length} puzzle(s), ${made[0].date} to ${made.at(-1).date} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (missing.length) {
    failed = true;
    console.log(`${game}: ${missing.length} date(s) need clues before they can be published; see scripts/games/crossword-review.md`);
  }
}
if (failed) process.exitCode = 1;
