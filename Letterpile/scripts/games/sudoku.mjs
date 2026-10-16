// Daily Sudoku: one 9x9 puzzle a day, difficulty by weekday (Mon easy -> Sat hard, Sun medium).
// Every puzzle has exactly one solution (checked by countSolutions) and can be solved by logic
// alone; its difficulty is the hardest technique a human-style solver needs (grade()).
import { rng, shuffle, encode, decode, keyFor, puzzleNumber, weekday } from "./util.mjs";

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

const ROW = i => Math.floor(i / 9), COL = i => i % 9, BOX = i => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);
const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9).keys()].map(c => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9).keys()].map(r => r * 9 + c));
for (let b = 0; b < 9; b++) UNITS.push([...Array(9).keys()].map(k => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)));
const PEERS = [...Array(81).keys()].map(i => [...new Set(UNITS.filter(u => u.includes(i)).flat())].filter(j => j !== i));
const bits = m => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
const ALL = 0x3FE; // bits 1..9

// ---------- exact solver (bitmasks, fewest-candidates first) ----------

// Counts solutions of an 81-char string ("0" = empty), stopping at `limit`. Returns
// { count, solution } where solution is the first one found.
export function countSolutions(grid, limit = 2) {
  const g = [...grid].map(Number);
  const row = Array(9).fill(0), col = Array(9).fill(0), box = Array(9).fill(0);
  for (let i = 0; i < 81; i++) if (g[i]) {
    const b = 1 << g[i];
    if ((row[ROW(i)] | col[COL(i)] | box[BOX(i)]) & b) return { count: 0, solution: null }; // clash in the givens
    row[ROW(i)] |= b; col[COL(i)] |= b; box[BOX(i)] |= b;
  }
  let count = 0, solution = null;
  (function search() {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) {
      const m = ALL & ~(row[ROW(i)] | col[COL(i)] | box[BOX(i)]);
      const n = bits(m);
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n <= 1) break; }
    }
    if (best < 0) { count++; if (!solution) solution = g.join(""); return; }
    for (let d = 1; d <= 9 && count < limit; d++) if (bestMask & (1 << d)) {
      const b = 1 << d;
      g[best] = d; row[ROW(best)] |= b; col[COL(best)] |= b; box[BOX(best)] |= b;
      search();
      g[best] = 0; row[ROW(best)] &= ~b; col[COL(best)] &= ~b; box[BOX(best)] &= ~b;
    }
  })();
  return { count, solution };
}

// ---------- human-style grader ----------
// Level 1: naked and hidden singles. Level 2: pointing pairs and box/line reduction.
// Level 3: naked and hidden pairs and triples. Returns { solved, level } (level = the hardest
// technique that was needed), or solved: false if these techniques get stuck.
export function grade(grid) {
  const g = [...grid].map(Number);
  const cand = g.map((v, i) => (v ? 0 : ALL));
  const place = (i, d) => { g[i] = d; cand[i] = 0; for (const p of PEERS[i]) cand[p] &= ~(1 << d); };
  for (let i = 0; i < 81; i++) if (g[i]) for (const p of PEERS[i]) cand[p] &= ~(1 << g[i]);
  let level = 0;
  const singles = () => {
    for (let i = 0; i < 81; i++) if (!g[i] && bits(cand[i]) === 1) { place(i, Math.log2(cand[i])); return true; }
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      const where = u.filter(i => cand[i] & (1 << d));
      if (where.length === 1 && !u.some(i => g[i] === d)) { place(where[0], d); return true; }
    }
    return false;
  };
  const pointing = () => {
    let changed = false;
    for (let b = 18; b < 27; b++) for (let d = 1; d <= 9; d++) {
      const where = UNITS[b].filter(i => cand[i] & (1 << d));
      if (where.length < 2) continue;
      for (const line of [ROW, COL]) if (where.every(i => line(i) === line(where[0]))) {
        const u = line === ROW ? UNITS[ROW(where[0])] : UNITS[9 + COL(where[0])];
        for (const i of u) if (!where.includes(i) && cand[i] & (1 << d)) { cand[i] &= ~(1 << d); changed = true; }
      }
    }
    for (let l = 0; l < 18; l++) for (let d = 1; d <= 9; d++) {
      const where = UNITS[l].filter(i => cand[i] & (1 << d));
      if (where.length < 2 || !where.every(i => BOX(i) === BOX(where[0]))) continue;
      for (const i of UNITS[18 + BOX(where[0])]) if (!where.includes(i) && cand[i] & (1 << d)) { cand[i] &= ~(1 << d); changed = true; }
    }
    return changed;
  };
  const subsets = () => {
    let changed = false;
    for (const u of UNITS) {
      const open = u.filter(i => !g[i]);
      for (const size of [2, 3]) {
        // Naked subsets: `size` cells whose candidates together are `size` digits.
        const combos = (arr, k, start = 0, acc = []) => k === 0 ? [acc] : arr.slice(start).flatMap((x, j) => combos(arr, k - 1, start + j + 1, [...acc, x]));
        for (const set of combos(open, size)) {
          const m = set.reduce((a, i) => a | cand[i], 0);
          if (bits(m) !== size) continue;
          for (const i of open) if (!set.includes(i) && cand[i] & m) { cand[i] &= ~m; changed = true; }
        }
        // Hidden subsets: `size` digits that only fit in the same `size` cells.
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !u.some(i => g[i] === d));
        for (const ds of combos(digits, size)) {
          const dm = ds.reduce((a, d) => a | (1 << d), 0);
          const cells = open.filter(i => cand[i] & dm);
          if (cells.length !== size) continue;
          for (const i of cells) if (cand[i] & ~dm) { cand[i] &= dm; changed = true; }
        }
      }
    }
    return changed;
  };
  for (;;) {
    if (g.every(Boolean)) return { solved: true, level };
    if (singles()) { level = Math.max(level, 1); continue; }
    if (pointing()) { level = Math.max(level, 2); continue; }
    if (subsets()) { level = Math.max(level, 3); continue; }
    return { solved: false, level };
  }
}

// ---------- generation ----------

function fullGrid(r) {
  const g = Array(81).fill(0);
  (function fill(i) {
    if (i === 81) return true;
    for (const d of shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (PEERS[i].some(p => g[p] === d)) continue;
      g[i] = d;
      if (fill(i + 1)) return true;
    }
    g[i] = 0;
    return false;
  })(0);
  return g.join("");
}

// Removes clues in rotationally symmetric pairs while the solution stays unique, stopping at
// the target clue range; keeps the attempt only if its grade matches the day.
function attempt(r, t) {
  const solution = fullGrid(r);
  const g = [...solution];
  const goal = t.clues[0] + Math.floor(r() * (t.clues[1] - t.clues[0] + 1));
  let clues = 81;
  for (const i of shuffle(r, [...Array(41).keys()])) {
    const pair = i === 40 ? [40] : [i, 80 - i];
    if (clues - pair.length < goal) continue;
    const keep = pair.map(j => g[j]);
    pair.forEach(j => { g[j] = "0"; });
    const ok = countSolutions(g.join("")).count === 1 && grade(g.join("")).solved;
    if (ok) clues -= pair.length;
    else pair.forEach((j, k) => { g[j] = keep[k]; });
    if (clues <= goal) break;
  }
  const puzzle = g.join("");
  const { solved, level } = grade(puzzle);
  if (!solved || level < t.min || level > t.max || clues < t.clues[0] || clues > t.clues[1]) return null;
  return { puzzle, solution, clues, level };
}

export function generate(date) {
  const t = target(date);
  for (let n = 0; n < 5000; n++) {
    const a = attempt(rng(`${keyFor("sudoku", date)}:${n}`), t);
    if (a) return { v: 1, game: "sudoku", date, number: puzzleNumber(date), difficulty: t.difficulty, level: a.level, clues: a.clues, givens: a.puzzle, s: encode(a.solution, keyFor("sudoku", date)) };
  }
  throw new Error(`No ${t.difficulty} sudoku found for ${date} in 5000 attempts.`);
}

export const solutionOf = p => decode(p.s, keyFor("sudoku", p.date));

export function validGrid(s) {
  if (!/^[1-9]{81}$/.test(s)) return false;
  return UNITS.every(u => new Set(u.map(i => s[i])).size === 9);
}

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
