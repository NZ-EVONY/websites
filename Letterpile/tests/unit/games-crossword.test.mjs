// Daily Crossword: the pattern rules, numbering, the validator and every published puzzle.
import test from "node:test";
import assert from "node:assert/strict";
import { wordData } from "../../scripts/wordstats.mjs";
import * as cw from "../../scripts/games/crossword.mjs";
import { N, slots, checkPattern, makePattern } from "../../scripts/games/crossword-grid.mjs";
import { validateGame } from "../../scripts/games/lib.mjs";
import { puzzleDates, readPuzzle, rng, encode } from "../../scripts/games/util.mjs";
import { ROOT } from "../helpers.mjs";

const words = wordData();
const set = (g, i, ch) => g.slice(0, i) + ch + g.slice(i + 1);
const pattern = makePattern(rng("test-pattern"));

test("generated patterns follow the daily rules", () => {
  for (let k = 0; k < 5; k++) {
    const p = makePattern(rng(`rules${k}`));
    assert.deepEqual(checkPattern(p), []);
    const n = slots(p).length;
    assert.ok(n >= 70 && n <= 78, `${n} entries`);
  }
});

test("pattern checker catches asymmetry, short entries, unchecked squares and islands", () => {
  // One extra black square breaks the symmetry.
  const open = [...pattern].findIndex((ch, i) => ch === "." && pattern[N * N - 1 - i] === "." && i !== 112);
  assert.match(checkPattern(set(pattern, open, "#")).join(), /not rotationally symmetric/);
  // A row of black squares with a two-letter gap: short entries / unchecked squares.
  let g = ".".repeat(N * N);
  for (const c of [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14]) { g = set(g, 7 * N + c, "#"); }
  assert.match(checkPattern(g).join(), /shorter than 3 letters/);
  // A wall of black squares across the middle splits the grid in two.
  let h = ".".repeat(N * N);
  for (let c = 0; c < N; c++) h = set(h, 7 * N + c, "#");
  assert.match(checkPattern(h).join(), /not all connected/);
});

test("numbering: every entry starts after a black square or the edge, numbered in reading order", () => {
  const s = slots(pattern);
  let last = 0;
  for (const e of s) {
    assert.ok(e.n >= last, "numbers never go down");
    last = e.n;
    if (e.dir === "A") assert.ok(e.c === 0 || pattern[e.r * N + e.c - 1] === "#");
    else assert.ok(e.r === 0 || pattern[(e.r - 1) * N + e.c] === "#");
    assert.ok(e.len >= 3);
  }
  // Every white square is in exactly one across and one down entry.
  const count = new Map();
  for (const e of s) for (const i of e.cells) count.set(i, (count.get(i) || 0) + 1);
  for (let i = 0; i < N * N; i++) if (pattern[i] !== "#") assert.equal(count.get(i), 2, `square ${i}`);
});

const dates = puzzleDates(ROOT, "crossword");

test("every published Daily Crossword is valid; answers and clues don't repeat too often", { skip: dates.length ? false : "no crosswords published yet" }, () => {
  const { errors } = validateGame(ROOT, "crossword", words);
  assert.deepEqual(errors, []);
});

test("validator rejects a bad numbering, a missing clue, a clue giving away its answer and a repeat", { skip: dates.length ? false : "no crosswords published yet" }, () => {
  const p = readPuzzle(ROOT, "crossword", dates[0]);
  const ok = q => cw.validate(q, { date: dates[0], words });
  assert.deepEqual(ok(p), []);
  assert.match(ok({ ...p, across: p.across.slice(1) }).join(), /across numbering|clue count/);
  assert.match(ok({ ...p, across: p.across.map((e, i) => (i ? e : { ...e, clue: "" })) }).join(), /has no clue/);
  const first = cw.entries(p)[0];
  assert.match(ok({ ...p, across: p.across.map((e, i) => (i ? e : { ...e, clue: `Rhymes with ${first.answer}` })) }).join(), /contains its answer/);
  // Same puzzle a week later: every answer repeats its clue.
  const later = { ...p, date: "2099-01-08", number: p.number + 7, s: encode(cw.solutionOf(p), "crossword:2099-01-08") };
  const earlier = { ...p, date: "2099-01-01", s: encode(cw.solutionOf(p), "crossword:2099-01-01") };
  assert.match(cw.validateSet([earlier, later]).join(), /repeats the clue/);
});

test("clue file: every answer has 2+ clues, none repeated, none containing the answer", () => {
  const book = cw.clueBook();
  assert.ok(book.size > 0);
  for (const [answer, { clues }] of book) {
    assert.ok(/^[a-z]+$/.test(answer), `"${answer}" must be letters only`);
    assert.ok(clues.length >= 2, `${answer} has only ${clues.length} clue`);
    assert.equal(new Set(clues).size, clues.length, `${answer} repeats a clue`);
    for (const c of clues) {
      assert.ok(!new RegExp(`\\b${answer}\\b`, "i").test(c), `${answer}: clue "${c}" contains the answer`);
      assert.ok(c.length <= 120, `${answer}: clue too long`);
    }
    assert.ok(!cw.banned().has(answer), `${answer} is both clued and banned`);
  }
});

// ---------- generator: automatic clues, quality gate and 60-day rules ----------

test("automatic clue gate rejects answers, stems, long or rude clues", () => {
  assert.equal(cw.autoClueOk("glide", "Soar", { words }), true);
  assert.equal(cw.autoClueOk("glide", "Glide along", { words }), false, "contains the answer");
  assert.equal(cw.autoClueOk("running", "Run", { words }), false, "the answer's stem");
  assert.equal(cw.autoClueOk("walked", "Walking about", { base: "walk", words }), false, "the base word");
  assert.equal(cw.autoClueOk("glide", "A very long clue that goes on and on and on", { words }), false, "over 7 words");
  assert.equal(cw.autoClueOk("glide", "soar", { words }), false, "must start with a capital");
  const rude = [...words.blockedSet].find(w => /^[a-z]{4,}$/.test(w));
  assert.equal(cw.autoClueOk("glide", `Big ${rude}`, { words }), false, "blocklisted word");
});

test("automatic clue file: every clue passes the gate; no banned, blocklisted or hand-clued answer", () => {
  const auto = cw.autoBook(), book = cw.clueBook(), ban = cw.banned();
  assert.ok(auto.size > 20000, `${auto.size} words`);
  for (const [answer, clues] of auto) {
    assert.ok(/^[a-z]+$/.test(answer), answer);
    assert.ok(!ban.has(answer) && !words.blockedSet.has(answer), `${answer} is banned or blocklisted`);
    assert.ok(clues.length >= 1 && new Set(clues).size === clues.length, `${answer} clues`);
    for (const c of clues) assert.ok(cw.autoClueOk(answer, c, { words }), `${answer}: "${c}" fails the gate`);
  }
  // Hand-written clues take priority, so the auto file never repeats a hand-clued answer.
  for (const a of book.keys()) assert.ok(!auto.has(a) || !book.get(a).clues.length, `${a} is in both files`);
});

test("cluesOf puts hand-written clues before automatic ones", () => {
  const [a] = [...cw.clueBook().keys()];
  assert.deepEqual(cw.cluesOf(a).slice(0, cw.clueBook().get(a).clues.length), cw.clueBook().get(a).clues);
  const [b, clues] = [...cw.autoBook()][0];
  assert.deepEqual(cw.cluesOf(b), clues);
  assert.equal(cw.isAutoClue(b, clues[0]), true);
});

test("validator: a clue in neither clue file is rejected", { skip: dates.length ? false : "no crosswords published yet" }, () => {
  const p = readPuzzle(ROOT, "crossword", dates.at(-1));
  const bad = { ...p, across: p.across.map((e, i) => (i ? e : { ...e, clue: "Zzzz made up clue" })) };
  assert.match(cw.validate(bad, { date: p.date, words }).join(), /not in either clue file/);
});

test("60-day rules: a long answer or a repeated clue within 60 days is rejected (from the generator start date)", { skip: dates.length ? false : "no crosswords published yet" }, () => {
  const p = readPuzzle(ROOT, "crossword", dates[0]);
  const at = d => ({ ...p, date: d, s: encode(cw.solutionOf(p), `crossword:${d}`) });
  // 50 days apart: past the 35-day window, inside the 60-day one.
  const errs = cw.validateSet([at("2099-01-01"), at("2099-02-20")]).join("\n");
  assert.match(errs, /repeats the clue .* within 60 days/);
  if (cw.entries(p).some(e => e.answer.length >= cw.LONG_LEN)) assert.match(errs, /letters\) used again within 60 days/);
  // 61 days apart: fine.
  assert.deepEqual(cw.validateSet([at("2099-01-01"), at("2099-03-03")]), []);
  assert.ok(cw.LONG_RULES_FROM <= "2026-10-24");
});

test("generation is deterministic: the same date and pattern number give the same grid", () => {
  const ctx = cw.fillContext("2099-06-01", { words, uses: Object.assign(new Map(), { long: new Map() }) });
  const a = makePattern(rng("crossword:2099-06-01:0")), b = makePattern(rng("crossword:2099-06-01:0"));
  assert.equal(a, b);
  assert.ok(ctx.goodSet.size > 10000);
});
