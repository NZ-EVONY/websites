// Engine unit tests: assertions are checked against an independent brute-force
// implementation, never against expectations typed from memory.
import test from "node:test";
import assert from "node:assert/strict";
import { enableWords, freshEngine, rng } from "../helpers.mjs";

const WORDS = enableWords();
const E = freshEngine();
E.init(WORDS);

// Independent reference: can `word` be built from `letters` plus `blanks` wildcards?
function canMake(word, letters, blanks) {
  const have = {};
  for (const c of letters) have[c] = (have[c] || 0) + 1;
  let need = 0;
  for (const c of word) { if (have[c] > 0) have[c]--; else need++; }
  return need <= blanks;
}
const brute = (letters, blanks, min = 2) => WORDS.filter(w => w.length >= min && w.length <= letters.length + blanks && canMake(w, letters, blanks));

test("unscramble matches brute force for retinas", () => {
  assert.deepEqual(E.unscramble("retinas").map(x => x.word), brute("retinas", 0));
});

test("200 seeded random racks match the brute-force reference exactly", () => {
  const r = rng(20261002);
  const abc = "eeeeaaiioonrtlsudgbcmpfhvwykjxqz";
  for (let i = 0; i < 200; i++) {
    const n = 2 + Math.floor(r() * 8);
    const blanks = Math.floor(r() * 3);
    let letters = "";
    for (let j = 0; j < n; j++) letters += abc[Math.floor(r() * abc.length)];
    const got = E.unscramble(letters + "?".repeat(blanks)).map(x => x.word);
    assert.deepEqual(got, brute(letters, blanks), `rack ${letters}${"?".repeat(blanks)}`);
  }
});

test("blanks: ?, * and _ all count, and never more than three", () => {
  assert.deepEqual(E.parseLetters("a?b*c_"), { letters: "abc", blanks: 3 });
  assert.equal(E.parseLetters("??????").blanks, 3);
  const res = E.unscramble("ca?");
  assert.ok(res.some(x => x.word === "cat" && x.blanks === "t"));
  for (const x of res) assert.ok(x.blanks.length <= 1, `${x.word} used ${x.blanks.length} blanks`);
});

test("duplicate letters are respected (eel, aab)", () => {
  assert.ok(E.unscramble("eel").some(x => x.word === "eel"));
  assert.ok(!E.unscramble("el").some(x => x.word === "eel"));
  assert.deepEqual(E.unscramble("aab").map(x => x.word), brute("aab", 0));
});

test("use-every-letter mode returns only full-length words", () => {
  const res = E.unscramble("listen", { exact: true }).map(x => x.word);
  assert.ok(res.length > 0);
  for (const w of res) assert.equal(w.length, 6);
  assert.deepEqual(res, brute("listen", 0).filter(w => w.length === 6));
});

test("filters: starts, ends, contains, length", () => {
  const all = E.unscramble("retinas").map(x => x.word);
  assert.deepEqual(E.unscramble("retinas", { startsWith: "st" }).map(x => x.word), all.filter(w => w.startsWith("st")));
  assert.deepEqual(E.unscramble("retinas", { endsWith: "er" }).map(x => x.word), all.filter(w => w.endsWith("er")));
  assert.deepEqual(E.unscramble("retinas", { contains: "ain" }).map(x => x.word), all.filter(w => w.includes("ain")));
  assert.deepEqual(E.unscramble("retinas", { length: 5 }).map(x => x.word), all.filter(w => w.length === 5));
});

test("empty input, non-letters and no duplicate results", () => {
  assert.deepEqual(E.unscramble(""), []);
  assert.deepEqual(E.unscramble("12 #!"), []);
  assert.deepEqual(E.unscramble("C-A-T!").map(x => x.word), E.unscramble("cat").map(x => x.word));
  const res = E.unscramble("ab???").map(x => x.word);
  assert.equal(new Set(res).size, res.length, "a word was returned twice");
  const sorted = [...res].sort();
  assert.deepEqual(res, sorted, "results come back in list (alphabetical) order");
});

test("scores and the all-tiles bonus", () => {
  assert.equal(E.score("quiz", "scrabble"), 10 + 1 + 1 + 10);
  assert.equal(E.score("quiz", "scrabble", "z"), 12, "a blank scores zero");
  const plays = E.findPlays("retains", { scheme: "scrabble" });
  const bingo = plays.find(p => p.word === "retains");
  assert.ok(bingo?.bingo);
  assert.equal(bingo.score, E.score("retains") + 50);
  const wwf = E.findPlays("retains", { scheme: "wwf" }).find(p => p.word === "retains");
  assert.equal(wwf.score, E.score("retains", "wwf") + 35);
  for (let i = 1; i < plays.length; i++) assert.ok(plays[i - 1].score >= plays[i].score, "sorted by score");
});

test("board letters: words must pass through them and use a rack tile", () => {
  const res = E.findPlays("ts", { board: "ea" }).map(p => p.word);
  assert.ok(res.includes("eat") || res.includes("eats") || res.includes("seat"));
  for (const w of res) assert.ok(w.includes("ea"));
});

test("anagrams: exact and two-word", () => {
  const ex = E.anagrams("listen").exact;
  assert.deepEqual(ex, WORDS.filter(w => w !== "listen" && w.length === 6 && [...w].sort().join("") === "eilnst"));
  const two = E.anagrams("dormitory", { phrases: true }).phrases;
  assert.ok(two.includes("dirty room"));
  for (const p of two) assert.equal(p.replace(" ", "").split("").sort().join(""), "dimoorrty");
});

test("pattern search: ? and _ wildcards, include and exclude", () => {
  const ref = WORDS.filter(w => w.length === 5 && w[0] === "c" && w[2] === "o" && w[4] === "s");
  assert.deepEqual(E.patternSearch("c?o?s"), ref);
  assert.deepEqual(E.patternSearch("c_o_s"), ref);
  assert.deepEqual(E.patternSearch("c?o?s", { include: "r" }), ref.filter(w => w.includes("r")));
  const ex = E.patternSearch("q????", { exclude: "u" });
  for (const w of ex) assert.ok(!w.slice(1).includes("u"));
  assert.deepEqual(E.patternSearch(""), []);
});

// Reference Wordle feedback (handles repeated letters the way the game does).
function feedback(guess, answer) {
  const m = Array(guess.length).fill("b");
  const left = {};
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) m[i] = "g";
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (m[i] === "g") continue;
    if (left[guess[i]] > 0) { m[i] = "y"; left[guess[i]]--; }
  }
  return m.join("");
}

test("wordle: double letters (speed vs abide) keep the answer and stay consistent", () => {
  const marks = feedback("speed", "abide");
  assert.equal(marks[2], "y", "first E is yellow (abide has one E)");
  assert.equal(marks[3], "b", "second E is gray without ruling E out");
  const res = E.wordleCandidates([{ word: "speed", marks }]).map(x => x.word);
  assert.ok(res.includes("abide"));
  for (const w of res) assert.equal(feedback("speed", w), marks, w);
});

test("wordle: gray after green and gray after yellow", () => {
  for (const [g, a] of [["eerie", "elder"], ["allot", "label"], ["sassy", "essay"], ["geese", "theme"]]) {
    const marks = feedback(g, a);
    const res = E.wordleCandidates([{ word: g, marks }]).map(x => x.word);
    assert.ok(res.includes(a), `${a} kept after ${g}=${marks}`);
    for (const w of res) assert.equal(feedback(g, w), marks, `${w} inconsistent with ${g}=${marks}`);
  }
});

test("wordle: seeded random games stay consistent with every clue", () => {
  const five = WORDS.filter(w => w.length === 5);
  const r = rng(7);
  for (let i = 0; i < 40; i++) {
    const answer = five[Math.floor(r() * five.length)];
    const guesses = [0, 1, 2].map(() => five[Math.floor(r() * five.length)]).map(w => ({ word: w, marks: feedback(w, answer) }));
    const res = E.wordleCandidates(guesses).map(x => x.word);
    assert.ok(res.includes(answer), `answer ${answer} dropped`);
    for (const w of res) for (const g of guesses) assert.equal(feedback(g.word, w), g.marks);
  }
});

test("wordle: all-gray guess, contradictory clues and deterministic ranking", () => {
  const res = E.wordleCandidates([{ word: "crane", marks: "bbbbb" }]).map(x => x.word);
  for (const w of res) assert.ok(!/[crane]/.test(w));
  assert.equal(E.wordleCandidates([{ word: "crane", marks: "gbbbb" }, { word: "crane", marks: "bbbbb" }]).length, 0);
  assert.deepEqual(E.wordleCandidates([{ word: "slate", marks: "bybbb" }]), E.wordleCandidates([{ word: "slate", marks: "bybbb" }]));
});

test("hidden words: hidden by default, shown with showAll", () => {
  const H = freshEngine();
  H.init(["ant", "nat", "tan"], ["nat"]);
  assert.deepEqual(H.unscramble("tan").map(x => x.word), ["ant", "tan"]);
  assert.equal(H.isHidden("nat"), true);
  H.setShowAll(true);
  assert.deepEqual(H.unscramble("tan").map(x => x.word), ["ant", "nat", "tan"]);
  assert.deepEqual(H.anagrams("ant").exact, ["nat", "tan"]);
  H.setShowAll(false);
  assert.deepEqual(H.anagrams("ant").exact, ["tan"]);
  for (let i = 0; i < 50; i++) assert.notEqual(H.randomWord({ min: 3, max: 3 }), "nat");
});

test("scrambling keeps letters and changes order when possible", () => {
  for (const w of ["puzzle", "letters", "ab"]) {
    const s = E.scrambleWord(w);
    assert.equal([...s].sort().join(""), [...w].sort().join(""));
    assert.notEqual(s, w);
  }
  const t = E.scrambleText("Keep, the punctuation!", "words");
  assert.match(t, /^\w+, \w+ \w+!$/);
  assert.equal(E.scrambleText("abc def", "reverse"), "cba fed");
});

test("unscrambleGrouped matches unscramble, grouped longest first and trimmed", () => {
  const flat = E.unscramble("retains?").map(x => x.word);
  const g = E.unscrambleGrouped("retains?", {}, 5);
  assert.equal(g.total, flat.length);
  assert.equal(g.groups.reduce((s, x) => s + x.count, 0), flat.length);
  for (let i = 1; i < g.groups.length; i++) assert.ok(g.groups[i - 1].n > g.groups[i].n);
  for (const x of g.groups) {
    assert.ok(x.items.length <= 5);
    assert.deepEqual(x.items.map(i => i.word), flat.filter(w => w.length === x.n).slice(0, 5));
  }
});
