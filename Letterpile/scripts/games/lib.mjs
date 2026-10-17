// Registry of the daily games: one module per game, each exporting generate(), validate()
// and optionally validateSet() (checks across dates). Used by the build, games:generate,
// games:check and the tests.
import * as word from "./word.mjs";
import * as sudoku from "./sudoku.mjs";
import * as wordsearch from "./wordsearch.mjs";
import * as crossword from "./crossword.mjs";
import { GAMES, puzzleDates, readPuzzle } from "./util.mjs";

export { GAMES, puzzleDates, readPuzzle };
export const MODULES = { word, sudoku, wordsearch, crossword };

export function validatePuzzle(game, p, ctx) {
  const m = MODULES[game];
  if (!m) return [`no validator for ${game}`];
  try { return m.validate(p, ctx); } catch (e) { return [`validator crashed: ${e.message}`]; }
}

// Every puzzle of a game, oldest first, with the per-puzzle and cross-date checks.
export function validateGame(root, game, words) {
  const dates = puzzleDates(root, game);
  const puzzles = dates.map(d => readPuzzle(root, game, d));
  const errors = [];
  puzzles.forEach((p, i) => errors.push(...validatePuzzle(game, p, { date: dates[i], words }).map(e => `${dates[i]}: ${e}`)));
  if (MODULES[game]?.validateSet) errors.push(...MODULES[game].validateSet(puzzles));
  return { dates, puzzles, errors };
}

export const guessWords = (root, words) => word.guesses(words);
