// Letterpile (the game): a 5x5 pile of letter tiles to clear in as few words as possible.
// Boards are built backwards from common words (src/assets/games/lp-engine.js), so each one can
// be cleared by replaying its stored solution. Par is the fewer of the solution's word count and
// what a time-limited solver finds using common words only; difficulty follows the weekday.
import { createRequire } from "node:module";
import { rng, encode, decode, keyFor, weekday, daysBetween } from "./util.mjs";
import { fillList } from "./crossword.mjs";

const require = createRequire(import.meta.url);
export const LP = require("../../src/assets/games/lp-gen.js"); // engine + generator

export const SIZE = 5;
export const EPOCH = "2026-10-17"; // Letterpile #1
export const number = date => daysBetween(EPOCH, date) + 1;
// Target par by weekday (0 = Sunday): 5-6 early in the week, 7-8 at the weekend.
export const TARGET = [7, 5, 5, 6, 6, 7, 8];
export const MAX_HINTS = 3;

// Words the generator builds boards from: very common (SCOWL level <= 20), 3-8 letters.
// Words the par solver may use: common (SCOWL level <= 35). Players may play any ENABLE word
// that isn't hidden by the blocklist.
let cache = null;
export function lists(words) {
  if (cache) return cache;
  const f = fillList();
  const ok = w => /^[a-z]+$/.test(w) && !words.blockedSet.has(w) && words.set.has(w);
  const byLen = {};
  const common = [];
  for (const [w, lv] of f) {
    if (!ok(w)) continue;
    if (lv <= 35) common.push(w);
    if (lv <= 20 && w.length >= 3 && w.length <= 8) (byLen[w.length] = byLen[w.length] || []).push(w);
  }
  for (const k in byLen) byLen[k].sort();
  return (cache = { byLen, parDict: LP.dictionary(common), playDict: LP.dictionary(words.clean) });
}

const boardString = cols => cols.map(c => c.join("")).join("/");
export const parseBoard = s => s.split("/").map(c => [...c]);

export function generate(date, { words }) {
  const { byLen, parDict } = lists(words);
  const target = TARGET[weekday(date)];
  let fallback = null;
  for (let n = 0; n < 400; n++) {
    const r = rng(`${keyFor("letterpile", date)}:${n}`);
    const g = LP.generate(r, byLen, target, SIZE);
    if (!g || offensive(g.cols, words).length) continue;
    const better = LP.solve(g.cols, parDict, { max: target, timeMs: 3000 });
    const par = better ? better.length : target;
    const p = { v: 1, game: "letterpile", date, number: number(date), board: boardString(g.cols), par, s: encode(JSON.stringify(better && better.length < target ? better : g.solution), keyFor("letterpile", date)) };
    if (par === target) return p;
    if (!fallback && par === target - 1) fallback = p;
  }
  if (fallback) return fallback;
  throw new Error(`No Letterpile board found for ${date}.`);
}

export const solutionOf = p => JSON.parse(decode(p.s, keyFor("letterpile", p.date)));

// Blocklisted words (3+ letters) readable in a straight line on the board.
export function offensive(cols, words) {
  const ls = LP.lines(cols, SIZE);
  return words.blocked.filter(b => b.length >= 3 && ls.some(l => l.includes(b)));
}

export function validate(p, { date, words }) {
  const errors = [];
  if (p.game !== "letterpile") errors.push("game is not letterpile");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== number(date)) errors.push(`number ${p.number} should be ${number(date)}`);
  if (typeof p.board !== "string" || !/^([a-z]{5}\/){4}[a-z]{5}$/.test(p.board)) return [...errors, "board must be 5 columns of 5 letters"];
  const cols = parseBoard(p.board);
  let sol;
  try { sol = solutionOf(p); } catch { return [...errors, "stored solution doesn't decode"]; }
  if (!Array.isArray(sol) || !sol.length) return [...errors, "no stored solution"];
  if (sol.length !== p.par) errors.push(`stored solution has ${sol.length} words but par is ${p.par}`);
  const end = LP.replay(cols, sol);
  if (!end) errors.push("stored solution doesn't trace on the board");
  else if (LP.count(end)) errors.push(`stored solution leaves ${LP.count(end)} tiles`);
  if (words) {
    for (const m of sol) if (!words.set.has(m.word) || words.blockedSet.has(m.word) || m.word.length < 3) errors.push(`"${m.word}" is not an allowed word`);
    const bad = offensive(cols, words);
    if (bad.length) errors.push(`board shows ${bad.length} blocklisted word(s) in a straight line`);
  }
  const target = TARGET[weekday(date)];
  if (p.par > target || p.par < target - 1) errors.push(`par ${p.par} is outside ${target - 1}-${target} for this weekday`);
  return errors;
}
