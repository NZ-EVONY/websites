// Prints each page's main-content word count (the written copy: no word lists, tables,
// link lists, headings, tool forms or navigation) and flags pages under the minimums in
// config/quality.json. Usage: npm run report:content [-- --all] (default hides generated pages)
import fs from "node:fs";
import path from "node:path";
import { proseText, wordCount } from "./similarity.mjs";

const quality = JSON.parse(fs.readFileSync("config/quality.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("public-manifest.json", "utf8"));
const all = process.argv.includes("--all");
const rows = [];
for (const p of manifest.pages) {
  if (p.noindex) continue;
  const html = fs.readFileSync(path.join("public", p.file), "utf8");
  const words = wordCount(proseText(html, { count: true }));
  const min = quality.minWords[p.type] ?? 0;
  rows.push({ page: p.path, type: p.type, words, min, status: words >= min ? "ok" : "UNDER" });
}
const shown = all ? rows : rows.filter(r => r.type !== "programmatic");
const order = ["tool", "guide", "hub", "trust", "affix", "programmatic"];
shown.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.page.localeCompare(b.page));
console.log("page".padEnd(46), "type".padEnd(13), "words".padStart(6), "min".padStart(5), " status");
for (const r of shown) console.log(r.page.padEnd(46), r.type.padEnd(13), String(r.words).padStart(6), String(r.min).padStart(5), " " + r.status);
const gen = rows.filter(r => r.type === "programmatic");
if (!all && gen.length) {
  const ws = gen.map(r => r.words).sort((a, b) => a - b);
  console.log(`\n${gen.length} generated word-list pages: words min ${ws[0]}, median ${ws[Math.floor(ws.length / 2)]}, max ${ws.at(-1)}; under minimum: ${gen.filter(r => r.status !== "ok").length}. (--all to list them)`);
}
const substantial = rows.filter(r => !["programmatic", "affix"].includes(r.type) && r.status === "ok" && r.type !== "error").length;
console.log(`Substantial non-programmatic pages (meeting their minimum): ${substantial}`);
const under = rows.filter(r => r.status !== "ok");
if (under.length) { console.log(`${under.length} page(s) under the minimum.`); process.exitCode = 1; }
