// Shared test helpers. Tests run against the build output in public/ (npm test builds first).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
export const PUBLIC = path.join(ROOT, "public");
export const readJson = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
export const manifest = () => readJson("public-manifest.json");
export const site = readJson("site.config.json");

export function publicFiles() {
  const out = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : out.push(path.relative(PUBLIC, path.join(d, e.name)).split(path.sep).join("/")); })(PUBLIC);
  return out.sort();
}
export const htmlFiles = () => publicFiles().filter(f => f.endsWith(".html"));
export const readPublic = f => fs.readFileSync(path.join(PUBLIC, f), "utf8");

// Clean URL path for a built HTML file, the way Cloudflare serves it (drop-trailing-slash).
export function urlFor(file) {
  if (file === "index.html") return "/";
  return "/" + file.replace(/(\/index)?\.html$/, "");
}

export function enableWords() {
  return fs.readFileSync(path.join(ROOT, "data/enable1.txt"), "utf8").split(/\r?\n/).filter(Boolean);
}
// A fresh engine instance (the module keeps state, so load a private copy).
export function freshEngine() {
  const require = createRequire(import.meta.url);
  const p = require.resolve(path.join(ROOT, "src/assets/engine.js"));
  delete require.cache[p];
  return require(p);
}

// Visible text of an HTML document (head, scripts, styles and tags removed).
export function visibleText(html) {
  return html.replace(/<head[\s\S]*?<\/head>/i, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}
// Seeded PRNG (mulberry32) for repeatable random tests.
export function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
