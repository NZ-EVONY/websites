// Daily Crossword: a 15x15 grid in the standard daily format (rotationally symmetric, 70-78
// entries, no entry under 3 letters, every square checked, all squares connected), filled from
// lexicon/crossword-fill.txt and clued from lexicon/crossword-clues.txt.
//
// Generation runs in two steps, because every clue is written by hand:
//   1. Fill: a grid is filled (preferring common words and words that already have clues) and
//      saved as a draft in scripts/games/crossword-drafts/<date>.json.
//   2. Clue: each entry gets a clue from crossword-clues.txt, never the clue that answer had in
//      the last REPEAT_DAYS days. If any entry has no clue yet, nothing is published for that
//      date; the missing words are listed in crossword-review.md to be clued (or banned in
//      crossword-banned.txt, then the draft is deleted and refilled).
import fs from "node:fs";
import path from "node:path";
import { ROOT, rng, keyFor, puzzleNumber, daysBetween, encode, decode, puzzleDates, readPuzzle } from "./util.mjs";
import { N, LIMITS, slots, checkPattern, makePattern, indexWords, fillAC } from "./crossword-grid.mjs";

export const REPEAT_DAYS = 35;
export const MAX_USES = 3; // the same answer at most this often in any REPEAT_DAYS window
const LEX = path.join(ROOT, "scripts/games/lexicon");
const DRAFTS = path.join(ROOT, "scripts/games/crossword-drafts");
export const REVIEW = path.join(ROOT, "scripts/games/crossword-review.md");

const lines = f => fs.existsSync(path.join(LEX, f)) ? fs.readFileSync(path.join(LEX, f), "utf8").split(/\r?\n/) : [];

// Fill list: word -> SCOWL level (10 most common ... 60).
let fillCache = null;
export function fillList() {
  if (fillCache) return fillCache;
  const m = new Map();
  let lv = 0;
  for (const l of lines("crossword-fill.txt")) {
    if (l.startsWith("## ")) { lv = +l.slice(3); continue; }
    if (!l.trim() || l.startsWith("#")) continue;
    for (const w of l.trim().split(/\s+/)) m.set(w, lv);
  }
  return (fillCache = m);
}
// Clue file: "answer: clue | clue | clue". Answers are lower-case letters; a phrase is written
// with underscores (ice_cream) and entered in the grid without them.
export function clueBook() {
  const m = new Map();
  for (const l of lines("crossword-clues.txt")) {
    if (!l.trim() || l.startsWith("#")) continue;
    const i = l.indexOf(":");
    if (i < 0) continue;
    const key = l.slice(0, i).trim().toLowerCase();
    const clues = l.slice(i + 1).split("|").map(s => s.trim()).filter(Boolean);
    const ans = key.replace(/_/g, "");
    m.set(ans, { display: key.replace(/_/g, " ").toUpperCase(), clues: [...(m.get(ans)?.clues || []), ...clues] });
  }
  return m;
}
// Banned words, plus the simple inflections of those of 4+ letters (sperm -> sperms).
export const banned = () => {
  const base = lines("crossword-banned.txt").filter(l => l.trim() && !l.startsWith("#")).flatMap(l => l.trim().split(/\s+/));
  const book = clueBook(); // an inflection that has its own clues (cahoots) stays allowed
  return new Set(base.flatMap(w => (w.length >= 4 ? [w, ...[w + "s", w + "es", w + "ed", w + "d", w + "ing"].filter(x => !book.has(x))] : [w])));
};

// ---------- puzzle helpers ----------

export const solutionOf = p => decode(p.s, keyFor("crossword", p.date));
export function entries(p) {
  const sol = solutionOf(p);
  return [...p.across.map(e => ({ ...e, dir: "A" })), ...p.down.map(e => ({ ...e, dir: "D" }))].map(e => {
    const cells = [...Array(e.len).keys()].map(k => (e.dir === "A" ? e.r * N + e.c + k : (e.r + k) * N + e.c));
    return { ...e, answer: cells.map(i => sol[i]).join("") };
  });
}

// ---------- generation ----------

function draftFile(date) { return path.join(DRAFTS, `${date}.json`); }
export function readDraft(date) { return fs.existsSync(draftFile(date)) ? JSON.parse(fs.readFileSync(draftFile(date), "utf8")) : null; }

// Recent uses of each answer before `date` (within REPEAT_DAYS), from published puzzles and drafts.
function recentUses(date, history) {
  const uses = new Map(), seen = new Set();
  // Puzzles within REPEAT_DAYS on either side count (dates can be published out of order).
  const add = (d, answers) => { if (d === date || Math.abs(daysBetween(d, date)) >= REPEAT_DAYS || seen.has(d)) return; seen.add(d); for (const a of answers) uses.set(a, (uses.get(a) || 0) + 1); };
  for (const p of history) add(p.date, entries(p).map(e => e.answer));
  // Unpublished drafts count too, so a batch doesn't repeat its own answers.
  if (fs.existsSync(DRAFTS)) for (const f of fs.readdirSync(DRAFTS)) {
    const d = readDraft(f.slice(0, 10));
    if (d) add(d.date, slots(d.grid.replace(/[a-z]/g, ".")).map(s => s.cells.map(i => d.grid[i]).join("")));
  }
  return uses;
}

// "Good" words: common ones (SCOWL level <= 35 for 3 letters, <= 50 for longer words) or
// words that have clues (reviewed by hand). The final grid may only contain these.
const LEVEL_BONUS = { 10: 6, 20: 5, 35: 3, 40: 2, 50: 0, 55: -3, 60: -6 };
export function isGood(w, { fill = fillList(), book = clueBook() } = {}) {
  if (book.has(w)) return true;
  const lv = fill.get(w);
  if (!lv) return false;
  if (w.length === 3) return lv <= 35;
  return lv <= 50;
}

// Fill, then repair: a first fill may use any ENABLE word (rare ones heavily penalised); then the
// squares of every entry that isn't a good word are cleared and refilled from good words only,
// clearing a wider area each few rounds. Patterns that can't be cleaned are dropped.
export function fillContext(date, { history = [], words, uses = recentUses(date, history) } = {}) {
  const fill = fillList(), book = clueBook(), ban = banned();
  const allowed = w => w.length >= 3 && w.length <= LIMITS.maxLen && !ban.has(w) && (uses.get(w) || 0) < MAX_USES;
  const big = [...new Set([...(words ? words.clean : fill.keys()), ...book.keys()])].filter(allowed);
  const good = big.filter(w => isGood(w, { fill, book }));
  return { date, fill, book, uses, bigIx: indexWords(big), goodIx: indexWords(good), goodSet: new Set(good) };
}
// Tries pattern number n for the date; returns the clean grid or null.
export function fillPattern(ctx, n) {
  const { date, fill, book, uses, bigIx } = ctx;
  const r = rng(`${keyFor("crossword", date)}:${n}`);
  const pattern = makePattern(r);
  if (!pattern) return { grid: null, note: "no pattern" };
  const score = w => (book.has(w) ? 4 : 0) + (LEVEL_BONUS[fill.get(w)] ?? -12) - 6 * (uses.get(w) || 0) + r() * 2;
  const g = fillAC(pattern, bigIx, { score, maxSteps: 400, weight: 3 });
  if (!g) return { grid: null, note: "no first fill" };
  return repairGrid(ctx, g, r);
}
// Clears the squares of every entry that isn't a good word and refills them from good words.
export function repairGrid(ctx, g, r = rng(`${keyFor("crossword", ctx.date)}:repair`)) {
  const { fill, book, uses, goodIx, goodSet } = ctx;
  const score = w => (book.has(w) ? 4 : 0) + (LEVEL_BONUS[fill.get(w)] ?? -12) - 6 * (uses.get(w) || 0) + r() * 2;
  const pattern = g.replace(/[a-z]/g, ".");
  const S = slots(pattern);
  const bad = grid => S.filter(s => !goodSet.has(s.cells.map(i => grid[i]).join("")));
  let b = bad(g), round = 0;
  while (b.length && round < 28) {
    round++;
    const free = new Set(b.flatMap(s => s.cells));
    for (let k = 0; k < Math.floor(round / 4); k++) for (const s of S) if (s.cells.some(i => free.has(i))) s.cells.forEach(i => free.add(i));
    for (let k = 0; k < round % 4; k++) S[Math.floor(r() * S.length)].cells.forEach(i => free.add(i));
    const given = [...g].map((ch, i) => (free.has(i) ? "." : ch)).join("");
    const g2 = fillAC(pattern, goodIx, { score, maxSteps: 300, given });
    if (g2) { g = g2; b = bad(g); }
  }
  return b.length ? { grid: null, note: `${b.length} poor entries left after ${round} rounds` } : { grid: g, note: `clean after ${round} repair round(s)` };
}

// Tries patterns 0, 1, 2, ... on worker threads (one per CPU, up to 4) and returns the
// lowest-numbered clean fill, so the result doesn't depend on timing.
export async function fillGrid(date, { history = [], words, maxPatterns = 400, log = () => {} } = {}) {
  const { Worker } = await import("node:worker_threads");
  const os = await import("node:os");
  const threads = Math.max(1, Math.min(4, (os.availableParallelism?.() || os.cpus().length)));
  const uses = [...recentUses(date, history)];
  const results = new Map();
  let next = 0, best = Infinity;
  return new Promise((resolve, reject) => {
    const workers = [];
    const done = () => {
      // Every pattern below the best clean one has been tried: that one is the answer.
      if (best < Infinity && [...Array(best).keys()].every(k => results.has(k))) {
        workers.forEach(w => w.terminate());
        resolve(results.get(best));
        return true;
      }
      if (next >= maxPatterns && results.size >= maxPatterns) { workers.forEach(w => w.terminate()); reject(new Error(`No clean crossword fill found for ${date} after ${maxPatterns} patterns.`)); return true; }
      return false;
    };
    for (let t = 0; t < threads; t++) {
      const w = new Worker(new URL("./crossword-worker.mjs", import.meta.url), { workerData: { date, uses } });
      workers.push(w);
      const feed = () => { if (next < maxPatterns && next < best) w.postMessage(next++); };
      w.on("message", m => {
        if (m.ready) { feed(); return; }
        results.set(m.n, m.grid);
        log(`  ${date} pattern ${m.n}: ${m.note} (${m.secs}s)`);
        if (m.grid && m.n < best) best = m.n;
        if (!done()) feed();
      });
      w.on("error", e => { workers.forEach(x => x.terminate()); reject(e); });
    }
  });
}

export class NeedsClues extends Error {
  constructor(date, words) { super(`${date}: ${words.length} answer(s) need clues: ${words.join(", ")}`); this.date = date; this.words = words; }
}

// Builds the puzzle for `date` from its draft (filling one first if needed). Throws NeedsClues
// if some answers have no clue in crossword-clues.txt.
export async function generate(date, { history = [], log = () => {} } = {}) {
  let draft = readDraft(date);
  if (draft) {
    // A draft that now has entries which aren't good words (newly banned, say): repair it in
    // place, keeping the rest of the grid; refill from scratch if that fails.
    const ctx = fillContext(date, { history, words: (await import("../wordstats.mjs")).wordData() });
    const S = slots(draft.grid.replace(/[a-z]/g, "."));
    if (S.some(s => !ctx.goodSet.has(s.cells.map(i => draft.grid[i]).join("")))) {
      const { grid, note } = repairGrid(ctx, draft.grid);
      log(`  ${date} draft repaired: ${note}`);
      draft = grid ? { date, grid } : null;
      if (grid) fs.writeFileSync(draftFile(date), JSON.stringify(draft) + "\n");
      else fs.rmSync(draftFile(date));
    }
  }
  if (!draft) {
    const grid = await fillGrid(date, { history, log });
    draft = { date, grid };
    fs.mkdirSync(DRAFTS, { recursive: true });
    fs.writeFileSync(draftFile(date), JSON.stringify(draft) + "\n");
  }
  const book = clueBook();
  const grid = draft.grid;
  const pattern = grid.replace(/[a-z]/g, ".");
  const S = slots(pattern);
  // Clues this answer was given within REPEAT_DAYS days either side.
  const usedClues = new Map();
  for (const p of history) if (p.date !== date && Math.abs(daysBetween(p.date, date)) < REPEAT_DAYS) for (const e of entries(p)) {
    if (!usedClues.has(e.answer)) usedClues.set(e.answer, new Set());
    usedClues.get(e.answer).add(e.clue);
  }
  const r = rng(`${keyFor("crossword", date)}:clues`);
  const missing = [];
  const pick = answer => {
    const all = book.get(answer)?.clues || [];
    if (!all.length) { missing.push(answer); return ""; }
    const fresh = all.filter(c => !usedClues.get(answer)?.has(c));
    if (!fresh.length) { missing.push(`${answer} (all ${all.length} clues used in the last ${REPEAT_DAYS} days)`); return ""; }
    return fresh[Math.floor(r() * fresh.length)];
  };
  const entry = s => ({ n: s.n, r: s.r, c: s.c, len: s.len, clue: pick(s.cells.map(i => grid[i]).join("")) });
  const p = {
    v: 1, game: "crossword", date, number: puzzleNumber(date), size: N, pattern,
    s: encode(grid, keyFor("crossword", date)),
    across: S.filter(s => s.dir === "A").map(entry), down: S.filter(s => s.dir === "D").map(entry),
  };
  if (missing.length) throw new NeedsClues(date, [...new Set(missing)]);
  return p;
}

// ---------- validation ----------

export function validate(p, { date, words, book = clueBook(), fill = fillList(), ban = banned() }) {
  const errors = [];
  if (p.game !== "crossword") errors.push("game is not crossword");
  if (p.date !== date) errors.push(`date ${p.date} does not match the file name ${date}`);
  if (p.number !== puzzleNumber(date)) errors.push(`number ${p.number} should be ${puzzleNumber(date)}`);
  if (p.size !== N || typeof p.pattern !== "string" || !/^[#.]{225}$/.test(p.pattern)) return [...errors, "pattern must be 225 squares of # and ."];
  errors.push(...checkPattern(p.pattern));
  const sol = typeof p.s === "string" ? solutionOf(p) : "";
  if (sol.length !== 225 || [...sol].some((ch, i) => (ch === "#") !== (p.pattern[i] === "#") || (ch !== "#" && !/[a-z]/.test(ch)))) return [...errors, "solution does not match the pattern"];
  // Numbering and entries must be exactly what the pattern gives.
  const S = slots(p.pattern);
  const want = d => S.filter(s => s.dir === d).map(s => `${s.n}:${s.r}:${s.c}:${s.len}`).join(" ");
  const have = list => (list || []).map(e => `${e.n}:${e.r}:${e.c}:${e.len}`).join(" ");
  if (want("A") !== have(p.across)) errors.push("across numbering or entries do not match the pattern");
  if (want("D") !== have(p.down)) errors.push("down numbering or entries do not match the pattern");
  if ((p.across?.length || 0) + (p.down?.length || 0) !== S.length) errors.push(`clue count ${(p.across?.length || 0) + (p.down?.length || 0)} does not match ${S.length} entries`);
  if (errors.length) return errors;
  const seen = new Set();
  for (const e of entries(p)) {
    const where = `${e.n}${e.dir === "A" ? " Across" : " Down"}`;
    if (!isGood(e.answer, { fill, book })) errors.push(`${where} ${e.answer.toUpperCase()} is not a common word or a clued entry`);
    if (ban.has(e.answer)) errors.push(`${where} ${e.answer.toUpperCase()} is banned`);
    if (words?.blockedSet.has(e.answer)) errors.push(`${where} ${e.answer.toUpperCase()} is on the blocklist`);
    if (seen.has(e.answer)) errors.push(`${e.answer.toUpperCase()} appears twice`);
    seen.add(e.answer);
    if (typeof e.clue !== "string" || !e.clue.trim()) errors.push(`${where} has no clue`);
    else {
      if (e.clue.length > 120) errors.push(`${where} clue is over 120 characters`);
      if (new RegExp(`\\b${e.answer}\\b`, "i").test(e.clue)) errors.push(`${where} clue contains its answer`);
    }
  }
  return errors;
}

export function validateSet(puzzles) {
  const errors = [];
  const sorted = puzzles.slice().sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach((p, i) => {
    const window = sorted.slice(0, i).filter(q => daysBetween(q.date, p.date) < REPEAT_DAYS);
    const prior = new Map();
    for (const q of window) for (const e of entries(q)) { if (!prior.has(e.answer)) prior.set(e.answer, []); prior.get(e.answer).push(e.clue); }
    for (const e of entries(p)) {
      const before = prior.get(e.answer) || [];
      if (before.length + 1 > MAX_USES) errors.push(`${p.date}: ${e.answer.toUpperCase()} used ${before.length + 1} times within ${REPEAT_DAYS} days`);
      if (before.includes(e.clue)) errors.push(`${p.date}: ${e.answer.toUpperCase()} repeats the clue "${e.clue}" within ${REPEAT_DAYS} days`);
    }
  });
  return errors;
}

// ---------- review file ----------

export function writeReview(root = ROOT, { missing = [] } = {}) {
  const dates = puzzleDates(root, "crossword");
  const book = clueBook();
  let md = `# Daily Crossword: clues and answers for proofreading\n\nGenerated by \`npm run games:generate\`. One section per date; edit clues in\n\`scripts/games/lexicon/crossword-clues.txt\` (or ban a word in \`crossword-banned.txt\` and delete its\ndraft in \`scripts/games/crossword-drafts/\`), then run \`npm run games:generate -- --game crossword --redo <date>\`.\n`;
  if (missing.length) {
    md += `\n## Waiting for clues\n\n${missing.map(m => `- **${m.date}**: ${m.words.map(w => w.toUpperCase()).join(", ")}`).join("\n")}\n`;
  }
  for (const d of dates) {
    const p = readPuzzle(root, "crossword", d);
    const es = entries(p);
    const show = e => `- **${e.n}.** ${e.clue} — ${(book.get(e.answer)?.display || e.answer.toUpperCase())}`;
    md += `\n## ${d} (#${p.number})\n\n**Across**\n\n${es.filter(e => e.dir === "A").map(show).join("\n")}\n\n**Down**\n\n${es.filter(e => e.dir === "D").map(show).join("\n")}\n`;
  }
  fs.writeFileSync(path.join(root, "scripts/games/crossword-review.md"), md);
}
export function afterGenerate() { writeReview(); }
