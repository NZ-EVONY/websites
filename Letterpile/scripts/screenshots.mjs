// Screenshots at 360px and 1280px, light and dark, for a visual check.
// Usage: node scripts/screenshots.mjs [dir=public]  ->  reports/screens/*.png (gitignored)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { createServer } from "./serve.mjs";
import { findChrome } from "./chrome.mjs";

const dir = process.argv[2] || "public";
const out = path.join("reports", "screens");
fs.mkdirSync(out, { recursive: true });
const PAGES = [
  ["home", "/"], ["unscramble-results", "/?letters=listen"], ["wordle", "/wordle-solver"], ["finder-results", "/scrabble-word-finder?rack=retains"],
  ["guide-two-letter", "/guides/two-letter-words"], ["hub-length", "/words-by-length"], ["list-5", "/words-by-length/5-letter-words"],
  ["affix-ness", "/words-ending-in/ness"], ["privacy", "/privacy-policy"], ["404", "/xyz"],
];
const server = createServer(dir).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: findChrome() });
let n = 0;
try {
  for (const scheme of ["light", "dark"]) for (const width of [360, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 360 ? 780 : 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const [name, url] of PAGES) {
      await page.goto(base + url);
      if (name === "wordle") { await page.fill("#guess", "crane"); await page.press("#guess", "Enter"); await page.click('.wtile[data-i="2"]'); await page.click('.wtile[data-i="4"]'); await page.click('.wtile[data-i="4"]'); }
      if (url.includes("?") || name === "wordle") await page.waitForSelector("#results .summary, #results .toolbar", { timeout: 30000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(out, `${name}-${width}-${scheme}.png`), fullPage: false });
      n++;
    }
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
console.log(`${n} screenshots in ${out}`);
