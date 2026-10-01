// Crossword Solver. Copy reused from the live page; every example is computed.
export default ctx => {
  const cos = ctx.pattern("c?o?s");
  const q = ctx.pattern("q????", { exclude: "u" });
  return {
    key: "crossword", path: "/crossword-solver", file: "crossword-solver.html", type: "tool", script: "crossword",
    title: "Crossword Solver: Find Words by Pattern | Letterpile",
    description: "Type the letters you know and use ? for the gaps to find every word that fits, with must-include and exclude letters.",
    h1: "Crossword Solver",
    lede: `Type the letters you know and a <kbd>?</kbd> for each empty square. <code>C?O?S</code> finds ${ctx.list(cos, 3)} and ${ctx.fmt(cos.length - 3)} more.`,
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
    prose: `<h2>Writing a pattern</h2>
        <p>One character per square. Known letters as themselves; unknown squares as <kbd>?</kbd>, <kbd>_</kbd> or <kbd>.</kbd>. The pattern's length is the answer's length.</p>
        <table>
          <tr><th>Pattern</th><th>Finds (in the ENABLE list)</th></tr>
          <tr><td><code>?A?E</code></td><td>${ctx.fmt(ctx.pattern("?a?e").length)} four-letter words with A second and E last, such as ${ctx.list(["bake", "cafe", "game"], 3)}</td></tr>
          <tr><td><code>????ING</code></td><td>${ctx.fmt(ctx.pattern("????ing").length)} seven-letter words ending in ING</td></tr>
          <tr><td><code>Q????</code> + exclude <code>U</code></td><td>five-letter Q words without a U: ${ctx.list(q, q.length)}</td></tr>
        </table>
        <h2>Using the extra filters</h2>
        <p><b>Must include</b> is for letters you know are in the answer but not where, from a crossing clue you half-remember. <b>Exclude</b> removes letters from the empty squares only, so a letter you've already placed is never excluded.</p>
        <p>Answers with spaces, like phrases, aren't supported. Enter the letters without the gap. ${ctx.WORDLIST_NOTE}</p>`,
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Crossing answers are your best friend. Fill in every letter you're sure of from crossing words before searching. Two known letters usually cut a long list down to a handful.</p></section>`,
  };
};
