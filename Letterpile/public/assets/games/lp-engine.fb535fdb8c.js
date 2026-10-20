/* Letterpile (the game) engine: board rules, word tracing and gravity. Shared by the player and
   the daily generator (Node). Generation and the solver are in lp-gen.js, loaded only by
   Practice mode and the generator.
   A board is an array of columns; each column lists its letters from the bottom up, so tiles
   "fall" simply by removing entries. A cell is [col, row] with row 0 at the bottom. When a column
   empties, the columns to its right slide left to close the gap. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LP = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const adjacent = (a, b) => Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && (a[0] !== b[0] || a[1] !== b[1]);
  const at = (cols, [c, r]) => (cols[c] && r < cols[c].length ? cols[c][r] : null);
  const count = cols => cols.reduce((n, col) => n + col.length, 0);
  const clone = cols => cols.map(c => c.slice());
  const word = (cols, path) => path.map(p => at(cols, p)).join("");

  function canTrace(cols, path) {
    const seen = new Set();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (at(cols, p) == null) return false;
      const k = p[0] * 64 + p[1];
      if (seen.has(k)) return false;
      seen.add(k);
      if (i && !adjacent(path[i - 1], p)) return false;
    }
    return true;
  }

  function drop(cols, path) {
    const out = clone(cols);
    const byCol = {};
    for (const [c, r] of path) (byCol[c] = byCol[c] || []).push(r);
    for (const c in byCol) for (const r of byCol[c].sort((a, b) => b - a)) out[c].splice(r, 1);
    return out;
  }
  function collapse(cols) {
    const out = cols.filter(c => c.length);
    while (out.length < cols.length) out.push([]);
    return out;
  }
  const remove = (cols, path) => collapse(drop(cols, path));

  function replay(cols, moves) {
    let b = cols;
    for (const m of moves) {
      if (!canTrace(b, m.path) || word(b, m.path) !== m.word) return null;
      b = remove(b, m.path);
    }
    return b;
  }


  function dictionary(words) {
    const list = words.slice().sort();
    const lower = s => { let lo = 0, hi = list.length; while (lo < hi) { const m = (lo + hi) >> 1; if (list[m] < s) lo = m + 1; else hi = m; } return lo; };
    return {
      size: list.length,
      has: w => { const i = lower(w); return list[i] === w; },
      prefix: p => { const i = lower(p); return i < list.length && list[i].startsWith(p); },
    };
  }


  function findWords(cols, dict, { min = 3, limit = Infinity } = {}) {
    const found = new Map();
    const cells = [];
    cols.forEach((col, c) => col.forEach((_, r) => cells.push([c, r])));
    const used = new Set();
    const walk = (path, s) => {
      if (found.size >= limit) return;
      if (s.length >= min && dict.has(s) && !found.has(s)) found.set(s, path.slice());
      const last = path[path.length - 1];
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const p = [last[0] + dc, last[1] + dr], ch = at(cols, p);
        if (ch == null) continue;
        const k = p[0] * 64 + p[1];
        if (used.has(k) || !dict.prefix(s + ch)) continue;
        used.add(k); path.push(p);
        walk(path, s + ch);
        path.pop(); used.delete(k);
      }
    };
    for (const p of cells) {
      const ch = at(cols, p);
      if (!dict.prefix(ch)) continue;
      used.add(p[0] * 64 + p[1]);
      walk([p], ch);
      used.delete(p[0] * 64 + p[1]);
    }
    return [...found].map(([w, path]) => ({ word: w, path }));
  }

  function findPath(cols, w) {
    const used = new Set();
    const walk = (path, i) => {
      if (i === w.length) return path.slice();
      const cands = [];
      if (!path.length) cols.forEach((col, c) => col.forEach((_, r) => cands.push([c, r])));
      else { const l = path[path.length - 1]; for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (dc || dr) cands.push([l[0] + dc, l[1] + dr]); }
      for (const p of cands) {
        if (at(cols, p) !== w[i]) continue;
        const k = p[0] * 64 + p[1];
        if (used.has(k)) continue;
        used.add(k); path.push(p);
        const res = walk(path, i + 1);
        path.pop(); used.delete(k);
        if (res) return res;
      }
      return null;
    };
    return walk([], 0);
  }

  function deadLetters(cols, words) {
    const have = {};
    let total = 0;
    for (const col of cols) for (const ch of col) { have[ch] = (have[ch] || 0) + 1; total++; }
    const letters = Object.keys(have), live = new Set(), need = {};
    for (const w of words) {
      if (live.size === letters.length) break;
      if (w.length > total || w.length < 3) continue;
      let ok = true;
      for (const ch in need) delete need[ch];
      for (const ch of w) { need[ch] = (need[ch] || 0) + 1; if (need[ch] > (have[ch] || 0)) { ok = false; break; } }
      if (ok) for (const ch of w) live.add(ch);
    }
    return new Set(letters.filter(ch => !live.has(ch)));
  }

  const VALUES = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };

  return { adjacent, at, count, clone, word, canTrace, drop, collapse, remove, replay, dictionary, findWords, findPath, deadLetters, VALUES };
});
