// Called by scripts/build.mjs: validates every puzzle in content/games/<game>/<date>.json,
// copies them to public/puzzles/<game>/<date>.json and writes public/puzzles/manifest.json.
// The build fails on any invalid puzzle, so a bad file can never be published.
import { GAMES, validateGame, guessWords } from "./lib.mjs";

export function buildGames({ root, write, hash, words }) {
  const manifest = { games: {} };
  for (const game of GAMES) {
    const { dates, puzzles, errors } = validateGame(root, game, words);
    if (errors.length) throw new Error(`content/games/${game} has invalid puzzles:\n  ${errors.slice(0, 10).join("\n  ")}`);
    puzzles.forEach((p, i) => write(`puzzles/${game}/${dates[i]}.json`, JSON.stringify(p)));
    manifest.games[game] = dates;
  }
  write("puzzles/manifest.json", JSON.stringify(manifest));
  // Allowed guesses for the word game (hashed name, cached long term like the word list).
  const list = guessWords(root, words);
  const guesses = JSON.stringify(list);
  const guessesName = `/data/guesses.${hash(guesses)}.json`;
  write(guessesName, guesses);
  return { manifest, guessesName, guessCount: list.length };
}
