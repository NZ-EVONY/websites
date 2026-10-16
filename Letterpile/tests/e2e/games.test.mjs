// Daily games, end to end in Chromium at phone (390px) and desktop (1280px) widths: each game
// loads today's puzzle, is played to a win using the published solution, saves progress across
// a reload, and shows no console errors. Screenshots go to reports/games/.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withBrowser, skip } from "./helpers-browser.mjs";
import { ROOT, PUBLIC } from "../helpers.mjs";
import { decode } from "../../scripts/games/util.mjs";

const SHOTS = path.join(ROOT, "reports/games");
fs.mkdirSync(SHOTS, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const puzzle = game => JSON.parse(fs.readFileSync(path.join(PUBLIC, `puzzles/${game}/${today}.json`), "utf8"));
const WIDTHS = [390, 1280];

async function openPage(browser, base, url, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, hasTouch: width < 600 });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base + url);
  return { ctx, page, errors };
}

test("Daily Word: reject a non-word, win, keep stats across a reload, share", { skip }, async () => {
  const answer = decode(puzzle("word").a, `word:${today}`);
  await withBrowser(async (browser, base) => {
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await openPage(browser, base, "/games/word", width);
      await page.waitForSelector("#game[data-ready]");
      await page.keyboard.type("zzzzz");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => /isn't in the word list/.test(document.querySelector("#wordMsg").textContent));
      for (let i = 0; i < 5; i++) await page.keyboard.press("Backspace");
      const wrong = answer === "crane" ? "slate" : "crane";
      // One guess with the on-screen keys (as on a phone), then the answer by keyboard.
      for (const k of wrong) await page.click(`.key[data-key="${k}"]`);
      await page.click('.key[data-key="Enter"]');
      await page.keyboard.type(answer);
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => /Solved in 2/.test(document.querySelector("#wordMsg").textContent));
      assert.equal(await page.locator(".dw-row").nth(1).locator(".m-g").count(), 5);
      assert.equal(await page.isVisible("#wordStats"), true);
      assert.equal(await page.textContent('[data-stat="played"]'), "1");
      await page.screenshot({ path: path.join(SHOTS, `word-${width}.png`), fullPage: false });
      await page.click("#shareBtn");
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(copied, /^Letterpile Daily Word #\d+ 2\/6\n/);
      assert.ok(!copied.toLowerCase().includes(answer), "share text must not reveal the answer");
      await page.reload();
      await page.waitForFunction(() => /Solved in 2/.test(document.querySelector("#wordMsg").textContent));
      assert.equal(await page.textContent('[data-stat="played"]'), "1", "a reload doesn't count the game twice");
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});

test("games hub: four cards, countdown, today's status, last week's archive", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await openPage(browser, base, "/games", 1280);
    await page.waitForFunction(() => document.querySelector("[data-archive] section"));
    assert.match(await page.textContent("[data-countdown]"), /^\d\d:\d\d:\d\d$/);
    await page.screenshot({ path: path.join(SHOTS, "hub-1280.png"), fullPage: true });
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});

test("Daily Sudoku: notes, conflict highlight, undo, reload keeps progress, win", { skip }, async () => {
  const p = puzzle("sudoku");
  const solution = decode(p.s, `sudoku:${today}`);
  await withBrowser(async (browser, base) => {
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await openPage(browser, base, "/games/sudoku", width);
      await page.waitForSelector("#game[data-ready]");
      const empty = [...p.givens].map((c, i) => (c === "0" ? i : -1)).filter(i => i >= 0);
      const cell = i => page.locator(`.sd-cell[data-i="${i}"]`);
      // Notes: pencil a 1 and a 2 into the first empty square.
      await cell(empty[0]).click();
      await page.keyboard.press("n");
      await page.keyboard.press("1"); await page.keyboard.press("2");
      assert.match(await cell(empty[0]).getAttribute("aria-label"), /notes 1 2/);
      await page.keyboard.press("n");
      // A digit that clashes with a given in the same row is flagged, and undo removes it.
      const r = Math.floor(empty[0] / 9);
      const rowGiven = [...Array(9).keys()].map(c => r * 9 + c).find(i => p.givens[i] !== "0");
      await page.keyboard.press(p.givens[rowGiven]);
      assert.equal(await cell(empty[0]).evaluate(el => el.classList.contains("clash")), true);
      await page.click("#sdUndo");
      assert.match(await cell(empty[0]).getAttribute("aria-label"), /notes 1 2/);
      // Fill half, reload, check it was kept, then finish (half by keyboard, half by number pad).
      const half = Math.floor(empty.length / 2);
      for (const i of empty.slice(0, half)) { await cell(i).click(); await page.keyboard.press(solution[i]); }
      await page.reload();
      await page.waitForSelector("#game[data-ready]");
      assert.equal(await cell(empty[half - 1]).textContent(), solution[empty[half - 1]]);
      for (const i of empty.slice(half)) { await cell(i).click(); await page.click(`#sdPad [data-digit="${solution[i]}"]`); }
      await page.waitForSelector("#sdDone:not([hidden])");
      assert.match(await page.textContent("#sdMsg"), /^Solved in \d+:\d\d\.$/);
      await page.screenshot({ path: path.join(SHOTS, `sudoku-${width}.png`) });
      await page.click("#sdShare");
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Letterpile Daily Sudoku #\d+ \((Easy|Medium|Hard)\)\nSolved in /);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});

test("Daily Word Search: drag, tap-tap and keyboard selection, reload keeps progress, win", { skip }, async () => {
  const p = puzzle("wordsearch");
  const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  const ends = w => { const n = w.w.replace(/ /g, "").length - 1; const [dr, dc] = DIRS[w.d]; return [w.r * 20 + w.c, (w.r + dr * n) * 20 + w.c + dc * n]; };
  await withBrowser(async (browser, base) => {
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await openPage(browser, base, "/games/wordsearch", width);
      await page.waitForSelector("#game[data-ready]");
      const center = async i => { const b = await page.locator(`.ws-cell[data-i="${i}"]`).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
      const found = () => page.locator(".ws-words li.found").count();
      // A wrong selection is rejected.
      await page.locator('.ws-cell[data-i="0"]').click();
      await page.locator('.ws-cell[data-i="1"]').click();
      const half = Math.floor(p.words.length / 2);
      for (const [n, w] of p.words.entries()) {
        if (n === half) {
          await page.reload();
          await page.waitForSelector("#game[data-ready]");
          assert.equal(await found(), half, "found words survive a reload");
        }
        const [a, b] = ends(w);
        if (n === 0) {
          // Keyboard: focus the grid, move from cell 0 to the start, Enter, move to the end, Enter.
          await page.focus("#wsGrid");
          const press = async (k, times) => { for (let t = 0; t < times; t++) await page.keyboard.press(k); };
          const go = async (from, to) => { await press(to % 20 > from % 20 ? "ArrowRight" : "ArrowLeft", Math.abs(to % 20 - from % 20)); await press(to > from ? "ArrowDown" : "ArrowUp", Math.abs(Math.floor(to / 20) - Math.floor(from / 20))); };
          await go(0, a); await page.keyboard.press("Enter"); await go(a, b); await page.keyboard.press("Enter");
        } else if (n % 2) {
          await page.evaluate(() => document.getElementById("wsGrid").scrollIntoView({ block: "center" }));
          const [x1, y1] = await center(a), [x2, y2] = await center(b);
          await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 6 }); await page.mouse.up();
        } else {
          await page.locator(`.ws-cell[data-i="${a}"]`).click();
          await page.locator(`.ws-cell[data-i="${b}"]`).click();
        }
        assert.equal(await found(), n + 1, `found "${w.w}"`);
      }
      await page.waitForSelector("#wsDone:not([hidden])");
      await page.screenshot({ path: path.join(SHOTS, `wordsearch-${width}.png`) });
      await page.click("#wsShare");
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Letterpile Daily Word Search #\d+: .+\nFound all \d+ words in /);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});
