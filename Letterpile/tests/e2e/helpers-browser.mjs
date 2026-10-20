// Shared browser setup for e2e tests (Chromium via playwright-core).
import { createServer } from "../../scripts/serve.mjs";
import { findChrome } from "../../scripts/chrome.mjs";
import { PUBLIC } from "../helpers.mjs";

export const chrome = findChrome();
export const skip = chrome ? false : "NOT VERIFIED: no Chrome/Chromium found";

export async function withBrowser(fn, { root = PUBLIC } = {}) {
  const { chromium } = await import("playwright-core");
  const server = createServer(root).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chrome });
  try { return await fn(browser, base); } finally { await browser.close(); server.close(); }
}

// Pages that cover every template.
export const TEMPLATE_PAGES = [
  "/", "/word-scrambler", "/word-combiner", "/tile-word-finder", "/words-with-friends", "/wordle-solver",
  "/anagram-solver", "/jumble-solver", "/crossword-solver", "/text-twist-solver",
  "/guides", "/guides/two-letter-words", "/guides/wordle-strategy",
  "/words-by-length", "/words-starting-with", "/words-ending-in",
  "/words-by-length/5-letter-words", "/words-by-length/7-letter-words/s", "/words-starting-with/q", "/words-ending-in/ness",
  "/about", "/contact", "/privacy-policy", "/terms", "/sitemap", "/no-such-page",
  "/games", "/games/word", "/games/sudoku", "/games/wordsearch", "/games/crossword", "/games/word/hints", "/games/letterpile", "/games/letterpile/practice", "/games/letterpile/arcade",
  "/letter-hive-solver", "/word-grid-solver", "/letter-box-solver", "/multi-board-solver", "/word-ladder-solver", "/hangman-solver",
  "/cryptogram-solver", "/rhyming-words", "/syllable-counter", "/board-solver",
  "/word", "/word/planet", "/lists", "/training", "/word-of-the-day", "/printables", "/printables/animals", "/lists/words-with-q", "/lists/high-scoring-short-words",
];
