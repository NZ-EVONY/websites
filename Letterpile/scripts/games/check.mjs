// Reports how many days of puzzles are left for each daily game, counting from today (UTC),
// and validates every puzzle. Exits with an error if any game has fewer than MIN_DAYS left
// (or a gap, or an invalid puzzle). Usage: npm run games:check [-- --min 7]
import fs from "node:fs";
import path from "node:path";
import { wordData } from "../wordstats.mjs";
import { validateGame } from "./lib.mjs";
import { ROOT, GAMES, addDays, todayUTC } from "./util.mjs";

const i = process.argv.indexOf("--min");
const MIN_DAYS = i > 0 ? +process.argv[i + 1] : 7;
const today = todayUTC();
const words = wordData();
let failed = false;
console.log(`Daily games supply on ${today} (UTC). Minimum: ${MIN_DAYS} days.\n`);
const optional = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "config/games.json"), "utf8")).games.filter(g => g.optional).map(g => g.key));
for (const game of GAMES) {
  const { dates, errors } = validateGame(ROOT, game, words);
  if (optional.has(game)) {
    // Optional games (config/games.json) are reported but never fail the check; invalid puzzles still do.
    let n = 0; while (dates.includes(addDays(today, n))) n++;
    if (errors.length) failed = true;
    console.log(`${errors.length ? "FAIL" : "--  "} ${game.padEnd(11)} ${String(n).padStart(3)} day(s) left (optional: hidden on days without a puzzle, not counted)${errors.length ? `, ${errors.length} invalid` : ""}`);
    continue;
  }
  const have = new Set(dates);
  // Days covered without a gap, starting today.
  let left = 0;
  while (have.has(addDays(today, left))) left++;
  const last = left ? addDays(today, left - 1) : "none";
  const ok = left >= MIN_DAYS && !errors.length;
  if (!ok) failed = true;
  console.log(`${ok ? "OK  " : "FAIL"} ${game.padEnd(11)} ${String(left).padStart(3)} day(s) left, last ${last}${errors.length ? `, ${errors.length} invalid: ${errors.slice(0, 3).join("; ")}` : ""}`);
}
if (failed) {
  console.log(`\nAt least one game has fewer than ${MIN_DAYS} days left or an invalid puzzle. Top up with:\n  npm run games:generate -- --days 30\nthen proofread scripts/games/crossword-review.md, run npm test, commit and deploy.`);
  process.exit(1);
}
console.log("\nAll games have enough puzzles.");
