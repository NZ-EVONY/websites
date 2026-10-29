(function (root, factory) {
  const LP = typeof module === "object" && module.exports ? require("./lp-engine.js") : root.LP;
  const api = factory(LP);
  if (typeof module === "object" && module.exports) module.exports = Object.assign({}, LP, api);
  else Object.assign(root.LP, api);
})(typeof self !== "undefined" ? self : this, function (LP) {
  "use strict";
  const { at, count, clone, remove, findWords } = LP;


  const same = (a, b) => a.length === b.length && a.every((c, i) => c.join("") === b[i].join(""));
  const collapsed = cols => cols.every((c, i) => c.length || cols.slice(i).every(x => !x.length));
  function insert(cols, w, rng, size) {
    const filled = cols.filter(c => c.length).length;
    for (let tries = 0; tries < 600; tries++) {
      let base = cols;
      if (filled && filled < size && rng() < 0.3) {
        const j = Math.floor(rng() * (filled + 1));
        base = [...cols.slice(0, j), [], ...cols.slice(j, size - 1)];
      }
      const width = Math.min(size, filled + 1 + (base === cols ? 0 : 1));
      const path = [];
      const used = new Set();
      let ok = true;
      for (let i = 0; i < w.length && ok; i++) {
        const opts = [];
        if (!i) for (let c = 0; c < width; c++) for (let r = 0; r < size; r++) opts.push([c, r]);
        else { const l = path[i - 1]; for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (dc || dr) opts.push([l[0] + dc, l[1] + dr]); }
        const good = opts.filter(([c, r]) => c >= 0 && c < width && r >= 0 && r < size && !used.has(c * 64 + r));
        if (!good.length) { ok = false; break; }
        const p = good[Math.floor(rng() * good.length)];
        used.add(p[0] * 64 + p[1]); path.push(p);
      }
      if (!ok) continue;
      const k = {};
      for (const [c] of path) k[c] = (k[c] || 0) + 1;
      if (Object.keys(k).some(c => base[c].length + k[c] > size || path.some(([pc, r]) => pc == c && r >= base[c].length + k[c]))) continue;
      const out = clone(base);
      for (const c in k) {
        const newLen = base[c].length + k[c];
        const col = Array(newLen).fill(null);
        path.forEach(([pc, r], i) => { if (pc == c) col[r] = w[i]; });
        const rest = base[c].slice();
        for (let r = 0; r < newLen; r++) if (col[r] == null) col[r] = rest.shift();
        out[c] = col;
      }
      if (!collapsed(out) || !same(remove(out, path), cols)) continue;
      return { cols: out, path };
    }
    return null;
  }

  function splitLengths(rng, total, n, min = 3, max = 8) {
    for (let t = 0; t < 1000; t++) {
      const ls = Array(n).fill(min);
      let left = total - n * min;
      while (left > 0) { const i = Math.floor(rng() * n); if (ls[i] < max) { ls[i]++; left--; } }
      if (left === 0) return ls;
    }
    return null;
  }

  function generate(rng, byLen, n, size = 5) {
    const lengths = splitLengths(rng, size * size, n, 3, Math.min(8, size + 3));
    if (!lengths) return null;
    let cols = Array.from({ length: size }, () => []);
    const placed = [];
    const usedWords = new Set();
    for (const len of lengths) {
      const pool = byLen[len] || [];
      let done = false;
      for (let t = 0; t < 40 && !done; t++) {
        const w = pool[Math.floor(rng() * pool.length)];
        if (!w || usedWords.has(w)) continue;
        const res = insert(cols, w, rng, size);
        if (res) { cols = res.cols; placed.push({ word: w, path: res.path }); usedWords.add(w); done = true; }
      }
      if (!done) return null;
    }
    return { cols, solution: placed.reverse() };
  }


  function solve(cols, dict, { max = 10, beam = 60, timeMs = 4000 } = {}) {
    const t0 = Date.now();
    let layer = [{ b: cols, moves: [] }];
    for (let depth = 1; depth < max; depth++) {
      const next = [];
      for (const s of layer) {
        if (Date.now() - t0 > timeMs) return null;
        for (const m of findWords(s.b, dict)) {
          const b = remove(s.b, m.path);
          const moves = [...s.moves, m];
          if (!count(b)) return moves;
          next.push({ b, moves, left: count(b) });
        }
      }
      if (!next.length) return null;
      next.sort((a, b) => a.left - b.left);
      const seen = new Set();
      layer = [];
      for (const s of next) {
        const key = s.b.map(c => c.join("")).join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        layer.push(s);
        if (layer.length >= beam) break;
      }
    }
    return null;
  }

  function lines(cols, size = 5) {
    const g = (c, r) => at(cols, [c, r]) || "";
    const out = [];
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dc, dr] of dirs) for (let c = 0; c < size; c++) for (let r = 0; r < size; r++) {
      if (g(c - dc, r - dr)) continue;
      let s = "";
      for (let k = 0; g(c + dc * k, r + dr * k); k++) s += g(c + dc * k, r + dr * k);
      if (s.length > 1) out.push(s, [...s].reverse().join(""));
    }
    return out;
  }

  return { insert, splitLengths, generate, solve, lines };
});
