// Measures main-thread long tasks (PerformanceObserver "longtask", lab only) while the
// word list loads and heavy searches run. Usage: node scripts/measure-longtasks.mjs [cpuSlowdown=1]
// Long tasks approximate responsiveness (INP can only be measured on real devices).
import { chromium } from "playwright-core";
import { createServer } from "./serve.mjs";
import { findChrome } from "./chrome.mjs";

export async function measure({ slowdown = 1, runs = 3 } = {}) {
  const server = createServer("public").listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: findChrome() });
  const cases = [
    ["Unscrambler, 15 letters + 2 blanks", "/?letters=retainsdolphicm%3F%3F"],
    ["Unscrambler, 15 letters + 3 blanks", "/?letters=retainsdolphicm%3F%3F%3F"],
    ["Anagram, 15 letters with two-word phrases", "/anagram-solver?q=retainsdolphicm"],
    ["Rack finder, 7 + 2 blanks with board letters", "/scrabble-word-finder?rack=retain%3F%3F&board=ing"],
    ["Crossword, 7 open squares", "/crossword-solver?p=%3F%3F%3F%3F%3F%3F%3F"],
  ];
  const out = [];
  try {
    for (const [name, url] of cases) {
      const worst = [];
      for (let i = 0; i < runs; i++) {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        if (slowdown > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: slowdown });
        await page.addInitScript(() => {
          window.__long = [];
          new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true });
        });
        await page.goto(base + url);
        await page.waitForFunction(() => { const r = document.querySelector("#results"); return r && !r.querySelector(".loading") && /\d/.test(r.innerText); }, null, { timeout: 60000 });
        await page.waitForTimeout(300);
        const long = await page.evaluate(() => window.__long);
        worst.push(Math.max(0, ...long));
        await ctx.close();
      }
      out.push({ case: name, slowdown, worstLongTaskMs: Math.round(Math.max(...worst)), medianOfWorstMs: Math.round(worst.sort((a, b) => a - b)[Math.floor(worst.length / 2)]) });
    }
  } finally { await browser.close(); server.close(); }
  return out;
}

if (process.argv[1]?.endsWith("measure-longtasks.mjs")) {
  const slowdown = +(process.argv[2] || 1);
  console.table(await measure({ slowdown }));
}
