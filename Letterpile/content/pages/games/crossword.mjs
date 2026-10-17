// Daily Crossword (/games/crossword): a 15x15 crossword with original clues, new every day.
// The grid, clue lists and controls are drawn by src/assets/games/crossword.js.
import { shareRow } from "../../../src/templates/partials/game-cards.mjs";
export default () => ({
  key: "game-crossword", section: "games", path: "/games/crossword", file: "games/crossword.html", type: "game", game: "crossword", games: ["crossword"], og: "crossword",
  title: "Daily Crossword: A Free 15×15 Puzzle Every Day | Letterpile",
  description: "A free daily 15×15 crossword with original clues. Check or reveal a letter, word or the whole grid, with a timer and progress saved in your browser.",
  h1: "Daily Crossword",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Daily Crossword", path: "/games/crossword" }],
  tool: `<div class="cw-game">
          <div class="game-bar"><span class="game-msg" id="cwMsg" role="status" aria-live="polite">Loading today's puzzle…</span><span class="game-tools"><span class="game-timer" id="cwTimer" aria-label="Time">0:00</span>
            <details class="cw-menu"><summary class="btn secondary small">Check</summary><div><button type="button" data-act="check-cell">Letter</button><button type="button" data-act="check-word">Word</button><button type="button" data-act="check-all">Puzzle</button></div></details>
            <details class="cw-menu"><summary class="btn secondary small">Reveal</summary><div><button type="button" data-act="reveal-cell">Letter</button><button type="button" data-act="reveal-word">Word</button><button type="button" data-act="reveal-all">Puzzle</button></div></details></span></div>
          <div class="cw-main">
            <div class="cw-board">
              <div class="cw-grid" id="cwGrid" role="grid" aria-label="Crossword grid"></div>
              <div class="cw-bar" id="cwBar" aria-live="polite"><button type="button" class="cw-step" id="cwPrev" aria-label="Previous clue">‹</button><p id="cwClue"><b></b> <span></span></p><button type="button" class="cw-step" id="cwNext" aria-label="Next clue">›</button></div>
              <input class="cw-input" id="cwInput" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-label="Type a letter">
            </div>
            <div class="cw-lists" tabindex="0" role="region" aria-label="Clues">
              <section><h2>Across</h2><ol class="cw-clues" id="cwAcross"></ol></section>
              <section><h2>Down</h2><ol class="cw-clues" id="cwDown"></ol></section>
            </div>
          </div>
          <div class="game-done" id="cwDone" hidden><h2>Solved!</h2><p id="cwDoneText"></p>${shareRow()}</div>
        </div>`,
  prose: `<h2>How to play</h2>
<p>Fill the white squares with letters so that every across and down entry answers its clue. Tap or click a square to select it; tap it again to switch between across and down. The highlighted squares show the current entry, and its clue appears in the bar under the grid and is highlighted in the clue lists. Tap any clue to jump to its entry.</p>
<ul>
<li><b>Typing</b> fills the square and moves to the next one. <kbd>Backspace</kbd> clears and steps back, the arrow keys move around the grid, <kbd>Space</kbd> switches direction, and <kbd>Tab</kbd> jumps to the next clue.</li>
<li><b>Check</b> marks wrong letters in red, for the current letter, the current word or the whole puzzle.</li>
<li><b>Reveal</b> fills in the right letter, word or the whole grid. Revealed squares are marked with a small triangle.</li>
</ul>
<p>On a phone, the on-screen keyboard opens when you select a square, and the clue bar sits just above it so you can always see the clue you're answering.</p>
<h2>About the puzzles</h2>
<p>Each puzzle uses the standard daily layout: a 15×15 grid whose black squares look the same when the grid is turned upside down, 70 to 78 entries, no entry shorter than three letters, and every letter part of both an across and a down word. Clues are written for Letterpile and checked before publishing; the same answer doesn't get the same clue twice within five weeks.</p>
<p>Your letters, checks, reveals and time are saved in this browser, so you can stop and come back later. The timer pauses while the page is hidden. When you finish, <b>Share result</b> copies your time without spoiling any answers.</p>`,
  faq: [
    { q: "When does the crossword change?", a: "Every day at 00:00 UTC. The countdown above the grid shows how long is left." },
    { q: "How do I switch between across and down?", a: "Tap the selected square again, press Space, or tap a clue in the other list." },
    { q: "What do Check and Reveal do?", a: "Check marks wrong letters in red without fixing them. Reveal fills in the correct letters and marks them as revealed." },
    { q: "Can I play an earlier crossword?", a: "Yes, the <a href=\"/games\">Daily Games</a> page links to the last seven days' puzzles." },
    { q: "Who writes the clues?", a: "The clues are written for this site and checked by hand before each puzzle is published. If you spot a mistake, please <a href=\"/contact\">let us know</a>." },
  ],
  related: [
    { href: "/games", label: "All daily games" },
    { href: "/crossword-solver", label: "Crossword Solver" },
    { href: "/games/word", label: "Daily Word" },
  ],
});
