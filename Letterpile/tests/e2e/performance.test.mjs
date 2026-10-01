// Main-thread budget: no long task over 200 ms during the heaviest searches (lab, Chromium,
// no CPU throttling, as the brief specifies). Long tasks approximate INP; real INP needs field data.
import test from "node:test";
import assert from "node:assert/strict";
import { withBrowser, skip } from "./helpers-browser.mjs";

const HEAVY = ["/?letters=retainsdolphicm%3F%3F%3F", "/anagram-solver?q=retainsdolphicm", "/scrabble-word-finder?rack=retain%3F%3F&board=ing"];

async function longTasks(page, url) {
  await page.addInitScript(() => {
    window.__long = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(url);
  await page.waitForFunction(() => { const r = document.querySelector("#results"); return r && !r.querySelector(".loading") && /\d/.test(r.innerText); }, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  return page.evaluate(() => window.__long);
}

test("no main-thread long task over 200 ms during 15-letter searches", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    for (const u of HEAVY) {
      const ctx = await browser.newContext();
      const long = await longTasks(await ctx.newPage(), base + u);
      assert.ok(Math.max(0, ...long) <= 200, `${u}: long tasks ${long.map(Math.round).join(", ")} ms`);
      await ctx.close();
    }
  });
});

test("searches run in a Web Worker, and still work without one", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const workers = [];
    page.on("worker", w => workers.push(w.url()));
    await page.goto(base + "/?letters=listen");
    await page.waitForFunction(() => /words from LISTEN/.test(document.querySelector("#results").innerText));
    assert.ok(workers.some(u => /\/assets\/worker\.[0-9a-f]+\.js$/.test(u)), `worker started: ${workers.join(", ")}`);
    await ctx.close();

    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.addInitScript(() => { delete window.Worker; });
    await p2.goto(base + "/anagram-solver?q=listen");
    await p2.waitForFunction(() => /SILENT/.test(document.querySelector("#results").innerText));
    await ctx2.close();
  });
});

test("a slow older search never overwrites a newer one", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const page = await browser.newPage();
    await page.goto(base + "/");
    await page.fill("#letters", "retainsdolphicm???");
    await page.press("#letters", "Enter");
    await page.fill("#letters", "cat");
    await page.press("#letters", "Enter");
    await page.waitForFunction(() => /words from CAT/.test(document.querySelector("#results").innerText), null, { timeout: 30000 });
    await page.waitForTimeout(3000);
    assert.match(await page.innerText("#results .summary"), /words from CAT/);
  });
});
