// Printables: the shared cores make valid puzzles at every level, and the daily sudoku still
// regenerates byte for byte from the shared core.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { wordData } from "../../scripts/wordstats.mjs";
import { themes } from "../../scripts/games/wordsearch.mjs";
import * as sudoku from "../../scripts/games/sudoku.mjs";
import { ROOT, puzzleDates, readPuzzle, rng } from "../../scripts/games/util.mjs";

const require = createRequire(import.meta.url);
const WS = require("../../src/assets/games/ws-core.js"), SD = require("../../src/assets/games/sd-core.js");
const words = wordData();

test("word searches at every level: right size, allowed directions, each word once, no rude words", () => {
  for (const t of themes().slice(0, 12)) for (const level of Object.keys(WS.LEVELS)) {
    const L = WS.LEVELS[level], p = WS.printable(rng(`t:${t.name}:${level}`), t, level, words.blocked);
    assert.ok(p, `${t.name} ${level}`);
    assert.equal(p.size, L.size);
    assert.ok(p.words.length >= Math.min(L.count[0], 8), `${t.name} ${level}: ${p.words.length} words`);
    assert.ok(p.words.every(w => L.dirs.includes(w.d)));
    assert.ok(p.words.every(w => w.w.replace(/ /g, "").length <= L.maxLen));
    assert.deepEqual(WS.check(p.grid, p.size, p.words, words.blocked), []);
  }
});

test("sudoku at every level: one solution, graded to its level", () => {
  for (const level of Object.keys(SD.LEVELS)) {
    const t = SD.LEVELS[level];
    let a = null;
    for (let n = 0; !a && n < 3000; n++) a = SD.attempt(rng(`sd:${level}:${n}`), t);
    assert.ok(a, level);
    assert.equal(SD.countSolutions(a.puzzle).count, 1);
    const g = SD.grade(a.puzzle);
    assert.ok(g.solved && g.level >= t.min && g.level <= t.max, `${level}: grade ${g.level}`);
  }
});

test("daily sudoku regenerates identically from the shared core", () => {
  for (const d of puzzleDates(ROOT, "sudoku").slice(0, 7)) assert.deepEqual(sudoku.generate(d), readPuzzle(ROOT, "sudoku", d), d);
});
