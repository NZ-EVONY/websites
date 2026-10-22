// Hand-written word page notes (scripts/words/word-notes.txt). A word page with a complete "ok"
// entry shows a meaning, example and note, and is indexed; see the search-index policy in build.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const NOTES_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "word-notes.txt");
const POS = new Set(["noun", "verb", "adjective", "adverb", "determiner", "pronoun", "preposition", "conjunction", "interjection"]);
const BANNED = [/\bofficial/i, /\b(AI|ChatGPT|Claude|generated)\b/, /\bcheat/i];

// Returns the problems with one entry (empty when it is complete and publishable).
export function entryProblems(e) {
  const out = [];
  if (!/^[a-z]{3,8}$/.test(e.word || "")) out.push("bad word");
  if (!e.pos || !e.pos.split(/,\s*/).every(p => POS.has(p))) out.push("bad part of speech");
  if (!e.meaning || e.meaning.length < 40) out.push("meaning too short");
  if (!e.example || !/^".+"$/.test(e.example) || e.example.length < 20) out.push("example missing or not quoted");
  const sentences = (e.note || "").split(/(?<=[.!?]["”]?)\s+(?=["“A-Z])/).filter(Boolean).length;
  if (!e.note || e.note.length < 80 || sentences < 2) out.push("note needs at least two sentences");
  if (!["ok", "draft"].includes(e.status)) out.push("status must be ok or draft");
  for (const f of ["meaning", "example", "note"]) for (const b of BANNED) if (b.test(e[f] || "")) out.push(`${f} uses banned wording ${b}`);
  return out;
}

export function loadWordNotes(file = NOTES_FILE) {
  const entries = [];
  for (const [i, line] of fs.readFileSync(file, "utf8").split(/\r?\n/).entries()) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [word, pos, meaning, example, note, status, ...extra] = line.split(" | ").map(s => s.trim());
    entries.push({ line: i + 1, word, pos, meaning, example, note, status, extra: extra.length });
  }
  return entries;
}

// Map of word -> entry, only for complete entries marked ok.
export function publishedNotes(file) {
  const m = new Map();
  for (const e of loadWordNotes(file)) if (e.status === "ok" && !e.extra && !entryProblems(e).length) m.set(e.word, e);
  return m;
}
