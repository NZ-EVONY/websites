// Builds the deployable site into public/. Usage: node scripts/build.mjs [--dev]
//   --dev  shows dashed placeholders in ad slots (never deploy a dev build).
// public/ is committed so Bee can diff exactly what will be deployed.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { wordData, fmt } from "./wordstats.mjs";
import layout, { HEAD_SCRIPT } from "../src/templates/layout.mjs";
import { esc } from "../src/templates/partials/util.mjs";
import { WORDLIST_NOTE, TRADEMARKS } from "../src/templates/partials/footer.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUT = path.join(ROOT, "public");
const DEV = process.argv.includes("--dev");
const readJson = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const site = readJson("site.config.json");
const nav = readJson("config/nav.json");
const adsCfg = readJson("config/ads.json");
const quality = readJson("config/quality.json");

// ---------- helpers ----------

const hash = buf => createHash("sha256").update(buf).digest("hex").slice(0, 10);
function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}
// Last change date of a set of source files: the git commit date, or today if a
// file has uncommitted changes. Used for sitemap lastmod and "Last updated".
const today = new Date().toISOString().slice(0, 10);
function lastChanged(files) {
  let latest = "";
  for (const f of files) {
    try {
      const dirty = execFileSync("git", ["status", "--porcelain", "--", f], { cwd: ROOT, encoding: "utf8" }).trim();
      const d = dirty ? today : execFileSync("git", ["log", "-1", "--format=%cs", "--", f], { cwd: ROOT, encoding: "utf8" }).trim() || today;
      if (d > latest) latest = d;
    } catch { latest = today; }
  }
  return latest || today;
}
const longDate = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

// ---------- start clean ----------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------- word data ----------

const data = wordData(); // throws if ENABLE fails its integrity checks
const { Engine } = data;
const wordsJs = `/* ENABLE word list (enable1, ${fmt(data.words.length)} words), compiled by M. Cooper and Alan Beale and released into the public domain. Free to redistribute: see /licenses/enable.txt. WORD_HIDE lists words the tools hide by default (see /about). */\n`
  + `self.WORD_DATA="${data.words.join(" ")}";\nself.WORD_HIDE="${data.blocked.join(" ")}";\n`;
const assets = {};
const wordsName = `/data/words.${hash(wordsJs)}.js`;
write(wordsName, wordsJs);
assets["words.js"] = wordsName;

// ---------- static assets (content-hashed names) ----------

const SRC = path.join(ROOT, "src/assets");
const assetFiles = ["style.css", "engine.js", "site.js", ...fs.readdirSync(path.join(SRC, "js")).filter(f => f.endsWith(".js")).map(f => `js/${f}`)];
for (const rel of assetFiles) {
  const buf = fs.readFileSync(path.join(SRC, rel));
  const ext = path.extname(rel);
  const name = `/assets/${rel.slice(0, -ext.length)}.${hash(buf)}${ext}`;
  write(name, buf);
  assets[rel] = name;
}
write("favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="6" fill="#f3dfb4"/><rect x="2" y="26" width="28" height="4" rx="2" fill="#d7bd86"/><text x="16" y="23" font-family="monospace" font-weight="800" font-size="20" text-anchor="middle" fill="#3a2e18">L</text></svg>\n`);
write("licenses/enable.txt", fs.readFileSync(path.join(ROOT, "licenses/ENABLE-README.txt")));

// ---------- page context ----------

const asCode = w => `<code>${esc(String(w).toUpperCase())}</code>`;
function list(words, n = 3) {
  const items = words.slice(0, n).map(asCode);
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items.join("");
}
function assertWords(ws) {
  for (const w of ws) {
    if (!data.set.has(w)) throw new Error(`Copy names "${w}" as a word, but it is not in the ENABLE list.`);
    if (data.blockedSet.has(w)) throw new Error(`Copy names "${w}", which is on the blocklist.`);
  }
}
function assertNotWords(ws) {
  for (const w of ws) if (data.set.has(w)) throw new Error(`Copy says "${w}" is not in the list, but it is.`);
}
const VALUE_ORDER = "abcdefghijklmnopqrstuvwxyz";
const valuesTable = scheme => {
  const v = Engine.SCHEMES[scheme].values;
  return `<div class="values">${[...VALUE_ORDER].map(k => `<span>${k}<b>${v[k]}</b></span>`).join("")}</div>`;
};
function valueDiffTable() {
  const a = Engine.SCHEMES.scrabble.values, b = Engine.SCHEMES.wwf.values;
  const groups = new Map();
  for (const k of VALUE_ORDER) if (a[k] !== b[k]) {
    const key = `${a[k]}>${b[k]}`;
    groups.set(key, [...(groups.get(key) || []), k.toUpperCase()]);
  }
  return `<table>
          <tr><th>Letter</th><th>Other tile games (common values)</th><th>Words With Friends (common values)</th></tr>
          ${[...groups].map(([k, letters]) => { const [x, y] = k.split(">"); return `<tr><td>${letters.join(", ")}</td><td>${x}</td><td>${y}</td></tr>`; }).join("\n          ")}
        </table>`;
}
const showAllToggle = `<label class="check show-all"><input type="checkbox" data-show-all> Show all words, including vulgar ones</label>`;
const finderForm = () => `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field grow2"><span>Your rack</span><input class="big-input" id="rack" type="text" maxlength="9" placeholder="Up to 7 letters, ? for blanks" required></label>
            <label class="field"><span>Letters on board (optional)</span><input class="big-input" id="board" type="text" maxlength="8" placeholder="e.g. E or ING"></label>
          </div>
          <details class="advanced" id="adv">
            <summary>Advanced filters</summary>
            <div class="row">
              <label class="field"><span>Starts with</span><input type="text" id="starts" maxlength="8"></label>
              <label class="field"><span>Ends with</span><input type="text" id="ends" maxlength="8"></label>
              <label class="field"><span>Contains</span><input type="text" id="contains" maxlength="8"></label>
              <label class="field"><span>Length</span><select id="len"><option value="">Any</option></select></label>
            </div>
          </details>
          ${showAllToggle}
          <div class="row"><button class="btn" type="submit">Find words</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Playable words will appear here, highest score first. Use <kbd>?</kbd> for a blank tile.</p></div>`;

const sortWords = ws => ws.slice().sort((a, b) => b.length - a.length || a.localeCompare(b));
const ctx = {
  site, nav, assets, esc, fmt, list, longDate, year: new Date().getUTCFullYear(),
  total: data.words.length, byLength: data.byLength, blockedCount: data.blocked.length,
  WORDLIST_NOTE, TRADEMARKS, showAllToggle, finderForm, valuesTable, valueDiffTable, assertWords, assertNotWords,
  unscramble: letters => sortWords(Engine.unscramble(letters).map(x => x.word)),
  anagrams: w => Engine.anagrams(w).exact,
  pattern: (p, opts) => Engine.patternSearch(p, opts),
  assertPhrase(input, phrase) {
    if (!Engine.anagrams(input, { phrases: true, limit: 100000 }).phrases.includes(phrase)) throw new Error(`"${phrase}" is not a two-word anagram of "${input}" in the list.`);
  },
  ads: {
    dev: DEV || adsCfg.showDevPlaceholders,
    enabledFor(page) {
      const t = adsCfg.pageTypes[page.type];
      if (!t?.enabled || page.noindex) return [];
      if (page.template && !adsCfg.ADS_ENABLED_FOR_TEMPLATE_PAGES) return [];
      return t.slots;
    },
  },
};

// ---------- pages ----------

const pageDir = path.join(ROOT, "content/pages");
const pages = [];
for (const f of fs.readdirSync(pageDir).filter(f => f.endsWith(".mjs")).sort()) {
  const mod = await import(pathToFileURL(path.join(pageDir, f)).href);
  const page = mod.default(ctx);
  const sources = [`content/pages/${f}`];
  if (page.script) sources.push(`src/assets/js/${page.script}.js`);
  page.updated = page.updated || lastChanged(sources);
  page.source = f;
  if (page.path !== "/" && page.type !== "error") page.crumbs = page.crumbs || [{ name: "Home", path: "/" }, { name: page.h1, path: page.path }];
  pages.push(page);
}
for (const page of pages) write(page.file, layout(page, { ...ctx, nav, ads: ctx.ads }));

// ---------- robots, sitemap, ads.txt ----------

const indexable = pages.filter(p => !p.noindex && p.inSitemap !== false);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(p => `  <url><loc>${site.siteUrl}${p.path === "/" ? "/" : p.path}</loc><lastmod>${p.updated}</lastmod></url>`).join("\n")}
</urlset>
`);
write("ads.txt", `# ads.txt for letterpile.app. Placeholder until an AdSense account exists.\n# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0  (replace pub id after AdSense account is created, uncomment)\n`);

// ---------- headers (security + caching) ----------

const scriptHash = createHash("sha256").update(HEAD_SCRIPT).digest("base64");
const csp = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${scriptHash}'`,
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://api.dictionaryapi.dev",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");
write("_headers", `# Cloudflare static-asset headers (max 100 rules, 2,000 characters per line).
# Generated by scripts/build.mjs: edit there, not here.
#
# CSP additions that WILL be needed when ads and a consent platform are wired in
# (verify against Google's current AdSense CSP documentation and your CMP's docs first):
#   script-src  + https://pagead2.googlesyndication.com https://*.googlesyndication.com
#                 https://*.google.com https://*.gstatic.com https://*.doubleclick.net + the CMP's origin(s)
#   frame-src   + https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com
#   img-src     + https: (ad images come from many hosts)
#   connect-src + https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net
#   style-src   may need 'unsafe-inline' for ad and CMP markup.
# Google's own CSP guidance for AdSense uses a nonce-based "strict" policy; a static site
# cannot generate nonces, so expect to loosen script-src. Test before deploying.

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: ${csp}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=31536000, immutable
`);

// Keep anything stray out of the upload (wrangler reads .assetsignore from the assets directory).
write(".assetsignore", ".assetsignore\n.DS_Store\nThumbs.db\n");

// ---------- checks ----------

const all = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : all.push(path.relative(OUT, path.join(d, e.name)).split(path.sep).join("/")); })(OUT);
if (all.length > quality.maxPublicFiles) throw new Error(`public/ has ${all.length} files; the limit is ${quality.maxPublicFiles}.`);
const forbidden = all.filter(f => /(^|\/)(\.git|\.backup|\.wrangler|node_modules|docs|tests|scripts)(\/|$)|\.md$|enable1\.txt$|wrangler\.jsonc$|\.dev\.vars$/.test(f));
if (forbidden.length) throw new Error(`Forbidden files in public/: ${forbidden.join(", ")}`);

const placeholders = new Set();
for (const f of all.filter(f => f.endsWith(".html"))) for (const m of fs.readFileSync(path.join(OUT, f), "utf8").matchAll(/\{\{[A-Z_]+\}\}/g)) placeholders.add(m[0]);

fs.writeFileSync(path.join(ROOT, "public-manifest.json"), JSON.stringify({ assets, pages: pages.map(p => ({ path: p.path, file: p.file, type: p.type, updated: p.updated, noindex: !!p.noindex })) }, null, 2) + "\n");
console.log(`Built ${pages.length} pages, ${all.length} files into public/${DEV ? " (DEV build: ad placeholders visible)" : ""}.`);
console.log(`Word list: ENABLE, ${fmt(data.words.length)} words (SHA-256 ok), ${data.blocked.length} hidden by default.`);
if (placeholders.size) console.log(`Placeholders still to fill in site.config.json: ${[...placeholders].join(", ")} (see docs/BEE-TODO.md)`);
