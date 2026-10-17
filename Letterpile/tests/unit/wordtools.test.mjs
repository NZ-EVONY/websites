// Phase 4 word tools: the search engine (src/assets/js/wordtools.js) on small lists with known
// answers, and on the real list for the examples the pages quote.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { wordData } from "../../scripts/wordstats.mjs";
import { commonWords, rhymeData, rhymeTail, syllables, pronunciations } from "../../scripts/tooldata.mjs";

const T = createRequire(import.meta.url)("../../src/assets/js/wordtools.js");
const data = wordData();
const c = commonWords(data);
const common = T.commonMap(`${c.very.join(" ")}|${c.common.join(" ")}`);
const real = () => T.use(data.clean, common);

test("letter hive: center letter required, letters reusable, pangrams flagged", () => {
  T.use(["bee", "beam", "mama", "ambled", "blamed", "bald", "lamb", "dame"].sort(), new Map());
  const r = T.hive("blemd", "a");
  assert.deepEqual(r.map(x => x.word).sort(), ["ambled", "bald", "beam", "blamed", "dame", "lamb", "mama"], "BEE has no A");
  assert.deepEqual(r.filter(x => x.pangram).map(x => x.word).sort(), ["ambled", "blamed"]);
});

test("word grid: neighbors only, each tile once, Qu tiles", () => {
  T.use(["quit", "quiet", "tie", "tit", "it"].sort(), new Map());
  const r = T.grid([["qu", "i"], ["e", "t"]]);
  assert.deepEqual(r.map(x => x.word).sort(), ["quiet", "quit", "tie"]);
  assert.deepEqual(r.find(x => x.word === "quit").path, [0, 1, 3]);
});

test("letter box: side rule, chained two-word solutions", () => {
  real();
  const sides = ["tch", "nai", "ole", "pry"];
  const r = T.box(sides);
  assert.ok(!r.words.includes("chat"), "C and H share a side");
  const side = Object.fromEntries(sides.flatMap((s, i) => [...s].map(ch => [ch, i])));
  for (const w of r.words.slice(0, 200)) for (let i = 1; i < w.length; i++) assert.notEqual(side[w[i]], side[w[i - 1]], w);
  for (const [a, b] of r.pairs.slice(0, 50)) {
    assert.equal(a.at(-1), b[0]);
    assert.equal(new Set(a + b).size, 12);
  }
});

test("word ladder: shortest, one letter per step, every step a word", () => {
  real();
  const p = T.ladder("cold", "warm", { common: true });
  assert.deepEqual(p, ["cold", "cord", "word", "ward", "warm"]);
  const q = T.ladder("cold", "warm", { avoid: ["cord"] });
  assert.ok(q && !q.includes("cord") && q.length === 5);
  for (let i = 1; i < q.length; i++) assert.equal([...q[i]].filter((ch, j) => ch !== q[i - 1][j]).length, 1);
  assert.equal(T.ladder("cat", "door"), null, "different lengths");
});

test("hangman: revealed letters can't fill blanks; misses excluded; best letter counted", () => {
  T.use(["baker", "maker", "taker", "bakes", "babes", "rakes"].sort(), new Map());
  const r = T.hangman("_ake_", "s");
  assert.deepEqual(r.words.map(x => x.word).sort(), ["baker", "maker", "taker"]);
  assert.deepEqual(r.next[0], { letter: "r", n: 3 });
  T.use(["mamas", "tacky"], new Map());
  assert.deepEqual(T.hangman("_a___", "").words.map(x => x.word), ["tacky"], "a blank can't hold the A already shown");
});

test("cryptogram: shapes, key consistency, and a suggested key for a proverb", () => {
  real();
  assert.equal(T.shape("cheese"), "abccdc");
  const r = T.cryptogram("xyzzy", { x: "h" });
  assert.ok(r.words[0].candidates.every(w => w[0] === "h" && w[2] === w[3] && w[3] !== w[4]));
  const shift = s => s.replace(/[a-z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 90) % 26 + 97));
  const cipher = shift("the early bird catches the worm but the second mouse gets the cheese");
  const s = T.cryptogram(cipher);
  assert.equal(s.solved, s.solvable, "every cipher word decodes to a word");
  for (const w of cipher.split(" ")) assert.ok(data.set.has([...w].map(ch => s.suggestion[ch]).join("")), w);
  const used = Object.values(s.suggestion);
  assert.equal(new Set(used).size, used.length, "no plain letter used twice");
});

test("rhymes and syllables from the pronunciation dictionary", () => {
  const p = pronunciations();
  assert.equal(rhymeTail(p.get("table")), "EY B AH L");
  assert.equal(syllables(p.get("banana")), 3);
  const groups = new Map(rhymeData());
  const rh = groups.get("AY M").split(" ").map(s => s.slice(1));
  assert.ok(rh.includes("rhyme") && rh.includes("time"));
  for (const [, ws] of groups) for (const w of ws.split(" ")) assert.ok(data.set.has(w.slice(1)) && !data.blockedSet.has(w.slice(1)), w);
});
