// Multi-Board Word Solver (four or eight five-letter boards played with the same guesses). Uses
// Engine.wordleCandidates for each board, like the Wordle Solver.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const fb = (g, a) => {
    const m = Array(5).fill("b"), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) m[i] = "g"; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (m[i] !== "g" && left[g[i]] > 0) { m[i] = "y"; left[g[i]]--; }
    return m.join("");
  };
  const answers = ["pilot", "shore", "fancy", "drown"];
  ctx.assertWords(["crane", ...answers]);
  const counts = answers.map(a => Engine.wordleCandidates([{ word: "crane", marks: fb("crane", a) }]).length);
  const name = m => [...m].map(c => ({ g: "green", y: "yellow", b: "gray" })[c]).join(", ");
  const total = Engine.wordleCandidates([]).length;
  return {
    key: "multi", path: "/multi-board-solver", file: "multi-board-solver.html", type: "tool", script: "multi",
    title: "Multi-Board Word Solver: 4 or 8 Boards at Once | Letterpile",
    description: "Track four or eight five-letter word boards at once. Enter each guess once, set every board's colors, and see the words left on each board.",
    h1: "Multi-Board Word Solver",
    lede: "Add each guess once; it appears on every board. Tap the tiles on each board to match its colors, and each board lists the words that still fit.",
    tool: `<form class="row end" id="addForm" autocomplete="off" data-warm>
          <label class="field grow"><span>Add a guess</span><input class="big-input" id="guess" type="text" maxlength="5" placeholder="e.g. CRANE"></label>
          <label class="field narrow"><span>Boards</span><select id="count"><option value="4" selected>4</option><option value="8">8</option></select></label>
          <button class="btn" type="submit">Add</button>
          <button class="btn secondary" type="button" id="undoGuess">Undo</button>
          <button class="btn secondary" type="button" id="reset">Reset</button>
        </form>
        <p class="hint">Tap a tile to cycle <b class="c-grey">gray</b> → <b class="c-warn">yellow</b> → <b class="c-good">green</b>. Each tile also shows a mark: none for gray, a dot for yellow, a check for green.</p>
        ${ctx.showAllToggle}
        <div class="results results--short" id="summary" aria-live="polite"></div>
        <div class="wt-boards" id="boards"></div>`,
    prose: `<p>Multi-board guessing games such as Quordle (four boards) and Octordle (eight) take the five-letter puzzle and multiply it: four hidden words at once, or eight, with every guess played on all the boards together. Each board colors the same guess differently, so after a few guesses you're tracking a lot of clues. This solver keeps one set of guesses and a separate set of colors for each board, and lists the words that still fit each one.</p>
<h2>How to use it</h2>
<ol>
<li>Choose 4 or 8 boards.</li>
<li>Type a guess you played and press <b>Add</b>. It appears on every board, all gray.</li>
<li>On each board, tap the tiles until they match the colors your game showed for that board.</li>
<li>Each board lists how many words are left and shows up to twelve of them. When a board is solved (all green), it's marked and skipped.</li>
<li>The suggested next guess at the top is the leading word for the board with the fewest words left. Undo removes the last guess from every board.</li>
</ol>
<!--@slot after-intro-->
<h2>Why one guess helps every board differently</h2>
<p>Suppose the four answers were ${ctx.list(answers, 4)} and you opened with ${code("crane")}. The boards would show ${answers.map((a, i) => `${name(fb("crane", a))} on board ${i + 1}`).join("; ")}. Before that guess, each board had ${fmt(total)} possible words. After it, they have ${counts.map(n => fmt(n)).join(", ")} respectively. One guess, four very different results: that's why a board-by-board view helps.</p>
<h2>Strategy for many boards</h2>
<ul>
<li><b>Open with coverage.</b> The first two or three guesses should test as many common letters as possible, without repeats, because the information applies to every board at once.</li>
<li><b>Finish the easy boards early.</b> A board with one or two words left is a cheap win. Solving it also gives you a free look at the other boards.</li>
<li><b>Use the suggestion to pick a target.</b> The suggestion comes from the board with the fewest words left, which is usually the safest next guess.</li>
<li><b>Watch your count.</b> Four-board games usually allow nine guesses and eight-board games thirteen. Leave enough guesses for the hardest board.</li>
</ul>
<h2>How each board's list is worked out</h2>
<p>Each board uses the same logic as our <a href="/wordle-solver">Wordle Solver</a>: green fixes a letter in place, yellow means the letter is in the word but not there, and gray means there are no more copies of the letter than the green and yellow ones shown. Repeated letters are handled tile by tile. Within each board's list, words are ranked by how many common letters they test among that board's remaining words.</p>
<h2>Limits and accuracy</h2>
<p>The word list is ENABLE, not a game's answer list, so the counts include rare words a game would never choose. The everyday word is usually near the top of each list. Five-letter words only; the solver holds up to 13 guesses.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your guesses and colors are kept in this tab's session storage, so a reload doesn't lose them. They're cleared when you close the tab.</p>
<p>Letterpile is not affiliated with any puzzle publisher; trademarks are listed at the foot of the page.</p>`,
    faq: [
      { q: "Do I have to type each guess on every board?", a: "No. Type it once; it appears on all the boards. You only set the colors on each board." },
      { q: "How is the suggested guess chosen?", a: "It's the top-ranked word for the unsolved board with the fewest words left. If that board has only one word, the suggestion is that word." },
      { q: "What happens when a board is solved?", a: "When a row on a board is all green, the board is marked solved and no longer affects the suggestion." },
      { q: "Can I use it for 16 boards?", a: "Not yet. It supports 4 and 8 boards, the two most common versions." },
      { q: "It says no words fit a board. Why?", a: "Usually one tile's color on that board doesn't match the game. Check repeated letters especially." },
      { q: "Does it know the answers?", a: "No. It has no connection to any game; it only lists words that fit the colors you enter." },
    ],
    related: [
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/guides/wordle-strategy", label: "Wordle Strategy and Letter Logic" },
      { href: "/games/word", label: "Daily Word" },
      { href: "/words-by-length/5-letter-words", label: "5-letter words" },
    ],
  };
};
