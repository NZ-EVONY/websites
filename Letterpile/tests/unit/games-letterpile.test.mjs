// Letterpile (the game): engine rules, the backwards generator, the validator and every
// published daily pile.
import test from "node:test";
import assert from "node:assert/strict";
import { wordData } from "../../scripts/wordstats.mjs";
import * as lp from "../../scripts/games/letterpile.mjs";
import { validateGame } from "../../scripts/games/lib.mjs";
import { rng, encode } from "../../scripts/games/util.mjs";
import { ROOT } from "../helpers.mjs";

const { LP } = lp;
const words = wordData();

test("tracing: neighbors only (diagonals included), no tile twice, tiles must exist", () => {
  const b = [["a", "b"], ["c", "d"]];
  assert.equal(LP.canTrace(b, [[0, 0], [1, 1], [0, 1]]), true, "diagonal then up-left");
  assert.equal(LP.canTrace(b, [[0, 0], [0, 0]]), false, "same tile twice");
  assert.equal(LP.canTrace([["a"], [], ["c"]], [[0, 0], [2, 0]]), false, "two columns apart");
  assert.equal(LP.canTrace(b, [[0, 0], [0, 2]]), false, "no tile there");
});

test("gravity: removing tiles lets the ones above fall within their column", () => {
  const b = [["a", "b", "c"], ["d", "e", "f"]];
  assert.deepEqual(LP.remove(b, [[0, 0], [1, 1]]), [["b", "c"], ["d", "f"]]);
  assert.deepEqual(b, [["a", "b", "c"], ["d", "e", "f"]], "the original board is unchanged");
});

test("column collapse: an emptied column closes up and the columns to its right slide left", () => {
  const b = [["a", "b"], ["c"], ["d", "e"], []];
  assert.deepEqual(LP.drop(b, [[1, 0]]), [["a", "b"], [], ["d", "e"], []], "gravity alone leaves a gap");
  assert.deepEqual(LP.remove(b, [[1, 0]]), [["a", "b"], ["d", "e"], [], []], "a move closes it");
  assert.deepEqual(LP.remove([["x"], ["y"], ["z"]], [[0, 0], [1, 0]]), [["z"], [], []]);
});

test("unreachable letters: dimmed only when no word can use them, whatever the arrangement", () => {
  const list = ["cat", "act", "tub"];
  assert.deepEqual([...LP.deadLetters([["c", "a"], ["t"], ["u", "u"]], list)].sort(), ["u"]);
  assert.deepEqual([...LP.deadLetters([["c", "a"], ["t", "u"], ["b"]], list)].sort(), [], "every letter is in some word");
  assert.deepEqual([...LP.deadLetters([["u", "u"], [], []], list)], ["u"], "two tiles can't make a word");
});

test("finding words on a board, and a path for a given word", () => {
  const dict = LP.dictionary(["cat", "act", "tac", "dog"]);
  const b = [["c", "x"], ["a", "t"]];
  assert.deepEqual(LP.findWords(b, dict).map(m => m.word).sort(), ["act", "cat", "tac"]);
  assert.ok(LP.canTrace(b, LP.findPath(b, "cat")));
  assert.equal(LP.findPath(b, "dog"), null);
});

test("generator: 50 boards, each full and cleared by replaying its solution (with column collapse)", () => {
  const { byLen } = lp.lists(words);
  let collapses = 0;
  for (let i = 0; i < 50; i++) {
    let g = null;
    for (let t = 0; !g && t < 30; t++) g = LP.generate(rng(`test${i}:${t}`), byLen, 5 + (i % 4), 5);
    assert.ok(g, `board ${i}`);
    assert.equal(LP.count(g.cols), 25);
    assert.ok(g.cols.every(c => c.length === 5));
    const end = LP.replay(g.cols, g.solution);
    assert.ok(end && LP.count(end) === 0, `board ${i} clears`);
    let b = g.cols;
    for (const m of g.solution) {
      const d = LP.drop(b, m.path);
      if (d.some((c, j) => !c.length && d.slice(j).some(x => x.length))) collapses++;
      b = LP.remove(b, m.path);
    }
  }
  assert.ok(collapses > 0, "some solutions rely on a column closing up");
});

test("every published daily pile is valid: clears with its solution, par fits the weekday", () => {
  const { dates, errors } = validateGame(ROOT, "letterpile", words);
  assert.ok(dates.length >= 35, `${dates.length} days`);
  assert.deepEqual(errors, []);
});

test("validator rejects a changed board, a wrong par and a blocklisted word in a line", () => {
  const p = lp.generate("2026-10-19", { words }); // a Monday: par 5
  const ok = q => lp.validate(q, { date: "2026-10-19", words });
  assert.deepEqual(ok(p), []);
  const swapped = p.board.split("/");
  swapped[0] = [...swapped[0]].reverse().join("");
  assert.ok(ok({ ...p, board: swapped.join("/") }).length > 0, "a changed board no longer replays");
  assert.match(ok({ ...p, par: 8 }).join(), /par 8/);
  const bad = words.blocked.find(b => b.length === 5);
  const cols = lp.parseBoard(p.board);
  cols[0] = [...bad];
  assert.match(lp.offensive(cols, words).join(), new RegExp(bad));
  assert.match(ok({ ...p, s: encode("[]", "letterpile:2026-10-19") }).join(), /no stored solution/);
});
