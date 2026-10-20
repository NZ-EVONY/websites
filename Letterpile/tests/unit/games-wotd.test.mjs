// Word of the Day: notes file, computed facts and the validator.
import test from "node:test";
import assert from "node:assert/strict";
import { wordData } from "../../scripts/wordstats.mjs";
import * as wotd from "../../scripts/games/wotd.mjs";
import { wordPageWords } from "../../scripts/wordpages.mjs";

const words = wordData();

test("notes: every line has a date, a word with a word page, a meaning, a usage and a status", () => {
  const pages = new Set(wordPageWords(words));
  const n = wotd.notes();
  assert.ok(n.size >= 7);
  for (const [date, x] of n) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(pages.has(x.word), `${date}: ${x.word} has a word page`);
    assert.ok(x.meaning.length >= 20 && x.usage.length >= 20, date);
    assert.ok(["draft", "ok"].includes(x.status), `${date}: status ${x.status}`);
  }
  const ws = [...n.values()].map(x => x.word);
  assert.equal(new Set(ws).size, ws.length, "no word twice");
});

test("facts are computed from the list: anagram first, then vowels, hooks, points", () => {
  assert.match(wotd.fact("listen", words), /^LISTEN is an anagram of .*SILENT/);
  assert.match(wotd.fact("queue", words), /^Four of the five letters in QUEUE are vowels/);
});

test("a draft isn't published; an approved one validates, and a tampered fact doesn't", () => {
  const drafts = new Map([["2026-10-17", { date: "2026-10-17", word: "bizarre", meaning: "m", usage: "u", status: "draft" }]]);
  assert.throws(() => wotd.generate("2026-10-17", { words, noteMap: drafts }), e => e.pending && e.state === "draft");
  assert.throws(() => wotd.generate("2099-01-01", { words }), e => e.pending && e.state === "missing" && typeof e.suggestion === "string");
  const p = { v: 1, game: "wotd", date: "2026-10-18", number: 2, word: "queue", meaning: "A line of people waiting their turn.", usage: "Your document is third in the print queue.", fact: wotd.fact("queue", words), points: words.Engine.score("queue", "scrabble"), wwf: 0 };
  assert.deepEqual(wotd.validate(p, { date: "2026-10-18", words }), []);
  assert.match(wotd.validate({ ...p, fact: "QUEUE has no vowels." }, { date: "2026-10-18", words }).join(), /fact/);
  assert.deepEqual(wotd.validateSet([p, { ...p, date: "2026-10-19" }]).length, 1);
});
