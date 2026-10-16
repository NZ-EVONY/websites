// Daily Word Search (/games/wordsearch): a 20x20 themed grid with 25-30 words in all eight
// directions. The grid and word list are drawn by src/assets/games/wordsearch.js.
export default () => ({
  key: "game-wordsearch", section: "games", path: "/games/wordsearch", file: "games/wordsearch.html", type: "game", game: "wordsearch", games: ["wordsearch"],
  title: "Daily Word Search: A New Theme Every Day | Letterpile",
  description: "A free daily word search: find 25 to 30 themed words hidden in a 20×20 grid, across, down, diagonally and backwards. New theme every day.",
  h1: "Daily Word Search",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Daily Word Search", path: "/games/wordsearch" }],
  tool: `<div class="ws-game">
          <div class="game-bar"><span class="game-msg" id="wsMsg" role="status" aria-live="polite">Loading today's puzzle…</span><span class="game-tools"><span class="pill" id="wsCount"></span><span class="game-timer" id="wsTimer" aria-label="Time">0:00</span><button type="button" class="btn secondary small" id="wsZoom" aria-pressed="false">Zoom in</button></span></div>
          <p class="ws-theme" id="wsTheme"></p>
          <div class="ws-wrap" id="wsWrap">
            <div class="ws-grid" id="wsGrid" tabindex="0" role="application" aria-roledescription="word search grid" aria-label="Word search grid. Drag across a word, or tap its first and last letters. With a keyboard, move with the arrow keys and press Enter at the first and last letters."></div>
          </div>
          <h2 class="ws-list-title">Words to find</h2>
          <ul class="ws-words" id="wsWords"></ul>
          <div class="game-done" id="wsDone" hidden><h2>All found!</h2><p id="wsDoneText"></p><button type="button" class="btn" id="wsShare">Share result</button></div>
        </div>`,
  prose: `<h2>How to play</h2>
<p>Every day brings a new theme and a 20×20 grid of letters with 25 to 30 words from that theme hidden in it. Words run in straight lines in any of the eight directions: left to right, right to left, up, down and along both diagonals, forwards or backwards. Words often cross and share letters.</p>
<ul>
<li><b>Drag</b> from the first letter of a word to the last, with a mouse or a finger. The selection snaps to the nearest straight line.</li>
<li><b>Or tap</b> the first letter, then the last letter. Tap the first letter again to cancel.</li>
<li><b>With a keyboard</b>, select the grid, move with the arrow keys and press Enter or Space on the first and last letters.</li>
</ul>
<p>A found word is crossed off the list and stays highlighted in the grid. Words made of two words, like OVEN MITT, are hidden without the space. On a small screen, <b>Zoom in</b> makes the letters larger; scroll the grid and tap the first and last letters to select.</p>
<h2>How the puzzles are made</h2>
<p>Each puzzle is generated from a hand-written theme list and checked before it goes on the site: every word in the list appears in the grid exactly once, the words between them use all eight directions, and the filler letters are checked so that no rude word turns up by accident. A theme isn't repeated within five weeks.</p>
<p>Your found words and time are saved in this browser, so you can stop and come back later. The timer pauses while the page is hidden.</p>`,
  faq: [
    { q: "When does the puzzle change?", a: "Every day at 00:00 UTC, with a new theme. The countdown above the grid shows how long is left." },
    { q: "Do words go backwards?", a: "Yes. Words can run in all eight directions, including right to left, bottom to top and diagonally backwards." },
    { q: "Can a word be hidden twice?", a: "No. Each puzzle is checked so that every word on the list appears exactly once." },
    { q: "The letters are small on my phone. What can I do?", a: "Use Zoom in above the grid. The letters get larger and the grid scrolls; tap the first and last letters of a word to select it." },
    { q: "Can I play an earlier puzzle?", a: "Yes, the <a href=\"/games\">Daily Games</a> page links to the last seven days' puzzles." },
  ],
  related: [
    { href: "/games", label: "All daily games" },
    { href: "/games/word", label: "Daily Word" },
    { href: "/word-scrambler", label: "Word Scrambler" },
  ],
});
