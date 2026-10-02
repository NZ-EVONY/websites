// Contrast check for every visible text style and every input border, light and dark, at
// 360px and 1280px. Backgrounds are found by walking up the tree and alpha-compositing each
// solid background colour (gradient overlays such as the faint hero grid are ignored; they
// are 10% blue lines). Text needs 4.5:1 (3:1 when large: >= 24px, or >= 18.66px bold);
// input borders need 3:1 against the background around them.
// Usage: node scripts/contrast.mjs [dir=public]   (exit code 1 if anything fails)
import { chromium } from "playwright-core";
import { createServer } from "./serve.mjs";
import { findChrome } from "./chrome.mjs";

const dir = process.argv[2] || "public";
const URLS = ["/", "/?letters=tacre%3F", "/scrabble-word-finder?rack=retains", "/wordle-solver", "/anagram-solver",
  "/guides/two-letter-words", "/words-by-length", "/words-by-length/5-letter-words", "/words-ending-in/ness", "/contact", "/xyz"];
const server = createServer(dir).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: findChrome() });
const fails = [];
let lowest = Infinity, checked = 0;
try {
  for (const scheme of ["light", "dark"]) for (const width of [360, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    for (const url of URLS) {
      await page.goto(base + url);
      if (url.includes("?")) await page.waitForSelector("#results .word", { timeout: 30000 });
      const r = await page.evaluate(() => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
        const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
        const bgOf = el => {
          const layers = [];
          for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
          let out = [255, 255, 255, 1];
          for (const l of layers.reverse()) out = over(l, out);
          return out;
        };
        const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
        const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0 && b.width > 0 && b.height > 0 && !el.closest("[aria-hidden=true] .ghost") && !el.closest(".sr-only"); };
        const out = [], seen = new Set();
        for (const el of document.querySelectorAll("body *")) {
          if (!vis(el)) continue;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          const s = getComputedStyle(el);
          if (own) {
            const fg = parse(s.color), bg = bgOf(el);
            const col = over(fg, bg);
            const size = parseFloat(s.fontSize), bold = +s.fontWeight >= 700;
            const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
            const key = `t|${s.color}|${bg.join()}|${need}`;
            if (!seen.has(key)) { seen.add(key); out.push({ kind: "text", ratio: ratio(col, bg), need, what: `${el.tagName.toLowerCase()}.${el.className || ""} "${el.textContent.trim().slice(0, 30)}"` }); }
          }
          if (el.matches("input[type=text], select, textarea") && parseFloat(s.borderTopWidth) > 0) {
            const bc = parse(s.borderTopColor), bg = bgOf(el.parentElement);
            const key = `b|${s.borderTopColor}|${bg.join()}`;
            if (!seen.has(key)) { seen.add(key); out.push({ kind: "border", ratio: ratio(over(bc, bg), bg), need: 3, what: `${el.tagName.toLowerCase()}#${el.id}` }); }
          }
        }
        return out;
      });
      for (const x of r) {
        checked++;
        lowest = Math.min(lowest, x.ratio);
        if (x.ratio < x.need) fails.push(`${scheme} ${width} ${url}: ${x.kind} ${x.ratio.toFixed(2)} < ${x.need} ${x.what}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`${checked} unique text/border styles checked; lowest ratio ${lowest.toFixed(2)}:1; ${fails.length} below the minimum.`);
for (const f of [...new Set(fails)]) console.log("FAIL " + f);
process.exitCode = fails.length ? 1 : 0;
