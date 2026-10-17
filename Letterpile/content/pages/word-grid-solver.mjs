// Word Grid Solver (4x4 or 5x5 letter grids; words through touching tiles; Q is "Qu"). The worked
// example is computed with the page's own search (src/assets/js/wordtools.js).
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const rows = [["t", "r", "a", "p"], ["s", "e", "n", "i"], ["l", "o", "d", "c"], ["qu", "a", "r", "t"]];
  const res = T.grid(rows);
  const everyday = res.filter(x => x.common);
  const longest = everyday[0].word;
  const three = res.filter(x => x.word.length === 3).length;
  const qu = res.filter(x => x.word.includes("qu")).map(x => x.word);
  const show = `<table class="lp-example">${rows.map(r => `<tr>${r.map(t => `<td>${t === "qu" ? "Qu" : t.toUpperCase()}</td>`).join("")}</tr>`).join("")}</table>`;
  return {
    key: "grid", path: "/word-grid-solver", file: "word-grid-solver.html", type: "tool", script: "grid", wordtools: true,
    title: "Word Grid Solver: Find Words in a Letter Grid | Letterpile",
    description: "Type in a 4x4 or 5x5 letter grid and see every word you can trace through touching tiles, longest first. Tap a word to see its path.",
    h1: "Word Grid Solver",
    lede: "Fill in the grid row by row (or paste all the letters at once), then press Find words. Tap any result to light up its path.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field narrow"><span>Grid size</span><select id="size"><option value="4" selected>4 × 4</option><option value="5">5 × 5</option></select></label>
            <label class="field grow2"><span>Or type all the letters</span><input id="quick" type="text" maxlength="40" placeholder="Row by row, e.g. TRAPSENILODCQART"></label>
            <label class="field narrow"><span>Shortest word</span><select id="min"><option value="3" selected>3 letters</option><option value="4">4 letters</option><option value="5">5 letters</option></select></label>
          </div>
          <div class="wt-grid" id="grid" role="group" aria-label="Letter grid. Type one letter per square; Q becomes Qu."></div>
          <p class="wt-path" id="path" aria-live="polite"></p>
          ${ctx.showAllToggle}
          <div class="row"><button class="btn" type="submit">Find words</button><button class="btn secondary" type="button" id="clearGrid">Clear grid</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Every word in the grid appears here, longest first. Type Q for a Qu tile.</p></div>`,
    prose: `<p>Letter-grid games such as Boggle shake a set of letter cubes into a square tray, usually four by four or five by five, and give you a few minutes to find as many words as you can. A word is traced through tiles that touch, including diagonally, and each tile can be used only once in the same word. This solver finds every word in the grid at once, so you can check a finished round, settle an argument about a word, or see the long words you missed.</p>
<h2>How to use it</h2>
<ol>
<li>Choose 4 × 4 or 5 × 5.</li>
<li>Type the letters into the squares, one per square. The cursor moves on as you type, and the arrow keys move around the grid. You can also type or paste all the letters into the box above, row by row.</li>
<li>Type Q for the Qu tile. Most cube sets print Qu on one face, because Q almost never appears without U, so the solver treats every Q as the pair.</li>
<li>Press <b>Find words</b>. Results are grouped by length, longest first, with everyday words ahead of rare ones in each group. Tap a word to light up its path on the grid, numbered in order.</li>
</ol>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Here is a 4 × 4 grid, shown as you'd see it on the table:</p>
${show}
<p>The solver finds ${fmt(res.length)} words of three or more letters in it, ${fmt(three)} of them three letters long. The longest everyday word is ${code(longest)}. The Qu tile in the bottom corner takes part in ${qu.length ? `${fmt(qu.length)} word${qu.length === 1 ? "" : "s"}, such as ${ctx.list(qu, 2)}` : "no words here, which happens often: a Qu tile in a corner has only three neighbors"}. Most of the long words are rare, which says more about the word list than about the grid; the next section explains why.</p>
<h2>Scoring and word lists</h2>
<p>Classic rules score by length: one point for three- and four-letter words, two for five letters, three for six, five for seven and eleven for eight or more. Words found by more than one player are usually crossed out. This solver doesn't score, because house rules vary, but the length groups make it easy to tally a round.</p>
<p>The word list is ENABLE, an open list built for word games. It's generous: it includes many words that a printed dictionary marks as rare, and some that a group of friends might reject. Agree on a dictionary before you play. If you use the solver to check a round, the everyday words near the top of each group are the ones nobody is likely to argue about.</p>
<h2>Finding more words yourself</h2>
<ul>
<li><b>Hunt for endings.</b> Look for E-R, E-D, I-N-G and S next to each other, then work backward from them.</li>
<li><b>Use the corners.</b> Corner tiles have only three neighbors, so words through them are easy to overlook.</li>
<li><b>Find a long word, then its pieces.</b> A long word usually contains shorter ones along the same path, and each one counts.</li>
<li><b>Plurals and tenses.</b> If an S touches the last letter of a word, you have two words for the price of one.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>The solver checks every possible path, so if a word in the list can be traced, it's shown. It stops at ${fmt(5000)} words, far more than any real grid produces. Results depend only on the letters and the word list: a word your game accepts but ENABLE doesn't contain won't appear, and a word ENABLE contains but your game rejects will.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your grid stays in your browser; the search runs on your device. The address bar keeps the letters, so you can bookmark a grid or send it to someone.</p>
<p>Letterpile is not affiliated with any puzzle publisher; trademarks are listed at the foot of the page.</p>`,
    faq: [
      { q: "How does the Qu tile work?", a: "Type Q in a square and it becomes Qu. Words through that square use both letters, so QUIT needs only three tiles." },
      { q: "Can a word use the same tile twice?", a: "No. Each tile can be used once per word, which is the standard rule. A letter that appears on two different tiles can be used once from each." },
      { q: "Do diagonal moves count?", a: "Yes. A word can step to any of the up to eight tiles around the current one." },
      { q: "Why are there so many strange words?", a: "The open ENABLE list includes many rare words. Everyday words are listed first in each length group." },
      { q: "Can I use it for a 6x6 grid?", a: "Not yet. It supports 4 × 4 and 5 × 5, the two common sizes." },
      { q: "How do I see where a word is?", a: "Tap or press it in the results. Its tiles light up on the grid, numbered in order, and the path is spelled out under the grid." },
    ],
    related: [
      { href: "/letter-hive-solver", label: "Letter Hive Solver" },
      { href: "/text-twist-solver", label: "Text Twist & Wordscapes Solver" },
      { href: "/games/letterpile", label: "Play Letterpile, our daily grid game" },
      { href: "/anagram-solver", label: "Anagram Solver" },
    ],
  };
};
