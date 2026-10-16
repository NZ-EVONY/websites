// Daily Word: the answer list, the published puzzles and the validator.
import test from "node:test";
import assert from "node:assert/strict";
import { wordData } from "../../scripts/wordstats.mjs";
import * as word from "../../scripts/games/word.mjs";
import { validateGame } from "../../scripts/games/lib.mjs";
import { ROOT } from "../helpers.mjs";
import { encode } from "../../scripts/games/util.mjs";

const words = wordData();

test("answer list: at least 400 everyday five-letter words, all valid", () => {
  const list = word.answers();
  assert.ok(list.length >= 400, `${list.length} answers`);
  assert.deepEqual(word.checkAnswerList(list, words), []);
});

test("answer list checker catches bad entries", () => {
  const errs = word.checkAnswerList(["crane", "cats", "dogs", "crane", "zzzzz", "trees"], words).join("\n");
  assert.match(errs, /"cats" is not five letters/);
  assert.match(errs, /"crane" is listed twice/);
  assert.match(errs, /"zzzzz" is not in the ENABLE list/);
  assert.match(errs, /"trees" looks like a plural/);
});

test("every published Daily Word is valid and no answer repeats within a year", () => {
  const { dates, errors } = validateGame(ROOT, "word", words);
  assert.ok(dates.length >= 35, `${dates.length} days`);
  assert.deepEqual(errors, []);
});

test("validator rejects a wrong date, a wrong number and an answer outside the list", () => {
  const p = word.generate("2026-10-16", { history: [] });
  assert.deepEqual(word.validate(p, { date: "2026-10-16", words }), []);
  assert.match(word.validate(p, { date: "2026-10-17", words }).join(), /does not match the file name/);
  assert.match(word.validate({ ...p, number: 9 }, { date: "2026-10-16", words }).join(), /number 9 should be 1/);
  assert.match(word.validate({ ...p, a: encode("zebus", "word:2026-10-16") }, { date: "2026-10-16", words }).join(), /not in the curated answer list/);
});

test("validateSet flags an answer used twice within 365 days", () => {
  const a = word.generate("2026-10-16", { history: [] });
  const b = { ...word.generate("2026-12-01", { history: [] }), a: encode(word.answerOf(a), "word:2026-12-01") };
  assert.match(word.validateSet([a, b]).join(), /repeats on 2026-12-01/);
});
