// Crossword Solver. Copy reused from the live page and expanded; every example is computed.
export default ctx => {
  const { code, fmt } = ctx;
  const P = (p, o) => ctx.pattern(p, o);
  const cos = P("c?o?s");
  const q = P("q????", { exclude: "u" });
  const examples = [
    ["?a?e", {}, "four letters, A second, E last"],
    ["????ing", {}, "seven letters ending in ING"],
    ["q????", { exclude: "u" }, "five-letter Q words without a U in the gaps"],
    ["c?o?s", {}, "five letters: C, gap, O, gap, S"],
    ["c?o?s", { include: "r" }, "the same, but must contain an R"],
    ["?????", { include: "xz" }, "any five letters containing both X and Z"],
    ["s???e", { exclude: "aeiou" }, "S _ _ _ E with no other vowels"],
    ["??ght", {}, "five letters ending in GHT"],
  ].map(([p, o, d]) => [p, o, d, P(p, o)]);
  const fmtOpts = o => [o.include ? `include ${code(o.include)}` : "", o.exclude ? `exclude ${code(o.exclude)}` : ""].filter(Boolean).join(", ") || "–";
  return {
    key: "crossword", path: "/crossword-solver", file: "crossword-solver.html", type: "tool", script: "crossword",
    title: "Crossword Solver: Find Words by Pattern | Letterpile",
    description: "Type the letters you know and use ? for the gaps to find every word that fits, with must-include and exclude letters.",
    h1: "Crossword Solver",
    lede: `Type the letters you know and a <kbd>?</kbd> for each empty square. <code>C?O?S</code> finds ${ctx.list(cos, 3)} and ${fmt(cos.length - 3)} more.`,
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <input class="big-input grow" id="pattern" type="text" maxlength="21" placeholder="e.g. C?O?S" aria-label="Pattern: known letters, and ? or _ for unknown squares" required>
            <button class="btn" type="submit">Search</button>
          </div>
          <div class="row">
            <label class="field"><span>Must include letters</span><input type="text" id="include" maxlength="10" placeholder="e.g. R"></label>
            <label class="field"><span>Exclude letters</span><input type="text" id="exclude" maxlength="20" placeholder="e.g. AEI"></label>
          </div>
          <p class="hint" id="len"></p>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Matching words will appear here.</p></div>`,
    prose: `<p>When you know the length of a crossword answer and some of its letters, this solver lists every word in its list that fits. Type the pattern with a question mark for each empty square, and optionally say which letters must appear somewhere or can't appear in the gaps. It doesn't read clues; it narrows down spellings, which is often all you need once a couple of crossing answers are in. It's equally handy for word ladders, puzzle design and any game where you know a word's shape.</p>
<!--@slot after-intro-->
<h2>Writing a pattern</h2>
<p>One character per square. Known letters as themselves; unknown squares as <kbd>?</kbd>, <kbd>_</kbd> or <kbd>.</kbd>. The pattern's length is the answer's length, shown under the box as you type.</p>
<table>
<tr><th>Symbol</th><th>Meaning</th></tr>
<tr><td>A–Z</td><td>This square is that letter</td></tr>
<tr><td><kbd>?</kbd> <kbd>_</kbd> <kbd>.</kbd> <kbd>*</kbd></td><td>Any one letter (an empty square)</td></tr>
<tr><td>Must include</td><td>These letters appear somewhere in the word</td></tr>
<tr><td>Exclude</td><td>These letters can't fill the empty squares</td></tr>
</table>
<h2>Worked patterns</h2>
<p>Every count below was computed from the list this site uses:</p>
<table>
<tr><th>Pattern</th><th>Filters</th><th>What it means</th><th>Matches</th><th>Examples</th></tr>
${examples.map(([p, o, d, r]) => `<tr><td>${code(p)}</td><td>${fmtOpts(o)}</td><td>${d}</td><td>${fmt(r.length)}</td><td>${ctx.list(r, 3)}</td></tr>`).join("")}
</table>
<p>The Q pattern finds ${ctx.list(q, q.length)}: five-letter Q words with no U in the open squares.</p>
<h2>How to use it</h2>
<ol>
<li>Count the squares and type the pattern, using a question mark for each one you don't know.</li>
<li>If a crossing clue tells you a letter is in the answer but not where, add it to <b>Must include</b>.</li>
<li>If you've ruled letters out, add them to <b>Exclude</b>.</li>
<li>Press <b>Search</b>. Tap any result for its definition.</li>
</ol>
<h2>Using the extra filters</h2>
<p><b>Must include</b> is for letters you know are in the answer but not where, from a crossing clue you half-remember. <b>Exclude</b> removes letters from the empty squares only, so a letter you've already placed is never excluded.</p>
<h2>Reading the results</h2>
<p>The count shows how many words fit; up to 800 are listed alphabetically. If you see hundreds, fill in another crossing letter before searching again.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Miscounting squares.</b> Check the length shown under the box against the grid.</li>
<li><b>Phrases.</b> Answers with spaces, like phrases, aren't supported as such. Enter all the letters without the gap; multi-word answers will only match if the joined form is in the list, which is rare.</li>
<li><b>Proper nouns.</b> Names of people and places aren't in the word list, so crossword answers like those won't be found.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} Crossword answers often include names, abbreviations and phrases, which a word list doesn't contain. Use the results to test ideas, then check them against the clue.</p>
<h2>Privacy</h2>
<p>Patterns are matched in your browser, and nothing you type is sent to Letterpile.</p>`,
    faq: [
      { q: "Which characters stand for an unknown letter?", a: "Use ?, _, . or * for each empty square. Letters stand for themselves. Anything else is ignored." },
      { q: "What's the difference between Must include and Exclude?", a: "Must include lists letters that appear somewhere in the answer. Exclude lists letters that can't fill any empty square; letters you've already placed are never excluded." },
      { q: "Can it solve the clue for me?", a: "No. It matches spellings, not meanings. It's most useful once you have a few crossing letters." },
      { q: "Why isn't a name or abbreviation found?", a: "The word list contains ordinary lowercase words only, so names, places and most abbreviations are not included." },
      { q: "How long can a pattern be?", a: "Up to 21 squares." },
    ],
    related: [
      { href: "/words-by-length", label: "Words by Length" },
      { href: "/", label: "Word Unscrambler" },
      { href: "/guides/solve-daily-word-puzzles", label: "Solving Daily Word Puzzles" },
      { href: "/guides/word-lists-explained", label: "Word Lists Explained" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Crossing answers are your best friend. Fill in every letter you're sure of from crossing words before searching. Two known letters usually cut a long list down to a handful.</p></section>`,
  };
};
