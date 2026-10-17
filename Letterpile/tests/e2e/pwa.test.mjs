// Installable app: the manifest and icons load, the service worker installs, and with the
// network off the tools, a daily game (with today's puzzle) and the offline page still work.
import test from "node:test";
import assert from "node:assert/strict";
import { chrome, skip } from "./helpers-browser.mjs";
import { createServer } from "../../scripts/serve.mjs";
import { PUBLIC } from "../helpers.mjs";

test("offline: shell, tools and today's games work without a connection after one visit", { skip, timeout: 180000 }, async () => {
  const { chromium } = await import("playwright-core");
  const server = createServer(PUBLIC).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base + "/");
    const m = await page.evaluate(() => fetch("/manifest.webmanifest").then(r => r.json()));
    assert.equal(m.display, "standalone");
    assert.ok(m.icons.some(i => i.purpose === "maskable"));
    await page.evaluate(() => navigator.serviceWorker.ready);
    // Wait until the shell and the week's puzzles are cached.
    const ready = () => page.evaluate(async () => {
      const keys = await caches.keys();
      const shell = keys.find(k => k.startsWith("lp-shell-"));
      const today = new Date().toISOString().slice(0, 10);
      const puzzles = await caches.open("lp-puzzles");
      return !!shell && !!(await puzzles.match(`/puzzles/sudoku/${today}.json`)) && !!(await caches.match("/games/sudoku"));
    });
    for (let i = 0; i < 120 && !(await ready()); i++) await page.waitForTimeout(1000);
    assert.ok(await ready(), "shell and today's puzzles cached");
    // Really offline: stop the server (Playwright's offline switch doesn't cover service workers).
    await new Promise(r => { server.close(r); server.closeAllConnections(); });
    await page.goto(base + "/games/sudoku");
    await page.waitForSelector("#game[data-ready]", { timeout: 30000 });
    assert.ok(await page.locator(".sd-cell").count() === 81);
    assert.doesNotMatch(await page.textContent("#game"), /Come back soon/);
    await page.goto(base + "/word-ladder-solver?from=cold&to=warm");
    await page.waitForSelector(".wt-ladder li", { timeout: 30000 });
    await page.goto(base + "/word/planet");
    assert.equal(await page.textContent("h1"), "No connection");
    assert.deepEqual(errors, []);
    await ctx.close();
  } finally { await browser.close(); server.close(); }
});
