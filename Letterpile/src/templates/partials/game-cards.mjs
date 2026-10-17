// The daily games: names, links and one-line descriptions, plus the card list used by the
// /games hub and the home page's "Today's puzzles" band. games/hub.js fills in each card's
// status (new, in progress, solved) for today from the visitor's saved progress. Optional games
// (config/games.json) start hidden and are shown only on days that have a puzzle.
import fs from "node:fs";
import { esc, tile } from "./util.mjs";

// A game is listed once its page module exists (content/pages/games/<key>.mjs).
const pageExists = href => fs.existsSync(new URL(`../../../content/pages${href}.mjs`, import.meta.url));

// The game list lives in config/games.json (one registry for the build, generators and tests).
export const GAME_INFO = JSON.parse(fs.readFileSync(new URL("../../../config/games.json", import.meta.url), "utf8")).games;

export function gameCards({ built = pageExists, heading = "h3" } = {}) {
  return `<ul class="game-cards">${GAME_INFO.filter(g => built(g.href)).map(g => `<li class="game-tile ${g.color}" data-game-card="${g.key}"${g.optional ? " data-optional hidden" : ""}>
        <div class="top">${tile(g.icon, { color: g.color, size: "md" })}<${heading}><a href="${g.href}">${esc(g.name)}</a></${heading}></div>
        <p>${esc(g.blurb)}</p>
        <p class="game-status" data-status>Today's puzzle is ready</p>
      </li>`).join("")}</ul>`;
}

// Share buttons for a finished game: the phone's own share sheet where available (Web Share
// API), plus "Copy result" and "Share to Facebook" (copies the text, then opens Facebook's
// share page for the game's URL). Wired up by Games.shareBar in src/assets/games/core.js.
export function shareRow({ hidden = false } = {}) {
  return `<div class="share-row" data-share${hidden ? " hidden" : ""}><button type="button" class="btn" data-share-native hidden>Share</button><button type="button" class="btn secondary small" data-share-copy>Copy result</button><button type="button" class="btn secondary small" data-share-fb>Share to Facebook</button></div>`;
}
