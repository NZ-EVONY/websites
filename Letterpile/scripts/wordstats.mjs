// Word data for the build: loads ENABLE, checks integrity, works out the blocklist,
// and offers small helpers for computed facts. Every number shown on the site
// comes from here (or from the engine running on this list) in the same build.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const lines = f => read(f).split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));

export function sourceInfo() {
  const md = read("data/SOURCE.md");
  const sha = md.match(/`([0-9a-f]{64})`/)[1];
  const count = +md.match(/Word count[^0-9]*([\d,]+)/)[1].replace(/,/g, "");
  return { sha, count };
}

// Throws if the list is not what data/SOURCE.md says it is.
export function loadEnable() {
  const raw = fs.readFileSync(path.join(ROOT, "data/enable1.txt"));
  const sha = createHash("sha256").update(raw).digest("hex");
  const words = raw.toString("utf8").split(/\r?\n/).filter(Boolean);
  const src = sourceInfo();
  const fail = msg => { throw new Error(`Word list integrity check failed: ${msg}`); };
  if (sha !== src.sha) fail(`SHA-256 ${sha} does not match data/SOURCE.md (${src.sha})`);
  if (words.length !== src.count) fail(`count ${words.length} does not match data/SOURCE.md (${src.count})`);
  for (let i = 0; i < words.length; i++) {
    if (!/^[a-z]+$/.test(words[i])) fail(`non a-z entry at line ${i + 1}`);
    if (i && words[i - 1] >= words[i]) fail(`not sorted/unique at line ${i + 1} (${words[i - 1]} / ${words[i]})`);
  }
  return { words, sha };
}

const INFLECT = ["", "s", "es", "ed", "d", "ing", "er", "ers", "y"];

// Words hidden by default in the tools and left off static pages.
export function blockedWords(words) {
  const set = new Set(words);
  const allow = new Set(lines("data/blocklist-allow.txt"));
  const base = [...lines("data/blocklist.txt"), ...lines("data/blocklist-extra.txt")].map(s => s.toLowerCase()).filter(s => /^[a-z]+$/.test(s));
  const out = new Set();
  for (const b of base) {
    for (const suf of INFLECT) {
      const w = b + suf;
      if (set.has(w) && !allow.has(w)) out.add(w);
    }
  }
  return [...out].sort();
}

let cached = null;
export function wordData() {
  if (cached) return cached;
  const { words, sha } = loadEnable();
  const blocked = blockedWords(words);
  const blockedSet = new Set(blocked);
  const clean = words.filter(w => !blockedSet.has(w));
  const require = createRequire(import.meta.url);
  const Engine = require(path.join(ROOT, "src/assets/engine.js"));
  Engine.init(words, blocked);
  const byLength = {};
  for (const w of words) byLength[w.length] = (byLength[w.length] || 0) + 1;
  cached = { words, clean, blocked, blockedSet, sha, Engine, byLength, set: new Set(words) };
  return cached;
}

export const fmt = n => n.toLocaleString("en-US");
