// axe-core on every page template, in light and dark themes, plus tool pages showing results.
// Fails on serious or critical violations. Automated checks can't replace a screen reader test.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../helpers.mjs";
import { withBrowser, skip, TEMPLATE_PAGES } from "./helpers-browser.mjs";

const AXE = fs.readFileSync(path.join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const WITH_RESULTS = ["/?letters=listen", "/scrabble-word-finder?rack=retains", "/anagram-solver?q=listen", "/crossword-solver?p=c%3Fo%3Fs", "/word-combiner?w=breakfast,lunch", "/jumble-solver?w=elbat"];

test("axe: no serious or critical issues on any template (light and dark)", { skip, timeout: 600000 }, async () => {
  await withBrowser(async (browser, base) => {
    const problems = [];
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ bypassCSP: true, colorScheme: scheme });
      const page = await ctx.newPage();
      for (const u of [...TEMPLATE_PAGES, ...WITH_RESULTS]) {
        await page.goto(base + u);
        if (u.includes("?")) await page.waitForFunction(() => { const r = document.querySelector("#results"); return r && !r.querySelector(".loading") && r.querySelector(".group, .word, .summary"); }, null, { timeout: 30000 });
        await page.addScriptTag({ content: AXE });
        const res = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.html.slice(0, 120) })));
        for (const v of res) if (["serious", "critical"].includes(v.impact)) problems.push(`${scheme} ${u}: ${v.id} (${v.impact}, ${v.n}) ${v.sample}`);
      }
      // Wordle tiles with colors set
      await page.goto(base + "/wordle-solver");
      await page.fill("#guess", "crane"); await page.press("#guess", "Enter");
      await page.click('.wtile[data-i="0"]'); await page.click('.wtile[data-i="1"]'); await page.click('.wtile[data-i="1"]');
      await page.waitForSelector("#results .summary");
      await page.addScriptTag({ content: AXE });
      for (const v of await page.evaluate(async () => (await window.axe.run()).violations.map(v => ({ id: v.id, impact: v.impact, sample: v.nodes[0]?.html.slice(0, 120) }))))
        if (["serious", "critical"].includes(v.impact)) problems.push(`${scheme} wordle tiles: ${v.id} ${v.sample}`);
      await ctx.close();
    }
    assert.deepEqual(problems, []);
  });
});

test("keyboard: skip link, More menu and Wordle tiles work without a mouse", { skip }, async () => {
  await withBrowser(async (browser, base) => {
    const page = await browser.newPage();
    await page.goto(base + "/about");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.className), "skip");
    const box = await page.locator(".skip").boundingBox();
    assert.ok(box && box.y >= 0, "skip link is visible when focused");
    await page.focus("#moreMenu summary");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.querySelector("#moreMenu").open), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.querySelector("#moreMenu").open), false);

    await page.goto(base + "/wordle-solver");
    await page.fill("#guess", "slate"); await page.press("#guess", "Enter");
    await page.focus('.wtile[data-i="2"]');
    await page.keyboard.press("Enter");
    assert.match(await page.getAttribute('.wtile[data-i="2"]', "aria-label"), /Letter A, position 3, yellow/);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.i), "2", "focus stays on the tile");
  });
});
