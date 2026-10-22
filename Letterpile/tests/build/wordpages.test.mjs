// Word pages and curated lists: facts on a sample of pages are recomputed here from the word list,
// independently of the build's code, and the page set stays within the plan.
import test from "node:test";
import assert from "node:assert/strict";
import { manifest, readPublic, enableWords, publicFiles } from "../helpers.mjs";

const m = manifest();
const wordPages = m.pages.filter(p => p.type === "word");
const wordsJs = readPublic(m.assets["words.js"].slice(1));
const hidden = new Set(wordsJs.match(/self\.WORD_HIDE="([^"]*)"/)[1].split(" "));
const visible = enableWords().filter(w => !hidden.has(w));
const set = new Set(visible);
const key = w => [...w].sort().join("");

test("word pages: about 3,000 common words, none hidden; only pages with notes are indexed", () => {
  assert.ok(wordPages.length >= 2900 && wordPages.length <= 3200, `${wordPages.length} word pages`);
  for (const p of wordPages) {
    const w = p.path.slice("/word/".length);
    assert.ok(set.has(w), `${w} is visible`);
    assert.ok(w.length >= 3 && w.length <= 8);
  }
  assert.doesNotMatch(readPublic("sitemap-pages.xml"), /letterpile\.app\/word\//);
  assert.match(readPublic("word/planet.html"), /<meta name="robots" content="noindex, follow">/);
  const words = readPublic("sitemap-words.xml");
  const indexed = wordPages.filter(p => !p.noindex);
  assert.equal((words.match(/<loc>/g) || []).length, indexed.length);
  for (const p of indexed) assert.ok(words.includes(`/word/${p.path.slice(6)}</loc>`), p.path);
  assert.ok(m.pages.length <= 5000);
});

test("word pages: anagram, hook and length facts match a fresh count (sample of 60)", () => {
  const byKey = new Map();
  for (const w of visible) { const k = key(w); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(w); }
  const sample = wordPages.filter((_, i) => i % Math.ceil(wordPages.length / 60) === 0);
  for (const p of sample) {
    const w = p.path.slice(6), html = readPublic(p.file);
    const cell = label => +html.match(new RegExp(`<th>${label}</th><td>([^<]+)</td>`))[1].split(" / ")[0];
    assert.equal(cell("Letters"), w.length, w);
    assert.equal(cell("Anagrams"), byKey.get(key(w)).filter(x => x !== w).length, `${w} anagrams`);
    const front = [..."abcdefghijklmnopqrstuvwxyz"].filter(l => set.has(l + w)).length;
    const back = [..."abcdefghijklmnopqrstuvwxyz"].filter(l => set.has(w + l)).length;
    assert.ok(html.includes(`<th>Hooks (front / back)</th><td>${front} / ${back}</td>`), `${w} hooks`);
    const longer = visible.filter(v => v.length > w.length && v.includes(w)).length;
    assert.equal(cell("Longer words containing it"), longer, `${w} longer words`);
  }
});

test("curated lists: every listed word is visible and matches its list's rule", () => {
  const rules = { "words-with-q": w => w.includes("q"), "words-with-z": w => w.includes("z"), "words-with-x": w => w.includes("x"), "words-with-j": w => w.includes("j"), "words-without-vowels": w => !/[aeiou]/.test(w), "words-with-double-letters": w => /(.)\1/.test(w) };
  for (const [slug, rule] of Object.entries(rules)) {
    const html = readPublic(`lists/${slug}.html`);
    const listed = [...html.matchAll(/<p class="wordlist">([\s\S]*?)<\/p>/g)].flatMap(x => x[1].replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean));
    assert.ok(listed.length > 0, slug);
    for (const w of listed) { assert.ok(set.has(w), `${slug}: ${w} visible`); assert.ok(rule(w), `${slug}: ${w}`); }
  }
  const q = readPublic("lists/words-with-q.html");
  assert.ok(q.includes(`All ${visible.filter(w => w.includes("q")).length.toLocaleString("en-US")} words with a Q`));
});
