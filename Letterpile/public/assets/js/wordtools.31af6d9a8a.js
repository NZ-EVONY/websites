(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WordTools = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  let LIST = [], SET = new Set(), BY_LEN = new Map(), PATTERNS = new Map(), COMMON = new Map();
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
    const pt = p => Math.min(tier(p[0]), tier(p[1]));
    pairs.sort((x, y) => pt(y) - pt(x) || x[0].length + x[1].length - y[0].length - y[1].length || (x.join() < y.join() ? -1 : 1));
    singles.sort(byTier);
    return { words, singles, pairs: pairs.slice(0, maxPairs), pairCount: pairs.length, letters: all.length };
  }


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
  function fits(c, p, key, used) {
    for (let i = 0; i < c.length; i++) {
      const k = key[c[i]];
      if (k ? k !== p[i] : used[p[i]] && used[p[i]] !== c[i]) return false;
    }
    return true;
  }
  const cipherWords = text => [...new Set(String(text || "").toLowerCase().split(/[^a-z']+/).map(w => w.replace(/'/g, "")).filter(Boolean))];

  function cryptogram(text, key = {}, { limit = 200, timeMs = 6000 } = {}) {
    const fixed = {}, usedFixed = {};
    for (const [c, p] of Object.entries(key)) if (/^[a-z]$/.test(c) && /^[a-z]$/.test(p)) { fixed[c] = p; usedFixed[p] = c; }
    const ws = cipherWords(text);
    const one = w => (w.length === 1 ? ["a", "i"] : byShape(w)); // the list has no one-letter words
    const cands = new Map(ws.map(w => [w, one(w).filter(p => fits(w, p, fixed, usedFixed)).sort(byTier)]));
    const stop = Date.now() + timeMs;
    let best = { score: -1, solved: 0, key: { ...fixed } }, steps = 0, timedOut = false;
    const k = { ...fixed }, u = { ...usedFixed };
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



  const CLASSIC = [
    "T..d...T...d..T", ".D...t...t...D.", "..D...d.d...D..", "d..D...d...D..d", "....D.....D....",
    ".t...t...t...t.", "..d...d.d...d..", "T..d...D...d..T", "..d...d.d...d..", ".t...t...t...t.",
    "....D.....D....", "d..D...d...D..d", "..D...d.d...D..", ".D...t...t...D.", "T..d...T...d..T",
  ].join("");

  function board(cells, bonus = CLASSIC, rack = "", { values = {}, bingo = 50, limit = 60 } = {}) {
    const N = 15, mid = 7;
    const tile = (r, c) => (r < 0 || c < 0 || r >= N || c >= N || cells[r * N + c] === "." ? null : cells[r * N + c]);
    const val = ch => (ch >= "a" && ch <= "z" ? values[ch] || 0 : 0);
    const first = !/[a-zA-Z]/.test(cells);
    const have = {};
    let blanks = 0, nRack = 0;
    for (const ch of String(rack).toLowerCase()) { if (ch === "?") { blanks++; nRack++; } else if (ch >= "a" && ch <= "z") { have[ch] = (have[ch] || 0) + 1; nRack++; } }
    if (!nRack) return [];
    const all = { ...have };
    for (const t of cells) if (/[a-zA-Z]/.test(t)) { const ch = t.toLowerCase(); all[ch] = (all[ch] || 0) + 1; }
    const cands = LIST.filter(w => {
      if (w.length < 2) return false;
      let short = 0;
      const n = {};
      for (const ch of w) { n[ch] = (n[ch] || 0) + 1; if (n[ch] > (all[ch] || 0) && ++short > blanks) return false; }
      return true;
    });
    const moves = new Map();
    for (const across of [true, false]) {
      if (first && !across) continue; // the first move scores the same either way
      const get = (i, j) => (across ? tile(i, j) : tile(j, i));
      const bon = (i, j) => (across ? bonus[i * N + j] : bonus[j * N + i]);
      for (let i = 0; i < N; i++) {
        const line = Array.from({ length: N }, (_, j) => get(i, j));
        const cross = line.map((t, j) => {
          if (t) return null;
          let up = "", down = "", base = 0;
          for (let k = i - 1; k >= 0 && get(k, j); k--) { up = get(k, j) + up; base += val(get(k, j)); }
          for (let k = i + 1; k < N && get(k, j); k++) { down += get(k, j); base += val(get(k, j)); }
          if (!up && !down) return { any: true };
          const u = up.toLowerCase(), d = down.toLowerCase(), ok = new Set();
          for (let c = 97; c <= 122; c++) { const ch = String.fromCharCode(c); if (SET.has(u + ch + d)) ok.add(ch); }
          return { any: false, ok, base, u, d };
        });
        const pool = { ...have };
        for (const t of line) if (t) { const ch = t.toLowerCase(); pool[ch] = (pool[ch] || 0) + 1; }
        const index = new Map(), need = {};
        for (const w of cands) {
          for (const ch in need) delete need[ch];
          let short = 0;
          for (const ch of w) { need[ch] = (need[ch] || 0) + 1; if (need[ch] > (pool[ch] || 0)) short++; }
          if (short > blanks) continue;
          for (let o = 0; o < w.length; o++) {
            const k = `${w.length}:${o}:${w[o]}`;
            if (!index.has(k)) index.set(k, []);
            index.get(k).push(w);
          }
        }
        const tryWords = (a, b) => {
          const len = b - a + 1;
          for (let j = a; j <= b; j++) if (line[j]) return index.get(`${len}:${j - a}:${line[j].toLowerCase()}`) || [];
          let best = -1;
          for (let j = a; j <= b; j++) if (!cross[j].any && (best < 0 || cross[j].ok.size < cross[best].ok.size)) best = j;
          if (best < 0) return [..."abcdefghijklmnopqrstuvwxyz"].flatMap(ch => index.get(`${len}:${mid - a}:${ch}`) || []);
          return [...cross[best].ok].flatMap(ch => index.get(`${len}:${best - a}:${ch}`) || []);
        };
        for (let a = 0; a < N; a++) {
          if (a && line[a - 1]) continue;
          let empties = 0, touches = false, center = false;
          for (let b = a; b < N; b++) {
            if (!line[b]) {
              if (!cross[b].any && !cross[b].ok.size) break;
              empties++;
              if (empties > nRack) break;
              if (!cross[b].any) touches = true;
              if (first && across && i === mid && b === mid) center = true;
            } else touches = true;
            if (b === a || (b + 1 < N && line[b + 1]) || !empties || !(first ? center : touches)) continue;
            for (const w of tryWords(a, b)) {
              let ok = true;
              const use = {};
              for (let j = a; j <= b && ok; j++) {
                const ch = w[j - a];
                if (line[j]) ok = line[j].toLowerCase() === ch;
                else { ok = cross[j].any || cross[j].ok.has(ch); use[ch] = (use[ch] || 0) + 1; }
              }
              if (!ok) continue;
              let short = 0;
              for (const ch in use) short += Math.max(0, use[ch] - (have[ch] || 0));
              if (short > blanks) continue;
              let wm = 1;
              for (let j = a; j <= b; j++) if (!line[j]) { const x = bon(i, j); if (x === "D") wm *= 2; else if (x === "T") wm *= 3; }
              const lmul = j => { const x = bon(i, j); return x === "d" ? 2 : x === "t" ? 3 : 1; };
              const cwm = j => { const x = bon(i, j); return x === "D" ? 2 : x === "T" ? 3 : 1; };
              const weight = j => lmul(j) * (wm + (cross[j].any ? 0 : cwm(j)));
              const blankAt = new Set();
              for (const ch in use) {
                let extra = use[ch] - (have[ch] || 0);
                if (extra <= 0) continue;
                const spots = [];
                for (let j = a; j <= b; j++) if (!line[j] && w[j - a] === ch) spots.push(j);
                spots.sort((x, y) => weight(x) - weight(y));
                for (const j of spots.slice(0, extra)) blankAt.add(j);
              }
              let main = 0, side = 0;
              const words = [w], tiles = [];
              for (let j = a; j <= b; j++) {
                const ch = w[j - a];
                if (line[j]) { main += val(line[j]); continue; }
                const v = blankAt.has(j) ? 0 : (values[ch] || 0);
                main += v * lmul(j);
                const [r, c] = across ? [i, j] : [j, i];
                tiles.push([r, c, ch, blankAt.has(j)]);
                if (!cross[j].any) { side += (cross[j].base + v * lmul(j)) * cwm(j); words.push(cross[j].u + ch + cross[j].d); }
              }
              const score = main * wm + side + (tiles.length === 7 ? bingo : 0);
              const key = tiles.map(t => t.join("")).join("|");
              const old = moves.get(key);
              if (!old || old.score < score) moves.set(key, { word: w, row: across ? i : a, col: across ? a : i, across, score, tiles, words });
            }
          }
        }
      }
    }
    return [...moves.values()].sort((x, y) => y.score - x.score || tier(y.word) - tier(x.word) || (x.word < y.word ? -1 : 1)).slice(0, limit);
  }


  function wordInfo(input, { limit = 120 } = {}) {
    const w = letters(input);
    if (!w) return null;
    const count = s => { const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; return c; };
    const have = count(w), key = [...w].sort().join("");
    const anagrams = [], inside = [], longer = [];
    for (const v of LIST) {
      if (v === w) continue;
      if (v.length === w.length) { if ([...v].sort().join("") === key) anagrams.push(v); }
      else if (v.length < w.length && v.length >= 3) { const c = count(v); if (Object.keys(c).every(ch => c[ch] <= (have[ch] || 0))) inside.push(v); }
      else if (v.length > w.length && v.includes(w)) longer.push(v);
    }
    inside.sort((a, b) => b.length - a.length || tier(b) - tier(a) || (a < b ? -1 : 1));
    longer.sort((a, b) => a.length - b.length || tier(b) - tier(a) || (a < b ? -1 : 1));
    const AZ = [..."abcdefghijklmnopqrstuvwxyz"];
    return {
      word: w, known: SET.has(w), common: tier(w), anagrams,
      inside: inside.slice(0, limit), insideCount: inside.length, longer: longer.slice(0, 80), longerCount: longer.length,
      front: AZ.map(l => l + w).filter(isWord), back: AZ.map(l => w + l).filter(isWord),
    };
  }

  const tiers = ws => ws.filter(w => tier(w));
  const api = { use, commonMap, tier, tiers, isWord, ofLength, hasPrefix, hive, grid, boxWords, box, ladder, hangman, shape, cryptogram, cipherWords, board, CLASSIC, wordInfo };

  return api;
});
