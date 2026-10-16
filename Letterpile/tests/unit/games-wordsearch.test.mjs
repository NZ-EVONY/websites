// Daily Word Search: theme lists, the validator and every published puzzle.
import test from "node:test";
import assert from "node:assert/strict";
import { wordData } from "../../scripts/wordstats.mjs";
import * as ws from "../../scripts/games/wordsearch.mjs";
import { validateGame } from "../../scripts/games/lib.mjs";
import { ROOT } from "../helpers.mjs";

const words = wordData();
const p0 = ws.generate("2026-10-16", { history: [], words });
const ok = p => ws.validate(p, { date: "2026-10-16", words });
const setCells = (grid, cells, letters) => { const g = [...grid]; cells.forEach((i, k) => { g[i] = letters[k]; }); return g.join(""); };
// Cells not used by any placed word (filler).
const used = new Set(p0.words.flatMap(ws.cellsOf));
const filler = [...Array(400).keys()].filter(i => !used.has(i));

test("theme lists: enough themes for the repeat gap, each valid", () => {
  const all = ws.themes();
  assert.ok(all.length > ws.THEME_GAP, `${all.length} themes for a ${ws.THEME_GAP}-day gap`);
  for (const t of all) assert.deepEqual(ws.checkTheme(t, words), [], t.name);
});

test("every published Daily Word Search is valid and no theme repeats within the gap", () => {
  const { dates, errors } = validateGame(ROOT, "wordsearch", words);
  assert.ok(dates.length >= 35, `${dates.length} days`);
  assert.deepEqual(errors, []);
});

test("a fresh puzzle passes: 25-30 words, all 8 directions, each word exactly once", () => {
  assert.deepEqual(ok(p0), []);
  assert.ok(p0.words.length >= 25 && p0.words.length <= 30);
  assert.equal(new Set(p0.words.map(w => w.d)).size, 8);
});

test("validator catches a word hidden twice", () => {
  const w = p0.words.find(x => x.w.replace(/ /g, "").length <= 6);
  const letters = w.w.replace(/ /g, "").toLowerCase();
  // Find a run of free filler cells along a row to write a second copy into.
  for (let r = 0; r < 20; r++) for (let c = 0; c + letters.length <= 20; c++) {
    const cells = [...Array(letters.length).keys()].map(k => r * 20 + c + k);
    if (cells.every(i => !used.has(i))) {
      assert.match(ok({ ...p0, grid: setCells(p0.grid, cells, letters) }).join(), new RegExp(`"${w.w}" appears 2 times`));
      return;
    }
  }
  assert.fail("no free run of cells found for the test");
});

test("validator catches a blocklisted word made by filler letters", () => {
  const bad = words.blocked.find(b => b.length === 4);
  for (let r = 0; r < 20; r++) for (let c = 0; c + 4 <= 20; c++) {
    const cells = [0, 1, 2, 3].map(k => r * 20 + c + k);
    if (cells.every(i => filler.includes(i))) {
      assert.match(ok({ ...p0, grid: setCells(p0.grid, cells, bad) }).join(), /blocklisted word/);
      return;
    }
  }
  assert.fail("no free run of cells found for the test");
});

test("validator catches a misplaced word, too few words and a repeated theme", () => {
  assert.match(ok({ ...p0, words: p0.words.map((w, i) => (i ? w : { ...w, r: (w.r + 1) % 20 })) }).join(), /not at its recorded position/);
  assert.match(ok({ ...p0, words: p0.words.slice(0, 20) }).join(), /20 words/);
  const later = { ...p0, date: "2026-11-01" };
  assert.match(ws.validateSet([p0, later]).join(), /repeats on 2026-11-01/);
});
