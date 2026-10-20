// Renders the share (Open Graph) images for the games, 1200x630 PNG, into src/assets/og/.
// Run after changing config/games.json: node scripts/og-images.mjs  (needs Chromium; see chrome.mjs)
// The images are committed; the build copies them to public/og/.
import fs from "node:fs";
import path from "node:path";
import { findChrome } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { games } = JSON.parse(fs.readFileSync(path.join(ROOT, "config/games.json"), "utf8"));
const TILE = { "c-mint": "#35DCA2", "c-sun": "#FFCC33", "c-coral": "#FF7A5C", "c-violet": "#A98BFF", "c-blue": "#5C9DFF" };
const tile = (ch, c, size) => `<span class="t" style="--s:${size}px;background:${c}">${ch}</span>`;
const page = ({ name, blurb, icon, color }) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1200px;height:630px;background:#0A1030;background-image:linear-gradient(rgb(77 141 255/.12) 1px,transparent 1px),linear-gradient(90deg,rgb(77 141 255/.12) 1px,transparent 1px);background-size:60px 60px;font-family:"DejaVu Sans",Arial,sans-serif;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box}
.t{display:inline-grid;place-items:center;width:var(--s);height:var(--s);border-radius:calc(var(--s)*.2);color:#0A1030;font-weight:800;font-size:calc(var(--s)*.5);box-shadow:inset 0 calc(var(--s)*-.07) 0 rgb(0 0 0/.16),0 6px 0 rgb(0 0 0/.25);margin-right:10px}
.brand{display:flex;align-items:center;font-size:44px;font-weight:800;margin-bottom:56px}.brand .t{margin-right:8px}.brand span.w{margin-left:14px}
h1{display:flex;align-items:center;gap:26px;font-size:96px;line-height:1;margin:0 0 28px;letter-spacing:-2px}h1 .t{margin:0}
p{font-size:40px;color:#D3DBFF;margin:0 0 48px;max-width:960px}
.foot{font-size:32px;font-weight:700;color:#FFDD55}
</style></head><body>
<div class="brand">${tile("L", TILE["c-coral"], 64)}${tile("P", TILE["c-sun"], 64)}${tile("!", TILE["c-blue"], 64)}<span class="w">Letterpile</span></div>
<h1>${tile(icon, TILE[color], 120)}${name}</h1>
<p>${blurb}</p>
<div class="foot">Free · new every day · letterpile.app</div>
</body></html>`;

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: findChrome() });
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const all = [...games, { key: "games", name: "Daily Games", icon: "★", color: "c-blue", blurb: "A word game, crossword, word search and sudoku. Free, new every day." },
  // Site-wide default share image for pages without their own.
  { key: "default", name: "Word Tools", icon: "W", color: "c-mint", blurb: "Unscramblers, solvers, word lists and daily puzzles. Free, in your browser." }];
// Optional: node scripts/og-images.mjs default  (render only the named keys)
const only = process.argv.slice(2);
for (const g of all.filter(g => !only.length || only.includes(g.key))) {
  await tab.setContent(page(g));
  await tab.screenshot({ path: path.join(ROOT, "src/assets/og", `${g.key}.png`) });
  console.log(`src/assets/og/${g.key}.png`);
}
await browser.close();
