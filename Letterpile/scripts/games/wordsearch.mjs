// Daily Word Search: a 20x20 grid with a daily theme from lexicon/wordsearch-themes.txt and
// 25-30 of its words, placed in all 8 directions with shared letters where possible. Every word
// appears exactly once, no blocklisted word appears anywhere in the grid (forwards or
// backwards), and no theme repeats within THEME_GAP days.
import fs from "node:fs";
import path from "node:path";
import { ROOT, rng, shuffle, keyFor, puzzleNumber, daysBetween } from "./util.mjs";

export const SIZE = 20;
export const THEME_GAP = 35;
export const COUNT = [25, 30];
export const MIN_LEN = 4;
export const LONG = 8;
// Row and column steps: E, S, SE, NE, W, N, NW, SW.
export const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
// Filler letters, weighted roughly by English letter frequency.
const FILL = "eeeeeeeeeeeettttttttaaaaaaaaoooooooiiiiiiinnnnnnnsssssshhhhhhrrrrrrddddllllcccuuummmwwffggyyppbbvkjxqz";

export function themes() {
  const text = fs.readFileSync(path.join(ROOT, "scripts/games/lexicon/wordsearch-themes.txt"), "utf8");
  return text.split(/^## /m).slice(1).map(block => {
    const [name, ...rest] = block.split(/\r?\n/);
    const tokens = rest.filter(l => !l.trim().startsWith("#")).join(" ").split(/\s+/).filter(Boolean);
    return { name: name.trim(), tokens, words: tokens.map(t => ({ display: t.replace(/_/g, " ").toUpperCase(), letters: t.replace(/_/g, "") })) };
  });
}
const usable = t => t.words.filter(w => w.letters.length >= MIN_LEN && w.letters.length <= SIZE);
const rev = s => [...s].reverse().join("");

// Problems with one theme's word list (also checked by the unit tests).
export function checkTheme(t, words) {
  const errors = [];
  for (const tok of t.tokens) if (!/^[a-z]+(_[a-z]+)*$/.test(tok)) errors.push(`${t.name}: "${tok}" must be lower-case letters (use _ between words)`);
  const u = usable(t);
  if (u.length < 32) errors.push(`${t.name}: only ${u.length} words of ${MIN_LEN}-${SIZE} letters (need 32)`);
  if (u.filter(w => w.letters.length >= LONG).length < 6) errors.push(`${t.name}: needs at least 6 words of ${LONG}+ letters`);
  const seen = new Set();
  for (const w of t.words) { if (seen.has(w.letters)) errors.push(`${t.name}: "${w.display}" is listed twice`); seen.add(w.letters); }
  for (const a of u) for (const b of u) if (a !== b && (b.letters.includes(a.letters) || b.letters.includes(rev(a.letters)))) errors.push(`${t.name}: "${a.display}" is inside "${b.display}"`);
  if (words) for (const w of t.words) for (const part of [w.letters, ...w.display.toLowerCase().split(" ")]) if (words.blockedSet.has(part)) errors.push(`${t.name}: "${part}" is on the blocklist`);
  return errors;
}

// ---------- grid scanning ----------

const at = (g, r, c) => (r >= 0 && r < SIZE && c >= 0 && c < SIZE ? g[r * SIZE + c] : null);
// Every place a word occurs (any of 8 directions), as sets of cells; a palindrome read both
// ways is one occurrence.
export function occurrences(grid, word) {
  const found = new Map();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (grid[r * SIZE + c] !== word[0]) continue;
    for (const [dr, dc] of DIRS) {
      let k = 0;
      while (k < word.length && at(grid, r + dr * k, c + dc * k) === word[k]) k++;
      if (k === word.length) {
        const cells = [...Array(k).keys()].map(j => (r + dr * j) * SIZE + c + dc * j);
        found.set(cells.slice().sort((a, b) => a - b).join(","), cells);
      }
    }
  }
  return [...found.values()];
}
// Every straight line of the grid as a string (rows, columns, both diagonals), both ways.
export function lines(grid) {
  const out = [];
  for (const [dr, dc] of DIRS.slice(0, 4)) for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (at(grid, r - dr, c - dc) !== null) continue; // start only at an edge
    let s = "";
    for (let k = 0; at(grid, r + dr * k, c + dc * k) !== null; k++) s += at(grid, r + dr * k, c + dc * k);
    out.push(s, rev(s));
  }
  return out;
}
// Blocklisted words of 3+ letters that can be read in the grid, other than inside one of the
// placed theme words (COMPASS contains a short blocklisted word, and that's fine; the same
// letters made by filler or across two words are not).
export function offensive(grid, words, placed = []) {
  const inside = placed.map(cells => new Set(cells));
  const ls = lines(grid);
  return words.blocked.filter(b => b.length >= 3 && ls.some(l => l.includes(b)))
    .filter(b => occurrences(grid, b).some(occ => !inside.some(set => occ.every(i => set.has(i)))));
}
export const cellsOf = w => {
  const [dr, dc] = DIRS[w.d];
  return [...Array(w.w.replace(/ /g, "").length).keys()].map(k => (w.r + dr * k) * SIZE + w.c + dc * k);
};

// ---------- generation ----------

function place(r, list) {
  const g = Array(SIZE * SIZE).fill(null);
  const placed = [], used = new Set();
  for (const w of list) {
    const opts = [];
    for (let d = 0; d < 8; d++) {
      const [dr, dc] = DIRS[d];
      for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
        const er = row + dr * (w.letters.length - 1), ec = col + dc * (w.letters.length - 1);
        if (er < 0 || er >= SIZE || ec < 0 || ec >= SIZE) continue;
        let overlap = 0, ok = true;
        for (let k = 0; k < w.letters.length && ok; k++) {
          const cell = g[(row + dr * k) * SIZE + col + dc * k];
          if (cell === null) continue;
          if (cell === w.letters[k]) overlap++; else ok = false;
        }
        if (!ok || overlap === w.letters.length) continue;
        opts.push({ row, col, d, score: overlap * 4 + (used.has(d) ? 0 : 6) + r() * 3 });
      }
    }
    if (!opts.length) return null;
    opts.sort((a, b) => b.score - a.score);
    const o = opts[Math.floor(r() * Math.min(3, opts.length))];
    const [dr, dc] = DIRS[o.d];
    for (let k = 0; k < w.letters.length; k++) g[(o.row + dr * k) * SIZE + o.col + dc * k] = w.letters[k];
    used.add(o.d);
    placed.push({ w: w.display, r: o.row, c: o.col, d: o.d });
  }
  return { g, placed, dirs: used.size };
}

function chooseWords(r, theme) {
  const u = shuffle(r, usable(theme));
  const n = COUNT[0] + Math.floor(r() * (COUNT[1] - COUNT[0] + 1));
  const long = u.filter(w => w.letters.length >= LONG).slice(0, 4 + Math.floor(r() * 3));
  const rest = u.filter(w => !long.includes(w)).slice(0, n - long.length);
  return [...long, ...rest].sort((a, b) => b.letters.length - a.letters.length);
}

export function pickTheme(date, history, all = themes()) {
  const last = new Map(history.map(p => [p.theme, p.date]));
  const free = all.filter(t => !last.has(t.name) || daysBetween(last.get(t.name), date) >= THEME_GAP);
  if (!free.length) throw new Error(`Every word search theme was used in the last ${THEME_GAP} days; add themes to lexicon/wordsearch-themes.txt.`);
  // Least recently used first (never-used themes before all others), then a seeded pick among the oldest few.
  free.sort((a, b) => (last.get(a.name) || "").localeCompare(last.get(b.name) || ""));
  const pool = free.filter(t => !last.has(t.name));
  const r = rng(`${keyFor("wordsearch", date)}:theme`);
  return (pool.length ? pool : free.slice(0, 5))[Math.floor(r() * (pool.length ? pool.length : Math.min(5, free.length)))];
}

export function generate(date, { history = [], words }) {
  const theme = pickTheme(date, history);
  for (let n = 0; n < 500; n++) {
    const r = rng(`${keyFor("wordsearch", date)}:${n}`);
    const list = chooseWords(r, theme);
    const res = place(r, list);
    if (!res || res.dirs < 8) continue;
    for (let f = 0; f < 20; f++) {
      const grid = res.g.map(x => x ?? FILL[Math.floor(r() * FILL.length)]).join("");
      const p = { v: 1, game: "wordsearch", date, number: puzzleNumber(date), theme: theme.name, size: SIZE, grid, words: res.placed.slice().sort((a, b) => a.w.localeCompare(b.w)) };
      if (!validate(p, { date, words, themeList: [theme] }).length) return p;
    }
  }
  throw new Error(`Could not build a word search for ${date} (${theme.name}).`);
}

export function validate(p, { date, words, themeList = themes() }) {
  const errors = [];
  if (p.game !== "wordsearch") errors.push("game is not wordsearch");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== puzzleNumber(date)) errors.push(`number ${p.number} should be ${puzzleNumber(date)}`);
  if (p.size !== SIZE || !new RegExp(`^[a-z]{${SIZE * SIZE}}$`).test(p.grid || "")) return [...errors, `grid must be ${SIZE}x${SIZE} letters`];
  const theme = themeList.find(t => t.name === p.theme);
  if (!theme) errors.push(`theme "${p.theme}" is not in the theme list`);
  const list = p.words || [];
  if (list.length < COUNT[0] || list.length > COUNT[1]) errors.push(`${list.length} words (need ${COUNT.join("-")})`);
  if (list.filter(w => w.w.replace(/ /g, "").length >= LONG).length < 3) errors.push(`fewer than 3 words of ${LONG}+ letters`);
  const dirs = new Set();
  for (const w of list) {
    const letters = w.w.replace(/ /g, "").toLowerCase();
    if (theme && !theme.words.some(t => t.display === w.w)) errors.push(`"${w.w}" is not a ${p.theme} word`);
    const [dr, dc] = DIRS[w.d] || [];
    if (dr === undefined) { errors.push(`"${w.w}" has no valid direction`); continue; }
    dirs.add(w.d);
    let s = "";
    for (let k = 0; k < letters.length; k++) s += at(p.grid, w.r + dr * k, w.c + dc * k) ?? "?";
    if (s !== letters) errors.push(`"${w.w}" is not at its recorded position`);
    const occ = occurrences(p.grid, letters).length;
    if (occ !== 1) errors.push(`"${w.w}" appears ${occ} times`);
  }
  if (new Set(list.map(w => w.w)).size !== list.length) errors.push("a word is listed twice");
  if (dirs.size < 8) errors.push(`words run in only ${dirs.size} of 8 directions`);
  if (words && dirs.size === 8 && !errors.length) { const bad = offensive(p.grid, words, list.map(cellsOf)); if (bad.length) errors.push(`grid contains ${bad.length} blocklisted word(s) outside the theme words`); }
  return errors;
}

export function validateSet(puzzles) {
  const errors = [], last = new Map();
  for (const p of puzzles) {
    if (last.has(p.theme) && daysBetween(last.get(p.theme), p.date) < THEME_GAP) errors.push(`theme "${p.theme}" repeats on ${p.date} (last used ${last.get(p.theme)})`);
    last.set(p.theme, p.date);
  }
  return errors;
}
