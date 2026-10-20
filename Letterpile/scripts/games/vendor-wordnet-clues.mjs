// Builds scripts/games/lexicon/crossword-clues-auto.txt: automatic crossword clues derived from
// WordNet 3.0 (Princeton University; licence in licenses/WordNet-LICENSE.txt), for fill-list
// words that have no hand-written clue. Run once when the source or the rules change; the daily
// generator only reads the output file (no network, no AI):
//   npm pack wordnet-db@3.1.14 && tar xzf wordnet-db-3.1.14.tgz
//   node scripts/games/vendor-wordnet-clues.mjs package/dict
// Clues are WordNet synonyms ("Glide") and short definitions, plus regular plurals / -s forms
// of synonyms. Each clue passes the gate in autoClueOk() (crossword.mjs). Words with any sense
// WordNet marks as vulgar, offensive, slang or similar are skipped entirely.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ROOT } from "./util.mjs";
import { fillList, clueBook, banned, autoClueOk, isGood } from "./crossword.mjs";
import { wordData } from "../wordstats.mjs";

const dict = process.argv[2];
if (!dict || !fs.existsSync(path.join(dict, "data.noun"))) throw new Error("usage: node scripts/games/vendor-wordnet-clues.mjs <wordnet dict dir>");
const POS = { noun: "n", verb: "v", adj: "a", adv: "r" };
const UNSAFE = /\b(vulgar|obscene|offensive|slang|derogatory|disparaging|slur|sexual|sex|genital|penis|vagina|breast|buttocks|excrement|urine|feces|defecat|urinat|copulat|masturbat|prostitut|drug|intoxicat|racial|ethnic)\w*/i;

const synsets = new Map(); // "pos:offset" -> { words, gloss }
const hashes = [];
for (const [file, p] of Object.entries(POS)) {
  const raw = fs.readFileSync(path.join(dict, `data.${file}`));
  hashes.push(`data.${file} ${createHash("sha256").update(raw).digest("hex")}`);
  for (const l of raw.toString("utf8").split("\n")) {
    if (!/^\d{8} /.test(l)) continue;
    const [head, gloss = ""] = l.split(" | ");
    const t = head.split(" ");
    const n = parseInt(t[3], 16);
    const words = [];
    for (let k = 0; k < n; k++) words.push(t[4 + 2 * k].replace(/\(.*\)$/, ""));
    synsets.set(`${p}:${t[0]}`, { words, gloss: gloss.trim(), pos: p });
  }
}
// Senses of each lemma in frequency order (index.<pos> lists offsets most frequent first).
const senses = new Map();
for (const [file, p] of Object.entries(POS)) {
  for (const l of fs.readFileSync(path.join(dict, `index.${file}`), "utf8").split("\n")) {
    if (!l || l.startsWith(" ")) continue;
    const t = l.trim().split(" ");
    const cnt = +t[2], ptr = +t[3];
    const offs = t.slice(4 + ptr + 2, 4 + ptr + 2 + cnt);
    const list = senses.get(t[0]) || [];
    let r = 0;
    for (const o of offs) list.push({ key: `${p}:${o}`, rank: r++ }); // rank within this part of speech
    senses.set(t[0], list);
  }
}

const words = wordData();
const fill = fillList(), book = clueBook(), ban = banned();
const enable = new Set(words.clean);
const cap = s => s[0].toUpperCase() + s.slice(1);
const plural = w => /(s|x|z|ch|sh)$/.test(w) ? w + "es" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s";
// Regular -ed / -ing forms that are real ENABLE words (irregular verbs simply get none).
const formsOf = (x, suf) => {
  const last = x.at(-1), cvc = /[^aeiou][aeiou][^aeiouwxy]$/.test(x);
  let cands = suf === "ed"
    ? [x + "ed", x + "d", x.slice(0, -1) + "ied", x + last + "ed"]
    : [x + "ing", x.slice(0, -1) + "ing", x + last + "ing"];
  if (cvc) cands = [cands.at(-1), ...cands.slice(0, -1)]; // hop -> hopping, not hoping
  const ok = c => enable.has(c) && (suf !== "ed" || !c.endsWith("ied") || /[^aeiou]y$/.test(x)) && (!c.endsWith("eing") || !x.endsWith("e") || /ee$|ye$|oe$/.test(x)) && (c !== x.slice(0, -1) + "ing" || x.endsWith("e"));
  return cands.filter(ok)[0] || null;
};
const nice = s => s.replace(/_/g, " ");
const commonSyn = s => /^[a-z]+( [a-z]+)?$/.test(nice(s)) && nice(s).split(" ").every(x => (fill.get(x) || 99) <= 35 && !words.blockedSet.has(x) && !ban.has(x));

function shortGloss(g) {
  let s = g.split(";")[0].replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^(a|an|the) /i, "");
  // Too long: cut at a natural break ("..., especially ...", "... that ...").
  if (s.split(" ").length > 7) {
    const m = s.match(/^(.+?)(,| that | which | especially | usually | often | used | in which )/);
    if (m && m[1].split(" ").length >= 2) s = m[1];
  }
  // Plain words only: every word of 5+ letters must be an everyday word (no "fissiped").
  if (!s || s.split(" ").length > 6 || s.split(/[^A-Za-z]+/).some(x => x.length >= 5 && (fill.get(x.toLowerCase()) || 99) > 35)) return null;
  return cap(s);
}

// Clues for lemma `w` from its senses (two most frequent senses only), optionally inflected.
function cluesFor(w, inflect = null) {
  const ss = (senses.get(w) || []).filter(s => s.rank < 2).map(s => ({ ...synsets.get(s.key), key: s.key })).filter(s => s.words);
  // A synonym only counts if this meaning is one of its own two main meanings (no "Trailered" for poked).
  const mainFor = (x, key) => (senses.get(x.toLowerCase()) || []).some(t => t.key === key && t.rank < 2);
  if (inflect) {
    const out = [];
    for (const s of ss.filter(s => s.pos === inflect.pos)) for (const x of s.words) {
      if (x === w || !commonSyn(x) || x.includes("_") || !mainFor(x, s.key)) continue;
      const f = inflect.suf ? formsOf(x, inflect.suf) : plural(x);
      if (!f) continue;
      if (enable.has(f)) out.push(cap(f));
    }
    return out;
  }
  const out = [];
  for (const s of ss) {
    for (const x of s.words) if (x !== w && commonSyn(x) && mainFor(x, s.key)) out.push(cap(nice(x)));
    const g = shortGloss(s.gloss);
    if (g) out.push(g);
  }
  return out;
}

const lemmaUnsafe = w => (senses.get(w) || []).some(s => UNSAFE.test(synsets.get(s.key)?.gloss || "") || synsets.get(s.key)?.words.some(x => words.blockedSet.has(x.toLowerCase())));
let lines = [], count = 0;
for (const [w] of [...fill].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (book.has(w) || ban.has(w) || words.blockedSet.has(w) || w.length < 3 || !isGood(w, { fill, book })) continue;
  let clues = [], base = null;
  if (senses.has(w)) clues = cluesFor(w);
  else {
    // Regular plurals / third-person forms: cats <- cat, boxes <- box, ponies <- pony.
    for (const [suf, rep] of [["ies", "y"], ["es", ""], ["s", ""]]) {
      const b = w.endsWith(suf) ? w.slice(0, -suf.length) + rep : null;
      if (b && senses.has(b) && plural(b) === w) { base = b; break; }
    }
    if (base) clues = [...cluesFor(base, { pos: "n" }), ...cluesFor(base, { pos: "v" })];
    else for (const suf of ["ed", "ing"]) {
      if (!w.endsWith(suf)) continue;
      const stem = w.slice(0, -suf.length);
      const cands = [stem, stem + "e", stem.endsWith("i") ? stem.slice(0, -1) + "y" : null, stem.length > 2 && stem.at(-1) === stem.at(-2) ? stem.slice(0, -1) : null].filter(Boolean);
      const b = cands.find(c => (senses.get(c) || []).some(x => x.key.startsWith("v:")) && formsOf(c, suf) === w);
      if (b) { base = b; clues = cluesFor(b, { pos: "v", suf }); break; }
    }
  }
  // Also inflect the base word's own single-word hand-written clues: walk "Stroll" -> walked "Strolled".
  if (!senses.has(w) || base) for (const [suf, cut] of [["ing", 3], ["ed", 2], ["s", 1], ["es", 2]]) {
    if (!w.endsWith(suf)) continue;
    const stem = w.slice(0, -cut);
    const cands = [base, stem, stem + "e", stem.endsWith("i") ? stem.slice(0, -1) + "y" : null, stem.length > 2 && stem.at(-1) === stem.at(-2) ? stem.slice(0, -1) : null].filter(Boolean);
    for (const b of cands) {
      const form = x => suf === "ed" || suf === "ing" ? formsOf(x, suf) : plural(x);
      if (form(b) !== w) continue;
      base ||= b;
      const src = book.get(b)?.clues || []; // hand-written clues only: their sense is known to fit
      for (const c of src) if (/^[A-Z][a-z]+$/.test(c)) { const f = form(c.toLowerCase()); if (f) clues.push(cap(f)); }
      break;
    }
  }
  if (lemmaUnsafe(w) || (base && lemmaUnsafe(base))) continue;
  clues = [...new Set(clues)].filter(c => autoClueOk(w, c, { base, words })).slice(0, 4);
  if (!clues.length) continue;
  lines.push(`${w}: ${clues.join(" | ")}`);
  count++;
}
fs.writeFileSync(path.join(ROOT, "scripts/games/lexicon/crossword-clues-auto.txt"),
  `# Automatic crossword clues, derived from WordNet 3.0 (c) 2006 Princeton University; see
# licenses/WordNet-LICENSE.txt. Made by scripts/games/vendor-wordnet-clues.mjs from wordnet-db 3.1.14:
# ${hashes.join("\n# ")}
# Do not edit by hand: put a better clue in crossword-clues.txt (hand-written clues are used
# first) or ban the word in crossword-banned.txt. ${count} words.
${lines.join("\n")}
`);
console.log(`wrote ${count} words`);
