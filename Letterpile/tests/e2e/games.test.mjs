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
      await page.click("#wordStats [data-share-copy]");
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
      await page.click("#sdDone [data-share-copy]");
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
      await page.click("#wsDone [data-share-copy]");
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Letterpile Daily Word Search #\d+: .+\nFound all \d+ words in /);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});

test("Daily Crossword: type, toggle direction, check, reveal, reload keeps progress, win", { skip }, async () => {
  const p = puzzle("crossword");
  const sol = decode(p.s, `crossword:${today}`);
  await withBrowser(async (browser, base) => {
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await openPage(browser, base, "/games/crossword", width);
      await page.waitForSelector("#game[data-ready]");
      const a1 = p.across[0], d1 = p.down[0];
      const cellOf = i => page.locator(`.cw-cell[data-i="${i}"]`);
      // Type 1-Across with one deliberate mistake, then Check the word.
      await page.click(`.cw-clues li[data-k="A${a1.n}"]`);
      const ans = [...Array(a1.len).keys()].map(k => sol[a1.r * 15 + a1.c + k]);
      const wrong = ans.map((ch, k) => (k === 0 ? (ch === "z" ? "y" : "z") : ch)).join("");
      await page.keyboard.type(wrong);
      await page.click(".cw-menu:nth-of-type(1) summary");
      await page.click('[data-act="check-word"]');
      assert.equal(await cellOf(a1.r * 15 + a1.c).evaluate(el => el.classList.contains("bad")), true, "wrong letter marked");
      // Fix it; clicking the same square again switches to Down.
      await cellOf(a1.r * 15 + a1.c).click();
      await cellOf(a1.r * 15 + a1.c).click();
      assert.match(await page.textContent("#cwClue b"), /Down|Across/);
      await page.keyboard.press("Backspace");
      await page.keyboard.type(ans[0]);
      // Reveal one letter of 1-Down's last square.
      const last = (d1.r + d1.len - 1) * 15 + d1.c;
      await cellOf(last).click();
      await page.click(".cw-menu:nth-of-type(2) summary");
      await page.click('[data-act="reveal-cell"]');
      assert.equal(await cellOf(last).evaluate(el => el.classList.contains("rev")), true);
      await page.reload();
      await page.waitForSelector("#game[data-ready]");
      assert.equal((await cellOf(a1.r * 15 + a1.c + 1).textContent()).slice(-1).toLowerCase(), ans[1], "letters survive a reload");
      // Fill every across entry by clicking its clue and typing the answer.
      for (const e of p.across) {
        await page.click(`.cw-clues li[data-k="A${e.n}"]`);
        await page.click(`.cw-cell[data-i="${e.r * 15 + e.c}"]`);
        if ((await page.textContent("#cwClue b")).includes("Down")) await page.keyboard.press(" ");
        await page.keyboard.type([...Array(e.len).keys()].map(k => sol[e.r * 15 + e.c + k]).join(""));
      }
      await page.waitForSelector("#cwDone:not([hidden])");
      assert.match(await page.textContent("#cwMsg"), /^Solved in \d+:\d\d with 1 revealed square\.$/);
      await page.screenshot({ path: path.join(SHOTS, `crossword-${width}.png`) });
      await page.click("#cwDone [data-share-copy]");
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^Letterpile Daily Crossword #\d+\nSolved in .*\(1 squares revealed\)/);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});

test("Daily Word hints: nothing shown until asked; the last button shows today's answer", { skip }, async () => {
  const answer = decode(puzzle("word").a, `word:${today}`);
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await openPage(browser, base, "/games/word/hints", 390);
    await page.waitForSelector("#game[data-ready]");
    assert.ok(!(await page.innerText("main")).toUpperCase().includes(`IS ${answer.toUpperCase()}`), "answer hidden at first");
    assert.equal(await page.locator(".hint-text:not([hidden])").count(), 0);
    await page.click(".hint-list li:first-child button");
    assert.equal(await page.locator(".hint-text:not([hidden])").count(), 1);
    await page.click(".hint-list li:last-child button");
    assert.match(await page.textContent(".hint-list li:last-child .hint-text"), new RegExp(answer, "i"));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});

test("crossword card: shown when today has a crossword, hidden (on the hub and home page) when not", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    for (const url of ["/games", "/"]) {
      const { ctx, page, errors } = await openPage(browser, base, url, 1280);
      await page.waitForFunction(() => !document.querySelector('[data-game-card="crossword"]').hidden);
      await ctx.close();
      // Same page with a manifest that has no crossword dates.
      const c2 = await browser.newContext();
      const p2 = await c2.newPage();
      await p2.route("**/puzzles/manifest.json", async route => {
        const r = await route.fetch(); const m = await r.json(); m.games.crossword = [];
        await route.fulfill({ response: r, body: JSON.stringify(m) });
      });
      await p2.goto(base + url);
      await p2.waitForTimeout(800);
      assert.equal(await p2.locator('[data-game-card="crossword"]').isVisible(), false, `${url}: crossword card hidden`);
      assert.equal(await p2.locator('[data-game-card="sudoku"]').isVisible(), true);
      await c2.close();
      assert.deepEqual(errors, []);
    }
  });
});

test("Letterpile: drag, tap and type words, undo, hint, reload keeps progress, clear the pile, share", { skip }, async () => {
  const p = puzzle("letterpile");
  const sol = JSON.parse(decode(p.s, `letterpile:${today}`));
  await withBrowser(async (browser, base) => {
    for (const width of WIDTHS) {
      const { ctx, page, errors } = await openPage(browser, base, "/games/letterpile", width);
      await page.waitForSelector("#game[data-ready]");
      if (await page.isVisible("#lpHow")) await page.click("#lpHowClose");
      await page.waitForFunction(() => window.WORD_DATA, null, { timeout: 30000 });
      const tile = (c, r) => page.locator(`.lp-tile[data-c="${c}"][data-r="${r}"]:not(.gone)`);
      const center = async ([c, r]) => { const b = await tile(c, r).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
      const settle = () => page.waitForTimeout(450); // tiles falling
      assert.equal(await page.locator(".lp-tile").count(), 25);
      // Keyboard: a letter that appears once on the board selects that tile; Escape clears.
      const letters = p.board.replace(/\//g, "");
      const once = [...letters].find(ch => letters.split(ch).length === 2);
      if (once) {
        await page.keyboard.press(once);
        assert.equal((await page.textContent("#lpWord")).toLowerCase(), once);
        await page.keyboard.press("Escape");
        assert.equal(await page.textContent("#lpWord"), "");
      }
      for (const [n, m] of sol.entries()) {
        if (n === 0) {
          // Drag through the first word (plays on release).
          await page.evaluate(() => document.getElementById("lpBoard").scrollIntoView({ block: "center" }));
          const pts = []; for (const cell of m.path) pts.push(await center(cell));
          await page.mouse.move(...pts[0]); await page.mouse.down();
          for (const pt of pts.slice(1)) await page.mouse.move(...pt, { steps: 4 });
          await page.mouse.up();
          await settle();
          // Undo it, use a hint, then play it again by tapping.
          await page.click("#lpUndo"); await settle();
          await page.click("#lpHint");
          assert.equal(await page.locator(".lp-tile.hint").count(), 1, "hint lights one tile");
        }
        if (n === 1) {
          await page.reload();
          await page.waitForSelector("#game[data-ready]");
          await page.waitForFunction(() => window.WORD_DATA, null, { timeout: 30000 });
          assert.equal(await page.locator(".lp-tile").count(), 25 - sol[0].word.length, "first word survives a reload");
        }
        for (const cell of m.path) await tile(...cell).click();
        assert.equal((await page.textContent("#lpWord")).toLowerCase(), m.word);
        await page.click("#lpSubmit");
        await settle();
      }
      await page.waitForSelector("#lpDone:not([hidden])");
      assert.match(await page.textContent("#lpDoneText"), new RegExp(`cleared the pile in ${sol.length} words`));
      await page.screenshot({ path: path.join(SHOTS, `letterpile-${width}.png`) });
      await page.click("#lpDone [data-share-copy]");
      const text = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(text, new RegExp(`^Letterpile #${p.number} — cleared in ${sol.length} words \\(par ${p.par}\\) · 1 hint\\n[🟨🟩🟦🟪]{${sol.length}}\\nletterpile\\.app/games/letterpile$`, "u"));
      assert.equal(await page.textContent('[data-stat="played"]'), "1");
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});

test("Letterpile Practice and Arcade: boards deal, a word plays, Arcade refills and scores", { skip }, async () => {
  const { createRequire } = await import("node:module");
  const LP = createRequire(import.meta.url)("../../src/assets/games/lp-engine.js");
  const { wordData } = await import("../../scripts/wordstats.mjs");
  const dict = LP.dictionary(wordData().clean.filter(w => w.length >= 3));
  await withBrowser(async (browser, base) => {
    for (const [url, n] of [["/games/letterpile/practice", 25], ["/games/letterpile/arcade", 36]]) {
      const { ctx, page, errors } = await openPage(browser, base, url, 390);
      await page.waitForSelector("#game[data-ready]");
      if (await page.isVisible("#lpHow")) await page.click("#lpHowClose");
      await page.waitForFunction(() => window.WORD_DATA, null, { timeout: 30000 });
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".lp-tile:not(.gone)").count(), n);
      const cols = await page.evaluate(N => { const c = Array.from({ length: N }, () => []); document.querySelectorAll(".lp-tile:not(.gone)").forEach(t => { c[+t.dataset.c][+t.dataset.r] = t.firstChild.textContent; }); return c; }, Math.sqrt(n));
      const m = LP.findWords(cols, dict).sort((a, b) => b.word.length - a.word.length)[0];
      for (const [c, r] of m.path) await page.locator(`.lp-tile[data-c="${c}"][data-r="${r}"]:not(.gone)`).click();
      await page.click("#lpSubmit");
      await page.waitForTimeout(600);
      assert.equal(await page.locator(".lp-played li").count(), 1, `${url}: word played`);
      if (n === 36) {
        assert.equal(await page.locator(".lp-tile:not(.gone)").count(), 36, "arcade refills");
        assert.match(await page.textContent("#lpScore"), /Score \d+ · 7 words left/);
      }
      await page.screenshot({ path: path.join(SHOTS, `letterpile-${n === 36 ? "arcade" : "practice"}-390.png`) });
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
});
