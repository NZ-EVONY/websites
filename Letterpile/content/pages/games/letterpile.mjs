// Letterpile, the game (/games/letterpile): the daily pile, plus the shared markup used by the
// Practice and Arcade pages. Play is in src/assets/games/letterpile.js.
import { shareRow } from "../../../src/templates/partials/game-cards.mjs";

// The board, controls and end panel, shared by the three modes.
export function lpTool(ctx, mode) {
  const daily = mode === "daily";
  return `<div class="lp-game" data-mode="${mode}" data-wordlist="${ctx.assets["words.js"]}"${mode === "practice" ? ` data-lpwords="${ctx.assets["games/lp-words.json"]}" data-lpgen="${ctx.assets["games/lp-gen.js"]}"` : ""}>
          <div class="game-bar"><span class="game-msg" id="lpMsg" role="status" aria-live="polite">Loading…</span><span class="game-tools"><span class="pill" id="lpScore"></span><span class="game-timer" id="lpTimer" aria-label="Time" hidden>0:00</span>
            <button type="button" class="btn secondary small" id="lpHowBtn" aria-haspopup="dialog">How to play</button>
            ${daily ? `<label class="check lp-timer-toggle"><input type="checkbox" id="lpTimerToggle"> Timer</label>` : ""}</span></div>
          <div class="lp-wrap"><div class="lp-board" id="lpBoard" role="group" aria-label="Letter pile. Drag or tap through neighboring tiles to spell a word, or type its letters."></div></div>
          <p class="lp-note" id="lpNote" hidden>These tiles can't be reached any more.</p>
          <div class="lp-current" aria-live="polite"><span class="lp-word" id="lpWord"></span></div>
          <div class="lp-actions">
            <button type="button" class="btn" id="lpSubmit" disabled>Play word</button>
            <button type="button" class="btn secondary small" id="lpClear">Clear</button>
            ${mode !== "arcade" ? `<button type="button" class="btn secondary small" id="lpUndo">Undo</button>` : ""}
            ${mode !== "arcade" ? `<button type="button" class="btn secondary small" id="lpRestart">Restart</button>` : ""}
            ${mode !== "arcade" ? `<button type="button" class="btn secondary small" id="lpHint">Hint</button>` : ""}
            ${mode !== "daily" ? `<button type="button" class="btn secondary small" id="lpNew">New board</button>` : ""}
          </div>
          <ol class="lp-played" id="lpPlayed" aria-label="Words played"></ol>
          <div class="game-done" id="lpDone" hidden>
            <h2 id="lpDoneTitle">Cleared!</h2>
            <p id="lpDoneText"></p>
            ${daily ? `<dl class="stat-row lp-stats"><div><dt>Played</dt><dd data-stat="played">0</dd></div><div><dt>Current streak</dt><dd data-stat="cur">0</dd></div><div><dt>Best streak</dt><dd data-stat="best">0</dd></div><div><dt>At or under par</dt><dd data-stat="par">0</dd></div></dl>
            <h3>Words over par</h3>
            <ol class="dist" id="lpDist">${["Par or better", "+1", "+2", "+3", "+4", "+5 or more"].map((l, i) => `<li><span class="n lp-n">${l}</span><span class="bar" data-dist="${i}">0</span></li>`).join("")}</ol>
            ${shareRow()}` : ""}
          </div>
          <dialog class="lp-how" id="lpHow" aria-labelledby="lpHowTitle">
            <h2 id="lpHowTitle">How to play</h2>
            <ol class="lp-how-steps">
              <li><span class="lp-demo lp-demo1" aria-hidden="true"><i>C</i><i>A</i><i>T</i></span><span><b>Trace a word</b> through neighboring tiles, including diagonals. Drag, tap tile by tile, or type the letters. Words need 3 or more letters.</span></li>
              <li><span class="lp-demo lp-demo2" aria-hidden="true"><i>D</i><i>O</i><i>G</i></span><span><b>Play it</b> and its tiles vanish. Tiles above fall into the gaps; empty columns close up.</span></li>
              <li><span class="lp-demo lp-demo3" aria-hidden="true"><i>★</i></span><span><b>${mode === "arcade" ? "Score big" : "Clear the pile"}</b> ${mode === "arcade" ? "in 8 words. New tiles drop in from the top; long words score far more." : "in as few words as you can. Par is the target. Undo and restart are free, and up to 3 hints show where a word starts."}</span></li>
            </ol>
            <button type="button" class="btn" id="lpHowClose">Let's play</button>
          </dialog>
        </div>`;
}

export default ctx => ({
  key: "game-letterpile", section: "games", path: "/games/letterpile", file: "games/letterpile.html", type: "game", game: "letterpile", games: ["lp-engine", "letterpile"], og: "letterpile",
  title: "Letterpile: The Daily Pile of Letters Puzzle | Letterpile",
  description: "Our own daily word puzzle: trace words through a 5×5 pile of letter tiles, watch the rest fall, and clear the pile in as few words as you can.",
  h1: "Letterpile",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Letterpile", path: "/games/letterpile" }],
  tool: lpTool(ctx, "daily"),
  prose: `<h2>How to play</h2>
<p>Letterpile is our own word puzzle. You start with a 5×5 pile of letter tiles. Trace a word by dragging through neighboring tiles, including diagonally, or by tapping tile by tile; each tile can be used once per word, and words need at least three letters. Press <b>Play word</b> and its tiles disappear. The tiles above them fall straight down to fill the gaps, and if a whole column empties, the columns to its right slide left to close it up, so no tile is ever cut off by an empty column. Every word changes what you can spell next.</p>
<p>The goal is to clear the whole pile in as few words as possible. Each day's par is the fewest words we know it can be done in. Every board is built backwards from real words, so it can always be cleared. If a letter can no longer be part of any word, whatever you play next, its tiles are dimmed. When no word can be made from the tiles left, the game ends by itself and the leftover tiles are counted. Undo still works after that, so you can go back and try another route.</p>
<ul>
<li><b>Undo and Restart</b> are unlimited. It's a puzzle, not a test.</li>
<li><b>Hints</b>: up to three a day. Each one lights up the first tile of a word that helps clear the pile. Hints you use appear in your result.</li>
<li><b>Keyboard</b>: type a word's letters to trace it (where there's only one choice), Enter to play, Backspace to step back, Escape to clear.</li>
<li><b>Timer</b>: off by default. Turn it on with the Timer switch if you like to race.</li>
</ul>
<h2>Strategy in brief</h2>
<p>Long words clear more tiles at once, but the order matters more than the length. Look at the bottom row first: letters there have nothing below them to fall into, and an awkward letter like Q, V or X stranded at the bottom can end your game. The <a href="/guides/letterpile">Letterpile guide</a> walks through strategy, with worked examples.</p>
<p>Want more? <a href="/games/letterpile/practice">Practice mode</a> deals unlimited new piles, and <a href="/games/letterpile/arcade">Arcade mode</a> is a 6×6 race for points with new tiles falling in.</p>`,
  faq: [
    { q: "When does the pile change?", a: "Every day at 00:00 UTC. The countdown above the board shows how long is left." },
    { q: "Can every pile be cleared?", a: "Yes. Each daily pile is built backwards from a set of words, so there is always a way to clear it, and par is the fewest words we found." },
    { q: "What happens when a column empties?", a: "It closes up: the columns to its right slide left, so the pile stays in one piece. Tiles can still be left with no word to make, and those are dimmed." },
    { q: "Which words count?", a: "Any word of three or more letters in the ENABLE word list, except a short list of rude words. Names and abbreviations aren't in the list." },
    { q: "Do hints or undo affect my result?", a: "Undo and restart don't. Hints are shown in your result and share text, so friends know how you got there." },
    { q: "What do the colored squares in my result mean?", a: "One square per word, colored by its length: yellow for 3 letters, green for 4, blue for 5 and purple for 6 or more. They show your path without giving the words away." },
  ],
  related: [
    { href: "/guides/letterpile", label: "Letterpile guide and strategy" },
    { href: "/games/letterpile/practice", label: "Letterpile Practice" },
    { href: "/games/letterpile/arcade", label: "Letterpile Arcade" },
    { href: "/games", label: "All daily games" },
  ],
});
