// Build-output tests: run against public/ after `npm run build`.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PUBLIC, publicFiles, htmlFiles, readPublic, urlFor, site, manifest, readJson, visibleText } from "../helpers.mjs";
import { parseHeaders } from "../../scripts/serve.mjs";
import { HEAD_SCRIPT } from "../../src/templates/layout.mjs";
import { textOf } from "../../src/templates/partials/util.mjs";

const quality = readJson("config/quality.json");
const nav = readJson("config/nav.json");
const pages = htmlFiles().map(f => ({ file: f, url: urlFor(f), html: readPublic(f) }));
const robotsMeta = html => (html.match(/<meta name="robots" content="([^"]+)">/) || [])[1] || "";
const indexable = pages.filter(p => !/noindex/.test(robotsMeta(p.html)));
const attr = (html, re) => (html.match(re) || [])[1];

test("every page: one h1, title <= 60, description <= 155, viewport, lang", () => {
  for (const p of pages) {
    assert.equal((p.html.match(/<h1[\s>]/g) || []).length, 1, `${p.file} h1 count`);
    const title = attr(p.html, /<title>(.*?)<\/title>/);
    const desc = attr(p.html, /<meta name="description" content="([^"]*)"/);
    assert.ok(title && title.length <= quality.titleMax, `${p.file} title "${title}" (${title?.length})`);
    assert.ok(desc && desc.length <= quality.descriptionMax, `${p.file} description (${desc?.length})`);
    assert.match(p.html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    assert.match(p.html, /<html lang="en">/);
  }
});

test("titles, descriptions and h1s are unique", () => {
  for (const re of [/<title>(.*?)<\/title>/, /<meta name="description" content="([^"]*)"/, /<h1[^>]*>(.*?)<\/h1>/]) {
    const vals = pages.map(p => attr(p.html, re));
    assert.equal(new Set(vals).size, vals.length, `duplicate in ${re}`);
  }
});

test("self-referencing canonical with the production URL in clean form", () => {
  for (const p of pages) {
    const c = attr(p.html, /<link rel="canonical" href="([^"]+)">/);
    assert.ok(c, `${p.file} has no canonical`);
    if (p.file === "404.html") continue;
    assert.equal(c, site.siteUrl + p.url, p.file);
    assert.doesNotMatch(c.replace(/^https:\/\/letterpile\.app\/$/, ""), /\.html$|\/$/, `${p.file} canonical form`);
  }
});

test("Open Graph, Twitter card, theme-color, favicon", () => {
  for (const p of pages) {
    for (const prop of ["og:title", "og:description", "og:type", "og:url"]) assert.match(p.html, new RegExp(`<meta property="${prop}" content="[^"]+">`), `${p.file} ${prop}`);
    assert.match(p.html, /<meta name="twitter:card" content="summary">/);
    assert.equal((p.html.match(/<meta name="theme-color"/g) || []).length, 1);
    assert.match(p.html, /<link rel="icon" href="\/favicon\.svg"/);
  }
  assert.ok(fs.existsSync(path.join(PUBLIC, "favicon.svg")));
});

test("JSON-LD parses, has required properties, and FAQ text equals visible FAQ text", () => {
  for (const p of pages) {
    const blocks = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    if (p.file === "404.html") { assert.equal(blocks.length, 0); continue; }
    assert.equal(blocks.length, 1, `${p.file} has one @graph`);
    const graph = blocks[0]["@graph"];
    assert.equal(blocks[0]["@context"], "https://schema.org");
    const types = graph.map(n => n["@type"]);
    if (p.url === "/") { assert.ok(types.includes("WebSite")); assert.ok(types.includes("Organization")); }
    else {
      const bc = graph.find(n => n["@type"] === "BreadcrumbList");
      assert.ok(bc, `${p.file} BreadcrumbList`);
      const visible = [...p.html.matchAll(/<nav class="crumbs"[\s\S]*?<\/nav>/g)][0][0];
      for (const item of bc.itemListElement) {
        assert.ok(visible.includes(item.name.replace(/&/g, "&amp;")), `${p.file} crumb "${item.name}" visible`);
        assert.match(item.item, /^https:\/\/letterpile\.app\//);
      }
    }
    for (const n of graph) {
      if (n["@type"] === "WebApplication") for (const k of ["name", "url", "applicationCategory", "operatingSystem", "browserRequirements", "offers"]) assert.ok(n[k], `${p.file} WebApplication.${k}`);
      if (n["@type"] === "Article") for (const k of ["headline", "description", "datePublished", "dateModified", "author", "publisher", "mainEntityOfPage"]) assert.ok(n[k], `${p.file} Article.${k}`);
      if (n["@type"] === "FAQPage") {
        const shown = [...p.html.matchAll(/<details class="faq-item"><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(m => [textOf(m[1]), textOf(m[2])]);
        assert.deepEqual(n.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), shown, `${p.file} FAQ mismatch`);
      }
    }
    const isTool = /data-words=/.test(p.html);
    assert.equal(types.includes("WebApplication"), isTool, `${p.file} WebApplication only on tool pages`);
  }
});

test("header, navigation and footer links are in the raw HTML", () => {
  for (const p of pages) {
    assert.match(p.html, /<header class="masthead">/);
    assert.match(p.html, /<nav class="navbar" id="navbar"/);
    for (const n of [...nav.main, ...nav.more, ...nav.legal]) assert.ok(p.html.includes(`href="${n.href}"`), `${p.file} links to ${n.href}`);
    assert.match(p.html, /<footer class="footer">/);
    assert.match(p.html, /M\. Cooper and Alan Beale/);
    assert.match(p.html, /Words come from the open ENABLE word list\. Different games use different dictionaries, so always check the rules of your game\./);
    assert.match(p.html, /Scrabble® is a registered trademark of Hasbro, Inc\./);
    assert.match(p.html, /<a href="#" id="privacy-settings-link" hidden>Privacy settings<\/a>/);
    assert.match(p.html, new RegExp(`© ${new Date().getUTCFullYear()} Letterpile`));
    assert.match(p.html, /<a class="skip" href="#main">/);
  }
});

test("indexable pages have no noindex; 404 does", () => {
  assert.ok(indexable.length >= 14);
  for (const p of indexable) assert.equal(robotsMeta(p.html), "", p.file);
  assert.match(readPublic("404.html"), /<meta name="robots" content="noindex, follow">/);
});

test("the early inline script marks query URLs noindex and is the only inline script", () => {
  for (const p of pages) {
    const inline = [...p.html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.deepEqual(inline, [HEAD_SCRIPT], `${p.file} inline scripts`);
    assert.doesNotMatch(p.html, /\sstyle="/, `${p.file} has an inline style attribute (blocked by CSP)`);
    assert.doesNotMatch(p.html, /<style[\s>]/, `${p.file} has a <style> block (blocked by CSP)`);
  }
  assert.match(HEAD_SCRIPT, /noindex, follow/);
  assert.match(HEAD_SCRIPT, /has-query/);
});

test("sitemap lists exactly the indexable canonical URLs, each built", () => {
  const xml = readPublic("sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(locs.slice().sort(), indexable.map(p => site.siteUrl + p.url).sort());
  for (const l of locs) assert.doesNotMatch(l, /\?|\.html$/);
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) assert.match(m[1], /^\d{4}-\d{2}-\d{2}$/);
});

test("robots.txt and ads.txt", () => {
  const robots = readPublic("robots.txt");
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/letterpile\.app\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /Disallow|Mediapartners|Googlebot|AdsBot/);
  const ads = readPublic("ads.txt");
  for (const line of ads.split("\n").filter(Boolean)) assert.match(line, /^#/, "ads.txt must stay comment-only until a real publisher ID exists");
  assert.doesNotMatch(ads, /pub-\d/);
});

test("internal links: root-relative clean URLs that exist; no orphans", () => {
  const known = new Set(pages.map(p => p.url));
  const files = new Set(publicFiles().map(f => "/" + f));
  const inbound = new Map(pages.map(p => [p.url, 0]));
  for (const p of pages) {
    for (const [, href] of p.html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      assert.match(href, /^\//, `${p.file}: relative link ${href}`);
      assert.doesNotMatch(href, /\.html($|[?#])/, `${p.file}: .html link ${href}`);
      assert.doesNotMatch(href, /\?/, `${p.file}: query-string link ${href}`);
      const clean = href.replace(/#.*$/, "");
      assert.ok(known.has(clean) || files.has(clean), `${p.file}: broken link ${href}`);
      if (known.has(clean) && clean !== p.url) inbound.set(clean, inbound.get(clean) + 1);
    }
  }
  for (const [url, n] of inbound) if (url !== "/" && url !== "/404") assert.ok(n > 0, `orphan page ${url}`);
});

test("no ad code anywhere; every ad slot has a label and a reserved height", () => {
  for (const f of publicFiles().filter(f => /\.(html|js|css|txt)$/.test(f))) {
    const s = readPublic(f);
    assert.doesNotMatch(s, /adsbygoogle/, f);
    if (f.endsWith(".html")) assert.doesNotMatch(s.replace(/<!--[\s\S]*?-->/g, ""), /<ins[\s>]/, f);
  }
  const css = readPublic(manifest().assets["style.css"].slice(1));
  assert.match(css, /\.ad-slot \{[^}]*min-height: var\(--ad-h\)[^}]*contain: layout style/);
  for (const p of pages) for (const m of p.html.matchAll(/<aside class="ad-slot[^"]*"[^>]*>([\s\S]*?)<\/aside>/g)) assert.match(m[1], /<span class="ad-label">Advertisement<\/span>/);
});

test("_headers: rule count, line length, CSP hash matches the inline script, caching", () => {
  const text = readPublic("_headers");
  const rules = parseHeaders(text);
  assert.ok(rules.length <= 100);
  for (const line of text.split("\n")) assert.ok(line.length <= 2000);
  const all = Object.fromEntries(rules.find(r => r.pattern === "/*").headers);
  const hash = createHash("sha256").update(HEAD_SCRIPT).digest("base64");
  assert.ok(all["Content-Security-Policy"].includes(`'sha256-${hash}'`));
  assert.match(all["Content-Security-Policy"], /connect-src 'self' https:\/\/api\.dictionaryapi\.dev/);
  for (const h of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]) assert.ok(all[h], h);
  for (const p of ["/assets/*", "/data/*"]) assert.equal(Object.fromEntries(rules.find(r => r.pattern === p).headers)["Cache-Control"], "public, max-age=31536000, immutable");
});

test("hashed asset names match their content", () => {
  for (const [, url] of Object.entries(manifest().assets)) {
    const buf = fs.readFileSync(path.join(PUBLIC, url));
    const h = url.match(/\.([0-9a-f]{10})\.\w+$/)[1];
    assert.equal(createHash("sha256").update(buf).digest("hex").slice(0, 10), h, url);
  }
});

test("public/ holds no forbidden files and stays under the file budget", () => {
  const files = publicFiles();
  assert.ok(files.length <= quality.maxPublicFiles);
  for (const f of files) assert.doesNotMatch(f, /(^|\/)(\.git|\.backup|\.wrangler|node_modules|docs|tests|scripts)(\/|$)|\.md$|enable1\.txt$|wrangler\.jsonc$|\.dev\.vars$|package(-lock)?\.json$/, f);
});

test("words.js ships ENABLE in the engine's format, with credit", () => {
  const f = manifest().assets["words.js"].slice(1);
  const s = readPublic(f);
  assert.match(s.split("\n")[0], /ENABLE.*M\. Cooper and Alan Beale.*public domain/);
  const words = s.match(/self\.WORD_DATA="([^"]+)"/)[1].split(" ");
  assert.equal(words.length, 172823);
  const hide = s.match(/self\.WORD_HIDE="([^"]*)"/)[1].split(" ");
  const set = new Set(words);
  for (const w of hide) assert.ok(set.has(w));
});

test("banned wording: no cheat/official/tournament claims; no Scrabble in titles, h1s or descriptions", () => {
  for (const p of pages) {
    // The copy only: word lists and quoted example words are data, not wording.
    const text = visibleText(p.html.replace(/<p class="wordlist">[\s\S]*?<\/p>/g, " ").replace(/<code>[^<]*<\/code>/g, " "));
    const head = [attr(p.html, /<title>(.*?)<\/title>/), attr(p.html, /<h1[^>]*>(.*?)<\/h1>/), attr(p.html, /<meta name="description" content="([^"]*)"/)].join(" ");
    assert.doesNotMatch(head, /scrabble/i, `${p.file} uses Scrabble in title/h1/description`);
    assert.doesNotMatch(text, /\bcheat/i, p.file);
    assert.doesNotMatch(text, /\b(hack|hacker|exploit)\b/i, p.file);
    assert.doesNotMatch(text, /tournament[- ]legal|valid in scrabble|accepted by (words with friends|wordle)/i, p.file);
    assert.doesNotMatch(text, /official (scrabble|tournament|word list|dictionary|lexicon)/i, p.file);
    // "official" only appears in a "not an official ..." disclaimer
    for (const m of text.matchAll(/.{0,40}\bofficial\b.{0,40}/gi)) assert.match(m[0], /\b(not|nothing|isn't|no)\b.{0,30}official|“official”/i, `${p.file}: "${m[0]}"`);
    const allowLexicons = ["about.html", "terms.html"].includes(p.file) || p.file.startsWith("guides/word-lists-explained");
    if (!allowLexicons) assert.doesNotMatch(text, /\b(NWL|CSW|Collins)\b/, p.file);
    assert.doesNotMatch(text, /274,?000|word-list package/i, `${p.file} still quotes the old list`);

  }
});

test("trust pages meet the minimum word count", () => {
  for (const f of ["about.html", "contact.html", "privacy-policy.html", "terms.html"]) {
    const main = readPublic(f).match(/<main[\s\S]*?<\/main>/)[0];
    const words = visibleText(`<body>${main}</body>`).split(" ").length;
    assert.ok(words >= quality.minWords.trust, `${f}: ${words} words (minimum ${quality.minWords.trust})`);
  }
});

test("no file or folder in public/ uses a reserved Windows name; renamed pages redirect", () => {
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  for (const f of publicFiles()) for (const seg of f.split("/")) assert.doesNotMatch(seg.replace(/\..*$/, ""), reserved, f);
  const lines = readPublic("_redirects").split("\n").filter(l => l.trim() && !l.startsWith("#"));
  for (const l of lines) {
    const [from, to, status] = l.split(/\s+/);
    assert.equal(status, "301", l);
    assert.ok(from.split("/").some(seg => reserved.test(seg)), `${from} needs no redirect`);
    assert.ok(fs.existsSync(path.join(PUBLIC, to.slice(1) + ".html")), `${to} is not a built page`);
  }
  assert.ok(lines.some(l => l.startsWith("/words-starting-with/con ")), "the CON page redirect is missing");
});

test("performance budget per page (gzip): HTML <= 60 KB, CSS <= 12 KB, JS <= 15 KB", async () => {
  const { gzipSync } = await import("node:zlib");
  const gz = f => gzipSync(fs.readFileSync(path.join(PUBLIC, f)), { level: 9 }).length;
  const m = manifest();
  const css = gz(m.assets["style.css"].slice(1));
  assert.ok(css <= 12 * 1024, `CSS ${css} bytes`);
  let worst = { html: 0, js: 0 };
  for (const p of pages) {
    const html = gz(p.file);
    const scripts = [...p.html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1].slice(1));
    if (/data-worker="([^"]+)"/.test(p.html)) scripts.push(p.html.match(/data-worker="([^"]+)"/)[1].slice(1));
    const js = scripts.reduce((s, f) => s + gz(f), 0);
    assert.ok(html <= 60 * 1024, `${p.file}: HTML ${html} bytes`);
    assert.ok(js <= 15 * 1024, `${p.file}: JS ${js} bytes`);
    worst = { html: Math.max(worst.html, html), js: Math.max(worst.js, js) };
  }
  console.log(`# budget: CSS ${css} B, worst HTML ${worst.html} B, worst JS ${worst.js} B (gzip -9; word list excluded)`);
});
