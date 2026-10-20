// Lists the answers in crossword drafts that have no clue yet (neither hand-written nor
// automatic), most-needed first, without filling anything:  node scripts/games/crossword-missing.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./util.mjs";
import { clueBook, autoBook } from "./crossword.mjs";
import { slots } from "./crossword-grid.mjs";

const dir = path.join(ROOT, "scripts/games/crossword-drafts");
const book = clueBook(), auto = autoBook(), need = new Map();
for (const f of fs.readdirSync(dir).sort()) {
  const { grid } = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const s of slots(grid.replace(/[a-z]/g, "."))) {
    const w = s.cells.map(i => grid[i]).join("");
    if (!book.has(w) && !auto.has(w)) need.set(w, [...(need.get(w) || []), f.slice(0, 10)]);
  }
}
for (const [w, d] of [...need].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) console.log(`${w}\t${d.join(" ")}`);
console.error(`${need.size} answer(s) need clues`);
