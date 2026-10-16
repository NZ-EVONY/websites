// Daily Word: one five-letter answer a day from lexicon/word-answers.txt. No answer repeats
// within REPEAT_DAYS. The answer is stored lightly encoded (see util.mjs encode).
import { readList, rng, pick, encode, decode, keyFor, puzzleNumber, daysBetween } from "./util.mjs";

export const REPEAT_DAYS = 365;
const PLURAL = /s$/;
const NOT_PLURAL = /(ss|us|is)$/; // glass, bonus, oasis

export function answers() { return readList("word-answers.txt"); }

// Problems with the answer list itself (also checked by the unit tests).
export function checkAnswerList(list, words) {
  const errors = [], seen = new Set();
  for (const w of list) {
    if (!/^[a-z]{5}$/.test(w)) errors.push(`"${w}" is not five letters a-z`);
    else if (!words.set.has(w)) errors.push(`"${w}" is not in the ENABLE list`);
    else if (words.blockedSet.has(w)) errors.push(`"${w}" is on the blocklist`);
    if (PLURAL.test(w) && !NOT_PLURAL.test(w)) errors.push(`"${w}" looks like a plural`);
    if (seen.has(w)) errors.push(`"${w}" is listed twice`);
    seen.add(w);
  }
  return errors;
}

export function answerOf(p) { return decode(p.a, keyFor("word", p.date)); }

export function validate(p, { date, words, list = answers() }) {
  const errors = [];
  if (p.game !== "word") errors.push("game is not word");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== puzzleNumber(date)) errors.push(`number ${p.number} should be ${puzzleNumber(date)}`);
  if (typeof p.a !== "string") return [...errors, "no encoded answer"];
  const a = answerOf(p);
  if (!/^[a-z]{5}$/.test(a)) return [...errors, "answer does not decode to five letters"];
  if (!list.includes(a)) errors.push(`answer "${a}" is not in the curated answer list`);
  if (words && (!words.set.has(a) || words.blockedSet.has(a))) errors.push(`answer "${a}" is not an allowed word`);
  return errors;
}

// Checks across all dates: no answer used twice within REPEAT_DAYS.
export function validateSet(puzzles) {
  const errors = [], last = new Map();
  for (const p of puzzles) {
    const a = answerOf(p);
    if (last.has(a) && daysBetween(last.get(a), p.date) < REPEAT_DAYS) errors.push(`"${a}" repeats on ${p.date} (last used ${last.get(a)})`);
    last.set(a, p.date);
  }
  return errors;
}

// history: earlier puzzles (any order). Picks a word not used in the last REPEAT_DAYS,
// preferring words never used at all.
export function generate(date, { history = [], list = answers() }) {
  const used = new Map(history.map(p => [answerOf(p), p.date]));
  const fresh = list.filter(w => !used.has(w));
  const allowed = fresh.length ? fresh : list.filter(w => daysBetween(used.get(w), date) >= REPEAT_DAYS);
  if (!allowed.length) throw new Error(`No Daily Word answer is free for ${date}; add words to lexicon/word-answers.txt.`);
  const a = pick(rng(keyFor("word", date)), allowed);
  return { v: 1, game: "word", date, number: puzzleNumber(date), a: encode(a, keyFor("word", date)) };
}

// Allowed guesses: every five-letter ENABLE word not hidden by default, plus the answers.
export function guesses(words, list = answers()) {
  return [...new Set([...words.clean.filter(w => w.length === 5), ...list])].sort();
}
