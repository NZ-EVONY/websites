// Daily Sudoku: the uniqueness check, the grader, the validator and every published puzzle.
import test from "node:test";
import assert from "node:assert/strict";
import * as sudoku from "../../scripts/games/sudoku.mjs";
import { validateGame } from "../../scripts/games/lib.mjs";
import { encode, weekday } from "../../scripts/games/util.mjs";
import { ROOT } from "../helpers.mjs";

// A well-known puzzle with a single solution, and that solution.
const UNIQUE = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const SOLVED = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

test("countSolutions: a proper puzzle has exactly one solution, and it is the right one", () => {
  assert.deepEqual(sudoku.countSolutions(UNIQUE), { count: 1, solution: SOLVED });
});

test("countSolutions: puzzles with more than one solution are caught", () => {
  assert.equal(sudoku.countSolutions("0".repeat(81)).count, 2, "an empty grid; counting stops at the limit");
  // Blank a rectangle a,b / b,a whose cells lie in two boxes: the digits can be swapped, so
  // the grid then has exactly two solutions.
  const blanked = SOLVED.split("");
  let found = false;
  outer: for (let r1 = 0; r1 < 9; r1++) for (let r2 = r1 + 1; r2 < 9; r2++) for (let c1 = 0; c1 < 9; c1++) for (let c2 = c1 + 1; c2 < 9; c2++) {
    const a = SOLVED[r1 * 9 + c1], b = SOLVED[r1 * 9 + c2];
    const sameBoxes = Math.floor(r1 / 3) === Math.floor(r2 / 3) || Math.floor(c1 / 3) === Math.floor(c2 / 3);
    if (sameBoxes && SOLVED[r2 * 9 + c1] === b && SOLVED[r2 * 9 + c2] === a) {
      for (const i of [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2]) blanked[i] = "0";
      found = true; break outer;
    }
  }
  assert.ok(found, "test grid has a swappable rectangle");
  assert.equal(sudoku.countSolutions(blanked.join("")).count, 2);
});

test("countSolutions: clashing givens have no solution", () => {
  assert.equal(sudoku.countSolutions("55" + "0".repeat(79)).count, 0);
});

test("grader: the classic puzzle needs only singles", () => {
  assert.deepEqual(sudoku.grade(UNIQUE), { solved: true, level: 1 });
});

test("every published Daily Sudoku has one solution and the right weekday difficulty", () => {
  const { dates, puzzles, errors } = validateGame(ROOT, "sudoku");
  assert.ok(dates.length >= 35, `${dates.length} days`);
  assert.deepEqual(errors, []);
  for (const p of puzzles) assert.equal(p.difficulty, ["Medium", "Easy", "Easy", "Medium", "Medium", "Hard", "Hard"][weekday(p.date)], p.date);
});

test("validator rejects a puzzle with two solutions, a wrong solution and a wrong weekday", () => {
  const p = sudoku.generate("2026-10-19"); // a Monday
  assert.deepEqual(sudoku.validate(p, { date: "2026-10-19" }), []);
  const firstGiven = [...p.givens].findIndex(c => c !== "0");
  const fewer = { ...p, givens: p.givens.slice(0, firstGiven) + "0" + p.givens.slice(firstGiven + 1) };
  assert.ok(sudoku.validate(fewer, { date: "2026-10-19" }).length > 0);
  assert.match(sudoku.validate({ ...p, givens: "0".repeat(81), clues: 0 }, { date: "2026-10-19" }).join(), /more than one solution/);
  assert.match(sudoku.validate({ ...p, s: encode(SOLVED, "sudoku:2026-10-19") }, { date: "2026-10-19" }).join(), /disagrees with the solution|differs/);
  const friday = { ...p, date: "2026-10-23", number: 8, s: encode(sudoku.solutionOf(p), "sudoku:2026-10-23") };
  assert.match(sudoku.validate(friday, { date: "2026-10-23" }).join(), /should be Hard/);
});
