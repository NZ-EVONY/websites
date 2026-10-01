// Content-quality tests: word counts, similarity, hand-typed statistics, and the
// generated word-list pages (coverage, size rules, blocklist, recomputed facts).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, PUBLIC, readJson, readPublic, manifest, enableWords, rng } from "../helpers.mjs";
import { proseText, wordCount, maxSimilarity } from "../../scripts/similarity.mjs";

const quality = readJson("config/quality.json");
const pages = manifest().pages.filter(p => !p.noindex).map(p => ({ ...p, html: readPublic(p.file) }));
const wordsJs = readPublic(manifest().assets["words.js"].slice(1));
const hidden = new Set(wordsJs.match(/self\.WORD_HIDE="([^"]*)"/)[1].split(" "));
const visible = enableWords().filter(w => !hidden.has(w));
const visibleSet = new Set(visible);

test("every page meets the minimum word count for its type", () => {
  for (const p of pages) {
    const min = quality.minWords[p.type] ?? 0;
    const n = wordCount(proseText(p.html, { count: true }));
    assert.ok(n >= min, `${p.path} (${p.type}): ${n} words, minimum ${min}`);
  }
});

test("at least 20 substantial non-programmatic pages", () => {
  const n = pages.filter(p => ["tool", "guide", "hub", "trust"].includes(p.type) && wordCount(proseText(p.html, { count: true })) >= quality.minWords[p.type]).length;
  assert.ok(n >= 20, `${n} substantial pages`);
});

test("prose similarity stays under the documented thresholds", () => {
  const sims = maxSimilarity(pages.map(p => ({ url: p.path, html: p.html })));
  const type = new Map(pages.map(p => [p.path, p.type]));
  const templated = t => t === "programmatic" || t === "affix";
  for (const r of sims) {
    const limit = templated(type.get(r.page)) && templated(type.get(r.with)) ? quality.similarity.maxJaccardGenerated : quality.similarity.maxJaccard;
    assert.ok(r.max <= limit, `${r.page} ~ ${r.with}: ${r.max.toFixed(3)} > ${limit}`);
  }
});

test("no hand-typed percentages or statistics in content sources", () => {
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name)); })(path.join(ROOT, "content"));
  for (const f of files) {
    const s = fs.readFileSync(f, "utf8").replace(/\$\{[^}]*\}%/g, "");
    assert.doesNotMatch(s, /\b\d+(\.\d+)?%/, `${path.relative(ROOT, f)} contains a typed percentage`);
  }
});

test("guides: Article schema, visible last-updated date, related links", () => {
  for (const p of pages.filter(p => p.type === "guide")) {
    assert.match(p.html, /"@type":"Article"/, p.path);
    assert.match(p.html, /<p class="updated">Last updated: <time datetime="\d{4}-\d{2}-\d{2}">/, p.path);
    assert.match(p.html, /<section class="related"[\s\S]*?<a href="\//, p.path);
  }
  assert.equal(pages.filter(p => p.type === "guide").length, 12);
});

test("tool pages: FAQ of 5-8 questions with FAQPage schema, related links", () => {
  for (const p of pages.filter(p => p.type === "tool")) {
    const n = (p.html.match(/<details class="faq-item">/g) || []).length;
    assert.ok(n >= 5 && n <= 8, `${p.path}: ${n} FAQ items`);
    assert.match(p.html, /"@type":"FAQPage"/);
    assert.match(p.html, /<section class="related"/);
  }
});

test("generated pages: no FAQPage schema, breadcrumb present", () => {
  for (const p of pages.filter(p => p.type === "programmatic" || p.type === "affix")) {
    assert.doesNotMatch(p.html, /FAQPage/, p.path);
    assert.match(p.html, /"@type":"BreadcrumbList"/, p.path);
  }
});

const coverage = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/coverage.json"), "utf8"));
test("coverage: every visible word is listed on at least one indexable page", () => {
  const seen = new Set();
  for (const p of coverage.pages) for (const w of p.words) seen.add(w);
  const missing = visible.filter(w => !seen.has(w));
  assert.equal(missing.length, 0, `missing e.g. ${missing.slice(0, 10).join(", ")}`);
  for (const w of seen) assert.ok(visibleSet.has(w), `listed word "${w}" is not a visible word`);
});

test("size rules: lists of at most 5,000 words; child pages at least 100 words", () => {
  const max = quality.programmatic.maxWordsOnOnePage;
  for (const p of coverage.pages) assert.ok(p.words.length <= max, `${p.path} lists ${p.words.length}`);
  for (const p of pages.filter(p => p.type === "programmatic")) {
    const m = p.html.match(/<span data-fact="count" data-value="(\d+)">/);
    const count = +m[1];
    const isTopLength = /^\/words-by-length\/\d+-letter-words$/.test(p.path);
    if (!isTopLength) assert.ok(count >= quality.programmatic.minWordsListPage, `${p.path}: ${count} words`);
  }
  assert.ok(fs.readdirSync(PUBLIC, { recursive: true }).length <= quality.maxPublicFiles + 200);
});

test("no hidden (blocklisted) word appears on any static page", () => {
  for (const p of pages) {
    const lists = [...p.html.matchAll(/<p class="wordlist">([\s\S]*?)<\/p>/g)].flatMap(m => m[1].split(/\s+/));
    const codes = [...p.html.matchAll(/<code>([A-Za-z]+)<\/code>/g)].map(m => m[1].toLowerCase());
    for (const w of [...lists, ...codes]) assert.ok(!hidden.has(w), `${p.path} shows a hidden word`);
  }
});

// Independent recomputation of the facts on 20 seeded random generated pages.
test("numbers on 20 random generated pages match an independent recount", () => {
  const gen = pages.filter(p => /data-kind="(length|starts|ends)"/.test(p.html));
  const r = rng(42);
  const score = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
  const sc = w => [...w].reduce((s, c) => s + score[c], 0);
  let checked = 0;
  for (let i = 0; i < 20; i++) {
    const p = gen[Math.floor(r() * gen.length)];
    const [, kind, key] = p.html.match(/data-kind="(\w+)" data-key="([^"]*)"/);
    let words;
    if (kind === "length") { const [n, pre] = key.split(":"); words = visible.filter(w => w.length === +n && w.startsWith(pre)); }
    else if (kind === "starts") words = visible.filter(w => w.startsWith(key));
    else words = visible.filter(w => w.endsWith(key));
    // Pages for a prefix list everything starting with it, except a word equal to a parent's key
    // that was placed on the parent page; counts must match within that rule.
    const fact = name => (p.html.match(new RegExp(`data-fact="${name}" data-value="([^"]*)"`)) || [])[1];
    const count = +fact("count");
    assert.ok(Math.abs(count - words.length) <= 1, `${p.path}: count ${count} vs recount ${words.length}`);
    if (count === words.length) {
      const maxL = Math.max(...words.map(w => w.length)), minL = Math.min(...words.map(w => w.length));
      // Pages where every word has the same length don't print longest/shortest.
      if (fact("longest") !== undefined) assert.equal(fact("longest"), `${maxL}:${words.filter(w => w.length === maxL).length}`, `${p.path} longest`);
      if (fact("shortest") !== undefined) assert.equal(fact("shortest"), `${minL}:${words.filter(w => w.length === minL).length}`, `${p.path} shortest`);
      checked++;
      let best = words[0];
      for (const w of words) if (sc(w) > sc(best) || (sc(w) === sc(best) && w < best)) best = w;
      assert.equal(fact("topscore"), `${best}:${sc(best)}`, `${p.path} top score`);
      assert.equal(+fact("distinct"), words.filter(w => new Set(w).size === w.length).length, `${p.path} distinct`);
      assert.equal(+fact("palindromes"), words.filter(w => w === [...w].reverse().join("")).length, `${p.path} palindromes`);
      const share = 100 * count / visible.length;
      assert.ok(Math.abs(+fact("share") - share) < 0.06 * Math.max(1, share), `${p.path} share`);
    }
  }
  assert.ok(checked >= 15, `only ${checked} of 20 pages had an exact count match to check all facts`);
});
