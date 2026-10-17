/* Word tools engine: the searches behind the Letter Hive, Word Grid, Letter Box, Word Ladder,
   Hangman and Cryptogram solvers. Pure functions over a word list, so they run in Node (tests,
   build-time examples) and in js/tools-worker.js. Pages talk to the worker through
   js/wt-client.js, which loads this file on the page only if workers are unavailable. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WordTools = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  let LIST = [], SET = new Set(), BY_LEN = new Map(), PATTERNS = new Map(), COMMON = new Map();
  // The list to search (sorted, lowercase a-z words), and how common words are: a Map of word to
  // 2 (very common) or 1 (common), from the SCOWL lists. Words not in it count as 0.
  function use(list, common) {
    if (common) COMMON = common;
    if (list === LIST) return;
    LIST = list;
    SET = new Set(list);
    BY_LEN = new Map();
    PATTERNS = new Map();
  }
  const isWord = w => SET.has(w);
  const tier = w => COMMON.get(w) || 0;
  const byTier = (a, b) => tier(b) - tier(a);
  // "w w w|w w w" (very common, then common) -> Map, as shipped in /data/common.*.js.
  function commonMap(text) {
    const m = new Map();
    String(text || "").split("|").forEach((part, i) => { for (const w of part.split(" ")) if (w) m.set(w, i ? 1 : 2); });
    return m;
  }
  function ofLength(n) {
    if (!BY_LEN.has(n)) BY_LEN.set(n, LIST.filter(w => w.length === n));
    return BY_LEN.get(n);
  }
  function hasPrefix(p) {
    let lo = 0, hi = LIST.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (LIST[m] < p) lo = m + 1; else hi = m; }
    return lo < LIST.length && LIST[lo].startsWith(p);
  }
  const letters = s => String(s || "").toLowerCase().replace(/[^a-z]/g, "");

  // ---------- Letter Hive: 7 letters, one required ----------

  function hive(input, center, { min = 4 } = {}) {
    const ls = new Set(letters(input));
    const c = letters(center)[0];
    if (!c) return [];
    ls.add(c);
    const out = [];
    for (const w of LIST) {
      if (w.length < min || !w.includes(c)) continue;
      let ok = true;
      for (let i = 0; i < w.length && ok; i++) ok = ls.has(w[i]);
      if (ok) out.push({ word: w, pangram: [...ls].every(l => w.includes(l)), common: tier(w) });
    }
    return out;
  }

  // ---------- Word Grid: words through touching tiles ----------

  // tiles: rows of strings, each a letter or "qu". Returns words with one path each (cell indexes).
  function grid(tiles, { min = 3, limit = 5000 } = {}) {
    const rows = tiles.length, cols = rows ? tiles[0].length : 0;
    const cell = (r, c) => (r >= 0 && c >= 0 && r < rows && c < cols ? tiles[r][c] : "");
    const found = new Map();
    const used = new Set();
    const walk = (r, c, s, path) => {
      if (found.size >= limit) return;
      if (s.length >= min && SET.has(s) && !found.has(s)) found.set(s, path.slice());
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc, t = cell(nr, nc), k = nr * cols + nc;
        if (!t || used.has(k) || !hasPrefix(s + t)) continue;
        used.add(k); path.push(k);
        walk(nr, nc, s + t, path);
        path.pop(); used.delete(k);
      }
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = cell(r, c), k = r * cols + c;
      if (!t || !hasPrefix(t)) continue;
      used.add(k);
      walk(r, c, t, [k]);
      used.delete(k);
    }
    return [...found].map(([word, path]) => ({ word, path, common: tier(word) })).sort((a, b) => b.word.length - a.word.length || b.common - a.common || (a.word < b.word ? -1 : 1));
  }

  // ---------- Letter Box: 12 letters on 4 sides ----------

  // A word may use only the box's letters, and no two letters in a row from the same side.
  function boxWords(sides, { min = 3 } = {}) {
    const side = {};
    sides.forEach((s, i) => { for (const ch of letters(s)) side[ch] = i; });
    const out = [];
    for (const w of LIST) {
      if (w.length < min) continue;
      let ok = side[w[0]] != null;
      for (let i = 1; i < w.length && ok; i++) ok = side[w[i]] != null && side[w[i]] !== side[w[i - 1]];
      if (ok) out.push(w);
    }
    return out;
  }
  // Every word, plus one- and two-word solutions (each word starts with the last letter of the
  // one before, and together they use all the letters), shortest first.
  function box(sides, { min = 3, maxPairs = 300 } = {}) {
    const all = [...new Set(sides.map(letters).join(""))];
    const bit = Object.fromEntries(all.map((ch, i) => [ch, 1 << i]));
    const full = (1 << all.length) - 1;
    const words = boxWords(sides, { min });
    const mask = w => { let m = 0; for (const ch of w) m |= bit[ch]; return m; };
    const info = words.map(w => ({ w, m: mask(w) }));
    const byFirst = {};
    for (const x of info) (byFirst[x.w[0]] = byFirst[x.w[0]] || []).push(x);
    const singles = info.filter(x => x.m === full).map(x => x.w);
    const pairs = [];
    for (const a of info) for (const b of byFirst[a.w[a.w.length - 1]] || []) if ((a.m | b.m) === full && a !== b) pairs.push([a.w, b.w]);
    // Pairs of common words first, then the fewest letters.
    const pt = p => Math.min(tier(p[0]), tier(p[1]));
    pairs.sort((x, y) => pt(y) - pt(x) || x[0].length + x[1].length - y[0].length - y[1].length || (x.join() < y.join() ? -1 : 1));
    singles.sort(byTier);
    return { words, singles, pairs: pairs.slice(0, maxPairs), pairCount: pairs.length, letters: all.length };
  }

  // ---------- Word Ladder: change one letter at a time ----------

  // Shortest ladder from a to b through words of the same length, or null. avoid: words to skip.
  // common: steps must be common words (the two ends can be any word).
  function ladder(a, b, { avoid = [], common = false } = {}) {
    a = letters(a); b = letters(b);
    if (a.length !== b.length || !SET.has(a) || !SET.has(b)) return null;
    if (a === b) return [a];
    const skip = new Set(avoid.map(letters));
    const prev = new Map([[a, null]]);
    let frontier = [a];
    while (frontier.length) {
      const next = [];
      for (const w of frontier) {
        for (let i = 0; i < w.length; i++) for (let c = 97; c <= 122; c++) {
          const ch = String.fromCharCode(c);
          if (ch === w[i]) continue;
          const v = w.slice(0, i) + ch + w.slice(i + 1);
          if (prev.has(v) || !SET.has(v) || skip.has(v) || (common && v !== b && !tier(v))) continue;
          prev.set(v, w);
          if (v === b) { const path = []; for (let x = b; x; x = prev.get(x)) path.unshift(x); return path; }
          next.push(v);
        }
      }
      frontier = next;
    }
    return null;
  }

  // ---------- Hangman: pattern plus wrong letters ----------

  // pattern: letters for known spots, anything else (_ ? . -) for blanks. A letter shown once is
  // shown everywhere it occurs, so blanks can't hold a revealed letter.
  function hangman(pattern, wrong = "", { limit = 800 } = {}) {
    const p = String(pattern || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "_");
    const shown = new Set(p.replace(/_/g, ""));
    const bad = new Set(letters(wrong));
    const words = ofLength(p.length).filter(w => {
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (p[i] === "_" ? shown.has(ch) || bad.has(ch) : p[i] !== ch) return false;
      }
      return true;
    });
    const count = {};
    for (const w of words) for (const ch of new Set(w)) if (!shown.has(ch)) count[ch] = (count[ch] || 0) + 1;
    const next = Object.entries(count).filter(([ch]) => !bad.has(ch)).map(([letter, n]) => ({ letter, n })).sort((x, y) => y.n - x.n || (x.letter < y.letter ? -1 : 1));
    words.sort(byTier);
    return { total: words.length, words: words.slice(0, limit).map(w => ({ word: w, common: tier(w) })), next };
  }

  // ---------- Cryptogram: substitution cipher ----------

  // "hello" -> "abccd": the shape a cipher word and its answer share.
  function shape(w) {
    const m = {};
    let n = 0, s = "";
    for (const ch of w) { if (!(ch in m)) m[ch] = String.fromCharCode(97 + n++); s += m[ch]; }
    return s;
  }
  function byShape(s) {
    if (!PATTERNS.has(s.length)) {
      const m = new Map();
      for (const w of ofLength(s.length)) { const k = shape(w); if (!m.has(k)) m.set(k, []); m.get(k).push(w); }
      PATTERNS.set(s.length, m);
    }
    return PATTERNS.get(s.length).get(shape(s)) || [];
  }
  // Does plain word p fit cipher word c, given a partial key (cipher -> plain) and its reverse?
  function fits(c, p, key, used) {
    for (let i = 0; i < c.length; i++) {
      const k = key[c[i]];
      if (k ? k !== p[i] : used[p[i]] && used[p[i]] !== c[i]) return false;
    }
    return true;
  }
  const cipherWords = text => [...new Set(String(text || "").toLowerCase().split(/[^a-z']+/).map(w => w.replace(/'/g, "")).filter(Boolean))];

  // key: { cipherLetter: plainLetter } set by the solver's user. Returns each cipher word's
  // candidates, and a suggested full key: the one that turns the most words into real words.
  function cryptogram(text, key = {}, { limit = 200, timeMs = 1500 } = {}) {
    const fixed = {}, usedFixed = {};
    for (const [c, p] of Object.entries(key)) if (/^[a-z]$/.test(c) && /^[a-z]$/.test(p)) { fixed[c] = p; usedFixed[p] = c; }
    const ws = cipherWords(text);
    const one = w => (w.length === 1 ? ["a", "i"] : byShape(w)); // the list has no one-letter words
    const cands = new Map(ws.map(w => [w, one(w).filter(p => fits(w, p, fixed, usedFixed)).sort(byTier)]));
    const stop = Date.now() + timeMs;
    // A solution scores, for each word it solves, the word's length times 1, 2 or 3 (uncommon,
    // common, very common), so explaining more letters with everyday words wins.
    let best = { score: -1, solved: 0, key: { ...fixed } }, steps = 0, timedOut = false;
    const k = { ...fixed }, u = { ...usedFixed };
    // Depth-first, always taking next the word with the fewest candidates that still fit.
    const search = (left, score, solved) => {
      if (score + 3 * left.reduce((n, w) => n + w.length, 0) <= best.score) return;
      if (++steps % 64 === 0 && Date.now() > stop) { timedOut = true; return; }
      if (!left.length) { best = { score, solved, key: { ...k } }; return; }
      let pick = -1, opts = null;
      for (let i = 0; i < left.length; i++) {
        const o = cands.get(left[i]).filter(p => fits(left[i], p, k, u));
        if (!opts || o.length < opts.length) { pick = i; opts = o; }
        if (!o.length) break;
      }
      const w = left[pick], rest = left.filter((_, i) => i !== pick);
      for (const p of opts) {
        const added = [];
        for (let j = 0; j < w.length; j++) if (!k[w[j]]) { k[w[j]] = p[j]; u[p[j]] = w[j]; added.push(w[j]); }
        search(rest, score + w.length * (1 + (w.length === 1 ? 2 : tier(p))), solved + 1);
        for (const c of added) { delete u[k[c]]; delete k[c]; }
        if (timedOut || best.score === full) return;
      }
      search(rest, score, solved); // leave this word unsolved (a name, or a word not in the list)
    };
    const order = ws.filter(w => cands.get(w).length);
    const full = 3 * order.reduce((n, w) => n + w.length, 0);
    search(order, 0, 0);
    return {
      words: ws.map(w => ({ word: w, total: cands.get(w).length, candidates: cands.get(w).slice(0, limit) })),
      suggestion: best.key, solved: best.solved, solvable: order.length, complete: !timedOut,
    };
  }

  const tiers = ws => ws.filter(w => tier(w));
  const api = { use, commonMap, tier, tiers, isWord, ofLength, hasPrefix, hive, grid, boxWords, box, ladder, hangman, shape, cryptogram, cipherWords };

  return api;
});
