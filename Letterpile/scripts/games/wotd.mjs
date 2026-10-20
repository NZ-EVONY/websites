// Word of the Day: one common word a day (from the word-page words), with a short note on its
// meaning and usage written for this site and approved by the owner, and a fact for word games
// computed from the word list. Notes live in scripts/games/wotd-notes.txt, one line per date:
//   2026-10-17 | bizarre | meaning | usage | draft
// A date is published only when its status is "ok" (the owner changes it after proofreading
// scripts/games/wotd-review.md). Dates without a note get a suggested word in the review file.
import fs from "node:fs";
import path from "node:path";
import { ROOT, rng, keyFor, daysBetween } from "./util.mjs";
import { wordPageWords } from "../wordpages.mjs";

export const EPOCH = "2026-10-17";
export const number = date => daysBetween(EPOCH, date) + 1;
const NOTES = path.join(ROOT, "scripts/games/wotd-notes.txt");
const REVIEW = path.join(ROOT, "scripts/games/wotd-review.md");

// Thrown for a date that can't be published yet; games:generate lists it and carries on.
export class NeedsNote extends Error {
  constructor(date, state, suggestion) {
    super(`Word of the Day ${date}: ${state === "draft" ? "note waiting for approval" : "no note yet"}`);
    Object.assign(this, { pending: true, date, state, suggestion });
  }
}

export function notes() {
  const m = new Map();
  if (!fs.existsSync(NOTES)) return m;
  for (const l of fs.readFileSync(NOTES, "utf8").split(/\r?\n/)) {
    if (!l.trim() || l.startsWith("#")) continue;
    const [date, word, meaning, usage, status] = l.split("|").map(s => s.trim());
    m.set(date, { date, word: (word || "").toLowerCase(), meaning, usage, status: (status || "draft").toLowerCase() });
  }
  return m;
}

// The game-related fact, worked out from the list (so it can't be wrong).
export function fact(w, words) {
  const { Engine } = words;
  const ok = x => words.set.has(x) && !words.blockedSet.has(x);
  const W = w.toUpperCase();
  const anagrams = Engine.anagrams(w).exact.filter(x => x !== w && ok(x));
  const AZ = [..."abcdefghijklmnopqrstuvwxyz"];
  const hooks = [...AZ.filter(l => ok(l + w)).map(l => l + w), ...AZ.filter(l => ok(w + l)).map(l => w + l)];
  const vowels = [...w].filter(c => "aeiou".includes(c)).length;
  const pts = Engine.score(w, "scrabble"), values = Engine.SCHEMES.scrabble.values;
  const top = [...new Set(w)].sort((a, b) => values[b] - values[a])[0];
  if (anagrams.length) return `${W} is an anagram of ${anagrams.map(x => x.toUpperCase()).join(" and ")}: the same letters, rearranged.`;
  const num = n => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"][n];
  if (vowels * 2 > w.length) return `${num(vowels)[0].toUpperCase()}${num(vowels).slice(1)} of the ${num(w.length)} letters in ${W} are vowels, which makes it a handy word for a rack with too many of them.`;
  if (hooks.length) return `Add one letter and ${W} becomes ${hooks.map(x => x.toUpperCase()).join(" or ")}, so it's a word you can extend on the board.`;
  return `${W} scores ${pts} points with common tile values, ${values[top]} of them from the ${top.toUpperCase()}.`;
}

// noteMap: the notes to use (tests pass their own); defaults to wotd-notes.txt.
export function generate(date, { history = [], words, noteMap = notes() }) {
  const n = noteMap.get(date);
  if (!n || n.status !== "ok") throw new NeedsNote(date, n ? "draft" : "missing", n ? n.word : suggest(date, history, words));
  const { Engine } = words;
  return {
    v: 1, game: "wotd", date, number: number(date), word: n.word, meaning: n.meaning, usage: n.usage, fact: fact(n.word, words),
    points: Engine.score(n.word, "scrabble"), wwf: Engine.score(n.word, "wwf"),
  };
}

// A suggested word for a date without a note: a word-page word of 5 to 8 letters, not used before.
function suggest(date, history, words) {
  const used = new Set([...history.map(p => p.word), ...[...notes().values()].map(x => x.word)]);
  const pool = wordPageWords(words).filter(w => w.length >= 5 && !used.has(w));
  return pool[Math.floor(rng(keyFor("wotd", date))() * pool.length)];
}

const BANNED = /\b(AI|ChatGPT|as an AI|language model|cheat|official)\b/i;
export function validate(p, { date, words }) {
  const errors = [];
  if (p.game !== "wotd") errors.push("game is not wotd");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== number(date)) errors.push(`number ${p.number} should be ${number(date)}`);
  if (!words) return errors;
  if (!wordPageWords(words).includes(p.word)) errors.push(`"${p.word}" has no word page`);
  for (const k of ["meaning", "usage"]) {
    if (!p[k] || p[k].length < 20 || p[k].length > 320) errors.push(`${k} must be 20-320 characters`);
    if (BANNED.test(p[k] || "")) errors.push(`${k} uses wording the site avoids`);
  }
  if (p.fact !== fact(p.word, words)) errors.push("fact doesn't match the word list");
  if (p.points !== words.Engine.score(p.word, "scrabble")) errors.push("points are wrong");
  return errors;
}

export function validateSet(puzzles) {
  const seen = new Map(), errors = [];
  for (const p of puzzles) { if (seen.has(p.word)) errors.push(`${p.date}: ${p.word} was already used on ${seen.get(p.word)}`); seen.set(p.word, p.date); }
  return errors;
}

// The proofreading file: every draft note in full, and the dates that still need one.
export function writeReview(pending) {
  const all = notes();
  const drafts = [...all.values()].filter(n => n.status !== "ok").sort((a, b) => (a.date < b.date ? -1 : 1));
  const missing = pending.filter(e => e.state === "missing");
  const out = [`# Word of the Day: notes to review`, ``,
    `Proofread each note below. To publish one, change its status from \`draft\` to \`ok\` in`,
    `\`scripts/games/wotd-notes.txt\` (edit the text there too if needed), then run`,
    `\`npm run games:generate -- --game wotd --days 0\` and \`npm run build\`. The game fact is worked out`,
    `from the word list when the day is published, so it isn't written here.`, ``,
    `## Drafts waiting for approval (${drafts.length})`, ``,
    ...drafts.flatMap(n => [`### ${n.date}: ${n.word.toUpperCase()}`, ``, `- Meaning: ${n.meaning}`, `- Usage: ${n.usage}`, ``]),
    `## Dates with no note yet (${missing.length})`, ``,
    ...(missing.length ? missing.map(e => `- ${e.date}: suggested word ${e.suggestion ? e.suggestion.toUpperCase() : "(none left)"}`) : ["None."]), ``];
  fs.writeFileSync(REVIEW, out.join("\n"));
}
