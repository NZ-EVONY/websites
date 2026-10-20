// Board Solver for 15x15 tile games. The worked examples are computed with the page's own search
// (src/assets/js/wordtools.js board()) and the engine's letter values.
export default ctx => {
  const { code, fmt, esc, Engine, WordTools: T } = ctx;
  const values = Engine.SCHEMES.scrabble.values, wwf = Engine.SCHEMES.wwf.values;
  const empty = T.board(".".repeat(225), T.CLASSIC, "retains", { values });
  const cells = [..."."
    .repeat(225)];
  [..."quiz"].forEach((ch, k) => { cells[7 * 15 + 5 + k] = ch; });
  const mid = T.board(cells.join(""), T.CLASSIC, "aeirst?", { values });
  const top = mid[0];
  const where = p => `${p.across ? `${p.row + 1}${"ABCDEFGHIJKLMNO"[p.col]}` : `${"ABCDEFGHIJKLMNO"[p.col]}${p.row + 1}`} ${p.across ? "across" : "down"}`;
  const hook = T.board(cells.join(""), T.CLASSIC, "s", { values })[0];
  ctx.assertWords([empty[0].word, top.word]);
  return {
    key: "board", path: "/board-solver", file: "board-solver.html", type: "tool", script: "board", wordtools: true, scan: "#rack",
    title: "Board Solver: Best Plays on a 15x15 Tile Board | Letterpile",
    description: "Copy your tile-game board and rack into a 15x15 grid to see the highest-scoring plays, with bonus squares, crossing words and the all-tiles bonus.",
    h1: "Board Solver",
    lede: "Type the tiles on your board into the grid, add your rack, and press Find plays. Tap a play to see it on the board.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field grow2"><span>Your rack</span><input class="big-input" id="rack" type="text" maxlength="7" placeholder="Up to 7 letters, ? for blanks" required></label>
            <label class="field"><span>Letter values</span><select id="values"><option value="classic" selected>Common tile values</option><option value="wwf">Words With Friends values</option></select></label>
          </div>
          <div class="row">
            <button class="btn secondary small" type="button" id="dir" aria-live="polite">Typing: across →</button>
            <button class="btn secondary small" type="button" id="blank">Mark tile as blank</button>
            <button class="btn secondary small" type="button" id="clearBoard">Clear board</button>
          </div>
          <div class="bs-wrap"><div class="bs-board" id="board" role="group" aria-label="Board, 15 by 15. Columns A to O, rows 1 to 15. Type a letter in a square to place a tile." data-app="board" data-classic="${T.CLASSIC}" data-classic-values="${esc(JSON.stringify(values))}" data-wwf="${esc(JSON.stringify(wwf))}"></div></div>
          <p class="hint" id="preview" aria-live="polite"></p>
          <div class="row"><button class="btn" type="submit">Find plays</button><button class="btn secondary" type="button" id="playIt" hidden>Put this play on the board</button></div>
          <details class="bs-bonus"><summary>Bonus squares</summary>
            <label class="check"><input type="checkbox" id="editBonus"> Edit bonus squares (tap a square to cycle DL, TL, DW, TW, none)</label>
            <button class="btn secondary small" type="button" id="resetBonus">Back to the standard layout</button>
          </details>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">The best plays appear here, highest score first.</p></div>`,
    prose: `<p>A word finder tells you which words your rack can make. A board solver goes further: it looks at the actual board, every square where a word could go, the bonus squares, and the extra words a play forms alongside existing tiles, and ranks every legal play by its score. This one works with the standard 15 × 15 layout used by the classic tile game, and you can edit the bonus squares to match other boards.</p>
<h2>How to use it</h2>
<ol>
<li>Type each tile on your board into its square. After each letter the cursor moves right; press <b>Typing: across</b> (or the space bar) to move down instead. Arrow keys move around the board.</li>
<li>If a tile on the board is a blank, select it and press <b>Mark tile as blank</b>. Blanks show their letter but score nothing.</li>
<li>Type your rack, up to seven letters, with <kbd>?</kbd> for each blank you hold. On a phone, <b>Scan tiles</b> can read the rack from a photo.</li>
<li>Press <b>Find plays</b>. The best play is shown on the board in a different color; tap any other play to preview it. <b>Put this play on the board</b> places it and takes those tiles off your rack, ready for your next turn.</li>
</ol>
<!--@slot after-intro-->
<h2>Worked examples</h2>
<p>On an empty board with the rack ${code("retains")}, the best plays use all seven tiles. ${code(empty[0].word)} scores ${fmt(empty[0].score)}: the letters add up to 7, a double letter square under one of them adds 1, the center star doubles the word to 16, and using all seven tiles adds 50. Any of the rack's seven-letter anagrams scores the same in that spot.</p>
<p>Now put ${code("quiz")} across the middle row, from 8F to 8I, and hold ${code("aeirst")} plus a blank. The top play is ${code(top.word)} at ${where(top)} for ${fmt(top.score)} points${top.tiles.length === 7 ? ", using all seven tiles" : ""}. ${hook ? `With just an ${code("s")}, the best you can do is ${code(hook.word)} at ${where(hook)} for ${fmt(hook.score)}${hook.words.length > 1 ? `, which also makes ${ctx.list(hook.words.slice(1), 3)}` : ""}.` : ""}</p>
<h2>How plays are scored</h2>
<ul>
<li><b>Letter bonuses</b> (double and triple letter) multiply the tile placed on them, once, when it's placed.</li>
<li><b>Word bonuses</b> (double and triple word, and the center star) multiply every word that runs through the new tile on them. Two word bonuses in one word multiply together.</li>
<li><b>Crossing words</b>: every new word formed by a placed tile and the tiles beside it scores in full, with bonuses for the new tile.</li>
<li><b>Blanks</b> score zero. When your rack has a blank, the solver uses it for the letter where it costs the fewest points.</li>
<li><b>All seven tiles</b> add a bonus: 50 points with common tile values, 35 with Words With Friends values.</li>
</ul>
<h2>Legal plays</h2>
<p>Every play's tiles must sit in one row or one column, with no gaps once the tiles already on the board are counted. The play must touch at least one existing tile, or cover the center square on the first move. Every word formed, the main word and every crossing word, must be in the word list. The solver checks all of these, so every play listed is one you can make.</p>
<h2>Strategy beyond the top score</h2>
<p>The highest score isn't always the best move. Keeping a balanced rack (a mix of vowels and consonants, and an S or a blank for later) can be worth more than a few points now. Opening a triple word square for your opponent can cost you more than you gain. Use the list to compare: the second or third play often scores nearly as much while keeping better tiles. Our guide to <a href="/guides/rack-balance">rack balance</a> explains the trade-offs.</p>
<h2>Limits</h2>
<p>The word list is ENABLE, an open list for word games. Tournament and app dictionaries differ, so check a surprising word against your game before you play it. Words With Friends uses a different board layout from the classic one; choose its letter values, then use <b>Edit bonus squares</b> to match your board. The solver lists the top 40 plays.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your board and rack stay in your browser; the search runs on your device. The address bar keeps them, so you can bookmark a position.</p>`,
    faq: [
      { q: "How do I enter a blank tile that's already on the board?", a: "Type its letter, keep that square selected, and press “Mark tile as blank”. It's shown in a different style and scores zero." },
      { q: "Which board layout does it use?", a: "The standard 15 × 15 layout of the classic tile game. Open “Bonus squares” to edit any square for a different board." },
      { q: "Why isn't the top play always the best move?", a: "The solver only maximizes this turn's score. Rack balance and the squares you open for your opponent matter too." },
      { q: "Does it know which words my game accepts?", a: "No. It uses the open ENABLE word list. Games use their own dictionaries, so check unusual words." },
      { q: "What does “Put this play on the board” do?", a: "It places the shown play's tiles on the board and removes them from your rack, so you can type your new tiles and plan the next turn." },
      { q: "Can it read my rack from a photo?", a: "Yes. Press “Scan tiles” and take or choose a photo. The letters are read on your device and shown for you to check before they're used." },
    ],
    related: [
      { href: "/tile-word-finder", label: "Tile Game Word Finder" },
      { href: "/words-with-friends", label: "Alternate Values Finder" },
      { href: "/guides/letter-values-and-tile-counts", label: "Letter Values and Tile Counts" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
    ],
  };
};
