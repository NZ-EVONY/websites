// Shared helpers for the daily-game generators, validators and the build.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
// Game keys in display order, from the registry in config/games.json.
export const GAMES = JSON.parse(fs.readFileSync(path.join(ROOT, "config/games.json"), "utf8")).games.map(g => g.key);
// Puzzle numbers count from the first day of the games (Daily Word #1).
export const EPOCH = "2026-10-16";

const DAY = 86400000;
export const addDays = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY);
export const todayUTC = () => new Date().toISOString().slice(0, 10);
export const weekday = iso => new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sunday
export const puzzleNumber = iso => daysBetween(EPOCH, iso) + 1;

// Deterministic random numbers: every puzzle can be regenerated from its game and date.
export function rng(seed) {
  let h = parseInt(createHash("sha256").update(String(seed)).digest("hex").slice(0, 8), 16) >>> 0;
  return () => {
    h = (h + 0x6D2B79F5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export function shuffle(r, a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Light obfuscation for answers in published files (XOR with the key, then base64).
// The browser reverses it with Games.decode in src/assets/games/core.js.
export function encode(s, key) {
  let out = "";
  for (let i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return Buffer.from(out, "binary").toString("base64");
}
export function decode(s, key) {
  const bin = Buffer.from(s, "base64").toString("binary");
  let out = "";
  for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return out;
}
export const keyFor = (game, date) => `${game}:${date}`;

// ---------- puzzle files ----------

export const gameDir = (root, game) => path.join(root, "content/games", game);
export function puzzleDates(root, game) {
  const dir = gameDir(root, game);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
}
export const readPuzzle = (root, game, date) => JSON.parse(fs.readFileSync(path.join(gameDir(root, game), `${date}.json`), "utf8"));
export function writePuzzle(root, game, date, p) {
  fs.mkdirSync(gameDir(root, game), { recursive: true });
  fs.writeFileSync(path.join(gameDir(root, game), `${date}.json`), JSON.stringify(p) + "\n");
}

// A lexicon file: one entry per whitespace-separated token; lines starting with # are comments.
export function readList(file) {
  return fs.readFileSync(path.join(ROOT, "scripts/games/lexicon", file), "utf8").split(/\r?\n/)
    .filter(l => !l.trim().startsWith("#")).join(" ").split(/\s+/).filter(Boolean);
}
