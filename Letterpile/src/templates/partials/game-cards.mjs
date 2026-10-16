// The four daily games: names, links and one-line descriptions, plus the card list used by the
// /games hub and the home page's "Today's puzzles" band. games/hub.js fills in each card's
// status (new, in progress, solved) for today from the visitor's saved progress.
import fs from "node:fs";
import { esc, tile } from "./util.mjs";

// A game is listed once its page module exists (content/pages/games/<key>.mjs).
const pageExists = href => fs.existsSync(new URL(`../../../content/pages${href}.mjs`, import.meta.url));

export const GAME_INFO = [
  { key: "word", href: "/games/word", name: "Daily Word", icon: "W", color: "c-mint", blurb: "Guess the five-letter word in six tries." },
  { key: "crossword", href: "/games/crossword", name: "Daily Crossword", icon: "X", color: "c-sun", blurb: "A full 15×15 crossword with fresh clues every day." },
  { key: "wordsearch", href: "/games/wordsearch", name: "Daily Word Search", icon: "S", color: "c-coral", blurb: "Find 25 or more themed words in a 20×20 grid." },
  { key: "sudoku", href: "/games/sudoku", name: "Daily Sudoku", icon: "9", color: "c-violet", blurb: "One 9×9 puzzle, easy on Monday, hardest on Saturday." },
];

export function gameCards({ built = pageExists, heading = "h3" } = {}) {
  return `<ul class="game-cards">${GAME_INFO.filter(g => built(g.href)).map(g => `<li class="game-tile ${g.color}" data-game-card="${g.key}">
        <div class="top">${tile(g.icon, { color: g.color, size: "md" })}<${heading}><a href="${g.href}">${esc(g.name)}</a></${heading}></div>
        <p>${esc(g.blurb)}</p>
        <p class="game-status" data-status>Today's puzzle is ready</p>
      </li>`).join("")}</ul>`;
}
