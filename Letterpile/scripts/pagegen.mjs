// Programmatic word-list pages, generated from the visible ENABLE list (blocklisted words
// excluded). Three families: by length, starting with, ending in. A list with more than
// `maxWordsOnOnePage` words becomes an overview that links to child pages (extended by one
// letter); children with fewer than `minWordsListPage` words are folded into the parent's
// "Other" section, so every word is on at least one indexable page.
//
// Every number in the copy comes from the data in this build and is wrapped in
// <span data-fact="..."> so tests can recompute it independently.
import { createHash } from "node:crypto";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const VOWELS = new Set("aeiou");
const up = s => s.toUpperCase();

// Deterministic choice among phrasings, keyed by the page, so pages differ but builds repeat.
function pick(key, slot, options) {
  const h = createHash("sha256").update(`${key}|${slot}`).digest();
  return options[h[0] % options.length];
}

export function buildTree({ clean, Engine, quality, fmt, esc, affixes }) {
  const MAX = quality.programmatic.maxWordsOnOnePage;
  const MIN = quality.programmatic.minWordsListPage;
  const MIN_AFFIX = quality.programmatic.minWordsCuratedAffix;
  const total = clean.length;
  const score = w => Engine.score(w, "scrabble");
  const code = w => `<code>${esc(up(w))}</code>`;
  const fact = (name, value, shown = value) => `<span data-fact="${name}" data-value="${esc(String(value))}">${shown}</span>`;
  const listOf = (ws, n) => { const a = ws.slice(0, n).map(code); return a.length > 1 ? `${a.slice(0, -1).join(", ")} and ${a.at(-1)}` : a.join(""); };
  const share = n => (100 * n / total);
  const shareText = n => { const s = share(n); return s >= 1 ? s.toFixed(1) : s >= 0.1 ? s.toFixed(2) : s.toFixed(3); };
  const set = new Set(clean);

  // ---------- families ----------
  const families = {
    length: {
      root: { path: "/words-by-length", name: "Words by Length" },
      label: n => `${n}-letter words`,
      top: () => Array.from({ length: 14 }, (_, i) => i + 2).map(n => ({ key: String(n), words: clean.filter(w => w.length === n) })),
      path: (n, prefix) => `/words-by-length/${n}-letter-words${prefix ? "/" + prefix : ""}`,
      // children of an n-letter node split by the next letter of the prefix
      split: (node) => LETTERS.split("").map(l => ({ prefix: (node.prefix || "") + l })).map(c => ({ ...c, words: node.words.filter(w => w.startsWith(c.prefix)) })),
    },
    starts: {
      root: { path: "/words-starting-with", name: "Words Starting With" },
      top: () => LETTERS.split("").map(l => ({ key: l, words: clean.filter(w => w.startsWith(l)) })),
      path: k => `/words-starting-with/${k}`,
      split: node => LETTERS.split("").map(l => node.key + l).map(k => ({ key: k, words: node.words.filter(w => w.startsWith(k) && w !== node.key) })),
    },
    ends: {
      root: { path: "/words-ending-in", name: "Words Ending In" },
      top: () => LETTERS.split("").map(l => ({ key: l, words: clean.filter(w => w.endsWith(l)) })),
      path: k => `/words-ending-in/${k}`,
      split: node => LETTERS.split("").map(l => l + node.key).map(k => ({ key: k, words: node.words.filter(w => w.endsWith(k) && w !== node.key) })),
    },
  };

  const nodes = [];
  const byPath = new Map();
  const rootFolded = { length: [], starts: [], ends: [] };

  function add(node) {
    nodes.push(node);
    byPath.set(node.path, node);
    if (node.words.length > MAX) {
      const fam = families[node.family];
      const kids = node.family === "length" ? fam.split(node) : fam.split(node);
      node.folded = [];
      node.children = [];
      // A word equal to the prefix itself (e.g. "re" on the "re" page) can't go to a child.
      if (node.family !== "length" && set.has(node.key)) node.folded.push(node.key);
      for (const k of kids) {
        if (!k.words.length) continue;
        if (k.words.length < MIN) { node.folded.push(...k.words); continue; }
        const child = node.family === "length"
          ? { family: "length", n: node.n, prefix: k.prefix, key: `${node.n}:${k.prefix}`, words: k.words, path: fam.path(node.n, k.prefix), parent: node }
          : { family: node.family, key: k.key, words: k.words, path: fam.path(k.key), parent: node };
        node.children.push(child);
        add(child);
      }
      node.folded.sort();
    }
  }

  for (const fam of ["length", "starts", "ends"]) {
    for (const t of families[fam].top()) {
      // Every length from 2 to 15 gets its page (the 2-letter list is just under 100 words).
      if (t.words.length < MIN && fam !== "length") { rootFolded[fam].push(...t.words); continue; }
      const node = fam === "length"
        ? { family: fam, n: +t.key, key: t.key, words: t.words, path: families.length.path(t.key), parent: null }
        : { family: fam, key: t.key, words: t.words, path: families[fam].path(t.key), parent: null };
      add(node);
    }
  }

  // Curated affixes: attach to the node with the same URL, or add a standalone page.
  for (const a of affixes) {
    const fam = a.type === "prefix" ? "starts" : "ends";
    const path = families[fam].path(a.affix);
    let node = byPath.get(path);
    if (!node) {
      const words = clean.filter(w => (fam === "starts" ? w.startsWith(a.affix) : w.endsWith(a.affix)) && w !== a.affix);
      if (words.length < MIN_AFFIX) continue;
      node = { family: fam, key: a.affix, words, path, parent: null, standalone: true };
      add(node);
    }
    node.curated = a;
  }
  return { nodes, byPath, families, rootFolded, total, helpers: { fact, code, listOf, shareText, score, set, pick } };
}

// ---------- stats ----------

export function stats(words, { family, key, set, score }) {
  const lens = words.map(w => w.length);
  const maxLen = Math.max(...lens), minLen = Math.min(...lens);
  const longest = words.filter(w => w.length === maxLen);
  const shortest = words.filter(w => w.length === minLen);
  let top = words[0], topScore = -1;
  for (const w of words) { const s = score(w); if (s > topScore || (s === topScore && w < top)) { top = w; topScore = s; } }
  const distinct = words.filter(w => new Set(w).size === w.length).length;
  const palindromes = words.filter(w => w.length > 1 && w === [...w].reverse().join(""));
  // Neighbor letters: next letter after the prefix, letter before the suffix, first letter for lengths.
  const nb = {};
  for (const w of words) {
    let c;
    if (family === "starts") c = w[key.length];
    else if (family === "ends") c = w[w.length - key.length - 1];
    else c = w[0];
    if (c) nb[c] = (nb[c] || 0) + 1;
  }
  const neighbors = Object.entries(nb).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  // Hooks: stays a word when the prefix/suffix is removed.
  let stems = [];
  if (family === "starts") stems = words.filter(w => set.has(w.slice(key.length)));
  if (family === "ends") stems = words.filter(w => set.has(w.slice(0, -key.length)));
  const ends = {};
  for (const w of words) if (w.length >= 3) { const e = w.slice(-2); ends[e] = (ends[e] || 0) + 1; }
  const topEnds = Object.entries(ends).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
  const vowelCounts = {};
  for (const w of words) { const v = [...w].filter(c => VOWELS.has(c)).length; vowelCounts[v] = (vowelCounts[v] || 0) + 1; }
  const avgLen = lens.reduce((a, b) => a + b, 0) / words.length;
  return { count: words.length, longest, shortest, maxLen, minLen, top, topScore, distinct, palindromes, neighbors, stems, topEnds, vowelCounts, avgLen };
}

// Words grouped under <h3> headings as plain text paragraphs (small DOM).
export function wordList(words, groupBy, label) {
  const groups = new Map();
  for (const w of words) { const g = groupBy(w); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(w); }
  return [...groups].sort((a, b) => (typeof a[0] === "number" ? a[0] - b[0] : String(a[0]).localeCompare(String(b[0]))))
    .map(([g, ws]) => `<h3>${label(g)} <span class="count">${ws.length.toLocaleString("en-US")}</span></h3>\n<p class="wordlist">${ws.join(" ")}</p>`).join("\n");
}
