// Wordle Solver. Copy reused from the live page; tile colors now spelled the American way.
export default ctx => {
  ctx.assertWords(["speed", "slate", "crane", "trace"]);
  const five = ctx.byLength[5];
  return {
    key: "wordle", path: "/wordle-solver", file: "wordle-solver.html", type: "tool", script: "wordle",
    title: "Wordle Solver: Words That Fit Your Guesses | Letterpile",
    description: "Enter your guesses and colors to see which five-letter words still fit, plus a suggested next guess. No spoilers.",
    h1: "Wordle Solver",
    lede: "Type each guess, then tap its tiles until the colors match your game. The list of possible words updates as you go.",
    tool: `<form class="row end" id="addForm" autocomplete="off" data-warm>
          <label class="field grow"><span>Add a guess</span><input class="big-input" id="guess" type="text" maxlength="8" placeholder="e.g. CRANE"></label>
          <label class="field narrow"><span>Word length</span><select id="size"><option>4</option><option selected>5</option><option>6</option><option>7</option><option>8</option></select></label>
          <button class="btn" type="submit">Add</button>
          <button class="btn secondary" type="button" id="reset">Reset</button>
        </form>
        <div class="wgrid" id="grid"></div>
        <p class="hint" id="howto">Tap or press a tile to cycle <b class="c-grey">gray</b> → <b class="c-warn">yellow</b> → <b class="c-good">green</b>. Each tile also shows a mark: none for gray, a dot for yellow, a check for green.</p>
        ${ctx.showAllToggle}
        <div class="results" id="results" aria-live="polite"><p class="empty">Add your first guess to see the words that still fit. Before any guess, all ${ctx.fmt(five)} five-letter words in the list are possible.</p></div>`,
    prose: `<h2>How the solver thinks</h2>
        <ul>
          <li><b>Green</b> pins a letter to that spot.</li>
          <li><b>Yellow</b> means the letter is in the word, just not there.</li>
          <li><b>Gray</b> means there are no more copies of that letter than the green and yellow ones you've already found. That's how double letters work: guess <code>SPEED</code> for a word with one E, and the second E turns gray without ruling E out.</li>
        </ul>
        <h2>Choosing your next guess</h2>
        <p>Suggestions are ranked by how common their letters are among the words still possible. A guess made of widely shared letters splits the field hardest, whatever colors come back. Words with repeated letters rank lower because they test fewer letters.</p>
        <p>The list is a general English word list (ENABLE), not the game's own answer list, so it includes obscure words the game won't pick as answers. If the top suggestion looks odd, the next few usually include the everyday word. The solver does not know today's answer.</p>`,
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Openers with five different common letters test the most at once. <code>SLATE</code>, <code>CRANE</code> and <code>TRACE</code> are examples.</p></section>`,
  };
};
