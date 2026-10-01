// Wordle Solver. Copy reused from the live page and expanded. The description of how
// suggestions are ranked matches Engine.wordleCandidates (sum of letter frequencies over
// the remaining candidates, counting each distinct letter once).
export default ctx => {
  const { code, fmt, Engine } = ctx;
  ctx.assertWords(["speed", "slate", "crane", "trace", "abide"]);
  const five = ctx.byLength[5];
  const shown5 = ctx.clean.filter(w => w.length === 5).length;
  const feedback = (g, a) => {
    const m = Array(5).fill("b"), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) m[i] = "g"; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (m[i] !== "g" && left[g[i]] > 0) { m[i] = "y"; left[g[i]]--; }
    return m.join("");
  };
  const name = m => [...m].map(c => ({ g: "green", y: "yellow", b: "gray" })[c]).join(", ");
  const m1 = feedback("speed", "abide");
  const after = Engine.wordleCandidates([{ word: "speed", marks: m1 }]);
  const start = Engine.wordleCandidates([]).slice(0, 5).map(x => x.word);
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
        <div class="results" id="results" aria-live="polite"><p class="empty">Add your first guess to see the words that still fit. Before any guess, all ${fmt(shown5)} five-letter words in the list are possible.</p></div>`,
    prose: `<p>This solver helps with daily five-letter guessing puzzles. You enter the guesses you've already made and set each tile to the color the game showed, and it lists every word in its word list that is still consistent with all of those clues, with a few suggested next guesses at the top. It doesn't know today's answer and never shows it; it only applies the logic you could do by hand. Four- to eight-letter variants are supported too.</p>
<!--@slot after-intro-->
<h2>How to use it</h2>
<ol>
<li>Type a guess you've made in the game and press <b>Add</b>. It appears as a row of gray tiles.</li>
<li>Tap (or select with the keyboard and press Enter) each tile until its color matches the game: gray, yellow or green.</li>
<li>Repeat for each guess. The list of possible words updates every time.</li>
<li>Pick your next guess from the suggestions, or from the full list if you prefer an everyday word.</li>
<li>Use <b>Reset</b> to start a new puzzle, or × to remove one guess. Change <b>Word length</b> for 4- to 8-letter variants.</li>
</ol>
<h2>How the solver thinks</h2>
<ul>
<li><b>Green</b> pins a letter to that spot.</li>
<li><b>Yellow</b> means the letter is in the word, just not there.</li>
<li><b>Gray</b> means there are no more copies of that letter than the green and yellow ones you've already found.</li>
</ul>
<h3>Repeated letters, worked through</h3>
<p>Suppose the answer were ${code("abide")} and you guessed ${code("speed")}. The game would show ${name(m1)}. The first E is yellow, because the answer has an E somewhere else. The second E is gray, but that doesn't rule E out: it only says there is no second E. Entering that row here leaves ${fmt(after.length)} possible words, and every one has exactly one E, not in the third or fourth position.</p>
<h2>Choosing your next guess</h2>
<p>Suggestions are ranked by how common their letters are among the words still possible: for each candidate, the solver adds up, for each different letter in it, how many remaining words contain that letter. A guess made of widely shared letters splits the field hardest, whatever colors come back. Words with repeated letters rank lower because they test fewer letters. With no guesses entered, the top of that ranking for five letters is ${ctx.list(start, 5)}.</p>
<p>This ranking is a simple heuristic, not a guarantee of the fewest guesses. Some players prefer to guess the most familiar remaining word; others prefer a probe that tests new letters. The <a href="/guides/solve-daily-word-puzzles">daily puzzle guide</a> explains when each makes sense.</p>
<h2>Reading the results</h2>
<p>The count at the top is how many words in the list fit your clues. “Suggested next guesses” shows the 12 highest-ranked; “All possibilities” lists up to 600 alphabetically. If the count is zero, a tile is probably set to the wrong color.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Marking every copy of a repeated letter the same color.</b> Copy the game's colors tile by tile; a repeated letter can have two different colors.</li>
<li><b>Typing the answer list's spelling instead of your guess.</b> Enter exactly what you guessed.</li>
<li><b>Changing word length mid-puzzle.</b> That clears your guesses, because the rules only make sense for one length.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>The list is a general English word list (ENABLE), not the game's own answer list, so it includes obscure words the game won't pick as answers. The old Letterpile list had more five-letter words; ENABLE has ${fmt(five)}, of which ${fmt(shown5)} are shown by default. If the top suggestion looks odd, the next few usually include the everyday word. Wordle™ is a trademark of The New York Times Company; Letterpile is not affiliated with it.</p>
<h2>Privacy</h2>
<p>Your guesses stay in your browser. They're kept in this tab's session storage so a reload doesn't lose them, and are cleared when you close the tab.</p>`,
    faq: [
      { q: "Does the solver know today's answer?", a: "No. It has no connection to the game and doesn't know any day's answer. It only lists words that fit the clues you enter." },
      { q: "Why does it suggest words the game never uses?", a: "It uses the open ENABLE word list, not the game's answer list. Many valid but obscure words can't be answers. Prefer familiar words when you choose." },
      { q: "How do repeated letters work?", a: `A gray tile on a repeated letter means there are no more copies than the ones shown green or yellow. Guessing ${code("speed")} when the answer has one E gives one colored E and one gray E.` },
      { q: "How are the suggested guesses chosen?", a: "Each remaining word gets a score: for every different letter in it, the number of remaining words that contain that letter. Higher scores test more common letters at once." },
      { q: "It says no words fit. What went wrong?", a: "Usually one tile's color doesn't match the game. Check each row, especially repeated letters. It's also possible the answer isn't in the ENABLE list." },
      { q: "Can I use it for 6-letter or 4-letter puzzles?", a: "Yes. Choose the word length before adding guesses. Lengths from 4 to 8 are supported." },
    ],
    related: [
      { href: "/guides/wordle-strategy", label: "Wordle Strategy and Letter Logic" },
      { href: "/guides/solve-daily-word-puzzles", label: "Solving Daily Word Puzzles" },
      { href: "/words-by-length/5-letter-words", label: "5-letter words" },
      { href: "/crossword-solver", label: "Crossword Solver" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Openers with five different common letters test the most at once. <code>SLATE</code>, <code>CRANE</code> and <code>TRACE</code> are examples.</p></section>`,
  };
};
