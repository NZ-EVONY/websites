// Layout checks: layout shift (CLS) during load and searches, ad-slot placement rules in the
// ads-preview build (slots on every page type), and no horizontal scrolling at 360px.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "../helpers.mjs";
import { withBrowser, skip, TEMPLATE_PAGES } from "./helpers-browser.mjs";

const PREVIEW = path.join(ROOT, "reports", "ads-preview");
const clsInit = () => {
  window.__cls = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
};

test("CLS stays at or below 0.02 on load and after a search (360px and 1280px, ad placeholders on)", { skip, timeout: 600000 }, async () => {
  execFileSync(process.execPath, ["scripts/build.mjs", "--ads-preview", "--out", "reports/ads-preview"], { cwd: ROOT, stdio: "ignore" });
  await withBrowser(async (browser, base) => {
    const bad = [];
    for (const width of [360, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      for (const u of ["/", "/wordle-solver", "/guides/two-letter-words", "/words-ending-in/ness", "/about", "/?letters=listen", "/scrabble-word-finder?rack=retains"]) {
        const page = await ctx.newPage();
        await page.addInitScript(clsInit);
        await page.goto(base + u, { waitUntil: "load" });
        if (u.includes("?")) await page.waitForFunction(() => document.querySelector("#results .group, #results .words"), null, { timeout: 30000 });
        await page.waitForTimeout(500);
        const cls = await page.evaluate(() => window.__cls);
        if (cls > 0.02) bad.push(`${width}px ${u}: ${cls.toFixed(3)}`);
        await page.close();
      }
      await ctx.close();
    }
    assert.deepEqual(bad, []);
  }, { root: PREVIEW });
});

test("ad slots: never above the h1, never inside the tool card, at least 150px from any control, at most 3", { skip, timeout: 600000 }, async () => {
  await withBrowser(async (browser, base) => {
    const bad = [];
    for (const width of [360, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      for (const u of TEMPLATE_PAGES.filter(u => u !== "/no-such-page")) {
        await page.goto(base + u);
        const r = await page.evaluate(() => {
          const slots = [...document.querySelectorAll(".ad-slot")];
          const h1 = document.querySelector("h1").getBoundingClientRect();
          const controls = [...document.querySelectorAll("main button, main input, main select, main textarea, main summary, main .results")]
            .filter(el => el.offsetParent !== null).map(el => el.getBoundingClientRect());
          const out = { count: slots.length, issues: [] };
          for (const s of slots) {
            const a = s.getBoundingClientRect();
            if (a.top < h1.bottom) out.issues.push("above h1");
            if (s.closest(".tool-card, .results, form")) out.issues.push("inside tool");
            for (const c of controls) {
              const vGap = Math.max(c.top - a.bottom, a.top - c.bottom);
              const hOverlap = c.left < a.right && a.left < c.right;
              if (hOverlap && vGap < 150) out.issues.push(`only ${Math.round(vGap)}px from a control`);
            }
          }
          return out;
        });
        if (r.count > 3) bad.push(`${width}px ${u}: ${r.count} slots`);
        for (const i of new Set(r.issues)) bad.push(`${width}px ${u}: ${i}`);
      }
      await ctx.close();
    }
    assert.deepEqual(bad, []);
  }, { root: PREVIEW });
});

test("no horizontal scrolling at 360px", { skip, timeout: 300000 }, async () => {
  await withBrowser(async (browser, base) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await ctx.newPage();
    const bad = [];
    for (const u of [...TEMPLATE_PAGES, "/?letters=retainsdolphicm"]) {
      await page.goto(base + u);
      if (u.includes("?")) await page.waitForSelector("#results .group", { timeout: 30000 });
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      if (w > 360) bad.push(`${u}: ${w}px wide`);
    }
    assert.deepEqual(bad, []);
  });
});
