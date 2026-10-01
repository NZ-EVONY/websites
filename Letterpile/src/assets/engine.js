/* Letterpile word engine: pure functions over the word list.
   Runs in the browser (window.Engine) and in Node (module.exports) for tests. */
(function (root) {
  "use strict";

  const SCRABBLE = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
  const WWF = { a: 1, b: 4, c: 4, d: 2, e: 1, f: 4, g: 3, h: 3, i: 1, j: 10, k: 5, l: 2, m: 4, n: 2, o: 1, p: 4, q: 10, r: 1, s: 1, t: 1, u: 2, v: 5, w: 4, x: 8, y: 3, z: 10 };
  const SCHEMES = {
    scrabble: { values: SCRABBLE, bingo: 50, rack: 7 },
    wwf: { values: WWF, bingo: 35, rack: 7 },
  };

  let WORDS = null;
  let SET = null;
  let HIDDEN = new Set(); // vulgar words hidden unless showAll (see setShowAll)
  let CLEAN = null; // WORDS minus HIDDEN
  let showAll = false;
  let KEYS = null; // sorted-letters key -> [words] for the current pool

  // ---------- loading ----------

  // The list ships as a <script> so pages work from file:// too. The build puts the
  // (content-hashed) file name in the engine script's data-words attribute.
  const dataUrl = (() => {
    const el = root.document?.currentScript;
    if (el?.dataset?.words) return el.dataset.words;
    return el?.src ? el.src.replace(/assets\/engine[^/]*\.js.*$/, "data/words.js") : "data/words.js";
  })();

  let loading = null;
  function load() {
    if (WORDS) return Promise.resolve(WORDS);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const done = () => {
        init(root.WORD_DATA.split(" "), root.WORD_HIDE ? root.WORD_HIDE.split(" ") : []);
        delete root.WORD_DATA;
        delete root.WORD_HIDE;
        resolve(WORDS);
      };
      if (root.WORD_DATA) return done();
      const s = root.document.createElement("script");
      s.src = dataUrl;
      s.onload = done;
      s.onerror = () => { loading = null; reject(new Error("Couldn't load the word list.")); };
      root.document.head.appendChild(s);
    });
    return loading;
  }

  function init(list, hidden = []) {
    WORDS = list;
    SET = new Set(list);
    HIDDEN = new Set(hidden);
    CLEAN = HIDDEN.size ? list.filter(w => !HIDDEN.has(w)) : list;
    KEYS = null;
  }

  // The words searches run over: everything, or everything but the hidden words.
  const pool = () => (showAll ? WORDS : CLEAN);
  function setShowAll(on) {
    if (showAll === !!on) return;
    showAll = !!on;
    KEYS = null;
  }

  const isWord = w => SET.has(String(w).toLowerCase());
  const isHidden = w => !showAll && HIDDEN.has(String(w).toLowerCase());
  const sortKey = w => [...w].sort().join("");

  function keyMap() {
    if (!KEYS) {
      KEYS = new Map();
      for (const w of pool()) {
        const k = sortKey(w);
        const arr = KEYS.get(k);
        arr ? arr.push(w) : KEYS.set(k, [w]);
      }
    }
    return KEYS;
  }

  // ---------- letters ----------

  // "a?b c*" -> { letters: "abc", blanks: 2 }. ?, * and _ are wildcards.
  function parseLetters(input, maxBlanks = 3) {
    const s = String(input || "").toLowerCase();
    const letters = s.replace(/[^a-z]/g, "");
    const blanks = Math.min(maxBlanks, (s.match(/[?*_]/g) || []).length);
    return { letters, blanks };
  }

  function counts(s) {
    const c = new Int16Array(26);
    for (let i = 0; i < s.length; i++) {
      const k = s.charCodeAt(i) - 97;
      if (k >= 0 && k < 26) c[k]++;
    }
    return c;
  }

  const scratch = new Int16Array(26);

  // Can `word` be built from `have` (letter counts) plus `blanks` wildcards?
  // Returns the letters that had to come from blanks, or null if impossible.
  function build(word, have, blanks) {
    scratch.set(have);
    let used = "";
    for (let i = 0; i < word.length; i++) {
      const k = word.charCodeAt(i) - 97;
      if (scratch[k] > 0) scratch[k]--;
      else if (blanks-- > 0) used += word[i];
      else return null;
    }
    return used;
  }

  function matchesFilters(w, f) {
    if (f.min && w.length < f.min) return false;
    if (f.max && w.length > f.max) return false;
    if (f.length && w.length !== f.length) return false;
    if (f.startsWith && !w.startsWith(f.startsWith)) return false;
    if (f.endsWith && !w.endsWith(f.endsWith)) return false;
    if (f.contains && !w.includes(f.contains)) return false;
    if (f.pattern && !f.pattern.test(w)) return false;
    return true;
  }

  // ---------- tools ----------

  // All words makeable from the letters. `exact` requires every tile used.
  function unscramble(input, opts = {}) {
    const { letters, blanks } = parseLetters(input);
    const total = letters.length + blanks;
    const have = counts(letters);
    const f = { min: 2, ...opts, max: Math.min(opts.max || total, total) };
    if (opts.exact) f.length = total;
    const out = [];
    for (const w of pool()) {
      if (w.length > total || !matchesFilters(w, f)) continue;
      const used = build(w, have, blanks);
      if (used !== null) out.push({ word: w, blanks: used });
    }
    return out;
  }

  function score(word, scheme = "scrabble", blankLetters = "") {
    const v = SCHEMES[scheme].values;
    let s = 0;
    for (const ch of word) s += v[ch] || 0;
    for (const ch of blankLetters) s -= v[ch] || 0;
    return s;
  }

  // Rack words with tile scores. `board` is a run of letters already on the
  // board that the word must pass through; those tiles are free.
  function findPlays(rack, opts = {}) {
    const scheme = SCHEMES[opts.scheme || "scrabble"];
    const { letters, blanks } = parseLetters(rack, 2);
    const board = String(opts.board || "").toLowerCase().replace(/[^a-z]/g, "");
    const have = counts(letters);
    const tiles = letters.length + blanks;
    const f = { min: 2, ...opts };
    const out = [];
    for (const w of pool()) {
      if (w.length > tiles + board.length || !matchesFilters(w, f)) continue;
      let fromRack = w;
      if (board) {
        const at = w.indexOf(board);
        if (at < 0) continue;
        fromRack = w.slice(0, at) + w.slice(at + board.length);
        if (!fromRack) continue; // must play at least one tile
      }
      const used = build(fromRack, have, blanks);
      if (used === null) continue;
      const bingo = fromRack.length >= scheme.rack;
      out.push({
        word: w,
        blanks: used,
        score: score(w, opts.scheme || "scrabble", used) + (bingo ? scheme.bingo : 0),
        bingo,
      });
    }
    return out.sort((a, b) => b.score - a.score || b.word.length - a.word.length || a.word.localeCompare(b.word));
  }

  // Exact anagrams, plus two-word anagrams when asked.
  function anagrams(input, { phrases = false, minPart = 3, limit = 400 } = {}) {
    const letters = String(input || "").toLowerCase().replace(/[^a-z]/g, "");
    const map = keyMap();
    const exact = (map.get(sortKey(letters)) || []).filter(w => w !== letters);
    if (!phrases) return { exact, phrases: [] };

    const have = counts(letters);
    const pairs = [];
    const seen = new Set();
    for (const w of pool()) {
      if (w.length < minPart || w.length > letters.length - minPart) continue;
      if (build(w, have, 0) === null) continue;
      const rest = counts(letters);
      for (const ch of w) rest[ch.charCodeAt(0) - 97]--;
      let key = "";
      for (let i = 0; i < 26; i++) key += String.fromCharCode(97 + i).repeat(rest[i]);
      for (const w2 of map.get(key) || []) {
        const pair = [w, w2].sort().join(" ");
        if (!seen.has(pair)) { seen.add(pair); pairs.push(pair); }
      }
      if (pairs.length >= limit) break;
    }
    return { exact, phrases: pairs };
  }

  // "c?t", "c_t", "c.t" -> regex. Optional letter whitelist / blacklist.
  function patternSearch(pattern, { include = "", exclude = "" } = {}) {
    const p = String(pattern || "").toLowerCase().replace(/[^a-z?_.*]/g, "");
    if (!p) return [];
    const ex = exclude.toLowerCase().replace(/[^a-z]/g, "");
    const unknown = ex ? `[^${ex}]` : "[a-z]";
    const re = new RegExp("^" + [...p].map(ch => /[a-z]/.test(ch) ? ch : unknown).join("") + "$");
    const must = include.toLowerCase().replace(/[^a-z]/g, "");
    return pool().filter(w => w.length === p.length && re.test(w) && [...must].every(ch => w.includes(ch)));
  }

  // Wordle: guesses = [{ word: "crane", marks: "gybbb" }] (g=green, y=yellow, b=grey).
  function wordleConstraints(guesses, size = 5) {
    const fixed = Array(size).fill(null);
    const notAt = Array.from({ length: size }, () => new Set());
    const min = {}, max = {};
    for (const { word, marks } of guesses) {
      const w = word.toLowerCase();
      if (w.length !== size || marks.length !== size) continue;
      const seen = {};
      for (let i = 0; i < size; i++) if (marks[i] !== "b") seen[w[i]] = (seen[w[i]] || 0) + 1;
      for (let i = 0; i < size; i++) {
        const ch = w[i];
        if (marks[i] === "g") fixed[i] = ch;
        else notAt[i].add(ch);
        if (marks[i] === "b") max[ch] = seen[ch] || 0; // grey caps the count
      }
      for (const [ch, n] of Object.entries(seen)) min[ch] = Math.max(min[ch] || 0, n);
    }
    return { fixed, notAt, min, max, size };
  }

  function wordleCandidates(guesses, size = 5) {
    const c = wordleConstraints(guesses, size);
    const out = pool().filter(w => {
      if (w.length !== size) return false;
      for (let i = 0; i < size; i++) {
        if (c.fixed[i] && w[i] !== c.fixed[i]) return false;
        if (c.notAt[i].has(w[i])) return false;
      }
      const cnt = {};
      for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1;
      for (const [ch, n] of Object.entries(c.min)) if ((cnt[ch] || 0) < n) return false;
      for (const [ch, n] of Object.entries(c.max)) if ((cnt[ch] || 0) > n) return false;
      return true;
    });
    // Rank by how many other candidates each word's distinct letters appear in:
    // a guess full of common letters splits the field the most.
    const freq = {};
    for (const w of out) for (const ch of new Set(w)) freq[ch] = (freq[ch] || 0) + 1;
    const rank = w => [...new Set(w)].reduce((s, ch) => s + freq[ch], 0);
    return out.map(w => ({ word: w, rank: rank(w) })).sort((a, b) => b.rank - a.rank || a.word.localeCompare(b.word));
  }

  // Blend words: prefix of one + suffix of the next (breakfast + lunch -> brunch).
  function combine(words, { limit = 600 } = {}) {
    const list = words.map(w => String(w).toLowerCase().replace(/[^a-z]/g, "")).filter(Boolean);
    if (list.length < 2) return { joined: [], blends: [] };

    const joined = [...new Set(permutations(list.slice(0, 5)).map(p => p.join("")))];
    const found = new Map();
    for (const a of list) for (const b of list) {
      if (a === b) continue;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 0; j < b.length; j++) {
          if (i === a.length && j === 0) continue; // that's plain concatenation
          const blend = a.slice(0, i) + b.slice(j);
          if (blend.length < 3 || list.includes(blend) || found.has(blend)) continue;
          // Keep a real chunk of each source word.
          const keepA = i / a.length, keepB = (b.length - j) / b.length;
          if (keepA < 0.2 || keepB < 0.2) continue;
          // Skip fragments nobody could say: no vowel, or a pile of consonants.
          if (!/[aeiouy]/.test(blend) || /[^aeiouy]{4}/.test(blend) || /(.)\1\1/.test(blend)) continue;
          found.set(blend, { word: blend, real: SET.has(blend) && !isHidden(blend), from: [a, b], balance: Math.abs(keepA - keepB) });
        }
      }
    }
    const blends = [...found.values()]
      .sort((x, y) => y.real - x.real || x.balance - y.balance || x.word.length - y.word.length)
      .slice(0, limit);
    return { joined, blends };
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr];
    return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p]));
  }

  // ---------- scrambling ----------

  function randInt(n) {
    if (root.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      const max = Math.floor(0x100000000 / n) * n;
      do root.crypto.getRandomValues(buf); while (buf[0] >= max);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  function shuffle(chars) {
    const a = [...chars];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Shuffle so the result differs from the input whenever that's possible.
  function scrambleWord(w, keepEnds = false) {
    if (keepEnds) {
      if (w.length < 4) return w;
      return w[0] + scrambleWord(w.slice(1, -1)) + w[w.length - 1];
    }
    if (new Set(w).size < 2) return w;
    let out;
    do out = shuffle(w).join(""); while (out === w);
    return out;
  }

  // mode: "words" (each word), "ends" (keep first/last letter), "all" (every
  // letter in the text), "reverse" (each word backwards), "order" (word order).
  function scrambleText(text, mode = "words") {
    const s = String(text || "");
    if (mode === "all") {
      const letters = shuffle(s.replace(/[^A-Za-z]/g, ""));
      let i = 0;
      return s.replace(/[A-Za-z]/g, () => letters[i++]);
    }
    if (mode === "order") {
      const words = s.split(/\s+/).filter(Boolean);
      return words.length < 2 ? s : shuffle(words).join(" ");
    }
    return s.replace(/[A-Za-z]+/g, w => {
      if (mode === "reverse") return [...w].reverse().join("");
      return scrambleWord(w, mode === "ends");
    });
  }

  function randomWord({ min = 5, max = 7 } = {}) {
    for (;;) {
      const list = CLEAN || WORDS; // never pick a hidden word as a puzzle
      const w = list[randInt(list.length)];
      if (w.length >= min && w.length <= max && !/(s|ed|ing)$/.test(w)) return w;
    }
  }

  // Input limits shared by the pages (15 letters plus up to 3 blanks).
  const LIMITS = { letters: 15, blanks: 3 };

  const api = {
    load, init, isWord, isHidden, setShowAll, LIMITS, parseLetters, unscramble, findPlays, score, anagrams, patternSearch,
    wordleConstraints, wordleCandidates, combine, scrambleText, scrambleWord, randomWord, shuffle,
    SCHEMES, get words() { return WORDS; }, get showAll() { return showAll; },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== "undefined" ? window : globalThis);
