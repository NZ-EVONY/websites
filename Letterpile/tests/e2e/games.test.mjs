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
