// Pre-deploy gate for Bee: fails if the built site is not safe to publish yet.
// Usage: npm run check:deploy   (run after npm run build; see docs/DEPLOY.md)
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public");
const problems = [];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.relative(OUT, path.join(d, e.name)).split(path.sep).join("/")); })(OUT);

const placeholders = new Set();
for (const f of files.filter(f => f.endsWith(".html"))) {
  for (const m of fs.readFileSync(path.join(OUT, f), "utf8").matchAll(/\{\{[A-Z_]+\}\}/g)) placeholders.add(m[0]);
}
if (placeholders.size) problems.push(`Placeholders still in the pages: ${[...placeholders].join(", ")}. Fill them in site.config.json and rebuild.`);
const bad = files.filter(f => /(^|\/)(\.git|\.backup|\.wrangler|node_modules|docs|tests|scripts)(\/|$)|\.md$|enable1\.txt$|wrangler\.jsonc$|\.dev\.vars$/.test(f));
if (bad.length) problems.push(`Files that must not be public: ${bad.join(", ")}`);
if (!files.includes("404.html") || !files.includes("_headers") || !files.includes("robots.txt")) problems.push("public/ is missing 404.html, _headers or robots.txt. Run npm run build.");

if (problems.length) { console.error("NOT READY TO DEPLOY:\n- " + problems.join("\n- ")); process.exit(1); }
console.log(`OK: ${files.length} files in public/, no placeholders, nothing private.`);
