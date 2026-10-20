/* Word search core, shared by the daily generator (scripts/games/wordsearch.mjs, 20x20) and the
   printables page (any size): placing words, filling the grid and the checks every puzzle must
   pass (each word exactly once, at its recorded place; no blocklisted word readable outside the
   placed words). A grid is a string (or array) of size*size letters, row by row. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WSCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  const FILL = "eeeeeeeeeeeettttttttaaaaaaaaoooooooiiiiiiinnnnnnnsssssshhhhhhrrrrrrddddllllcccuuummmwwffggyyppbbvkjxqz";
  const rev = s => [...s].reverse().join("");
  const at = (g, size, r, c) => (r >= 0 && r < size && c >= 0 && c < size ? g[r * size + c] : null);
  function shuffle(r, a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function occurrences(grid, word, size) {
    const found = new Map();
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (grid[r * size + c] !== word[0]) continue;
      for (const [dr, dc] of DIRS) {
        let k = 0;
        while (k < word.length && at(grid, size, r + dr * k, c + dc * k) === word[k]) k++;
        if (k === word.length) {
          const cells = [...Array(k).keys()].map(j => (r + dr * j) * size + c + dc * j);
          found.set(cells.slice().sort((a, b) => a - b).join(","), cells);
        }
      }
    }
    return [...found.values()];
  }
  function lines(grid, size) {
    const out = [];
    for (const [dr, dc] of DIRS.slice(0, 4)) for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (at(grid, size, r - dr, c - dc) !== null) continue; // start only at an edge
      let s = "";
      for (let k = 0; at(grid, size, r + dr * k, c + dc * k) !== null; k++) s += at(grid, size, r + dr * k, c + dc * k);
      out.push(s, rev(s));
    }
    return out;
  }
  function offensive(grid, blocked, placed, size) {
    const inside = placed.map(cells => new Set(cells));
    const ls = lines(grid, size);
    return blocked.filter(b => b.length >= 3 && ls.some(l => l.includes(b)))
      .filter(b => occurrences(grid, b, size).some(occ => !inside.some(set => occ.every(i => set.has(i)))));
  }
  const cellsOf = (w, size) => {
    const [dr, dc] = DIRS[w.d];
    return [...Array(w.w.replace(/ /g, "").length).keys()].map(k => (w.r + dr * k) * size + w.c + dc * k);
  };

  function place(r, list, size, dirs = [0, 1, 2, 3, 4, 5, 6, 7]) {
    const g = Array(size * size).fill(null);
    const placed = [], used = new Set();
    for (const w of list) {
      const opts = [];
      for (const d of dirs) {
        const [dr, dc] = DIRS[d];
        for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
          const er = row + dr * (w.letters.length - 1), ec = col + dc * (w.letters.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          let overlap = 0, ok = true;
          for (let k = 0; k < w.letters.length && ok; k++) {
            const cell = g[(row + dr * k) * size + col + dc * k];
            if (cell === null) continue;
            if (cell === w.letters[k]) overlap++; else ok = false;
          }
          if (!ok || overlap === w.letters.length) continue;
          opts.push({ row, col, d, score: overlap * 4 + (used.has(d) ? 0 : 6) + r() * 3 });
        }
      }
      if (!opts.length) return null;
      opts.sort((a, b) => b.score - a.score);
      const o = opts[Math.floor(r() * Math.min(3, opts.length))];
      const [dr, dc] = DIRS[o.d];
      for (let k = 0; k < w.letters.length; k++) g[(o.row + dr * k) * size + o.col + dc * k] = w.letters[k];
      used.add(o.d);
      placed.push({ w: w.display, r: o.row, c: o.col, d: o.d });
    }
    return { g, placed, dirs: used.size };
  }
  const fill = (r, g) => g.map(x => x ?? FILL[Math.floor(r() * FILL.length)]).join("");

  function check(grid, size, words, blocked) {
    const errors = [];
    if (!new RegExp(`^[a-z]{${size * size}}$`).test(grid)) return [`grid must be ${size}x${size} letters`];
    for (const w of words) {
      const letters = w.w.replace(/ /g, "").toLowerCase();
      const [dr, dc] = DIRS[w.d] || [];
      if (dr === undefined) { errors.push(`"${w.w}" has no valid direction`); continue; }
      let s = "";
      for (let k = 0; k < letters.length; k++) s += at(grid, size, w.r + dr * k, w.c + dc * k) ?? "?";
      if (s !== letters) errors.push(`"${w.w}" is not at its recorded position`);
      const occ = occurrences(grid, letters, size).length;
      if (occ !== 1) errors.push(`"${w.w}" appears ${occ} times`);
    }
    if (new Set(words.map(w => w.w)).size !== words.length) errors.push("a word is listed twice");
    if (blocked && !errors.length) { const bad = offensive(grid, blocked, words.map(w => cellsOf(w, size)), size); if (bad.length) errors.push(`grid contains ${bad.length} blocklisted word(s) outside the placed words`); }
    return errors;
  }

  const LEVELS = {
    kids: { size: 10, count: [8, 10], maxLen: 7, dirs: [0, 1, 2] },
    teens: { size: 15, count: [14, 16], maxLen: 11, dirs: [0, 1, 2, 3, 4, 5] },
    adults: { size: 20, count: [25, 30], maxLen: 20, dirs: [0, 1, 2, 3, 4, 5, 6, 7] },
  };
  function printable(r, theme, level, blocked, tries = 400) {
    const L = LEVELS[level];
    const pool = theme.words.filter(w => w.letters.length >= 3 && w.letters.length <= L.maxLen && (level !== "kids" || !w.display.includes(" ")));
    for (let n = 0; n < tries; n++) {
      const k = Math.min(pool.length, L.count[0] + Math.floor(r() * (L.count[1] - L.count[0] + 1)));
      const list = shuffle(r, pool).slice(0, k).sort((a, b) => b.letters.length - a.letters.length);
      const res = place(r, list, L.size, L.dirs);
      if (!res) continue;
      for (let f = 0; f < 10; f++) {
        const grid = fill(r, res.g);
        const words = res.placed.slice().sort((a, b) => a.w.localeCompare(b.w));
        if (!check(grid, L.size, words, blocked).length) return { theme: theme.name, level, size: L.size, grid, words };
      }
    }
    return null;
  }

  return { DIRS, FILL, at, shuffle, occurrences, lines, offensive, cellsOf, place, fill, check, LEVELS, printable };
});
