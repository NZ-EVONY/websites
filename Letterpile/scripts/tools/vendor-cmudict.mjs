// One-off: keeps the CMU Pronouncing Dictionary entries for words in the visible ENABLE list
// (first pronunciation only) and writes scripts/lexicon/cmudict-enable.txt, which the build
// turns into the rhyme and syllable data. Usage: node scripts/tools/vendor-cmudict.mjs <cmudict.dict>
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { wordData } from "../wordstats.mjs";

const src = process.argv[2];
if (!src) throw new Error("Usage: node scripts/tools/vendor-cmudict.mjs <cmudict.dict>");
const raw = fs.readFileSync(src);
const visible = new Set(wordData().clean);
const out = new Map();
for (const line of raw.toString("utf8").split(/\r?\n/)) {
  const m = line.match(/^([a-z]+) ([A-Z0-9 ]+?)(?: #.*)?$/); // "word(2)" variants are skipped
  if (m && visible.has(m[1]) && !out.has(m[1])) out.set(m[1], m[2].trim());
}
const sha = createHash("sha256").update(raw).digest("hex");
const header = `# CMU Pronouncing Dictionary entries for words in the visible ENABLE list, first pronunciation only.\n# Source: cmudict.dict from github.com/cmusphinx/cmudict (master), SHA-256 ${sha}.\n# Copyright (C) 1993-2015 Carnegie Mellon University. Licence: licenses/CMUdict-LICENSE.txt\n`;
const file = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../lexicon/cmudict-enable.txt");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, header + [...out].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([w, p]) => `${w} ${p}`).join("\n") + "\n");
console.log(`${out.size} words written to ${file}`);
