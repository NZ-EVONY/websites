// Crossword grids: 15x15 black-square patterns in the standard daily format, numbering, and a
// backtracking filler. Shared by crossword.mjs (generation and validation) and the tests.
// A grid is a 225-character string: "#" for a black square, a letter (or ".") for a white one.

export const N = 15;
export const LIMITS = { minWords: 70, maxWords: 78, minLen: 3, maxLen: 11 };
// Patterns the generator aims for (inside LIMITS): more, shorter entries fill more cleanly.
export const TARGET = { minWords: 72, maxWords: 78, minLen: 3, maxLen: 10, maxBlocks: 42 };

const idx = (r, c) => r * N + c;

// Slots (entries) of a pattern, numbered in reading order. Each slot: { n, dir: "A"|"D", r, c, len, cells }.
export function slots(grid) {
  const white = i => grid[i] !== "#";
  const out = [];
  let n = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = idx(r, c);
    if (!white(i)) continue;
    const startA = (c === 0 || !white(i - 1)) && c + 1 < N && white(i + 1);
    const startD = (r === 0 || !white(i - N)) && r + 1 < N && white(i + N);
    if (!startA && !startD) continue;
    n++;
    if (startA) { const cells = []; for (let k = c; k < N && white(idx(r, k)); k++) cells.push(idx(r, k)); out.push({ n, dir: "A", r, c, len: cells.length, cells }); }
    if (startD) { const cells = []; for (let k = r; k < N && white(idx(k, c)); k++) cells.push(idx(k, c)); out.push({ n, dir: "D", r, c, len: cells.length, cells }); }
  }
  return out;
}

// Problems with a pattern: symmetry, short entries, unchecked squares, connectivity, word count.
export function checkPattern(grid, limits = LIMITS) {
  const errors = [];
  if (grid.length !== N * N) return [`grid has ${grid.length} squares, not ${N * N}`];
  for (let i = 0; i < N * N; i++) if ((grid[i] === "#") !== (grid[N * N - 1 - i] === "#")) { errors.push("black squares are not rotationally symmetric"); break; }
  // Every white square must be in an across entry and a down entry of at least minLen letters.
  const runLen = (i, step, ok) => { let a = i, b = i; while (ok(a, -step)) a -= step; while (ok(b, step)) b += step; return (b - a) / step + 1; };
  const okA = (i, s) => { const j = i + s; return Math.floor(j / N) === Math.floor(i / N) && j >= 0 && j < N * N && grid[j] !== "#"; };
  const okD = (i, s) => { const j = i + s * N / N; return j >= 0 && j < N * N && grid[j] !== "#"; };
  let short = null, long = null;
  for (let i = 0; i < N * N; i++) {
    if (grid[i] === "#") continue;
    const a = runLen(i, 1, okA), d = runLen(i, N, (x, s) => okD(x, s));
    if (short == null && (a < limits.minLen || d < limits.minLen)) short = i;
    if (long == null && (a > limits.maxLen || d > limits.maxLen)) long = i;
  }
  const at = i => `r${Math.floor(i / N) + 1}c${i % N + 1}`;
  if (short != null) errors.push(`square ${at(short)} is in an entry shorter than ${limits.minLen} letters (or unchecked)`);
  if (long != null) errors.push(`entry longer than ${limits.maxLen} letters at ${at(long)}`);
  // All white squares connected.
  const start = [...grid].findIndex(ch => ch !== "#");
  const seen = new Set([start]), stack = [start];
  while (stack.length) {
    const i = stack.pop();
    for (const j of [i - N, i + N, i % N ? i - 1 : -1, (i + 1) % N ? i + 1 : -1]) if (j >= 0 && j < N * N && grid[j] !== "#" && !seen.has(j)) { seen.add(j); stack.push(j); }
  }
  if (seen.size !== [...grid].filter(ch => ch !== "#").length) errors.push("the white squares are not all connected");
  const count = slots(grid).length;
  if (count < limits.minWords || count > limits.maxWords) errors.push(`${count} entries (allowed ${limits.minWords}-${limits.maxWords})`);
  return errors;
}

// Random symmetric pattern: add black squares in symmetric pairs while every square stays in
// entries of minLen..maxLen letters, until the entry count is in range.
export function makePattern(r, limits = TARGET) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const g = Array(N * N).fill(".");
    let guard = 0;
    while (guard++ < 2000) {
      const s = slots(g.join(""));
      const long = s.filter(x => x.len > limits.maxLen);
      if (!long.length && s.length >= limits.minWords) break;
      // Break up the longest entries first; otherwise any random square.
      const pool = long.length ? long : s;
      const slot = pool[Math.floor(r() * pool.length)];
      const i = slot.cells[Math.floor(r() * slot.len)];
      const j = N * N - 1 - i;
      if (g[i] === "#") continue;
      const before = [g[i], g[j]];
      g[i] = g[j] = "#";
      if (!locallyOk(g, i, limits) || !locallyOk(g, j, limits)) { g[i] = before[0]; g[j] = before[1]; }
    }
    const grid = g.join("");
    if (limits.maxBlocks && g.filter(x => x === "#").length > limits.maxBlocks) continue;
    if (limits.maxOpen && openBlock(g, limits.maxOpen + 1)) continue;
    if (!checkPattern(grid, limits).length) return grid;
  }
  return null;
}
// True if some k x k square of the grid is all white (a solid corner that needs a big word list).
function openBlock(g, k) {
  for (let r = 0; r + k <= N; r++) for (let c = 0; c + k <= N; c++) {
    let all = true;
    for (let i = 0; i < k && all; i++) for (let j = 0; j < k && all; j++) if (g[idx(r + i, c + j)] === "#") all = false;
    if (all) return true;
  }
  return false;
}
// After blacking out square i, the runs on either side (across and down) must be 0 or >= minLen.
function locallyOk(g, i, limits) {
  const r = Math.floor(i / N), c = i % N;
  const run = (rr, cc, dr, dc) => { let n = 0; while (rr >= 0 && rr < N && cc >= 0 && cc < N && g[idx(rr, cc)] !== "#") { n++; rr += dr; cc += dc; } return n; };
  for (const n of [run(r, c - 1, 0, -1), run(r, c + 1, 0, 1), run(r - 1, c, -1, 0), run(r + 1, c, 1, 0)]) if (n > 0 && n < limits.minLen) return false;
  return true;
}

// ---------- filler ----------

// Index of a word list: for each length, the words, plus for each (position, letter) a bitset
// of which words have that letter there.
export function indexWords(words) {
  const byLen = new Map();
  for (const w of words) { if (!byLen.has(w.length)) byLen.set(w.length, []); byLen.get(w.length).push(w); }
  const index = new Map();
  for (const [len, list] of byLen) {
    const W = Math.ceil(list.length / 32);
    const pos = [...Array(len)].map(() => new Map());
    list.forEach((w, k) => {
      for (let p = 0; p < len; p++) {
        if (!pos[p].has(w[p])) pos[p].set(w[p], new Uint32Array(W));
        pos[p].get(w[p])[k >> 5] |= 1 << (k & 31);
      }
    });
    index.set(len, { list, W, pos });
  }
  return index;
}

// Fills a pattern with words from the index. score(word) ranks candidates (higher first; add
// randomness there); banned is a Set of words not to use. Returns the filled grid or null.
export function fill(pattern, index, { score, banned = new Set(), maxSteps = 200000, width = 30, stats } = {}) {
  const S = slots(pattern);
  const cells = [...pattern];
  const crossing = S.map(s => s.cells.map(ci => S.findIndex(t => t !== s && t.cells.includes(ci))));
  const assigned = Array(S.length).fill(null);
  const used = new Set();
  let steps = 0;

  // Candidate bitset for a slot given the letters currently in its cells.
  function candidates(si) {
    const s = S[si], ix = index.get(s.len);
    if (!ix) return null;
    let bits = null;
    for (let p = 0; p < s.len; p++) {
      const ch = cells[s.cells[p]];
      if (ch === ".") continue;
      const b = ix.pos[p].get(ch);
      if (!b) return new Uint32Array(ix.W);
      if (!bits) bits = b.slice(); else for (let k = 0; k < ix.W; k++) bits[k] &= b[k];
    }
    if (!bits) { bits = new Uint32Array(ix.W).fill(0xFFFFFFFF); const extra = ix.W * 32 - ix.list.length; if (extra) bits[ix.W - 1] >>>= extra; }
    return bits;
  }
  const popcount = bits => { let n = 0; for (let x of bits) { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); n += (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; } return n; };
  const listOf = (si, bits) => { const ix = index.get(S[si].len), out = []; for (let k = 0; k < ix.W; k++) { let x = bits[k]; while (x) { const t = x & -x; out.push(ix.list[(k << 5) + 31 - Math.clz32(t)]); x ^= t; } } return out; };

  // Assigned slots that put letters into slot si (they constrain it).
  const constrainers = si => crossing[si].filter(t => t >= 0 && assigned[t]);
  const ABORT = "abort";

  // Backtracking with conflict-directed backjumping: a dead end returns the set of assigned
  // slots responsible, and levels not in that set are skipped on the way back.
  function solve() {
    if (++steps > maxSteps) return ABORT;
    // Most constrained open slot.
    let best = -1, bestBits = null, bestN = Infinity;
    for (let si = 0; si < S.length; si++) {
      if (assigned[si]) continue;
      const b = candidates(si);
      const n = b ? popcount(b) : 0;
      if (n === 0) return new Set(constrainers(si));
      if (n < bestN) { best = si; bestBits = b; bestN = n; if (n === 1) break; }
    }
    if (best < 0) return true;
    const conf = new Set(constrainers(best));
    const opts = listOf(best, bestBits).filter(w => !used.has(w) && !banned.has(w));
    const s = S[best];
    // Look-ahead: try the best-scoring words first, ordered by how many options they leave the
    // crossing slots (the sum of the logs of their candidate counts); words that leave a
    // crossing slot with none are skipped, and that slot's other constrainers join the conflict set.
    const top = opts.map(w => [w, score(w)]).sort((x, y) => y[1] - x[1]).slice(0, width);
    const ranked = [];
    for (const [w, sc] of top) {
      const prev = s.cells.map(ci => cells[ci]);
      s.cells.forEach((ci, k) => { cells[ci] = w[k]; });
      let room = 0;
      for (const t of crossing[best]) if (t >= 0 && !assigned[t]) {
        const b = candidates(t); const n = b ? popcount(b) : 0;
        if (!n) { room = -Infinity; for (const x of constrainers(t)) conf.add(x); break; }
        room += Math.log(n);
      }
      s.cells.forEach((ci, k) => { cells[ci] = prev[k]; });
      if (room > -Infinity) ranked.push([w, room + sc]);
    }
    ranked.sort((x, y) => y[1] - x[1]);
    for (const [w] of ranked) {
      const prev = s.cells.map(ci => cells[ci]);
      s.cells.forEach((ci, k) => { cells[ci] = w[k]; });
      assigned[best] = w; used.add(w);
      if (stats) { const k = assigned.filter(Boolean).length; if (k > (stats.max || 0)) stats.max = k; stats.total = S.length; }
      const res = solve();
      if (res === true) return true;
      assigned[best] = null; used.delete(w);
      s.cells.forEach((ci, k) => { cells[ci] = prev[k]; });
      if (res === ABORT) return ABORT;
      if (!res.has(best)) return res; // the dead end doesn't involve this slot: jump back further
      for (const x of res) if (x !== best) conf.add(x);
    }
    conf.delete(best);
    return conf;
  }
  return solve() === true ? cells.join("") : null;
}

// ---------- filler with constraint propagation ----------
// State: for each white square, a 26-bit mask of letters still allowed there. A slot's
// candidates are the words whose letters are allowed in all its squares; each square keeps
// only letters that some candidate of its across slot AND of its down slot puts there.
// Propagating this to a fixed point after every choice finds dead ends early.
const A = 97;
export function fillAC(pattern, index, { score, banned = new Set(), maxSteps = 20000, stats, top = 120, weight = 1, deep = 12, cells = false, jitter = () => 0, given = null } = {}) {
  const S = slots(pattern);
  const cellSlots = new Map();
  S.forEach((s, si) => s.cells.forEach((ci, p) => { if (!cellSlots.has(ci)) cellSlots.set(ci, []); cellSlots.get(ci).push([si, p]); }));
  const FULL = (1 << 26) - 1;
  for (const s of S) if (!index.has(s.len)) return null;
  // Per slot, per position: letter -> bitset (from the index).
  const W = S.map(s => index.get(s.len).W);
  let steps = 0;

  function candidates(si, masks) {
    const s = S[si], ix = index.get(s.len), w = W[si];
    let bits = null;
    for (let p = 0; p < s.len; p++) {
      const m = masks[s.cells[p]];
      if (m === FULL) continue;
      const or = new Uint32Array(w);
      for (let L = 0; L < 26; L++) if (m & (1 << L)) { const b = ix.pos[p].get(String.fromCharCode(A + L)); if (b) for (let k = 0; k < w; k++) or[k] |= b[k]; }
      if (!bits) bits = or; else for (let k = 0; k < w; k++) bits[k] &= or[k];
    }
    if (!bits) { bits = new Uint32Array(w).fill(0xFFFFFFFF); const extra = w * 32 - ix.list.length; if (extra) bits[w - 1] >>>= extra; }
    return bits;
  }
  const any = bits => { for (const x of bits) if (x) return true; return false; };
  const count = bits => { let n = 0; for (let x of bits) { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); n += (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; } return n; };
  // Letters present at position p among the candidate words.
  function lettersAt(si, p, bits, allowed) {
    const ix = index.get(S[si].len);
    let out = 0;
    for (let L = 0; L < 26; L++) {
      if (!(allowed & (1 << L))) continue;
      const b = ix.pos[p].get(String.fromCharCode(A + L));
      if (!b) continue;
      for (let k = 0; k < bits.length; k++) if (bits[k] & b[k]) { out |= 1 << L; break; }
    }
    return out;
  }
  // Letter codes of every word, per length: codes[k * len + p] is letter p of word k (0-25).
  const codes = new Map();
  for (const [len, ix] of index) { const c = new Uint8Array(ix.list.length * len); ix.list.forEach((w, k) => { for (let p = 0; p < len; p++) c[k * len + p] = w.charCodeAt(p) - A; }); codes.set(len, c); }
  const SCAN = 3000; // below this many candidates, scan the words instead of combining bitsets

  // Narrow slot si's candidates to the current masks; also returns the letters each position can
  // still take. Scans the previous candidates word by word when there are few of them.
  function narrow(si, masks, prev) {
    const s = S[si], len = s.len, ms = s.cells.map(ci => masks[ci]);
    if (prev && count(prev) <= SCAN) {
      const c = codes.get(len), bits = new Uint32Array(prev.length), seen = new Int32Array(len);
      for (let q = 0; q < prev.length; q++) {
        let x = prev[q];
        while (x) {
          const t = x & -x; x ^= t;
          const k = (q << 5) + 31 - Math.clz32(t), base = k * len;
          let ok = true;
          for (let p = 0; p < len; p++) if (!(ms[p] & (1 << c[base + p]))) { ok = false; break; }
          if (ok) { bits[q] |= t; for (let p = 0; p < len; p++) seen[p] |= 1 << c[base + p]; }
        }
      }
      return { bits, seen };
    }
    const bits = candidates(si, masks);
    return { bits, seen: s.cells.map((ci, p) => lettersAt(si, p, bits, masks[ci])) };
  }
  // Propagate from the given slots; returns false on a contradiction. Updates masks and cand.
  function propagate(masks, cand, queue) {
    const inQ = new Set(queue);
    while (queue.length) {
      const si = queue.shift(); inQ.delete(si);
      const { bits, seen } = narrow(si, masks, cand[si]);
      if (!any(bits)) return false;
      cand[si] = bits;
      const s = S[si];
      for (let p = 0; p < s.len; p++) {
        const ci = s.cells[p];
        const m = masks[ci] & seen[p];
        if (m !== masks[ci]) {
          if (!m) return false;
          masks[ci] = m;
          for (const [sj] of cellSlots.get(ci)) if (sj !== si && !inQ.has(sj)) { queue.push(sj); inQ.add(sj); }
        }
      }
    }
    return true;
  }
  const listOf = (si, bits) => { const ix = index.get(S[si].len), out = []; for (let k = 0; k < bits.length; k++) { let x = bits[k]; while (x) { const t = x & -x; out.push(ix.list[(k << 5) + 31 - Math.clz32(t)]); x ^= t; } } return out; };
  const single = m => m && !(m & (m - 1));

  const masks0 = new Int32Array(N * N).fill(FULL);
  // Letters already given (repairing part of a filled grid): fixed squares.
  if (given) for (let i = 0; i < N * N; i++) if (/[a-z]/.test(given[i])) masks0[i] = 1 << (given.charCodeAt(i) - A);
  const cand0 = S.map(() => null);
  if (!propagate(masks0, cand0, S.map((_, i) => i))) return null;

  function solve(masks, cand, used) {
    if (++steps > maxSteps) return null;
    // Slots whose squares are all decided are words; check for repeats.
    let best = -1, bestN = Infinity;
    const words = new Set();
    for (let si = 0; si < S.length; si++) {
      const n = count(cand[si]);
      if (n === 1 && S[si].cells.every(ci => single(masks[ci]))) {
        const w = listOf(si, cand[si])[0];
        if (words.has(w) || banned.has(w)) return null;
        words.add(w);
        continue;
      }
      if (n < bestN) { best = si; bestN = n; }
    }
    if (stats) { stats.max = Math.max(stats.max || 0, words.size); stats.total = S.length; }
    if (best < 0) { const out = [...pattern]; masks.forEach((m, i) => { if (pattern[i] !== "#") out[i] = String.fromCharCode(A + Math.log2(m)); }); return out.join(""); }
    const opts = listOf(best, cand[best]).filter(w => !words.has(w) && !banned.has(w));
    // Look-ahead: rank words by how many options they leave the crossing slots (sum of the logs
    // of their candidate counts with this word's letters in place), plus the caller's score.
    const cross = [...new Set(S[best].cells.flatMap(ci => cellSlots.get(ci).map(x => x[0])))].filter(sj => sj !== best);
    const ranked = [];
    const pre = opts.map(w => [w, score(w)]).sort((x, y) => y[1] - x[1]).slice(0, top);
    for (const [w, sc] of pre) {
      const m2 = masks.slice();
      S[best].cells.forEach((ci, k) => { m2[ci] = masks[ci] & (1 << (w.charCodeAt(k) - A)); });
      let room = 0;
      for (const sj of cross) { const n = count(candidates(sj, m2)); if (!n) { room = -Infinity; break; } room += Math.log(n); }
      if (room > -Infinity) ranked.push([w, room + weight * sc]);
    }
    ranked.sort((x, y) => y[1] - x[1]);
    // Deep look-ahead for the best few: propagate each fully and prefer the one that leaves the
    // whole grid the most room (sum of the logs of every slot's candidate count).
    const tried = [];
    for (const [w, sc] of ranked.slice(0, deep)) {
      const m2 = masks.slice(), c2 = cand.slice();
      S[best].cells.forEach((ci, k) => { m2[ci] = 1 << (w.charCodeAt(k) - A); });
      if (!propagate(m2, c2, [best, ...cross])) continue;
      let room = 0;
      for (const b of c2) room += Math.log(count(b));
      tried.push({ m2, c2, total: room + weight * sc });
    }
    tried.sort((x, y) => y.total - x.total);
    for (const t of tried) {
      const res = solve(t.m2, t.c2, used);
      if (res) return res;
      if (steps > maxSteps) return null;
    }
    for (const [w] of ranked.slice(deep)) {
      const m2 = masks.slice(), c2 = cand.slice();
      S[best].cells.forEach((ci, k) => { m2[ci] = 1 << (w.charCodeAt(k) - A); });
      if (!propagate(m2, c2, [best, ...cross])) continue;
      const res = solve(m2, c2, used);
      if (res) return res;
      if (steps > maxSteps) return null;
    }
    return null;
  }
  // Square-by-square search (cells: true): branch on the open square with the fewest allowed
  // letters, trying letters that leave its across and down entries the most candidates first.
  const cellSolve = (masks, cand) => {
    if (++steps > maxSteps) return null;
    const words = new Set();
    for (let si = 0; si < S.length; si++) if (S[si].cells.every(ci => single(masks[ci]))) {
      const w = listOf(si, cand[si])[0];
      if (!w || words.has(w) || banned.has(w)) return null;
      words.add(w);
    }
    if (stats) { stats.max = Math.max(stats.max || 0, words.size); stats.total = S.length; }
    let best = -1, bestN = 27;
    for (const [ci] of cellSlots) { const n = bitsOf(masks[ci]); if (n > 1 && n < bestN) { best = ci; bestN = n; } }
    if (best < 0) { const out = [...pattern]; masks.forEach((m, i) => { if (pattern[i] !== "#") out[i] = String.fromCharCode(A + Math.log2(m)); }); return out.join(""); }
    const opts = [];
    for (let L = 0; L < 26; L++) {
      if (!(masks[best] & (1 << L))) continue;
      let room = 0;
      for (const [si, p] of cellSlots.get(best)) {
        const b = index.get(S[si].len).pos[p].get(String.fromCharCode(A + L));
        let n = 0;
        if (b) { const c = cand[si]; for (let q = 0; q < c.length; q++) { let x = c[q] & b[q]; if (x) { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); n += (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; } } }
        room += Math.log(n + 1e-9);
      }
      opts.push([L, room + jitter()]);
    }
    opts.sort((x, y) => y[1] - x[1]);
    for (const [L] of opts) {
      const m2 = masks.slice(), c2 = cand.slice();
      m2[best] = 1 << L;
      if (!propagate(m2, c2, cellSlots.get(best).map(x => x[0]))) continue;
      const res = cellSolve(m2, c2);
      if (res) return res;
      if (steps > maxSteps) return null;
    }
    return null;
  };
  const bitsOf = m => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
  return cells ? cellSolve(masks0, cand0) : solve(masks0, cand0, new Set());
}
