// Word page notes: every entry is complete, every ok entry is published and indexed, and
// pages without one stay noindex.
import test from "node:test";
import assert from "node:assert/strict";
import { manifest, readPublic } from "../helpers.mjs";
import { loadWordNotes, entryProblems, publishedNotes } from "../../scripts/words/notes.mjs";

const entries = loadWordNotes();
const m = manifest();
const wordPages = new Map(m.pages.filter(p => p.type === "word").map(p => [p.path.slice(6), p]));

test("word notes: every entry is complete, unique and has a word page", () => {
  const seen = new Set();
  for (const e of entries) {
    assert.deepEqual(entryProblems(e), [], `line ${e.line} (${e.word})`);
    assert.equal(e.extra, 0, `line ${e.line}: too many fields`);
    assert.ok(!seen.has(e.word), `${e.word} repeated`); seen.add(e.word);
    assert.ok(wordPages.has(e.word), `${e.word} has no word page`);
  }
  assert.ok(entries.length >= 100);
});

test("word notes: incomplete entries are rejected", () => {
  const good = entries[0];
  for (const bad of [{ meaning: "" }, { example: "no quotes here at all" }, { note: "One sentence only, which is not enough for a note here at all, really." }, { pos: "thing" }, { status: "maybe" }, { note: good.note + " It is the official word." }])
    assert.notDeepEqual(entryProblems({ ...good, ...bad }), [], JSON.stringify(bad));
});

test("word notes: ok pages show the note and are indexed; others stay noindex", () => {
  const pub = publishedNotes();
  for (const [w, p] of wordPages) {
    const html = readPublic(p.file);
    const noindex = html.includes(`<meta name="robots" content="noindex, follow">`);
    if (pub.has(w)) {
      assert.ok(!noindex && !p.noindex, `${w} indexed`);
      assert.ok(html.includes(`<h2>Meaning of ${w.toUpperCase()}</h2>`), `${w} shows meaning`);
    } else assert.ok(noindex && p.noindex, `${w} noindex`);
  }
});
