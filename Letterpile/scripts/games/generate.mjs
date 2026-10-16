// Adds days of puzzles after the last existing date (or from today if there are none, or if
// the supply has already run out). Every puzzle is validated before it is written.
//   npm run games:generate -- --days 30            all four games
//   npm run games:generate -- --days 7 --game crossword
// The crossword run also writes scripts/games/crossword-review.md for proofreading.
import { wordData } from "../wordstats.mjs";
import { MODULES, validatePuzzle } from "./lib.mjs";
import { ROOT, GAMES, puzzleDates, readPuzzle, writePuzzle, addDays, todayUTC } from "./util.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const days = +arg("--days", 35);
const only = arg("--game", null);
if (!(days > 0 && days <= 400)) throw new Error("--days must be between 1 and 400");
if (only && !GAMES.includes(only)) throw new Error(`--game must be one of ${GAMES.join(", ")}`);

const words = wordData();
for (const game of only ? [only] : GAMES) {
  const m = MODULES[game];
  if (!m) { console.log(`${game}: no generator yet, skipped`); continue; }
  const existing = puzzleDates(ROOT, game);
  const history = existing.map(d => readPuzzle(ROOT, game, d));
  const last = existing.at(-1);
  let date = last && last >= addDays(todayUTC(), -1) ? addDays(last, 1) : todayUTC();
  const made = [];
  const t0 = Date.now();
  for (let i = 0; i < days; i++, date = addDays(date, 1)) {
    const p = await m.generate(date, { history, words });
    const errors = [...validatePuzzle(game, p, { date, words }), ...(m.validateSet ? m.validateSet([...history, p]) : [])];
    if (errors.length) throw new Error(`${game} ${date}: generated puzzle failed validation, nothing written for it:\n  ${errors.join("\n  ")}`);
    writePuzzle(ROOT, game, date, p);
    history.push(p);
    made.push(p);
  }
  if (m.afterGenerate) m.afterGenerate(made, { history });
  console.log(`${game}: wrote ${made.length} puzzle(s), ${made[0].date} to ${made.at(-1).date} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
