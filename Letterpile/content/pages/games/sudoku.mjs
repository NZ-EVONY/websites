// Daily Sudoku (/games/sudoku): one 9x9 puzzle a day, easiest on Monday and hardest on Saturday.
// The grid and number pad are in the HTML; src/assets/games/sudoku.js adds the play.
export default ctx => {
  const cells = [...Array(9).keys()].map(r => `<div class="sd-row" role="row">${[...Array(9).keys()].map(c => `<button type="button" class="sd-cell" role="gridcell" data-i="${r * 9 + c}" tabindex="${r + c === 0 ? 0 : -1}" aria-label="Row ${r + 1}, column ${c + 1}, empty"></button>`).join("")}</div>`).join("");
  return {
    key: "game-sudoku", section: "games", path: "/games/sudoku", file: "games/sudoku.html", type: "game", game: "sudoku", games: ["sudoku"],
    title: "Daily Sudoku: A New 9×9 Puzzle Every Day | Letterpile",
    description: "A free daily sudoku with exactly one solution. Easy on Monday, hard by Saturday, with pencil notes, conflict highlighting, undo and a timer.",
    h1: "Daily Sudoku",
    crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Daily Sudoku", path: "/games/sudoku" }],
    tool: `<div class="sudoku-game">
          <div class="game-bar"><span class="game-msg" id="sdMsg" role="status" aria-live="polite">Loading today's puzzle…</span><span class="game-tools"><span class="pill" id="sdLevel"></span><span class="game-timer" id="sdTimer" aria-label="Time">0:00</span></span></div>
          <div class="sd-grid" id="sdGrid" role="grid" aria-label="Sudoku grid. Use the arrow keys to move and type a digit.">${cells}</div>
          <div class="sd-pad" id="sdPad" role="group" aria-label="Number pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button type="button" class="key" data-digit="${d}">${d}</button>`).join("")}</div>
          <div class="sd-actions">
            <button type="button" class="btn secondary small" id="sdNotes" aria-pressed="false">Notes: off</button>
            <button type="button" class="btn secondary small" id="sdErase">Erase</button>
            <button type="button" class="btn secondary small" id="sdUndo">Undo</button>
          </div>
          <div class="game-done" id="sdDone" hidden><h2>Solved!</h2><p id="sdDoneText"></p><button type="button" class="btn" id="sdShare">Share result</button></div>
        </div>`,
    prose: `<h2>How to play</h2>
<p>Fill the grid so that every row, every column and every 3×3 box contains the digits 1 to 9 exactly once. Some digits are given at the start and can't be changed. Select a square by tapping it or moving with the arrow keys, then type a digit or tap it on the number pad.</p>
<ul>
<li><b>Notes</b> switches to pencil marks: small candidate digits you can keep in a square while you work it out. Placing a digit clears that digit from the notes in the same row, column and box. You can also press <kbd>N</kbd> to switch.</li>
<li><b>Conflicts</b> are shown in red as soon as the same digit appears twice in a row, column or box.</li>
<li><b>Undo</b> steps back one move at a time (<kbd>Ctrl</kbd> + <kbd>Z</kbd> also works). <b>Erase</b> or <kbd>Backspace</kbd> clears a square.</li>
</ul>
<h2>Difficulty through the week</h2>
<p>Monday and Tuesday are Easy: every square can be found by looking for the only digit that fits a square, or the only square where a digit fits in a row, column or box. Wednesday, Thursday and Sunday are Medium and need one more idea: when a digit's only places in a box all sit on one line, it can be crossed off the rest of that line. Friday and Saturday are Hard, with fewer givens, and need pairs and triples: two squares in a unit that can only hold the same two digits rule those digits out everywhere else in the unit.</p>
<p>Every puzzle is checked by a solver before it's published: it has exactly one solution, and it can be solved by logic alone, with no guessing.</p>
<h2>Saving and sharing</h2>
<p>Your progress, notes and time are saved in this browser, so you can close the page and carry on later. The timer pauses while the page is hidden. When you finish, <b>Share result</b> copies your time and the day's difficulty, without the solution.</p>`,
    faq: [
      { q: "When does the puzzle change?", a: "Every day at 00:00 UTC. The countdown above the grid shows how long is left." },
      { q: "Does every puzzle have only one solution?", a: "Yes. Each one is checked by a solver that counts solutions before it goes on the site, and it can be solved without guessing." },
      { q: "Can I play an earlier puzzle?", a: "Yes, the <a href=\"/games\">Daily Games</a> page links to the last seven days' puzzles." },
      { q: "Why is a digit red?", a: "The same digit appears twice in its row, column or box. Red marks a rule conflict, not a comparison with the solution." },
      { q: "Can I play with a keyboard?", a: "Yes. Arrow keys move, 1 to 9 place a digit, Backspace erases, N switches notes on and off, and Ctrl+Z undoes." },
    ],
    related: [
      { href: "/games", label: "All daily games" },
      { href: "/games/word", label: "Daily Word" },
    ],
  };
};
