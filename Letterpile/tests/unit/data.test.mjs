// Word data and licence tests.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ROOT, enableWords, readJson } from "../helpers.mjs";
import { loadEnable, sourceInfo, blockedWords } from "../../scripts/wordstats.mjs";

const words = enableWords();

test("ENABLE integrity: a-z, sorted, unique, count and SHA-256 match data/SOURCE.md", () => {
  const src = sourceInfo();
  assert.equal(words.length, src.count);
  assert.equal(createHash("sha256").update(fs.readFileSync(path.join(ROOT, "data/enable1.txt"))).digest("hex"), src.sha);
  assert.equal(src.sha, "3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89");
  for (let i = 0; i < words.length; i++) {
    assert.match(words[i], /^[a-z]+$/);
    if (i) assert.ok(words[i - 1] < words[i]);
  }
  assert.doesNotThrow(loadEnable);
});

// Reference counts from the planning brief. If one of these fails, report the
// discrepancy (docs/UNVERIFIED.md); never silently change the number.
test("planner reference counts", () => {
  assert.equal(words.length, 172823);
  assert.equal(words.filter(w => w.length === 2).length, 96, "two-letter words");
  assert.equal(words.filter(w => w.includes("q") && !w.includes("u")).length, 21, "q without u");
  assert.equal(words.filter(w => !/[aeiou]/.test(w)).length, 121, "no a, e, i, o, u");
  assert.equal(words.filter(w => !/[aeiouy]/.test(w)).length, 20, "no a, e, i, o, u or y");
  assert.equal(words.filter(w => w.length === 5).length, 8636, "five-letter words");
});

test("words the copy says are missing really are missing (and the others present)", () => {
  const set = new Set(words);
  for (const w of ["qi", "za", "ok", "ew"]) assert.ok(!set.has(w), `${w} should not be in ENABLE`);
  for (const w of ["jo", "xu"]) assert.ok(set.has(w), `${w} should be in ENABLE`);
});

test("licence files exist and the ENABLE release paragraph is verbatim", () => {
  for (const f of ["licenses/ENABLE-README.txt", "licenses/ENABLE-LICENSE.txt", "licenses/wordlist-npm-MIT.txt", "licenses/LDNOOBW-LICENSE-CC-BY-4.0.txt"]) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  const readme = fs.readFileSync(path.join(ROOT, "licenses/ENABLE-README.txt"), "utf8");
  assert.match(readme, /formally released\s+into the Public Domain/);
  assert.match(fs.readFileSync(path.join(ROOT, "licenses/LDNOOBW-LICENSE-CC-BY-4.0.txt"), "utf8"), /^Attribution 4\.0 International/);
});

test("blocklist: only ENABLE words, allowlist respected, no blocklist words in the allowlist leak", () => {
  const blocked = blockedWords(words);
  const set = new Set(words);
  assert.ok(blocked.length > 100);
  for (const w of blocked) assert.ok(set.has(w));
  for (const w of ["escort", "scat", "intercourse", "suck"]) assert.ok(!blocked.includes(w), `${w} is on the allowlist`);
});

test("100-tile distribution sums to 100", () => {
  const d = readJson("content/data/tile-distribution.json");
  assert.equal(Object.values(d.tiles).reduce((a, b) => a + b, 0) + d.blanks, 100);
  assert.equal(Object.keys(d.tiles).length, 26);
});
