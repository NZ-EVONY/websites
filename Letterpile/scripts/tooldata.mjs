// Data for the word tools added in Phase 4, built from files in the repo at build time:
//  - the common-words list (SCOWL size levels 10-35, as kept in scripts/games/lexicon) that the
//    Letter Hive, Letter Box, Word Ladder, Hangman and Cryptogram solvers use to rank answers;
//  - rhyme and syllable data from the CMU Pronouncing Dictionary (scripts/lexicon).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fillList } from "./games/crossword.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const require = createRequire(import.meta.url);
export const WordTools = require("../src/assets/js/wordtools.js");

// Common words that are visible on the site: level <= 20 is "very common", 35 "common".
export function commonWords(data) {
  const very = [], common = [];
  for (const [w, lv] of fillList()) {
    if (!data.set.has(w) || data.blockedSet.has(w)) continue;
    if (lv <= 20) very.push(w); else if (lv <= 35) common.push(w);
  }
  return { very: very.sort(), common: common.sort() };
}
export const commonJs = c => `/* Common English words, from SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson and others, size levels 10-35, limited to words in the ENABLE list. Licence: /licenses/scowl.txt */\nself.COMMON_WORDS="${c.very.join(" ")}|${c.common.join(" ")}";\n`;

// Pronunciations: word -> phonemes (ARPAbet, stress digits on vowels).
export function pronunciations() {
  const m = new Map();
  for (const l of fs.readFileSync(path.join(ROOT, "scripts/lexicon/cmudict-enable.txt"), "utf8").split(/\r?\n/)) {
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf(" ");
    m.set(l.slice(0, i), l.slice(i + 1));
  }
  return m;
}
// The rhyming part: from the last stressed vowel (primary, else secondary, else the last vowel)
// to the end, without stress marks. Words that share it rhyme.
export function rhymeTail(pron) {
  const ph = pron.split(" ");
  const vowels = ph.map((p, i) => (/\d$/.test(p) ? i : -1)).filter(i => i >= 0);
  if (!vowels.length) return "";
  const last = d => vowels.filter(i => ph[i].endsWith(d)).at(-1);
  const at = last("1") ?? last("2") ?? vowels.at(-1);
  return ph.slice(at).map(p => p.replace(/\d$/, "")).join(" ");
}
export const syllables = pron => pron.split(" ").filter(p => /\d$/.test(p)).length;

// Shipped as JSON: [[tail, "2abate 1bait ..."], ...], each word prefixed by its syllable count.
export function rhymeData() {
  const groups = new Map();
  for (const [w, p] of pronunciations()) {
    const t = rhymeTail(p);
    if (!t) continue;
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(`${syllables(p)}${w}`);
  }
  return [...groups].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([t, ws]) => [t, ws.join(" ")]);
}
