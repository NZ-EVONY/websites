// Phase 4 and 5 word tools, end to end in Chromium at phone width: each tool runs a search through the
// page's own form and shows the expected result, with no console errors. Expected values come from
// the same search code run in Node (src/assets/js/wordtools.js) and the build's data.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { withBrowser, skip } from "./helpers-browser.mjs";
import { ROOT } from "../helpers.mjs";

const SHOTS = path.join(ROOT, "reports/tools");
fs.mkdirSync(SHOTS, { recursive: true });

async function open(browser, base, url) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base + url);
  return { ctx, page, errors };
}
const done = async (page, sel = "#results .summary") => page.waitForSelector(sel, { timeout: 30000 });

test("word tools: each one searches and shows its answer", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const checks = [
      ["hive", "/letter-hive-solver", async page => {
        await page.fill("#outer", "mchine"); await page.fill("#center", "a"); await page.click("#form button[type=submit]");
        await done(page);
        assert.match(await page.textContent("#results .summary"), /2 pangrams|\d+ pangrams/);
        assert.ok(await page.isVisible('#results .word.bingo[data-word="machine"]'), "MACHINE is a pangram");
        await page.selectOption("#start", "c");
        assert.equal(await page.locator('#results .word:not([data-word^="c"])').count(), 0, "starts-with filter");
      }],
      ["grid", "/word-grid-solver", async page => {
        await page.fill("#quick", "TRAPSENILODCQART"); await page.click("#form button[type=submit]");
        await done(page);
        assert.equal(await page.inputValue("#grid input >> nth=12"), "Qu");
        await page.locator('#results .word').first().click();
        assert.ok((await page.locator("#grid input.on").count()) >= 3, "path lights up");
        assert.match(await page.textContent("#path"), /→/);
      }],
      ["box", "/letter-box-solver", async page => {
        for (const [id, v] of [["#top", "tch"], ["#right", "nai"], ["#bottom", "ole"], ["#left", "pry"]]) await page.fill(id, v);
        await page.click("#form button[type=submit]");
        await done(page);
        assert.ok(await page.locator(".wt-pairs li").count() > 0, "two-word solutions");
        assert.equal(await page.locator('#results .word[data-word="chat"]').count(), 0, "CHAT breaks the side rule");
      }],
      ["ladder", "/word-ladder-solver", async page => {
        await page.fill("#from", "cold"); await page.fill("#to", "warm"); await page.click("#form button[type=submit]");
        await done(page);
        assert.deepEqual(await page.locator(".wt-ladder .word").evaluateAll(b => b.map(x => x.dataset.word)), ["cold", "cord", "word", "ward", "warm"]);
      }],
      ["hangman", "/hangman-solver", async page => {
        await page.fill("#pattern", "_A__E_"); await page.fill("#wrong", "sto"); await page.click("#form button[type=submit]");
        await done(page);
        assert.match(await page.textContent(".wt-bars li"), /^R/);
        const ws = await page.locator("#results .words .word").evaluateAll(b => b.map(x => x.dataset.word));
        assert.ok(ws.every(w => /^[^aesto]a[^aesto]{2}e[^aesto]$/.test(w)), "every word fits the pattern and misses");
      }],
      ["cryptogram", "/cryptogram-solver", async page => {
        await page.fill("#cipher", "AOL LHYSF IPYK JHAJOLZ AOL DVYT IBA AOL ZLJVUK TVBZL NLAZ AOL JOLLZL");
        await page.click("#suggest");
        await done(page);
        assert.match(await page.textContent("#plain"), /^THE EARLY BIRD CATCHES THE/);
        await page.fill('#key input[data-c="b"]', "T");
        assert.ok(await page.locator("#key input.clash").count() > 0, "two letters mapped to T are flagged");
      }],
      ["multi", "/multi-board-solver", async page => {
        await page.fill("#guess", "crane"); await page.click("#addForm button[type=submit]");
        await page.waitForSelector('[data-count="0"]:not(:empty)', { timeout: 30000 });
        assert.equal(await page.locator(".wt-board").count(), 4);
        for (let i = 0; i < 5; i++) { const t = page.locator(`.wtile[data-b="1"][data-g="0"][data-i="${i}"]`); await t.click(); await page.locator(`.wtile[data-b="1"][data-g="0"][data-i="${i}"]`).click(); }
        await page.waitForSelector('[data-count="1"]:text("solved")', { timeout: 30000 });
        await done(page, "#summary .summary");
      }],
      ["rhymes", "/rhyming-words", async page => {
        await page.fill("#word", "rhyme"); await page.click("#form button[type=submit]");
        await done(page);
        assert.ok(await page.isVisible('#results .word[data-word="time"]'));
      }],
      ["syllables", "/syllable-counter", async page => {
        await page.fill("#text", "letters in a pile\neach word that you take away\nlets the others fall");
        await done(page);
        assert.deepEqual(await page.locator(".wt-total").allTextContents(), ["5", "7", "5"]);
      }],
    ];
    for (const [name, url, run] of checks) {
      const { ctx, page, errors } = await open(browser, base, url);
      await run(page);
      await page.screenshot({ path: path.join(SHOTS, `${name}-390.png`), fullPage: false });
      assert.deepEqual(errors, [], `${name}: console errors`);
      await ctx.close();
    }
  });
});

test("word tools: results survive a reload from the address bar", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await open(browser, base, "/word-ladder-solver?from=cat&to=dog");
    await done(page);
    assert.equal(await page.locator(".wt-ladder li").count(), 4);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});

test("board solver: tiles typed on the board, best play previewed and placed", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await open(browser, base, "/board-solver");
    await page.click('.bs-cell[data-i="110"]');
    await page.keyboard.type("quiz");
    await page.fill("#rack", "aeirst?");
    await page.click("#form button[type=submit]");
    await page.waitForSelector(".bs-play", { timeout: 30000 });
    assert.match((await page.textContent(".bs-play")).replace(/\s+/g, " "), /QUIZMASTER 8F across 84/);
    assert.equal(await page.locator(".bs-cell.new").count(), 6);
    await page.click("#playIt");
    assert.equal(await page.inputValue("#rack"), "I");
    assert.equal(await page.locator(".bs-cell.blank").count(), 1, "the blank M stays marked");
    await page.screenshot({ path: path.join(SHOTS, "board-390.png") });
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});

test("hooks: the word dialog lists front and back hooks", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await open(browser, base, "/?letters=cat");
    await page.click('#results .word[data-word="cat"]', { timeout: 30000 });
    await page.waitForSelector("#defineHooks .hooks", { timeout: 30000 });
    const words = await page.locator("#defineHooks .word").evaluateAll(b => b.map(x => x.dataset.word));
    assert.ok(words.includes("scat") && words.includes("cats"), words.join(","));
    await page.click('#defineHooks .word[data-word="scat"]');
    assert.equal(await page.textContent("#defineWord"), "scat", "a hook opens its own word");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});

test("scan tiles: a photo of a rack is read in the browser and checked before use", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const shot = await browser.newPage({ viewport: { width: 900, height: 300 } });
    await shot.setContent(`<body style="margin:0;background:#3b6e4a;display:flex;gap:14px;padding:40px">${[..."RETAINS"].map(c => `<div style="width:90px;height:90px;background:#f3dfb4;border-radius:8px;display:grid;place-items:center;font:800 60px Arial;color:#222;position:relative">${c}<sub style="position:absolute;right:8px;bottom:6px;font:700 18px Arial">1</sub></div>`).join("")}</body>`);
    const png = path.join(SHOTS, "scan-input.png");
    await shot.screenshot({ path: png });
    const { ctx, page, errors } = await open(browser, base, "/scrabble-word-finder");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click(".scan-btn")]);
    await chooser.setFiles(png);
    await page.waitForFunction(() => /Found|No letters|instead/.test(document.querySelector(".scan-status").textContent), null, { timeout: 90000 });
    assert.equal(await page.inputValue(".scan-out"), "RETAINS");
    await page.click(".scan-use");
    assert.equal(await page.inputValue("#rack"), "RETAINS");
    // Tesseract logs "Estimating resolution" through console.error; that's not a page error.
    assert.deepEqual(errors.filter(e => !/Estimating resolution/.test(e)), []);
    await ctx.close();
  });
});

test("word lookup: any word is filled in; a word with a page goes to it; the word window links here", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const { ctx, page, errors } = await open(browser, base, "/word?w=quixotic");
    await page.waitForSelector("#result h2", { timeout: 30000 });
    assert.equal(await page.textContent("#result h2"), "QUIXOTIC");
    assert.ok(await page.locator('#result .word[data-word="quixotically"]').count() > 0, "longer words containing it");
    assert.equal(await page.getAttribute('meta[name="robots"]', "content"), "noindex, follow");
    await page.goto(base + "/word?w=planet");
    await page.waitForURL(/\/word\/planet$/);
    assert.match(await page.textContent("h1"), /PLANET/);
    await page.goto(base + "/?letters=cat");
    await page.click('#results .word[data-word="cat"]', { timeout: 30000 });
    assert.equal(await page.getAttribute("#definePage", "href"), "/word?w=cat");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});
