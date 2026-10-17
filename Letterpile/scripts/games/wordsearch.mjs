// Daily Word Search: a 20x20 grid with a daily theme from lexicon/wordsearch-themes.txt and
// 25-30 of its words, placed in all 8 directions with shared letters where possible. Every word
// appears exactly once, no blocklisted word appears anywhere in the grid (forwards or
// backwards), and no theme repeats within THEME_GAP days.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT, rng, shuffle, keyFor, puzzleNumber, daysBetween } from "./util.mjs";

const WS = createRequire(import.meta.url)("../../src/assets/games/ws-core.js");

export const SIZE = 20;
export const THEME_GAP = 35;
export const COUNT = [25, 30];
export const MIN_LEN = 4;
export const LONG = 8;
// Row and column steps: E, S, SE, NE, W, N, NW, SW.
export const DIRS = WS.DIRS;
const FILL = WS.FILL;

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

// The grid helpers, placement and checks are shared with the printables page:
// src/assets/games/ws-core.js, here at SIZE.
const at = (g, r, c) => WS.at(g, SIZE, r, c);
export const occurrences = (grid, word) => WS.occurrences(grid, word, SIZE);
export const lines = grid => WS.lines(grid, SIZE);
// Blocklisted words of 3+ letters that can be read in the grid, other than inside one of the
// placed theme words (COMPASS contains a short blocklisted word, and that's fine; the same
// letters made by filler or across two words are not).
export const offensive = (grid, words, placed = []) => WS.offensive(grid, words.blocked, placed, SIZE);
export const cellsOf = w => WS.cellsOf(w, SIZE);

// ---------- generation ----------

const place = (r, list) => WS.place(r, list, SIZE);

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
