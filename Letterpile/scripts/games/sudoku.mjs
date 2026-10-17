// Daily Sudoku: one 9x9 puzzle a day, difficulty by weekday (Mon easy -> Sat hard, Sun medium).
// Every puzzle has exactly one solution (checked by countSolutions) and can be solved by logic
// alone; its difficulty is the hardest technique a human-style solver needs (grade()).
import { createRequire } from "node:module";
import { rng, encode, decode, keyFor, puzzleNumber, weekday } from "./util.mjs";

const SD = createRequire(import.meta.url)("../../src/assets/games/sd-core.js");

// Weekday (0 = Sunday) -> target. level: hardest technique allowed/required (see grade);
// clues: allowed range of givens.
export const SCHEDULE = [
  { difficulty: "Medium", min: 2, max: 2, clues: [28, 32] }, // Sun
  { difficulty: "Easy", min: 1, max: 1, clues: [36, 40] }, // Mon
  { difficulty: "Easy", min: 1, max: 1, clues: [32, 35] }, // Tue
  { difficulty: "Medium", min: 2, max: 2, clues: [29, 33] }, // Wed
  { difficulty: "Medium", min: 2, max: 2, clues: [27, 30] }, // Thu
  { difficulty: "Hard", min: 3, max: 3, clues: [25, 28] }, // Fri
  { difficulty: "Hard", min: 3, max: 3, clues: [22, 26] }, // Sat
];
export const target = date => SCHEDULE[weekday(date)];

// The solver, grader and puzzle maker are shared with the printables page:
// src/assets/games/sd-core.js.
export const { countSolutions, grade, validGrid } = SD;
const attempt = SD.attempt;

export function generate(date) {
  const t = target(date);
  for (let n = 0; n < 5000; n++) {
    const a = attempt(rng(`${keyFor("sudoku", date)}:${n}`), t);
    if (a) return { v: 1, game: "sudoku", date, number: puzzleNumber(date), difficulty: t.difficulty, level: a.level, clues: a.clues, givens: a.puzzle, s: encode(a.solution, keyFor("sudoku", date)) };
  }
  throw new Error(`No ${t.difficulty} sudoku found for ${date} in 5000 attempts.`);
}

export const solutionOf = p => decode(p.s, keyFor("sudoku", p.date));


export function validate(p, { date }) {
  const errors = [];
  if (p.game !== "sudoku") errors.push("game is not sudoku");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== puzzleNumber(date)) errors.push(`number ${p.number} should be ${puzzleNumber(date)}`);
  if (!/^[0-9]{81}$/.test(p.givens || "")) return [...errors, "givens must be 81 digits"];
  const sol = typeof p.s === "string" ? solutionOf(p) : "";
  if (!validGrid(sol)) return [...errors, "stored solution is not a valid completed grid"];
  for (let i = 0; i < 81; i++) if (p.givens[i] !== "0" && p.givens[i] !== sol[i]) { errors.push(`given at cell ${i} disagrees with the solution`); break; }
  const { count, solution } = countSolutions(p.givens, 2);
  if (count !== 1) errors.push(`has ${count === 0 ? "no" : "more than one"} solution`);
  else if (solution !== sol) errors.push("unique solution differs from the stored solution");
  const clues = [...p.givens].filter(c => c !== "0").length;
  if (clues !== p.clues) errors.push(`clue count ${clues} does not match ${p.clues}`);
  for (let i = 0; i <= 40; i++) if ((p.givens[i] === "0") !== (p.givens[80 - i] === "0")) { errors.push("givens are not rotationally symmetric"); break; }
  const t = target(date);
  const gr = grade(p.givens);
  if (!gr.solved) errors.push("cannot be solved by logic alone");
  if (gr.level !== p.level || gr.level < t.min || gr.level > t.max) errors.push(`grade ${gr.level} does not fit ${t.difficulty} for this weekday`);
  if (p.difficulty !== t.difficulty) errors.push(`difficulty ${p.difficulty} should be ${t.difficulty}`);
  if (clues < t.clues[0] || clues > t.clues[1]) errors.push(`${clues} clues is outside ${t.clues.join("-")}`);
  return errors;
}
